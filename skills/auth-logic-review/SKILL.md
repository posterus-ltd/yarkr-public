---
name: auth-logic-review
description: Review login, session, password reset, MFA and permission logic for bypasses, race conditions and missing checks. Use when a change touches sign-in, sign-up, token issuance, password or email change, invitations, role assignment, or any code that decides who the user is or what they may do.
---

# Auth logic review

Auth bugs are logic bugs: scanners rarely find them. Read each flow end to end and ask, at every step, "what if the
attacker skips, repeats, reorders or races this step, or supplies someone else's identifier?"

## 1. Map the flows in scope

For each flow, write down the steps and the state stored between them:

- Sign-up, email verification, login, logout
- MFA enrolment, challenge, recovery codes, "remember this device"
- Password reset, password change, email change
- Invitations, joining a team/tenant, SSO (OIDC/SAML) callback, account linking
- API key / personal token creation and revocation
- Role and permission changes, impersonation / "login as"

## 2. Login

- [ ] Same response and similar timing for unknown user vs wrong password (avoid enumeration where it matters).
- [ ] Rate limiting / lockout per account **and** per IP; lockout cannot be used to lock out arbitrary victims indefinitely.
- [ ] Password hash compared with the library's verify function (constant time), never `==` on hashes.
- [ ] New session ID issued after login (fixation); old pre-login session discarded.
- [ ] MFA is enforced server-side before a full session is issued: a "pending MFA" session must not access APIs.
- [ ] Disabled / unverified / deleted accounts cannot log in through any path (password, SSO, API key, refresh token).

## 3. Password reset and email change

- [ ] Reset token: >= 128 bits from a CSPRNG, single use, expires (15-60 min), stored hashed, bound to the user.
- [ ] Reset link host is not built from the request `Host` header (host header poisoning).
- [ ] Completing a reset invalidates all sessions and other outstanding reset tokens.
- [ ] Email change requires re-authentication and confirmation from the **new** address; notify the old one.
- [ ] Token lookup cannot be steered: `find_by(token: params[:token], email: params[:email])` where email comes from the attacker is a classic bypass.

## 4. Tokens (JWT, OAuth, API keys)

- [ ] Signature verified with a pinned algorithm list; `alg: none` and HS/RS confusion rejected.
- [ ] `exp`, `nbf`, `aud`, `iss` validated; clock skew small.
- [ ] Refresh tokens rotate on use and reuse is detected (revoke the family).
- [ ] OAuth/OIDC: `state` checked, PKCE used for public clients, `nonce` checked for ID tokens, redirect URI matched exactly (no prefix or wildcard match).
- [ ] Account linking via SSO only trusts verified emails from the IdP, and never auto-links on an unverified email claim.
- [ ] API keys stored hashed, shown once, scoped, revocable, with last-used tracking.

## 5. Authorization decisions

- [ ] Checks live in one place (policy layer / middleware) and are applied to every route, including new ones.
- [ ] Object-level checks on every read and write by ID (IDOR); see `owasp-access-control-checks`.
- [ ] Role changes: users cannot grant themselves or others a role higher than their own; last admin cannot be removed.
- [ ] Invitations: invite token bound to the invited email and tenant; accepting cannot choose a different tenant or role.
- [ ] Impersonation is logged, limited to support roles, and cannot impersonate higher-privileged users.
- [ ] Default deny: an unknown role or missing permission returns 403, not "allow".

## 6. Races and replay

Look for check-then-act sequences without a lock or a unique constraint:

```python
# vulnerable: two parallel requests both pass the check
if not coupon.redeemed:
    apply(coupon); coupon.redeemed = True; save()
# fix: atomic conditional update
rows = Coupon.objects.filter(id=cid, redeemed=False).update(redeemed=True)
if rows == 0: raise AlreadyRedeemed()
```

Apply the same lens to: one-time tokens, invite acceptance, MFA code verification (attempt counters), balance and
quota changes, "first user becomes admin" bootstrap logic.

## 7. Fail-closed behaviour

- [ ] Exceptions in the auth path deny access (no `except: pass` around a permission check).
- [ ] Unreachable IdP / policy service denies, rather than falling back to allow.
- [ ] Feature flags and maintenance modes do not bypass auth.

## Decision rules

- Any path that yields a session or token without all required factors is **critical**.
- Cross-tenant data access is **critical**; same-tenant privilege escalation is **high**.
- Username enumeration alone is **low** unless the product promises otherwise or it enables targeted lockout.
- When a check depends on code outside the diff, read it before deciding. If you cannot, mark "needs verification".

## Pitfalls

- Reviewing only the happy path. The bug is usually in the error branch, the retry or the second device.
- Trusting the frontend to hide a button. The API is the boundary.
- Assuming the SSO library validates everything: check `aud`, `nonce` and redirect handling in your own code.
- Forgetting non-HTTP entry points (CLI, admin scripts, websocket messages, background jobs) that take a user ID.
