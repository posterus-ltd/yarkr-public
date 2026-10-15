---
name: pg-explain-analyze
description: Read Postgres EXPLAIN (ANALYZE, BUFFERS) output to find where a slow query spends its time. Use when a query is slow, a plan changed, row estimates look wrong, or someone pastes an EXPLAIN plan and asks why.
---

# Reading EXPLAIN (ANALYZE, BUFFERS)

## 1. Capture the right plan

```sql
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS, FORMAT TEXT) <query>;
```

- `ANALYZE` executes the query. For `INSERT/UPDATE/DELETE` wrap it: `BEGIN; EXPLAIN (ANALYZE, BUFFERS) ...; ROLLBACK;`
- `BUFFERS` is the most useful option after `ANALYZE`; on Postgres 18 it is on by default with `ANALYZE`.
- `SETTINGS` lists non-default planner settings that influenced the plan.
- Postgres 17+: add `SERIALIZE` to include the cost of converting output rows, and `MEMORY` for planner memory.
- Run it twice. The first run often reads from disk (`read=`), the second from cache (`hit=`). Report both if they differ.
- Use the real parameter values. For a prepared statement that is slow only in the app, test the generic plan:
  `EXPLAIN (GENERIC_PLAN) SELECT ... WHERE id = $1;` (Postgres 16+), or `SET plan_cache_mode = force_generic_plan`.
- For queries you can't run by hand, enable `auto_explain` (`auto_explain.log_min_duration = '500ms'`,
  `auto_explain.log_analyze = on`, `auto_explain.log_buffers = on`) and read the plans from the log.
- Paste large plans into a visualiser (explain.depesz.com, explain.dalibo.com) to get exclusive time per node.

## 2. How to read a node

```
Index Scan using orders_customer_id_idx on orders  (cost=0.43..8.45 rows=1 width=64) (actual time=0.020..4.912 rows=1250 loops=40)
  Index Cond: (customer_id = c.id)
  Filter: (status = 'open')
  Rows Removed by Filter: 380
  Buffers: shared hit=51000 read=2300
```

- `cost=startup..total` is in planner units, not ms. Only compare costs within one plan.
- `rows=` (estimate) vs `actual ... rows=` (per loop). **Actual totals = actual rows x loops; time is also per loop.**
  Here: 1250 x 40 = 50,000 rows and ~4.9 ms x 40 = ~196 ms.
- A node's time includes its children. Exclusive time = node time minus children times (per loop, times loops).
- `Buffers` are 8 kB pages, cumulative including children. `read` = from OS/disk, `hit` = shared buffers,
  `dirtied/written` on reads usually means hint bits or a backend doing the checkpointer's job.
- `Rows Removed by Filter` large relative to rows returned = the index is not selective for this query; consider
  a composite or partial index (see `pg-index-selection`).
- Parallel nodes: `Workers Launched: N`, and per-loop rows are averaged across `N+1` processes.

## 3. Triage order

1. **Find the expensive node.** Walk from the top; follow the child with the most time until exclusive time is large.
2. **Check estimates at that node and below.** A misestimate of 10x or more is usually the root cause; the planner
   chose a join type or order based on it. Fix the lowest misestimated node first: errors compound upward.
3. **Check I/O.** High `read=` with low time on a cold run = cache problem; high `hit=` counts in the millions = the plan
   touches far too many pages (wrong index, nested loop over a large set, bloat).
4. **Check spills and memory.** `Sort Method: external merge  Disk: 512000kB`, `Batches: 16` on a Hash node, or
   `HashAggregate ... Disk Usage` mean `work_mem` is too small for this operation. Raise it per session or role
   (`SET work_mem = '256MB'`), not globally: it applies per node per process.
5. **Check the top for overheads.** `Planning Time` large (many partitions, many joins), `JIT:` block with seconds of
   compile time on a short query (set `jit = off` or raise `jit_above_cost`), `Trigger` lines for FK checks on deletes.

## 4. Node patterns and what they mean

| Symptom | Likely cause | First fix |
| --- | --- | --- |
| Seq Scan on a big table returning few rows | no usable index, or a function/cast on the column | index matching the predicate; remove casts |
| Nested Loop with high `loops` on the inner side | outer row estimate too low | fix statistics on the outer input |
| Hash Join building a hash on the huge side | estimate inversion | statistics; check join column types match |
| Bitmap Heap Scan with `Recheck` and `lossy` blocks | bitmap exceeded `work_mem` | raise `work_mem`, or narrower index |
| `Heap Fetches: N` on Index Only Scan, N high | visibility map not current | VACUUM the table (see `pg-vacuum-bloat`) |
| Sort above Limit over many rows | no index provides the order | index on `(filter cols, order cols)` |
| Merge Join with an explicit Sort below | inputs not pre-sorted | often fine; check spill |
| `SubPlan` executed per row | correlated subquery | rewrite as JOIN / LATERAL / EXISTS |
| `CTE Scan` with materialized CTE | `MATERIALIZED` keyword, or a CTE referenced twice | inline it or use `NOT MATERIALIZED` |
| Append over all partitions | partition key not in WHERE, or a non-immutable expression | filter on the key directly |

Partition pruning at execution time shows as `Subplans Removed: N`. If you expected pruning and see none,
the predicate isn't on the partition key, or it compares to a value of another type.

## 5. Row estimate errors: where they come from

- Correlated columns in one WHERE (`city = 'Paris' AND country = 'FR'`): planner multiplies selectivities.
  Use extended statistics (`pg-planner-statistics`).
- Functions or expressions on columns (`lower(email) = ...`, `created_at::date = ...`): default selectivity 0.5% /
  33%. Create an expression index (it gets its own statistics) or rewrite as a range.
- Stale stats after bulk loads: run `ANALYZE table` and recheck.
- `LIKE '%foo%'`, JSONB containment, array overlaps: rough defaults; consider trigram/GIN indexes.
- Joins on skewed keys: the estimate uses averages, skewed keys hurt. Raise the statistics target on the key.
- Table-valued functions estimate 1000 rows unless `ROWS` is set on the function.

## 6. Experiments (session-only, never in production config)

```sql
SET enable_nestloop = off;   -- or enable_seqscan, enable_hashjoin, enable_bitmapscan
EXPLAIN (ANALYZE, BUFFERS) ...;
RESET enable_nestloop;
```

Use these only to prove that a different plan is faster. Then fix the cause (stats, index, query shape) so the
planner picks it on its own. Never ship `enable_*` settings to fix one query.

## 7. Report format

When explaining a plan, return:

1. The one or two nodes that account for most of the time, with their exclusive time and actual vs estimated rows.
2. The root cause in one sentence (e.g. "row estimate for `orders` filter is 1 vs 50,000 actual, so the planner chose
   a nested loop").
3. The fix, ordered by safety: statistics, then index, then query rewrite, then configuration.
4. How to verify: the same `EXPLAIN (ANALYZE, BUFFERS)` and the number you expect to change.

## Pitfalls

- Don't read `cost` as time, and don't forget to multiply by `loops`.
- `EXPLAIN` without `ANALYZE` shows only estimates; it can't prove where time goes.
- `ANALYZE` timing adds overhead on nodes with many rows; use `TIMING OFF` to check if timing itself distorts.
- A fast plan on a dev copy with 1% of the data proves little: plans change with table size and statistics.
- Don't run `EXPLAIN ANALYZE` of a destructive statement outside a transaction you roll back.
