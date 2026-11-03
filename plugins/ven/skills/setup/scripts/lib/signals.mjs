// English and Polish openers; corrections usually lead with the objection. The trailing lookahead
// keeps "stopwatch", "undo-redo" and "wrongly" from matching; \b can't be used because it is ASCII-only.
export const CORRECTION = /^(?:no|nope|don'?t|do not|stop|wrong|actually|instead|not (?:that|what|like)|why did you|revert|undo|that'?s (?:not|wrong)|you (?:should|shouldn'?t|forgot|missed)|never|please don'?t|nie|źle|zamiast|przestań|cofnij|dlaczego|czemu|to nie|nie tak|zapomniałeś|miałeś)(?![\p{L}\p{N}_-])/iu;

export const HOOK_BLOCK = /ven (verify-gate|repro-first|no-workaround|format|decisions-log|context-inject)[^\n]*/g;

const SECRETS = [
  /\b(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[=:]\s*\S+/gi,
  /\bbearer\s+[\w.~+/-]+=*/gi,
  /\b(?:sk|pk)-[\w-]{8,}/g,
  /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_\w{8,}/g,
  /\bxox[abprs]-[\w-]{8,}/g,
  // Long mixed letter+digit runs: base64 and hex tokens.
  /(?=[\w+/-]*\d)(?=[\w+/-]*[A-Za-z])[\w+/-]{24,}={0,2}/g,
];

// Prompts are stored in the decision log, so anything that looks like a credential is dropped first.
export function redactSecrets(text) {
  return SECRETS.reduce((redacted, pattern) => redacted.replace(pattern, '[redacted]'), text);
}
