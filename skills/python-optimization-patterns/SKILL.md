---
name: python-optimization-patterns
description: Speed up a profiled Python hotspot - better algorithms and data structures, hoisting work out of hot loops, batching I/O, caching, NumPy/pandas vectorisation, __slots__, and when to reach for compiled code or concurrency. Use after profiling has identified the slow path and you need to choose and verify a fix.
---

# Python optimisation patterns

Only optimise what a profile has shown to matter, and verify every change with before/after numbers on the same
workload. Apply fixes in this order: biggest wins first.

## 1. Do less work (algorithm and data structure)

| Smell | Fix |
| --- | --- |
| `x in some_list` inside a loop | build a `set`/`dict` once: O(1) lookups |
| nested loops joining two collections | index one side in a dict keyed on the join field |
| `list.pop(0)` / `insert(0, x)` | `collections.deque` |
| repeated `sorted()` to get the min/max/top-k | `heapq.nsmallest/nlargest`, or keep a heap |
| re-sorting to insert into sorted data | `bisect.insort` |
| string `+=` in a loop | collect parts, `"".join(parts)` |
| counting with dict + if | `collections.Counter` |
| recomputing the same pure result | `functools.cache` / `lru_cache(maxsize=...)` |

```python
# before: O(n*m)
active = [o for o in orders if o.customer_id in [c.id for c in vip_customers]]
# after: O(n+m)
vip_ids = {c.id for c in vip_customers}
active = [o for o in orders if o.customer_id in vip_ids]
```

## 2. Do it less often (I/O and calls)

- **N+1 queries**: one query per row is the most common "Python is slow" finding. Fetch in bulk (`IN (...)`,
  `select_related`/`prefetch_related`, `selectinload`), write with `executemany` / bulk insert.
- Batch HTTP calls; reuse one `requests.Session` / `httpx.Client` (connection pooling).
- Hoist invariant work out of loops: compiling regexes, building lookup tables, reading config, `datetime.now()`.
- Logging: `log.debug("x=%s", x)` not f-strings, so formatting is skipped when the level is off.
- Read files in chunks or stream; don't load everything when you need the first match.

## 3. Hot-loop micro-optimisations (only inside a confirmed hot loop)

```python
def line_totals(items, rates):
    out = []
    append = out.append           # bind attribute lookups to locals
    get = rates.get
    for it in items:
        append(it.qty * get(it.sku, 0))
    return out
```

- Local variable access is faster than global/attribute access.
- Comprehensions and built-ins (`sum`, `map`, `any`, `min`) beat equivalent explicit loops.
- Avoid exceptions as control flow in the common path; `dict.get` over `try/except KeyError` when misses are common.
- Expect 10-30% from these, not 10x. If you need 10x, change the algorithm or move the loop to C.

## 4. Memory-heavy objects

- Many small instances: `@dataclass(slots=True)` (3.10+) or `__slots__` cuts per-instance memory and speeds attribute
  access.
- Streams over lists: generators for pipelines that don't need random access.
- `array.array` or NumPy arrays for large homogeneous numeric data instead of lists of floats.

## 5. Vectorise numeric work

```python
# before: Python loop over a million floats
out = [math.sqrt(x*x + y*y) for x, y in zip(xs, ys)]
# after
out = np.hypot(xs_arr, ys_arr)
```

- pandas: never `iterrows()` / `apply(axis=1)` in hot paths; use column operations, `np.where`, `merge` instead of
  per-row lookups, categorical dtypes for repeated strings. Consider Polars for large pipelines.
- Watch conversions: crossing Python <-> NumPy per element erases the gain.

## 6. Concurrency - match it to the bottleneck

| Bound by | Use |
| --- | --- |
| Network/disk waits | `asyncio`, or `ThreadPoolExecutor` for blocking libraries |
| Pure-Python CPU | `ProcessPoolExecutor` / multiprocessing (pickling cost!), or free-threaded CPython 3.13t+ if your deps support it |
| NumPy/C extensions that release the GIL | threads work |

Measure: process pools lose when per-task data is large or tasks are tiny (chunk them).

## 7. Compiled code (last resort)

When the hotspot is a tight numeric/string loop that can't be vectorised: Cython, mypyc (for typed code), Numba
(numeric), or a Rust extension via PyO3/maturin. Each adds build complexity; justify it with numbers.

## 8. Verify

```bash
python -m timeit -s "from mod import old, new, data" "old(data)"
python -m timeit -s "from mod import old, new, data" "new(data)"
```

- Same input, same machine, several runs; report median and spread.
- Add a regression test asserting **equal output** between old and new on representative and edge inputs
  (Hypothesis is ideal for this).
- For lasting protection, pytest-benchmark or a CI timing budget on the critical path.

## Pitfalls

- Caching mutable results or functions with side effects; unbounded `cache` on high-cardinality args leaks memory.
- `lru_cache` on methods keeps `self` alive; cache on a module-level function or use `cached_property`.
- Micro-optimising code that is waiting on the network.
- Trading readability for a gain inside noise. If the improvement is under run-to-run variance, revert.
