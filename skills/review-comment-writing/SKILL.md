---
name: review-comment-writing
description: Write code review comments that are specific, kind and actionable, each labelled blocking, suggestion, question or nit. Use when leaving PR comments, turning review findings into comments, replying to review feedback, or merging several reviewers' findings into one review.
---

# Writing review comments

A review comment is a request to a colleague. It should tell them exactly what you saw, why it matters, how
strongly you feel, and what would resolve it. Everything else is noise.

## Anatomy of a good comment

```
<label>: <what is wrong, in one sentence, about the code not the person>
<why it matters: the concrete failure, input or cost>
<what would resolve it: a fix, a suggestion block, or the question to answer>
```

Example:

```
blocking: `parseAmount` returns 0 for "1,000.50" because the comma isn't stripped.
Any invoice over 999 is recorded as free. Repro: parseAmount("1,000.50") === 0.
Strip thousands separators before parseFloat, or use Intl.NumberFormat parsing; a test with "1,000.50" would pin it.
```

## Labels

Put the label first so the author can triage at a glance. Use one consistent set across the team
(Conventional Comments style works well):

| Label | Meaning | Blocks merge? |
| --- | --- | --- |
| `blocking:` | Bug, security issue, data loss, broken contract, missing test for risky logic | yes |
| `suggestion:` | A better approach; author may decline with a reason | no |
| `question:` | You don't understand something; the answer may turn into a finding | no, unless the answer reveals a bug |
| `nit:` | Cosmetic, style, wording | never |
| `praise:` | A specific good decision worth repeating | no |
| `thought:` / `future:` | Out of scope for this PR; consider a follow-up issue | no |

If a nit is enforceable by a linter or formatter, suggest adding the rule instead of commenting each instance.

## Rules

1. **One issue per comment**, anchored to the exact line. Repeated pattern? Comment once, say "same in X, Y, Z".
2. **Be specific.** "This might have issues" is useless. Name the input, state, or sequence that breaks it.
3. **Say why.** "Use a constant here" invites argument; "this timeout is also hard-coded in retry.ts:40, and they
   must match" explains the cost.
4. **Offer a fix** when you have one. Use the platform's suggestion block for small changes:
   ````
   ```suggestion
   if (items.length === 0) return [];
   ```
   ````
   For bigger changes, describe the shape, don't write the whole thing.
5. **Talk about the code, not the person.** "This function ignores the error" not "you ignored the error".
   Avoid "just", "simply", "obviously", "why didn't you".
6. **Ask real questions** when unsure: "What happens if `user` is null here? I couldn't find a guard upstream."
   Don't use questions as sarcastic commands ("Did you even test this?").
7. **Calibrate certainty.** Say "I think" or "I may be missing context" only when true; say "This will throw when..."
   when you have verified it.
8. **Scope discipline.** Pre-existing problems the PR didn't touch go in a `future:` comment or an issue, not a
   blocking request.
9. **Keep it short.** Two to four sentences. Long essays belong in a design discussion, not a line comment.

## The summary comment

When submitting a review, write a top-level summary:

```
Request changes: two blocking issues in the retry path, otherwise looks good.

Blocking
- retry.ts:52 retries non-idempotent POSTs (duplicate charges)
- retry.ts:71 no upper bound on backoff

Suggestions: 3, nits: 4 (inline). Nice job splitting the client from the transport.
```

Verdict first, then blocking items as a list with locations, then counts of the rest.

## Rewrites of common bad comments

| Bad | Better |
| --- | --- |
| "This is wrong." | "blocking: off-by-one: `i <= len` reads past the end on the last iteration." |
| "Rename this." | "nit: `data` → `pendingInvoices`; the function handles three kinds of data and this one is ambiguous." |
| "Why not use X?" | "suggestion: `groupBy` from lodash (already a dependency) would replace lines 20-34. Fine to keep as is if you prefer explicit." |
| "Needs tests." | "blocking: no test covers the expired-token path (auth.ts:88); a test that sets `exp` in the past would catch regressions." |
| "LGTM" on a 900-line PR | "Approve. I reviewed api/ and db/ closely; skimmed ui/ (not my area); did not review generated client." |

## Replying to feedback (as author)

- Resolve each comment explicitly: "Done in abc123", "Declined because ...", or "Moved to #123".
- Don't silently resolve a reviewer's thread without a reply.
- Disagree with reasons, once. If still stuck, escalate per the team's review policy rather than looping.

## Pitfalls

- Mixing nits and blocking issues without labels: the author can't tell what must change.
- Dozens of nits on a PR with one real bug: the bug gets lost. Cap nits or batch them in the summary.
- Commenting on what you would have done differently when the author's approach is also correct.
- Leaving "+1" comments that add nothing; react instead.
