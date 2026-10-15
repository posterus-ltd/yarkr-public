---
name: k8s-node-troubleshooting
description: "Investigate Kubernetes node problems: NotReady nodes, disk, memory and PID pressure, kubelet and container runtime logs, evictions, and safe cordon/drain. Use when nodes go NotReady, pods are Evicted, or a node must be drained or replaced."
---

# Troubleshooting Kubernetes nodes

Node problems show up second-hand: pods Evicted, Terminating forever, or Pending because capacity vanished. Confirm
the node's own view (conditions), then the kubelet's (logs), then decide: fix in place, or cordon, drain and replace.

## Step 1: node status and conditions

```bash
kubectl get nodes -o wide
kubectl describe node <node>          # Conditions, Taints, Allocated resources, Events
kubectl get node <node> -o jsonpath='{range .status.conditions[*]}{.type}={.status} {.reason}: {.message}{"\n"}{end}'
```

| Condition | True means |
| --- | --- |
| `Ready=False` | kubelet reports unhealthy (runtime down, network plugin not ready) |
| `Ready=Unknown` | control plane hasn't heard from kubelet (node down, kubelet dead, network partition) |
| `MemoryPressure` | available memory below eviction threshold |
| `DiskPressure` | nodefs or imagefs free space/inodes below threshold |
| `PIDPressure` | too many processes |

The node controller adds matching taints (`node.kubernetes.io/not-ready`, `unreachable`, `disk-pressure`, ...).
Pods without tolerations are evicted from an unreachable node after `tolerationSeconds` (default 300s).

## Step 2: get on the node

```bash
kubectl debug node/<node> -it --image=busybox:1.36   # host filesystem at /host
# then: chroot /host  (if the host has a shell), or use cloud SSH / SSM / serial console
```

If the node is `Unknown`, `kubectl debug` will not work (kubelet unreachable): use the cloud console, serial log or
SSM/SSH.

On the node:

```bash
systemctl status kubelet containerd
journalctl -u kubelet --since "30 min ago" --no-pager | tail -200
journalctl -u containerd --since "30 min ago" --no-pager | tail -100
crictl ps -a                    # containers as the runtime sees them
crictl pods
df -h; df -i                    # space and inodes on / and /var/lib/containerd (or imagefs)
free -m; dmesg -T | grep -i -E 'oom|killed process|xfs|ext4|nvme|i/o error' | tail
```

## Step 3: match the symptom

### NotReady

Kubelet log keywords and what they mean:

- `container runtime is down` / `failed to get runtime status`: containerd crashed or hung; restart it and check why.
- `network plugin is not ready: cni config uninitialized`: CNI DaemonSet pod not running on this node; check
  `kubectl get pods -n kube-system -o wide --field-selector spec.nodeName=<node>`.
- `certificate has expired` / `Unauthorized`: kubelet client cert rotation failed; check clock skew (`timedatectl`)
  and the CSR approval (`kubectl get csr`).
- `PLEG is not healthy`: runtime too slow to list containers, often from disk I/O saturation or too many containers.
- Kubelet itself OOM-killed: insufficient `kube-reserved`/`system-reserved` on the node.

### DiskPressure

- Usual culprits: container logs, unused images, emptyDir volumes, a pod writing to its writable layer.
- Kubelet garbage-collects images at `imageGCHighThresholdPercent` (default 85%); pressure means GC can't keep up.
- `crictl rmi --prune` removes unused images. Find big pod dirs under `/var/lib/kubelet/pods/*/volumes`.
- Set `resources.limits.ephemeral-storage` on workloads that write to disk so they get evicted individually instead
  of starving the node.

### MemoryPressure and evictions

```bash
kubectl get pods -A --field-selector=status.phase=Failed | grep Evicted
kubectl get pod <evicted-pod> -n <ns> -o jsonpath='{.status.message}'
```

- Eviction order: pods exceeding requests first, ordered by priority then by usage over request. BestEffort pods (no
  requests) go first.
- Memory pressure from many pods with low requests and high real usage: set realistic requests; overcommit is the
  root cause.
- Evicted pods remain as Failed objects; they are cleaned up by the pod GC threshold, or delete them explicitly.

### Pods stuck Terminating on a dead node

The kubelet can't confirm deletion. If the node is truly gone (VM terminated), delete the Node object and the pods are
cleaned up. Only use `kubectl delete pod --grace-period=0 --force` when you're sure the node is down: forcing a
StatefulSet pod while the old one still runs can cause two writers on the same volume.

## Step 4: cordon and drain

```bash
kubectl cordon <node>
kubectl drain <node> --ignore-daemonsets --delete-emptydir-data --timeout=10m
```

- Drain respects PodDisruptionBudgets; if it hangs on `Cannot evict pod as it would violate the pod's disruption
  budget`, check `kubectl get pdb -A` for budgets with `ALLOWED DISRUPTIONS 0` (often single-replica deployments with
  `minAvailable: 1`). Scale the workload up or coordinate with its owner; don't delete the PDB blindly.
- `--delete-emptydir-data` loses emptyDir contents; confirm that's acceptable.
- Pods not managed by a controller block drain unless `--force` is given, and they won't come back.
- After repair, `kubectl uncordon <node>`. On managed node groups/Karpenter, replacing the node is often faster than
  repairing it.

## Step 5: cluster-wide view

If many nodes fail at once, suspect a shared cause: control-plane or API server connectivity, a bad node image or
kernel rollout, a CNI or CSI DaemonSet upgrade, expired certificates, or a cloud zone incident. Compare `kubectl get
nodes -L topology.kubernetes.io/zone,node.kubernetes.io/instance-type` to spot a pattern.

## Pitfalls

- Restarting kubelet clears the symptom but loses the evidence; grab `journalctl` output first.
- Don't delete a Node object for a node that is still running workloads; it can come back with conflicts.
- Clean up `node-debugger-*` pods left by `kubectl debug node/`.

## Output

Report: node, conditions, evidence from kubelet/runtime logs, root cause, action taken (fixed in place, drained,
replaced) and whether workloads rescheduled cleanly.
