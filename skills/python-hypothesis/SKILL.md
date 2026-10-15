---
name: python-hypothesis
description: Write property-based tests with Hypothesis - choosing properties, built-in and composite strategies, stateful RuleBasedStateMachine tests, settings profiles and reproducing shrunk failures. Use for parsers, serializers, data structures, math or any code where example tests miss edge cases.
---

# Property-based testing with Hypothesis

Example tests check cases you thought of. Properties check a rule against hundreds of generated inputs and shrink any
failure to a minimal example.

## 1. Find the property

| Pattern | Example |
| --- | --- |
| Round trip | `decode(encode(x)) == x` |
| Oracle / reference | `fast_sort(xs) == sorted(xs)` |
| Invariant | output length, sortedness, sum preserved, no negative balance |
| Idempotence | `normalize(normalize(s)) == normalize(s)` |
| Metamorphic | `search(q, docs + [unrelated])` contains `search(q, docs)` |
| Doesn't crash | `parse(text)` returns or raises only `ParseError` |

Avoid re-implementing the function inside the test; that's the same bug twice.

## 2. Basic test

```python
from hypothesis import given, example, strategies as st

@given(st.lists(st.integers()))
@example([])                    # pin known edge cases so they always run
def test_sort_matches_builtin(xs):
    assert my_sort(xs) == sorted(xs)

@given(st.text())
def test_roundtrip(s):
    assert decode(encode(s)) == s
```

## 3. Strategies

- Primitives: `st.integers(min_value=0)`, `st.floats(allow_nan=False, allow_infinity=False)`, `st.text(max_size=50)`,
  `st.binary()`, `st.booleans()`, `st.none()`, `st.datetimes(timezones=st.timezones())`, `st.uuids()`, `st.emails()`.
- Collections: `st.lists(x, min_size=1, max_size=20, unique=True)`, `st.dictionaries(k, v)`, `st.tuples(a, b)`,
  `st.frozensets(x)`.
- Choice: `st.sampled_from(Enum)`, `st.one_of(a, b)` / `a | b`, `st.just(v)`.
- Objects: `st.builds(User, name=st.text(min_size=1), age=st.integers(0, 130))`; `st.from_type(User)` uses type hints.
- Transform: `.map(f)` to derive, `.filter(pred)` only for rarely-rejected values (heavy filtering triggers a health
  check), `.flatmap` when one value determines another's strategy.
- `st.data()` to draw interactively inside the test when later draws depend on runtime results.

Composite strategy for dependent values:

```python
@st.composite
def slices(draw):
    xs = draw(st.lists(st.integers(), min_size=1))
    i = draw(st.integers(0, len(xs) - 1))
    j = draw(st.integers(i, len(xs)))
    return xs, i, j
```

Constrain by construction (bounds, `min_size`) rather than `assume()`/`filter`. Use `assume(cond)` only for rare
rejections.

## 4. Stateful testing

For APIs with sequences of operations (caches, queues, repositories), compare against a simple model:

```python
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant, precondition, initialize

keys = st.text(min_size=1, max_size=3)

class StoreMachine(RuleBasedStateMachine):
    @initialize()
    def setup(self):
        self.store = KeyValueStore()      # system under test
        self.model = {}                   # trivially correct model

    @rule(k=keys, v=st.integers())
    def put(self, k, v):
        self.store.put(k, v)
        self.model[k] = v

    @precondition(lambda self: self.model)
    @rule(data=st.data())
    def delete_existing(self, data):
        k = data.draw(st.sampled_from(sorted(self.model)))
        self.store.delete(k)
        del self.model[k]

    @rule(k=keys)
    def get(self, k):
        assert self.store.get(k) == self.model.get(k)

    @invariant()
    def same_size(self):
        assert len(self.store) == len(self.model)

TestStore = StoreMachine.TestCase
```

Use `Bundle` when rules create values (ids, handles) that later rules consume.

## 5. Settings and profiles

```python
# conftest.py
import os
from hypothesis import settings, HealthCheck
settings.register_profile("ci", max_examples=500, deadline=None)
settings.register_profile("dev", max_examples=50)
settings.load_profile(os.getenv("HYPOTHESIS_PROFILE", "dev"))
```

- `deadline=None` for code with variable timing (I/O, JIT warm-up); otherwise flaky `DeadlineExceeded`.
- Function-scoped pytest fixtures are **not** reset between generated examples; Hypothesis raises a health check.
  Create per-example state inside the test, or use a context manager.
- Commit nothing from `.hypothesis/` except deliberately; add it to `.gitignore`. In CI, caching it speeds up
  re-finding old failures.

## 6. When it fails

Hypothesis prints the **shrunk** falsifying example. Then:

1. Add it as `@example(...)` so it's a permanent regression case.
2. Fix the code (or the property, if the property was wrong - decide explicitly).
3. To replay exactly, use the printed `@reproduce_failure(...)` decorator temporarily, or `--hypothesis-seed=N`.

`pytest --hypothesis-show-statistics` shows how many examples ran and how many were rejected.

## Pitfalls

- Properties weaker than they look: `assert result is not None` proves little. Pair with one strong property.
- Floats: decide on NaN/inf/`-0.0` explicitly; compare with `math.isclose` when rounding is legit.
- Huge inputs slow suites; set `max_size` on collections and text.
- Randomness or time inside the code under test makes failures irreproducible; inject them.
- Don't loop inside a `@given` test; let Hypothesis generate the loop.
