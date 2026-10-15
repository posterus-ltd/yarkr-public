---
name: python-async-testing
description: Test async Python with pytest-asyncio or AnyIO - loop scopes, async fixtures, AsyncMock, timeouts and detecting leaked tasks or never-awaited coroutines. Use when writing tests for asyncio/AnyIO code, when async tests hang or are flaky, or when warnings mention un-awaited coroutines or pending tasks.
---

# Testing async Python

## Pick one plugin

| Code uses | Plugin | Marker |
| --- | --- | --- |
| plain `asyncio` | pytest-asyncio | `@pytest.mark.asyncio` (or `asyncio_mode = "auto"`) |
| AnyIO / Trio / FastAPI-Starlette internals | AnyIO's pytest plugin (ships with anyio) | `@pytest.mark.anyio` |

Don't mix both on the same tests. Check `pip show pytest-asyncio` for the version: 1.0 (2025) removed the `event_loop`
fixture, so old code that overrides `event_loop` must move to loop-scope settings.

## pytest-asyncio setup

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"                         # async def tests/fixtures need no marker
asyncio_default_fixture_loop_scope = "function"
```

```python
import pytest, pytest_asyncio

@pytest_asyncio.fixture            # plain @pytest.fixture also works in auto mode
async def client():
    async with httpx.AsyncClient(base_url="http://test", transport=ASGITransport(app)) as c:
        yield c

async def test_health(client):
    r = await client.get("/health")
    assert r.status_code == 200
```

- Default: each test gets a fresh event loop. Keep it that way unless setup is expensive.
- Sharing a loop (e.g. one DB pool per module): `@pytest.mark.asyncio(loop_scope="module")` on the tests and
  `@pytest_asyncio.fixture(loop_scope="module", scope="module")` on the fixture. A fixture and the tests using it
  must run on the **same** loop, or you get "attached to a different loop" / "Future ... attached to a different
  loop" errors.
- In `strict` mode (the default if unset), async fixtures must use `@pytest_asyncio.fixture` and tests need the marker.

## AnyIO setup

```python
@pytest.fixture
def anyio_backend():
    return "asyncio"          # or parametrise: params=["asyncio", "trio"]

@pytest.mark.anyio
async def test_worker():
    async with anyio.create_task_group() as tg:
        tg.start_soon(worker)
```

## Mocking awaitables

```python
from unittest.mock import AsyncMock

repo = AsyncMock(spec=UserRepo)
repo.get.return_value = User(id=1)
assert await service.load(1) == User(id=1)
repo.get.assert_awaited_once_with(1)
```

- `patch(..., autospec=True)` on an `async def` yields an `AsyncMock` automatically.
- Use `assert_awaited_*`, not `assert_called_*`: the latter passes even if the coroutine was never awaited.
- Async context managers / iterators: configure `__aenter__` / `__aiter__` on a `MagicMock`/`AsyncMock`, or better,
  write a small fake class.

## Timeouts - never let a test hang

```python
async def test_consumer_stops():
    async with asyncio.timeout(2):          # Python 3.11+; else asyncio.wait_for
        await consumer.run_until_empty()
```

Also add a global safety net with `pytest-timeout` (`timeout = 30` in config) so a deadlock fails one test instead of
the CI job.

Don't `await asyncio.sleep(0.5)` to "wait for" background work. Await an `asyncio.Event`, a queue item, or poll a
condition with a deadline.

## Detect leaks

Leaked tasks and unawaited coroutines are the main source of async flakiness: they finish (or fail) during a later test.

1. Turn warnings into errors: `filterwarnings = ["error"]` catches `RuntimeWarning: coroutine ... was never awaited`
   and `PytestUnraisableExceptionWarning`.
2. Run with `PYTHONASYNCIODEBUG=1` (or `-X dev`) to get tracebacks for slow callbacks and unawaited coroutines.
3. Assert no tasks remain at teardown (put it in the conftest.py of the async tests; it must run on the same loop
   as the test):

```python
@pytest.fixture(autouse=True)
async def no_leaked_tasks():
    before = asyncio.all_tasks()
    yield
    leaked = [t for t in asyncio.all_tasks() - before if not t.done()]
    for t in leaked:
        t.cancel()
    assert not leaked, f"leaked tasks: {leaked}"
```

4. Code fix: own every task. Use `asyncio.TaskGroup` (3.11+) or AnyIO task groups instead of bare
   `asyncio.create_task`, and close clients/sessions with `async with`.

## Time

- Inject a clock or sleep function rather than patching `asyncio.sleep` globally (the loop itself uses it).
- `time-machine` works with asyncio code for wall-clock values; loop time (`loop.time()`) is monotonic and separate.

## Pitfalls

- Sync test calling `asyncio.run()` inside a running loop: "cannot be called from a running event loop". Make the
  test async instead.
- Session-scoped async fixture with function-scoped loop: loop mismatch. Align `loop_scope`.
- Blocking calls (`requests`, `time.sleep`) inside async code stall the loop; debug mode reports slow callbacks.
- Tests passing alone but failing in the suite: almost always a leaked task or a shared client from a previous loop.

## Checklist

- [ ] One async plugin, configured in pyproject.
- [ ] Fixtures and tests share a loop scope.
- [ ] `AsyncMock` + `assert_awaited_*` for awaitables.
- [ ] Explicit timeouts; no sleep-based synchronisation.
- [ ] Warnings as errors and a leaked-task check.
