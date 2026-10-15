---
name: dbt-project-structure
description: Lay out a dbt project in staging, intermediate and marts layers with consistent naming, folders, sources and config. Use when creating a dbt project or model, deciding where a model belongs, naming models, or refactoring a tangled DAG.
---

# Structuring a dbt project

The goal is a DAG that reads left to right: sources -> staging -> intermediate -> marts. Each layer has one job and
models only reference the layer before them (or the same layer, for intermediate).

## 1. Folder layout

```
models/
  staging/
    stripe/
      _stripe__sources.yml
      _stripe__models.yml
      stg_stripe__payments.sql
    salesforce/
      _salesforce__sources.yml
      _salesforce__models.yml
      stg_salesforce__accounts.sql
  intermediate/
    finance/
      _int_finance__models.yml
      int_payments_pivoted_to_orders.sql
  marts/
    finance/
      _finance__models.yml
      fct_orders.sql
      dim_customers.sql
    marketing/
      ...
seeds/        # small static lookup data only (country codes, mappings); not for loading real data
snapshots/    # SCD2 history of mutable sources
macros/
tests/        # singular tests
analyses/
```

- Staging folders by **source system**; intermediate and marts folders by **business area**.
- One YAML file per folder for models (`_<dir>__models.yml`) and one for sources (`_<source>__sources.yml`); the
  leading underscore keeps them at the top of the folder.

## 2. Layer rules

### Staging: `stg_<source>__<entity>.sql` (plural entity, double underscore)

- Exactly one staging model per source table, and the **only** place `{{ source() }}` is used.
- Allowed: rename, cast, basic computations (cents to dollars), categorising with `case`, light cleaning, dedup of
  exact duplicates.
- Not allowed: joins, aggregations (changes grain).
- Materialise as `view` (cheap; always fresh).

```sql
with source as (
    select * from {{ source('stripe', 'payments') }}
),

renamed as (
    select
        id as payment_id,
        orderid as order_id,
        paymentmethod as payment_method,
        status,
        amount / 100.0 as amount,
        created as created_at
    from source
)

select * from renamed
```

### Intermediate: `int_<entities>_<verb>.sql`

- Purpose-built steps between staging and marts: joins, re-graining, pivots, isolating complex logic.
- Name by what they do: `int_payments_pivoted_to_orders`, `int_events_sessionized`.
- Not exposed to end users. Materialise `ephemeral` or `view`; `table` if reused heavily or expensive.

### Marts: `fct_<event/process>`, `dim_<entity>` (or plain entity names like `orders`, `customers`)

- Business-facing, one row per clearly stated grain (write the grain in the model description).
- Wide and denormalised is fine. Materialise as `table` or `incremental`.
- Only reference staging/intermediate/other marts via `{{ ref() }}`; never a source directly.
- Pick one convention (Kimball `fct_/dim_` or entity names) and keep it across the project.

## 3. dbt_project.yml config by folder

```yaml
models:
  my_project:
    staging:
      +materialized: view
      +schema: staging
    intermediate:
      +materialized: ephemeral
    marts:
      +materialized: table
      finance:
        +schema: finance
```

Set defaults by folder; override in a model's `config()` only when that model differs. Note that `+schema` is
appended to the target schema by default (`analytics_finance`) unless you override `generate_schema_name`.

## 4. Sources

```yaml
sources:
  - name: stripe
    database: raw
    schema: stripe
    loaded_at_field: _loaded_at
    freshness:
      warn_after: {count: 12, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: payments
```

Run `dbt source freshness` in production jobs. In recent dbt versions freshness can also be set under `config:`;
follow whichever form the project already uses.

## 5. DAG hygiene checks

- No model references a source except staging models.
- No staging model references another model.
- No mart references a staging model of a *different* domain when an intermediate or shared mart exists.
- No "bending" lines: a model shouldn't `ref` both a staging model and a mart built from it.
- Fan-in of many staging models into one giant mart: split the logic into intermediate models.
- Use `dbt ls --select +fct_orders` and `dbt docs generate` to inspect lineage; `dbt-project-evaluator` (package)
  enforces many of these rules automatically.

## 6. Naming conventions

- snake_case everywhere; plural entity names in model names (`customers`, not `customer`).
- Primary keys `<entity>_id`; booleans `is_`/`has_`; timestamps `<event>_at` (UTC), dates `<event>_date`.
- Consistent units in column names when ambiguous: `amount_usd`, `duration_seconds`.
- Don't abbreviate unless the abbreviation is the business term.

## 7. Larger projects

- Use `groups` and model `access: private | protected | public` to limit who can `ref` what.
- Split very large projects with dbt Mesh (cross-project `ref`) only when team ownership demands it.
- Model versions (`versions:` in YAML) for breaking changes to public marts consumed by others.

## Checklist for a new model

1. Which layer? Does it change grain (not staging) or face users (marts)?
2. Name follows the layer pattern; file in the right folder.
3. Upstream via `ref`/`source` only; no hard-coded schemas.
4. YAML entry with description, grain and primary key tests (see `dbt-tests-contracts`).
5. Materialisation follows the folder default unless justified (see `dbt-materializations`).
