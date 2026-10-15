---
name: secrets-vault-patterns
description: Use a secrets manager (Vault/OpenBao, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) with workload identity and short-lived, scoped credentials. Use when choosing where secrets live, wiring a service to fetch them, or replacing static credentials with dynamic ones.
---

# Secrets manager patterns

The target state: no long-lived static secrets in env files or images; workloads authenticate with their own
platform identity, fetch only the secrets they need, and get credentials that expire on their own.

## 1. Choose the pattern (in order of preference)

1. **No secret at all:** workload identity straight to the target service (IAM roles for AWS services, GCP service
   accounts, Azure managed identity, IAM database auth for RDS/Cloud SQL). Nothing to store or rotate.
2. **Dynamic secrets:** the manager mints a credential per workload with a TTL (Vault database / AWS / PKI secrets
   engines). Leaks expire on their own.
3. **Static secrets with automated rotation:** stored in the manager, rotated by a function or the manager itself
   (AWS Secrets Manager rotation, Vault static roles). For third-party API keys that cannot be dynamic.
4. **Static secrets, manual rotation:** last resort; document a runbook (`secret-rotation-runbooks`).

## 2. Authenticate the workload, not a human

Never bootstrap with a token in an env var if a platform identity exists.

| Platform | Auth to the manager |
| --- | --- |
| Kubernetes | Vault Kubernetes auth (service account JWT), EKS Pod Identity / IRSA, GKE Workload Identity, AKS Workload Identity |
| VMs / serverless | instance role / service account / managed identity; Vault AWS, GCP or Azure auth methods |
| CI | OIDC federation (see `ci-secrets-handling`) |
| Humans | SSO (OIDC) to the manager, short TTL tokens, MFA |

## 3. Scope access tightly

- One identity per service per environment. `payments-prod` cannot read `payments-staging` or `search-prod`.
- Path convention that maps to policy: `<env>/<service>/<name>` (Vault KV), or resource tags/naming for cloud
  managers so IAM conditions can match.
- Read-only for workloads; write/rotate only for the rotation function and break-glass admins.

Vault policy example:

```hcl
path "secret/data/prod/payments/*" { capabilities = ["read"] }
path "database/creds/payments-prod" { capabilities = ["read"] }
```

AWS IAM (least privilege, by name prefix):

```json
{ "Effect": "Allow", "Action": "secretsmanager:GetSecretValue",
  "Resource": "arn:aws:secretsmanager:eu-west-1:123456789012:secret:prod/payments/*" }
```

GCP: grant `roles/secretmanager.secretAccessor` on the individual secret, not on the project.

## 4. Fetch patterns

| Pattern | When | Notes |
| --- | --- | --- |
| SDK call at startup + cache with TTL | most apps | refresh before expiry; handle fetch failure by failing fast at boot |
| Agent / sidecar renders files (Vault Agent, Secrets Store CSI driver) | apps that read files, legacy apps | mount as tmpfs; app re-reads on change or is signalled |
| Kubernetes operator syncs to `Secret` (External Secrets Operator, Vault Secrets Operator) | k8s-native consumers | k8s Secrets are base64, not encrypted: enable etcd encryption and restrict RBAC on `secrets` |
| Platform injection (ECS `secrets`, Cloud Run secret refs, Lambda extension) | managed runtimes | resolves at deploy/start; restart to pick up rotation unless using versions/`latest` with refresh |

CLI equivalents for debugging (use your own short-lived human credentials):

```bash
vault kv get -mount=secret prod/payments/stripe
vault read database/creds/payments-prod          # dynamic DB user with lease
aws secretsmanager get-secret-value --secret-id prod/payments/stripe --query SecretString --output text
gcloud secrets versions access latest --secret=payments-stripe
az keyvault secret show --vault-name kv-prod --name payments-stripe --query value -o tsv
```

## 5. Dynamic database credentials (Vault)

- Configure the database secrets engine with a dedicated admin user that Vault rotates itself (`rotate-root`).
- Role SQL creates a user with only the grants the service needs; `default_ttl` around 1h, `max_ttl` a day.
- App renews the lease, or re-fetches before expiry and drains old connections; pools must tolerate credential change.

## 6. Operational guardrails

- Audit logging on (Vault audit device, CloudTrail data events for Secrets Manager, Cloud Audit Logs data access).
  Alert on reads by unexpected principals.
- Versioning on; keep previous version for rollback during rotation.
- Encrypt with a customer-managed KMS key where compliance requires it, and restrict who can use that key.
- Break-glass: a documented, alerting, MFA-protected admin path; test it.
- Unseal / recovery keys for self-hosted Vault/OpenBao held by separate people (Shamir) or auto-unseal via cloud KMS.

## Pitfalls

- Moving secrets into the manager but injecting them as plain env vars that end up in crash dumps, `/proc`, and
  `docker inspect`. Prefer files or in-memory fetch for high-value secrets.
- One "app" identity shared by every service: a single compromise reads everything.
- Caching forever: rotation then breaks the app or never takes effect.
- Granting `secretsmanager:*` or project-wide accessor roles for convenience.
- Storing the manager's own bootstrap token in the repo or the image.
