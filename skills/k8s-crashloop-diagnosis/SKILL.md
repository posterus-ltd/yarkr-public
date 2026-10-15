---
name: k8s-crashloop-diagnosis
description: Diagnose CrashLoopBackOff, ImagePullBackOff, CreateContainerConfigError and OOMKilled pods step by step from exit codes, previous logs and events. Use when pods keep restarting, fail to start, or get killed for memory.
---

# Diagnosing crashing and non-starting pods

CrashLoopBackOff is not a cause, it's Kubernetes backing off restarts (10s doubling to 5m). Find *why the container
exits*. The exit code and the previous container's logs answer that in most cases.

## Step 1: collect the facts

```bash
kubectl get pod <pod> -n <ns> -o wide
kubectl describe pod <pod> -n <ns>
kubectl get pod <pod> -n <ns> -o jsonpath='{range .status.containerStatuses[*]}{.name} restarts={.restartCount} reason={.lastState.terminated.reason} exit={.lastState.terminated.exitCode} waiting={.state.waiting.reason}{"\n"}{end}'
kubectl logs <pod> -n <ns> -c <container> --previous --tail=200
```

Check init containers too (`.status.initContainerStatuses`): a pod shown as `Init:CrashLoopBackOff` is failing in an
init container, not the main one.

## Step 2: read the exit code

| Exit / reason | Meaning | Look at |
| --- | --- | --- |
| `0` / Completed | process exited normally, but restartPolicy Always restarts it | app is a one-shot job or daemonizes (forks to background); run in foreground or use a Job |
| `1`, `2` | app error | `--previous` logs: config parse, missing env, failed DB connection, migrations |
| `126` | command not executable | permissions, wrong file, `noexec` mount |
| `127` | command not found | wrong `command`/`args`, missing binary, shell not in distroless image |
| `128+n` | killed by signal n | `137` = SIGKILL, `143` = SIGTERM, `139` = SIGSEGV, `134` = SIGABRT |
| `137` + `OOMKilled` | container hit memory limit | step 3 |
| `137` without OOMKilled | killed by kubelet: liveness probe failure, or failed graceful shutdown | probe events |
| `exec format error` in logs | image built for wrong CPU arch (arm64 vs amd64) | image manifest platforms |

## Step 3: OOMKilled

```bash
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources}'
kubectl top pod <pod> -n <ns> --containers
```

- `OOMKilled` in lastState = cgroup limit hit. Raise `resources.limits.memory` or fix the leak; don't just remove the
  limit.
- Runtimes that size heaps from host memory: set JVM `-XX:MaxRAMPercentage=75` (modern JVMs are container-aware),
  Node `--max-old-space-size` below the limit, Go `GOMEMLIMIT` roughly 90% of the limit.
- Memory growing steadily until kill = leak; spike at startup = cache warmup or too many workers per pod.
- If the node itself ran out of memory, the pod may be **Evicted** instead (different problem: node pressure).

## Step 4: liveness probe kills

Events show `Liveness probe failed: ...` followed by `Container ... failed liveness probe, will be restarted`.

- Slow-starting app killed before it's up: add a `startupProbe` (e.g. `failureThreshold: 30, periodSeconds: 10`)
  instead of inflating `initialDelaySeconds`.
- Liveness checking dependencies (DB, downstream APIs) causes cascading restarts. Liveness should only check the
  process itself; dependency checks belong in readiness.
- Probe hitting the wrong port/path, or `timeoutSeconds: 1` too short under load.

## Step 5: won't even start

| Waiting reason | Cause | Fix |
| --- | --- | --- |
| `ErrImagePull` / `ImagePullBackOff` | wrong name/tag, private registry without `imagePullSecrets`, rate limit (Docker Hub), arch missing | event message has the registry error; `kubectl get secret <s> -o yaml`; verify the tag exists |
| `CreateContainerConfigError` | referenced ConfigMap/Secret or key missing | `kubectl get cm,secret -n <ns>`; check `envFrom`/`valueFrom` keys |
| `CreateContainerError` | runtime-level failure (bad mount, name conflict) | events, node containerd logs |
| `RunContainerError` | entrypoint/command failed at exec | `command`/`args`, securityContext (e.g. `runAsNonRoot` with a root-only image) |
| `ContainerCreating` stuck | volume attach/mount, CNI sandbox error | events: `FailedMount`, `FailedAttachVolume`, `FailedCreatePodSandBox` |

Registry auth check from outside the cluster: `crane manifest <image>` or `docker manifest inspect <image>` using the
same credentials.

## Step 6: reproduce interactively

When logs are empty or unclear, keep the container alive and run the entrypoint yourself:

```bash
kubectl debug <pod> -n <ns> -it --copy-to=<pod>-debug --container=<container> -- sh
# inside: env | sort; ls -la /app; cat /etc/config/...; then run the original command by hand
kubectl delete pod <pod>-debug -n <ns>   # clean up afterwards
```

Compare what the copy sees (env, mounted files, user ID, writable paths) with what the app expects. Common finds:
read-only root filesystem with an app that writes to `/tmp` (add an `emptyDir`), non-root user without permission on
mounted volumes (`fsGroup`), missing env var.

## Step 7: correlate with change

```bash
kubectl rollout history deploy/<name> -n <ns>
kubectl get rs -n <ns> -l app=<label> -o custom-columns=NAME:.metadata.name,IMAGE:.spec.template.spec.containers[*].image,READY:.status.readyReplicas
```

If the old ReplicaSet is healthy and the new one crashes, `kubectl rollout undo deploy/<name> -n <ns>` mitigates
while you investigate the diff.

## Pitfalls

- Reading `kubectl logs` without `--previous` on a restarting pod shows the *new* instance, often with nothing useful.
- Deleting the pod resets restartCount and destroys the evidence. Capture first.
- Exit code 137 is not always OOM; check the `reason` field.
- A dependency outage (DB down) crashlooping every replica is not an app bug; check dependencies before rollback.
- Sidecars (service mesh proxies) can fail independently; check every container status, not only the app.

## Output

Report: pod, container, exit code/reason, evidence (log lines, events), root cause, the fix, and whether it's mitigated
(rollback) or resolved.
