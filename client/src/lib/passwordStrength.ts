export interface PasswordStrength {
  /** Estimated Shannon entropy in bits. */
  bits: number;
  /** 0 for an empty password, then 1–4 for Weak→Strong. */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Weak" | "Fair" | "Good" | "Strong";
}

/** Alphabet size contributed by each character class that appears in the value. */
const CLASS_SIZES: ReadonlyArray<[RegExp, number]> = [
  [/[a-z]/, 26],
  [/[A-Z]/, 26],
  [/[0-9]/, 10],
  [/[^a-zA-Z0-9]/, 32],
];

/** A rough strength estimate: entropy = length × log2(size of the combined
 *  alphabet of the classes present). Dependency-free and intentionally simple —
 *  it rewards length and variety but knows nothing about dictionaries or
 *  patterns, so it is a guide, not attack-grade scoring. */
export function estimateStrength(password: string): PasswordStrength {
  if (!password) return { bits: 0, score: 0, label: "Weak" };

  let pool = 0;
  for (const [re, size] of CLASS_SIZES) {
    if (re.test(password)) pool += size;
  }
  const bits = password.length * Math.log2(pool);

  if (bits >= 80) return { bits, score: 4, label: "Strong" };
  if (bits >= 60) return { bits, score: 3, label: "Good" };
  if (bits >= 36) return { bits, score: 2, label: "Fair" };
  return { bits, score: 1, label: "Weak" };
}
