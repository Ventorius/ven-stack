export async function readHookInput() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8').trim();
  return text ? JSON.parse(text) : {};
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
