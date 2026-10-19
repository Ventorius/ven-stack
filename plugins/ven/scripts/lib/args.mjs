// `--name value`, `--name=value` and repeated flags (collected into arrays) plus positionals.
export function parseArgs(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split(/=(.*)/s);
    const value = inline ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true);
    flags[name] = name in flags ? [].concat(flags[name], value) : value;
  }
  return { flags, positionals };
}

export function list(value) {
  if (value === undefined || value === true) return [];
  return [].concat(value);
}

export function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

// Strict variant for the bin tools: only declared flags are accepted, value flags must carry a value and
// boolean flags must not. Anything else is a usage error (exit 2) instead of a silently recorded `true`.
export function parseStrict(argv, { values = [], booleans = [] }) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      positionals.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split(/=(.*)/s);
    if (!values.includes(name) && !booleans.includes(name)) fail(`unknown flag --${name}`, 2);
    if (booleans.includes(name)) {
      if (inline !== undefined) fail(`--${name} takes no value`, 2);
      flags[name] = true;
      continue;
    }
    const value = inline ?? (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--') ? argv[++i] : undefined);
    if (value === undefined) fail(`--${name} needs a value`, 2);
    flags[name] = name in flags ? [].concat(flags[name], value) : value;
  }
  return { flags, positionals };
}

const HELP_COMMANDS = ['--help', '-h', 'help'];

// Exit codes: 0 ok, 1 runtime failure, 2 usage error (no command, unknown command, bad flags).
export function dispatch(name, usage, commands, command) {
  if (HELP_COMMANDS.includes(command)) {
    process.stdout.write(`${usage}\n`);
    process.exit(0);
  }
  if (!command) fail(usage, 2);
  if (!Object.hasOwn(commands, command)) fail(`${name}: unknown command ${command}\n\n${usage}`, 2);
  try {
    commands[command]();
  } catch (error) {
    fail(`${name}: ${error.message}`);
  }
}
