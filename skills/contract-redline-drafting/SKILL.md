---
name: contract-redline-drafting
description: Draft contract redlines (insertions, deletions, fallback language) with short margin comments explaining each change to the counterparty. Use when marking up counterparty paper, preparing a turn of negotiation, or proposing compromise wording. Drafting aid only; counsel approves before sending.
---

# Contract redline drafting

Turn review findings into a markup the counterparty can accept quickly: minimal, precise edits with a short reason
for each. **The redline is a draft for a qualified lawyer to approve. Do not present it as final or send it
externally without counsel sign-off.**

## Principles

1. **Edit, do not rewrite.** Change the fewest words that fix the issue. Wholesale replacement of their clause invites
   rejection and hides what changed. Replace a whole clause only when the structure is unworkable, and say why.
2. **One issue, one change, one comment.** Each edit should be traceable to a review finding.
3. **Keep their defined terms.** Use the document's capitalised terms and numbering; do not introduce new definitions
   unless needed.
4. **Mutuality is the easiest ask.** "Each party" in place of "Customer" is often accepted without discussion.
5. **Don't over-lawyer low-risk points.** Skip cosmetic edits in a counterparty draft unless they change meaning.
6. **Track every change.** Never make silent edits; the counterparty will compare and trust is lost.

## Markup conventions (plain text)

When not working in a word processor with track changes, use:

- Insertions: `[+inserted text+]`
- Deletions: `[-deleted text-]`
- Comments: `[Comment <n>: ...]` after the sentence, or in a separate comments table keyed by section.

In .docx, use real tracked changes and comments authored as the reviewing party, so the counterparty sees a normal
markup. Accept nothing in their earlier turns that you have not reviewed.

## Drafting patterns

**Make an obligation mutual**

> [-Customer-][+Each party+] shall indemnify...

**Add a cap carve-out**

> ...shall not exceed the fees paid in the twelve (12) months preceding the claim[+, provided that this limitation
> shall not apply to a party's breach of Section 8 (Confidentiality), its indemnification obligations under Section 10,
> or liability arising from fraud or wilful misconduct+].

**Qualify an absolute obligation**

> Supplier shall [+use commercially reasonable efforts to+] ensure...
>
> Use the right qualifier for the side: from the obligor side, "commercially reasonable efforts" is lighter than
> "reasonable efforts", which is lighter than "best efforts". In English law, "best endeavours" can require
> sacrificing the party's own commercial interests; flag the choice for counsel.

**Add a notice and cure period**

> ...may terminate this Agreement [+if the other party fails to cure such breach within thirty (30) days after
> written notice describing it+].

**Limit unilateral changes**

> [-Vendor may modify these Terms at any time by posting the updated Terms.-][+Vendor may update the Documentation
> provided that no update materially reduces the functionality, security or service levels of the Services.+]

**Bound an indemnity**

> ...arising from [-any use of the Services-][+Customer's breach of Section 4 (Acceptable Use) or Customer Data+].

## Fallback language

For each high or medium issue, prepare up to three tiers from the playbook:

1. **Opening**: our preferred position in the markup.
2. **Fallback**: compromise held back for the next turn (not in the markup).
3. **Walk-away**: the minimum; anything below needs escalation.

Keep fallbacks in the internal notes, never in the external comments.

## Margin comments

External comments are short, neutral and give a reason the other side can accept:

- Good: "Mutual cap reflects that both parties carry comparable risk under this Agreement."
- Good: "Added cure period consistent with Section 12.2."
- Bad: "We never accept this." / "Unacceptable." / internal reasoning about our leverage.

Internal notes (separate document) carry: the review finding, the playbook position, the fallback, and the
approver needed if we move off-standard.

## Process

1. Start from the review findings table; order edits by section number.
2. Check the definitions and cross-references each edit touches; fix knock-on references.
3. Draft edits and external comments.
4. Draft internal notes with fallbacks.
5. Re-read the full clause after edits; it must read grammatically as a whole.
6. Produce a summary of changes: section, change in one line, severity.

## Output format

1. Header: "DRAFT REDLINE – for counsel approval before sending."
2. Redlined clauses with markup and numbered external comments.
3. Internal notes table: `# | section | finding | opening | fallback | walk-away | approver`.
4. Summary of changes.

## Pitfalls

- Editing a clause and missing the same concept in a schedule or order form.
- Changing a defined term in one place only.
- Comments that reveal our walk-away position.
- Accepting a counterparty's "clean" version without running a comparison against our last turn.
