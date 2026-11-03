import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { readJson, writeJson } from './state.mjs';

function moveAside(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
}

function packDirs(dir) {
  const packs = join(dir, 'packs');
  return existsSync(packs) ? readdirSync(packs, { withFileTypes: true }).filter((entry) => entry.isDirectory() && !entry.name.startsWith('.')).map((entry) => entry.name) : [];
}

// A corrupt profile is reported by whoever loads it; migration just leaves it alone.
function readProfileOrNull(path) {
  try {
    return readJson(path, null);
  } catch {
    return null;
  }
}

// Packs used to be plugins of the agent harness; now the router reads them from disk.
function packItems(dir) {
  const items = [];
  const marketplace = join(dir, 'packs', '.claude-plugin');
  if (existsSync(marketplace)) {
    items.push({ describe: 'packs/.claude-plugin/ -> legacy/packs-marketplace/ (packs load through the router now)', apply: () => moveAside(marketplace, join(dir, 'legacy', 'packs-marketplace')) });
  }

  const profilePath = join(dir, 'profile.json');
  const profile = readProfileOrNull(profilePath);
  const pluginPacks = (profile?.packs ?? []).filter((pack) => pack.plugin);
  if (pluginPacks.length > 0) {
    items.push({
      describe: `profile packs ${pluginPacks.map((pack) => pack.name).join(', ')}: dropped the plugin field. If an agent harness had them enabled as plugins, remove ${pluginPacks.map((pack) => pack.plugin).join(', ')} from enabledPlugins in .claude/settings.local.json`,
      apply: () => writeJson(profilePath, { ...profile, packs: profile.packs.map(({ plugin, ...pack }) => pack) }),
    });
  }

  for (const pack of packDirs(dir)) {
    const hooks = join(dir, 'packs', pack, 'hooks');
    if (existsSync(hooks)) {
      items.push({
        describe: `packs/${pack}/hooks/ -> legacy/packs/${pack}/hooks/; rewrite each hook as a pack check (ratchet, rung 4), or it no longer runs`,
        apply: () => moveAside(hooks, join(dir, 'legacy', 'packs', pack, 'hooks')),
      });
    }
    const manifest = join(dir, 'packs', pack, '.claude-plugin');
    if (existsSync(manifest)) {
      items.push({
        describe: `packs/${pack}/.claude-plugin/plugin.json: version and owner moved into pack.json`,
        apply: () => {
          const plugin = readJson(join(manifest, 'plugin.json'), {});
          const packJson = join(dir, 'packs', pack, 'pack.json');
          writeJson(packJson, { ...readJson(packJson, {}), version: plugin.version, owner: plugin.author?.name });
          rmSync(manifest, { recursive: true, force: true });
        },
      });
    }
  }
  return items;
}

// Each item is state an older, onboarding-and-hooks ven left behind. Applying one makes it disappear
// from this list, so migrate converges however often it runs.
export function legacyItems(dir) {
  const items = [];
  const map = join(dir, 'map.md');
  if (existsSync(map)) {
    items.push({ describe: 'map.md -> legacy/map.md (no longer injected at session start)', apply: () => moveAside(map, join(dir, 'legacy', 'map.md')) });
  }
  for (const sub of ['sessions', 'baselines']) {
    const path = join(dir, 'state', sub);
    if (existsSync(path)) items.push({ describe: `removed state/${sub}/ (hook state)`, apply: () => rmSync(path, { recursive: true, force: true }) });
  }
  return [...items, ...packItems(dir)];
}
