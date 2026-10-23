# PRD template

Copy into `docs/PRD.md`. Delete hint lines (in italics) as you fill sections. A section with nothing to say gets
`_None._`, never filler.

```markdown
# <Product name> — PRD

Status: Draft v1 · Owner: <user> · Updated: <YYYY-MM-DD>

## 1. Summary
_Two or three sentences: for whom, what problem, what they can do with v1._

## 2. Problem
_What users do today, why it hurts, evidence if any (own experience counts — say so)._

## 3. Users
| User type | Goal | Context (device, frequency) |
| --- | --- | --- |

Primary user for v1: <type>.

## 4. Goals and success metrics
- Goal: … — Metric: … — Target: … _(or "TBD after baseline")_
- Non-goals: _things this product deliberately won't optimise for._

## 5. Scope
**In v1:** _bullets, one per capability._
**Out of scope:** _bullets, each with a one-line reason ("later", "not our problem", "too risky for v1")._

## 6. User flows
### Flow 1: <name>
1. …
2. …
_3–6 flows. Each step is something the user sees or does._

## 7. Requirements
### Functional
| ID | Requirement | Priority | Flow |
| --- | --- | --- | --- |
| FR-1 | Users can … | Must | 1 |

### Non-functional
| ID | Requirement | Priority |
| --- | --- | --- |
| NFR-1 | Works on current mobile Safari and Chrome | Must |

## 8. Content and data
_Main objects users deal with, in plain words, with rough volumes: "A board has up to ~200 cards"._

## 9. Constraints
_Deadline, platforms, mandated or forbidden tech/vendors, budget, regulation._

## 10. Assumptions
_Defaults the agent chose that the user didn't explicitly confirm. Mark each "(default)"._

## 11. Open questions
| # | Question | Blocks | Owner |
| --- | --- | --- | --- |

## 12. Origin
> _The user's original idea, verbatim._

## Changelog
| Version | Date | Change |
| --- | --- | --- |
| Draft v1 | <date> | Initial PRD from interview |
```

## Requirement wording

- Good: "FR-4 · Users can reorder cards within a column by drag and drop · Should"
- Bad: "FR-4 · Smooth, intuitive card management" (not testable)
- Bad: "FR-4 · Use dnd-kit for sortable lists" (implementation)
- NFRs need a threshold or a concrete target: "Search results appear within 1 s for 10k items", not "fast search".
