// Parses the YAML subset skill and agent files use: scalars, quoted strings, inline and block lists,
// one level of nested maps, and `|` / `>` block scalars. Anything richer is a lint error, not a parser feature.
export function splitFrontmatter(text, { strict = true } = {}) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { data: null, body: text, raw: '' };
  try {
    return { data: parseYamlSubset(match[1]), body: match[2], raw: match[1] };
  } catch (error) {
    if (strict) throw error;
    // Third-party files may use YAML this parser doesn't support; their top-level scalars are enough.
    const data = Object.fromEntries(
      [...match[1].matchAll(/^([\w-]+):[ \t]+(.+)$/gm)].map(([, key, value]) => [key, parseScalar(value)]),
    );
    return { data, body: match[2], raw: match[1] };
  }
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value === '') return '';
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  if (value.startsWith('[') && value.endsWith(']')) {
    return value.slice(1, -1).split(',').map((item) => parseScalar(item)).filter((item) => item !== '');
  }
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}

function indentOf(line) {
  return line.match(/^ */)[0].length;
}

function readBlockScalar(lines, start, style) {
  const collected = [];
  let index = start;
  const baseIndent = lines[index] !== undefined ? indentOf(lines[index]) : 0;
  while (index < lines.length && (lines[index].trim() === '' || indentOf(lines[index]) >= baseIndent) && baseIndent > 0) {
    collected.push(lines[index].slice(baseIndent));
    index++;
  }
  const text = style === '>' ? collected.join(' ').replace(/\s+/g, ' ').trim() : collected.join('\n').trimEnd();
  return { text, next: index };
}

function parseMap(lines, start, indent) {
  const result = {};
  let index = start;
  while (index < lines.length) {
    const line = lines[index];
    if (line.trim() === '' || line.trim().startsWith('#')) {
      index++;
      continue;
    }
    const lineIndent = indentOf(line);
    if (lineIndent < indent) break;
    const match = line.slice(lineIndent).match(/^([\w.-]+):(?:\s+(.*))?$/);
    if (!match) throw new Error(`Unsupported frontmatter line: ${line}`);
    const [, key, rest = ''] = match;
    index++;
    if (rest === '|' || rest === '>') {
      const block = readBlockScalar(lines, index, rest);
      result[key] = block.text;
      index = block.next;
    } else if (rest.trim() !== '') {
      result[key] = parseScalar(rest);
    } else if (index < lines.length && lines[index].trim().startsWith('- ')) {
      const items = [];
      while (index < lines.length && lines[index].trim().startsWith('- ')) {
        items.push(parseScalar(lines[index].trim().slice(2)));
        index++;
      }
      result[key] = items;
    } else if (index < lines.length && indentOf(lines[index]) > lineIndent) {
      const nested = parseMap(lines, index, indentOf(lines[index]));
      result[key] = nested.value;
      index = nested.next;
    } else {
      result[key] = '';
    }
  }
  return { value: result, next: index };
}

export function parseYamlSubset(text) {
  return parseMap(text.split(/\r?\n/), 0, 0).value;
}
