---
name: systematic-literature-search
description: Build reproducible, documented database search strategies (PubMed/MEDLINE, Embase, Scopus, Web of Science, Cochrane) with concept blocks, synonyms, MeSH/Emtree, field tags and a search log. Use when planning a systematic, scoping or rapid review search, translating a search between databases, or auditing one.
---

# Systematic literature search

A systematic search must be **sensitive** (finds nearly everything relevant), **reproducible** (someone else can rerun
it and get the same results) and **reported** (PRISMA-S). Precision comes later, at screening. Involve an information
specialist or librarian for a formal systematic review; peer-review the strategy (PRESS checklist).

## 1. Frame the question

Break it into concepts with a framework:
- **PICO** (intervention questions): Population, Intervention, Comparison, Outcome (+ study design).
- **PEO** / **SPIDER** for qualitative or exposure questions; **PCC** (Population, Concept, Context) for scoping reviews.

Usually search only 2–3 concepts (population + intervention/exposure, maybe design). Outcomes are often poorly indexed;
adding them lowers sensitivity. Record the decision.

## 2. Build concept blocks

For each concept collect:
- **Controlled vocabulary**: MeSH (PubMed/MEDLINE), Emtree (Embase), CINAHL Headings. Check the scope note, tree
  position, entry terms and the year it was introduced (older records are indexed under the previous term).
- **Free-text synonyms**: spelling variants (US/UK), abbreviations, brand/generic names, lay terms, plurals via
  truncation, older terminology.
- Harvest terms from 3–5 known relevant "seed" articles (titles, abstracts, author keywords, indexing).

Combine: synonyms within a concept with `OR`; concepts with `AND`. Avoid `NOT` except for clearly safe exclusions
(e.g. animal-only studies with the standard human-filter pattern), since it silently drops relevant records.

## 3. Syntax by platform

| Feature | PubMed | Ovid (MEDLINE/Embase) | Scopus | Web of Science |
| --- | --- | --- | --- | --- |
| Subject heading | `"Diabetes Mellitus, Type 2"[Mesh]` (explodes by default; `[Mesh:NoExp]` to stop) | `exp Diabetes Mellitus, Type 2/` | n/a (use free text) | n/a |
| Title/abstract | `[tiab]` | `.ti,ab.` | `TITLE-ABS-KEY()` | `TS=()` (topic) |
| Truncation | `diabet*` | `diabet*` | `diabet*` | `diabet*` |
| Phrase | `"insulin resistance"[tiab]` | `"insulin resistance".ti,ab.` | `"insulin resistance"` | `"insulin resistance"` |
| Proximity | `"self management"[tiab:~3]` | `self adj3 management` | `self W/3 management` | `self NEAR/3 management` |

Verify syntax against each platform's help page when unsure; interfaces change. Translate searches concept by concept,
mapping subject headings anew per database rather than copying MeSH into Embase.

### Example PubMed block

```text
#1 "Diabetes Mellitus, Type 2"[Mesh] OR "type 2 diabet*"[tiab] OR "T2DM"[tiab] OR "NIDDM"[tiab]
#2 "Self-Management"[Mesh] OR "self manag*"[tiab] OR "self care"[tiab] OR "self-care"[tiab]
#3 "Mobile Applications"[Mesh] OR "mobile app*"[tiab] OR smartphone*[tiab] OR mHealth[tiab] OR "mobile health"[tiab]
#4 #1 AND #2 AND #3
```

## 4. Filters and limits

- Use validated study-design filters (e.g. the Cochrane Highly Sensitive Search Strategy for RCTs in MEDLINE) instead
  of ad-hoc design terms; cite the filter.
- Date and language limits need a justification in the protocol; language limits introduce bias.
- Don't rely on publication-type tags alone; recent records aren't indexed yet. Combine indexed and free-text
  approaches.

## 5. Sources beyond bibliographic databases

Trial registries (ClinicalTrials.gov, WHO ICTRP), preprint servers, grey literature (theses, government reports),
citation chasing (backward via reference lists, forward via citing articles), and contacting experts. Record each.

## 6. Test the strategy

- Check that every seed article is retrieved; if not, find which term would have caught it and add it.
- Scan the first ~100 results for noise patterns; tighten only with terms that don't lose seeds.
- Compare yield across databases for plausibility.

## 7. Search log (required output)

For each database: platform/interface, coverage dates, date searched, full search string exactly as run (line by line
with hit counts), limits/filters, number of records, who ran it. Export all records in RIS or similar with database
labels for deduplication. Plan a re-run (update search) before final analysis if more than ~6–12 months elapse.

```markdown
| Database | Platform | Searched | Lines | Records | Notes |
| MEDLINE | PubMed | 2026-10-16 | see Appendix A | 1,284 | no limits |
```

## Pitfalls

- Searching only titles; or only MeSH (misses recent, unindexed records).
- Too many concepts ANDed together; sensitivity collapses.
- Unreported changes between the protocol and the run.
- Copying one database's syntax verbatim into another.
- Not saving the exact strings with dates, so the search can't be reproduced or updated.
