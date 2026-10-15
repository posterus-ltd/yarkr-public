---
name: close-flux-analysis
description: Run month-over-month, prior-year and budget flux analysis on a trial balance or P&L, apply materiality thresholds, and write variance explanations that cite drivers. Use during close review, for management packs, or when an auditor asks why a line moved.
---

# Close flux analysis

Flux analysis is the review that catches misstatements the reconciliations missed: a missing accrual, a miscoded
invoice, a revenue cut-off error. Good flux commentary explains the business driver with numbers; poor commentary
restates the variance. Output is draft commentary for the controller to review and approve.

## Inputs

- Trial balance for current period, prior month, same month prior year, and budget/forecast, at account level with
  department or cost centre if available.
- Materiality thresholds (from policy or the controller).
- Known events this month: hires, price changes, contracts signed, one-off projects, reorganisations.

## Thresholds

Flag a line for explanation when **both** an absolute and a percentage threshold are breached (or either, if the
policy says so). Typical starting points for a mid-size company:

| Comparison | Absolute | Percent |
| --- | --- | --- |
| Balance sheet MoM | 50,000 or 1% of total assets | 10% |
| P&L MoM | 25,000 | 10% |
| P&L vs budget | 25,000 | 10% |

Scale to the company: the absolute threshold is often 5–10% of overall planning materiality. Always also flag:
sign changes, new accounts with a balance, accounts that went to zero, and any line with no movement where movement is
expected (payroll, depreciation, rent).

## Procedure

1. Build the comparison table: `account, description, current, prior, Δ, Δ%, budget, Δ vs budget, Δ% vs budget, flag`.
   Compute Δ% on the absolute prior value; show "n/m" when prior is zero.
2. Filter to flagged lines. Sort by absolute variance.
3. For each flagged line, drill to transactions: top journals by amount, new vendors/customers, manual journals,
   reversals.
4. Identify the driver and quantify it. Decompose where possible:
   - Price × volume: Δrevenue = (Δunits × prior price) + (Δprice × current units).
   - Headcount × rate for payroll: Δ = (Δheadcount × prior avg cost) + (Δavg cost × current headcount).
   - Timing: an item in this month that belonged to another (catch-up invoices, missing accrual last month).
5. Decide: is the variance a real business change, a timing difference, or an error? Errors become proposed
   adjusting entries, not commentary.
6. Write the explanation.

## Writing explanations

Format: **direction + amount + driver(s) with numbers + whether it recurs**. Explanations should sum to at least
~80% of the variance.

Good:

> Software expense up 42k (+18%) MoM: new Datadog annual commitment from 1 Mar adds 28k/month; one-off 14k
> implementation fee for the CPQ project, not recurring.

Bad:

> Software expense increased due to higher software costs.

Words to avoid without numbers: "timing", "various", "increased activity", "reclass". If it is timing, say from
which period and whether it reverses next month.

## Cross-checks that catch errors

- Revenue up but AR, deferred revenue and cash all flat: possible cut-off or recognition error.
- Payroll expense moved but headcount did not: missing accrual, bonus, or misposting.
- Expense dropped to near zero for a recurring vendor: invoice missing, accrue it.
- Depreciation flat despite large capex: assets not placed in service in the register.
- Balance sheet account moved without a matching P&L or cash movement: check reclasses and manual journals.
- Gross margin swing over 2 points: check COGS capitalisation and inventory adjustments.

## Output format

1. Summary: total flagged lines, number explained, proposed adjustments with amounts.
2. Variance table with flagged lines and commentary column.
3. Proposed adjusting entries (hand to journal entry drafting) with rationale.
4. Open items: lines needing input from budget owners, with the question to ask each owner.

## Pitfalls

- Explaining against the wrong baseline (comparing to a pre-adjustment prior month).
- Running flux before all journals are posted; commentary goes stale.
- Accepting a budget owner's explanation without checking it against transactions.
- Commentary that net-offs a big increase and a big decrease in the same line; explain both.
- Ignoring balance sheet flux; P&L-only reviews miss classification errors.
