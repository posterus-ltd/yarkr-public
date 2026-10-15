---
name: secret-rotation-runbooks
description: Write and run zero-downtime rotation runbooks for API keys, database credentials, signing keys and TLS certificates using the dual-credential (overlap) pattern. Use when scheduling routine rotation, automating it in a secrets manager, or rotating urgently after a suspected leak.
---

# Secret rotation runbooks

Zero-downtime rotation always follows the same shape: **both old and new credentials are valid for an overlap
window**, consumers move to the new one, you verify, then revoke the old one.

```
create new -> distribute -> consumers switch -> verify no use of old -> revoke old -> record
```

## 1. Runbook template

Write one per secret type, store it next to the service docs:

```markdown
# Rotate <secret name>
Owner: <team> | Frequency: <90 days / on leak> | Last rotated: <date>
Where it lives: <manager path> | Consumers: <services, jobs, third parties>
Issuer: <provider console / DB / CA> | Max simultaneous valid credentials: <n>

## Pre-checks
- [ ] Access to issuer and secrets manager confirmed
- [ ] Consumers reload secrets without deploy? <yes: how / no: restart plan>
- [ ] Dashboards to watch: <auth error rate, 401/403s, DB connection errors>

## Steps
1. ...
## Verify
## Roll back
## Revoke old
## Record
```

## 2. API keys (third-party providers)

1. Create a second key in the provider (most allow two active keys; check the limit first).
2. Write it to the secrets manager as a new version; keep the previous version.
3. Roll consumers: trigger refresh or restart, one environment at a time.
4. Verify: provider's "last used" for the old key stops advancing; app error rate flat.
5. Revoke the old key. Watch errors for one cache-TTL period.
6. If only one key may exist at a time, schedule a short maintenance window or put a proxy in front so only one
   component holds the key.

## 3. Database credentials

Preferred: switch to dynamic credentials (`secrets-vault-patterns`) and the problem goes away.

Static user, two-user alternation (no downtime):

1. Maintain two users with identical grants, `app_a` and `app_b`. The app currently uses `app_a`.
2. Reset `app_b`'s password; store `app_b` + new password as the current secret version.
3. Roll the app; connection pools open new connections as `app_b`.
4. Verify no sessions remain for `app_a` (`SELECT usename, count(*) FROM pg_stat_activity GROUP BY 1;` on Postgres;
   `SHOW PROCESSLIST` / `performance_schema` on MySQL).
5. Reset `app_a`'s password to a random value nobody stores (effectively disabling it until next rotation).

AWS Secrets Manager's managed rotation for RDS supports single-user and alternating-users strategies; prefer
alternating users for apps that cannot tolerate a failed connection.

## 4. Signing keys (JWT, webhooks, session secrets)

Use key IDs so verifiers accept several keys:

1. Generate the new key; publish it to verifiers first (JWKS endpoint, `kid` list, or a list of accepted secrets).
2. Wait for verifier caches to refresh (JWKS cache TTL).
3. Switch signers to the new key.
4. Keep the old key in the verification set until every token signed with it has expired (max token lifetime).
5. Remove the old key.

Session secrets: frameworks often accept a list (e.g. Express `secret: [new, old]`, Rails `secret_key_base` rotation
via `config.secret_key_base` + rotator). Put the new one first.

## 5. TLS certificates

- Automate with ACME (cert-manager, Caddy, certbot) and renew at roughly two thirds of lifetime. Public certificate
  maximum lifetimes are shrinking in stages under CA/Browser Forum rules, so manual renewal does not scale.
- For manual or private-CA certs: issue new cert (new key pair), deploy alongside old, switch, confirm with
  `openssl s_client -connect host:443 -servername host </dev/null | openssl x509 -noout -dates -serial`, then revoke
  old if the key may be compromised.
- Monitor expiry (`x509` exporter, synthetic checks) and alert at 30 and 7 days.
- mTLS: roll the trust bundle (add new CA) before issuing leaf certs from it, remove the old CA last.

## 6. Encryption keys

- KMS keys: enable automatic rotation; old key versions remain usable for decrypt.
- Application data keys: new writes use the new key ID; re-encrypt old data in the background only if the old key is
  suspected compromised or policy requires.

## 7. Automate

- Schedule rotation in the manager (Secrets Manager rotation Lambda, Vault static roles with `rotation_period`, GCP
  Secret Manager rotation notifications to a Pub/Sub-triggered function).
- Emit a metric/event on success and failure; alert on failure and on "secret age > policy".

## Pitfalls

- Revoking the old credential before confirming nothing still uses it (cron jobs, batch workers, a forgotten region).
- Apps that read secrets only at boot, so rotation silently requires a restart nobody performs.
- Rotating the value but not the downstream copies (CI variables, partner systems, local `.env` of on-call laptops).
- No rollback: keep the previous version restorable until verification passes.
