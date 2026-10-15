---
name: ai-search-visibility-audit
description: Check how a brand and its pages appear in AI assistant answers (ChatGPT, Claude, Perplexity, Gemini, Copilot, Google AI Overviews) for a set of key queries, record mentions, citations, accuracy and competitors, and list content gaps to fix. Use when asked about AI visibility, share of voice in AI answers, or why competitors get cited instead.
---

# AI search visibility audit

Measure, for a fixed set of queries, whether AI assistants mention the brand, cite its pages, describe it accurately,
and which competitors and sources they prefer. Then turn the findings into a content and PR to-do list.

## 1. Build the query set (30-100 queries)

Mix these groups and tag each query with its group and the funnel stage:

| Group | Example | Why |
|---|---|---|
| Category / "best" | best CRM for small agencies | Shortlist inclusion |
| Problem | how to stop clients missing invoices | Top-of-funnel citations |
| Comparison | Acme vs Rival | Framing against competitors |
| Brand facts | what does Acme cost, is Acme SOC 2 compliant | Accuracy of what's said |
| Alternatives | alternatives to Rival | Inclusion when buyers switch |
| Use case / persona | CRM for architects with 10 staff | Niche positioning |

Source queries from Search Console, sales call notes, support questions, and competitors' positioning. Keep the set
fixed between audits so results are comparable.

## 2. Run the queries

- Platforms: pick those your audience uses; typically ChatGPT (with search), Perplexity, Google AI Overviews / AI Mode,
  Gemini, Copilot, Claude (with web search).
- Use a logged-out or fresh session, no custom instructions or memory, and a stated location if results are local.
- Answers vary run to run. Run each query 3 times per platform (or use a tracking tool that samples repeatedly) and
  record the share of runs, not a single result.
- Save the full answer text, the cited URLs, the date and the platform/mode. Screenshots for anything surprising.
- Respect each platform's terms of use; don't automate against interfaces where scraping is prohibited. Use official
  APIs or licensed monitoring tools for scale.

## 3. Record per query × platform

| Field | Values |
|---|---|
| Mentioned | yes/no, position in answer (1st, in list, footnote) |
| Cited | which of our URLs, if any |
| Accuracy | correct / outdated / wrong (quote the claim) |
| Sentiment / framing | positive, neutral, negative, caveated |
| Competitors mentioned | names, order |
| Sources cited | domains (ours, competitors, review sites, forums, media, Wikipedia) |

## 4. Analyse

- **Mention rate** per platform and per query group: % of runs that mention the brand.
- **Citation rate:** % of runs citing our domain; which pages get cited.
- **Share of voice:** our mentions ÷ total brand mentions across the competitor set.
- **Accuracy issues:** list every wrong or outdated claim with its likely source (old page, third-party article,
  stale profile).
- **Source map:** which third-party domains are cited most for the category; these are PR and listing targets.
- **Gap queries:** queries where competitors are mentioned and we are not. For each, check: do we have a page that
  answers it? Is it indexed and server-rendered? Is the answer extractable (see answer-engine-optimisation)?

## 5. Turn gaps into actions

| Gap type | Action |
|---|---|
| No page answers the query | Create one, structured for direct answers |
| Page exists, not cited | Rewrite for extractability; add specific facts, tables; improve ranking; internal links |
| Wrong facts about us | Fix on our site, update profiles and listings, request corrections on cited third-party pages |
| Competitors cited via review/comparison sites | Get listed/reviewed on those sites; provide accurate data to them |
| Crawlers blocked | Fix robots.txt / WAF rules for search and user-fetch agents |
| Category framing excludes us | Publish clear positioning page: what we are, who for, vs alternatives |

## Output format

```markdown
## AI visibility audit: <brand> (<date>)
Queries: <n> | Platforms: <list> | Runs per query: <n>

### Headline numbers
| Platform | Mention rate | Citation rate | Share of voice | Accuracy issues |

### Biggest gaps
1. <query group>: competitors X, Y mentioned in 80% of runs; we appear in 10%. Cited sources: <domains>. Cause: <...>

### Inaccurate claims
| Claim (quote) | Platform | Correct fact | Likely source | Fix |

### Action list (prioritised)
| # | Action | Queries affected | Owner | Effort |

### Appendix: raw results (link to sheet)
```

## Pitfalls

- Drawing conclusions from one run per query; variance is high.
- Changing the query set between audits, making trends meaningless.
- Personalised sessions (memory, history, location) skewing results.
- Treating AI visibility as separate from SEO: most citation gains come from pages that already rank and from
  third-party coverage.
- Reporting "AI says we're the best" as a KPI; track rates over time instead.
