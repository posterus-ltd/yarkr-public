---
name: prepaid-amortization-schedule
description: Build and maintain prepaid expense amortization schedules (software, insurance, rent, conferences, retainers) and the monthly journal that releases them to expense. Use when an invoice covers future periods, at month-end amortization, or when reconciling the prepaid account.
---

# Prepaid amortization schedule

A prepaid is a payment for a benefit received over future periods. The schedule spreads the cost over the service
period and ties to the prepaid GL balance every month. The output is a working schedule and draft journal for the
accountant to review and post.

## When to capitalise as prepaid

Capitalise when all hold:

1. The invoice covers a service period extending beyond the current month.
2. The amount is at or above the prepaid threshold in policy (often 2,500–10,000). Below threshold, expense
   immediately and note the policy.
3. The service period is 12 months or less for current prepaids; longer portions go to a non-current prepaid account.

Not prepaid: deposits (refundable, stay on balance sheet until returned), capitalisable software development,
contract costs under ASC 340-40 (separate commission asset), or fixed assets.

## Information to capture per invoice

`vendor, invoice number, invoice date, description, total amount, currency, service start, service end, GL expense
account, cost centre, method, prepaid account`.

The service period comes from the invoice or contract, never from the invoice date. If the invoice does not state it,
ask the budget owner and record their answer as the source.

## Amortisation methods

- **Straight-line by month** (default for most): monthly = total ÷ number of months. Starting mid-month, either
  take a full first month (if policy allows a half-month or full-month convention) or pro-rate by days.
- **Daily pro-rata** (more precise, required by some policies): expense for month = total × days of service in the
  month ÷ total service days.
- **Usage-based** (prepaid credits, e.g. cloud commit drawdown): expense = credits consumed this month; true up if
  credits expire unused (expense the remainder at expiry).
- **Event-based** (conference sponsorship, trade show): hold in prepaid until the event date, then expense fully.

Daily example: 12,000 insurance for 15 Jan 2026 to 14 Jan 2027 (365 days). January days = 17. January expense =
12,000 × 17 / 365 = 558.90. Last month absorbs rounding so the schedule sums exactly to 12,000.

## Building the schedule

One row per prepaid item, one column per month:

```
item | vendor | total | start | end | method | opening | Jan | Feb | ... | closing
```

1. Compute each month's amount with the method above, using formulas not typed values.
2. Put rounding in the final month.
3. Closing balance = total − cumulative amortised. It must never go negative.
4. Sum the month column → that is the monthly journal amount (split by GL and cost centre).
5. Sum the closing column → must equal the prepaid GL balance after posting.

## Monthly journal

```
Dr  6xxx  Software subscriptions (CC 200)    1,000.00
Dr  6yyy  Insurance (CC 100)                    558.90
    Cr  1300  Prepaid expenses                       1,558.90
Memo: Prepaid amortisation Jan-26 per schedule v2026-01, rows 1–14.
```

Non-reversing. Attach the schedule as support.

## Monthly maintenance

1. Add new prepaid invoices posted this month (AP report filtered to the prepaid account).
2. Check for invoices coded to expense that should have been prepaid (large annual invoices hitting expense
   accounts) and reclass.
3. Handle changes: cancellation (expense or reclaim the remainder), extension (re-spread remaining balance over the
   new remaining term from the change date), price change mid-term (new line for the delta).
4. Remove fully amortised rows to an archive tab once closing = 0.
5. Reconcile schedule closing total to the GL; difference must be zero or explained.

## Reconciliation flags

- Rows past their end date with a remaining balance.
- Rows with a start date in the future still amortising.
- GL balance credit (over-amortised).
- Items over 12 months not split current/non-current at a balance sheet date.

## Pitfalls

- Amortising from the invoice date instead of the service start.
- Annual renewals expensed in full in the invoice month: distorts flux for 12 months.
- Multi-year prepay classified all as current.
- Rounding drift where the schedule sums to 11,999.98.
- Forgetting FX: prepaids are non-monetary, so do not revalue them at period-end rates.
