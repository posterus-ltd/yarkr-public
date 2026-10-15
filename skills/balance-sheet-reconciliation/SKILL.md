---
name: balance-sheet-reconciliation
description: Reconcile balance sheet accounts (cash, AR, prepaids, accruals, payroll liabilities, intercompany, suspense) to supporting detail, explain differences, age reconciling items and flag stale balances. Use at month-end, for rec review, or before an audit.
---

# Balance sheet account reconciliation

A reconciliation proves the GL balance is supported by independent detail and that every difference is explained,
aged and owned. Outputs are working papers for the accountant; a reviewer signs off each one.

## Risk-rate accounts first

Not every account needs the same depth. Rate each account and set frequency:

| Risk | Examples | Frequency |
| --- | --- | --- |
| High | Cash, AR, AP, accrued liabilities, deferred revenue, payroll liabilities, intercompany, suspense/clearing | Monthly |
| Medium | Prepaids, fixed assets, sales tax payable, inventory | Monthly or quarterly |
| Low | Deposits, dormant accounts, equity | Quarterly; monthly zero-balance check |

Any account with activity above materiality this month gets reconciled regardless of rating.

## Support source by account

| Account | Independent support |
| --- | --- |
| Cash | Bank statement closing balance |
| AR / AP | Sub-ledger aged trial balance (tie the total; review aging) |
| Prepaids | Amortisation schedule |
| Accrued liabilities | Accrual schedule plus roll-forward |
| Deferred revenue | Billing system deferred revenue waterfall |
| Payroll liabilities | Payroll provider liability report; subsequent payment |
| Fixed assets | Fixed asset register roll-forward (opening + additions − disposals − depreciation) |
| Sales tax / VAT | Tax return workpaper or tax engine report |
| Intercompany | Counterparty entity's balance (must be equal and opposite) |
| Clearing / suspense | Item-level listing; target balance is zero |

## Procedure

1. Pull the GL balance at period end from the closed trial balance (after all journals for the period).
2. Pull the support balance as of the same date. Note the report name and run time.
3. Compute difference = GL − support.
4. Explain the difference with reconciling items. Each item needs: description, amount, date originated, category,
   owner, expected resolution and date.
5. Unexplained difference must be zero. If not, keep investigating; do not plug.
6. Age every reconciling item: 0–30, 31–60, 61–90, 90+ days.
7. Prepare the roll-forward for accounts where activity matters (opening + additions − releases = closing).
8. Sign as preparer with date; route to reviewer.

## Reconciling item categories

- **Timing**: deposits in transit, outstanding cheques, invoices posted in GL but not sub-ledger. Should clear
  next period.
- **Error requiring adjustment**: miscoding, duplicate posting. Book the correcting journal this period if above
  threshold; otherwise document and fix next period.
- **Permanent / unresolved**: requires write-off approval per policy.

Bank example:

```
Balance per bank statement            125,400.00
+ Deposits in transit (2 items)         8,200.00
− Outstanding payments (5 items)      (14,950.00)
= Adjusted bank balance               118,650.00
Balance per GL                        118,650.00
Unexplained difference                      0.00
```

## Investigating a difference

Work from cheap to expensive:

1. Is the difference exactly a single transaction amount? Search the GL and sub-ledger for it.
2. Is it divisible by 9? Often a transposition (e.g. 5,430 vs 5,340: difference 90).
3. Is it twice an amount? A sign error (posted debit instead of credit).
4. Compare period activity GL vs sub-ledger by day to find the date it diverged.
5. Check manual journals hitting a sub-ledger-controlled account (they bypass the sub-ledger).
6. Check FX: revaluation posted in GL but not in sub-ledger or vice versa.

## Stale balance flags

Flag for the reviewer:

- Reconciling items older than 60 days (90 for low-risk accounts).
- Any balance in a clearing or suspense account at period end.
- Accounts with an unchanged balance for 3+ months (possibly dead; propose write-off or reclass).
- Debit balances in liability accounts or credit balances in asset accounts.
- Prepaid or accrual lines past their end date still carrying a balance.

## Reviewer checklist

- Support is independent of the GL and dated period end.
- GL balance matches the final trial balance.
- No plugs or "unexplained" lines.
- Aged items have owners and resolution dates; prior month's items show what happened.
- Adjusting entries above threshold were booked, with JE numbers referenced.

## Output format

Per account: header (entity, account, period, preparer, reviewer), GL balance, support balance, reconciling items
table with aging, unexplained difference, proposed adjusting entries, flags. Then a summary across accounts:
status (reconciled / exceptions / not started), total aged items over 60 days, and proposed journals.

## Pitfalls

- Reconciling to a report run before final journals posted.
- Using a GL report as "support" for the GL.
- Carrying the same reconciling item for months with a note "to be investigated".
- Netting unrelated items so the difference looks small.
