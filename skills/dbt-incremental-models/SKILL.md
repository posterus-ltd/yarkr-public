---
name: dbt-incremental-models
description: Build dbt incremental models correctly - unique_key, merge vs delete+insert vs insert_overwrite vs microbatch, is_incremental() filters with lookback windows for late data, schema changes and full-refresh safety. Use when writing or debugging an incremental model, or when duplicates or missing rows appear in one.
---

# dbt incremental models

An incremental model processes only new or changed rows on each run and merges them into the existing table.
It trades simplicity for speed: use it only when a full rebuild is too slow or too expensive.

## 1. The basic shape

```sql
{{ config(
    materialized='incremental',
    unique_key='event_id',
    incremental_strategy='merge',
    on_schema_change='append_new_columns'
) }}

with events as (
    select * from {{ ref('stg_app__events') }}
    {% if is_incremental() %}
    -- lookback window to catch late-arriving rows
    where loaded_at > (select dateadd('hour', -3, max(loaded_at)) from {{ this }})
    {% endif %}
)

select
    event_id,
    user_id,
    event_type,
    occurred_at,
    loaded_at
from events
```

- `is_incremental()` is true only when the table exists, the model is incremental, and `--full-refresh` isn't set.
- Filter on the column that reflects **arrival** (load/ingest timestamp), not the business event time, when data can
  arrive late.
- `{{ this }}` is the existing target table.
- The lookback (overlap) window must be at least as long as the latest data can arrive. Overlap is safe only with a
  `unique_key` (merge/delete+insert) so re-processed rows replace rather than duplicate.

## 2. Choosing a strategy

| Strategy | What it does | Use when | Adapters |
| --- | --- | --- | --- |
| `append` | inserts new rows | immutable events with no duplicates or late updates | all |
| `merge` | upserts on `unique_key` | rows can be updated; moderate table sizes | Snowflake, BigQuery, Databricks, Postgres 15+, Redshift (check adapter) |
| `delete+insert` | deletes matching keys then inserts | merge is slow or unsupported; batch replacement by key | Snowflake, Postgres, Redshift, others |
| `insert_overwrite` | replaces whole partitions | partitioned facts where you recompute full days | BigQuery, Databricks/Spark |
| `microbatch` | runs the model per time batch using `event_time` | large time-series; backfills; retrying failed batches | dbt 1.9+, most major adapters |

Decision rules:
- Late updates to existing rows -> `merge` or `delete+insert` with `unique_key`.
- Recomputing whole days/partitions is natural -> `insert_overwrite` (BigQuery: `partition_by` required) or `microbatch`.
- Pure append, no late data, no duplicates guaranteed upstream -> `append`.
- Merging into huge tables is slow because it scans the target: add `incremental_predicates` to limit the scan:

```sql
{{ config(
    incremental_strategy='merge',
    unique_key='event_id',
    incremental_predicates=["DBT_INTERNAL_DEST.occurred_at > dateadd('day', -7, current_date)"]
) }}
```

## 3. Microbatch (dbt 1.9+)

```sql
{{ config(
    materialized='incremental',
    incremental_strategy='microbatch',
    event_time='occurred_at',
    batch_size='day',
    lookback=3,
    begin='2023-01-01'
) }}

select * from {{ ref('stg_app__events') }}
```

- No `is_incremental()` block: dbt filters inputs automatically for upstream models that also declare `event_time`.
  Upstream models without `event_time` are read in full each batch.
- Backfill a range: `dbt run --select fct_events --event-time-start 2024-01-01 --event-time-end 2024-02-01`.
- Retry failed batches only: `dbt retry`.
- Each batch replaces its time slice, so batches must be computable independently (no cross-batch window functions
  over the model's own output).

## 4. unique_key rules

- Must be truly unique in each batch of new rows, or merge fails (Snowflake: "Duplicate row detected") or produces
  duplicates. Deduplicate inside the model with `qualify row_number() over (partition by event_id order by loaded_at desc) = 1`.
- Composite keys: `unique_key=['order_id', 'line_number']`. Never concatenate into a string key with nullable parts.
- Null keys never match in merge, so they get inserted every run. Filter or coalesce them.
- Test it: `unique` + `not_null` on the key in YAML (see `dbt-tests-contracts`).

## 5. Schema changes

`on_schema_change`:
- `ignore` (default): new columns in the select are silently dropped from the target.
- `append_new_columns`: adds new columns; doesn't remove old ones.
- `sync_all_columns`: adds and removes columns, may fail on type changes.
- `fail`: stop and require a decision.

New columns are not backfilled for old rows under any setting; that needs `--full-refresh` or a manual backfill.

## 6. Full refresh safety

- `dbt run --full-refresh --select model` drops and rebuilds from scratch. On huge tables or when the source no
  longer has full history (retention), a full refresh **loses data**.
- Protect such models: `{{ config(full_refresh=false) }}` makes `--full-refresh` a no-op for that model.
- Make the full build and incremental build produce the same result for overlapping data; test by comparing a
  full refresh in a dev schema against production for a sample window (`dbt-audit-helper` package helps).

## 7. Debugging checklist

| Symptom | Likely cause |
| --- | --- |
| Duplicates | no `unique_key` with `append`; overlap window without key; key not unique in new batch |
| Missing late rows | filter on event time instead of load time; lookback too short |
| New column all null for history | expected; backfill or full refresh |
| Merge slow/expensive | add `incremental_predicates`; cluster/partition target on the predicate column |
| Works in dev, wrong in prod | dev built with full refresh only; run twice in dev to exercise the incremental path |

Always run a new incremental model at least twice in development: once to create, once to exercise
`is_incremental()`.
