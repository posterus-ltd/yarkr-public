---
name: function-design
description: Design and review functions that are small, single-purpose, take few parameters, and have no hidden side effects. Use when writing or splitting functions, refactoring long methods, designing a function signature, or reviewing a diff for functions that do too much.
---

# Function design

A good function can be understood from its name and signature, tested without elaborate setup, and changed
without touching unrelated behaviour. Size is a symptom; the real targets are **one level of abstraction,
one reason to change, and visible effects**.

## Checklist (use when writing or reviewing)

1. **One job.** Can you describe it in one sentence without "and"? "Validates the order and charges the card"
   is two functions plus a coordinator.
2. **One level of abstraction.** Don't mix `chargeCustomer(order)` with `buf[i] = byte & 0xff` in the same body.
   Extract the low-level steps into named helpers.
3. **Parameters: 0–3 is normal.** At 4+, look for a missing concept (`DateRange`, `RetryPolicy`, an options
   object). Never pass a boolean that switches behaviour (`render(true)`); split into two functions or use an enum.
4. **No hidden side effects.** A function named like a query (`getX`, `isY`, `computeZ`) must not write to the
   DB, mutate its arguments, change globals, or send messages. If it must, the name says so.
5. **Command-query separation.** Either change state or return information. Exceptions: well-known idioms like
   `pop()` or "insert and return id".
6. **Explicit inputs.** Read time, randomness, config and environment through parameters or injected
   dependencies, not from globals inside business logic. This makes it testable and deterministic.
7. **Fail clearly.** Validate at the boundary, then trust inputs inside. Pick one error style per layer
   (exceptions, `Result`, `(value, err)`) and don't return `null` to mean three different things.
8. **Return early.** Guard clauses for invalid/trivial cases at the top beat nested `if` pyramids.
9. **Length heuristic.** Over ~30–40 lines or more than 2 levels of nesting: look for an extraction. Not a hard rule;
   a flat 60-line `switch` mapping codes to messages can be fine.

## Refactoring moves

| Smell | Move |
| --- | --- |
| Comment explaining a block | Extract the block into a function named after the comment |
| Boolean flag parameter | Split into two functions, or replace with an enum |
| Long parameter list | Introduce a parameter object, or move the function onto the type that owns the data |
| Deep nesting | Guard clauses; extract loop body; replace conditional with lookup table/polymorphism |
| Output parameter (mutated arg) | Return the new value instead |
| Temporal coupling (`init()` must precede `run()`) | Make the constructor/factory return a ready object |

## Example

```python
# before: does four things, reads the clock, has a flag
def process(order, notify=True):
    if order.items:
        total = 0
        for i in order.items:
            total += i.price * i.qty
        if datetime.now().weekday() == 5:
            total *= 0.9
        db.save(order, total)
        if notify:
            email.send(order.customer, f"Total {total}")

# after
def order_total(items: list[Item], discount: Decimal) -> Decimal:
    subtotal = sum(i.price * i.qty for i in items)
    return subtotal * (1 - discount)

def weekend_discount(today: date) -> Decimal:
    return Decimal("0.10") if today.weekday() == 5 else Decimal(0)

def place_order(order: Order, today: date, repo: OrderRepo) -> Decimal:
    if not order.items:
        raise EmptyOrder(order.id)
    total = order_total(order.items, weekend_discount(today))
    repo.save(order, total)
    return total
# notification is the caller's decision, made explicitly
```

```ts
// boolean flag -> two intention-revealing functions
formatDate(d, true)          // what does true mean?
formatDateWithTime(d)        // obvious at the call site
```

## Reviewing functions in a diff

- Read the signature and name first; predict the body; flag where the body surprises you.
- Flag **hidden effects** (writes in a getter, mutation of an argument, global state) as high severity: they
  cause bugs at distant call sites.
- Flag flag-arguments and 5+ parameters on new public functions as suggestions, with the concrete replacement.
- Don't demand extraction of a function used once if the inline version is clearer. Extraction must add a name
  that explains something.
- Don't request refactors of untouched code in a feature PR; mention it as a follow-up at most.

## Pitfalls

- Over-extraction: ten 3-line functions you must jump between to follow one flow. Keep the top-level function
  readable as a story; helpers should be leaves.
- Parameter objects that become bags of unrelated optional fields.
- "Pure" functions that log, increment metrics or cache — usually fine, but name and document caching.
- Default mutable arguments in Python (`def f(x=[])`): shared across calls.
