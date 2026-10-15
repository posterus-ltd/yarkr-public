import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SLUG = /^[a-z0-9][a-z0-9-]*$/;
export const KIND_FOR_TYPE = { skill: 'skill', agent: 'agent', mcp: 'toolset' };

const readJsonDir = (dir) =>
  existsSync(join(ROOT, dir))
    ? readdirSync(join(ROOT, dir))
        .filter((f) => f.endsWith('.json'))
        .sort()
        .map((f) => ({ file: `${dir}/${f}`, ...JSON.parse(readFileSync(join(ROOT, dir, f), 'utf8')) }))
    : [];

export const loadCatalogs = () => readJsonDir('catalog');
export const loadArkFiles = () => readJsonDir('arks');

export const writeJson = (file, data) => writeFileSync(join(ROOT, file), JSON.stringify(data, null, 2) + '\n');

// Path whose presence means a package has been authored.
export const packagePath = (kind, name) =>
  ({ skill: `skills/${name}/SKILL.md`, agent: `agents/${name}.md`, toolset: `toolsets/${name}/.mcp.json` })[kind];

export const isAuthored = (kind, name) => existsSync(join(ROOT, packagePath(kind, name)));
