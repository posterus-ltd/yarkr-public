---
name: ts-narrowing-unions
description: Model domain states in TypeScript with discriminated unions, exhaustive switches checked by never, type guards, assertion functions and satisfies. Use when a type has optional fields that only make sense together, when handling states/events/results, or when adding a variant must force every handler to update.
---

# Discriminated unions and narrowing

Make illegal states unrepresentable: instead of one type with many optional fields, define one variant per state, each
with a literal `kind` (or `type`/`status`) tag.

## From optional soup to a union

```ts
// before: which combinations are valid?
type Request = { status: string; data?: User; error?: string; startedAt?: number };

// after
type Request =
  | { status: "idle" }
  | { status: "loading"; startedAt: number }
  | { status: "success"; data: User }
  | { status: "error"; error: string; retryable: boolean };
```

Rules for the tag:

- A literal type (`"success"`, not `string`), present on every variant, same property name.
- `readonly` where the value is never reassigned.
- Shared fields go in an intersection or base type only if they really apply to every variant.

## Exhaustive handling

```ts
function render(r: Request): string {
  switch (r.status) {
    case "idle": return "";
    case "loading": return `since ${r.startedAt}`;
    case "success": return r.data.name;          // r narrowed to the success variant
    case "error": return r.error;
    default: return assertNever(r);
  }
}

function assertNever(x: never): never {
  throw new Error(`Unhandled variant: ${JSON.stringify(x)}`);
}
```

Adding a variant now produces a compile error at every switch that misses it. Prefer this over a `Record` lookup with
optional handlers. For maps of handlers, require all keys:

```ts
const labels = {
  idle: "Idle", loading: "Loading", success: "Done", error: "Failed",
} satisfies Record<Request["status"], string>;
```

## Narrowing tools

| Tool | Use |
| --- | --- |
| `switch`/`if` on the tag | the default for discriminated unions |
| `typeof x === "string"` | primitives |
| `x instanceof Date` | classes |
| `"field" in x` | structural unions without a tag (narrows on property presence) |
| `Array.isArray(x)` | arrays (note: `readonly T[]` needs care) |
| `x != null` | removes both `null` and `undefined` |
| user-defined guard `(x): x is T` | reusable checks, filters |
| assertion function `asserts x is T` | validate-or-throw, narrows after the call |

```ts
function isError(r: Request): r is Extract<Request, { status: "error" }> {
  return r.status === "error";
}

function assertDefined<T>(v: T, msg: string): asserts v is NonNullable<T> {
  if (v == null) throw new Error(msg);
}
```

A type guard is trusted, not checked: if its body is wrong, the compiler believes it anyway. Keep guards trivial and
tested. Since TS 5.5, simple arrow functions like `x => x !== undefined` infer a predicate automatically.

## satisfies vs annotation vs as

```ts
const routes = { home: "/", user: "/u/:id" } satisfies Record<string, `/${string}`>;
routes.user;          // keys preserved, literal types preserved, shape checked

const r: Record<string, string> = { home: "/" };   // annotation widens: r.anything is allowed
const bad = {} as Config;                          // assertion: no check at all
```

Use `satisfies` for config objects and lookup tables; annotation for function parameters/returns; `as` almost never.

## Result types instead of throwing (where it fits)

```ts
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };

const r = parsePort(input);
if (!r.ok) return log(r.error);
use(r.value);          // number
```

Use for expected failures (validation, parsing); keep exceptions for bugs and truly exceptional I/O.

## Pitfalls

- Destructuring the tag before checking (`const { status } = r; if (status === ...)`) narrowed only in newer TS
  versions and only for `const` destructuring; checking `r.status` directly always works.
- Narrowing is lost across callbacks and after `await` for mutable `let` variables and object properties. Copy to a
  `const` first.
- `string` tags (non-literal) silently disable narrowing; check API types coming from JSON/codegen.
- Optional tag (`kind?: "a"`) breaks exhaustiveness. Make it required.
- `default:` branches that return a fallback instead of `assertNever` defeat the exhaustiveness check.
- Booleans as tags work (`ok: true/false`) but stop scaling past two states; switch to string literals.

## Checklist

- [ ] Every state with distinct data is its own variant with a literal tag.
- [ ] Every switch over a union ends in `assertNever`.
- [ ] Lookup tables use `satisfies Record<Union["tag"], ...>`.
- [ ] Guards are one-liners with tests; no `as` to "narrow".
