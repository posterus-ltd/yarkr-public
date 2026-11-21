---
name: gherkin-scenario-writing
description: Write and review Gherkin feature files where every Rule, Scenario and step expresses exactly one idea, in declarative business language a non-technical stakeholder can confirm or correct. Use when writing or editing .feature files, turning acceptance criteria or user journeys into Given/When/Then scenarios, reviewing Cucumber, SpecFlow, Behave or pytest-bdd scenarios, splitting scenarios that are too long or test several behaviours, or deciding between Scenario Outline, Background and plain scenarios.
---

# Gherkin Scenario Writing

The principle behind every rule below: **each thing in Gherkin expresses exactly one idea.** One business rule per
`Rule`, one behaviour per `Scenario`, one thing per step.

The test for a finished feature file: could a non-technical stakeholder read it and confirm or correct the behaviour?

## 1. Write it, in this order

1. **List the business rules** the feature enforces, each as a full sentence. These become the `Rule:` names.
2. **Per rule, pick 1–5 examples**: typically the happy case, the boundary and the counter-example. Each becomes a
   `Scenario`.
3. **Per scenario, write the `When` first** (the single action or event), then the `Then` (what an observer sees),
   then only the `Given`s that outcome depends on.
4. **Run the review checklist** at the end of this file and split whatever fails it.

## 2. Rules (`Rule:`)

- **One business rule per `Rule`.** If the name needs "and" to join two rules, split it: "Users must be logged in and
  have a verified email" is two rules, each with its own scenarios. A list inside one idea ("Owners and editors invite
  people") is fine.
- **State it as a rule, not a topic.** "A coupon can only be redeemed before its expiry date", not "Coupons".
- **Give each rule 1–5 scenarios.** Many more means the rule is too broad.

## 3. Scenarios

- **One behaviour per scenario.** That means one `When` block followed by one `Then` block. A second `When`…`Then`
  pair is a second scenario.
- **Name the scenario after the behaviour**: "Expired coupon is rejected", not "Test coupon 3".
- **Keep it short**, around 3–7 steps.
- **Keep scenarios independent.** They don't rely on order or on state left by another scenario; the `Given`s set up
  everything.

## 4. Steps

- **Use Given / When / Then strictly.**
  - `Given` is state ("Given a cart with 2 items").
  - `When` is the single action, or the event that happens.
  - `Then` is an observable outcome, not internal state such as a database row.
- **Don't hide actions in `Then`.** `And "Retry" starts it again` is an untold When/Then pair; make it its own
  scenario.
- **One step does one thing.** "Given I have an account and I'm logged in" is two steps joined by `And`. "Tap and
  confirm" is two steps.
- **One outcome per scenario.** "Then I see A or B" is two scenarios with different `Given`s.
- **`And`/`But` as step keywords are fine.** It is "and" inside a step or a rule name that is the smell.
- **Keep one perspective.** Don't mix "I" and "the user".
- **Leave out incidental detail.** Only include data that matters to the rule.
- **Prefer declarative over imperative.** Describe what, not how:

  ```gherkin
  # Imperative: breaks when the form changes
  When I type "bob@x.com" in the email field
  And I click "Submit"

  # Declarative: survives a redesign
  When Bob signs up with a valid email
  ```

## 5. Structure

- **`Background` is short and holds only `Given` steps.** If readers must scroll up to understand a scenario, it is
  too long.
- **`Scenario Outline` varies data, not behaviour.** Every row exercises the same rule; a different behaviour gets its
  own scenario.
- **Use domain language.** No CSS selectors, endpoints or table names.
- **Tags are for orthogonal concerns** such as `@smoke` or `@wip`, not for what the folder structure already says.
- **`<placeholders>` belong in outlines.** In a plain scenario a parser reads them as literal text.

## 6. Example

```gherkin
Feature: Coupon redemption

  Rule: A coupon can only be redeemed before its expiry date

    Scenario: Valid coupon is applied
      Given a coupon expiring tomorrow
      When the customer redeems it at checkout
      Then the discount is applied to the order

    Scenario: Expired coupon is rejected
      Given a coupon that expired yesterday
      When the customer redeems it at checkout
      Then the order total is unchanged
      And the customer is told the coupon has expired

  Rule: A coupon can only be redeemed once per customer
    ...
```

## 7. Deliberate deviations

A project may break one of these rules on purpose. That is fine when the trade-off is chosen, written down next to
the feature files (a short "Where we deviate" section in their README) and applied consistently. Follow a project's
documented deviations instead of "fixing" them. Common ones:

- **Imperative steps on purpose.** When the scenarios document the screens themselves (user journeys, onboarding
  flows), steps say "I tap" and "I see" with the real UI strings. The cost: a copy change means updating the scenarios.
- **Equivalent options share a step**, e.g. "I sign in with Apple, Google or an email code", where the choice does not
  change the outcome.
- **Placeholders such as `<name>` in plain scenarios**, standing for runtime values in a quoted string, when the files
  are read by people and not run by a parser.

An undocumented deviation is a defect: either fix the scenario or add the deviation to the list.

## Pitfalls

- **The scripted walkthrough.** One long scenario with several `When`s that walks a whole flow. Split it at every
  `When`; move what earlier steps achieved into the next scenario's `Given`s.
- **Topic-named rules.** `Rule: Coupons` groups scenarios without saying what must hold, so nobody can tell which
  example is missing.
- **Asserting internals.** `Then a row exists in orders` passes while the user sees an error. Assert what the actor
  or a downstream system can observe.
- **Outline as a loop.** Rows that need a different `Then` wording, or an `<outcome>` column that switches behaviour,
  are different scenarios wearing one name.
- **Background creep.** Every new scenario adds "one more" shared `Given` until no scenario can be read on its own.
  Move steps only some scenarios need back into those scenarios.
- **Incidental data.** Names, emails and prices that don't affect the outcome make readers hunt for the one value
  that does.

## Review checklist

- [ ] Every `Rule` name is a full sentence stating one rule, with no "and" joining two.
- [ ] Every rule has 1–5 scenarios, including a counter-example.
- [ ] Every scenario has exactly one `When` block and one `Then` block, and around 3–7 steps.
- [ ] Scenario names say the behaviour and its result.
- [ ] No step contains "and" or "or" joining two actions, states or outcomes.
- [ ] Every `Then` is observable from outside; none performs an action.
- [ ] Each scenario runs alone and in any order.
- [ ] One perspective throughout the file.
- [ ] No selectors, endpoints or table names; every value shown matters to the rule.
- [ ] `Background` has only `Given`s and fits on screen with any scenario.
- [ ] Every `Scenario Outline` row exercises the same behaviour; `<placeholders>` appear only in outlines.
- [ ] Deviations from the above are documented by the project, not accidental.
