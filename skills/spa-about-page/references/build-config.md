# Build config: commit hash and license list

## `vite.config.ts`

```ts
import { execSync } from "node:child_process";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import license from "rollup-plugin-license";

const OUT_DIR = "dist";

/** The commit this build comes from: CI variable first, then git, never a failed build. */
function commitHash(): string {
  const fromEnv =
    process.env.COMMIT_SHA ?? // set it yourself, e.g. a Docker build arg
    process.env.GITHUB_SHA ?? // GitHub Actions
    process.env.CI_COMMIT_SHA ?? // GitLab CI
    process.env.VERCEL_GIT_COMMIT_SHA ?? // Vercel
    process.env.CF_PAGES_COMMIT_SHA ?? // Cloudflare Pages
    process.env.COMMIT_REF; // Netlify
  if (fromEnv) return fromEnv;
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "unknown";
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      ...license({
        thirdParty: {
          output: {
            file: path.resolve(__dirname, OUT_DIR, "third-party-licenses.txt"),
            encoding: "utf-8",
          },
          includePrivate: false,
          multipleVersions: true,
          // Warn on anything outside the policy; set failOnViolation/failOnUnlicensed in CI to block the build.
          allow: {
            test: "(MIT OR ISC OR BSD-2-Clause OR BSD-3-Clause OR Apache-2.0 OR 0BSD OR BlueOak-1.0.0)",
            failOnUnlicensed: false,
            failOnViolation: false,
          },
        },
      }),
      apply: "build",
    } as Plugin,
  ],
  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash()),
  },
  build: { outDir: OUT_DIR },
});
```

Notes:
- `__dirname` is available in `vite.config.ts` (Vite bundles the config). In a hand-written ESM `vite.config.mjs`, use
  `fileURLToPath(new URL(".", import.meta.url))`.
- The plugin creates the output directory if needed and writes the file during `generateBundle`, after Vite has
  emptied `outDir`, so the file survives.
- `multipleVersions: true` lists each version of a package separately, so a package that changed license between
  versions is reported correctly.
- The default text format per dependency is `Name`, `Version`, `License`, `Private`, `Description`, `Repository`,
  `Homepage`, `Author`, `Contributors`, then the full `License Copyright` text and any `NOTICE`. That is what
  attribution clauses (MIT, BSD, Apache-2.0 NOTICE) require; don't trim it to a name/license summary.

### Optional: a header line in the file

Prepend the app name and commit so a downloaded copy says what it belongs to:

```ts
output: {
  file: path.resolve(__dirname, OUT_DIR, "third-party-licenses.txt"),
  template(dependencies) {
    const header = `Third-party software in ${process.env.npm_package_name} (commit ${commitHash()})\n\n`;
    const sep = `\n\n${"-".repeat(80)}\n\n`;
    return header + dependencies.map((d) => d.text()).join(sep);
  },
},
```

`Dependency.text()` is the plugin's own default formatting, so the body stays identical to the default output.

## `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />

/** Full git SHA of the commit this bundle was built from, or "unknown". Injected by vite.config.ts. */
declare const __COMMIT_HASH__: string;

interface ImportMetaEnv {
  readonly VITE_IMPRESSUM_URL?: string;
  readonly VITE_TERMS_URL?: string;
  readonly VITE_PRIVACY_URL?: string;
  /** Public repo URL; when set, the commit hash links to <repo>/commit/<sha>. */
  readonly VITE_REPO_URL?: string;
}
```

If tests run under Vitest, the same `define` applies there because Vitest reads `vite.config.ts`. For Jest, add
`globals: { __COMMIT_HASH__: "test" }`.

## Docker

```dockerfile
ARG COMMIT_SHA=unknown
ENV COMMIT_SHA=$COMMIT_SHA
RUN pnpm build
```

```bash
docker build --build-arg COMMIT_SHA=$(git rev-parse HEAD) .
```

Add `.git` to `.dockerignore` as usual; the build arg replaces it.

## Hosting the `.txt`

| Host | What to set |
| --- | --- |
| Nginx | `types { text/plain txt; }` and `charset utf-8;` in the `location` serving `dist/`; keep `try_files $uri $uri/ /index.html;` so the file is found before the fallback |
| S3 + CloudFront | upload with `--content-type "text/plain; charset=utf-8"`; the 403/404 → `/index.html` error rule must not hide a missing `.txt` (check it after deploy) |
| Netlify | `_headers`: `/third-party-licenses.txt` → `Content-Type: text/plain; charset=utf-8` |
| Vercel / Cloudflare Pages | static files win over the SPA rewrite; add the header rule as above |

Verify after deploy:

```bash
curl -sI https://app.example.com/third-party-licenses.txt | grep -i content-type
# content-type: text/plain; charset=utf-8
```
