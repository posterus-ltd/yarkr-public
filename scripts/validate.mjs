#!/usr/bin/env node
// Checks catalog/*.json and arks/*.json against the library rules (see catalog/README.md).
// Usage: node scripts/validate.mjs [--authored]   (--authored also checks authored package files)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, SLUG, KIND_FOR_TYPE, loadCatalogs, loadArkFiles, isAuthored, packagePath } from './lib.mjs';

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);

const packages = new Map();
for (const cat of loadCatalogs()) {
  for (const p of cat.packages ?? []) {
    if (!SLUG.test(p.name ?? '')) err(`${cat.file}: bad package name ${JSON.stringify(p.name)}`);
    if (!['skill', 'agent', 'toolset'].includes(p.kind)) err(`${cat.file}: ${p.name}: bad kind ${p.kind}`);
    if (!p.purpose || /TODO/.test(p.purpose)) err(`${cat.file}: ${p.name}: missing purpose`);
    if (packages.has(p.name)) err(`${cat.file}: duplicate package ${p.name} (also in ${packages.get(p.name).file})`);
    if (p.kind === 'toolset') {
      const s = p.source ?? {};
      if (!s.docs) err(`${cat.file}: ${p.name}: toolset without source.docs`);
      if (s.type === 'http' && !/^https:\/\//.test(s.url ?? '')) err(`${cat.file}: ${p.name}: http toolset without https url`);
      if (s.type === 'stdio' && !s.package) err(`${cat.file}: ${p.name}: stdio toolset without package`);
      if (!['http', 'stdio'].includes(s.type)) err(`${cat.file}: ${p.name}: source.type must be http or stdio`);
    }
    packages.set(p.name, { ...p, file: cat.file });
  }
}
for (const p of packages.values()) {
  for (const s of p.skills ?? []) {
    if (s.includes('/')) continue;
    const dep = packages.get(s);
    if (!dep || dep.kind !== 'skill') err(`${p.file}: agent ${p.name} depends on unknown skill ${s}`);
  }
}

const arks = new Map();
const used = new Set();
const counts = { skill: 0, agent: 0, mcp: 0 };
for (const af of loadArkFiles()) {
  for (const a of af.arks ?? []) {
    const where = `${af.file}: ark ${a.name}`;
    if (!SLUG.test(a.name ?? '')) err(`${where}: bad name`);
    if (arks.has(a.name)) err(`${where}: duplicate ark (also in ${arks.get(a.name)})`);
    arks.set(a.name, af.file);
    if (!KIND_FOR_TYPE[a.type]) err(`${where}: bad type ${a.type}`);
    else counts[a.type]++;
    if (!a.description || a.description.length > 500) err(`${where}: description missing or > 500 chars`);
    if (/TODO/.test(a.description ?? '')) err(`${where}: description still has TODO`);
    const items = a.items ?? [];
    if (items.length < 3 || items.length > 8) err(`${where}: has ${items.length} items (want 3-8)`);
    if (!items.some((i) => i.required)) warnings.push(`${where}: no required item`);
    const seen = new Set();
    for (const i of items) {
      const p = packages.get(i.package);
      if (!p) err(`${where}: unknown package ${i.package}`);
      else if (p.kind !== KIND_FOR_TYPE[a.type]) err(`${where}: ${i.package} is a ${p.kind}, ark type is ${a.type}`);
      if (seen.has(i.package)) err(`${where}: duplicate item ${i.package}`);
      seen.add(i.package);
      used.add(i.package);
    }
  }
}

for (const p of packages.values()) if (!used.has(p.name)) warnings.push(`${p.file}: package ${p.name} is in no ark`);

if (process.argv.includes('--authored')) {
  for (const p of packages.values()) {
    if (!isAuthored(p.kind, p.name)) continue;
    const text = readFileSync(join(ROOT, packagePath(p.kind, p.name)), 'utf8');
    if (/TODO/.test(text)) err(`${packagePath(p.kind, p.name)}: still has TODO placeholders`);
    if (p.kind !== 'toolset' && !/^---\n[\s\S]*?\ndescription:\s*\S[\s\S]*?\n---/.test(text))
      err(`${packagePath(p.kind, p.name)}: missing description frontmatter`);
    if (p.kind !== 'toolset' && /^\w+: (?!["'>|]).*: /m.test(text.split('\n---')[0]))
      err(`${packagePath(p.kind, p.name)}: unquoted ': ' in a frontmatter value (invalid YAML), wrap it in quotes`);
    if (p.kind === 'toolset') {
      const json = JSON.parse(text);
      for (const [srv, cfg] of Object.entries(json.mcpServers ?? {}))
        for (const [k, v] of Object.entries({ ...cfg.env, ...cfg.headers }))
          if (typeof v === 'string' && !/\$\{/.test(v) && /token|key|secret|auth|pass/i.test(k))
            err(`toolsets/${p.name}: ${srv}.${k} looks like a literal secret`);
    }
  }
}

const authored = [...packages.values()].filter((p) => isAuthored(p.kind, p.name)).length;
console.log(`packages: ${packages.size} (${authored} authored) | arks: ${arks.size} (skill ${counts.skill}, agent ${counts.agent}, mcp ${counts.mcp})`);
if (process.argv.includes('-v')) warnings.forEach((w) => console.log(`warn: ${w}`));
else if (warnings.length) console.log(`${warnings.length} warnings (-v to show)`);
errors.forEach((e) => console.error(`error: ${e}`));
process.exit(errors.length ? 1 : 0);
