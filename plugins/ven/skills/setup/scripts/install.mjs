#!/usr/bin/env node
// Links every ven tool in this directory into ~/.ven/bin (VEN_HOME moves ~/.ven), so any agent's
// shell finds them by name. Safe to rerun: it converges on one link per tool and nothing else.
import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS_DIR = dirname(realpathSync(fileURLToPath(import.meta.url)));
const binDir = join(process.env.VEN_HOME ?? join(homedir(), '.ven'), 'bin');
const tools = readdirSync(SCRIPTS_DIR).filter((name) => name.startsWith('ven-'));

function linkTool(name) {
  const target = realpathSync(join(SCRIPTS_DIR, name));
  const link = join(binDir, name);
  if (!existsSync(link) && !isLink(link)) {
    symlinkSync(target, link);
    return `linked ${name}`;
  }
  if (!isLink(link)) throw new Error(`${link}: ${name} is a regular file, not a link ven made; move it aside and rerun`);
  if (readlinkSync(link) === target) return null;
  rmSync(link);
  symlinkSync(target, link);
  return `repointed ${name} to ${target}`;
}

function isLink(path) {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

// A ven-* link whose target is gone is a tool an older ven shipped.
function removeDangling() {
  return readdirSync(binDir)
    .filter((name) => name.startsWith('ven-') && isLink(join(binDir, name)) && !existsSync(join(binDir, name)))
    .map((name) => {
      rmSync(join(binDir, name));
      return `removed ${join(binDir, name)} (its tool no longer exists)`;
    });
}

try {
  mkdirSync(binDir, { recursive: true });
  const changes = [...tools.map(linkTool).filter(Boolean), ...removeDangling()];
  console.log(changes.length > 0 ? changes.join('\n') : `${tools.length} ven tools already linked in ${binDir}`);
  const onPath = (process.env.PATH ?? '').split(delimiter).includes(binDir);
  if (onPath) console.log(`${binDir} is already on PATH`);
  else console.log(`${binDir} is not on PATH. Add this line to your shell profile, then open a new shell:\n  export PATH="${binDir}:$PATH"`);
} catch (error) {
  process.stderr.write(`ven install: ${error.message}\n`);
  process.exit(1);
}
