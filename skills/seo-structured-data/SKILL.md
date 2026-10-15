---
name: seo-structured-data
description: Choose and write schema.org JSON-LD (Article, Product, Organization, BreadcrumbList, LocalBusiness, FAQPage) that matches visible content, and validate it. Use when adding or fixing structured data, chasing rich results, resolving Search Console structured data errors, or helping search and AI systems understand entities on a page.
---

# Structured data (schema.org JSON-LD)

Structured data describes a page's entities in machine-readable form. It can make a page eligible for rich results
and helps search engines and AI systems understand what the page is about. It does not guarantee rich results and is
not a direct ranking factor.

## Rules

1. **Use JSON-LD** in a `<script type="application/ld+json">` block (Google's recommended format). It can be in
   `<head>` or `<body>`, and can be injected by JS, though server-rendered is more reliable.
2. **Mark up only what is visible on the page.** Prices, ratings, FAQs and authors in the markup must appear to users.
   Mismatches can trigger a manual action.
3. **Use the most specific type** that fits (`NewsArticle`/`BlogPosting` over `Article`, `Restaurant` over
   `LocalBusiness`).
4. **Fill Google's required properties** for the rich result you want, then recommended ones you can populate
   accurately. Check the type's page in Google Search Central documentation; requirements change.
5. **Use absolute URLs** and ISO 8601 dates with timezone (`2026-10-16T09:00:00+01:00`).
6. **Connect entities with `@id`** so Organization, WebSite, WebPage and Article refer to each other instead of being
   duplicated.

## Choosing the type

| Page | Type(s) | Notes |
|---|---|---|
| Homepage | `Organization` (or `LocalBusiness`), `WebSite` | logo, url, sameAs (official social profiles), contactPoint |
| Blog post / article | `Article` / `BlogPosting` / `NewsArticle` + `BreadcrumbList` | headline, image, datePublished, dateModified, author (Person with url) |
| Product page | `Product` with `offers` (`Offer`), optional `aggregateRating`, `review` | price, priceCurrency, availability; ratings only if real reviews are on the page |
| Category | `BreadcrumbList`, optionally `ItemList` | |
| Physical location | `LocalBusiness` subtype | address, geo, openingHoursSpecification, telephone |
| Event | `Event` | startDate, location, eventStatus, offers |
| Job posting | `JobPosting` | Strict requirements; remove when the job closes |
| Software / app | `SoftwareApplication` | offers, operatingSystem, applicationCategory |
| Video | `VideoObject` | name, thumbnailUrl, uploadDate, contentUrl or embedUrl |
| FAQ section | `FAQPage` | Rich results now limited to well-known government and health sites; still valid markup |

HowTo rich results are no longer shown by Google; don't add HowTo markup expecting a result.

## Templates

Article:

```json
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": "https://example.com/blog/boot-care#article",
  "headline": "How to Waterproof Hiking Boots",
  "image": ["https://example.com/img/boot-care-16x9.jpg"],
  "datePublished": "2026-09-02T08:00:00+01:00",
  "dateModified": "2026-10-10T12:30:00+01:00",
  "author": { "@type": "Person", "name": "Sam Lee", "url": "https://example.com/authors/sam-lee" },
  "publisher": { "@id": "https://example.com/#organization" },
  "mainEntityOfPage": "https://example.com/blog/boot-care"
}
```

Product:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Acme X200 Cordless Drill",
  "image": ["https://example.com/img/x200.jpg"],
  "sku": "X200-20V",
  "brand": { "@type": "Brand", "name": "Acme" },
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/p/x200",
    "price": "129.00",
    "priceCurrency": "GBP",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
```

Organization (homepage):

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://example.com/#organization",
  "name": "Acme Ltd",
  "url": "https://example.com/",
  "logo": "https://example.com/logo.png",
  "sameAs": ["https://www.linkedin.com/company/acme", "https://github.com/acme"]
}
```

BreadcrumbList: `itemListElement` of `ListItem` with `position` (1-based), `name` and `item` (URL; may be omitted on the
last item).

## Validate

1. **Rich Results Test** (`https://search.google.com/test/rich-results`): Google rich result eligibility, errors and
   warnings, rendered with JS.
2. **Schema Markup Validator** (`https://validator.schema.org`): general schema.org validity for any type.
3. After deploy, watch Search Console's enhancement reports for errors across the template.
4. `JSON.parse` the block in tests or CI to catch syntax errors from templating (unescaped quotes in titles).

## Pitfalls

- Review/rating markup for the business itself on its own site (self-serving reviews aren't eligible for stars).
- Generating `aggregateRating` with zero reviews, or a price that differs from the visible one.
- Marking up content hidden in tabs that never renders, or content only for bots.
- Several conflicting blocks (plugin plus theme both emitting `Organization`). Audit the rendered output.
- Leaving stale `dateModified` or expired `JobPosting` / `Event` markup.
