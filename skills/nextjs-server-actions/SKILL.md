---
name: nextjs-server-actions
description: 'Write Next.js Server Actions safely: schema validation, auth and authorisation in every action, revalidation, redirects, and progressive-enhancement forms with useActionState. Use when adding a form or mutation to an App Router app or reviewing ''use server'' code.'
---

# Next.js Server Actions

A Server Action is an async function marked `'use server'`. Next.js exposes it as a **public POST endpoint** with an
unguessable ID. Treat every action like an API route: anyone can call it with any payload.

## 1. Where to define them

- Preferred: a dedicated file `app/<feature>/actions.ts` with `'use server'` at the top. Every export becomes an action;
  export only async functions.
- Inline in a Server Component with `'use server'` as the function's first line, for one-off forms. Closed-over
  variables are encrypted and sent to the client, so don't close over secrets.
- Client Components can import actions from a `'use server'` file, but can't define them.

## 2. The action template

```ts
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

const Schema = z.object({ title: z.string().trim().min(1).max(200), projectId: z.string().uuid() });

export type State = { ok: boolean; errors?: Record<string, string[]>; message?: string };

export async function createTask(prev: State, formData: FormData): Promise<State> {
  const session = await getSession();                       // 1. authenticate
  if (!session) return { ok: false, message: 'Sign in again.' };

  const parsed = Schema.safeParse(Object.fromEntries(formData)); // 2. validate
  if (!parsed.success) return { ok: false, errors: parsed.error.flatten().fieldErrors };

  const project = await db.project.findUnique({ where: { id: parsed.data.projectId } });
  if (!project || project.ownerId !== session.userId)        // 3. authorise the specific resource
    return { ok: false, message: 'Not allowed.' };

  try {
    await db.task.create({ data: { title: parsed.data.title, projectId: project.id } }); // 4. mutate
  } catch {
    return { ok: false, message: 'Could not save. Try again.' };
  }
  revalidatePath(`/projects/${project.id}`);                 // 5. refresh caches
  redirect(`/projects/${project.id}`);                       // 6. navigate (outside try/catch)
}
```

Rules that follow from it:
- Authenticate **and** authorise inside the action. Middleware/proxy and page-level checks don't protect the action.
- Never trust IDs, prices, roles or owner fields from `formData`; look them up server-side.
- `redirect()` and `notFound()` work by throwing. Call them **after** the try/catch, or rethrow with
  `unstable_rethrow(err)` if you must catch broadly.
- Return plain serialisable objects for expected errors; throw only for unexpected ones (caught by `error.tsx`).

## 3. Forms with progressive enhancement

```tsx
'use client';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createTask, type State } from './actions';

function Submit() {
  const { pending } = useFormStatus();          // must be in a child of <form>
  return <button type="submit" aria-disabled={pending}>{pending ? 'Saving...' : 'Save'}</button>;
}

export function TaskForm({ projectId }: { projectId: string }) {
  const [state, formAction] = useActionState<State, FormData>(createTask, { ok: false });
  return (
    <form action={formAction}>
      <input type="hidden" name="projectId" value={projectId} />
      <label htmlFor="title">Title</label>
      <input id="title" name="title" aria-invalid={!!state.errors?.title} aria-describedby="title-err" />
      <p id="title-err">{state.errors?.title?.[0]}</p>
      <p role="status">{state.message}</p>
      <Submit />
    </form>
  );
}
```

- `<form action={serverAction}>` submits without JavaScript when rendered from a Server Component, and from a client
  component with `useActionState` once hydrated.
- `useActionState` is from `react` (the old `useFormState` from `react-dom` is gone).
- Pass extra arguments with `action.bind(null, id)` instead of hidden inputs when the value must not be editable in the
  DOM (it is still client-supplied, so still authorise it).
- Use `useOptimistic` for instant UI on likes/toggles; the real state arrives with the revalidated render.

## 4. Revalidation after a mutation

- `revalidatePath('/projects/123')` - re-render that path on next visit. `revalidatePath('/projects/[id]', 'page')` for
  every instance of a dynamic route.
- `revalidateTag('tasks', 'max')` - stale-while-revalidate for everything tagged `tasks` (Next 16 wants the profile
  argument; Next 15 takes only the tag).
- Next 16: `updateTag('tasks')` inside a Server Action expires the tag immediately so the user sees their own write
  (read-your-writes). `refresh()` from `next/cache` refreshes uncached data on the current page.
- Revalidate the **narrowest** scope that covers what changed. See `nextjs-caching-revalidation`.

## 5. Limits and configuration

- Default body limit is 1 MB; raise with `experimental.serverActions.bodySizeLimit` (`'5mb'`) only for upload forms,
  or upload directly to object storage with a presigned URL instead.
- Actions check `Origin` against `Host`. Behind a proxy with a different host, set
  `experimental.serverActions.allowedOrigins`.
- Actions run sequentially per client and aren't meant for data fetching; read data in Server Components.
- Rate-limit expensive or abuse-prone actions (signup, email sends) by user or IP.

## 6. Pitfalls

- Missing auth check because "the page is protected".
- Exporting a non-async value or a constant from a `'use server'` file: build error.
- Wrapping `redirect()` in try/catch and swallowing it.
- Forgetting revalidation, so the UI shows stale data until a refresh.
- Disabling the submit button with `disabled` while pending: removes it from tab order; prefer `aria-disabled` and
  ignore repeat submits.
- Returning the raw DB error message to the client.

## Checklist

- [ ] Every action authenticates, validates with a schema, and authorises the specific resource.
- [ ] No trusted values (prices, roles, owner IDs) are read from the client.
- [ ] Mutations revalidate the narrowest path/tag; redirects sit outside try/catch.
- [ ] Forms work without JS where rendered server-side; errors are tied to fields and announced.
- [ ] Abuse-prone actions are rate-limited.
