---
name: terraform-native-tests
description: Write `terraform test` suites (.tftest.hcl) for modules. Use when adding tests to a Terraform module, choosing plan vs apply runs, mocking providers or resources, asserting on outputs and validation failures, or running Terraform tests in CI.
---

# Terraform native tests

`terraform test` (1.6+) runs `.tftest.hcl` files in `tests/` (or next to the config). Each file is a sequence of
`run` blocks against the module under test. Mocks (1.7+) let you test without cloud credentials.

## Layout

```
modules/bucket/
  main.tf variables.tf outputs.tf
  tests/
    defaults.tftest.hcl     # plan-only, mocked: fast, runs on every PR
    validation.tftest.hcl   # expect_failures on bad inputs
    integration.tftest.hcl  # real apply in a sandbox account, nightly
```

```bash
terraform init
terraform test                          # all files
terraform test -filter=tests/defaults.tftest.hcl
terraform test -verbose                 # print plan/state per run
```

## A plan-only unit test with a mocked provider

```hcl
mock_provider "aws" {}

variables {
  name        = "acme-logs"
  environment = "dev"
}

run "encryption_on_by_default" {
  command = plan

  assert {
    condition     = aws_s3_bucket_server_side_encryption_configuration.this.rule[0].apply_server_side_encryption_by_default[0].sse_algorithm == "aws:kms"
    error_message = "Bucket must default to KMS encryption."
  }
}

run "versioning_can_be_disabled" {
  command = plan
  variables {
    versioning = false
  }
  assert {
    condition     = aws_s3_bucket_versioning.this.versioning_configuration[0].status == "Suspended"
    error_message = "versioning = false should suspend versioning."
  }
}
```

- `command = plan` asserts on planned values; attributes that are computed are unknown in plan, so assert on inputs
  you control. With `mock_provider`, `command = apply` works without credentials and computed attributes get
  generated fake values.
- `run`-level `variables` override file-level `variables`.

## Shaping mocks

```hcl
mock_provider "aws" {
  mock_resource "aws_s3_bucket" {
    defaults = {
      arn = "arn:aws:s3:::mock-bucket"
    }
  }
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
    }
  }
}
```

Use mocks when your module derives values from computed attributes or data sources (ARN parsing, account IDs).
`override_resource`, `override_data` and `override_module` replace specific addresses inside a file or run.

## Testing validation and preconditions

```hcl
run "rejects_bad_environment" {
  command = plan
  variables {
    environment = "production"
  }
  expect_failures = [var.environment]
}
```

`expect_failures` accepts variables, outputs, resources/data sources (for preconditions/postconditions) and `check`
blocks. The run passes only if exactly those objects fail.

## Chaining runs and helper modules

- Runs in a file share state by default; later runs see earlier runs' outputs as `run.<name>.<output>`.
- Use a `module { source = "./tests/setup" }` inside a `run` to create prerequisites (VPC, KMS key) or to load
  fixtures, then pass their outputs into the module under test.

```hcl
run "setup" {
  module { source = "./tests/setup" }
}

run "creates_bucket_with_key" {
  variables {
    kms_key_arn = run.setup.key_arn
  }
  assert {
    condition     = output.bucket_name == "acme-logs"
    error_message = "Unexpected bucket name."
  }
}
```

## Real-infrastructure (integration) tests

- `command = apply` (the default) without mocks creates real resources and destroys them in reverse order at the end
  of the file. Use a dedicated sandbox account and unique names (e.g. a random suffix from a setup run).
- If a destroy fails, terraform reports leftover resources: have a cleanup job (tag-based nuke) for the sandbox.
- Keep integration tests fewer and slower; run nightly or on release tags, not every push.

## What to test

| Test | Kind |
| --- | --- |
| Secure defaults (encryption, no public access) | plan, mocked |
| Each optional feature toggled on/off | plan, mocked |
| Input validation rejects bad values | plan, `expect_failures` |
| for_each keys produce expected addresses/counts | plan, `length(...)` asserts |
| Outputs shape and naming | apply, mocked |
| Module actually works against the API | apply, real, nightly |

## CI

```yaml
- run: terraform fmt -check -recursive
- run: terraform init -backend=false
- run: terraform validate
- run: terraform test
```

Run per module directory (matrix over `modules/*`). Mocked suites need no cloud credentials.

## Pitfalls

- Asserting on `(known after apply)` attributes in a plan run: the condition errors as unknown. Use apply with mocks.
- Forgetting `terraform init` in each module directory before `terraform test`.
- Mock defaults that don't match real formats (e.g. an ARN your module parses): set realistic defaults.
- Tests that only assert "something was created". Assert the behaviour callers rely on.
