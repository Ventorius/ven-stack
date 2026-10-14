import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, venDir } from './repo.mjs';

export const PROFILE_SCHEMA_VERSION = 1;

export function profilePath(dir) {
  return join(dir, 'profile.json');
}

export function loadProfile(cwd) {
  const dir = venDir(cwd);
  if (!dir || !existsSync(profilePath(dir))) return null;
  return { dir, root: repoRoot(cwd), profile: JSON.parse(readFileSync(profilePath(dir), 'utf8')) };
}

export function saveProfile(dir, profile) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(profilePath(dir), `${JSON.stringify(profile, null, 2)}\n`);
}

export function getKey(object, dottedKey) {
  return dottedKey.split('.').reduce((value, part) => (value == null ? undefined : value[part]), object);
}

export function setKey(object, dottedKey, value) {
  const parts = dottedKey.split('.');
  const last = parts.pop();
  const parent = parts.reduce((node, part) => {
    if (node[part] == null || typeof node[part] !== 'object') node[part] = {};
    return node[part];
  }, object);
  parent[last] = value;
  return object;
}

// A command leaf is `{ run, status, ... }`; `commands.test.single` and `test.single` both resolve.
export function commandSpec(profile, key) {
  const spec = getKey(profile, key) ?? getKey(profile, `commands.${key}`);
  if (!spec || typeof spec.run !== 'string') return null;
  return spec;
}

export function renderCommand(run, vars = {}) {
  return run.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? vars[name] : match));
}

export function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export function validateProfile(profile) {
  const errors = [];
  if (profile.schema_version !== PROFILE_SCHEMA_VERSION) errors.push(`schema_version must be ${PROFILE_SCHEMA_VERSION}`);
  if (!profile.commands || typeof profile.commands !== 'object') errors.push('commands is required');
  const walk = (node, path) => {
    if (node && typeof node === 'object' && 'run' in node) {
      if (typeof node.run !== 'string' || !node.run.trim()) errors.push(`${path}.run must be a non-empty string`);
      if (!['verified', 'unverified', 'manual'].includes(node.status)) {
        errors.push(`${path}.status must be verified, unverified or manual`);
      }
      return;
    }
    if (node && typeof node === 'object') for (const [key, child] of Object.entries(node)) walk(child, `${path}.${key}`);
  };
  walk(profile.commands, 'commands');
  return errors;
}

// Stale when any lockfile or manifest the profile was built from changed after it was generated.
export function staleSources(profile, root) {
  const generatedAt = Date.parse(profile.generated_at ?? '') || 0;
  return (profile.stack?.sources ?? []).filter((relativePath) => {
    const path = join(root, relativePath);
    return existsSync(path) && statSync(path).mtimeMs > generatedAt;
  });
}
