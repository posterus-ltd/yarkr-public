---
name: close-checklist-builder
description: Build or refresh a month-end close checklist with owners, workday due dates (WD-3 to WD+5), dependencies and evidence per task. Use when setting up a close calendar, shortening the close, onboarding a new entity, or auditing why a close slipped.
---

# Month-end close checklist builder

Produce a close checklist that a controller can run without asking questions: every task has one owner, one due
workday, its upstream dependencies, and the evidence that proves it was done. The output supports the finance team;
the controller owns and approves the final calendar.

## Inputs to collect first

1. Entities, currencies and the ERP/GL in use (NetSuite, Sage Intacct, Xero, QuickBooks, SAP, Dynamics).
2. Sub-ledgers and feeders: AP, AR, payroll provider, billing system, bank feeds, card program, inventory, fixed assets.
3. Reporting deadline (board pack, lender covenant, group consolidation) expressed as a workday, e.g. WD+5.
4. Team roster: preparer and reviewer for each area. One person may not prepare and review the same task.
5. Last close's actual completion dates if available, to find the critical path.

If any of these is missing, list it as an open question at the top of the output rather than inventing it.

## Workday convention

- WD0 is the last calendar day of the period. WD+1 is the first business day after it; skip weekends and the
  entity's public holidays.
- Pre-close work (WD-3 to WD-1) is everything that does not need the period to end: cut-off reminders, prepaid
  and fixed-asset additions known so far, accrual estimates from open POs, intercompany agreement of balances.
- Hard close is usually WD+1 to WD+3; review, flux and reporting WD+3 to WD+5.

## Standard task phases

| Phase | Typical tasks | Due |
| --- | --- | --- |
| Pre-close | Cut-off email to budget holders; confirm payroll calendar; review open POs for accruals; preliminary intercompany balances | WD-3 to WD-1 |
| Sub-ledger close | AP cut-off and invoice posting; AR billing run complete; cash receipts applied; payroll journal posted; card feed coded | WD+1 |
| Cash | Bank reconciliations for every account; unreconciled items over 30 days escalated | WD+1 to WD+2 |
| Accruals and deferrals | Expense accruals; revenue deferrals/unbilled; prepaid amortisation; bonus and commission accruals | WD+2 |
| Fixed assets and leases | Additions, disposals, depreciation run; lease schedules (ASC 842 / IFRS 16) | WD+2 |
| Intercompany and FX | Intercompany matched and eliminated; revaluation of foreign-currency balances | WD+2 to WD+3 |
| Tax | Sales tax/VAT liability tie-out; income tax provision estimate | WD+3 |
| Reconciliations | Every balance-sheet account reconciled and reviewed | WD+3 to WD+4 |
| Review | Trial balance review; flux analysis; controller sign-off | WD+4 |
| Reporting | Financial statements, management pack, KPI tie-out; period locked in the ERP | WD+5 |

Adapt rather than copy: drop tasks that don't apply and add entity-specific ones (inventory counts, grant
accounting, deferred commissions under ASC 340-40).

## Building the checklist

1. List every recurring journal and reconciliation from the last 3 closes; each becomes a task.
2. For each task record: `id`, `phase`, `task`, `entity`, `preparer`, `reviewer`, `due_wd`, `depends_on` (task ids),
   `evidence`, `frequency` (monthly/quarterly/annual), `est_hours`, `system`.
3. Wire dependencies. Typical hard edges:
   - AP cut-off → expense accruals → flux analysis.
   - Billing run → revenue deferral → revenue reconciliation.
   - Payroll journal → bonus/benefit accruals → payroll liability rec.
   - All journals posted → FX revaluation → intercompany elimination → TB review.
4. Compute the critical path: the longest chain of `est_hours` along dependencies. Any task on it gets a backup owner.
5. Check due dates respect dependencies: a task may not be due earlier than any task it depends on.
6. Add quarter-end and year-end only tasks with `frequency` set, so the monthly view stays short.

## Evidence requirements

Evidence must let a reviewer or auditor re-perform the task. Be specific:

- Reconciliation: rec workbook with GL balance, support total, reconciling items, preparer and reviewer initials/date.
- Journal: posted JE number plus calculation file plus source document (contract, invoice, payroll register).
- Review steps: flux commentary signed off, TB review memo.
- System steps: screenshot or report export with run timestamp (e.g. depreciation run, period lock).

"Done" without an artefact is not evidence.

## Controls to bake in

- Segregation of duties: preparer ≠ reviewer; flag any task where the roster forces the same person.
- Review thresholds: journals above a set amount need controller approval before posting.
- Period lock: sub-ledgers locked at their task's completion, GL locked after reporting.
- Late-entry rule: post-close adjustments above materiality go through a documented reopen request.

## Output format

1. Open questions (missing inputs).
2. Checklist table, sorted by `due_wd` then phase, with all fields above. CSV or markdown table; offer both if the
   user is importing into a close tool (FloQast, BlackLine, Numeric, a spreadsheet).
3. Critical path: the chain of task ids and total hours, with the slowest step named.
4. Risks: single points of failure, SoD conflicts, tasks with no evidence defined, dependency violations.

## Pitfalls

- Due dates written as calendar dates. Use workdays so the calendar rolls forward each month.
- Tasks with two owners. Split them or name one accountable owner.
- Reconciliations all due on the last day. Stagger them so reviewers are not the bottleneck.
- Ignoring holiday calendars for multi-country entities; WD+2 differs by country.
- Shortening the close by moving review later. Move preparation earlier (pre-close) instead.
