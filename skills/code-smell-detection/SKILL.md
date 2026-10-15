---
name: code-smell-detection
description: Recognise code smells (long method, feature envy, shotgun surgery, primitive obsession, duplication, data clumps) and name the refactoring for each. Use when reviewing a diff for maintainability, planning a refactor, or asked why code is hard to change.
---

# Code smell detection

A smell is a cheap-to-spot surface sign of a design problem. It is a prompt to look closer, not a verdict.
Report a smell only with (a) where it is, (b) what change it makes harder, and (c) the specific refactoring.

## Smell catalogue

| Smell | How to spot it | Why it hurts | Refactoring |
| --- | --- | --- | --- |
| Long method | many steps, comments as section headers, deep nesting | hard to test and change one part | Extract Function, guard clauses |
| Large class / god object | many unrelated fields, methods touching disjoint field sets, `*Manager`, `*Service` with 30 methods | every change lands here; merge conflicts | Extract Class along field clusters |
| Long parameter list | 4+ params, same params passed together | call sites unreadable, order mistakes | Introduce Parameter Object |
| Data clumps | the same 2–4 values always travel together (`lat, lng`; `start, end`) | validation duplicated, inconsistent | Extract a value type |
| Primitive obsession | strings/ints for money, ids, emails, statuses; `status == "actv"` | invalid values representable; units mixed | Value objects, enums, branded/new types |
| Feature envy | method uses another object's fields more than its own | logic lives far from its data | Move Function to the envied type |
| Shotgun surgery | one conceptual change needs edits in many files | easy to miss one place | Move/inline into one module |
| Divergent change | one module changes for many unrelated reasons | unrelated changes conflict | Split by reason to change |
| Duplicated code | copy-pasted blocks, near-identical branches | fixes applied to one copy only | Extract Function; but see "rule of three" |
| Switch on type | `switch(kind)` repeated in several places | every new kind edits all switches | Polymorphism or a lookup table |
| Message chains | `a.getB().getC().getD().x` | caller coupled to the whole structure | Hide Delegate, ask don't tell |
| Middle man | class that only forwards calls | indirection without value | Inline / remove |
| Speculative generality | abstract base with one implementation, unused params/hooks "for later" | cost now, benefit maybe never | Inline class, remove params |
| Dead code | unreachable branches, unused exports, commented-out code | misleads readers | Delete (VCS remembers) |
| Temporary field | field only set in some code paths | null checks everywhere | Extract class for that state |
| Mutable shared state | globals, singletons with setters, module-level caches | order-dependent bugs, flaky tests | Pass state explicitly, make immutable |
| Comments as deodorant | comment explains what convoluted code does | the comment drifts from the code | Rename/extract so the comment is unneeded; keep "why" comments |

## Examples

```ts
// Primitive obsession + data clump
function book(roomId: string, start: number, end: number, priceCents: number, currency: string) {}
// ->
function book(room: RoomId, stay: DateRange, price: Money) {}
```

```python
# Feature envy: Invoice logic reaching into Customer
def discount(invoice):
    c = invoice.customer
    if c.tier == "gold" and c.years_active > 3 and not c.has_overdue:
        return 0.1
    return 0
# -> move to Customer.loyalty_discount(); invoice calls it
```

## Process for a diff review

1. Scan only changed and directly adjacent code. Smells in untouched code are out of scope unless the diff makes
   them worse (e.g. adds the 4th copy of a block, adds a 6th `case` to a repeated switch).
2. For each candidate, ask: **does this diff make the next likely change harder?** If no, drop it.
3. Prefer smells introduced by the diff over pre-existing ones. Label pre-existing ones as follow-ups.
4. Write the finding as: location, smell name, concrete cost, refactoring. Example:
   "`billing.ts:88` duplicates the tax rounding in `checkout.ts:140` (third copy). A rate change must edit all
   three. Extract `roundTax(amount)` into `money.ts`."
5. Severity: smells are almost never blocking. Exceptions: duplicated security/money logic where copies have
   already diverged, or mutable shared state that causes a real race.

## Decision rules

- **Rule of three:** two similar blocks can stay; on the third, extract. Premature DRY couples things that only
  look alike. Duplication is cheaper than the wrong abstraction.
- Don't flag size alone. A 50-line function that reads top to bottom is better than six indirections.
- Respect the codebase's idiom. Don't push OO patterns into a functional codebase or vice versa.
- Suggest the smallest refactor that removes the cost; large redesigns go in a separate issue.

## Pitfalls

- Flooding a review with smell nits; pick the two or three that matter.
- Calling a framework convention a smell (e.g. Rails controllers, React hooks patterns).
- Recommending a refactor without tests covering the code; say "add characterisation tests first" when needed.
