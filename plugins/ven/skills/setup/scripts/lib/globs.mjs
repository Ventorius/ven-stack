const cache = new Map();

function globToRegExp(glob) {
  let source = '';
  for (let i = 0; i < glob.length; i++) {
    const char = glob[i];
    if (char === '*') {
      const isDouble = glob[i + 1] === '*';
      if (isDouble) {
        const followedBySlash = glob[i + 2] === '/';
        source += followedBySlash ? '(?:.*/)?' : '.*';
        i += followedBySlash ? 2 : 1;
      } else {
        source += '[^/]*';
      }
    } else if (char === '?') {
      source += '[^/]';
    } else if (char === '{') {
      const end = glob.indexOf('}', i);
      const options = glob.slice(i + 1, end).split(',').map((option) => option.replace(/[.+^$()|[\]\\]/g, '\\$&'));
      source += `(?:${options.join('|')})`;
      i = end;
    } else {
      source += char.replace(/[.+^$()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

export function matchesGlob(path, glob) {
  if (!cache.has(glob)) cache.set(glob, globToRegExp(glob));
  const normalized = path.replace(/\\/g, '/').replace(/^\.\//, '');
  return cache.get(glob).test(normalized);
}

export function matchesAny(path, globs = []) {
  return globs.some((glob) => matchesGlob(path, glob));
}
