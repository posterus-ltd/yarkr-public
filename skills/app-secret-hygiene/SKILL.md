---
name: app-secret-hygiene
description: Remove hard-coded secrets from code and config, load them at runtime, and keep them out of logs, errors, images and client bundles. Use when you find a key or password in source, set up config loading for a service, add pre-commit secret scanning, or review a diff for secret handling.
---

# Application secret hygiene

Secrets belong in the runtime environment or a secrets manager, never in the repository, the build artifact, or
anything the client downloads. A secret that has been committed is compromised, even if the commit is deleted.

## 1. Find secrets already in the code

```bash
gitleaks dir .                 # working tree (gitleaks >= 8.19; older: gitleaks detect --no-git)
gitleaks git .                 # full history (older: gitleaks detect)
trufflehog git file://. --results=verified,unknown
rg -n -i -e '(api|secret|private)[_-]?key\s*[:=]' -e 'password\s*[:=]\s*["'\'']' -e 'BEGIN (RSA|EC|OPENSSH) PRIVATE KEY' -e 'AKIA[0-9A-Z]{16}' -e 'ghp_[A-Za-z0-9]{36}' -e 'xox[baprs]-'
```

Also look in: `.env*` committed by accident, `docker-compose.yml`, Helm `values.yaml`, Terraform `*.tfvars` and state,
Jupyter outputs, test fixtures, CI files, mobile app configs, `application.properties`, seed scripts.

## 2. For every real secret found

1. **Rotate it first** (see `leaked-secret-response`). Removing it from code does not un-leak it.
2. Replace the literal with a runtime lookup.
3. Add the pattern to the scanner config so it cannot come back.
4. Rewriting git history is optional and secondary; do it only if policy requires, after rotation.

## 3. Load at runtime

Read config once at startup, validate it, fail fast if a required secret is missing.

```python
# Python (pydantic-settings)
from pydantic import SecretStr
from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    database_url: SecretStr
    stripe_key: SecretStr
settings = Settings()          # raises if missing; SecretStr hides value in repr/logs
```

```ts
// Node: validate env at boot
import { z } from "zod";
const Env = z.object({ DATABASE_URL: z.string().url(), STRIPE_KEY: z.string().min(20) });
export const env = Env.parse(process.env);
```

- Local development: `.env` file listed in `.gitignore`, with a committed `.env.example` holding names and dummy values.
- Production: secrets manager or platform secret injection (see `secrets-vault-patterns`), not a `.env` baked into the image.
- Never pass secrets as CLI arguments (visible in `ps`, shell history, CI logs).

## 4. Keep secrets out of artifacts

- Docker: no `ENV SECRET=...` or `ARG` for secrets (they persist in image history). Use BuildKit secret mounts:
  `RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci` and `docker build --secret id=npmrc,src=$HOME/.npmrc .`
- Add `.env`, `*.pem`, `*.key`, `credentials.json` to `.dockerignore` as well as `.gitignore`.
- Frontend bundles: anything in `NEXT_PUBLIC_*`, `VITE_*`, `REACT_APP_*` ships to every browser. Only publishable keys there.
- Mobile apps: any embedded key is extractable; proxy calls through your backend.
- Terraform state contains secrets in plain text: remote encrypted backend with restricted access.

## 5. Keep secrets out of logs and errors

- Wrap secrets in types that redact on print (`SecretStr`, a `Redacted` struct with custom `String()`/`toJSON`).
- Configure logger redaction for keys like `password`, `token`, `authorization`, `cookie`, `secret`, `api_key`
  (e.g. pino `redact`, structlog processors, Logback masking).
- Never log full request headers or bodies for auth endpoints; never log connection strings.
- Error trackers (Sentry etc.): enable data scrubbing and add custom denylist fields.
- Exceptions shown to users must not include config values or stack traces.

## 6. Prevent regressions

- Pre-commit hook: gitleaks (`gitleaks git --pre-commit --staged` or the official pre-commit hook).
- CI job running the scanner on every PR, failing on new findings; baseline existing accepted findings explicitly.
- Enable the platform's push protection (GitHub secret scanning push protection, GitLab secret push protection).

## Review checklist for a diff

- [ ] No literal credentials, tokens, private keys or connection strings with passwords.
- [ ] Test fixtures use obviously fake values (`sk_test_dummy`), not copied real ones.
- [ ] New config keys documented in `.env.example` without values.
- [ ] Secrets not printed in logs, debug output, error messages or analytics events.
- [ ] Nothing secret added to client-exposed env prefixes.

## Pitfalls

- "It's only a test key": test keys often have production-adjacent access, and scanners will keep flagging them.
- Base64 in a YAML file is not encryption (Kubernetes `Secret` manifests in git). Use SOPS, Sealed Secrets or an operator.
- Deleting the line in a new commit; the secret remains in history and in every clone and fork.
