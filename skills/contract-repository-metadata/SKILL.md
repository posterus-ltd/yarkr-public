---
name: contract-repository-metadata
description: Define a contract repository metadata schema (parties, type, value, currency, dates, renewal, owner, status, governing law) and normalise contract records for search, reporting and CLM migration. Use when building or cleaning a contract register, migrating to a CLM, or deduplicating counterparties.
---

# Contract repository metadata

A contract repository is only useful if records are consistent: the same counterparty spelled one way, dates in one
format, values in known currencies, every contract linked to its amendments. This skill defines the schema and the
normalisation rules.

## Core schema

| Field | Type | Rules |
| --- | --- | --- |
| `contract_id` | string | Stable, unique, never reused, e.g. `CTR-2026-00042` |
| `title` | string | Document title as signed |
| `contract_type` | enum | `nda`, `msa`, `saas`, `services`, `sow`, `order_form`, `dpa`, `amendment`, `lease`, `employment`, `partner`, `other` |
| `parent_id` | string | For SOWs, order forms, amendments, DPAs: the master agreement id |
| `our_entity` | enum | Legal entity name exactly as registered |
| `counterparty_id` | string | Key into a counterparty master, not free text |
| `counterparty_legal_name` | string | As in the contract |
| `our_role` | enum | `customer`, `vendor`, `partner`, `mutual` |
| `status` | enum | `draft`, `in_negotiation`, `signed`, `active`, `expired`, `terminated`, `superseded` |
| `signature_date` | date | ISO 8601 `YYYY-MM-DD`; last party's signature |
| `effective_date` | date | As stated; else signature date, and note it |
| `end_date` | date | End of current term; null for evergreen |
| `auto_renew` | bool | |
| `renewal_term_months` | int | |
| `notice_days` | int | Non-renewal notice period |
| `notice_deadline` | date | Computed from end_date − notice_days |
| `tcv` | decimal | Total contract value over the committed term |
| `acv` | decimal | Annualised value |
| `currency` | ISO 4217 | `USD`, `EUR`, `GBP` |
| `governing_law` | string | Jurisdiction, e.g. `England and Wales`, `New York` |
| `business_owner` | string | Person or role accountable |
| `legal_owner` | string | |
| `data_processing` | enum | `none`, `personal`, `special_category` |
| `file_ref` | string | Path/URL to the executed PDF |
| `tags` | list | Free tags, lower-case |

Keep the required set small (id, type, our entity, counterparty, status, effective date, owner, file_ref). Optional
fields are better empty than guessed; record `source` and `confidence` for extracted values.

## Normalisation rules

**Counterparties**

1. Maintain a counterparty master: `counterparty_id`, legal name, registration number, country, aliases.
2. Normalise for matching: lower-case, strip punctuation, remove legal suffixes (`inc`, `llc`, `ltd`, `limited`,
   `gmbh`, `sa`, `bv`, `plc`, `corp`, `co`), collapse spaces. Match on the normalised key, then on registration
   number.
3. Different legal entities in the same group are different counterparties; link them with `parent_group`.
4. Never auto-merge on fuzzy matches; queue candidates (e.g. similarity above 0.9) for human confirmation.

**Dates**: convert all to ISO 8601. Ambiguous formats (`03/04/2026`) must be resolved by the contract's
jurisdiction or the document's other dates; flag if unresolvable.

**Values**: store numeric amount and currency separately. Do not convert currencies in the record; do it in
reporting at a stated rate. Record whether values exclude tax.

**Types and statuses**: map free-text values to the enums with an explicit mapping table and keep the original value
in `type_raw` during migration.

**Status from dates**: `active` if effective_date ≤ today ≤ end_date (or evergreen and not terminated); `expired`
if end_date passed with no renewal; recompute nightly rather than editing by hand.

## Migration / clean-up procedure

1. Inventory sources: shared drives, e-signature platform exports, email, existing spreadsheets.
2. Deduplicate files by hash, then by (counterparty, title, signature date).
3. Keep only executed versions as primary records; keep drafts out or tagged `draft`.
4. Link amendments and SOWs to parents.
5. Extract fields (see contract-obligation-extraction for dates and renewals), set confidence.
6. Run validation: required fields filled, enum values valid, end_date ≥ effective_date, notice_deadline computed,
   parent_id exists, no duplicate contract_ids.
7. Produce an exceptions report for owners to fix.

## Useful reports

- Renewals with notice deadline in next 90 days, by owner.
- Contracts with personal data and no linked DPA.
- Active contracts per counterparty and total ACV (vendor concentration).
- Contracts without an owner or file.

## Output

When asked to normalise records, return: the cleaned records (CSV/JSON), a mapping table for every changed value,
a duplicates/merge-candidates list, and the validation exceptions.

## Pitfalls

- Free-text counterparty names: the root cause of most reporting errors.
- Overwriting the original extracted value during normalisation; keep raw and clean.
- Treating amendments as separate contracts with their own renewal dates.
- Storing a TCV that mixes currencies.
