---
name: ts-generics
description: Write TypeScript generics that infer well - when to add a type parameter, constraints, defaults, const type parameters, NoInfer, and avoiding over-generic signatures. Use when designing reusable functions, hooks, or library APIs, when callers must pass explicit type arguments, or when inferred types come out as unknown or too wide.
---

# TypeScript generics that infer well

A good generic is invisible at the call site: callers never write `<...>` and get precise types back.

## When to add a type parameter

Add one only if it **relates two or more positions** (param to param, or param to return). A type parameter used once is
just a slower `unknown`.

```ts
function first<T>(xs: readonly T[]): T | undefined { return xs[0]; }   // T links input and output: good

function log<T>(x: T): void { console.log(x); }                          // T used once: use `x: unknown`

function parse<T>(json: string): T { return JSON.parse(json); }          // return-only T: a hidden cast; avoid
```

For return-only generics, take a schema/decoder argument so the type comes from a value
(`parse(json, UserSchema)`).

## Constrain, don't cast

```ts
function pluck<T, K extends keyof T>(items: readonly T[], key: K): T[K][] {
  return items.map(i => i[key]);
}

function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b;
}
```

- Constrain to the minimum the body needs.
- Infer from the most specific position: put `T` on the "data" param, derive others from it.
- Use `readonly T[]` for inputs so callers can pass readonly arrays and tuples.

## Inference helpers

`const` type parameters (TS 5.0) keep literal types without callers writing `as const`:

```ts
function routes<const T extends readonly string[]>(paths: T): T { return paths; }
const r = routes(["/", "/users"]);     // readonly ["/", "/users"]
```

`NoInfer` (TS 5.4) stops a parameter from contributing to inference:

```ts
function createFSM<S extends string>(states: S[], initial: NoInfer<S>) { ... }
createFSM(["idle", "busy"], "done");   // error: "done" is not "idle" | "busy"
```

Defaults for optional type parameters:

```ts
type ApiResponse<TData = unknown, TError = ApiError> = { data?: TData; error?: TError };
```

## Prefer simpler tools first

| Need | Use |
| --- | --- |
| Accept several unrelated types, return a fixed type | union parameter |
| Different return types per input type, few cases | overloads (2-4), or a discriminated union input |
| Return type follows input type | generic |
| Transform an object's keys/values | mapped type `{ [K in keyof T]: ... }` |
| Pick a type based on another | conditional type, sparingly |

Conditional types inside function return types often force casts in the body. If the implementation needs `as`,
consider overloads instead.

## Generic React components and hooks

```tsx
type ListProps<T> = { items: readonly T[]; render: (item: T) => React.ReactNode; getKey: (item: T) => string };
function List<T>({ items, render, getKey }: ListProps<T>) { ... }

<List items={users} getKey={u => u.id} render={u => u.name} />   // T inferred as User
```

In `.tsx` arrow functions write `<T,>(...)` to avoid JSX parsing ambiguity.

## Reading inference failures

- Result is `unknown`: nothing in the arguments mentions `T`; restructure so a value carries the type.
- Result is too wide (`string` instead of `"a"`): add `const` type parameter, or constrain `T extends string`.
- Wrong candidate wins (from a callback): wrap the lesser position in `NoInfer`, or reorder so the data parameter comes
  first.
- Callers forced to write `fn<User>(...)`: the API is not inferring; fix the signature, not the callers.

## Pitfalls

- Over-generic signatures (`<T, U, V, W>`) that mirror implementation details; keep public APIs to one or two params.
- `T extends any` / `T extends object` constraints that add nothing.
- Returning `T` when you create a new object (`{ ...x, id }`): the return type is `T & { id: string }`, not `T`
  (`T` could have a narrower `id`).
- Deep recursive conditional types slow the compiler and editor; measure with `tsc --extendedDiagnostics`.
- Using `Function` or `(...args: any[]) => any`; use `(...args: never[]) => unknown` for "any function" constraints,
  or a precise signature.

## Checklist

- [ ] Every type parameter appears at least twice.
- [ ] Callers never pass explicit type arguments in normal use.
- [ ] Constraints are minimal and specific; no casts in the body.
- [ ] Hover the call site in tests/examples to confirm the inferred types.
