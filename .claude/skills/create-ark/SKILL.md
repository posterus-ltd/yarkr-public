---
name: create-ark
description: Build a Yarkr ark (a set of skills, agents or MCP configs handed to a team) for a given topic and type. Use when asked to create, assemble or curate an ark, or to collect a topic's skills, agents or MCP servers for a team in Yarkr.
---

# Creating an ark from a topic and a type

You get two inputs and build one [ark](https://github.com/valado/yarkr/blob/main/docs/arks.md) that hands out packages on that topic.

| Input | Example | Meaning |
| --- | --- | --- |
| **topic** | `invoice processing`, `frontend testing` | what the ark is about |
| **type** | `skill`, `agent` or `mcp` | the kind of package it holds. `mcp` is a **toolset** in Yarkr (`--kind toolset`, `kind: toolset`) |

Plus, from the user or their config: the **org** (its slug is its GitHub login, lowercased), and whether the ark should
be **public**. Ask for the org if you can't tell; default to private.

An ark only points at packages. Packages come from GitHub ([github.md](https://github.com/valado/yarkr/blob/main/docs/github.md)): there is no way to upload content to
Yarkr directly. So the work is: find what exists, write what's missing in a repo, then assemble the ark.

```
1. plan ──▶ 2. find existing ──▶ 3. author missing (PR) ──▶ 4. wait for index ──▶ 5. create ark + items ──▶ 6. verify
```

---

## 1. Plan

- **Ark name:** a slug, `^[a-z0-9][a-z0-9-]*$`, short and named after the topic: `invoice-processing`, not
  `ark-for-invoices`. It must be unique in the org.
- **Description:** one sentence, at most 500 characters, saying who it's for and what they get.
- **Scope:** aim for 3 to 8 packages. Every skill in an ark goes into every member's context; too many makes agents
  worse. Split a broad topic into several arks rather than one big one.
- List the packages you expect to need, each with a one-line purpose, before searching.

## 2. Find what already exists

Reuse beats writing. Search the registry for each planned package:

```bash
yarkr search "<topic words>" --kind <skill|agent|toolset> --json
yarkr info <namespace>/<name>        # source repo, targets, releases, eval results
```

Over MCP, `search_packages` with `scope: "all"`, then `get_skill` / `get_agent` / `get_toolset` to read one.

Keep a package when:

- its description and body actually cover the planned purpose (read it, don't trust the name);
- the org can put it in an ark: **the org's own namespace, or any public package**;
- for a public ark: **it is public**. A public ark can hold nothing else;
- it isn't yanked or archived, and has evals that pass if any are shown.

## 3. Author what's missing

Write each missing package in one of the org's **connected** repos (check **Settings → GitHub** / `/orgs/<org>/github`;
a repo that isn't connected is never indexed). For a public ark the repo must be public. Open **one pull request** with
all new packages, and describe the ark they're for. Merging is publishing; don't push to the default branch yourself
unless the user tells you to.

Package names come from the folder or `name:` frontmatter, slugified, and publish as `<org>/<name>`. Check that the name
doesn't already exist in the org.

### Type `skill`

A folder with `SKILL.md`. Everything in the folder ships with it. This guide is itself one.

```
skills/<name>/
  SKILL.md
  references/…      # optional: long docs the skill loads on demand
  scripts/…         # optional
  evals/core.yaml   # optional but recommended, see https://github.com/valado/yarkr/blob/main/docs/evals.md
```

```markdown
---
name: <name>
description: <what it does and when to use it. Harnesses decide whether to load the skill from this line alone, so name the trigger situations.>
---

# <Title>

<Steps the agent follows. Concrete and imperative. Point to references/ for anything long.>
```

`description` is required; without it the skill isn't indexed.

### Type `agent`

One markdown file under `agents/` (or `.claude/agents/`).

```markdown
---
name: <name>
description: <when to hand work to this agent>
model: <optional>
tools: Read, Grep, Bash          # optional
skills: <skill-name>, other-org/skill   # optional: dependencies, installed with the agent
---

<System prompt: role, what it does, how it decides, what it returns.>
```

- `description` is required; a file without it is treated as a plain doc.
- A bare name in `skills:` means a skill in the same org. Use `ns/name` for another namespace. A skill the agent needs
  that doesn't exist yet is part of this same PR.
- Add the agent's skills to the ark too, or leave them to the dependency: `yarkr sync` installs dependencies either way.

### Type `mcp` (toolset)

One toolset per folder, in Claude Code's `.mcp.json` format:

```
toolsets/<name>/
  .mcp.json
  README.md         # first paragraph becomes the description
```

```json
{
  "mcpServers": {
    "<server>": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${EXAMPLE_TOKEN}" }
    }
  }
}
```

- **No literal secrets.** Values in `env` and `headers` must be `${VAR}` (becomes `${env:VAR}`), `${VAR:-default}`
  or `${vault:path#key}`. A literal value is refused.
- Prefer servers you can verify exist: the vendor's official server, or a well-known package for `stdio` (`npx -y …`).
  Never invent a URL or package name. If you can't confirm one, stop and ask.
- Document in the README which variables each user must set.

### Optional `yarkr.yaml`

Next to any asset, for what can't be inferred:

```yaml
targets: [claude-code, codex]   # default: every harness
tags: [<topic>, …]              # helps search; use the topic
evals: [evals/core.yaml]
```

## 4. Wait for the index

After the PR merges, the push is indexed in the background, usually within a minute. Each package's first release is a
snapshot of the default branch (`0.0.0-main.…`) unless a tag says otherwise.

```bash
yarkr info <org>/<name>     # repeat until it shows a stable version
```

If it never appears, check the repo's row on the org's GitHub page: detection problems (missing description, literal
secret, name clash) are listed there. Fix them in a new PR.

## 5. Create the ark and add items

Ark changes need an **org admin** and a **read and write** token. There's no CLI command for this; use the web app
(**Arks → your org**) or the API. The base URL is the registry (`yarkr whoami` prints it; the hub is
`https://api.yarkr.com/functions/v1/api`).

```bash
API=https://api.yarkr.com/functions/v1/api/api/v1
AUTH="Authorization: Bearer $YARKR_TOKEN"

# Create
curl -sf -X POST "$API/arks/<org>" -H "$AUTH" -H 'content-type: application/json' \
  -d '{"name":"<ark>","description":"<one sentence>"}'

# One call per package
curl -sf -X PUT "$API/arks/<org>/<ark>/items/<ns>/<name>" -H "$AUTH" -H 'content-type: application/json' \
  -d '{"range":"^1","required":true}'
```

Item body:

| Field | Use |
| --- | --- |
| `range` | Semver range. Use `^<major>` for tagged packages. Omit it (and `channel`) to follow `stable`, which suits new snapshot-only packages |
| `channel` | Instead of a range, e.g. `stable` |
| `required` | `true` for the core of the topic; `false` for extras members may exclude |
| `config` | Toolsets only: per-ark overrides, `{"servers": {"<server>": {"env": {…}, "headers": {…}, "args": […], "url": "…"}}}`. Secret values must be `${env:…}` or `${vault:…}` |

The server rejects an item that the org can't use, a private package in a public ark, a bad range, a literal secret,
or a range that conflicts with another ark sharing a member. Read the error and fix the cause; don't retry blindly.

Then, only if asked:

```bash
# Make it public (public packages only)
curl -sf -X PATCH "$API/arks/<org>/<ark>" -H "$AUTH" -H 'content-type: application/json' -d '{"public":true}'

# Add members (they must already belong to the org)
curl -sf -X POST "$API/arks/<org>/<ark>/members" -H "$AUTH" -H 'content-type: application/json' -d '{"email":"…"}'
```

## 6. Verify

```bash
curl -sf "$API/arks/<org>/<ark>" -H "$AUTH"           # items, ranges, description
yarkr sync <org>/<ark> --dry-run --harness claude-code  # resolves every item without writing files
```

For a public ark, also check `yarkr arks` lists it.

## Report back

Tell the user:

- the ark (`<org>/<ark>`), its description and whether it's public;
- each item: reused or new, range, required or optional, one line on why it's there;
- the PR link for new packages, and whether it's merged;
- what's left for them: merging the PR, adding members, setting the toolset variables listed in the READMEs, and how
  people get it (`yarkr sync <org>/<ark>`, or `yarkr mcp add <org>/<ark>`).

## Don'ts

- Don't put literal secrets anywhere: repo, ark config or PR description.
- Don't add packages you haven't read.
- Don't make an ark public, add members, or merge a PR unless the user asked.
- Don't pad the ark to reach a number. Three good packages beat eight vague ones.
