---
name: pytest-parametrize
description: Cover cases as tables with pytest.mark.parametrize - readable ids, pytest.param marks, stacked and indirect parametrisation. Use when several tests differ only in inputs/expected output, when adding edge cases, or when a test loops over cases internally.
---

# pytest parametrisation

If two tests differ only by data, they are one test with a table. If a test loops over cases with `for`, it stops at
the first failure and hides the rest: parametrise instead.

## Basic table

```python
import pytest

@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("42", 42),
        ("  7 ", 7),
        ("-0", 0),
        ("1_000", 1000),
    ],
)
def test_parse_int(raw, expected):
    assert parse_int(raw) == expected
```

- Pass argnames as a tuple (or comma string `"raw,expected"`); be consistent across the codebase.
- One row = one case. Keep rows short; if a row needs a comment, give it an `id`.

## Readable ids

Default ids (`raw0-expected0`) are useless in CI output. Give ids so `-k` selection and failure reports make sense:

```python
@pytest.mark.parametrize(
    ("amount", "currency", "expected"),
    [
        pytest.param(0, "EUR", "€0.00", id="zero"),
        pytest.param(1234.5, "EUR", "€1,234.50", id="thousands-sep"),
        pytest.param(-3, "USD", "-$3.00", id="negative"),
        pytest.param(1, "XXX", None, id="unknown-currency",
                     marks=pytest.mark.xfail(raises=KeyError, strict=True)),
    ],
)
def test_format_money(amount, currency, expected): ...
```

Or compute ids: `ids=lambda v: v.name if isinstance(v, Enum) else None` (returning `None` falls back to the default).
Run one case: `pytest "tests/test_money.py::test_format_money[negative]"`.

## Error cases

Separate success and failure tables; don't put `expected_exception` columns into a success test with `if` branches.

```python
@pytest.mark.parametrize("raw", ["", "abc", "1.5", None], ids=repr)
def test_parse_int_rejects(raw):
    with pytest.raises(ValueError, match="invalid integer"):
        parse_int(raw)
```

Always pass `match=` to `pytest.raises` so the test fails if a different error with the same type is raised.

## Stacking = cartesian product

```python
@pytest.mark.parametrize("method", ["GET", "HEAD"])
@pytest.mark.parametrize("path", ["/", "/health"])
def test_public_routes(client, method, path): ...   # 4 cases
```

Use only when every combination is meaningful. Products grow fast; prefer an explicit table of the combinations that
matter.

## Indirect parametrisation

Route a parameter through a fixture when building the value is expensive or needs setup/teardown:

```python
@pytest.fixture
def account(request, make_account):
    return make_account(plan=request.param)

@pytest.mark.parametrize("account", ["free", "pro"], indirect=True)
def test_export_limit(account): ...
```

`indirect=["account"]` makes only that argname indirect. Use a parametrised fixture (`@pytest.fixture(params=...)`)
instead when *every* test using the fixture should run against all values.

## Class and module level

```python
pytestmark = pytest.mark.parametrize("backend", ["memory", "sqlite"])  # every test in module

@pytest.mark.parametrize("tz", ["UTC", "Europe/Sofia"])
class TestScheduling:
    def test_next_run(self, tz): ...
```

## Dynamic cases

Load cases from data files when there are many or they are shared with other tools:

```python
CASES = json.loads((Path(__file__).parent / "cases.json").read_text())

@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
def test_golden(case): ...
```

For generation that depends on CLI options or fixtures, use the `pytest_generate_tests(metafunc)` hook in conftest.py.
When you want inputs the author did not think of, use Hypothesis instead of a bigger table.

## Pitfalls

- Mutable values in a table (dicts, lists) are shared across cases if the code mutates them; copy inside the test or
  build them per case.
- Don't parametrise over fixtures by name strings and call `request.getfixturevalue` unless there is no other way.
- A table with 40 rows that all exercise the same branch adds runtime, not confidence. Pick boundary values:
  empty, one, many, min, max, just-outside, unicode, negative, `None`.
- `xfail` rows should be `strict=True` so they fail loudly once fixed.
- Keep assertions identical for all rows. If rows need different assertions, they are different tests.

## Checklist

- [ ] No `for` loops over cases inside tests.
- [ ] Every non-trivial row has an `id`.
- [ ] Success and error tables are separate; errors use `pytest.raises(..., match=...)`.
- [ ] Boundary values covered; redundant rows removed.
