---
name: ts-runtime-validation
description: Validate untrusted data at TypeScript boundaries (HTTP bodies, API responses, env vars, JSON, storage, messages) with Zod or Valibot and derive static types from the schemas instead of casting. Use when code does `as SomeType` on external data, when adding an endpoint or config loader, or when choosing a validation library.
---

# Runtime validation at TypeScript boundaries

TypeScript types vanish at runtime. Anything that enters the process from outside is `unknown` until a schema checks it.
Define the schema once, derive the type from it, and parse at the edge so the inside of the app can trust its types.

## Where to validate

- Incoming HTTP request bodies, query strings, params, headers.
- Responses from third-party APIs (they change without telling you).
- `process.env` / config files - at startup, fail fast.
- `JSON.parse`, `localStorage`, URL search params, `postMessage`, queue/webhook payloads, file uploads.
- Not needed: values produced by your own typed code in the same process.

## Library choice

| Library | Choose when |
| --- | --- |
| **Zod** (v4) | default; largest ecosystem (tRPC, react-hook-form, OpenAPI generators) |
| **Valibot** (v1) | bundle size matters (browser, edge); tree-shakable functional API |
| ArkType / others | already in use |

Many frameworks accept any **Standard Schema** compatible validator (Zod, Valibot, ArkType implement it), so the choice
is rarely locked in. Pick one per codebase.

## Zod

```ts
import * as z from "zod";

export const CreateUser = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(100),
  age: z.number().int().min(13).optional(),
  role: z.enum(["member", "admin"]).default("member"),
});
export type CreateUser = z.infer<typeof CreateUser>;      // output type (after defaults/transforms)
export type CreateUserInput = z.input<typeof CreateUser>; // what callers may send

const result = CreateUser.safeParse(await req.json());
if (!result.success) {
  return Response.json({ error: z.flattenError(result.error) }, { status: 400 });
}
createUser(result.data);   // fully typed, defaults applied
```

- `parse` throws, `safeParse` returns a result; use `safeParse` in request handlers, `parse` at startup.
- Unknown keys are stripped by `z.object` by default; use `z.strictObject` to reject them (good for config, catches
  typos).
- Unions of objects: `z.discriminatedUnion("type", [A, B])` for fast checks and clear errors.
- Query strings/forms are strings: `z.coerce.number()`, or explicit `.transform`.
- Cross-field rules: `.refine` / `.superRefine` with a `path` so the error points at the right field.

## Valibot

```ts
import * as v from "valibot";

export const CreateUser = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(100)),
  age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(13))),
});
export type CreateUser = v.InferOutput<typeof CreateUser>;

const result = v.safeParse(CreateUser, body);
if (!result.success) return badRequest(v.flatten(result.issues));
use(result.output);
```

## Env config (fail at boot)

```ts
const Env = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]),
});
export const env = Env.parse(process.env);   // crash on startup with a clear message, not at 3am
```

## Third-party API responses

```ts
async function getRepo(name: string) {
  const res = await fetch(`https://api.example.com/repos/${name}`);
  if (!res.ok) throw new HttpError(res.status);
  return Repo.parse(await res.json());          // never `as Repo`
}
```

Validate only the fields you use (objects strip the rest), so harmless upstream additions don't break you.

## Design rules

- Schema is the source of truth; never maintain a parallel hand-written `interface` for the same shape.
- Name schema and type the same (`User` value + `User` type) or use a suffix convention (`UserSchema`); be consistent.
- Separate input schemas (what clients send) from domain/output types (with ids, timestamps).
- Parse once at the boundary, then pass the typed value inward; don't re-validate in every layer.
- Return all issues to clients (field paths + messages), not just the first.
- Transform to domain types at the edge (`.transform(s => new Date(s))`) so internals never see raw strings.

## Pitfalls

- `as` after `JSON.parse` or `res.json()` - the bug this skill exists to remove.
- `z.any()` / `v.any()` in a schema re-opens the hole; use `unknown` and validate later.
- Validating on the client only. The server must validate; client-side is UX.
- Huge schemas recompiled per request: define schemas at module level.
- Error messages leaking internals; map issues to user-facing messages.
- Mixing Zod v3 and v4 APIs from old examples; check the installed major (`npm ls zod`).

## Checklist

- [ ] Every external input passes through a schema before use.
- [ ] Types are `infer`red from schemas; no duplicate interfaces.
- [ ] Env parsed at startup.
- [ ] No `as` on external data; `unknown` until parsed.
- [ ] 400 responses include structured issues.
