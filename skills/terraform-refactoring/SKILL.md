---
name: terraform-refactoring
description: Refactor Terraform code without destroying and recreating infrastructure. Use when renaming resources, switching count to for_each, extracting or merging modules, adopting existing resources, or dropping resources from management, using moved, import and removed blocks.
---

# Terraform refactoring without destroy/recreate

Terraform tracks objects by address. Changing an address in code looks like "destroy old, create new" unless you tell
Terraform it moved. Goal of every refactor: **the plan shows zero creates and zero destroys of real objects.**

## Tools (Terraform 1.x)

| Block | Since | Use |
| --- | --- | --- |
| `moved` | 1.1 | Address changed: rename, into/out of module, count → for_each |
| `import` | 1.5 | Bring an existing object under management via plan/apply |
| `removed` | 1.7 | Stop managing an object, optionally without destroying it |

All three are reviewed in the plan and work in HCP Terraform, unlike `terraform state mv/rm`.

## Renames

```hcl
resource "aws_s3_bucket" "logs" { ... }   # was aws_s3_bucket.log_bucket

moved {
  from = aws_s3_bucket.log_bucket
  to   = aws_s3_bucket.logs
}
```

Plan shows `# aws_s3_bucket.log_bucket has moved to aws_s3_bucket.logs` and no changes.

## count → for_each

```hcl
resource "aws_iam_user" "this" {
  for_each = toset(["alice", "bob"])
  name     = each.key
}

moved {
  from = aws_iam_user.this[0]
  to   = aws_iam_user.this["alice"]
}
moved {
  from = aws_iam_user.this[1]
  to   = aws_iam_user.this["bob"]
}
```

Check the current index → object mapping with `terraform state show 'aws_iam_user.this[0]'` before writing the
blocks. `moved` doesn't support `for_each`; generate the blocks with a script for large sets.

## Into or out of a module

```hcl
module "network" {
  source = "./modules/network"
}

moved {
  from = aws_vpc.main
  to   = module.network.aws_vpc.this
}

# whole module rename
moved {
  from = module.net
  to   = module.network
}
```

Module authors: put `moved` blocks inside the module when renaming internal resources so every caller upgrades
cleanly. Keep them for at least one major version.

## Adopting existing objects

```hcl
import {
  to = aws_route53_zone.main
  id = "Z0123456789ABCDEFG"
}
```

```bash
terraform plan -generate-config-out=generated.tf
```

- The import ID format is documented on each resource's provider page ("Import" section).
- `for_each` on import blocks (1.7+) handles many objects:

```hcl
import {
  for_each = var.existing_buckets   # map of key => bucket name
  to       = aws_s3_bucket.this[each.key]
  id       = each.value
}
```

- After import the plan should show no changes or only intended ones; edit config until it does.

## Dropping from management

```hcl
removed {
  from = aws_instance.legacy
  lifecycle {
    destroy = false
  }
}
```

Delete the `resource` block in the same change. Apply removes it from state, leaves the instance running.
With `destroy = true` (default) it is destroyed, same as deleting the block.

## Moving between root modules (states)

1. Destination root: add resource config + `import` block.
2. Source root: delete resource config + `removed { lifecycle { destroy = false } }`.
3. Apply destination first, then source. Check both plans show no destroy.

## Workflow for any refactor

1. Start from a clean plan (no pending changes) so refactor diffs stand alone.
2. Make the code change and add the blocks.
3. `terraform plan`: expect only `has moved to`, imports, and `will no longer be managed` lines.
4. Any `must be replaced` or `will be destroyed`: stop, find the missing or wrong block.
5. Apply. Leave `moved` blocks in place (they are harmless) at least until every environment and caller has applied;
   for shared modules, keep them long-term.

## Things refactoring blocks can't do

- Change resource **type** (e.g. a deprecated resource replaced by a new one) with `moved`, unless the provider
  explicitly supports that move (some providers implement cross-type moves; check the docs). Otherwise: `removed`
  with `destroy = false` for the old type plus `import` for the new type.
- Move across providers or between states in one step.
- Fix attribute changes that force replacement; those are not address problems.

## Pitfalls

- Mixing a refactor with functional changes in one PR: hard to see unintended replacements.
- Using `terraform state mv` locally while CI also applies: state and code diverge; prefer blocks.
- Removing `moved` blocks from a published module too early: callers on old versions get destroy/create on upgrade.
- Imports with generated config committed as-is: clean up computed, default and redundant attributes.
