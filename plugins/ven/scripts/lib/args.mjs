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
