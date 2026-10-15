---
name: ci-secrets-handling
description: "Keep secrets safe in CI/CD: OIDC instead of long-lived cloud keys, environment protection, masked and scoped variables, safe fork-PR handling, no secrets in logs or artifacts. Use when writing or reviewing GitHub Actions, GitLab CI or other pipelines that touch credentials."
---

# CI secrets handling

CI runs arbitrary code from branches and dependencies with access to your deploy credentials. Treat it as a
production system: minimum credentials, shortest lifetime, narrowest trigger.

## 1. Replace static cloud keys with OIDC

The pipeline gets a signed identity token per job; the cloud exchanges it for short-lived credentials. No secret
to store or leak.

GitHub Actions to AWS:

```yaml
permissions:
  id-token: write      # needed to request the OIDC token
  contents: read
jobs:
  deploy:
    environment: production
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/gha-deploy-prod
          aws-region: eu-west-1
```

Trust policy: restrict the `sub` claim to the exact repo and environment, never `repo:org/*`:

```json
"Condition": {
  "StringEquals": {
    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
    "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:environment:production"
  }
}
```

- GCP: Workload Identity Federation + `google-github-actions/auth` with `workload_identity_provider`; condition on
  `assertion.repository` and ref/environment.
- Azure: federated credential on an app registration + `azure/login` with client/tenant/subscription IDs (not secrets).
- GitLab: `id_tokens:` keyword with an `aud`, then exchange; restrict on `project_path`, `ref`, `ref_protected`.
- Vault: JWT auth method with `bound_claims` on repository and ref/environment.

## 2. Scope secrets that must exist

- Use **environment-level** secrets (GitHub environments, GitLab protected environments) for deploy credentials,
  with required reviewers and branch restrictions (only `main` / tags can deploy to production).
- GitLab: mark variables **Protected** (only on protected branches/tags) and **Masked**; use "Masked and hidden" for
  values nobody should read back.
- Separate credentials per environment; staging jobs cannot read production secrets.
- Least privilege on the credential itself: the deploy role can update one service, not administer the account.

## 3. Untrusted code paths

- `pull_request` from forks gets no secrets by default. Keep it that way.
- `pull_request_target` and `workflow_run` run with secrets in the base repo context: never check out and execute
  the PR's code in them. If you must, split into an unprivileged build job and a privileged job that only consumes
  artifacts, treating them as untrusted data.
- Do not interpolate untrusted context into `run:` scripts (`${{ github.event.pull_request.title }}`): pass it via
  `env:` and reference `"$TITLE"` to avoid script injection.
- Self-hosted runners: never for public repos; ephemeral runners for anything with production access.

## 4. Lock down the workflow itself

- Set top-level `permissions:` to the minimum (`contents: read`) and elevate per job.
- Pin third-party actions to a full commit SHA, not a tag; let Dependabot/Renovate update them.
- Protect workflow files with CODEOWNERS and branch protection so a PR cannot edit the deploy job and run it with secrets.
- Do not use `secrets: inherit` for reusable workflows unless every inherited secret is needed.

## 5. Keep secrets out of logs and artifacts

- Masking is best-effort: it fails on transformed values (base64, JSON-escaped, split lines). Do not echo secrets at all.
- Values derived at runtime (e.g. a fetched token) must be masked explicitly: `echo "::add-mask::$TOKEN"` in GitHub Actions.
- Disable shell tracing (`set -x`) in steps that handle secrets.
- Do not write secrets to files that get uploaded as artifacts or cached; clean up credential files in `always()` steps.
- Docker builds: BuildKit `--secret`, never `--build-arg` for secrets.
- Avoid `env` dumps and debug logging (`ACTIONS_STEP_DEBUG`) in privileged jobs.

## Review checklist

- [ ] No static cloud access keys where OIDC is available.
- [ ] OIDC trust conditions pin repo **and** branch/environment.
- [ ] Production deploy secrets live in a protected environment with reviewers.
- [ ] No `pull_request_target` job that checks out PR head and runs it.
- [ ] No `${{ github.event.* }}` interpolated directly into `run:`.
- [ ] Third-party actions pinned by SHA; `permissions:` minimal.
- [ ] No `set -x`, `env`, `printenv` or `cat` of credential files in jobs with secrets.

## Pitfalls

- An OIDC trust policy with `StringLike` on `repo:org/*:*` lets any repo in the org assume the role.
- Masked variables still leak through a malicious dependency that exfiltrates over the network; least privilege
  and short lifetimes are the real control.
- Long-lived PATs for cross-repo access: prefer GitHub App installation tokens (short-lived, scoped).
