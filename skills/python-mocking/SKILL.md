---
name: python-mocking
description: Mock Python dependencies correctly - patch where the name is looked up, autospec, monkeypatch, fakes over mocks, AsyncMock, and asserting calls without over-specifying. Use when a test needs to isolate HTTP, DB, time, env vars, filesystem or another module, or when a mock-based test passes but shouldn't.
---

# Mocking in Python tests

Mock at the **boundary** of the unit (network, clock, filesystem, randomness, third-party SDKs), not its internals.
A test that mocks the code under test's own helpers tests the mock.

## Choose the double

| Situation | Use |
| --- | --- |
| Env vars, attributes, cwd, `sys.path` for one test | `monkeypatch` fixture |
| Replace a collaborator and check how it was called | `unittest.mock.patch(..., autospec=True)` or `mocker.patch` (pytest-mock) |
| Collaborator with real behaviour (repo, cache, queue) | hand-written **fake** (in-memory implementation) |
| HTTP via `requests` / `httpx` | `responses` / `respx` (or a fake transport), not patching `requests.get` |
| Time | `time-machine` or `freezegun`, or inject a clock |
| Randomness | inject a `random.Random(seed)` |
| Async collaborator | `AsyncMock` (auto-used by `patch` for `async def` targets when autospecced) |

Prefer fakes and dependency injection when you own the code: pass the client/clock/repo in, and the test passes a fake.
Patching is for code you can't easily restructure.

## Patch where it is looked up

`patch` replaces a **name in a namespace**. Patch the module that *uses* the name, not the one that defines it.

```python
# app/billing.py
from app.gateway import charge          # name `charge` now lives in app.billing

def bill(order): return charge(order.total)

# test
with patch("app.billing.charge", autospec=True) as charge:   # right
    ...
patch("app.gateway.charge")   # wrong: app.billing already holds its own reference
```

If the module does `import app.gateway` and calls `app.gateway.charge(...)`, then patching `app.gateway.charge` is
right. Read the import line before writing the target.

## Always autospec

Without a spec, a `Mock` accepts any attribute and any call signature, so typos and API drift pass silently.

```python
mock = create_autospec(PaymentClient, instance=True)
mock.refund.return_value = Refund(id="r1")
service = BillingService(client=mock)
```

- `patch("x.y", autospec=True)` checks call signatures and attribute names against the real object.
- `spec_set=True` also forbids setting attributes that don't exist.
- Autospeccing a class: use `instance=True`, or configure `MockClass.return_value` for the instance.

## pytest style

```python
def test_reads_api_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "test")
    monkeypatch.delenv("PROXY", raising=False)
    monkeypatch.setattr("app.config.TIMEOUT", 1)
    assert load_config().api_key == "test"

def test_retries_on_timeout(mocker):           # pytest-mock
    send = mocker.patch("app.client.send", autospec=True,
                        side_effect=[TimeoutError, Response(200)])
    assert fetch() == 200
    assert send.call_count == 2
```

Both undo themselves after the test. Never assign `module.attr = Mock()` by hand: it leaks into later tests.

## side_effect and return_value

- `return_value=x`: every call returns x.
- `side_effect=[a, b, Exc]`: successive calls return a, b, then raise.
- `side_effect=SomeError("msg")`: raise.
- `side_effect=func`: compute from arguments (keep it trivial).

## Assert behaviour, not choreography

```python
send.assert_called_once_with("orders", ANY)            # ANY for irrelevant args
args, kwargs = send.call_args
assert kwargs["priority"] == "high"                     # check only what matters
mock.assert_has_calls([call(1), call(2)], any_order=False)
mock.assert_not_called()
```

- Prefer asserting on **outputs and state** (return value, fake repo contents) over call sequences.
- Assert calls only for true side effects at the boundary (email sent, payment charged).
- Over-specified call assertions break on harmless refactors; that is the main cost of mocks.

## Async

```python
fetch = mocker.patch("app.svc.fetch_user", autospec=True)   # async def -> AsyncMock
fetch.return_value = User(id=1)
await handler(1)
fetch.assert_awaited_once_with(1)
```

`assert_awaited_*` catches the bug where the coroutine was created but never awaited.

## Pitfalls

- Patching in the wrong namespace: the test passes but the real call still happens (or the mock is never called).
- `MagicMock` truthiness and iteration: `if client:` is always true, `for x in mock` is empty. Spec it.
- Mocks returned from mocks (`a.b.c.d.return_value`) mean the design leaks internals; introduce a seam.
- Patching `datetime.datetime.now` directly fails (C type); use time-machine/freezegun or inject a clock.
- `patch` as decorator injects mocks bottom-up: the decorator closest to `def` is the first argument.
- Session/module-scoped patches leak into unrelated tests; keep patches function-scoped.
- Never mock what you're testing, or value objects (dataclasses, DTOs): build real ones.

## Checklist

- [ ] Every patch target is the lookup namespace, verified from the import line.
- [ ] `autospec=True` / `create_autospec` on every mock of a real object.
- [ ] Network blocked or faked at the transport layer.
- [ ] Assertions focus on results; call assertions only for boundary side effects, with `ANY` for noise.
