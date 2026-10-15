---
name: internal-linking-plan
description: Plan internal links between hub (pillar) and spoke pages with descriptive anchor text, and find and fix orphan or deeply buried pages. Use when organising a site's content into topic clusters, after publishing new content, when important pages get little traffic, or when a crawl shows orphan pages.
---

# Internal linking plan

Internal links tell search engines which pages matter and how topics relate, and they move users to the next useful
page. A plan turns ad-hoc "related posts" into a deliberate structure.

## Inputs

- Full list of indexable URLs (sitemap or crawl export from a crawler such as Screaming Frog or Sitebulb).
- Current internal link graph: for each URL, inlinks count, unique linking pages, crawl depth.
- Search Console performance per URL (clicks, impressions, top query).
- Business priority pages (money pages, high-converting guides).

## Step 1: Map topics into clusters

1. Group URLs by topic (by primary query, folder, or manual tagging). Each group is a cluster.
2. Pick one **hub** per cluster: the broadest page that targets the head term ("hiking boots guide"). If none
   exists, note "hub needed" rather than forcing a narrow page into the role.
3. The rest are **spokes**: subtopic pages ("how to waterproof boots", "boots vs trail runners").
4. Pages that fit nowhere: decide merge, redirect, or keep as standalone.

## Step 2: Define required links

| From | To | Rule |
|---|---|---|
| Hub | Every spoke in its cluster | In-body links in the relevant section, not only a list at the bottom |
| Spoke | Its hub | Once, early in the body, with the hub's head term as anchor |
| Spoke | 2-4 sibling spokes | Where the content genuinely references the sibling's topic |
| Hub | Related hubs | Where clusters overlap |
| High-authority pages (homepage, top-traffic posts) | Priority pages | Add contextual links to pages you want to rank |
| Navigation / breadcrumbs | Hubs and categories | Breadcrumb trail on every spoke |

## Step 3: Fix structural problems

- **Orphans** (0 internal inlinks, found in sitemap or analytics but not in crawl): link from the hub and 1-2 related
  spokes, or remove/redirect if the page has no value.
- **Deep pages** (crawl depth > 3): add links from hubs or category pages.
- **Under-linked priority pages:** compare inlinks against traffic and business value; add links from strong pages.
- **Links to redirects or 404s:** update to the final URL.
- **Over-linked footers/sidebars:** sitewide boilerplate links carry less weight than in-content ones; don't rely on them.

## Step 4: Anchor text

- Descriptive and specific to the target: "waterproof hiking boots" not "click here" / "read more" / "this post".
- Vary naturally across linking pages; exact-match on every link looks manufactured, but internal anchors are
  low-risk, so prioritise clarity.
- Don't use the same anchor for two different target URLs: it confuses which page is about what.
- Link from the sentence where the topic is mentioned; the surrounding text adds context.

## Step 5: Deliver the plan

```markdown
## Internal linking plan: <site/section> (<date>)

### Clusters
| Cluster | Hub URL | Spokes | Missing hub? |

### Link additions (prioritised)
| # | Source URL | Target URL | Anchor text | Placement (section / sentence) | Reason |
|---|---|---|---|---|---|
| 1 | /blog/boot-care | /guides/hiking-boots | hiking boots guide | Intro, 2nd paragraph | Spoke→hub, hub has 2 inlinks |

### Orphans and deep pages
| URL | Inlinks | Depth | Action |

### Fixes
| Source | Broken/redirected link | Replace with |
```

Prioritise additions by: target page value (traffic potential, conversions) × gap (few inlinks) × source page
strength (traffic, external links).

## Maintenance rules for editors

- Every new page links to its hub and gets at least 2 inlinks from existing pages on publish day.
- When retiring a page, update internal links before redirecting.
- Re-crawl quarterly; track orphan count and median depth.

## Pitfalls

- Automated "related posts" widgets as the only linking: often irrelevant and placed below the fold.
- Hundreds of links on one page: dilutes each link and hurts usability. Keep in-content links purposeful.
- Linking with `nofollow` internally: it wastes the signal; use it only for login, cart or similar pages, if at all.
- Linking to non-canonical or parameterised URLs instead of the canonical one.
- Building a cluster around a topic with no search demand; check the hub has a real query.
