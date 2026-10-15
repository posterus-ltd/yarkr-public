---
name: k8s-pending-pods
description: "Resolve Kubernetes pods stuck in Pending: insufficient CPU/memory, taints and tolerations, node affinity and topology spread, unbound PVCs, quotas and autoscaler behaviour. Use when pods don't get scheduled or a rollout stalls with Pending replicas."
---

# Resolving Pending pods

A Pending pod has been accepted by the API server but not bound to a node (or is waiting on volumes). The scheduler
tells you why in a `FailedScheduling` event. Read that message first; everything else is confirming it.

## Step 1: read the scheduler's verdict

```bash
kubectl describe pod <pod> -n <ns> | sed -n '/Events:/,$p'
kubectl get events -n <ns> --field-selector reason=FailedScheduling --sort-by=.lastTimestamp
```

Typical message:

```
0/12 nodes are available: 3 Insufficient memory, 4 node(s) had untolerated taint {dedicated: gpu},
5 node(s) didn't match Pod's node affinity/selector. preemption: 0/12 nodes are available: ...
```

Each node is rejected for its first failing reason; the counts add up to the node total. Work through the biggest
bucket that could plausibly host the pod.

No `FailedScheduling` event at all? Then the scheduler hasn't seen it: check `spec.schedulerName` (a custom scheduler
not running), or the pod is waiting on a `schedulingGates` entry.

## Step 2: match the reason

### Insufficient cpu / memory / ephemeral-storage / pods

Scheduling uses **requests**, not actual usage.

```bash
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.containers[*].resources.requests}'
kubectl describe nodes | grep -A8 'Allocated resources'
kubectl get nodes -o custom-columns=NAME:.metadata.name,CPU:.status.allocatable.cpu,MEM:.status.allocatable.memory,PODS:.status.allocatable.pods
```

- Request bigger than any node's *allocatable* (not capacity) = never schedulable. Lower the request or add a larger
  node pool.
- Cluster full: scale out, or check whether the Cluster Autoscaler / Karpenter is acting (step 3).
- `Too many pods`: node hit max-pods (on AWS VPC CNI this is tied to ENI/IP limits).
- Don't fix by removing requests; pods with no requests overcommit nodes and get evicted first.

### Untolerated taint

```bash
kubectl get nodes -o custom-columns=NAME:.metadata.name,TAINTS:.spec.taints
```

- Add a matching `toleration` only if the pod truly belongs on those nodes. A toleration *allows*, it does not
  *attract*; pair it with nodeSelector/affinity to target dedicated nodes.
- `node.kubernetes.io/not-ready`, `unreachable`, `disk-pressure`, `memory-pressure`, `unschedulable` taints mean the
  nodes are unhealthy or cordoned; see k8s-node-troubleshooting.

### Node affinity / selector mismatch

```bash
kubectl get pod <pod> -n <ns> -o jsonpath='{.spec.nodeSelector}{"\n"}{.spec.affinity}'
kubectl get nodes --show-labels | tr ',' '\n' | grep <key>
```

Typos in labels, zone labels (`topology.kubernetes.io/zone`) pointing at a zone with no nodes, and
`requiredDuringScheduling...` where `preferred...` was meant.

### Pod anti-affinity / topology spread

`didn't match pod anti-affinity rules` or `didn't match pod topology spread constraints`.

- Required anti-affinity on hostname with more replicas than nodes leaves the extras Pending forever.
- `topologySpreadConstraints` with `whenUnsatisfiable: DoNotSchedule` and `maxSkew: 1` blocks when one zone has no
  capacity. Use `ScheduleAnyway` unless strict spread is a hard requirement.

### Volume problems

`pod has unbound immediate PersistentVolumeClaims` or `volume node affinity conflict`.

```bash
kubectl get pvc -n <ns>
kubectl describe pvc <pvc> -n <ns>
kubectl get storageclass
```

- PVC Pending: no default StorageClass, wrong `storageClassName`, CSI driver not installed or failing (check its
  controller pod logs), or quota on the cloud side.
- `WaitForFirstConsumer` binding is normal: the PVC stays Pending until the pod schedules. Look at the pod's reason
  instead.
- Volume node affinity conflict: an existing zonal disk (EBS, PD) lives in zone A, the pod can only go to zone B.
  StatefulSet pods are pinned to their volume's zone; ensure node capacity there.

### Quota and admission

Pods that fail quota are never created, so there's no Pending pod: look at the ReplicaSet/StatefulSet events.

```bash
kubectl describe rs <rs> -n <ns>     # "exceeded quota" / webhook denials
kubectl describe resourcequota -n <ns>
kubectl get limitrange -n <ns> -o yaml
```

### Preemption and priority

Low-priority pods may wait while higher-priority ones hold capacity. Check `priorityClassName` and whether the event
mentions preemption candidates.

## Step 3: autoscaling

```bash
kubectl get events -A --field-selector reason=TriggeredScaleUp
kubectl get events -A --field-selector reason=NotTriggerScaleUp
kubectl -n kube-system logs deploy/cluster-autoscaler --tail=200   # if used
kubectl get nodeclaims                                              # Karpenter
```

`NotTriggerScaleUp` means no node group could fit the pod even if added: the pod's constraints (selector, taint,
size, zone) match no node group template, or the group is at its max size.

## Fix checklist

1. State the scheduler message and which bucket you're addressing.
2. Prefer adjusting the workload (requests, tolerations, spread) if it's misconfigured; adjust capacity if it's right.
3. After the change, confirm with `kubectl get pod -w` and that no new `FailedScheduling` events appear.

## Pitfalls

- Describing the node shows *allocated requests*; `kubectl top` shows *usage*. Scheduling only cares about the former.
- DaemonSet pods consume allocatable on every node; small nodes may have little left.
- A cordoned node (`SchedulingDisabled`) during an upgrade looks like missing capacity.
