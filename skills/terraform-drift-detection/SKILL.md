---
name: terraform-drift-detection
description: Detect and reconcile Terraform drift. Use when real infrastructure may differ from state or code, when setting up scheduled drift checks, running refresh-only plans, triaging console or out-of-band changes, and deciding whether to codify or revert them.
---

# Terraform drift detection and reconciliation

Drift = real infrastructure differs from what Terraform last recorded. Two kinds:

- **State drift**: someone changed a managed object outside Terraform (console, CLI, another tool, autoscaler).
- **Code drift**: code on the default branch was never applied, so state/infrastructure lag behind code.

A normal `terraform plan` mixes both. Separate them.

## 1. Refresh-only plan: what changed outside Terraform

```bash
terraform plan -refresh-only -out=refresh.tfplan
terraform show -json refresh.tfplan > refresh.json
```

- Shows only differences between state and reality. No changes to infrastructure.
- `terraform apply refresh.tfplan` writes the observed values into state (accepting the drift into state only; code
  still differs, so the next normal plan will try to revert it).
- Never use the deprecated `terraform refresh`: it updates state without review.

List drifted objects from the JSON:

```bash
jq -r '.resource_drift[]? | "\(.change.actions | join(","))\t\(.address)"' refresh.json
```

`delete` in `resource_drift` means the object no longer exists in the cloud.

## 2. Normal plan with detailed exit code: does code match reality

```bash
terraform plan -detailed-exitcode -input=false -lock=false -out=drift.tfplan
# 0 = no changes, 1 = error, 2 = changes present
```

Use `-lock=false` only for read-only scheduled checks where no apply follows; otherwise keep locking.

## 3. Scheduled detection

- Run a plan per root module/workspace on a schedule (e.g. nightly) with read-only credentials.
- Alert on exit code 2, include the list of drifted addresses and the plan text as an artifact.
- HCP Terraform has built-in health assessments with drift detection; use them if you're on it.
- Ignore noise deliberately: attributes legitimately managed elsewhere (autoscaler `desired_count`, tags added by
  org policy) belong in `lifecycle { ignore_changes = [...] }`, with a comment why.

GitHub Actions sketch:

```yaml
on:
  schedule: [{ cron: "0 5 * * 1-5" }]
jobs:
  drift:
    strategy:
      matrix: { dir: [network, data, services] }
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init -input=false
        working-directory: ${{ matrix.dir }}
      - id: plan
        run: terraform plan -detailed-exitcode -input=false -lock=false
        working-directory: ${{ matrix.dir }}
        continue-on-error: true
      - if: steps.plan.outcome == 'failure'
        run: echo "drift or error in ${{ matrix.dir }}" && exit 1
```

Note: with `hashicorp/setup-terraform` the wrapper exposes `steps.plan.outputs.exitcode`; check it to distinguish 2
(drift) from 1 (error).

## 4. Triage each drifted object

For each address answer: who changed it, when, why, and is the new value correct?

- Find the actor: cloud audit logs (AWS CloudTrail, GCP Cloud Audit Logs, Azure Activity Log) filtered by resource ID
  and time window since the last apply.
- Classify:

| Situation | Action |
| --- | --- |
| Emergency hotfix that should stay | Codify: update the .tf to match, plan shows no change, merge |
| Unauthorised or mistaken change | Revert: apply the normal plan (Terraform restores code values) |
| Attribute owned by another system | `ignore_changes` on that attribute |
| Object deleted out of band, should exist | Apply to recreate (check data loss first) |
| Object deleted, should not exist | Remove from code, or `removed` block / `state rm` if code is gone |
| Object created out of band, should be managed | `import` block |

- Codify rather than accept-into-state when the change is wanted: a refresh-only apply alone leaves code wrong.

## 5. Prevent recurrence

- Restrict console write access in production; use break-glass roles that alert.
- Apply only from CI from the default branch, so code drift can't build up.
- Run drift checks often enough that the audit trail is still fresh when triaging.
- Track recurring drift by attribute; recurring drift usually means a missing `ignore_changes` or a competing
  controller.

## Pitfalls

- Applying a normal plan to "fix drift" without reading it: it reverts emergency fixes and can cause outages.
- Running `apply -refresh-only` and thinking drift is resolved: the next plan will undo it unless code is updated.
- Broad `ignore_changes = all`: hides real problems. Keep the list narrow.
- Provider upgrades that change defaults show up like drift; check `.terraform.lock.hcl` changes first.
