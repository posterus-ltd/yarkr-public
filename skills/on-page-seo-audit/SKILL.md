---
name: on-page-seo-audit
description: "Audit a single page or template for on-page SEO: intent match, title and headings, keyword use, content depth, internal links, images, indexability and structured data, then return prioritised fixes. Use when asked to review a page's SEO, diagnose why a page underperforms, or check a page before publishing."
---

# On-page SEO audit

Audit one URL (or one template, with a sample of URLs) and return fixes ranked by expected impact. On-page means what
you control on the page itself; link building and site-wide technical issues are noted only when they block this page.

## Inputs to gather

- The URL and its rendered HTML (fetch it; if it's client-rendered, check what appears without JS and compare).
- The target query or topic. If none is given, infer it from the title/H1 and say so.
- Optional: Search Console data for the URL (queries, impressions, CTR, position).
- The top 3-5 ranking pages for the target query, to compare intent and depth.

## Checklist

**1. Indexability (check first; nothing else matters if this fails)**
- HTTP 200; not redirected; not blocked in `robots.txt`.
- No `noindex` in meta robots or `X-Robots-Tag` header.
- `rel="canonical"` points to itself (or deliberately to the preferred version).
- Main content present in the initial HTML or reliably rendered.

**2. Intent match**
- Page type matches what ranks (guide vs product vs category vs tool vs comparison).
- The answer or main offer appears above the fold, not after a long intro.

**3. Title, meta, URL**
- Unique title, 50-60 chars, primary topic near the start.
- Meta description 120-155 chars describing the page's value.
- URL short, readable, lowercase, hyphenated; no session IDs.

**4. Headings and structure**
- Exactly one H1 stating the topic.
- H2/H3 outline that someone could skim to understand the page; headings phrased as the subtopics people search for.
- No heading levels used only for styling.

**5. Content**
- Covers the subtopics the top results cover (compare their H2s), plus something they don't: original data, examples,
  photos, expert input, a tool.
- Primary term and natural variants appear in title, H1, first 100 words and some subheadings, without stuffing.
- Shows first-hand experience and who wrote it (author with credentials for YMYL topics: health, finance, legal).
- Up to date: visible "updated" date when freshness matters; no stale years, prices or screenshots.
- No thin, duplicated or boilerplate-heavy sections.

**6. Internal links**
- Receives links from relevant pages (check the count in a crawler or Search Console Links report).
- Links out to related pages with descriptive anchors; no "click here".
- Within ~3 clicks of the homepage.

**7. Images and media**
- Descriptive `alt` text on informative images; empty `alt=""` on decorative ones.
- Modern formats (WebP/AVIF), explicit `width`/`height`, lazy-load below the fold only (never the LCP image).
- Descriptive file names.

**8. Structured data**
- Appropriate schema.org type in JSON-LD (Article, Product, BreadcrumbList, Organization...).
- Valid in Google's Rich Results Test; matches visible content.

**9. Page experience**
- Core Web Vitals for the URL or its template (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75, from CrUX/Search Console).
- Mobile-friendly layout, readable font size, no intrusive interstitials.

## Prioritising

Rank each finding by impact × ease:

- **Critical:** indexability failures, wrong canonical, intent mismatch, missing main content in HTML.
- **High:** weak/duplicate title, missing coverage of key subtopics, no internal links pointing in.
- **Medium:** heading structure, images, structured data gaps, CWV issues on the template.
- **Low:** URL tweaks (changing URLs needs redirects and rarely pays off), minor copy.

## Output format

```markdown
## On-page audit: <URL>
Target query: <query> (given / inferred) | Page type: <type> | Date: <YYYY-MM-DD>

### Summary
<2-3 sentences: biggest problem and expected payoff of fixing it>

### Findings
| # | Priority | Area | Issue (evidence) | Fix |
|---|---|---|---|---|
| 1 | Critical | Indexability | Canonical points to /boots/ (view-source line 14) | Self-referencing canonical |

### Content gaps vs top results
- <subtopic> covered by 4/5 competitors, missing here
```

## Pitfalls

- Auditing the raw HTML of a JS app and reporting "no content" when Google renders it fine, or the reverse. Check both.
- Prescribing a keyword density. There is no target percentage.
- Recommending URL changes for small gains.
- Recommending FAQ or HowTo markup for rich results: Google no longer shows HowTo rich results and limits FAQ rich
  results to authoritative government and health sites.
- Treating word count as a goal. Match the depth of what ranks, then add something original.
