import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Each item is state an older, onboarding-and-hooks ven left behind. Applying one makes it disappear
// from this list, so migrate converges however often it runs.
export function legacyItems(dir) {
  const items = [];
  const map = join(dir, 'map.md');
  if (existsSync(map)) {
    items.push({
      describe: 'map.md -> legacy/map.md (no longer injected at session start)',
      apply: () => {
        mkdirSync(join(dir, 'legacy'), { recursive: true });
        renameSync(map, join(dir, 'legacy', 'map.md'));
      },
    });
  }
  for (const sub of ['sessions', 'baselines']) {
    const path = join(dir, 'state', sub);
    if (existsSync(path)) items.push({ describe: `removed state/${sub}/ (hook state)`, apply: () => rmSync(path, { recursive: true, force: true }) });
  }
  return items;
}
