---
name: sql-style-guide
description: Format and name SQL consistently (lowercase keywords, CTE structure, explicit aliases, trailing commas, naming) and enforce it with sqlfluff, including dbt projects. Use when writing or reviewing SQL or dbt models, setting up a linter, or fixing sqlfluff errors.
---

# SQL style guide

Consistency matters more than any single rule. If the project already has a `.sqlfluff` or style doc, follow it;
use this guide when there is none or when asked to set one up.

## 1. Formatting rules

- Lowercase keywords and function names (`select`, `coalesce`); lowercase snake_case identifiers.
- Trailing commas; one column per line in `select`.
- 4-space indentation; lines under ~100 characters.
- `as` always explicit for column and table aliases.
- Join conditions on the line after the join, and always explicit join type (`inner join`, `left join`).
- `!=` or `<>`: pick one (`!=` is common); `is null` / `is not null` never `= null`.
- Prefer `union all` over `union` unless deduplication is intended (and say so in a comment).
- Group/order by column names, or consistently by position; don't mix in one project.
- Comment *why*, not *what*: `-- exclude refunds: finance books them separately`.

## 2. Structure with CTEs

```sql
with

orders as (
    select * from {{ ref('stg_shop__orders') }}
),

payments as (
    select * from {{ ref('stg_stripe__payments') }}
    where status = 'success'
),

order_payments as (
    select
        order_id,
        sum(amount) as paid_amount
    from payments
    group by order_id
),

final as (
    select
        orders.order_id,
        orders.customer_id,
        orders.ordered_at,
        coalesce(order_payments.paid_amount, 0) as paid_amount
    from orders
    left join order_payments
        on orders.order_id = order_payments.order_id
)

select * from final
```

- Import CTEs first (one per upstream relation, filtered early), then logical CTEs, then `final`, then
  `select * from final`. This makes debugging a CTE a one-line change.
- Name CTEs for what they contain (`order_payments`), not `cte1`/`tmp`.
- One CTE does one thing: filter, aggregate, join, or reshape.
- No nested subqueries in `from` when a CTE would read better; `exists` subqueries in `where` are fine.

## 3. Aliasing and column references

- Qualify every column with its table or CTE name once more than one relation is in scope.
- Prefer full CTE names over one-letter aliases (`orders.customer_id`, not `o.customer_id`); short meaningful
  aliases are acceptable for long names.
- Never `select *` in final outputs of marts; `select *` from an import CTE is fine.
- Avoid reserved words as column names (`date`, `user`, `order`); rename in staging.

## 4. Naming

| Thing | Convention |
| --- | --- |
| Primary key | `<entity>_id` |
| Booleans | `is_`, `has_`, `was_` prefix |
| Timestamps | `<event>_at`, in UTC; dates `<event>_date` |
| Amounts | include unit/currency when ambiguous: `amount_usd`, `price_cents` |
| Counts | `<thing>_count` or `number_of_<things>` (pick one) |
| Models | per layer conventions (see `dbt-project-structure`) |

Column order in models: keys and ids, then strings, numerics, booleans, dates/timestamps, then metadata.

## 5. Enforce with sqlfluff

Install (pin versions in requirements):

```bash
pip install sqlfluff sqlfluff-templater-dbt   # templater only needed for dbt projects
```

`.sqlfluff` at the repo root:

```ini
[sqlfluff]
dialect = snowflake            ; bigquery, postgres, redshift, databricks, duckdb, ...
templater = dbt                ; jinja for non-dbt Jinja SQL, raw for plain SQL
max_line_length = 100
exclude_rules = ST06           ; example: drop rules the team doesn't want, with a reason in the PR

[sqlfluff:templater:dbt]
project_dir = ./
profiles_dir = ~/.dbt/

[sqlfluff:indentation]
tab_space_size = 4
indent_unit = space

[sqlfluff:layout:type:comma]
line_position = trailing

[sqlfluff:rules:capitalisation.keywords]
capitalisation_policy = lower

[sqlfluff:rules:capitalisation.functions]
extended_capitalisation_policy = lower

[sqlfluff:rules:capitalisation.identifiers]
extended_capitalisation_policy = lower

[sqlfluff:rules:aliasing.table]
aliasing = explicit

[sqlfluff:rules:aliasing.column]
aliasing = explicit

[sqlfluff:rules:ambiguous.column_references]
group_by_and_order_by_style = explicit
```

Plus `.sqlfluffignore` with `target/`, `dbt_packages/`, `macros/` (if macros don't lint cleanly).

Commands:

```bash
sqlfluff lint models/                      # report
sqlfluff fix models/marts/fct_orders.sql   # auto-fix one file, review the diff
sqlfluff lint --format github-annotation-native models/   # CI annotations
```

- The dbt templater compiles each model, so it needs a working profile and is slow; the `jinja` templater with
  dbt builtins is faster for CI on large projects but less exact.
- Run in pre-commit on changed files only, and in CI on the diff.
- Roll out on an existing project: run `fix` per folder in separate PRs, then turn on CI enforcement. Don't mix a
  mass reformat with logic changes.

## 6. Reviewing SQL for style

Check, in order: correctness first (joins fan-out, null handling), then structure (CTE order, one job per CTE),
then naming, then formatting. Leave formatting to the linter; comment on it only when no linter runs.

## Pitfalls

- Disabling rules inline (`-- noqa`) without a reason; require `-- noqa: RULE` with the specific code.
- Different dialect in `.sqlfluff` than the warehouse: parse errors that look like style errors.
- Running `sqlfluff fix` on the whole repo in a feature PR.
