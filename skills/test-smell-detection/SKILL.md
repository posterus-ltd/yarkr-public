---
name: test-smell-detection
description: Spot test smells (mystery guest, eager test, assertion roulette, logic in tests, over-mocking, sleeps, shared state) and fix them. Use when reviewing test code in a diff, debugging flaky or brittle tests, or cleaning up a test suite that is slow or hard to read.
---

# Test smell detection

Good tests are **readable as specifications, fail for one reason, and fail only when behaviour breaks**.
Each smell below breaks one of those properties. When reviewing, name the smell, the consequence, and the fix.

## Smell catalogue

| Smell | Sign | Consequence | Fix |
| --- | --- | --- | --- |
| Mystery guest | test depends on a fixture file, DB seed or shared fixture not visible in the test | reader can't see why it passes | build the relevant data in the test (builders/factories), name fixtures clearly |
| Eager test | one test exercises many behaviours | failure doesn't tell what broke | split: one behaviour per test |
| Assertion roulette | many unlabelled asserts | can't tell which expectation failed | fewer asserts per test; assertion messages; compare whole objects |
| Logic in tests | `if`, loops, try/catch, computing expected values with production-like code | test can be wrong the same way as the code | literal expected values; parametrised tests instead of loops |
| Over-mocking | mocks for value objects or the unit's own collaborators; asserts on call order | tests pin implementation, break on refactors | use real objects/fakes; mock only process boundaries (network, clock, queue) |
| Mocking what you don't own | mocking a third-party SDK's internals | mock drifts from real behaviour | wrap the SDK in an adapter; contract/integration test the adapter |
| Sleepy test | `sleep(2)` / `setTimeout` to wait | slow and flaky | wait on a condition; fake timers; inject the clock |
| Shared mutable state | module-level data, test order dependence | passes alone, fails in suite (or vice versa) | fresh fixtures per test; run with random order |
| Fragile assertion | snapshot of a huge object/HTML, string-equality on error messages, asserting on log lines | breaks on unrelated changes | assert on the specific fields/behaviour that matter |
| Testing private details | reaching into private fields/methods | blocks refactoring | test through the public API |
| No assertion / assert true | test runs code but checks nothing | false coverage | assert the outcome; or expect the specific exception |
| Conditional pass | assertions inside `if` or `catch` that may not run | test passes without checking | `expect.assertions(n)` in Jest, `pytest.raises`, `assertThrows` |
| Irrelevant detail | 30 lines of setup, only 2 fields matter | intent hidden | builders with defaults; set only what the test is about |
| Duplicated setup across files | copy-pasted arrange blocks | divergence | shared builders/fixtures with explicit overrides |
| Non-determinism | real time, randomness, network, unordered collections compared as lists | flaky | inject clock/seed; sort or compare as sets |
| Slow test in unit suite | hits DB/network in a "unit" test | slow feedback | move to integration suite or replace with fake |

## Examples

```python
# Logic in test + assertion roulette
def test_prices():
    for p in products:
        expected = p.base * (1 - discount_for(p))   # re-implements production code
        assert price(p) == expected
# Fix: literal, parametrised cases
@pytest.mark.parametrize("base,tier,expected", [(100, "gold", 90), (100, "none", 100), (0, "gold", 0)])
def test_price_applies_tier_discount(base, tier, expected):
    assert price(make_product(base=base, tier=tier)) == expected
```

```ts
// Conditional pass: if the promise resolves, nothing is asserted
it('rejects bad input', async () => {
  try { await parse('x'); } catch (e) { expect(e.code).toBe('E_PARSE'); }
});
// Fix
it('rejects bad input', async () => {
  await expect(parse('x')).rejects.toMatchObject({ code: 'E_PARSE' });
});
```

## Review process

1. Read each new test's **name**: does it state behaviour and condition ("returns 404 when the order belongs to
   another tenant")? If not, intent is unclear.
2. Read **arrange-act-assert**: is the act a single call? Is everything in arrange needed?
3. Ask **"what change to production code would make this fail?"** If the answer is "nothing plausible", the
   test is weak (no assertion, over-mocked, or asserting on the mock's own return value).
4. Ask **"what harmless refactor would make this fail?"** If many, it is over-specified.
5. Check for flakiness sources: time, randomness, sleeps, order, network, shared state, parallel runs.

## Severity

- Blocking: tests that can't fail (no/conditional assertion, mock asserting itself), non-determinism likely to
  flake in CI, tests that hit real external services.
- Suggestion: over-mocking, eager tests, mystery guests, fragile snapshots.
- Nit: naming style, minor setup duplication.

## Pitfalls

- Demanding one assertion per test literally; asserting several fields of one outcome is fine.
- Replacing all mocks with real infrastructure; boundaries (payment gateway, email) should still be faked.
- Fixing a flaky test with retries instead of removing the cause.
