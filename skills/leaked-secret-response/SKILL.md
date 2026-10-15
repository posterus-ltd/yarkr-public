---
name: leaked-secret-response
description: Respond to a leaked credential (committed to git, pasted in chat or logs, found in a public repo or image) - contain, revoke and rotate, check usage logs for abuse, clean up copies, and record the incident. Use as soon as a real secret is found anywhere it should not be.
---

# Leaked secret response

Assume a leaked secret has been seen. Public GitHub commits are scraped by automated bots within minutes. Speed of
revocation matters more than cleaning history.

## 0. Triage (5 minutes)

Record, without copying the secret value itself:

- What it is (provider, key type, key ID / last 4 chars), what it grants, which environment.
- Where it leaked (repo + commit, public or private, log system, ticket, chat, image), and since when.
- Whether it is real or a dummy/test value. If unsure, treat as real.

Severity: public exposure or production scope = incident; page the owner and security on-call per your process.

## 1. Contain: revoke or rotate now

Order of preference:
1. **Revoke/disable** the credential at the issuer (provider console/API, IAM, DB `ALTER USER`, CA revocation).
2. If immediate revocation breaks production, **create a replacement first**, roll it out quickly, then revoke
   (`secret-rotation-runbooks`), but keep the window minutes, not days.
3. Rotate anything derived from or stored alongside it (other secrets in the same `.env`, the same config file).

Examples:
```bash
# AWS access key: deactivate, then delete after replacement
aws iam update-access-key --user-name ci-deployer --access-key-id AKIA...WXYZ --status Inactive
# GitHub PAT / app key: revoke in settings; org admins can review and revoke fine-grained PATs
# Postgres user
psql -c "ALTER ROLE app_user WITH PASSWORD NULL NOLOGIN;"
```

Some providers auto-revoke on detection via secret scanning partner programs; confirm the actual key state anyway.

## 2. Investigate usage

Check logs from the leak time (earliest exposure) to revocation:

| Secret | Where to look |
| --- | --- |
| AWS keys | CloudTrail by `accessKeyId`; unusual regions, `iam:*`, `sts:GetCallerIdentity` from unknown IPs, new users/keys, EC2 launches |
| GCP / Azure | Cloud Audit Logs by principal; Azure sign-in and activity logs |
| GitHub tokens | org audit log, `git` access events, new deploy keys, workflow changes |
| SaaS API keys | provider's API request log / "last used" field |
| DB credentials | DB connection logs, `pg_stat_activity` history in logs, source IPs |
| Signing keys | tokens issued/verified with that `kid` from unexpected sources |

Look for persistence created by an intruder: new users, keys, roles, OAuth apps, webhooks, CI secrets, deploy keys.
If you find abuse, escalate to full incident response and preserve logs.

## 3. Clean up copies

- Remove the secret from the current code and replace with a runtime lookup (`app-secret-hygiene`).
- Delete or redact it in chat messages, tickets, log indexes, and error trackers where possible.
- Git history: after revocation, optionally purge with `git filter-repo --replace-text replacements.txt` and
  force-push, then ask GitHub support to clear cached views and PR refs if needed. Forks and clones keep the old
  history, which is why revocation, not purging, is the fix.
- Rebuild and republish container images or packages that embedded it; delete old tags.
- Invalidate caches/CDN copies of exposed config files.

## 4. Prevent recurrence

- Add/enable pre-commit and CI secret scanning; enable push protection.
- Fix the root cause: why did a human handle this secret at all? Move to OIDC/workload identity where possible.
- Narrow the credential's scope and lifetime for the replacement.

## 5. Record

```markdown
## Leaked credential: <type, key ID suffix>
- Detected: <time, by whom/what>   Exposed since: <time>   Revoked: <time>
- Location: <repo/commit, system>   Exposure: <public | internal | limited>
- Scope of credential: <what it could access>
- Evidence of misuse: <none found in <logs checked> | details>
- Actions: revoked, replaced, history purged <y/n>, images rebuilt <y/n>
- Root cause and follow-ups: <owner, due date>
```

Notify affected customers or regulators only through the organisation's legal/incident process when misuse touched
personal or customer data.

## Pitfalls

- Deleting the commit and calling it done; the key stays valid.
- Rotating the key but leaving the old one active "for safety".
- Pasting the secret into the incident ticket. Refer to it by ID and last four characters only.
- Checking logs only from the time of detection instead of from the time of first exposure.
