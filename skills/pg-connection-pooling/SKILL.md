---
name: pg-connection-pooling
description: Size Postgres connections and configure PgBouncer (session, transaction, statement modes), including prepared statements, session state and app pool settings. Use when hitting "too many connections", connection storms, high connection latency, or adding PgBouncer or serverless clients.
---

# Connection sizing and pooling

Every Postgres connection is a process with its own memory. Hundreds of mostly idle connections waste RAM and
increase contention; thousands of active ones collapse throughput. Pool them.

## 1. Size the database side first

- Useful concurrency is roughly `cores x 2-4` actively running queries for CPU-bound OLTP. Beyond that, latency grows
  and throughput flattens or drops.
- `max_connections`: keep it modest (100-500). Raising it to 5000 to stop errors moves the failure to memory and
  lock contention.
- Memory per connection: a few MB baseline, plus `work_mem` per sort/hash node per active query. Budget
  `max_connections x work_mem x 2-3` against RAM not used by `shared_buffers`.
- Reserve slots for admins: `superuser_reserved_connections` and, on Postgres 16+, `reserved_connections` for roles
  granted `pg_use_reserved_connections`.

Check what you actually have:

```sql
SELECT state, count(*) FROM pg_stat_activity WHERE backend_type = 'client backend' GROUP BY 1;
SELECT usename, application_name, client_addr, count(*) FROM pg_stat_activity GROUP BY 1,2,3 ORDER BY 4 DESC;
```

Many `idle` = oversized app pools. Many `idle in transaction` = app bugs holding transactions open (fix those; they
also block vacuum).

## 2. Pool topology

```
app instances (small client-side pool each) -> PgBouncer (transaction mode) -> Postgres (small server pool)
```

- Client-side pool per instance: small (5-20). Total client connections = instances x pool size; that number is
  what PgBouncer must accept (`max_client_conn`), not what Postgres sees.
- Serverless / many short-lived processes: always put a pooler in front (PgBouncer, or the provider's: RDS Proxy,
  Supabase Supavisor, Neon's pooler).
- Run PgBouncer close to the DB or as a sidecar; it is single-threaded per process, so for very high throughput run
  several with `so_reuseport = 1`.

## 3. PgBouncer modes

| Mode | Server connection returned | Breaks |
| --- | --- | --- |
| `session` | when client disconnects | nothing; only helps with connection churn |
| `transaction` | at end of each transaction | session state (see below); the usual choice |
| `statement` | after each statement | multi-statement transactions; rarely used |

### Session state that breaks in transaction mode

- `SET` / `RESET` outside a transaction (use `SET LOCAL` inside the transaction, or set per role/database:
  `ALTER ROLE app SET statement_timeout = '30s'`).
- Session advisory locks (`pg_advisory_lock`); use `pg_advisory_xact_lock`.
- `LISTEN/NOTIFY` listeners: connect them directly to Postgres or via a session-mode pool.
- Temporary tables that outlive a transaction; `WITH HOLD` cursors.
- Protocol-level prepared statements: supported since PgBouncer 1.21 when `max_prepared_statements` is set > 0.
  SQL-level `PREPARE`/`EXECUTE` is still not tracked.

## 4. Minimal pgbouncer.ini

```ini
[databases]
app = host=10.0.0.5 port=5432 dbname=app

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = scram-sha-256
auth_file = /etc/pgbouncer/userlist.txt
; or auth_user + auth_query to look users up in Postgres
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 20          ; server connections per (database, user) pair
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 80         ; hard cap per database across users
server_idle_timeout = 600
query_wait_timeout = 30
max_prepared_statements = 200
server_reset_query = DISCARD ALL   ; only applied in session mode
```

- Total server connections = sum over (db, user) pools; keep it under `max_connections` minus admin headroom.
- `default_pool_size` is per user per database: ten app roles x 20 = 200 server connections.
- Watch the admin console: `psql -p 6432 pgbouncer -c 'SHOW POOLS;'` - `cl_waiting` > 0 sustained and `maxwait`
  growing means the server pool is too small or queries are too slow.

## 5. Application pool settings

- Pool size per instance: start at 10, measure, prefer fewer. HikariCP's guidance (`cores x 2 + spindles`) applies to
  the server-side total, not to every instance.
- Set connection `maxLifetime` below any idle timeout on PgBouncer, load balancers or NAT (e.g. 30 min vs 60).
- Validate on borrow cheaply (driver `isValid`, not `SELECT 1` per checkout if the driver has a better check).
- Set `statement_timeout` and `idle_in_transaction_session_timeout` per role.
- Drivers behind transaction-mode PgBouncer:
  - JDBC: fine with `max_prepared_statements`; on older PgBouncer set `prepareThreshold=0`.
  - node-postgres: named prepared statements need `max_prepared_statements`.
  - psycopg 3: works with `max_prepared_statements`; on older PgBouncer set `prepare_threshold=None`.
  - asyncpg: on older PgBouncer set `statement_cache_size=0`.
  - Prisma: add `pgbouncer=true` to the connection string for older PgBouncer versions.

## 6. Diagnosing connection problems

| Symptom | Check |
| --- | --- |
| `FATAL: sorry, too many clients already` | count by `application_name`/`client_addr`; app pools too big or leaking |
| `remaining connection slots are reserved` | same; admins can still log in |
| High latency to get a connection | `SHOW POOLS` `cl_waiting`, `maxwait`; slow queries hogging server conns |
| `prepared statement "S_1" does not exist` | transaction mode without `max_prepared_statements` |
| Settings silently not applied | `SET` used under transaction pooling |
| Many `idle in transaction` | app opens transaction and does network calls inside it |

## Pitfalls

- Pooling twice in session mode (app pool + PgBouncer session) gives no multiplexing benefit.
- Bypassing PgBouncer for migrations is fine, but long DDL locks still hit app traffic.
- Health checks that open a new connection every second from every instance.
- Raising `max_connections` without revisiting `work_mem` and RAM.
