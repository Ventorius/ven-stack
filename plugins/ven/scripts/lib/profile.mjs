import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, venDir } from './repo.mjs';
import { readJson, writeJson } from './state.mjs';

export const PROFILE_SCHEMA_VERSION = 1;

export function profilePath(dir) {
  return join(dir, 'profile.json');
}

export function loadProfile(cwd) {
  const dir = venDir(cwd);
  if (!dir || !existsSync(profilePath(dir))) return null;
  const path = profilePath(dir);
  const profile = readJson(path);
  if (profile?.schema_version !== PROFILE_SCHEMA_VERSION) {
    throw new Error(`${path} has schema_version ${profile?.schema_version}, expected ${PROFILE_SCHEMA_VERSION}; re-run /ven:onboard`);
  }
  return { dir, root: repoRoot(cwd), profile };
}

export function saveProfile(dir, profile) {
  writeJson(profilePath(dir), profile);
}

// Array segments resolve by index or by an element's `name`, so `workspaces.api.commands.test.all` works.
export function getKey(object, dottedKey) {
  return dottedKey.split('.').reduce((value, part) => {
    if (value == null) return undefined;
    if (Array.isArray(value) && !/^\d+$/.test(part)) return value.find((item) => item?.name === part);
    return value[part];
  }, object);
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

function flattenCommands(node, prefix) {
  if (!node || typeof node !== 'object') return {};
  if (typeof node.run === 'string') return { [prefix]: node };
  return Object.assign({}, ...Object.entries(node).map(([key, child]) => flattenCommands(child, `${prefix}.${key}`)));
}

// Every command leaf by dotted path: top-level commands plus each workspace's, addressed by workspace name.
export function allCommands(profile) {
  return Object.assign(
    flattenCommands(profile.commands, 'commands'),
    ...(profile.workspaces ?? []).map((workspace) => flattenCommands(workspace.commands, `workspaces.${workspace.name}.commands`)),
  );
}

function commandErrors(profile) {
  return Object.entries(allCommands(profile)).flatMap(([path, node]) => [
    ...(node.run.trim() ? [] : [`${path}.run must be a non-empty string`]),
    ...(['verified', 'unverified', 'manual'].includes(node.status) ? [] : [`${path}.status must be verified, unverified or manual`]),
  ]);
}

function verifyErrors(profile) {
  return Object.entries(profile.verify ?? {}).flatMap(([type, key]) => {
    if (typeof key !== 'string') return [`verify.${type} must be a command key`];
    return commandSpec(profile, key) ? [] : [`verify.${type} points at ${key}, which is not a command`];
  });
}

function packErrors(profile) {
  return (profile.packs ?? []).flatMap((pack, index) =>
    ['name', 'kind'].filter((field) => !pack?.[field]).map((field) => `packs[${index}].${field} is required`),
  );
}

export function validateProfile(profile) {
  const errors = [];
  if (profile.schema_version !== PROFILE_SCHEMA_VERSION) errors.push(`schema_version must be ${PROFILE_SCHEMA_VERSION}`);
  if (!profile.commands || typeof profile.commands !== 'object') errors.push('commands is required');
  return [...errors, ...commandErrors(profile), ...verifyErrors(profile), ...packErrors(profile)];
}

function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

export function hashSources(sources, root) {
  const existing = sources.filter((relativePath) => existsSync(join(root, relativePath)));
  return Object.fromEntries(existing.map((relativePath) => [relativePath, sha256File(join(root, relativePath))]));
}

// Stale when a manifest or lockfile the profile was built from changed. Content hashes survive checkouts and
// touches; the mtime comparison is only the fallback for profiles written before hashes were recorded.
export function staleSources(profile, root) {
  const sources = profile.stack?.sources ?? [];
  const hashes = profile.stack?.source_hashes;
  if (hashes) {
    const current = hashSources(sources, root);
    return Object.keys(current).filter((relativePath) => current[relativePath] !== hashes[relativePath]);
  }
  const generatedAt = Date.parse(profile.generated_at ?? '') || 0;
  return sources.filter((relativePath) => {
    const path = join(root, relativePath);
    return existsSync(path) && statSync(path).mtimeMs > generatedAt;
  });
}
