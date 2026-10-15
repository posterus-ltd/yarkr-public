---
name: tflint-config
description: Configure and run TFLint for Terraform code. Use when setting up .tflint.hcl, enabling AWS/Azure/Google rulesets, tuning or disabling rules, linting modules recursively, or wiring TFLint into pre-commit and CI.
---

# TFLint configuration

TFLint catches what `terraform validate` doesn't: invalid instance types, deprecated syntax, unused declarations,
naming conventions, and provider-specific mistakes.

## Minimal `.tflint.hcl`

Put it at the repository root (or per root module).

```hcl
config {
  call_module_type = "local"   # "all" also inspects remote modules (needs terraform init), "none" skips modules
}

plugin "terraform" {
  enabled = true
  preset  = "recommended"      # or "all"
}

plugin "aws" {
  enabled = true
  version = "0.x.y"            # pin to a tested release of the ruleset
  source  = "github.com/terraform-linters/tflint-ruleset-aws"
}
```

Other official rulesets: `github.com/terraform-linters/tflint-ruleset-azurerm`,
`github.com/terraform-linters/tflint-ruleset-google`. Pin each `version` and bump deliberately.

```bash
tflint --init                  # download plugins declared in .tflint.hcl
tflint                         # lint current directory
tflint --recursive             # lint every directory with .tf files
tflint --format compact        # one line per issue; also json, sarif, checkstyle, junit
tflint --chdir modules/vpc
```

Set `GITHUB_TOKEN` when running `--init` in CI to avoid GitHub API rate limits.

## Useful rules to know (terraform ruleset)

| Rule | Catches |
| --- | --- |
| `terraform_unused_declarations` | variables, locals, data sources never used |
| `terraform_typed_variables` | variables without `type` |
| `terraform_documented_variables` / `_outputs` | missing `description` |
| `terraform_required_version` | no `required_version` |
| `terraform_required_providers` | providers without source/version |
| `terraform_naming_convention` | non snake_case names |
| `terraform_deprecated_interpolation` | `"${var.x}"` where `var.x` suffices |
| `terraform_module_pinned_source` | git modules without a pinned ref |
| `terraform_standard_module_structure` | missing main/variables/outputs files (in "all" preset) |

Provider rulesets add checks such as invalid instance types, invalid regions or engine versions, and deprecated
resource arguments. Some AWS rules need API access (deep checking), disabled by default; leave them off in CI unless
you provide read-only credentials.

## Tuning rules

```hcl
rule "terraform_naming_convention" {
  enabled = true
  format  = "snake_case"
}

rule "terraform_standard_module_structure" {
  enabled = false              # root modules don't need the module layout
}
```

Inline ignore for a justified exception (put the reason in the comment):

```hcl
# tflint-ignore: aws_instance_invalid_type # new type not yet in ruleset
resource "aws_instance" "gpu" {
  instance_type = "p6.48xlarge"
}
```

Prefer fixing over ignoring. Review every `tflint-ignore` in PRs.

## Variables and module inspection

- TFLint evaluates expressions; supply var files so it knows real values: `tflint --var-file=env/prod.tfvars`.
- With `call_module_type = "all"`, run `terraform init` first so modules are downloaded.

## CI

GitHub Actions:

```yaml
- uses: terraform-linters/setup-tflint@v4
  with:
    tflint_version: vX.Y.Z      # pin a tested TFLint release
- run: tflint --init
  env:
    GITHUB_TOKEN: ${{ github.token }}
- run: tflint --recursive --format compact
```

Pin `tflint_version` to a release you have tested. Upload `--format sarif` output to code scanning if you want
annotations on PRs.

pre-commit (antonbabenko/pre-commit-terraform):

```yaml
- repo: https://github.com/antonbabenko/pre-commit-terraform
  rev: <pinned tag>
  hooks:
    - id: terraform_fmt
    - id: terraform_validate
    - id: terraform_tflint
      args: ["--args=--config=__GIT_WORKING_DIR__/.tflint.hcl"]
```

## Custom rules

- Organisation-specific checks (mandatory tags, naming prefixes) can be written as a custom ruleset plugin in Go using
  `tflint-plugin-sdk`, starting from the `tflint-ruleset-template` repository.
- For policy on plan output (cost, cross-resource rules), a policy engine such as OPA/Conftest or Sentinel is a better
  fit than TFLint, which works on configuration, not plans.

## Exit codes

`0` no issues, `2` issues found, `1` error. Use `--minimum-failure-severity=warning|error|notice` to decide what fails
the build.

## Pitfalls

- Forgetting `tflint --init` after adding a plugin: rules silently not run.
- Unpinned plugin versions: new rules break CI unexpectedly.
- Running in the root only and missing nested modules: use `--recursive`.
- Treating TFLint as a security scanner; pair it with a dedicated tool (Trivy, Checkov) for misconfiguration checks.
