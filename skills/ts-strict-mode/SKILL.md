---
name: ts-strict-mode
description: Write and migrate TypeScript under strict compiler settings - strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes and friends - and fix the resulting errors without any, casts or non-null assertions. Use when enabling strict flags, fixing "possibly undefined" errors, or reviewing code that silences the type checker.
---

# TypeScript under strict settings

## Recommended tsconfig baseline

```jsonc
{
  "compilerOptions": {
    "strict": true,                         // noImplicitAny, strictNullChecks, strictFunctionTypes,
                                            // strictPropertyInitialization, useUnknownInCatchVariables, ...
    "noUncheckedIndexedAccess": true,       // arr[i] and record[key] are T | undefined
    "exactOptionalPropertyTypes": true,     // `a?: string` does not accept explicit undefined
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,           // type-only imports must say `import type`
    "isolatedModules": true,
    "skipLibCheck": true
  }
}
```

The extra flags are **not** part of `strict`; enable them explicitly.

## Fix errors properly

Never "fix" with `any`, `as`, or `!` unless you can state why the compiler can't know what you know. Preferred fixes:

### "Object is possibly undefined"

```ts
const user = users.find(u => u.id === id);
if (!user) throw new NotFoundError(id);   // narrow, fail loudly
user.name;                                 // User

const first = items[0];                    // T | undefined with noUncheckedIndexedAccess
if (first === undefined) return;

const port = env.PORT ?? "3000";           // default with ??, not || (keeps "" and 0)
```

- Loops: prefer `for (const item of items)` or `.map` over index access; they yield `T`, not `T | undefined`.
- `Map.get` returns `T | undefined`: check `has`-then-`get` does **not** narrow; get once and test the value.

### `unknown` in catch

```ts
try { ... } catch (err) {
  const message = err instanceof Error ? err.message : String(err);
}
```

### Optional properties with exactOptionalPropertyTypes

```ts
type Opts = { timeout?: number };
const o: Opts = { timeout: maybe };              // error if maybe: number | undefined
const o2: Opts = maybe === undefined ? {} : { timeout: maybe };
const o3: Opts = { ...(maybe !== undefined && { timeout: maybe }) };
```

If a property is genuinely "present but undefined", type it `timeout?: number | undefined`.

### Class fields

`strictPropertyInitialization`: initialise in the constructor or at declaration. Use `!:` only for fields set by a
framework (DI, ORM hydration) and comment it.

### Third-party data

`JSON.parse`, `fetch().json()`, `localStorage`, env vars: type them `unknown` and validate (see ts-runtime-validation),
rather than `as MyType`.

## Escape hatches, ranked

1. Narrowing (`if`, `in`, `instanceof`, discriminants, type guards) - always first.
2. `satisfies` to check a value against a type without widening it.
3. An assertion function that checks at runtime (`asserts x is T`).
4. `as` on a value you just verified another way - with a comment.
5. `// @ts-expect-error <reason>` for known compiler/library limits (fails when no longer needed).
6. Never: `any`, `@ts-ignore`, `as unknown as T` to force incompatible types.

Enable `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`, `no-unsafe-*` and
`no-unnecessary-condition` (typed linting) to keep the bar.

## Migrating an existing codebase

1. Turn on flags one at a time; `strictNullChecks` produces the most errors and the most value.
2. Count errors: `npx tsc --noEmit -p . | grep -c "error TS"`. Track the number down per PR.
3. For a big repo, keep a strict `tsconfig.strict.json` that `include`s migrated folders and run both in CI, or use
   per-file opt-in tooling; widen the include as folders are fixed.
4. Fix at the source: type a function's return correctly once instead of asserting at every call site.
5. Don't sprinkle `?.` everywhere to silence errors; it hides missing data. Decide: required (throw) or optional
   (handle explicitly).

## Pitfalls

- `||` for defaults turns `0`, `""` and `false` into the default; use `??`.
- `Object.keys(obj)` returns `string[]`, not `(keyof T)[]` (objects may have extra keys). Iterate a typed key list or
  use `Object.entries` with validation.
- `array.filter(Boolean)` narrows only on TS 5.5+ inferred predicates for simple cases; use
  `.filter((x): x is T => x != null)` for clarity.
- Non-null `!` after `find`/`get` turns a compile error into a runtime crash at an unknown later point.
- Type assertions on API responses are lies the compiler believes; validate at the boundary.

## Review checklist

- [ ] No new `any`, `as` casts on external data, `!`, or `@ts-ignore`.
- [ ] Every `@ts-expect-error` has a reason.
- [ ] `undefined` is handled where it's produced, not suppressed where it's consumed.
- [ ] `??` instead of `||` for defaults.
