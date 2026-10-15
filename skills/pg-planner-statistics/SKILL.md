---
name: pg-planner-statistics
description: Fix bad Postgres query plans caused by wrong row estimates, using ANALYZE, per-column statistics targets, extended statistics (CREATE STATISTICS) and planner cost settings. Use when EXPLAIN shows estimates far off actual rows, plans flip after data loads, or correlated columns mislead the planner.
---

# Fixing planner statistics

The planner chooses join types, join order and scan methods from row estimates. When estimates are off by 10x or more
at a node, fix the statistics before adding indexes or rewriting queries.

## 1. Confirm it's an estimate problem

From `EXPLAIN (ANALYZE, BUFFERS)` (see `pg-explain-analyze`): compare `rows=` (estimate) with `actual rows` x `loops`
at the lowest node where they diverge. Fix that node; upper nodes usually follow.

## 2. Are the stats fresh?

```sql
SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
FROM pg_stat_user_tables WHERE relname = 'orders';
```

- `n_mod_since_analyze` large relative to `n_live_tup` = stale. Run `ANALYZE orders;` and re-test.
- After bulk loads, `CREATE TABLE AS`, or restoring a dump, run `ANALYZE` explicitly: autoanalyze may not run before
  the next query. `pg_restore` and `pg_upgrade` don't carry stats in older versions; on Postgres 18 `pg_upgrade`
  keeps them, but still run `vacuumdb --all --analyze-in-stages --missing-stats-only` afterwards.
- Big tables: autoanalyze triggers at `autovacuum_analyze_threshold + autovacuum_analyze_scale_factor * reltuples`
  (defaults 50 + 10%). For a 500M-row table that is 50M changes. Lower it per table:

```sql
ALTER TABLE events SET (autovacuum_analyze_scale_factor = 0.01);
```

- Temporary tables are never auto-analyzed. `ANALYZE` them after filling.
- Partitioned parents are not auto-analyzed either (only the leaf partitions are). `ANALYZE parent;` periodically if
  queries hit the parent and need whole-table estimates.

## 3. Read what the planner knows

```sql
SELECT attname, null_frac, n_distinct, correlation,
       most_common_vals, most_common_freqs, histogram_bounds
FROM pg_stats WHERE tablename = 'orders' AND attname IN ('status', 'customer_id');
```

- `n_distinct` negative = fraction of rows (`-1` = unique). A badly underestimated `n_distinct` on a big table skews
  join estimates. Override if you know better: `ALTER TABLE orders ALTER COLUMN customer_id SET (n_distinct = 2000000);`
  then `ANALYZE`.
- Skewed values missing from `most_common_vals` get the average frequency. Raise the target (next step).

## 4. Raise the statistics target where it matters

`default_statistics_target` is 100 (sample = 300 x target rows; up to 100 MCVs and histogram buckets).

```sql
ALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS 1000;
ANALYZE orders;
```

- Do it per column on skewed or high-cardinality join/filter columns. Raising the global default makes every
  ANALYZE slower and planning a bit slower; prefer per-column.
- Maximum is 10000. Values above ~1000 rarely help further.

## 5. Extended statistics for correlated columns

The planner assumes columns are independent and multiplies selectivities. `city = 'Paris' AND country = 'FR'` gets
estimated far too low.

```sql
CREATE STATISTICS orders_city_country (dependencies, ndistinct, mcv) ON city, country FROM orders;
ANALYZE orders;
```

| Kind | Fixes |
| --- | --- |
| `dependencies` | equality filters on functionally dependent columns (zip -> city) |
| `ndistinct` | `GROUP BY a, b` and `DISTINCT` estimates |
| `mcv` | combinations of specific values, including inequalities and IN lists |

- Expressions are allowed (Postgres 14+): `CREATE STATISTICS s ON (date_trunc('day', created_at)), status FROM orders;`
- Check what was built: `SELECT * FROM pg_stats_ext WHERE tablename = 'orders';`
- Extended stats help single-table selectivity; they do not fix cross-table join correlation.

## 6. Expression and function estimates

- Filter on an expression with no stats gets a default selectivity. Either rewrite to use the bare column, add an
  expression index (it gathers stats on `ANALYZE`), or add expression statistics as above.
- Set-returning functions default to 1000 rows: `ALTER FUNCTION f(int) ROWS 10;`. Functions in WHERE default to a fixed
  cost; set `COST` for expensive ones so they're evaluated last.

## 7. Cost settings (instance or role level)

Only after statistics are right. Change one at a time, measure, and set at role or database level before global.

| Setting | Guidance |
| --- | --- |
| `random_page_cost` | 4.0 default is for spinning disks. Use 1.1 to 1.5 on SSD/NVMe and cloud storage |
| `effective_cache_size` | ~50-75% of RAM; tells the planner how much cache to expect (no allocation) |
| `effective_io_concurrency` | 200+ on SSD for bitmap heap scans (default changed to 16 in Postgres 18) |
| `work_mem` | affects whether hash/sort plans are chosen; per node per process, raise per role or query |
| `jit` | off for OLTP if JIT compile time shows up in short queries |
| `plan_cache_mode` | `force_custom_plan` for a role whose prepared statements suffer from a bad generic plan |
| `from_collapse_limit` / `join_collapse_limit` | raise above 8 only for many-join queries that plan badly; costs planning time |

## 8. When stats can't fix it

- Join estimates on correlated keys across tables: consider denormalising a filter column, splitting the query with a
  materialised intermediate (temp table + `ANALYZE`), or `MATERIALIZED` CTE as an optimisation fence.
- Parameter-sensitive plans (one tenant has 90% of rows): partial indexes per hot value, or custom plans.
- `pg_hint_plan` exists but is an external extension and a last resort; record why if you use it.

## Checklist

1. Lowest misestimated node identified.
2. `ANALYZE` run and plan re-checked.
3. Skew: per-column `SET STATISTICS`; correlation: `CREATE STATISTICS`; expression: expression index/stats.
4. Autoanalyze thresholds lowered on large, fast-changing tables.
5. Cost settings reviewed for the hardware (SSD -> `random_page_cost` ~1.1).
6. Before/after plans recorded.

## Pitfalls

- Running `VACUUM` when you meant `ANALYZE`: plain `VACUUM` doesn't update `pg_stats` (use `VACUUM (ANALYZE)`).
- Raising `default_statistics_target` globally to fix one column.
- Fixing a statistics problem with `enable_nestloop = off` in production.
- Forgetting replicas: stats are replicated from the primary, so run `ANALYZE` on the primary.
