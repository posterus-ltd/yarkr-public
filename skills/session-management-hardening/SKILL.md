---
name: session-management-hardening
description: "Harden session handling: ID entropy, rotation on login and privilege change, idle and absolute timeouts, revocation, logout and fixation defence, for cookie and token sessions. Use when building or reviewing login/session code or choosing between server sessions and JWTs."
---

# Session management hardening

## 1. Pick the session model deliberately

| Model | Strength | Watch out for |
| --- | --- | --- |
| Opaque session ID in cookie, state server-side (Redis/DB) | instant revocation, small cookie | session store availability |
| Signed/encrypted cookie holding state | no store | cannot revoke one session without a denylist or version counter |
| Short-lived access JWT + rotating refresh token | stateless APIs, mobile | revocation lag = access token TTL; refresh token must be server-tracked |

For browser apps, an opaque server-side session in an `HttpOnly` cookie is the safest default. Do not put JWTs in
`localStorage` (readable by any XSS).

## 2. Session identifiers

- >= 128 bits of entropy from a CSPRNG; use the framework's generator, never build your own from user ID/time.
- Treat the ID as a credential: store only a hash of it server-side if the store could leak (optional but cheap).
- Never accept session IDs from URLs or query strings; cookies (or `Authorization` header for APIs) only.
- Reject unknown IDs instead of creating a session with the client-supplied value (fixation).

## 3. Rotation

Issue a **new** session ID and invalidate the old one on:
- login (always; this is the fixation defence),
- privilege change (MFA completed, role elevation, sudo mode, impersonation start/stop),
- password or email change.

Framework hooks: Django `login()` cycles the key automatically (`request.session.cycle_key()` for other cases);
Express `req.session.regenerate()`; Spring Security session fixation protection (`changeSessionId`, default on);
Rails `reset_session`; ASP.NET Core issues a new auth cookie on `SignInAsync`.

## 4. Timeouts

- **Idle timeout:** 15-30 min for sensitive apps, longer for low-risk; enforced server-side by last-activity timestamp.
- **Absolute timeout:** e.g. 8-24 h regardless of activity, then re-authenticate.
- **Re-authentication** for sensitive actions (change password/email, add payment method, create API key, delete
  account) even inside a valid session, or require recent auth (`auth_time` within N minutes).
- Refresh tokens: absolute lifetime (e.g. 30-90 days), rotate on every use, detect reuse and revoke the family.

## 5. Revocation and logout

- Logout deletes the server-side session and clears the cookie (same name, path, domain; `Max-Age=0`).
- "Log out of all devices" and password reset revoke every session of the user. Keep a per-user session index or a
  `session_version` counter checked on each request.
- For JWT access tokens: keep TTL short (5-15 min) and check a revocation signal (user `token_version`, denylist by
  `jti`) on high-risk endpoints.
- Admin ability to kill a user's sessions; disabling an account kills its sessions immediately.

## 6. Cookie attributes

Session cookie baseline (see `cookie-security-attributes`):

```
Set-Cookie: __Host-session=<id>; Path=/; Secure; HttpOnly; SameSite=Lax
```

`SameSite=Strict` for admin apps where cross-site navigation into a logged-in state is not needed.

## 7. Binding and anomaly signals

- Do not hard-bind sessions to IP (mobile users roam); do record IP/user agent per session and show active sessions
  to the user.
- Alert or step-up auth on impossible travel or sudden device change for high-value accounts.
- Device-bound session credentials (DBSC) and token binding are emerging; consider them where supported, not as the
  only control.

## 8. CSRF

Cookie-authenticated state-changing requests need CSRF protection: `SameSite=Lax/Strict` plus the framework's CSRF
token, or verify `Origin`/`Sec-Fetch-Site` headers. Never use GET for state changes.

## Review checklist

- [ ] Session ID regenerated on login and privilege change.
- [ ] Idle and absolute timeouts enforced server-side.
- [ ] Logout invalidates server state, not just the cookie.
- [ ] Password reset / account disable revokes all sessions.
- [ ] No session tokens in URLs, logs, analytics or error reports.
- [ ] Cookie has `Secure`, `HttpOnly`, `SameSite`, and `__Host-` prefix where possible.
- [ ] Refresh tokens rotate and reuse is detected.
- [ ] Pending-MFA state cannot call protected APIs.

## Pitfalls

- "Remember me" implemented as a non-expiring session instead of a separate, revocable long-lived token.
- Session data deserialised from a client-side cookie with an unsafe format (pickle/Java serialization): see
  `unsafe-deserialization-prevention`.
- Signing secret for cookie sessions shared across environments or committed to the repo.
- Websocket connections staying alive after logout because auth was only checked at connect time.
