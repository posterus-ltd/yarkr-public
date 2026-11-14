# posterus-ltd public ark library

<!-- yarkr:badges:start -->
[![Indexed on Yarkr](https://api.yarkr.com/functions/v1/api/api/v1/badges/repos/posterus-ltd/yarkr-public/version.svg)](https://yarkr.com/repos?q=posterus-ltd/yarkr-public)
<!-- yarkr:badges:end -->

Public skills, agents and MCP toolsets for [Yarkr](https://yarkr.com), plus the plan for ~1000 public arks built
from them. Everything here publishes as `posterus-ltd/<name>`; merging to `main` is publishing.

| Path | What |
| --- | --- |
| `skills/<name>/SKILL.md` | skill packages |
| `agents/<name>.md` | agent packages |
| `toolsets/<name>/` | MCP toolsets (`.mcp.json` + README) |
| `catalog/<domain>.json` | every planned package with its purpose (and verified source, for toolsets) |
| `arks/<domain>.json` | every planned ark: name, type, description, items |

Conventions and the quality bar are in [`catalog/README.md`](catalog/README.md).

## Domains

languages · web-mobile · cloud-devops · data · ai-ml · security · engineering-practice · business-ops ·
go-to-market · verticals-productivity · mcp (all MCP-toolset arks)

## Scripts

```bash
node scripts/validate.mjs [-v] [--authored]    # check catalog + arks (and authored files) against the rules
node scripts/new-ark.mjs <domain> <ark> <skill|agent|mcp> [--topic ".."] [--packages a,b,c] [--stubs]
                                                # scaffold an empty ark entry, planned packages, optional stub files
YARKR_TOKEN=… node scripts/apply-arks.mjs [--dry-run] [--public] [--only a,b] [--domain d]
                                                # create arks via the API; skips arks whose packages aren't authored
```

`apply-arks` only touches arks whose every package exists on disk. Run it after the packages are merged and indexed
(`yarkr info posterus-ltd/<name>`), then check each ark with `yarkr sync posterus-ltd/<ark> --dry-run --harness claude-code`.

## Using an ark

```bash
npx yarkr-cli sync posterus-ltd/<ark>      # public arks need no account
```

Toolset READMEs list the environment variables each MCP server needs.

<!-- yarkr:install:start -->
## Install with Yarkr

This repo is indexed on [Yarkr](https://yarkr.com/repos?q=posterus-ltd/yarkr-public). Add one of its packages to your project with the CLI:

```bash
npx yarkr-cli add skill:posterus-ltd/yarkr-public/a11y-aria-usage
```

Or connect your agent over MCP:

```
https://api.yarkr.com/functions/v1/api/mcp/public
```
<!-- yarkr:install:end -->
