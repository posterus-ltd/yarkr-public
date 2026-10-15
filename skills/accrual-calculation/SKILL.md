---
name: accrual-calculation
description: Calculate and document expense and revenue accruals from POs, contracts, usage and timesheets, with auto-reversing entries and a support schedule. Use at month-end for goods/services received but not invoiced, unbilled revenue, bonuses, or when reviewing an accrual balance.
---

# Accrual calculation

Accruals record expenses incurred and revenue earned in the period when the invoice has not yet been posted. The goal
is a reasonable, documented estimate with an audit trail, not false precision. Output is a draft for the accountant
and controller to review; they own the final entries and judgement calls.

## Decide whether to accrue

Accrue when all of these hold:

1. The goods/service was received (expense) or delivered (revenue) on or before period end.
2. No invoice for it is posted in the period.
3. The amount can be reasonably estimated.
4. It is above the accrual threshold (commonly a fixed amount such as 1,000–5,000 in reporting currency, set by
   policy). Below threshold, let it fall into next period, but aggregate: many small items of one vendor can exceed it.

Do not accrue: future services (that is a commitment, not a liability), items already in AP, or invoices received
after period end that relate to the next period. Invoices received WD+1 to WD+3 dated or covering the closed period
should be posted to the closed period if AP is still open, otherwise accrued.

## Sources by accrual type

| Type | Source | Method |
| --- | --- | --- |
| Received-not-invoiced goods | PO receipts (GRNI report) | Receipt qty × PO price |
| Recurring services | Contract, prior invoices | Monthly fee; pro-rate partial months by days |
| Usage-based (cloud, telecom) | Usage dashboard / billing console | Period usage × contract rate, or month-to-date run rate × days |
| Professional services | Timesheets, SOW, vendor confirmation | Hours × rate, or % complete × fixed fee |
| Payroll items | Payroll calendar | Days worked after last pay date ÷ days in pay period × gross pay + employer taxes |
| Bonus / commission | Plan documents, attainment to date | Expected payout × portion of performance period elapsed |
| Unbilled revenue | Delivery/usage records, contract price | Delivered units × contract price, net of discounts |
| Utilities, rent escalations | Meter readings, lease | Last bill daily average × days |

## Calculation steps

1. Pull the candidate list: GRNI report, open POs with receipts, recurring vendors with no invoice this period,
   budget-holder responses to the cut-off email.
2. Remove anything already invoiced (match vendor + period in AP, including invoices in approval workflow).
3. Calculate each item with the method above. Keep the formula visible; never hardcode a result.
4. Apply currency: accrue in transaction currency and translate at the period-end rate if the ERP requires it.
5. Code each line: GL account (expense or revenue), cost centre/department, vendor/customer, project.
6. Tie the total of the schedule to the journal amount.

Pro-rating example: annual software support of 36,000 starting 12 March, month of March, no invoice yet.
Monthly = 3,000. Days in service = 20 of 31. Accrual = 3,000 × 20 / 31 = 1,935.48.

## Journal pattern

Expense accrual (auto-reverse on day 1 of next period):

```
Dr  6xxx  Expense (by cost centre)       1,935.48
    Cr  2xxx  Accrued liabilities             1,935.48
Memo: Mar-26 accrual – Vendor X support 12–31 Mar, contract #123. Auto-reverse 01-Apr-26.
```

Unbilled revenue:

```
Dr  1xxx  Unbilled receivables (contract asset)
    Cr  4xxx  Revenue
```

Use auto-reversal for estimate-based accruals so the actual invoice lands cleanly next month. Use a non-reversing
balance-sheet roll-forward for long-running accruals (bonus, legal) and true them up monthly instead.

## Support schedule columns

`line, vendor/customer, description, service period, method, quantity, rate, amount, currency, GL, cost centre,
source doc reference, preparer, reversal (Y/N), prior-month accrual, actual invoice received for prior accrual,
variance`.

The last three columns are the look-back: compare last month's accrual with the invoice that actually arrived.
Persistent over- or under-accrual for a vendor means the method needs changing.

## Review checklist

- Every line has a source reference; nothing is "per conversation" without an email or note.
- No duplicate with AP (search invoice numbers posted in the first days of the next period).
- Reversal flag set correctly; non-reversing accruals have a roll-forward.
- Accrued liabilities balance reconciles to the sum of open schedule lines.
- Large or judgemental estimates (legal, bonus, disputed invoices) flagged for controller review with the rationale.

## Pitfalls

- Accruing on PO value instead of what was received.
- Double counting when an invoice is in approval workflow but not posted.
- Forgetting employer payroll taxes and benefits on payroll accruals.
- Accruing full months for partial service periods.
- Leaving reversing accruals un-reversed because auto-reverse was not ticked.
- Estimates driven to hit a budget number. The estimate must follow the evidence.
