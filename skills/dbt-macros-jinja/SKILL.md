---
name: dbt-macros-jinja
description: Write reusable dbt macros and Jinja - arguments, whitespace control, run_query, adapter.dispatch for cross-database SQL, overriding built-ins like generate_schema_name, and debugging compiled SQL. Use when SQL repeats across models, logic must work on several warehouses, or a macro misbehaves.
---

# dbt macros and Jinja

Macros remove repetition, but every macro is indirection a reader must resolve. Write one when the same SQL appears
in three or more places or encodes a rule that must stay consistent (e.g. currency conversion, fiscal calendar).

## 1. Check packages first

Before writing a macro, check `dbt_utils` (`star`, `pivot`, `generate_surrogate_key`, `date_spine`, `union_relations`,
`get_column_values`, `deduplicate`), `dbt_date`, and the cross-database macros built into dbt
(`dbt.dateadd`, `dbt.datediff`, `dbt.date_trunc`, `dbt.concat`, `dbt.safe_cast`, `dbt.type_string`, `dbt.split_part`,
`dbt.listagg`, `dbt.current_timestamp`).

## 2. A well-formed macro

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name, scale=2) -%}
    round(({{ column_name }} / 100.0)::numeric, {{ scale }})
{%- endmacro %}
```

Document it in YAML so it shows in docs:

```yaml
macros:
  - name: cents_to_dollars
    description: Converts an integer cents column to a dollar amount rounded to `scale` places.
    arguments:
      - name: column_name
        type: string
        description: Column or expression in cents.
      - name: scale
        type: integer
        description: Decimal places, default 2.
```

Rules:
- Pass column names as strings; the macro returns SQL text.
- Use `{%-` / `-%}` to strip whitespace so compiled SQL stays readable.
- Keep macros pure where possible: inputs in, SQL out. Macros that run queries or create objects are harder to test.
- One macro per file, file named after the macro.

## 3. Jinja essentials

```sql
{% set payment_methods = ['card', 'bank_transfer', 'gift_card'] %}

select
    order_id,
    {% for method in payment_methods %}
    sum(case when payment_method = '{{ method }}' then amount else 0 end) as {{ method }}_amount
    {%- if not loop.last %},{% endif %}
    {% endfor %}
from {{ ref('stg_stripe__payments') }}
group by 1
```

- `{{ }}` outputs, `{% %}` executes, `{# #}` comments (not in compiled SQL).
- `loop.last`, `loop.first`, `loop.index` inside for-loops.
- `{{ log('msg', info=true) }}` prints during compile; `{{ exceptions.raise_compiler_error('msg') }}` fails fast on
  bad arguments.
- `var('name', default)` for project variables; `env_var('NAME', default)` for environment values (never secrets in
  compiled SQL that gets logged).
- `target.name`, `target.type`, `target.schema` for environment-aware logic, but keep environment branches rare.

## 4. Querying the warehouse at compile time

```sql
{% set statuses_query %}
    select distinct status from {{ ref('stg_shop__orders') }} order by 1
{% endset %}

{% if execute %}
    {% set statuses = run_query(statuses_query).columns[0].values() %}
{% else %}
    {% set statuses = [] %}
{% endif %}
```

- Guard with `if execute`: during parsing `run_query` returns nothing and the model must still parse.
- `dbt_utils.get_column_values` does the same with caching and a default.
- Dynamic column lists make the model's output depend on data; prefer an explicit list when the set is stable,
  and never in contracted models.

## 5. Cross-database macros with dispatch

```sql
{% macro first_day_of_month(date_col) -%}
    {{ return(adapter.dispatch('first_day_of_month', 'my_project')(date_col)) }}
{%- endmacro %}

{% macro default__first_day_of_month(date_col) -%}
    date_trunc('month', {{ date_col }})
{%- endmacro %}

{% macro bigquery__first_day_of_month(date_col) -%}
    date_trunc({{ date_col }}, month)
{%- endmacro %}
```

- dbt looks for `<adapter>__name`, then parent adapters, then `default__name`.
- To override a package's implementation, set the search order in `dbt_project.yml`:

```yaml
dispatch:
  - macro_namespace: dbt_utils
    search_order: ['my_project', 'dbt_utils']
```

## 6. Overriding built-ins

Common overrides live in `macros/`:

```sql
-- use custom schema names as-is in prod, prefixed in dev
{% macro generate_schema_name(custom_schema_name, node) -%}
    {%- if custom_schema_name is none -%}
        {{ target.schema }}
    {%- elif target.name == 'prod' -%}
        {{ custom_schema_name | trim }}
    {%- else -%}
        {{ target.schema }}_{{ custom_schema_name | trim }}
    {%- endif -%}
{%- endmacro %}
```

Also: `generate_alias_name` and `generate_database_name`. Changing these moves where every
model is built; coordinate with a full deploy.

## 7. Hooks and operations

- `pre_hook`/`post_hook` on models for grants or session settings; prefer the `grants` config over GRANT hooks.
- `on-run-start`/`on-run-end` in `dbt_project.yml` for run-level tasks.
- `dbt run-operation macro_name --args '{key: value}'` for one-off admin macros (cleanup of stale schemas, etc.).

## 8. Debugging

1. `dbt compile --select model` and read `target/compiled/<project>/models/.../model.sql`.
2. For macros, `dbt run-operation` with `log()` calls, or `dbt show --inline "select {{ my_macro('x') }}"`.
3. Whitespace or trailing comma problems: check `-` placement and `loop.last`.
4. "macro not found": check the namespace in `adapter.dispatch` and that the file is under `macro-paths`.

## Pitfalls

- Macros that hide `ref()` calls in string building: dbt can't infer lineage from a string. Always call `ref()`
  directly with a literal name.
- Deeply nested macros calling macros: keep to one or two levels.
- Using Jinja to generate SQL that a simple CTE could express.
- Comparing `target.name == 'prod'` all over models instead of in one config or macro.
