---
name: pg-index-selection
description: Choose the right Postgres index (B-tree, composite, partial, covering, expression, GIN, GiST, BRIN) for a query or workload. Use when adding an index, a query does a slow Seq Scan or Sort, reviewing a migration that creates indexes, or pruning unused ones.
---

# Choosing Postgres indexes

Start from the query, not the table. Collect the slow queries (`pg_stat_statements`, see `pg-monitoring-queries`)
and their plans (`pg-explain-analyze`), then design the fewest indexes that serve them.

## 1. Decision table

| Query shape | Index |
| --- | --- |
| `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `IS NULL` on scalar columns | B-tree (default) |
| Several predicates together | composite B-tree, equality columns first, then the range or sort column |
| Predicate always includes a fixed condition (`WHERE deleted_at IS NULL`, `status = 'pending'`) | partial index |
| Query reads only a few columns | covering: `INCLUDE (...)` for an Index Only Scan |
| Predicate on an expression (`lower(email)`, `(data->>'id')`, `date_trunc('day', ts)`) | expression index, same expression in the query |
| JSONB containment `@>`, key existence `?`, arrays `@>`/`&&`, full-text `@@` | GIN |
| `LIKE '%foo%'`, `ILIKE`, similarity | GIN with `gin_trgm_ops` (pg_trgm) |
| Ranges, geometry, exclusion constraints, nearest-neighbour `ORDER BY <->` | GiST (or SP-GiST for some types) |
| Huge append-only table, column correlated with physical order (timestamps, serial ids) | BRIN |
| Equality only, no ordering, very long keys | Hash (rarely beats B-tree; prefer B-tree) |
| Vector similarity | pgvector HNSW or IVFFlat |

## 2. Composite B-tree column order

1. Columns compared with `=` first (most selective first is a weak tie-breaker, not the rule).
2. Then **one** range or `ORDER BY` column. Columns after the first range column can only be filtered, not seeked.
3. Match `ORDER BY` direction: `(tenant_id, created_at DESC)` serves `WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`.
4. Mixed directions (`ORDER BY a ASC, b DESC`) need an index declared that way.
5. An index on `(a, b)` also serves queries on `a` alone; drop a separate `(a)` index once you have `(a, b)`.
6. Postgres 18 can use skip scan on a B-tree when the leading column is missing from WHERE but has few distinct
   values. Don't rely on it for high-cardinality leading columns.

```sql
-- Serves: WHERE tenant_id = $1 AND status = 'open' ORDER BY created_at DESC LIMIT 50
CREATE INDEX CONCURRENTLY orders_tenant_open_created_idx
  ON orders (tenant_id, created_at DESC)
  WHERE status = 'open';
```

## 3. Partial and covering indexes

- Partial: the query's WHERE must imply the index predicate *as written*. `WHERE status = $1` with a parameter
  will not match a partial index on `status = 'open'` under a generic plan.
- Partial indexes are ideal for queues (`WHERE processed_at IS NULL`) and soft deletes: small and hot.
- Unique partial index for conditional uniqueness: `CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL;`
- Covering: `CREATE INDEX ON orders (customer_id) INCLUDE (total, status);` lets the query skip the heap, but only if
  the visibility map is current (watch `Heap Fetches` in the plan; vacuum keeps it current).
- Don't `INCLUDE` wide or frequently updated columns: it bloats the index and blocks HOT updates.

## 4. Expression indexes

```sql
CREATE INDEX CONCURRENTLY users_email_lower_idx ON users (lower(email));
-- query must use exactly lower(email) = lower($1)
```

- The function must be `IMMUTABLE`. `timestamptz::date` depends on the time zone and is not immutable; index
  `(created_at AT TIME ZONE 'UTC')::date` or, better, rewrite as a range on the raw column.
- An expression index gets its own statistics after `ANALYZE`, which also fixes estimates for that expression.
- Often the better fix is to change the query: `created_at >= $1 AND created_at < $1 + interval '1 day'`.

## 5. GIN, GiST, BRIN specifics

- **JSONB GIN:** `jsonb_ops` (default) supports `?`, `?|`, `?&`, `@>`, `@?`, `@@`; `jsonb_path_ops` is smaller and faster
  but supports only `@>`, `@?`, `@@`. Querying `data->>'key' = 'x'` uses neither: use `data @> '{"key":"x"}'` or an
  expression B-tree on `(data->>'key')`.
- **GIN write cost:** `fastupdate` defers inserts into a pending list; large pending lists make reads slow. Tune
  `gin_pending_list_limit` or vacuum more often on write-heavy tables.
- **Trigram:** `CREATE EXTENSION pg_trgm; CREATE INDEX ON products USING gin (name gin_trgm_ops);` serves `%term%`
  with at least 3 characters.
- **GiST** for `tstzrange` overlap and exclusion constraints:
  `EXCLUDE USING gist (room_id WITH =, during WITH &&)` (needs `btree_gist` for the `=` part).
- **BRIN:** tiny (kilobytes for terabytes). Only useful when `pg_stats.correlation` for the column is near 1 or -1.
  Set `pages_per_range` lower (e.g. 32) for more precision; consider `minmax_multi_ops` for some outliers.

## 6. Creating indexes safely in production

- Always `CREATE INDEX CONCURRENTLY` (and `DROP INDEX CONCURRENTLY`) on live tables; it can't run in a transaction
  block, so migration tools need a non-transactional migration.
- A failed concurrent build leaves an `INVALID` index. Find and drop it:
  `SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;`
- Set `lock_timeout` in the migration so it doesn't queue behind long transactions and block everyone.
- Raise `maintenance_work_mem` for the session to speed up the build.
- On partitioned tables: create the index `ON ONLY parent`, build each partition's index concurrently, then
  `ALTER INDEX parent_idx ATTACH PARTITION child_idx`.

## 7. Prune what doesn't earn its keep

```sql
SELECT s.relname, s.indexrelname, s.idx_scan, pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s
JOIN pg_index i USING (indexrelid)
WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC;
```

- Check every replica before dropping: stats are per server, and a read replica may use the index.
- Check how long stats have accumulated (`pg_stat_database.stats_reset`); a monthly report may need it.
- Duplicate indexes: same columns in the same order (a prefix of another index is usually redundant).
- Every index slows writes and prevents HOT updates on its columns. Five well-chosen indexes beat fifteen.

## 8. Verify

1. `EXPLAIN (ANALYZE, BUFFERS)` before and after: the target node changes and buffers drop.
2. If the planner ignores the new index: run `ANALYZE`, check the predicate/expression matches exactly, check types
   (`varchar` vs `text` is fine, `int` vs `numeric` is not), and check `random_page_cost` (1.1 suits SSDs).
3. Watch write latency and `idx_scan` over the next days.

## Pitfalls

- Indexing every foreign key column blindly; do index FK columns that are joined on or used in `ON DELETE` cascades.
- Low-cardinality single-column indexes (`boolean`, `status`): use a partial index instead.
- `OR` across different columns: needs separate indexes (BitmapOr) or a `UNION` rewrite.
- Leading wildcard `LIKE '%x'` can't use a B-tree; `LIKE 'x%'` needs `text_pattern_ops` unless the collation is `C`.
