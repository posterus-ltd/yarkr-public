---
name: pg-monitoring-queries
description: Find slow and expensive Postgres queries, blockers and long transactions with pg_stat_statements, pg_stat_activity, pg_locks and related views. Use when the database is slow right now, locks pile up, a migration hangs, or you need the top queries to optimise.
---

# Monitoring queries in Postgres

Two questions, two toolsets: "what is slow overall?" (`pg_stat_statements`) and "what is happening right now?"
(`pg_stat_activity`, `pg_locks`).

## 1. Setup

```sql
-- postgresql.conf: shared_preload_libraries = 'pg_stat_statements'  (restart required)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Also turn on: `track_io_timing = on` (I/O time per query; cheap on modern systems), `log_lock_waits = on`,
`log_min_duration_statement = '1s'` (or lower), `log_temp_files = 0`, `compute_query_id = auto`.
Grant `pg_read_all_stats` to monitoring roles rather than superuser.

## 2. Top queries (pg_stat_statements)

Rank by total time first: a 5 ms query called 2M times beats a 3 s query called twice.

```sql
SELECT queryid,
       calls,
       round(total_exec_time::numeric / 1000, 1)             AS total_s,
       round(mean_exec_time::numeric, 2)                     AS mean_ms,
       round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS pct,
       rows / nullif(calls, 0)                               AS rows_per_call,
       shared_blks_hit + shared_blks_read                    AS blks,
       temp_blks_written,
       left(regexp_replace(query, '\s+', ' ', 'g'), 120)     AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

Variations:
- `ORDER BY mean_exec_time DESC` with `calls > 100` for consistently slow queries.
- `ORDER BY shared_blks_read DESC` for I/O heavy; `temp_blks_written DESC` for sorts/hashes spilling to disk.
- `stddev_exec_time` high relative to mean = plan instability or parameter-sensitive plans.
- Planning time: `total_plan_time` (if `pg_stat_statements.track_planning = on`).
- Reset after a fix to measure cleanly: `SELECT pg_stat_statements_reset();` (Postgres 17 also records
  `stats_since` per entry so you can tell how long a row has accumulated).

Then take the query text, fill in realistic parameters, and run `EXPLAIN (ANALYZE, BUFFERS)` (see `pg-explain-analyze`).

## 3. What's running now (pg_stat_activity)

```sql
SELECT pid, usename, application_name, client_addr, state,
       now() - xact_start  AS xact_age,
       now() - query_start AS query_age,
       wait_event_type, wait_event,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE backend_type = 'client backend' AND state <> 'idle'
ORDER BY xact_start NULLS LAST;
```

- `state = 'idle in transaction'` with a large `xact_age`: holds locks and blocks vacuum.
- `wait_event_type`: `Lock` (blocked on a lock), `LWLock` (internal contention), `IO` (disk), `Client` (waiting on the
  app), `IPC`, `Timeout`. `NULL` with `state = active` means running on CPU.
- Grouping by `wait_event` across all active sessions gives a cheap "what is the database waiting on" snapshot.

## 4. Who blocks whom

```sql
SELECT blocked.pid                     AS blocked_pid,
       left(blocked.query, 60)         AS blocked_query,
       now() - blocked.query_start     AS waiting_for,
       blocking.pid                    AS blocking_pid,
       blocking.state                  AS blocking_state,
       left(blocking.query, 60)        AS blocking_query
FROM pg_stat_activity blocked
JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(pid) ON true
JOIN pg_stat_activity blocking ON blocking.pid = b.pid
ORDER BY waiting_for DESC;
```

- Follow the chain to the root: the session that blocks others but isn't blocked itself.
- Classic pile-up: a long `SELECT` holds `AccessShareLock`; an `ALTER TABLE` queues for `AccessExclusiveLock`; every
  new query queues behind the `ALTER`. Prevention: `SET lock_timeout = '5s'` in migrations, and retry.
- Lock detail per relation:

```sql
SELECT l.pid, l.locktype, l.relation::regclass, l.mode, l.granted
FROM pg_locks l WHERE l.relation = 'orders'::regclass ORDER BY l.granted, l.pid;
```

## 5. Intervening

```sql
SELECT pg_cancel_backend(<pid>);     -- cancels the current query; session stays
SELECT pg_terminate_backend(<pid>);  -- kills the session; its transaction rolls back
```

- Cancel first; terminate only if cancel doesn't release it (idle in transaction needs terminate).
- Never terminate autovacuum's anti-wraparound run repeatedly; and never kill the postmaster or use `kill -9`.
- Record what you killed and why.

## 6. Other useful views

| View | Use |
| --- | --- |
| `pg_stat_user_tables` | `seq_scan` vs `idx_scan`, `n_dead_tup`, last (auto)vacuum/analyze |
| `pg_stat_user_indexes` | unused indexes (`idx_scan = 0`) |
| `pg_statio_user_tables` | cache hit ratio per table |
| `pg_stat_io` (16+) | I/O by backend type and context: who is reading and writing |
| `pg_stat_checkpointer` (17+), `pg_stat_bgwriter` | checkpoints requested vs timed; backend writes |
| `pg_stat_replication`, `pg_replication_slots` | replica lag, slots retaining WAL |
| `pg_stat_progress_*` | progress of vacuum, create index, analyze, cluster, copy |
| `pg_stat_database` | deadlocks, temp files, conflicts, `xact_rollback` |

Cache hit ratio across the database:

```sql
SELECT sum(heap_blks_hit) * 100.0 / nullif(sum(heap_blks_hit) + sum(heap_blks_read), 0) AS heap_hit_pct
FROM pg_statio_user_tables;
```

Below ~99% for an OLTP workload hints at an undersized `shared_buffers`/RAM or queries scanning too much.

## 7. Report format

For a "the database is slow" investigation, return:

1. Now: active sessions by `wait_event_type`, any blocking chain with its root pid and query.
2. Overall: top 5 queries by total time with calls, mean ms and % of total.
3. One concrete next step per finding (index, statistics, query fix, kill session, config change).

## Pitfalls

- Reading `pg_stat_statements` without knowing when it was last reset.
- Optimising the slowest single query instead of the biggest total.
- Normalised query text hides parameters; slow cases may depend on specific values (check logs/`auto_explain`).
- Stats views are per server: check replicas separately.
