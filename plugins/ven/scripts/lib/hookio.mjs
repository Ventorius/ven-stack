import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync, writeSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function oneLine(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

// stdout/stderr writes followed by process.exit truncate at the pipe buffer (64KB) when the reader is
// slow, so write synchronously and retry while a non-blocking pipe is full.
export function writeAll(fd, text) {
  const buffer = Buffer.from(text);
  let offset = 0;
  while (offset < buffer.length) {
    try {
      offset += writeSync(fd, buffer, offset);
    } catch (error) {
      if (error.code !== 'EAGAIN') throw error;
    }
  }
}

// Marker kept outside the repo state so it survives the very file whose corruption caused the error.
function alreadyBlocked(input, message) {
  const home = process.env.VEN_HOME ?? join(homedir(), '.ven');
  const key = createHash('sha1').update(`${input?.session_id ?? 'unknown'}\n${message}`).digest('hex');
  const marker = join(home, 'state-errors', key);
  if (existsSync(marker)) return true;
  try {
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, '');
    return false;
  } catch {
    return true; // can't remember the block, so release rather than block forever
  }
}

// Hooks run in every session, so an internal error must never surface as a crash or trap a session.
// `onError` is 'allow', 'block', 'block-once', or a function of the parsed input (undefined when stdin was malformed).
//   block       Stop-style gates: block, but release once `stop_hook_active` says Claude already retried.
//   block-once  PreToolUse gates: block the first time a session hits a given error, then allow.
// `onRelease` records the release (best effort). `silent` drops the warning for hooks that must never
// write to the user's terminal.
export async function runHook(name, main, { onError = 'allow', silent = false, onRelease } = {}) {
  let input;
  try {
    input = await readHookInput();
    await main(input);
  } catch (error) {
    const mode = typeof onError === 'function' ? onError(input) : onError;
    const message = `ven ${name}: internal error: ${oneLine(error?.message ?? error)}`;
    const release = (mode === 'block' && input?.stop_hook_active === true) || (mode === 'block-once' && alreadyBlocked(input, message));
    if (mode.startsWith('block') && !release) {
      block(`${message}. Run ven-doctor to check the profile and state files; if it reports nothing, re-run /ven:onboard --refresh.`);
    }
    if (release) {
      try {
        onRelease?.(input, message);
      } catch {
        // Recording the release is best effort; the state that failed may be the one we would write to.
      }
      writeAll(2, `${message} (gate released so the session is not trapped; the change was not checked)\n`);
    } else if (!silent) {
      writeAll(2, `${message}\n`);
    }
    process.exit(0);
  }
}

// Exit 2 is the only code that blocks; stderr becomes the message Claude reads, so it must say why.
export function block(message) {
  writeAll(2, `${message.trim()}\n`);
  process.exit(2);
}

export function addContext(hookEventName, text) {
  writeAll(1, JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: text } }));
  process.exit(0);
}

export function allow() {
  process.exit(0);
}

export function editedFilePath(input) {
  const toolInput = input.tool_input ?? {};
  return toolInput.file_path ?? toolInput.notebook_path ?? null;
}

// Text an edit adds and removes, across Write, Edit and MultiEdit shapes.
export function editDelta(input) {
  const toolInput = input.tool_input ?? {};
  if (typeof toolInput.content === 'string') return { added: toolInput.content, removed: '' };
  const edits = Array.isArray(toolInput.edits) ? toolInput.edits : [toolInput];
  return {
    added: edits.map((edit) => edit.new_string ?? '').join('\n'),
    removed: edits.map((edit) => edit.old_string ?? '').join('\n'),
  };
}

// Lines each text has that the other lacks, as a multiset, so a rewritten file reports only real changes.
export function lineDelta(oldText, newText) {
  const remaining = new Map();
  for (const line of oldText.split('\n')) remaining.set(line, (remaining.get(line) ?? 0) + 1);
  const added = [];
  for (const line of newText.split('\n')) {
    const count = remaining.get(line) ?? 0;
    if (count > 0) remaining.set(line, count - 1);
    else added.push(line);
  }
  const removed = [...remaining].flatMap(([line, count]) => Array(count).fill(line));
  return { added: added.join('\n'), removed: removed.join('\n') };
}
