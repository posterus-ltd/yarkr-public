---
name: pytest-fixtures
description: Structure pytest fixtures well - scopes, factory fixtures, conftest.py layering, yield teardown and avoiding hidden coupling. Use when writing or refactoring fixtures, adding conftest.py, sharing setup across tests, or debugging fixture order, leaks or slow setup.
---

# pytest fixtures

Fixtures are dependency injection for tests. Good fixtures make each test's inputs visible in its signature; bad ones
hide state that leaks between tests.

## Decide the shape first

| Need | Use |
| --- | --- |
| One ready-made object, same every time | plain fixture returning it |
| Several objects with varying fields | **factory fixture** returning a function |
| Resource that needs cleanup | `yield` fixture (teardown after `yield`) |
| Expensive, read-only resource (DB engine, compiled schema) | wider `scope` (`module`/`session`) |
| Per-test isolation on top of an expensive resource | session fixture + function fixture that wraps it (e.g. transaction rollback) |
| Same test against several backends/configs | parametrised fixture (`params=[...]`) |

## Patterns

Yield teardown - cleanup always runs, even when the test fails:

```python
@pytest.fixture
def server(tmp_path):
    proc = start_server(data_dir=tmp_path)
    yield proc
    proc.terminate()
    proc.wait(timeout=5)
```

Code before `yield` that raises means teardown does not run; acquire one resource per fixture so a failure in
the second never strands the first.

Factory fixture - keeps defaults in one place, lets each test state only what matters:

```python
@pytest.fixture
def make_user(db):
    created = []
    def _make(name="ada", *, admin=False, **extra):
        user = User(name=name, admin=admin, **extra)
        db.add(user)
        created.append(user)
        return user
    yield _make
    for u in created:
        db.delete(u)

def test_admin_can_delete(make_user):
    admin = make_user(admin=True)
    target = make_user("bob")
    ...
```

Scope layering - expensive outer, isolated inner:

```python
@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DB_URL)
    yield eng
    eng.dispose()

@pytest.fixture
def db(engine):
    with engine.connect() as conn:
        tx = conn.begin()
        yield Session(bind=conn)
        tx.rollback()
```

A fixture may only request fixtures of the **same or wider** scope; a session fixture requesting a function fixture
raises `ScopeMismatch`.

Parametrised fixture:

```python
@pytest.fixture(params=["sqlite", "postgres"], ids=str)
def backend(request):
    return make_backend(request.param)
```

Every test that uses `backend` runs once per param. Use `request.node`, `request.config` and
`request.getfixturevalue()` sparingly; they hide dependencies.

## conftest.py layering

- `tests/conftest.py`: fixtures used across the suite (db, client, factories). Keep it small.
- `tests/<area>/conftest.py`: fixtures for that area only. A fixture defined lower overrides one of the same name above.
- Do not import from `conftest.py`; pytest discovers it. For shared helpers that are not fixtures, use a normal module
  (`tests/helpers.py`) or a plugin listed in `pytest_plugins` in the **root** conftest only.
- Built-ins to prefer over hand-rolled ones: `tmp_path`, `tmp_path_factory` (session scope), `monkeypatch`, `capsys`,
  `caplog`, `request`.

## Avoid hidden coupling

- `autouse=True` only for things every test in that directory truly needs (resetting a global registry, blocking
  network). Never autouse something a test's logic depends on: name it in the signature instead.
- No mutable objects at module or session scope that tests modify. If a session fixture returns a dict/list, return a
  copy from a function-scoped wrapper or make it immutable (tuple, `MappingProxyType`, frozen dataclass).
- Tests must not depend on order. If test B passes only after test A, a fixture is leaking; find it with
  `pytest -p randomly` (pytest-randomly) or by running B alone.
- `@pytest.mark.usefixtures("x")` is for side-effect-only fixtures; if the test uses the value, request it as an argument.
- Don't return "god objects" (a `context` holding app, db, user, client). Separate fixtures compose better and show
  what each test really needs.

## Debugging

```bash
pytest --fixtures tests/api              # list available fixtures and where they're defined
pytest --setup-show tests/api/test_x.py  # show setup/teardown order and scopes
pytest --setup-plan                      # plan without running
pytest --durations=10                    # find slow setup (look at "setup" rows)
```

Slow suite? Check `--durations`: a function-scoped fixture that builds something immutable is the usual culprit;
widen its scope.

## Checklist

- [ ] Each fixture does one thing; cleanup via `yield`, not `try/finally` in the test.
- [ ] Scope is as narrow as isolation requires and as wide as cost demands.
- [ ] No test mutates a shared (module/session) fixture.
- [ ] Factories instead of many near-identical fixtures (`admin_user`, `admin_user_with_org`, ...).
- [ ] autouse fixtures are few, local and side-effect only.
- [ ] Suite passes in random order and with `-n auto` (pytest-xdist).
