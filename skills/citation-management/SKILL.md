---
name: citation-management
description: "Manage references with Zotero, BibTeX/BibLaTeX and CSL: import, deduplicate, fix and verify metadata against DOIs/PMIDs, check retractions, and apply citation styles (APA 7, Vancouver, Chicago, Harvard) consistently. Use when cleaning a reference library or .bib file, formatting a bibliography, or fixing broken citations."
---

# Citation management

The reference list must be complete, correct, consistently styled and verifiable. Treat metadata as data: fix it at the
source (the library/.bib file), then let the tool format it. Never invent a reference or fill missing metadata from
guesswork.

## 1. Library hygiene

- One library (Zotero group or `.bib` file) per project; collections or keywords for review stages.
- Import from identifiers wherever possible: DOI, PMID, arXiv ID or ISBN (Zotero's "Add Item by Identifier"), not from
  scraped web pages.
- Attach full-text PDFs where licensed; note the version (preprint, accepted manuscript, version of record).
- In Zotero, the Better BibTeX plugin gives stable citation keys and auto-exports a `.bib` that LaTeX/Pandoc builds
  read.

## 2. Deduplicate

Match in this order: DOI → PMID → normalised title (lowercase, strip punctuation) + year + first author surname.
- Merge rather than delete, keeping the record with the most complete metadata and preserving attachments/notes.
- Watch for false duplicates: conference abstract vs full paper, preprint vs published version, erratum, multi-part
  articles. Keep them distinct but linked (note "published version of…").
- For systematic reviews, record the number of duplicates removed (needed for PRISMA).

## 3. Verify and fix metadata

For each reference (or a sample for large libraries, then all flagged ones):
- Resolve the DOI (`https://doi.org/<doi>`) or query Crossref (`https://api.crossref.org/works/<doi>`) / PubMed
  (`https://pubmed.ncbi.nlm.nih.gov/<pmid>/`) and compare: authors, title, journal, year, volume, issue, pages/article
  number.
- Common errors: all-caps or sentence-mangled titles, missing issue/pages, wrong year (online-first vs print), journal
  abbreviations mixed with full names, authors' particles (van, de) and diacritics, "et al." stored as an author,
  corporate authors split into first/last names (wrap in braces in BibTeX: `author = {{World Health Organization}}`).
- Protect capitalisation in BibTeX titles: `title = {Effects of {COVID-19} on {mRNA} vaccine uptake}`.
- Check retractions and corrections: Zotero flags retracted items using Retraction Watch data; also check the publisher
  page. Flag any retracted work cited as support.

## 4. Apply a style

Use the tool's CSL style (Zotero, Pandoc `--citeproc --csl`) or the LaTeX package (biblatex `style=apa`,
`style=vancouver` via biblatex-vancouver, natbib with a .bst). Do not hand-format.

Key differences to check after formatting:

| Style | In-text | List order | Notes |
| --- | --- | --- | --- |
| APA 7 | (Author, Year); 3+ authors → "et al." from first cite | Alphabetical | Up to 20 authors listed; DOI as https URL; sentence-case article titles |
| Vancouver (ICMJE/NLM) | Numbers in order of first citation | Numerical | Up to 6 authors then "et al."; NLM journal abbreviations |
| Chicago author-date | (Author Year, page) | Alphabetical | Notes-bibliography variant uses footnotes |
| Harvard | (Author Year) | Alphabetical | Many local variants — use the institution's CSL |

Journals often specify a variant; download the journal's own CSL from the CSL style repository when available.

## 5. Cross-check text and list

- Every in-text citation has a list entry, and every list entry is cited (unless a "further reading" list is allowed).
- Author names and years match between text and list (APA); numbering is sequential with no gaps (Vancouver).
- For LaTeX: compile and check the log for `undefined citation` and duplicate-key warnings.
- For Word/Docs with Zotero fields: refresh citations before submission; don't edit field text manually (it's
  overwritten).

## Output

Report: references checked, duplicates merged, fields corrected (with before/after for anything substantive), items
not verifiable (no DOI/PMID found — list them for a human to check), retracted or corrected items, and in-text/list
mismatches.

## Pitfalls

- Copying citations from Google Scholar's "Cite" box: frequently wrong metadata.
- Citing a secondary source as if read in the original.
- Mixing styles after manual edits.
- Generating plausible-looking references that don't exist. If a source can't be found by identifier or exact title
  search, say so.
