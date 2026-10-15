---
name: pg-vacuum-bloat
description: Diagnose Postgres table and index bloat, tune autovacuum per table, unblock vacuum, and prevent transaction ID wraparound. Use when tables grow without more data, autovacuum lags or never finishes, Index Only Scans show heap fetches, or age(datfrozenxid) warnings appear.
---

# Vacuum, bloat and wraparound

MVCC leaves dead row versions behind every UPDATE and DELETE. VACUUM marks them reusable, updates the visibility map
and freezes old rows. When it falls behind, tables bloat, index-only scans degrade, and eventually XID wraparound
forces a shutdown.

## 1. Is autovacuum keeping up?

```sql
SELECT relname, n_live_tup, n_dead_tup,
       round(100.0 * n_dead_tup / nullif(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,
       last_autovacuum, last_vacuum, autovacuum_count
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC LIMIT 20;

SELECT pid, datname, relid::regclass, phase, heap_blks_scanned, heap_blks_total, index_vacuum_count
FROM pg_stat_progress_vacuum;
```

- High `dead_pct` with an old `last_autovacuum` = not triggering or not finishing.
- `index_vacuum_count` > 1 for one run = `maintenance_work_mem`/`autovacuum_work_mem` too small to hold all dead
  TIDs (less of an issue on Postgres 17+, which stores them far more compactly).

## 2. What blocks vacuum from removing dead rows

VACUUM can only remove rows older than the oldest snapshot anywhere. Check all three horizons:

```sql
-- long transactions and idle-in-transaction sessions
SELECT pid, usename, state, now() - xact_start AS xact_age, backend_xmin, left(query, 80)
FROM pg_stat_activity WHERE backend_xmin IS NOT NULL ORDER BY age(backend_xmin) DESC LIMIT 10;

-- replication slots holding xmin (including abandoned logical slots)
SELECT slot_name, slot_type, active, xmin, catalog_xmin, restart_lsn FROM pg_replication_slots;

-- forgotten prepared transactions
SELECT gid, prepared, owner FROM pg_prepared_xacts;
```

Also: a standby with `hot_standby_feedback = on` running long queries holds the primary's horizon.
Fix the holder first (end the session, drop the dead slot, commit/rollback the prepared xact), then vacuum.
Set `idle_in_transaction_session_timeout` (e.g. `5min`) for application roles to prevent recurrence.

## 3. Measure bloat

Estimates are cheap; exact numbers need `pgstattuple` (reads the whole relation, run off-peak):

```sql
CREATE EXTENSION IF NOT EXISTS pgstattuple;
SELECT * FROM pgstattuple_approx('orders');        -- tables, uses the visibility map
SELECT * FROM pgstatindex('orders_pkey');          -- B-tree: avg_leaf_density, leaf_fragmentation
```

- `free_percent` + `dead_tuple_percent` > ~30-40% on a big table is worth acting on.
- B-tree `avg_leaf_density` well below ~70% (fillfactor 90) means index bloat.
- Free space inside a table is reused by future inserts; bloat is only a problem when it hurts scans, cache hit
  ratio or disk.

## 4. Tune autovacuum per table

Defaults trigger at 50 rows + 20% of the table (`autovacuum_vacuum_scale_factor = 0.2`): far too late for large
tables. Tune the hot tables, not the whole cluster first.

```sql
ALTER TABLE events SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_threshold = 10000,
  autovacuum_vacuum_insert_scale_factor = 0.05,  -- insert-only tables (Postgres 13+) for visibility map / freezing
  autovacuum_analyze_scale_factor = 0.02
);
```

Cluster-level, for a busy server:

| Setting | Typical change |
| --- | --- |
| `autovacuum_vacuum_cost_limit` | raise from the default (200 via `vacuum_cost_limit`) to 1000-2000 on SSD; it is shared across workers |
| `autovacuum_vacuum_cost_delay` | 2ms is the default since Postgres 12; 0 for a dedicated maintenance window |
| `autovacuum_max_workers` | 5-10 for many tables; more workers split the same cost limit |
| `autovacuum_naptime` | default 1min is fine; lower only with very many databases |
| `maintenance_work_mem` / `autovacuum_work_mem` | 1GB+ on large servers |
| `log_autovacuum_min_duration` | `10s` to see what autovacuum is doing |

## 5. Transaction ID wraparound

```sql
SELECT datname, age(datfrozenxid) AS xid_age, mxid_age(datminmxid) AS mxid_age FROM pg_database ORDER BY 2 DESC;

SELECT c.oid::regclass, age(c.relfrozenxid) AS xid_age, pg_size_pretty(pg_total_relation_size(c.oid))
FROM pg_class c WHERE c.relkind IN ('r','m','t') ORDER BY 2 DESC LIMIT 20;
```

- Anti-wraparound autovacuum starts at `autovacuum_freeze_max_age` (200M). Alert at ~500M; the hard stop is near
  2^31 (~2.1B) when the server refuses new XIDs.
- An anti-wraparound vacuum can't be cancelled by lock conflicts and will block DDL; don't kill it repeatedly.
- If age is climbing: find the blocker (section 2), then `VACUUM (FREEZE, VERBOSE) big_table;` on the oldest tables.
  Postgres 14+ enters a failsafe mode (`vacuum_failsafe_age`, 1.6B) that skips index cleanup and cost delays.
- Multixact age (`mxid_age`) matters too when using `SELECT ... FOR SHARE`/FK-heavy workloads.
- Never let a single-user-mode recovery be the plan; monitor and alert instead.

## 6. Removing existing bloat

| Option | Lock | Use when |
| --- | --- | --- |
| `VACUUM` | none blocking | dead tuples just need reclaiming for reuse |
| `REINDEX INDEX CONCURRENTLY idx` | light | index bloat (Postgres 12+) |
| `pg_repack` (extension) | brief exclusive at the end | table bloat on a live system; needs a PK or unique key and 2x space |
| `VACUUM FULL` / `CLUSTER` | ACCESS EXCLUSIVE for the whole run | maintenance window only |

`VACUUM` only returns space to the OS when the trailing pages are empty. Expect the file size to stay the same.

## 7. Reduce bloat at the source

- HOT updates avoid index churn: don't index columns that update often, and leave room on the page with
  `ALTER TABLE t SET (fillfactor = 90);` for update-heavy tables. Check `n_tup_hot_upd / n_tup_upd` in
  `pg_stat_user_tables`.
- Queue tables: delete in small batches, vacuum aggressively, or partition and drop partitions.
- Time-series retention: partition by time and `DROP`/`DETACH` old partitions instead of `DELETE`.
- Avoid long-running transactions in the app (ORM sessions left open, batch jobs in one transaction).

## Pitfalls

- Disabling autovacuum on a table "for performance": it always comes back as wraparound.
- `VACUUM FULL` on a production table at peak: it locks reads and writes for the duration.
- Treating `n_dead_tup` as exact; it is an estimate from statistics.
- Tuning cost settings while an abandoned replication slot pins the horizon: fix the slot first.
