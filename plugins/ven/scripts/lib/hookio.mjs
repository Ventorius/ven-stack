export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
}

function oneLine(text) {
  return String(text).replace(/\s+/g, ' ').trim();
}

// Hooks run in every session, so an internal error must never surface as a crash. Gate hooks fail
// closed (exit 2 with the cause and the fix); everything else fails open with a one-line warning.
// `onError` is 'block', 'allow', or a function of the parsed input (undefined when stdin was malformed).
// `silent` drops the warning for hooks that must never write to the user's terminal.
export async function runHook(name, main, { onError = 'allow', silent = false } = {}) {
  let input;
  try {
    input = await readHookInput();
    await main(input);
  } catch (error) {
    const mode = typeof onError === 'function' ? onError(input) : onError;
    const message = `ven ${name}: internal error: ${oneLine(error?.message ?? error)}`;
    if (mode === 'block') block(`${message}. Run ven-doctor to check the profile and state files; if it reports nothing, re-run /ven:onboard --refresh.`);
    if (!silent) process.stderr.write(`${message}\n`);
    process.exit(0);
  }
}

// Exit 2 is the only code that blocks; stderr becomes the message Claude reads, so it must say why.
export function block(message) {
  process.stderr.write(`${message.trim()}\n`);
  process.exit(2);
}

export function addContext(hookEventName, text) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: text } }));
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
