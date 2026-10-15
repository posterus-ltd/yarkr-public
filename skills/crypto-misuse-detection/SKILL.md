---
name: crypto-misuse-detection
description: Detect cryptographic misuse in code (ECB mode, static or reused IVs/nonces, weak hashes, homemade crypto, bad randomness, disabled TLS verification, weak password hashing) and replace it with vetted primitives. Use when reviewing code that encrypts, hashes, signs, generates tokens or makes TLS connections.
---

# Crypto misuse detection

Most crypto bugs are API misuse, not broken algorithms. Find the call sites, check each against the rules below,
and fix by switching to a high-level, misuse-resistant API rather than patching parameters.

## 1. Find the call sites

```bash
rg -n -i -e 'AES|DES|RC4|Blowfish|Cipher\.getInstance|createCipheriv|crypto/cipher|Crypto\.Cipher|EVP_' \
         -e 'md5|sha1|SHA-1|MessageDigest|hashlib\.' \
         -e 'Math\.random|random\.random|rand\(|math/rand|java\.util\.Random|mt_rand' \
         -e 'verify\s*=\s*False|InsecureSkipVerify|rejectUnauthorized\s*:\s*false|CERT_NONE|check_hostname\s*=\s*False|TrustAllCerts|ALLOW_ALL_HOSTNAME' \
         -e 'jwt\.decode|verify_signature|algorithms\s*=' -e 'bcrypt|scrypt|argon2|pbkdf2'
```

## 2. Rules and what to flag

### Encryption
| Flag | Why | Fix |
| --- | --- | --- |
| ECB mode (`AES/ECB`, `MODE_ECB`, Java `Cipher.getInstance("AES")` which defaults to ECB) | leaks plaintext patterns | AES-GCM or ChaCha20-Poly1305 |
| CBC/CTR without a MAC | malleable, padding oracles | AEAD (GCM, ChaCha20-Poly1305) |
| Static, zero or derived-from-key IV/nonce | nonce reuse breaks GCM/CTR entirely | random 96-bit nonce per message via CSPRNG, stored with ciphertext; or use XChaCha20 / a library that manages nonces |
| DES, 3DES, RC4, Blowfish | weak or deprecated | AES-256-GCM |
| Key as a hard-coded string or derived with a plain hash of a password | guessable key | key from KMS/secrets manager; password-based keys via Argon2id/scrypt/PBKDF2 with salt |
| Hand-rolled constructions (XOR "encryption", custom MAC = hash(key+msg)) | broken | libsodium / Tink / `cryptography` Fernet or AESGCM; HMAC |

Prefer high-level libraries: libsodium (`crypto_secretbox`, `crypto_aead_*`), Google Tink, Python `cryptography`
(`Fernet`, `AESGCM`), Go `crypto/cipher` AEAD or `golang.org/x/crypto/nacl/secretbox`, Web Crypto `AES-GCM`.

### Hashing and passwords
- MD5/SHA-1 used for anything security-relevant (signatures, integrity of untrusted data, tokens) -> SHA-256 or better.
  MD5 for non-security checksums/cache keys is fine; say so instead of flagging.
- Passwords hashed with fast hashes (SHA-*, MD5, even salted) -> **Argon2id** (preferred), scrypt, or bcrypt
  (cost >= 10; note bcrypt's 72-byte input limit). PBKDF2-HMAC-SHA256 only where FIPS requires it, with a high
  iteration count per current OWASP guidance.
- Unsalted or global-salt hashes -> per-user random salt (the libraries above do this).
- MAC via `hash(secret + data)` -> HMAC-SHA256.

### Randomness
- Tokens, session IDs, reset codes, nonces, keys from non-CSPRNG (`Math.random`, `random`, `math/rand`,
  `java.util.Random`, time-seeded generators) -> `secrets.token_urlsafe(32)`, `crypto.randomBytes`/`crypto.randomUUID`,
  Go `crypto/rand`, Java `SecureRandom`.
- UUIDv1 or sequential IDs used as unguessable secrets -> random tokens with >= 128 bits.

### Comparison
- `==` on MACs, tokens or hashes -> `hmac.compare_digest`, `crypto.timingSafeEqual`, `subtle.ConstantTimeCompare`,
  `MessageDigest.isEqual`.

### TLS
- Verification disabled anywhere outside an isolated test (`verify=False`, `InsecureSkipVerify: true`,
  `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`, trust-all managers) -> remove; for private CAs,
  configure the CA bundle explicitly.
- Minimum TLS version below 1.2, or custom cipher lists with CBC/RC4/export suites -> library defaults or TLS 1.2+.

### Signatures and JWT
- `jwt.decode(..., verify=False)` / `options={"verify_signature": False}` on untrusted tokens.
- Algorithm taken from the token header; `none` allowed; HS256 verified with an RSA public key -> pin `algorithms=[...]`.
- RSA PKCS#1 v1.5 encryption for new designs -> RSA-OAEP or, better, hybrid with X25519.

## 3. Key management checks

- Keys never in source, images or logs; loaded from KMS / secrets manager.
- Separate keys per purpose (encryption vs MAC vs signing) and per environment.
- Rotation story exists: ciphertexts carry a key ID so old data can be decrypted after rotation.
- Envelope encryption for large data: data key encrypted by KMS key.

## 4. Decision rules

- Severity depends on what is protected and who controls input: static nonce on GCM with attacker-observable
  ciphertexts is **high**; MD5 on a cache key is not a finding.
- Recommend a library swap, not parameter tweaks, when more than one rule is broken in the same code.
- Never recommend inventing a construction; if no vetted API fits, escalate to a cryptography owner.

## Pitfalls

- Java/Android `Cipher.getInstance("AES")` silently means ECB with PKCS5 padding.
- Node `crypto.createCipher` (deprecated, removed) derived keys and IVs insecurely; use `createCipheriv` with AEAD.
- Python `random.SystemRandom` is OK; `random.seed()` + `random.random()` is not.
- Base64 or hex encoding is not encryption; neither is compression.
- Truncating HMAC/GCM tags below 128 bits without a reason.
