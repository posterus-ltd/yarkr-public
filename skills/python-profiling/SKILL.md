---
name: python-profiling
description: Profile Python with cProfile, py-spy, Scalene and memray; read flame graphs and find the real CPU or memory hotspot before optimising. Use when code is slow, a service has high CPU or latency, memory grows, or someone proposes an optimisation without measurements.
---

# Profiling Python

Rule: **measure, locate, then change**. Intuition about hotspots is wrong often enough that every optimisation needs a
profile behind it and a benchmark after it.

## 1. Make it reproducible

- A script, test or request that triggers the slow path in a fixed time (seconds to a minute).
- Realistic input sizes. A 10-row input profiles the startup, not the algorithm.
- Record the baseline: wall time over several runs, Python version, machine.

```bash
python -m timeit -s "from mod import f, data" "f(data)"   # micro
hyperfine 'python script.py'                              # whole program, repeated runs
```

## 2. Pick the profiler

| Question | Tool | Command |
| --- | --- | --- |
| Which functions take the time? (deterministic, built in) | cProfile | `python -m cProfile -o out.prof script.py` |
| Live process / production, no code change, low overhead | py-spy | `py-spy record -o flame.svg --pid PID` |
| What is it doing right now? (hang, deadlock) | py-spy | `py-spy dump --pid PID` |
| CPU vs native vs memory per line, Python vs C time | Scalene | `scalene script.py` |
| Where is memory allocated / what leaks? | memray | `memray run -o out.bin script.py` |
| Which lines inside one function? | line_profiler | `kernprof -l -v script.py` with `@profile` |
| Slow imports / startup | `-X importtime` | `python -X importtime -c "import app" 2> imports.log` |

## 3. cProfile

```bash
python -m cProfile -o out.prof script.py
python -c "import pstats; pstats.Stats('out.prof').sort_stats('cumulative').print_stats(25)"
snakeviz out.prof     # optional browser view
```

- `cumulative` (cumtime): time in the function **including** callees - find the expensive subtree.
- `tottime`: time in the function body itself - find the leaf doing the work.
- `ncalls` very high with small per-call time: call overhead; batch or hoist.
- cProfile adds overhead per call, so it over-weights code with many tiny calls. Confirm with a sampling profiler.

Profile one function in a test or notebook:

```python
import cProfile, pstats
with cProfile.Profile() as pr:
    run()
pstats.Stats(pr).sort_stats("cumulative").print_stats(20)
```

## 4. py-spy (sampling, attach to anything)

```bash
py-spy record -o flame.svg -- python script.py        # launch under profiler
py-spy record -o flame.svg --pid 1234 --duration 30   # attach
py-spy record --native --subprocesses -o flame.svg -- python script.py
py-spy record --format speedscope -o prof.json -- python script.py
py-spy top --pid 1234                                 # live top-like view
```

Attaching to another process may need `sudo` on macOS/Linux, or `--cap-add SYS_PTRACE` in Docker.
`--idle` includes threads waiting on I/O/locks; leave it off for CPU questions, turn it on for latency questions.

## 5. Reading a flame graph

- x-axis width = share of samples (time). Order on the x-axis is alphabetical, not chronological.
- y-axis = stack depth; the top edge is where the CPU was.
- Look for **wide plateaus**: a wide frame with nothing above it is self time (the hotspot). A wide frame with many
  thin children means the cost is spread out; look for a common caller to optimise.
- Wide `<built-in method ...>` / native frames under your code: the time is in C (regex, json, numpy); fix how often
  you call it or the size of what you pass.
- Lots of time in `__init__`, `deepcopy`, logging formatting or ORM attribute loading is a common real-world finding.

## 6. Memory

```bash
memray run -o out.bin script.py
memray flamegraph out.bin            # HTML: who allocated the peak memory
memray summary out.bin
memray run --live script.py          # live TUI
pytest --memray                      # pytest-memray: per-test allocation report
```

Quick stdlib check for growth:

```python
import tracemalloc
tracemalloc.start()
...; snap1 = tracemalloc.take_snapshot()
...; snap2 = tracemalloc.take_snapshot()
for stat in snap2.compare_to(snap1, "lineno")[:10]: print(stat)
```

Growth between two identical iterations = leak (caches without bounds, global lists, reference cycles held by
closures or `__del__`).

## 7. Report findings like this

```
Workload: import 50k rows (fixtures/orders.csv), 3 runs, CPython 3.13, M2.
Baseline: 8.4s median (8.3-8.6).
Hotspot: 61% in Order.validate -> re.compile (called per row, 50k times).  [py-spy flame.svg]
Change: compile regex once at module level.
After: 3.1s median (3.0-3.2). Tests pass.
```

## Pitfalls

- Profiling debug builds, with coverage enabled, or under a debugger: distorted numbers.
- First run includes import time and cold caches; warm up or report separately.
- Optimising a function that is 3% of runtime. Amdahl: the max gain is 3%.
- Comparing single runs; always report median and spread.
- Profilers in production: prefer py-spy (sampling, out-of-process) over cProfile.
