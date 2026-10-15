---
name: journal-entry-drafting
description: Draft balanced journal entries with accounts, debits, credits, dimensions, memo, support reference and reversal flag from a described business event. Use for accruals, reclasses, corrections, adjustments from flux or recs, or when converting a calculation into an ERP-ready upload.
---

# Journal entry drafting

Turn a business event or a calculation into a journal entry a reviewer can approve without asking anything. A JE
draft is a proposal: the accountant checks it against the chart of accounts and the controller approves it under
the company's approval thresholds before posting.

## Gather before drafting

1. The event: what happened, when, with whom, and for which period.
2. The chart of accounts (or at least the relevant accounts) and required dimensions (entity, department, cost
   centre, project, class, location).
3. Amount and currency, with the calculation or source document.
4. Whether it is recurring, reversing, or a one-off correction.

If an account is unknown, propose one and mark it "confirm account" instead of inventing a number.

## Analyse the entry

Ask four questions:

1. Which balance sheet accounts change? (Cash, receivable, payable, prepaid, accrual, deferred revenue, asset.)
2. Is there income or expense, and in which period does it belong?
3. Increase or decrease for each? Assets and expenses increase with debits; liabilities, equity and revenue
   increase with credits.
4. Does it reverse next period? Estimates (accruals) usually auto-reverse; corrections and reclasses do not.

## Common patterns

| Event | Debit | Credit | Reverse? |
| --- | --- | --- | --- |
| Expense accrual | Expense | Accrued liabilities | Yes |
| Prepaid amortisation | Expense | Prepaid | No |
| Deferred revenue release | Deferred revenue | Revenue | No |
| Unbilled revenue | Unbilled receivable | Revenue | Usually yes |
| Depreciation | Depreciation expense | Accumulated depreciation | No |
| Reclass miscoded expense | Correct expense account | Wrong expense account | No |
| Bonus accrual | Bonus expense | Accrued bonus | No (roll-forward, true up) |
| Bad debt reserve increase | Bad debt expense | Allowance for doubtful accounts | No |
| Intercompany recharge | Due from affiliate (A) / Expense (B) | Expense recovery (A) / Due to affiliate (B) | No |
| FX revaluation gain | Monetary asset | Unrealised FX gain | Yes, if policy |

## Draft format

```
JE title:      Mar-26 Legal fees accrual – Smith LLP
Entity:        US01           Period: 2026-03    Date: 2026-03-31
Type:          Accrual        Reverse: Yes, 2026-04-01
Prepared by:   <name>         Support: Smith LLP engagement letter; partner email 2026-04-02 est. hours

Line  Account                     Dept   Debit       Credit      Memo
1     6410 Legal fees             G&A    18,500.00               Mar services, est. 37h × 500
2     2150 Accrued liabilities    -                  18,500.00   Smith LLP Mar accrual
                                         ---------   ---------
Totals                                   18,500.00   18,500.00
```

Rules:

- Debits equal credits per entity and per currency. State the totals.
- Each line memo says what and which period; the header memo says why.
- Every JE names its support document. "Per controller" alone is not support.
- Amounts to two decimals; no negative amounts in debit/credit columns (use the opposite column).
- Multi-entity events produce one JE per entity, with intercompany accounts balancing each side.
- Use the period-end date for period-end entries; reversals dated the first day of next period.

## Corrections

When fixing an error, reference the original JE number and reverse precisely what was wrong:

- Wrong account, right amount: one reclass entry moving the amount.
- Wrong amount: adjust the difference, or reverse in full and re-post if the original is confusing.
- Wrong period, and the prior period is closed: post in the current period, flag for the controller if above
  materiality (it may need disclosure or a prior-period adjustment decision).

## ERP upload

When the user wants an import file, produce CSV with the ERP's columns. Common columns: `journal_id, date, entity,
account, department, class, location, debit, credit, memo, reversal_date`. Lines in the same journal share a
`journal_id`. Keep account numbers as text to preserve leading zeros.

## Review checklist

- Balanced; correct entity and period; period is open.
- Accounts exist and are active; dimensions required by the account are filled.
- Reversal flag matches the nature of the entry.
- Not a duplicate of an existing recurring or auto-generated entry (check prior month JEs with the same vendor).
- Approval level matches the amount under the company's authority matrix.
- Manual entries to sub-ledger control accounts (AR, AP, cash) are justified; they break sub-ledger reconciliations.

## Pitfalls

- Posting to AR/AP control accounts directly instead of through the sub-ledger.
- Accrual with no reversal, then the invoice books the expense again.
- Plug lines to make an entry balance.
- Memos like "adj" or "per discussion".
