// English and Polish openers; corrections usually lead with the objection.
export const CORRECTION = /^(no\b|nope|don'?t|do not|stop|wrong|actually|instead|not (that|what|like)|why did you|revert|undo|that'?s (not|wrong)|you (should|shouldn'?t|forgot|missed)|never\b|please don'?t|nie\b|źle|zamiast|przestań|cofnij|dlaczego|czemu|to nie|nie tak|zapomniałeś|miałeś)/i;

export const HOOK_BLOCK = /ven (verify-gate|repro-first|no-workaround|format|decisions-log|context-inject)[^\n]*/g;
