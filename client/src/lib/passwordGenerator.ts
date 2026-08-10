export interface GeneratorOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

/** Character classes, with visual look-alikes (0/O/o, 1/l/I) removed so a
 *  generated password can be read back and typed without ambiguity. */
const CLASSES = {
  lowercase: "abcdefghijkmnpqrstuvwxyz",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  digits: "23456789",
  symbols: "!@#$%^&*-_=+?",
} as const;

/** A uniformly-random integer in [0, max) using the CSPRNG, with rejection
 *  sampling to eliminate the modulo bias a plain `getRandomValues % max` has. */
function randomIndex(max: number): number {
  // Largest multiple of `max` that fits in a Uint32; values at or above it are
  // rejected so the remaining range divides evenly.
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let x: number;
  do {
    crypto.getRandomValues(buf);
    x = buf[0];
  } while (x >= limit);
  return x % max;
}

/** Pick one random character from a class. */
function pick(pool: string): string {
  return pool[randomIndex(pool.length)];
}

/** In-place Fisher–Yates shuffle driven by the CSPRNG. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a random password honoring the chosen options. Uses the Web Crypto
 *  CSPRNG (never Math.random), guarantees at least one character from every
 *  selected class when length allows, and returns "" if no class is selected. */
export function generatePassword(options: GeneratorOptions): string {
  const selected = (Object.keys(CLASSES) as (keyof typeof CLASSES)[]).filter(
    (k) => options[k],
  );
  if (selected.length === 0 || options.length <= 0) return "";

  const pool = selected.map((k) => CLASSES[k]).join("");

  // Seed one guaranteed character per selected class (as far as length permits),
  // then fill the remainder from the combined pool and shuffle so the guaranteed
  // characters aren't stuck at the front.
  const chars: string[] = [];
  for (const k of selected) {
    if (chars.length >= options.length) break;
    chars.push(pick(CLASSES[k]));
  }
  while (chars.length < options.length) {
    chars.push(pick(pool));
  }

  return shuffle(chars).join("");
}
