---
name: dbt-docs-exposures
description: Document dbt models, columns and sources, write doc blocks, define exposures for dashboards and apps, and keep schema YAML in sync with SQL. Use when adding or updating model or column descriptions, declaring sources, registering a dashboard as an exposure, or generating dbt docs.
---

# dbt docs, sources and exposures

Documentation lives in YAML next to the models and is rendered by `dbt docs generate` (or dbt Explorer). It is
only useful if it is accurate and maintained in the same PR as the SQL.

## 1. What a model description must say

1. **Grain**: "One row per order line." This is the most important sentence.
2. What it is for and who uses it.
3. Important filters or exclusions ("excludes test accounts and orders before 2020").
4. Freshness / update cadence if not obvious.

```yaml
models:
  - name: fct_order_lines
    description: >
      One row per order line. Revenue facts for finance reporting; excludes test orders
      (`is_test = true`) and cancelled lines. Refreshed hourly.
    columns:
      - name: order_line_id
        description: Primary key. Surrogate key of order_id and line_number.
      - name: net_amount_usd
        description: Line amount after discounts, before tax, converted to USD at the order date's rate.
```

## 2. Column descriptions

- Every column in marts; at least keys and non-obvious columns in staging and intermediate.
- Say what it means, units, and how it is derived if computed. Avoid restating the name ("customer_id: the customer id").
- Note null semantics: "Null until the order ships."
- Enumerations: list values or link to the `accepted_values` test.

## 3. Doc blocks for reuse

Write once, reference everywhere the same concept appears:

```markdown
<!-- models/docs/_finance_docs.md -->
{% docs net_amount_usd %}
Line amount after discounts and before tax, converted to USD using the daily rate on the order date.
{% enddocs %}
```

```yaml
      - name: net_amount_usd
        description: "{{ doc('net_amount_usd') }}"
```

- Doc block names are global across the project: prefix by domain if collisions are likely.
- Use doc blocks for definitions shared by many models (status values, revenue definitions), not for one-offs.
- A `__overview__` doc block replaces the docs site landing page.

## 4. Propagating descriptions

Columns passed through unchanged from upstream should have the same description. Options:
- Doc blocks referenced from each model.
- YAML anchors within one file (`&id` / `*id`).
- `dbt-codegen`'s `generate_model_yaml` to scaffold YAML with columns (and upstream descriptions when
  `upstream_descriptions=true`).
- `dbt-osmosis` (external tool) to propagate descriptions and sync columns; review its diff before committing.

## 5. Sources

```yaml
sources:
  - name: shop
    description: Production Postgres replica of the shop app, loaded by Fivetran.
    database: raw
    schema: shop
    loaded_at_field: _fivetran_synced
    freshness:
      warn_after: {count: 6, period: hour}
      error_after: {count: 24, period: hour}
    tables:
      - name: orders
        description: One row per order as stored by the app; rows are updated in place.
        columns:
          - name: id
            data_tests: [unique, not_null]
```

- Describe the loader and update behaviour (append vs update-in-place vs soft deletes): it determines snapshot and
  incremental design.
- `identifier:` when the physical table name differs from the name you want to use.

## 6. Exposures

Exposures declare downstream consumers so lineage shows what breaks if a model changes, and
`dbt build --select +exposure:weekly_revenue` builds exactly what a dashboard needs.

```yaml
exposures:
  - name: weekly_revenue
    label: Weekly Revenue Dashboard
    type: dashboard            # dashboard | notebook | analysis | ml | application
    maturity: high             # high | medium | low
    url: https://bi.example.com/dashboards/42
    description: Finance's weekly revenue review, used in the Monday leadership meeting.
    depends_on:
      - ref('fct_order_lines')
      - ref('dim_customers')
    owner:
      name: Finance Analytics
      email: finance-analytics@example.com
```

- Keep `depends_on` to the models the consumer queries directly.
- Add exposures for anything that would page someone if it broke: board dashboards, reverse-ETL syncs, ML features.

## 7. Keeping YAML in sync with SQL

Checklist for every PR that changes a model:
1. New columns added to YAML with descriptions; removed columns deleted from YAML.
2. Renamed columns renamed in YAML, tests and doc blocks.
3. Grain changes reflected in the model description and primary-key tests.
4. `dbt parse` passes (catches YAML errors and doc blocks that don't exist).
5. Contracted models: `data_type` updated (see `dbt-tests-contracts`).

Automate: `dbt-project-evaluator` flags undocumented models and missing PK tests; `dbt-checkpoint` pre-commit hooks
(`check-model-has-description`, `check-model-columns-have-desc`) enforce coverage in CI.

## 8. Generating and serving docs

```bash
dbt docs generate          # writes target/catalog.json and manifest.json
dbt docs serve --port 8080 # local only
```

`docs generate` queries the warehouse for column types; run it against production for a published site.
Host the static `target/` files (index.html, manifest.json, catalog.json) behind auth, or use dbt Explorer.

## Pitfalls

- Descriptions copied from column names, adding nothing.
- Docs written once and never updated: stale docs are worse than none. Review YAML in every model PR.
- Persisting docs to the warehouse (`persist_docs: {relation: true, columns: true}`) fails on some adapters for
  long descriptions or quoted columns; test before enabling project-wide.
