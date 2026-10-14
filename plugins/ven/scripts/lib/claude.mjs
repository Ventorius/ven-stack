import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function claudeConfigDir() {
  return process.env.CLAUDE_CONFIG_DIR ?? join(homedir(), '.claude');
}

// Separate config dirs (e.g. ~/.claude-work) keep their own transcripts, so mining scans all of them.
export function allConfigDirs() {
  const home = homedir();
  const candidates = readdirSync(home)
    .filter((name) => name === '.claude' || name.startsWith('.claude-'))
    .map((name) => join(home, name));
  const dirs = new Set([claudeConfigDir(), ...candidates]);
  return [...dirs].filter((dir) => existsSync(join(dir, 'projects')));
}
