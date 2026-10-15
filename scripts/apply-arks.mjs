#!/usr/bin/env node
// Creates arks in Yarkr from arks/*.json. Only arks whose packages are all authored in this repo are applied;
// run it after the PR is merged and the packages show up in `yarkr info posterus-ltd/<name>`.
//
// Env:  YARKR_TOKEN (org-admin, read+write)   YARKR_API (default https://api.yarkr.com/functions/v1/api/api/v1)
//       YARKR_ORG (default posterus-ltd)
// Usage: node scripts/apply-arks.mjs [--dry-run] [--public] [--only name1,name2] [--domain d]
import { KIND_FOR_TYPE, loadArkFiles, isAuthored, loadCatalogs } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : undefined);
const dryRun = args.includes('--dry-run');
const makePublic = args.includes('--public');
const only = opt('--only')?.split(',');
const domain = opt('--domain');

const API = process.env.YARKR_API ?? 'https://api.yarkr.com/functions/v1/api/api/v1';
const ORG = process.env.YARKR_ORG ?? 'posterus-ltd';
const TOKEN = process.env.YARKR_TOKEN;
if (!dryRun && !TOKEN) (console.error('YARKR_TOKEN is not set'), process.exit(1));

const kinds = new Map(loadCatalogs().flatMap((c) => c.packages.map((p) => [p.name, p.kind])));

async function call(method, path, body) {
  if (dryRun) return console.log(`  ${method} ${path} ${body ? JSON.stringify(body) : ''}`), { ok: true };
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
  return { ok: true };
}

let applied = 0, skipped = 0, failed = 0;
for (const af of loadArkFiles()) {
  if (domain && af.domain !== domain) continue;
  for (const ark of af.arks) {
    if (only && !only.includes(ark.name)) continue;
    const kind = KIND_FOR_TYPE[ark.type];
    const missing = ark.items.filter((i) => !isAuthored(kinds.get(i.package) ?? kind, i.package));
    if (missing.length) {
      skipped++;
      if (only) console.log(`skip ${ark.name}: not authored: ${missing.map((i) => i.package).join(', ')}`);
      continue;
    }
    console.log(`ark ${ORG}/${ark.name}`);
    const created = await call('POST', `/arks/${ORG}`, { name: ark.name, description: ark.description });
    if (!created.ok && created.status !== 409) {
      console.error(`  create failed (${created.status}): ${created.text}`);
      failed++;
      continue;
    }
    let ok = true;
    for (const item of ark.items) {
      // New packages are snapshot-only, so follow the stable channel (no range).
      const body = { required: !!item.required, ...(item.range ? { range: item.range } : {}), ...(item.config ? { config: item.config } : {}) };
      const r = await call('PUT', `/arks/${ORG}/${ark.name}/items/${ORG}/${item.package}`, body);
      if (!r.ok) (ok = false), console.error(`  item ${item.package} failed (${r.status}): ${r.text}`);
    }
    if (ok && makePublic) {
      const r = await call('PATCH', `/arks/${ORG}/${ark.name}`, { public: true });
      if (!r.ok) (ok = false), console.error(`  make public failed (${r.status}): ${r.text}`);
    }
    ok ? applied++ : failed++;
  }
}
console.log(`\napplied ${applied}, failed ${failed}, skipped ${skipped} (packages not authored yet)`);
console.log(`verify each with: yarkr sync ${ORG}/<ark> --dry-run --harness claude-code`);
process.exit(failed ? 1 : 0);
