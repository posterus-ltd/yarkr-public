---
name: terraform-module-design
description: Design reusable Terraform modules with clear input/output contracts. Use when creating or refactoring a module, deciding module boundaries, writing variables with types and validation, choosing composition over nesting, or versioning and publishing modules.
---

# Terraform module design

A module is an API. Callers depend on its variables, outputs and resource addresses; changing any of them is a
breaking change.

## Boundaries

- One module = one coherent capability with one lifecycle ("a VPC with subnets", "a service's queue + DLQ + alarms").
- Don't wrap a single resource just to rename its arguments; that adds a layer with no value.
- Prefer **composition**: root modules wire small modules together by passing outputs into inputs. Avoid deep nesting
  (module calling module calling module): it hides resources and makes refactors painful.
- Keep providers out of reusable modules. Declare requirements, let the root configure them:

```hcl
terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0, < 7.0"
    }
  }
}
```

Modules set lower bounds (and a cautious upper bound); root modules pin exact versions via `.terraform.lock.hcl`.
If a module needs multiple provider configurations, use `configuration_aliases` and have the caller pass `providers`.

## Standard layout

```
modules/<name>/
  main.tf          # resources
  variables.tf     # inputs, alphabetical or grouped
  outputs.tf
  versions.tf      # terraform + required_providers
  README.md        # usage example, inputs/outputs (terraform-docs can generate)
  examples/basic/  # runnable example root module
  tests/*.tftest.hcl
```

## Variables

- Always set `type` and `description`. Use precise types: `object({...})` with `optional()` attributes instead of
  `any` or `map(string)` blobs.

```hcl
variable "buckets" {
  description = "Buckets to create, keyed by logical name."
  type = map(object({
    versioning  = optional(bool, true)
    lifecycle_days = optional(number)
    tags        = optional(map(string), {})
  }))
  default = {}
}

variable "environment" {
  description = "Deployment environment."
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging or prod."
  }
}
```

- Required inputs: no default. Optional: a safe default (secure by default, e.g. encryption on, public access off).
- `nullable = false` when null must not be passed through.
- `sensitive = true` for secrets; never give secrets defaults.
- Validation can reference other variables (1.9+); use it for cross-field rules instead of failing deep in a resource.
- Use `precondition` / `postcondition` in `lifecycle` blocks to check assumptions about data sources and results.

## Outputs

- Output what callers need to compose: IDs, ARNs, names, endpoints. Prefer a few well-named outputs, or one object
  output for a group, over dumping whole resources.
- Mark secrets `sensitive = true`.
- Removing or renaming an output is a breaking change.

## Collections: for_each over count

- Use `for_each` with stable, human-meaningful keys. `count` re-indexes when an item is removed in the middle,
  forcing destroy/recreate.
- Use `count` only for on/off toggles: `count = var.enabled ? 1 : 0`.
- Keys must be known at plan time; don't key on attributes that are `(known after apply)`.

## Naming and tags

- Name the main resource `this` when the module has one primary resource, otherwise descriptive names.
- Accept `tags` and merge with module defaults; with AWS, let callers rely on provider `default_tags`.
- Avoid hardcoded regions, account IDs, or AZ names; derive from data sources or inputs.

## Versioning and releases

- Semantic versioning with git tags. Breaking: removed/renamed variable or output, changed type, changed resource
  address without `moved` block, raised minimum provider major.
- Ship `moved` blocks inside the module when you rename internal resources, so callers upgrade without replacement.
- Callers pin: `source = "git::https://...//modules/x?ref=v2.3.1"` or registry `version = "~> 2.3"`.
- Keep a CHANGELOG with upgrade notes for every major.

## Review checklist

- [ ] Every variable has type + description; no unexplained `any`.
- [ ] Validation on enums, CIDRs, name formats.
- [ ] Secure defaults; nothing public unless the caller opts in.
- [ ] No provider blocks; `required_providers` declared.
- [ ] `for_each` with stable keys.
- [ ] Outputs cover composition needs; sensitive marked.
- [ ] Example and `terraform test` suite exist and pass.
- [ ] Internal renames carry `moved` blocks.

## Pitfalls

- God modules with dozens of toggles: split them.
- Passing whole objects through many layers (`var.config.network.subnets[...]`): flatten interfaces.
- `depends_on` on a module: makes every data source inside defer to apply time. Use explicit references instead.
- Data sources inside modules looking up things the caller already knows: pass IDs in instead.
