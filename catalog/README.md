# Ark library: conventions

This repo is the public package library for the `posterus-ltd` org on Yarkr, plus the plan for the arks built from it.
All packages publish as `posterus-ltd/<name>`.

```
skills/<name>/SKILL.md          # kind: skill
agents/<name>.md                # kind: agent
toolsets/<name>/.mcp.json       # kind: toolset (MCP), plus README.md
catalog/<domain>.json           # every planned package: name, kind, purpose
arks/<domain>.json              # every planned ark: name, type, description, items
scripts/validate.mjs            # checks catalog + arks against the rules below
scripts/new-ark.mjs             # scaffolds an empty ark (and optional package stubs)
scripts/apply-arks.mjs          # creates arks through the Yarkr API (only arks whose packages exist)
```

## Catalog entry (`catalog/<domain>.json`)

```json
{
  "domain": "languages",
  "packages": [
    { "name": "python-packaging", "kind": "skill", "purpose": "Build and publish Python packages with pyproject.toml, uv and hatch." },
    { "name": "python-reviewer", "kind": "agent", "purpose": "Reviews Python diffs for correctness, typing and idiom.", "skills": ["python-typing"] },
    { "name": "github", "kind": "toolset", "purpose": "GitHub's official MCP server.",
      "source": { "type": "http", "url": "https://api.githubcopilot.com/mcp/", "docs": "https://github.com/github/github-mcp-server", "env": ["GITHUB_PAT"] } }
  ]
}
```

- `name`: slug `^[a-z0-9][a-z0-9-]*$`, **unique across the whole library and all kinds**.
- `purpose`: one line; becomes the basis of the package `description`.
- agents may list `skills` (bare names = packages in this library).
- toolsets need a verified `source`: `type` `http` with the vendor's official `url`, or `stdio` with a real `npx`/`uvx`
  `package`, plus a `docs` link and the `env` variables users set. Never invent a URL or package name.

## Ark entry (`arks/<domain>.json`)

```json
{
  "domain": "languages",
  "arks": [
    {
      "name": "python-testing",
      "type": "skill",
      "topic": "python testing",
      "description": "For Python developers: pytest fixtures, parametrisation, mocking and coverage practices so agents write fast, reliable tests.",
      "items": [ { "package": "pytest-patterns", "required": true }, { "package": "python-mocking", "required": false } ]
    }
  ]
}
```

- `type` is `skill`, `agent` or `mcp`; every item must be a package of the matching kind (`mcp` ⇒ `toolset`).
- 3 to 8 items, one topic. Don't pad.
- `name` unique across all arks; `description` one sentence, ≤ 500 chars, says who it's for and what they get.
- Items may reference packages from any domain's catalog, including `core`.

## Package quality bar

- Skill `description` names the trigger situations. The body is concrete, imperative steps, checklists and pitfalls,
  not generic advice. Long material goes in `references/`.
- Agent bodies state the role, process, decision rules and the exact shape of what it returns.
- Toolset READMEs: first paragraph = description; then the variables to set and where to get them.
- No literal secrets anywhere: `${VAR}` or `${vault:path#key}` only.
