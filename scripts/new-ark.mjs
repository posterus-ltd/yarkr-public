#!/usr/bin/env node
// Scaffolds an empty ark entry in arks/<domain>.json, ready to fill in.
//
// Usage:
//   node scripts/new-ark.mjs <domain> <ark-name> <skill|agent|mcp> [--topic "..."] [--packages a,b,c] [--stubs]
//
//   --packages  item names to add (also added to catalog/<domain>.json as planned packages if unknown)
//   --stubs     also create template files for those packages under skills/, agents/ or toolsets/
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT, SLUG, KIND_FOR_TYPE, loadCatalogs, loadArkFiles, writeJson, packagePath } from './lib.mjs';

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i === -1 ? undefined : args.splice(i, 2)[1];
};
const topic = flag('--topic');
const pkgs = (flag('--packages') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const stubs = args.includes('--stubs');
const [domain, name, type] = args.filter((a) => !a.startsWith('--'));

const die = (m) => (console.error(m), process.exit(1));
if (!domain || !name || !type) die('usage: new-ark.mjs <domain> <ark-name> <skill|agent|mcp> [--topic ".."] [--packages a,b] [--stubs]');
if (!SLUG.test(domain) || !SLUG.test(name)) die('domain and ark name must be slugs: ^[a-z0-9][a-z0-9-]*$');
if (!KIND_FOR_TYPE[type]) die(`type must be skill, agent or mcp (got ${type})`);
for (const p of pkgs) if (!SLUG.test(p)) die(`bad package name ${p}`);
const kind = KIND_FOR_TYPE[type];

const arkFiles = loadArkFiles();
const clash = arkFiles.find((f) => f.arks.some((a) => a.name === name));
if (clash) die(`ark ${name} already exists in ${clash.file}`);

const known = new Map(loadCatalogs().flatMap((c) => c.packages.map((p) => [p.name, p])));
for (const p of pkgs) if (known.has(p) && known.get(p).kind !== kind) die(`${p} exists as a ${known.get(p).kind}, not a ${kind}`);

// Ark entry
const arkFile = `arks/${domain}.json`;
const af = arkFiles.find((f) => f.file === arkFile) ?? { domain, arks: [] };
af.arks.push({
  name,
  type,
  topic: topic ?? name.replace(/-/g, ' '),
  description: `TODO: one sentence (<= 500 chars) saying who this ${type} ark is for and what they get.`,
  items: pkgs.map((p, i) => ({ package: p, required: i < 2 })),
});
writeJson(arkFile, { domain: af.domain, arks: af.arks });

// Planned catalog entries for unknown packages
const fresh = pkgs.filter((p) => !known.has(p));
if (fresh.length) {
  const catFile = `catalog/${domain}.json`;
  const cat = loadCatalogs().find((c) => c.file === catFile) ?? { domain, packages: [] };
  for (const p of fresh) {
    const entry = { name: p, kind, purpose: 'TODO: one-line purpose' };
    if (kind === 'toolset') entry.source = { type: 'http', url: 'TODO-verified-official-url', docs: 'TODO', env: [] };
    cat.packages.push(entry);
  }
  writeJson(catFile, { domain: cat.domain, packages: cat.packages });
}

// Optional package stubs
const TEMPLATES = {
  skill: (n) => `---\nname: ${n}\ndescription: TODO what it does and when to use it (name the trigger situations).\n---\n\n# ${n}\n\nTODO concrete, imperative steps.\n`,
  agent: (n) => `---\nname: ${n}\ndescription: TODO when to hand work to this agent.\ntools: Read, Grep, Glob\n---\n\nTODO role, process, decision rules, and the shape of what it returns.\n`,
  toolset: (n) => JSON.stringify({ mcpServers: { [n]: { type: 'http', url: 'TODO-verified-official-url', headers: { Authorization: 'Bearer ${TODO_TOKEN}' } } } }, null, 2) + '\n',
};
const created = [];
if (stubs) {
  for (const p of pkgs) {
    const rel = packagePath(kind, p);
    if (existsSync(join(ROOT, rel))) continue;
    mkdirSync(dirname(join(ROOT, rel)), { recursive: true });
    writeFileSync(join(ROOT, rel), TEMPLATES[kind](p));
    if (kind === 'toolset') writeFileSync(join(ROOT, `toolsets/${p}/README.md`), `TODO first paragraph = description.\n\n## Variables\n\n- \`TODO_TOKEN\`: where to get it.\n`);
    created.push(rel);
  }
}

console.log(`added ark ${name} (${type}) to ${arkFile} with ${pkgs.length} item(s)`);
if (fresh.length) console.log(`planned ${fresh.length} new package(s) in catalog/${domain}.json: ${fresh.join(', ')}`);
created.forEach((f) => console.log(`created ${f}`));
console.log('next: fill the TODOs, then run node scripts/validate.mjs');
