---
name: dbt-materializations
description: Choose and configure dbt materializations (view, table, incremental, ephemeral, materialized_view, snapshot) per model, weighing cost, freshness and query speed. Use when creating or reviewing a model's config, when a model is slow or expensive to build or query, or when picking a folder default.
---

# Choosing dbt materializations

## 1. Decision rules

Start simple and escalate only when a measured problem appears:

```
view  ->  table  ->  incremental
```

| Materialization | Use when | Avoid when |
| --- | --- | --- |
| `view` | staging models; light transforms; data must always be current | many downstream models or BI queries hit it and it is expensive to compute |
| `table` | marts queried by BI; heavy joins/aggregations; build takes acceptable time | full rebuild takes too long or costs too much |
| `incremental` | large event/fact tables where rebuilding everything each run is too slow or costly | small tables (complexity not worth it); logic that can't be expressed per new batch |
| `ephemeral` | small reusable intermediate logic used by one or two models | used by many models (inlined each time), needs debugging, or needs tests that query it directly |
| `materialized_view` | adapter supports it and you want the warehouse to keep a result fresh | complex SQL the warehouse can't refresh incrementally; Postgres (refresh is a full recompute) |
| snapshot | capturing history (SCD type 2) of mutable source rows | data that already has full history |

Rules of thumb:
- Staging: `view`. Intermediate: `ephemeral` or `view`. Marts: `table`, switching to `incremental` when a build is
  measured to be too slow or expensive.
- If a view is queried by dashboards many times a day, a table is usually cheaper overall.
- Ephemeral models can't be selected and run alone, and aren't visible in the warehouse for debugging.

## 2. Configuring

In `dbt_project.yml` by folder (preferred), in a YAML properties file, or in the model:

```sql
{{ config(materialized='table') }}
```

```yaml
models:
  - name: fct_orders
    config:
      materialized: table
```

Precedence: model `config()` > properties YAML > `dbt_project.yml`.

## 3. Warehouse-specific table config

Put the physical layout in config, not in post-hooks:

```sql
-- Snowflake
{{ config(materialized='table', cluster_by=['order_date'], transient=true) }}

-- BigQuery
{{ config(
    materialized='table',
    partition_by={'field': 'order_date', 'data_type': 'date', 'granularity': 'day'},
    cluster_by=['customer_id']
) }}

-- Databricks
{{ config(materialized='table', file_format='delta', liquid_clustered_by=['order_date']) }}

-- Postgres / Redshift
{{ config(materialized='table', indexes=[{'columns': ['customer_id']}]) }}           -- postgres
{{ config(materialized='table', dist='customer_id', sort=['order_date']) }}          -- redshift
```

Check the adapter docs for exact keys before adding one; keys differ between adapters and versions.

## 4. Materialized views

```sql
{{ config(
    materialized='materialized_view',
    on_configuration_change='apply'
) }}
```

- Supported on Postgres, Redshift, Snowflake (as dynamic tables: `materialized='dynamic_table'` with `target_lag`
  and `snowflake_warehouse`), BigQuery and Databricks, with different refresh semantics and SQL restrictions.
- `on_configuration_change`: `apply` (alter in place where possible), `continue` (warn), `fail`.
- Downstream models can't assume freshness beyond the warehouse's refresh setting.

## 5. Snapshots

Use for SCD2 history on sources that update rows in place. Since dbt 1.9 snapshots can be defined in YAML:

```yaml
snapshots:
  - name: customers_snapshot
    relation: source('crm', 'customers')
    config:
      schema: snapshots
      unique_key: customer_id
      strategy: timestamp
      updated_at: updated_at
      hard_deletes: invalidate      # or ignore / new_record
```

- Prefer `timestamp` strategy when a reliable `updated_at` exists; `check` with `check_cols` otherwise.
- Snapshot sources raw, not transformed models; transformations can change and corrupt history.
- Snapshots are never dropped by `--full-refresh`: protect them, they can't be rebuilt.

## 6. Cost and speed checklist

When a model is slow or expensive:
1. Is it a view queried by many consumers? Materialise as `table`.
2. Is it a table whose rebuild dominates the run? Consider `incremental` (see `dbt-incremental-models`).
3. Is it ephemeral but used by many models? Make it a `view` or `table` so it is computed once.
4. Are partitioning/clustering configured for the main filter columns of downstream queries?
5. Use `dbt build --select state:modified+` in CI with deferral to avoid rebuilding unchanged models.

## Pitfalls

- Switching a model from `view` to `table` (or back) needs the old relation dropped; dbt handles it, but grants and
  external dependencies on the old object type can break.
- `transient` Snowflake tables have no Fail-safe; fine for marts that can be rebuilt, not for snapshots.
- Changing `partition_by` (and on some adapters `cluster_by`) on an existing incremental model usually needs a
  `--full-refresh` to take effect.
- Ephemeral models referenced in many places can produce huge compiled SQL.
