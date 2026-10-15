---
name: answer-engine-optimisation
description: "Structure content so AI assistants and AI search features (ChatGPT, Claude, Perplexity, Gemini, Google AI Overviews, Copilot) can find, understand and cite it: direct answers, clear entities, evidence and crawler access. Use when writing or revising content for AI visibility, GEO or AEO, or when pages rank but aren't cited in AI answers."
---

# Answer engine optimisation (AEO / GEO)

AI answer engines retrieve pages (usually via a search index), extract passages, and synthesise an answer with
citations. To be cited, a page must be (1) retrievable, (2) easy to extract a self-contained answer from, and
(3) trustworthy enough to be chosen over alternatives. Classic SEO covers most of (1); this skill focuses on the rest.

## 1. Make sure you can be retrieved

- Ranking in traditional search still matters: Google AI Overviews draw on Google's index, Copilot on Bing's, and
  ChatGPT search and others use their own crawlers plus search partners. Pages not indexed by Google and Bing are
  rarely cited.
- Check `robots.txt` for AI user agents and decide deliberately. Common ones: `GPTBot` (OpenAI training),
  `OAI-SearchBot` (ChatGPT search), `ChatGPT-User` (user-triggered fetches), `ClaudeBot`, `Claude-SearchBot`,
  `Claude-User` (Anthropic), `PerplexityBot`, `Google-Extended` (controls use in Gemini models; AI Overviews use
  normal Googlebot crawling). Blocking a search/user-fetch agent removes you from that assistant's answers.
- Serve the main content in HTML. Many AI fetchers don't execute JavaScript; content only rendered client-side is
  often invisible to them.
- Avoid putting key facts only in images, PDFs behind forms, or interactive widgets.

## 2. Write extractable answers

- **Lead with the answer.** Put a 40-80 word direct answer immediately under the heading that asks the question,
  then elaborate. The passage should make sense if lifted out alone.
- **Headings as questions or explicit topics** people ask ("How long does a heat pump last?").
- **Self-contained passages:** repeat the subject instead of "it" or "this" at the start of key paragraphs.
- **Structured formats for structured facts:** tables for comparisons and specs, numbered lists for steps, short
  definition sentences ("X is a Y that Z.").
- **Specific, quotable facts:** numbers with units, dates, named sources. "Most heat pumps last 15-20 years (Energy
  Saving Trust, 2025)" is citable; "heat pumps last a long time" is not.
- **Cover follow-up questions** on the same page: comparisons, costs, edge cases, "is it worth it".

## 3. Make entities unambiguous

- Use the full official name of your brand, products and people consistently, at least once per page.
- State what the entity is and how it relates to others: "Acme Drill X200 is a 20V cordless drill made by Acme Ltd."
- Organization and Person structured data with `sameAs` links to official profiles (see seo-structured-data).
- Keep facts consistent across your site, profiles (LinkedIn, Crunchbase, Wikipedia/Wikidata if applicable), and
  marketplaces. Inconsistent facts get dropped or misstated.
- An "About" page and author pages that state credentials plainly.

## 4. Earn trust signals

- Original data, research, benchmarks or first-hand testing: the content most often cited because nobody else has it.
- Visible author, date published and date updated; cite primary sources with links.
- Be mentioned on sites the assistants already trust (industry publications, reviews, comparison sites, forums such as
  Reddit and community Q&A). Assistants frequently cite third-party pages about you rather than your own.
- Keep facts current: outdated prices or specs get contradicted by fresher sources.

## Page rewrite procedure

1. List the 5-15 questions the page should answer (from Search Console queries, People Also Ask, sales/support
   questions, and asking assistants directly).
2. Map each question to a heading; write a direct-answer paragraph under each.
3. Add a summary block at the top (key facts as a short list or table).
4. Replace vague claims with specific, sourced facts; add a comparison table where users compare options.
5. Add or fix Article/Organization/Product structured data.
6. Confirm the content is in the server-rendered HTML (`curl -s <url> | grep "<key phrase>"`).
7. Record the target questions so ai-search-visibility-audit can measure citations before and after.

## llms.txt

`/llms.txt` is a proposed convention for pointing LLMs at key content. Adoption by major assistants is unconfirmed;
treat it as optional and low priority compared with the steps above.

## Pitfalls

- Writing for "the AI" at the expense of readers; answer engines reward the same clarity humans do.
- FAQ blocks of thin, generic Q&As duplicated across pages.
- Hiding the answer below a long intro or behind "read more" toggles that require JS.
- Blocking AI crawlers by default in a CDN/WAF bot setting without realising it (check bot management rules).
- Claiming guaranteed citations or rankings: AI answers vary by user, phrasing and time; measure trends, not single runs.
