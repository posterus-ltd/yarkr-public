---
name: terraform-state-management
description: Manage Terraform state safely. Use when choosing or migrating remote backends, dealing with state locks, running state mv/rm/import, recovering from corrupted or lost state, or splitting a large state into smaller root modules.
---

# Terraform state management

State maps addresses in code to real objects. Every state operation can make Terraform forget or duplicate
infrastructure, so: back up first, prefer declarative blocks over CLI commands, and verify with a plan afterwards.

## Backends

- Always use a remote backend with locking for shared code. Common choices:
  - `s3` with `use_lockfile = true` (native S3 locking, Terraform 1.10+); DynamoDB locking is deprecated in favour of it.
  - `gcs` (locks built in), `azurerm` (blob lease locking), HCP Terraform / Terraform Enterprise (`cloud` block).
- Enable versioning on the bucket/container: it is your backup of last resort.
- Encrypt at rest and restrict access; state contains secrets in plain text.
- Keep backend config partial and pass environment-specific values at init:

```hcl
terraform {
  backend "s3" {
    key          = "network/terraform.tfstate"
    use_lockfile = true
    encrypt      = true
  }
}
```

```bash
terraform init -backend-config=env/prod.s3.tfbackend
```

### Migrating backends

```bash
terraform state pull > pre-migration.tfstate   # backup
# edit backend block
terraform init -migrate-state                 # copies state to the new backend
terraform plan                                # must show no changes
```

Use `-reconfigure` only when you deliberately want to ignore existing state (e.g. pointing at an already-migrated
backend).

## Locks

- A lock error shows a lock ID, who holds it and since when. First confirm no apply is still running (CI job,
  colleague).
- Only then: `terraform force-unlock <LOCK_ID>`. Never force-unlock a lock held by a running process.
- Use `-lock-timeout=5m` in CI so concurrent jobs wait instead of failing.

## Inspecting state

```bash
terraform state list                       # all addresses
terraform state list 'module.vpc'          # filter by prefix
terraform state show 'aws_instance.web[0]' # attributes of one object
terraform state pull | jq '.serial, .lineage'
```

## Changing state: prefer config blocks

| Goal | Prefer (reviewed in plan) | CLI fallback |
| --- | --- | --- |
| Rename / move address | `moved {}` block | `terraform state mv` |
| Adopt existing object | `import { to = ... id = ... }` block | `terraform import` |
| Stop managing, keep object | `removed { from = ... lifecycle { destroy = false } }` | `terraform state rm` |
| Force recreation | `terraform apply -replace=ADDR` | `terraform taint` (deprecated) |

Config blocks go through plan, show in review, and work in HCP Terraform. CLI commands mutate state immediately and
leave no trail in code.

### Import blocks

```hcl
import {
  to = aws_s3_bucket.logs
  id = "acme-prod-logs"
}
```

```bash
terraform plan -generate-config-out=generated.tf   # drafts resource config for un-written imports
```

Review and clean the generated config (remove computed/default attributes) before committing. `import` blocks support
`for_each` (1.7+) for bulk imports.

## CLI surgery protocol

When you must use `state mv` / `state rm`:

1. Announce a freeze: no applies on this state.
2. `terraform state pull > backup-$(date +%Y%m%d%H%M%S).tfstate`
3. Run commands one at a time; prefer `-dry-run` where supported (`state mv -dry-run`, `state rm -dry-run`).
4. `terraform plan` must show only the intended changes (ideally none).
5. Keep the backup until the next successful apply.

Cross-state moves (between root modules):

```bash
terraform state mv -state=src.tfstate -state-out=dst.tfstate ADDR ADDR   # on pulled local copies
terraform state push dst.tfstate                                         # careful: serial/lineage checks
```

An alternative that avoids `state push`: `removed` with `destroy = false` in the source config, `import` block in the
destination config, apply both.

## Splitting large states

Signs: plans take minutes, unrelated teams block each other, blast radius too big.

1. Draw boundaries by lifecycle and ownership (network, data, compute, per service), not by resource type.
2. Create the new root module with its backend.
3. In the new root: `import` blocks for each object. In the old root: `removed { lifecycle { destroy = false } }`.
4. Apply new root first (imports), then old root (removals). Both plans must show no create/destroy of real objects.
5. Replace cross-references with outputs + `terraform_remote_state` or, better, data sources / a parameter store.

## Recovery

- Corrupted/bad state: restore a previous object version from the bucket, or `terraform state push backup.tfstate`
  (bumping serial is refused if lineage differs; `-force` exists but only use after verifying the backup is correct).
- Lost state entirely: re-import everything with `import` blocks; plan until clean.
- "Resource already exists" on apply: object exists outside state, import it rather than deleting.

## Pitfalls

- Committing `terraform.tfstate` or `.terraform/` to git. Commit `.terraform.lock.hcl`, nothing else.
- Running state commands against the wrong workspace: check `terraform workspace show` first.
- Using workspaces to separate prod and dev with very different config; separate root modules or directories are
  clearer.
- `state rm` followed by forgetting the object exists: it keeps costing money and nobody manages it.
