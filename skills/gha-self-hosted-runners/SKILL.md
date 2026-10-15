---
name: gha-self-hosted-runners
description: Run GitHub Actions self-hosted runners safely - ephemeral VMs, Actions Runner Controller (runner scale sets) on Kubernetes, labels and runner groups, autoscaling and hardening. Use when setting up or debugging self-hosted runners, jobs stuck "waiting for a runner", ARC installs, or deciding between self-hosted and larger hosted runners.
---

# Self-hosted runners and Actions Runner Controller

## First decide if you need them

Self-hosted is worth it for: private network access (VPC databases, on-prem), special hardware (GPU, ARM, big RAM),
very heavy builds with warm caches, or cost at high volume. Otherwise GitHub-hosted larger runners (with static IPs or
Azure private networking on eligible plans) avoid the operational and security burden.

## Security rules (non-negotiable)

- **Ephemeral runners only**: one job per runner, then destroy (`./config.sh --ephemeral`, or ARC which is ephemeral
  by design). Persistent runners leak state, credentials and malware between jobs.
- **Never attach self-hosted runners to public repos**: anyone can open a PR that runs code on them. If unavoidable,
  require approval for all outside collaborators and use isolated, ephemeral runners with no network reach.
- Restrict with **runner groups**: limit which repos (and optionally which workflows) can use a group. Default
  group access for new repos should be off.
- Run as non-root; no Docker socket mounted from the host. If jobs need Docker, use rootless/DinD in an isolated
  pod or VM.
- Give runners only the network access the jobs need; deny cloud metadata endpoints (`169.254.169.254`) unless
  required, and use OIDC for cloud credentials instead of instance roles shared across repos.
- Keep runner software current: GitHub refuses connections from runner versions that are too old.

## Labels and targeting

```yaml
runs-on: [self-hosted, linux, x64, gpu]       # all labels must match
# or with ARC scale sets: the installation name is the label
runs-on: arc-linux-large
# or by group
runs-on:
  group: prod-deployers
  labels: [linux]
```

Default labels: `self-hosted`, OS (`linux`, `windows`, `macOS`) and arch (`x64`, `ARM64`). Add custom labels at
registration (`--labels gpu,cuda12`). Jobs queue until a matching online runner exists; a typo waits until the
24-hour queue limit.

## Plain VM runner (registration basics)

```bash
./config.sh --url https://github.com/acme --token "$REG_TOKEN" \
  --name "$(hostname)" --labels linux-large --runnergroup builders --ephemeral --unattended
./run.sh
```

- Registration tokens expire after one hour; mint them from a GitHub App via
  `POST /orgs/{org}/actions/runners/registration-token` (or use JIT config: `.../runners/generate-jitconfig`).
- Prefer org-level runners over repo-level; manage access with groups.
- Autoscale VMs from `workflow_job` webhooks (queued -> create, completed -> destroy) or use ARC.

## Actions Runner Controller (runner scale sets)

The current, GitHub-supported mode is **runner scale sets** (Helm charts `gha-runner-scale-set-controller` and
`gha-runner-scale-set`). The older community "summerwind" mode (`RunnerDeployment`, `HorizontalRunnerAutoscaler`) is
legacy; migrate off it.

```bash
helm install arc --namespace arc-systems --create-namespace \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set-controller

helm install arc-linux-large --namespace arc-runners --create-namespace \
  --set githubConfigUrl="https://github.com/acme" \
  --set githubConfigSecret=arc-github-app \
  --set minRunners=1 --set maxRunners=30 \
  oci://ghcr.io/actions/actions-runner-controller-charts/gha-runner-scale-set
```

- Authenticate with a **GitHub App** (secret with `github_app_id`, `github_app_installation_id`,
  `github_app_private_key`), not a PAT.
- The Helm release name is the `runs-on` label. One scale set per runner shape (size, arch, container mode).
- Install controller and scale-set charts at the **same version**; upgrade the controller first, and uninstall
  scale sets before major controller upgrades as the docs require.
- Scaling: the listener long-polls GitHub for jobs and sizes the `EphemeralRunnerSet` between `minRunners` and
  `maxRunners`. `minRunners > 0` keeps warm runners to cut pod start latency.
- Container mode:
  - `containerMode.type=dind`: Docker-in-Docker sidecar (privileged). Simplest for `docker build` and `container:` jobs.
  - `containerMode.type=kubernetes`: job containers run as separate pods via container hooks; needs a RWX/ephemeral
    work volume; no privileged sidecar. `docker build` needs another tool (BuildKit rootless, Kaniko-style builders).
  - Default (neither): runner pod only, no Docker.
- Customize the pod via `template.spec` (resources, nodeSelector, tolerations, image). Always set resource requests
  and limits; put runners on a dedicated node pool with a taint.
- Use a custom runner image (FROM `ghcr.io/actions/actions-runner`) with your toolchain preinstalled; hosted-runner
  images are not reproduced, so workflows that assume preinstalled tools will fail.

## Debugging "Waiting for a runner to pick up this job"

1. Labels: do `runs-on` labels exactly match an online runner or scale-set name? Check Settings > Actions > Runners.
2. Access: is the repo (and workflow) allowed in the runner group?
3. ARC: `kubectl get pods -n arc-systems` (controller + listener must be running);
   `kubectl logs -n arc-systems -l app.kubernetes.io/component=runner-scale-set-listener`;
   `kubectl get ephemeralrunners -n arc-runners`; describe pending runner pods for scheduling issues.
4. At `maxRunners`? Jobs queue until a slot frees.
5. Auth: listener logs showing 401/403 mean the GitHub App key, installation or permissions are wrong
   (needs Administration read/write on repos for repo-level, or Self-hosted runners read/write at org level).
6. Network: runners need outbound HTTPS to GitHub (`github.com`, `api.github.com`, `*.actions.githubusercontent.com`,
   and artifact/cache storage hosts). Check the documented allowlist when behind a proxy or firewall.

## Operations checklist

- [ ] Ephemeral runners, one job each
- [ ] GitHub App auth; secrets in a secret manager, not in Helm values files
- [ ] Runner groups restrict repos; public repos excluded
- [ ] Dedicated nodes with taints, resource limits, egress policy
- [ ] Custom runner image versioned and rebuilt regularly
- [ ] Alerts on queue time (`workflow_job` queued -> in_progress latency) and failed pod starts
- [ ] Controller and scale-set charts upgraded together on a schedule
