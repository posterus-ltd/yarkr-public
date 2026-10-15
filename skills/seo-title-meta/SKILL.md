---
name: seo-title-meta
description: Write title tags and meta descriptions that fit display limits, match search intent and earn clicks. Use when creating or rewriting titles and meta descriptions for pages, fixing duplicate or truncated titles from a crawl, or improving low click-through rate pages from Search Console.
---

# Title tags and meta descriptions

The title tag is a ranking and relevance signal and the main headline in search results. The meta description is not
a ranking factor but often becomes the snippet, so it drives click-through. Google rewrites both when it thinks they
don't match the query, so the goal is to make yours the best available summary.

## Limits

| Element | Target | Why |
|---|---|---|
| Title | 50-60 characters (~580 px on desktop) | Longer titles truncate with "..." |
| Meta description | 120-155 characters | Snippets usually cut around 920 px desktop; mobile shows a bit more |

Pixel width matters more than characters: "WWW" is wider than "iii". Use a SERP preview tool when close to the limit.
Front-load the important words so truncation loses only the brand.

## Title formula

`<Primary keyword / topic> <qualifier or benefit> | <Brand>`

- Put the primary keyword (the way searchers phrase it) near the start.
- Add one differentiator: year for time-sensitive content, number for lists, format ("Template", "Calculator",
  "Guide"), audience ("for Small Teams") or a concrete benefit.
- Brand at the end with ` | ` or ` - `; drop it if space is tight, except on the homepage.
- Every indexable URL gets a unique title. Templates should inject a distinguishing variable (product name, city,
  category).

Examples:

| Page | Weak | Better |
|---|---|---|
| Category | Products - Acme | Waterproof Hiking Boots for Men \| Acme |
| Blog | Our thoughts on onboarding | SaaS Onboarding Checklist: 14 Steps to Activate Users |
| Product | Acme X200 | Acme X200 Cordless Drill, 20V, 2 Batteries \| Acme |
| Local | Services | Emergency Plumber in Leeds, 24/7 Call-Out \| PipeCo |

## Meta description formula

1. Answer "what will I get on this page?" in the first sentence, using the primary keyword naturally (Google bolds
   query matches).
2. Add a specific detail: price from, number of items, time saved, free trial, shipping, rating.
3. End with a soft call to action if it fits ("Compare models", "Download the template").

Example: "Compare 12 waterproof hiking boots tested on 200 km of trail. Fit notes, weights and prices from £89, with
free returns."

## Matching intent

Check the current top results for the query before writing:

- **Informational** ("how to", "what is"): promise the answer; avoid sales language.
- **Commercial investigation** ("best", "vs", "review"): show comparison scope and criteria.
- **Transactional** ("buy", product names): price, availability, shipping, returns.
- **Navigational** (brand queries): brand first, clear page name.

If the top 10 are all guides and your page is a product page, a better title won't fix the mismatch; flag it.

## Workflow for a batch of pages

1. Export URL, current title, current description, H1, primary query (from Search Console or a keyword map),
   impressions, CTR, average position.
2. Prioritise pages with high impressions, position 1-10 and CTR below what is typical for their position.
3. Rewrite title and description per page; keep H1 consistent in topic with the title (it doesn't need to be identical).
4. Check: unique, within limits, keyword near start, no stuffing, no clickbait the page doesn't deliver.
5. Ship, annotate the change date, and compare CTR over 4 weeks against the prior 4 weeks at similar positions.

Output as a table: `URL | Current title | New title (chars) | Current description | New description (chars) | Reason`.

## HTML

```html
<title>Waterproof Hiking Boots for Men | Acme</title>
<meta name="description" content="Compare 12 waterproof hiking boots tested on 200 km of trail...">
```

One `<title>` and one meta description per page, in `<head>`. In frameworks, check the rendered HTML (view source or
URL Inspection) to confirm the tags aren't duplicated by layout and page components.

## Pitfalls

- Keyword stuffing ("Boots, Hiking Boots, Waterproof Boots, Cheap Boots"): triggers rewrites and looks spammy.
- Same description across hundreds of pages; better to leave it empty than duplicate it on low-value templates.
- Titles promising content the page doesn't have; raises bounce and Google rewrites it.
- Changing titles on pages ranking #1 for their main query without a clear reason.
- ALL CAPS, emoji spam, or special characters used to stand out; Google may strip them.
- Forgetting pagination, filter and search-result pages: noindex them or give them distinct titles.
