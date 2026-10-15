---
name: terraform-plan-reading
description: Read Terraform/OpenTofu plans critically before apply. Use when reviewing `terraform plan` output or plan JSON in a PR or pipeline, spotting replacements, forced-new attributes, unknown values, deletions, and risky diffs to data stores, IAM and networking.
---

# Reading Terraform plans critically

A plan is a proposal, not a guarantee. Your job is to find the few lines that can cause an outage or data loss and to
explain *why* Terraform wants to do them.

## 1. Get a plan you can analyse

```bash
terraform plan -out=tfplan -input=false -lock-timeout=5m
terraform show -no-color tfplan > plan.txt          # human-readable
terraform show -json tfplan > plan.json             # machine-readable, use this for counting and filtering
```

Always review the saved plan file that will be applied (`terraform apply tfplan`), not a fresh plan run later.

## 2. Triage with the JSON

```bash
# Every resource whose actions are not just no-op/read
jq -r '.resource_changes[] | select(.change.actions != ["no-op"] and .change.actions != ["read"])
  | "\(.change.actions | join(","))\t\(.address)"' plan.json | sort

# Deletes and replacements only
jq -r '.resource_changes[] | select(.change.actions | index("delete"))
  | "\(.change.actions | join(","))\t\(.address)"' plan.json

# Which attributes force replacement
jq -r '.resource_changes[] | select(.change.replace_paths != null)
  | "\(.address): \(.change.replace_paths)"' plan.json

# Why each change happens (replace_triggered_by, tainted, etc.)
jq -r '.resource_changes[] | select(.action_reason != null) | "\(.address): \(.action_reason)"' plan.json
```

Action symbols in the text plan:

| Symbol | Meaning | Risk |
| --- | --- | --- |
| `+` | create | Low, but check quotas and name collisions |
| `~` | update in place | Depends on attribute; some in-place updates still restart (e.g. instance type) |
| `-` | destroy | High: confirm intent |
| `-/+` | destroy then create | High: downtime and data loss for stateful resources |
| `+/-` | create then destroy (`create_before_destroy`) | Medium: name/unique-constraint collisions |
| `<=` | data source read during apply | Values unknown at plan time |

## 3. Red flags checklist

Stop and require explanation for any of these:

- **Replacement of a stateful resource**: databases, disks/volumes, buckets, file systems, KMS keys, DNS zones,
  queues, caches, clusters. Look for `# forces replacement` next to the attribute.
- **Deletion count larger than expected.** A reviewer should be able to say exactly why each delete is there.
- **Mass changes from a single cause**: a renamed `for_each` key, a changed `count`, a module source change, or a
  provider upgrade. These show as N destroys + N creates of the same type at shifted addresses. Fix with `moved` blocks
  instead of accepting them.
- **IAM / security changes**: policies widening (`*` actions or principals), security groups opening `0.0.0.0/0` or
  `::/0`, public access blocks removed, encryption disabled, deletion protection turned off.
- **`(known after apply)` on identifiers** that other resources depend on: a changing ID upstream cascades
  replacements downstream.
- **Sensitive values** shown as `(sensitive value)` changing: secrets rotated or overwritten unexpectedly.
- **`prevent_destroy`, `deletion_protection`, `skip_final_snapshot`** being flipped in the same change as a destroy.
- **Changes outside the PR's scope**: drift being "fixed" or reverted as a side effect. Check
  "Objects have changed outside of Terraform" at the top of the plan.
- **Provider or module version bumps** in `.terraform.lock.hcl` or `source`/`version` with unexplained diffs.

## 4. Explain the cause of each risky change

For each red flag answer: which code change caused it, is it intended, and what's the blast radius.

- Diff the code (`git diff main -- '*.tf'`) and map each changed line to plan entries.
- Forced replacement: identify the immutable attribute (e.g. `availability_zone`, `engine`, `name` on many resources)
  and check whether the provider docs mark it ForceNew.
- Address shift (`aws_x.this[0]` → `aws_x.this["a"]`): refactor, should be a `moved` block.
- Unexpected in-place updates on untouched resources: usually provider default changes or drift; read the
  refresh section.
- `replace_triggered_by` or tainted resources: shows up in `action_reason`.

## 5. Safer alternatives to suggest

| Problem | Safer path |
| --- | --- |
| Rename/re-key causes destroy+create | `moved { from = ... to = ... }` |
| Need to stop managing without deleting | `removed { from = ... lifecycle { destroy = false } }` |
| Forced replacement of stateful resource | Change the attribute out of band, or snapshot + migration plan, or `lifecycle { ignore_changes = [...] }` only with justification |
| Replacement causes downtime | `create_before_destroy = true` when names allow it |
| Plan touches too much | Split the PR; use `-target` only for emergencies, never as routine |

## 6. Write the verdict

```
Plan summary: X to add, Y to change, Z to destroy (N replacements)
Blocking:
- <address>: <action> because <cause>. Risk: <impact>. Fix: <suggestion>.
Needs confirmation:
- ...
Benign:
- <count> tag-only / description-only updates.
Verdict: SAFE TO APPLY | APPLY WITH CONDITIONS | DO NOT APPLY
```

## Pitfalls

- Reading only the summary line. Replacements count in both "to add" and "to destroy", so a "3 to destroy" may be
  three replaced databases rather than three intended deletions. Always list replacements explicitly.
- Trusting a plan that was generated against a different workspace, var file, or provider version than apply will use.
- Approving huge plans by skimming. If you can't review it, ask for it to be split.
- Ignoring the "changes outside of Terraform" block: applying will revert those changes.
- Assuming `~` is harmless: some in-place updates reboot instances or briefly drop connections.
