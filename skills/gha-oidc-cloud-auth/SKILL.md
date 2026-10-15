---
name: gha-oidc-cloud-auth
description: Authenticate GitHub Actions to AWS, Google Cloud and Azure with OIDC federation instead of long-lived keys - trust policies, subject claims, environments and least privilege. Use when removing cloud access keys from repo secrets, setting up deploy credentials, or debugging "Not authorized to perform sts:AssumeRoleWithWebIdentity" style errors.
---

# OIDC from GitHub Actions to the cloud

The job requests a short-lived JWT from GitHub's OIDC provider (`https://token.actions.githubusercontent.com`), the
cloud verifies its signature and claims against a trust policy, and returns short-lived credentials. No secrets stored.

## Workflow side (all clouds)

```yaml
permissions:
  id-token: write    # required to request the OIDC token
  contents: read     # needed for checkout once you set permissions explicitly
```

Grant `id-token: write` on the deploying job only. For a reusable workflow, the **calling** job must grant it too.

## The claims you trust

| Claim | Example | Notes |
| --- | --- | --- |
| `sub` | `repo:acme/api:environment:prod` | Main thing to match. Shape depends on the trigger |
| `aud` | `sts.amazonaws.com` | Set by the cloud action |
| `repository`, `repository_owner` | `acme/api`, `acme` | |
| `ref` | `refs/heads/main` | |
| `environment` | `prod` | Present only when the job has `environment:` |
| `job_workflow_ref` | `acme/ci/.github/workflows/deploy.yml@refs/tags/v2` | Pin trust to a reusable workflow |
| `repository_id`, `repository_owner_id` | numeric | Survive renames; resist name-squatting |

Default `sub` formats:
- environment job: `repo:ORG/REPO:environment:NAME`
- pull_request: `repo:ORG/REPO:pull_request`
- otherwise: `repo:ORG/REPO:ref:refs/heads/BRANCH` or `...:ref:refs/tags/TAG`

Note the environment form **replaces** the ref: a job with `environment: prod` no longer has the branch in `sub`. Use
environment protection rules (branch restrictions, reviewers) to control which refs can deploy.

You can customize the `sub` template per org or repo (REST API `.../actions/oidc/customization/sub`) to include
claims such as `job_workflow_ref` or `repository_id`. Change trust policies in lockstep when you do.

## AWS

1. Create the IAM OIDC identity provider: URL `https://token.actions.githubusercontent.com`, audience
   `sts.amazonaws.com` (AWS no longer requires a manually supplied thumbprint for this provider).
2. Create a role with a trust policy that pins `aud` and `sub`:

```json
{
  "Effect": "Allow",
  "Principal": { "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:acme/api:environment:prod"
    }
  }
}
```

   Use `StringLike` with a wildcard only when needed (`repo:acme/api:ref:refs/heads/release/*`). **Never** trust
   `repo:acme/*` or omit `sub`: any repo (or any org, with a bare `*`) could assume the role.
3. Workflow:

```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/gha-api-prod
    aws-region: eu-west-1
- run: aws sts get-caller-identity
```

## Google Cloud (Workload Identity Federation)

1. Create a workload identity pool and an OIDC provider with issuer `https://token.actions.githubusercontent.com`,
   an attribute mapping (`google.subject=assertion.sub`, `attribute.repository=assertion.repository`,
   `attribute.repository_owner=assertion.repository_owner`) and an **attribute condition** restricting the owner, e.g.
   `assertion.repository_owner == 'acme'`. Google requires a condition for GitHub providers; make it tight.
2. Grant access either directly to the federated principal
   (`principalSet://iam.googleapis.com/projects/NUM/locations/global/workloadIdentityPools/POOL/attribute.repository/acme/api`)
   on resources, or let it impersonate a service account via `roles/iam.workloadIdentityUser`.
3. Workflow:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: projects/123456/locations/global/workloadIdentityPools/github/providers/github
    service_account: deployer@my-proj.iam.gserviceaccount.com   # omit for direct federation
- uses: google-github-actions/setup-gcloud@v2
```

## Azure (Entra ID federated credentials)

1. Create an app registration or user-assigned managed identity; add a **federated credential** with issuer
   `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange`, and a subject that exactly
   matches the token `sub` (e.g. `repo:acme/api:environment:prod`). Azure matches subjects exactly (flexible
   matching exists but check support before relying on it), so create one credential per environment/branch.
2. Assign RBAC roles to that identity at the narrowest scope (resource group, not subscription).
3. Workflow:

```yaml
- uses: azure/login@v2
  with:
    client-id: ${{ vars.AZURE_CLIENT_ID }}
    tenant-id: ${{ vars.AZURE_TENANT_ID }}
    subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
```

Client, tenant and subscription IDs aren't secrets; store them as `vars`.

## Design rules

- One role/identity per repo and environment (`api-staging`, `api-prod`), each with least-privilege permissions.
- Bind prod roles to `environment:prod` subjects and protect that environment with required reviewers and a
  deployment branch rule. That gives you approval plus ref restriction.
- Never let `pull_request` subjects assume anything with write access. Fork PRs don't get `id-token` anyway, but
  same-repo PR branches do.
- For org-wide deploy pipelines, trust `job_workflow_ref` of a central reusable workflow pinned to a tag, so only
  that reviewed workflow can deploy.
- Delete the old access keys after migrating; rotate anything they could have touched if they were ever leaked.

## Debugging

1. Print the claims (safe: the token is short-lived, but still don't log the raw token):

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      const t = await core.getIDToken('sts.amazonaws.com');
      core.info(Buffer.from(t.split('.')[1], 'base64').toString());
```

2. Compare `sub` and `aud` character by character with the trust policy. Typical mismatches: environment job vs
   branch subject, renamed repo, wrong audience, customized `sub` template.
3. "Unable to get ACTIONS_ID_TOKEN_REQUEST_URL": the job lacks `id-token: write` (or it's a fork PR).
4. AWS: check CloudTrail `AssumeRoleWithWebIdentity` events. GCP: check the attribute condition. Azure: AADSTS70021
   means no federated credential matched the subject.
