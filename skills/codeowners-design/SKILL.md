---
name: codeowners-design
description: Design or audit CODEOWNERS rules (GitHub, GitLab) that route reviews to the right teams without bottlenecking on a few people. Use when creating or restructuring a CODEOWNERS file, debugging why the wrong people are requested, or fixing review bottlenecks.
---

# Designing CODEOWNERS

CODEOWNERS maps paths to the people or teams who must (or should) review changes to them. Done well, PRs reach the
right reviewers automatically. Done badly, two people approve everything and the rest of the team waits.

## How matching works (GitHub)

- File location: `.github/CODEOWNERS`, `CODEOWNERS` at the root, or `docs/CODEOWNERS`; GitHub uses the first it
  finds in that order, on the PR's base branch.
- Patterns follow gitignore-style rules, but **the last matching line wins**, and only that line's owners apply.
  Order from general (top) to specific (bottom).
- Not supported: `!` negation and `[ ]` character ranges. Escape a leading `#` with `\#`.
- Owners are `@user`, `@org/team` or an email of a user. Users and teams need **write access** to the repo; a team
  must be visible. Invalid owners are silently skipped; GitHub shows errors on the CODEOWNERS file view.
- A pattern with no owners means "nobody owns this", which lets you carve out exceptions:
  ```
  /apps/web/            @org/web-team
  /apps/web/generated/
  ```
- Ownership only enforces review when branch protection or a ruleset enables "Require review from Code Owners".

GitLab differences: sections (`[Backend]`), optional sections (`^[Docs]`), and a required approval count per section
(`[Database][2]`); within a section the last match wins, and every matching section applies.

## Design rules

1. **Own by team, not by person.** `@org/payments` survives holidays and reorgs; `@alice` does not. Use individuals
   only for a genuinely single-owner area, and pair them with a team.
2. **Mirror the architecture.** One line per module/service/package directory, owned by the team that runs it in
   production. If ownership is unclear, that is an org problem to surface, not to paper over with a catch-all.
3. **Catch-all at the top, or none.** `* @org/eng-leads` at the top routes everything not matched below; this is
   the classic bottleneck. Prefer a broad team (`@org/engineering`) or leave unowned paths unowned.
4. **Shared files are hotspots.** Lock files, root configs, CI workflows, `package.json`: owning them with one team
   means that team reviews every dependency bump. Either give them to a platform team that agreed to it, or leave
   them with no owners and rely on normal review.
5. **Protect what is dangerous, specifically:**
   ```
   /.github/workflows/       @org/platform
   /infra/                   @org/platform
   /db/migrations/           @org/data-platform
   /src/auth/                @org/security @org/identity
   /CODEOWNERS               @org/eng-leads
   ```
   Own the CODEOWNERS file itself, or anyone can remove their own requirements.
6. **Multiple owners on a line means any one of them can approve** (on GitHub). If you need both teams to approve,
   use a ruleset/required-approvals count or GitLab section approval counts; CODEOWNERS alone won't do it.
7. **Generated and vendored code:** exclude with an ownerless line, or own by the team owning the generator.

## Avoiding bottlenecks

- Configure team review assignment (GitHub team settings: round robin or load balance, N reviewers) so a team
  request becomes one or two individuals, not the whole team.
- Check load: count review requests per person over a month. If one person is on more than about a third of PRs,
  split their paths or add owners.
  ```bash
  gh pr list --state merged --limit 300 --json reviews \
    | jq -r '.[].reviews[].author.login' | sort | uniq -c | sort -rn
  ```
- Every owning team needs at least three active reviewers; otherwise one absence blocks merges.

## Auditing an existing file

1. Validate syntax and owners: look for errors in the GitHub UI on the CODEOWNERS file, or run a linter such as the
   `mszostok/codeowners-validator` action in CI if your org allows it.
2. Find unowned paths you care about: for each top-level and service directory, open a file from it on GitHub (the
   file view shows its owners) or resolve it by reading the file bottom-up and taking the first match.
3. Find dead rules: patterns matching no files after a move (`git ls-files '<pattern>'` returns nothing).
4. Find shadowed rules: a specific line above a broader one never applies, because the later line wins.
5. Check team membership: owner teams with zero or one member, or without write access.

## Example

```
# Default: any engineer can approve
*                         @org/engineering

# Services
/services/billing/        @org/payments
/services/search/         @org/search
/packages/ui/             @org/design-system

# Dangerous surfaces (must stay below the service lines)
/services/billing/migrations/  @org/payments @org/data-platform
/.github/                 @org/platform
/infra/                   @org/platform
/CODEOWNERS               @org/eng-leads

# Unowned exceptions
/services/*/generated/
```

## Pitfalls

- Specific rule placed above a general one: silently overridden.
- Owners without write access: silently ignored, so nobody is requested and protection may block forever.
- Using CODEOWNERS as an org chart rather than a review routing table.
- Leaving former employees or disbanded teams listed; review routing quietly decays. Audit quarterly.
