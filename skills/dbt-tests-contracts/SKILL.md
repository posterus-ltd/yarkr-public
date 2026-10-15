---
name: dbt-tests-contracts
description: Add dbt data tests (generic and singular), unit tests, model contracts and constraints, with severity and store_failures settings. Use when adding tests to a model, deciding what to test, writing a unit test for complex SQL logic, enforcing a contract on a public mart, or triaging failing tests.
---

# dbt tests and contracts

Three tools, three jobs:

| Tool | Checks | When it runs |
| --- | --- | --- |
| Data tests (generic, singular) | the data in the warehouse after a build | `dbt test` / `dbt build`, every run |
| Unit tests | the model's SQL logic on fixed inputs | CI / development, before materialising |
| Contracts + constraints | column names and types (and some constraints) of the output | at build time; the build fails on mismatch |

## 1. Minimum data tests per model

- Every model: primary key `unique` + `not_null` (or `dbt_utils.unique_combination_of_columns` for composite keys).
- Foreign keys in marts: `relationships` to the parent dimension.
- Enumerations: `accepted_values` on status/type columns.
- Sources: `not_null`/`unique` on keys plus `freshness`.

```yaml
models:
  - name: fct_orders
    description: One row per order.
    columns:
      - name: order_id
        data_tests:
          - unique
          - not_null
      - name: customer_id
        data_tests:
          - not_null
          - relationships:
              arguments:
                to: ref('dim_customers')
                field: customer_id
      - name: status
        data_tests:
          - accepted_values:
              arguments:
                values: ['placed', 'shipped', 'completed', 'returned']
              config:
                severity: warn
```

- `data_tests:` is the current key (`tests:` still works). Since dbt 1.10, test inputs go under `arguments:` and
  settings under `config:`; older projects put arguments directly under the test name. Match the project's version.
- Packages: `dbt_utils` (`expression_is_true`, `unique_combination_of_columns`, `recency`, `at_least_one`) and
  `dbt_expectations` (ranges, regexes, row counts) cover most needs before writing custom tests.

## 2. Test configuration

```yaml
        data_tests:
          - unique:
              config:
                severity: error
                error_if: ">100"
                warn_if: ">0"
                where: "order_date >= current_date - 30"
                store_failures: true
```

- `severity: warn` for checks that shouldn't block deploys (data quality signals owned upstream).
- `where` to limit expensive tests on huge tables to recent data.
- `store_failures: true` writes failing rows to a table for investigation (`--store-failures` for a whole run).
- Tag expensive tests and run them on a separate schedule: `config: {tags: ['nightly']}`.

## 3. Singular tests

A SQL file in `tests/` that returns the failing rows:

```sql
-- tests/assert_order_totals_match_payments.sql
select o.order_id, o.amount, sum(p.amount) as paid
from {{ ref('fct_orders') }} o
join {{ ref('stg_stripe__payments') }} p using (order_id)
where p.status = 'success'
group by 1, 2
having abs(o.amount - sum(p.amount)) > 0.01
```

If a singular test is reused across models, turn it into a custom generic test in `tests/generic/`
(`{% test name(model, column_name) %} ... {% endtest %}`).

## 4. Unit tests (dbt 1.8+)

For models with non-trivial logic: case statements, window functions, date math, regex parsing, incremental logic.

```yaml
unit_tests:
  - name: test_order_status_mapping
    model: fct_orders
    given:
      - input: ref('stg_shop__orders')
        rows:
          - {order_id: 1, raw_status: 'S', amount: 10}
          - {order_id: 2, raw_status: null, amount: 5}
      - input: ref('stg_stripe__payments')
        rows: []
    expect:
      rows:
        - {order_id: 1, status: 'shipped'}
        - {order_id: 2, status: 'unknown'}
```

- Only the columns used by the logic need values; others default to null.
- `format: csv` or `format: sql` for fixtures that don't fit dict rows (`sql` is needed for ephemeral inputs).
- Test the incremental branch with `overrides: {macros: {is_incremental: true}}` and an `input: this` fixture.
- Run with `dbt test --select "test_type:unit"`; exclude them from production runs (`--exclude-resource-type unit_test`)
  since they test code, not data.
- Upstream models must exist in the warehouse (or be deferred to) for type inference; `dbt run --empty` builds
  schema-only versions cheaply.

## 5. Contracts and constraints

Use on public marts and models consumed by other teams or tools:

```yaml
models:
  - name: dim_customers
    config:
      contract:
        enforced: true
    columns:
      - name: customer_id
        data_type: int
        constraints:
          - type: not_null
          - type: primary_key
      - name: email
        data_type: varchar
```

- With `enforced: true`, every column must be listed with `data_type`, and the build fails if the SQL output
  doesn't match names and types.
- Constraint enforcement depends on the warehouse: `not_null` is enforced on most; `primary_key`, `unique`,
  `foreign_key` are often metadata only (Snowflake, BigQuery, Databricks). Keep `unique` tests anyway.
- Contracts are supported on `table`, `incremental` and `view` (no constraints on views); not on ephemeral.
- Breaking a contract on a versioned public model: add a new `version` instead of changing it in place.

## 6. What to test where

1. Source: freshness, keys, not-null on fields you rely on.
2. Staging: primary key; accepted values for normalised enums.
3. Intermediate: grain (unique on the new key after a re-grain).
4. Marts: keys, relationships, business rules (`expression_is_true`), contracts if public.
5. Complex logic anywhere: a unit test.

## Triage a failing test

1. `dbt test --select <test_name> --store-failures`, then query the failures table (or run the compiled SQL from
   `target/compiled/.../` directly).
2. Decide: data bug upstream (fix source or add handling), model bug (fix SQL, add unit test), or test wrong
   (rule changed: update the test and say why in the PR).
3. Never just delete or downgrade a failing test to `warn` without recording why.
