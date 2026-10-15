---
name: kubectl-debugging
description: "Diagnose Kubernetes workloads with kubectl: describe, events, logs --previous, ephemeral debug containers, node debug and port-forward. Use when a pod, deployment or service misbehaves and you need a systematic first-pass investigation from the CLI."
---

# Diagnosing workloads with kubectl

Work from the outside in: what Kubernetes *thinks* is happening (status, conditions, events), then what the container
*says* (logs), then what is *actually* there (exec/debug, port-forward). Read before you change anything.

## 0. Establish context first

```bash
kubectl config current-context          # are you on the cluster you think?
kubectl get ns                          # namespace exists?
kubectl auth can-i --list -n <ns>       # what you're allowed to do (debug/exec may be denied)
```

Always pass `-n <ns>` (or `--context`) explicitly in commands you hand to a human; a wrong-context `delete` is the
classic on-call outage.

## 1. Find the broken object

```bash
kubectl get pods -n <ns> -o wide                        # STATUS, RESTARTS, NODE, IP
kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded
kubectl get deploy,rs,sts,ds -n <ns>                    # READY vs desired
kubectl rollout status deploy/<name> -n <ns> --timeout=60s
kubectl get pods -n <ns> -l app=<label> --sort-by=.status.startTime
```

Map the STATUS column to the next step:

| STATUS | Go to |
| --- | --- |
| `Pending` | scheduling: events on the pod; see k8s-pending-pods |
| `ContainerCreating` stuck | events: volume mount, image pull, CNI/sandbox errors |
| `CrashLoopBackOff`, `Error`, `OOMKilled` | logs --previous, lastState; see k8s-crashloop-diagnosis |
| `ErrImagePull` / `ImagePullBackOff` | events: image name, tag, registry auth |
| `Running` but not Ready | readiness probe failures in events; endpoints |
| `Terminating` stuck | finalizers, node unreachable |
| `Evicted` | node pressure; see k8s-node-troubleshooting |

## 2. Describe and events

```bash
kubectl describe pod <pod> -n <ns>      # read Conditions, State/Last State, Exit Code, Events at the bottom
kubectl get events -n <ns> --sort-by=.lastTimestamp | tail -30
kubectl get events -n <ns> --field-selector involvedObject.name=<pod>
kubectl events -n <ns> --for pod/<pod>  # newer kubectl; same idea, nicer output
```

- Events expire (default TTL 1h). If the problem is older, events are gone; rely on logs and metrics.
- For a Deployment that won't roll, describe the **ReplicaSet** too: quota and admission-webhook denials show up on the
  RS, not on a pod (because the pod was never created).

Useful jsonpath for exact facts instead of eyeballing:

```bash
kubectl get pod <pod> -n <ns> -o jsonpath='{range .status.containerStatuses[*]}{.name}{"\t"}{.restartCount}{"\t"}{.lastState.terminated.reason}{"\t"}{.lastState.terminated.exitCode}{"\n"}{end}'
kubectl get pod <pod> -n <ns> -o yaml | less    # full spec + status, includes ownerReferences
```

## 3. Logs

```bash
kubectl logs <pod> -n <ns> -c <container>            # -c required for multi-container pods
kubectl logs <pod> -n <ns> -c <container> --previous # the crashed instance: this is usually what you want
kubectl logs <pod> -n <ns> --all-containers --prefix --timestamps
kubectl logs deploy/<name> -n <ns> --since=15m       # picks one pod
kubectl logs -n <ns> -l app=<label> --max-log-requests=10 --tail=100 --prefix
kubectl logs <pod> -n <ns> -c <init-container>       # init containers have logs too
```

Empty logs on a crash usually mean the process died before writing (bad entrypoint, missing binary, exec format
error from wrong CPU architecture) or logs go to a file instead of stdout.

## 4. Get inside

Prefer `kubectl debug` over `exec` when the image is distroless or the container is crashing.

```bash
kubectl exec -it <pod> -n <ns> -c <container> -- sh

# Ephemeral container sharing the target's process namespace (needs shell-less image support)
kubectl debug -it <pod> -n <ns> --image=busybox:1.36 --target=<container>

# Copy of the pod with a different command so it stays up (for crashing containers)
kubectl debug <pod> -n <ns> -it --copy-to=<pod>-debug --container=<container> -- sh

# Node-level debugging: host filesystem mounted at /host
kubectl debug node/<node> -it --image=busybox:1.36
```

- `--profile=general|netadmin|sysadmin|baseline|restricted` controls capabilities of the debug container; use
  `netadmin` for tcpdump/iptables, `sysadmin` only when needed.
- Ephemeral containers cannot be removed from a pod; they stay listed until the pod is deleted. Debug copies
  (`--copy-to`) must be deleted by hand afterwards.
- Pod Security Admission `restricted` namespaces may reject privileged debug profiles.

## 5. Reach it directly

```bash
kubectl port-forward pod/<pod> 8080:8080 -n <ns>   # bypasses Service and Ingress
kubectl port-forward svc/<svc> 8080:80 -n <ns>     # picks ONE backing pod, not load-balanced
curl -sv localhost:8080/healthz
```

If port-forward to the pod works but the Service fails, the problem is selectors/endpoints/NetworkPolicy, not the app
(see k8s-networking-debug).

## 6. Recent changes

```bash
kubectl rollout history deploy/<name> -n <ns>
kubectl diff -f manifest.yaml                     # what would change
kubectl get rs -n <ns> -l app=<label>             # old vs new ReplicaSet images
```

Most incidents follow a change: compare the failing ReplicaSet's pod template with the previous one before
deep-diving.

## Resource usage

```bash
kubectl top pods -n <ns> --containers   # needs metrics-server
kubectl top nodes
```

## Rules

- Read-only first. Don't `delete pod` to "fix" it until you've captured describe output and `--previous` logs; the
  evidence goes with the pod.
- `kubectl rollout undo` is the fastest safe mitigation for a bad deploy; root-cause after.
- Don't edit live objects managed by GitOps (Argo CD, Flux); the controller will revert them. Change the source.
- Record exact commands and outputs in the incident notes.
