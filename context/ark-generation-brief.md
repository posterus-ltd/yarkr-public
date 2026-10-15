# Yarkr: brief for generating arks

## What Yarkr is

Yarkr ("Your Ark Registry") is an open-source (MIT) registry for AI capabilities. It works with any harness. People write
and review skills, agents and MCP configs on GitHub. Yarkr indexes what gets merged, turns it into immutable versioned
releases, and delivers them to Claude Code, Codex, opencode, Cursor or a plain folder. Delivery goes through an HTTPS MCP
server or the `yarkr sync` CLI. The hosted hub is yarkr.com.

## Unique selling points

- **Content stays in GitHub.** Pull requests are the review and merging is publishing. Yarkr never stores content you
  upload directly.
- **Releases are immutable.** They are content-addressed, signed and tied to their commit. They survive force-pushes,
  and a bad one can be yanked.
- **Arks decide who gets what.** An ark is a curated set of packages handed to a team or a user. Each item has a semver
  range or channel and is either required or optional. A **public ark** can be synced by anyone with no account
  (`npx yarkr-cli sync <org>/<ark>`).
- **Works with every harness.** One package is rendered into each harness's native layout (`.claude/`, `AGENTS.md`,
  `.opencode/`, …).
- **Gives agents only what they need.** The MCP tools return a small index first and full content on request:
  `list_my_ark`, `search_packages`, `get_skill`, `get_agent`, `get_toolset`.
- **Evals ship with each version.** Evals run locally or in CI, and results are uploaded as ci-attested or
  self-reported.
- **Public and private content coexist.** Community content and an org's private content sit side by side, and
  public/OSS use is always free.

## Package types

All packages are published as `<namespace>/<name>`.

- **skill**: a folder with a `SKILL.md`. `description` frontmatter is required and should name when to use the skill. It
  can include `references/`, `scripts/` and `evals/`.
- **agent**: `agents/<name>.md` with frontmatter `name`, `description` (required), and optionally `model`, `tools` and
  `skills` (dependencies).
- **toolset** (MCP): `toolsets/<name>/.mcp.json` in Claude Code format, plus a README whose first paragraph becomes the
  description. Secrets must be `${VAR}` or `${vault:…}`. Literal secrets are refused.
- **`yarkr.yaml`** (optional, next to any asset): `targets`, `tags`, `evals`.

## Hard rules for generating arks

1. **An ark only points at packages.** Every package has to exist in a connected GitHub repo and be indexed first. So
   the job is really: write packages in repos, then assemble arks.
2. **Public arks can only hold public packages** from public repos.
3. **Each ark holds 3 to 8 packages, built around one topic and one type** (skill, agent or mcp). Split broad topics
   into several arks. Don't pad an ark to reach a number.
4. **Ark names** are slugs (`^[a-z0-9][a-z0-9-]*$`) named after the topic and unique within the org. The description is
   one sentence of at most 500 characters saying who the ark is for and what they get.
5. **Reuse packages before writing new ones.** Use `yarkr search "<topic>" --kind <kind> --json` and `yarkr info`. Read
   a package before adding it. Shared packages can appear in many arks.
6. **Never invent MCP server URLs or npm package names.** Use only vendor-official or well-known servers you can
   verify.
7. **Creating an ark goes through the API.** There's no CLI command for it, and it needs an org-admin read/write token:
   - `POST /api/v1/arks/<org>` with `{name, description}`
   - `PUT /api/v1/arks/<org>/<ark>/items/<ns>/<name>` with `{range | channel, required, config?}`
   - Making an ark public: `PATCH … {"public": true}`
8. **Check every ark** with `yarkr sync <org>/<ark> --dry-run --harness claude-code`.

The full step-by-step procedure, including templates, is the `create-ark` guide:
`packages/core/guides/create-ark/SKILL.md`. Over MCP it is available as the `create_ark` prompt or
`get_guide`.

## Suggested approach for ~1000 arks

- Build a topic taxonomy first: languages and frameworks, cloud and infra, data, security, testing, docs, finance and
  legal ops, design, PM, support, and so on. Cross each topic with the types that make sense for it. Not every topic
  needs all three types.
- Write a shared library of high-quality public packages, roughly a few thousand, grouped by topic in a small number of
  public repos. Then assemble arks from that library. Many arks will share core packages.
- Quality beats count. Three good packages are better than eight vague ones.
