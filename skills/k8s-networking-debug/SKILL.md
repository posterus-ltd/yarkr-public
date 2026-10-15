---
name: k8s-networking-debug
description: "Debug Kubernetes networking layer by layer: Service selectors and EndpointSlices, CoreDNS resolution, kube-proxy/iptables, NetworkPolicy drops and Ingress or Gateway routing. Use when a pod can't reach a Service, DNS fails, or traffic through an ingress returns 502/503/504."
---

# Debugging Kubernetes networking

Walk the path one hop at a time and test each hop from the right place. Most "network" problems are a Service whose
selector matches nothing, a pod that isn't Ready, or a NetworkPolicy.

```
client pod ─DNS─▶ Service ClusterIP ─kube-proxy/eBPF─▶ EndpointSlice ─▶ pod IP:targetPort
external ─▶ LB ─▶ Ingress/Gateway controller ─▶ Service ─▶ pods
```

## Get a test client

```bash
kubectl run nettest -n <ns> --rm -it --image=nicolaka/netshoot -- bash
# or attach to the failing pod's network namespace:
kubectl debug -it <pod> -n <ns> --image=nicolaka/netshoot --target=<container> --profile=netadmin
```

Test from the **same namespace** as the real client: NetworkPolicies and DNS search paths depend on it.

## Hop 1: is the backend itself healthy?

```bash
kubectl get pods -n <ns> -l <selector> -o wide       # Ready column must be 1/1
curl -sv http://<pod-ip>:<containerPort>/healthz     # from the test pod
```

If the pod IP doesn't answer, it's the app (wrong port, listening on 127.0.0.1 instead of 0.0.0.0) or a policy.

## Hop 2: Service and endpoints

```bash
kubectl get svc <svc> -n <ns> -o wide
kubectl get endpointslices -n <ns> -l kubernetes.io/service-name=<svc> -o wide
kubectl describe svc <svc> -n <ns>
```

- **No endpoints**: Service `selector` doesn't match pod labels (compare exactly), or pods aren't Ready (readiness
  probe failing). Not-ready addresses appear with `ready: false`.
- **Wrong port**: `targetPort` must match the container's listening port (number or named port). `port` is what
  clients use.
- Headless Service (`clusterIP: None`) returns pod IPs from DNS, no load balancing.
- `externalTrafficPolicy: Local` on NodePort/LoadBalancer drops traffic on nodes without a local backend pod; the LB
  health check should exclude them.

## Hop 3: DNS

```bash
nslookup <svc>                                   # same namespace
nslookup <svc>.<ns>.svc.cluster.local
cat /etc/resolv.conf                             # search domains, ndots:5
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=100
```

- Cross-namespace calls need `<svc>.<ns>`; a bare name only resolves in the client's namespace.
- `ndots:5` makes external names (`api.example.com`) try every search domain first: slow lookups, and timeouts if
  any upstream misbehaves. Use FQDNs with a trailing dot or lower `ndots` via `dnsConfig`.
- Intermittent 5s DNS delays: conntrack races on UDP; NodeLocal DNSCache is the standard fix.
- Check the CoreDNS ConfigMap (`kubectl get cm coredns -n kube-system -o yaml`) for broken `forward` or stub domains.

## Hop 4: ClusterIP routing (kube-proxy / eBPF)

If pod IP works, DNS resolves, but ClusterIP doesn't:

```bash
kubectl get pods -n kube-system -l k8s-app=kube-proxy     # running on the client's node?
kubectl logs -n kube-system <kube-proxy-pod> --tail=100
# on the node (kubectl debug node/<node>):
iptables-save | grep <cluster-ip>      # iptables mode
ipvsadm -Ln | grep -A3 <cluster-ip>    # ipvs mode
```

With Cilium kube-proxy replacement, use `cilium service list` and `cilium-dbg monitor --type drop` from the Cilium
agent pod instead. Note: ClusterIPs don't answer ping; test with TCP.

## Hop 5: NetworkPolicy

```bash
kubectl get networkpolicy -n <ns>
kubectl describe networkpolicy <np> -n <ns>
```

Rules to remember:

- Once any policy selects a pod for `Ingress` (or `Egress`), everything not explicitly allowed in that direction is
  denied.
- A default-deny **egress** policy also blocks DNS. Allow UDP and TCP 53 to kube-dns pods in kube-system.
- `namespaceSelector` matches namespace **labels** (`kubernetes.io/metadata.name: <ns>` is set automatically).
- `podSelector` and `namespaceSelector` in the same `from` item are AND; in separate items they are OR. A stray dash
  changes the meaning.
- Policies are enforced by the CNI. On a CNI without policy support they silently do nothing.
- Cilium: `hubble observe --verdict DROPPED -n <ns>` shows which policy dropped what. Calico: check
  `calicoctl` / flow logs if enabled.

## Hop 6: Ingress / Gateway

```bash
kubectl get ingress -n <ns> -o wide
kubectl describe ingress <ing> -n <ns>
kubectl get gateway,httproute -A                 # Gateway API
kubectl describe httproute <route> -n <ns>       # check status.parents conditions: Accepted, ResolvedRefs
kubectl logs -n <controller-ns> deploy/<controller> --tail=200
```

| Symptom | Usual cause |
| --- | --- |
| 404 from the controller | host/path doesn't match any rule; wrong `ingressClassName` |
| 502 | backend refused/reset: wrong service port, app not listening, protocol mismatch (HTTP vs HTTPS backend) |
| 503 | no ready endpoints behind the Service |
| 504 | backend slow; controller timeout shorter than the request |
| TLS errors | secret missing or in wrong namespace; cert doesn't cover the host |

Bypass layers to isolate: `kubectl port-forward svc/<svc>` (skips ingress), then hit the controller's Service
directly with `curl -H 'Host: app.example.com'`.

## Pitfalls

- Testing from your laptop through port-forward skips DNS, ClusterIP routing and NetworkPolicy; it only proves the
  app works.
- Service mesh sidecars (Istio, Linkerd) add mTLS and their own routing; check proxy status and policies if injected.
- Pod CIDR exhaustion or a CNI failure shows as pods stuck in ContainerCreating with `FailedCreatePodSandBox`, not as
  connectivity errors.
- Clean up `nettest` pods and debug copies when done.

## Output

Report the hop where traffic stops, the evidence (command + output), the cause and the fix.
