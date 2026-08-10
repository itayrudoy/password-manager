import { describe, it, expect } from "vitest";
import { generatePassword, type GeneratorOptions } from "./passwordGenerator";

const ALL: GeneratorOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

// Characters intentionally excluded to avoid look-alikes (0/O/o, 1/l/I).
const AMBIGUOUS = /[0O1lI]/;

describe("generatePassword", () => {
  it("produces a password of the requested length", () => {
    expect(generatePassword({ ...ALL, length: 24 })).toHaveLength(24);
  });

  it("uses only the selected character classes", () => {
    const pw = generatePassword({
      ...ALL,
      length: 64,
      uppercase: false,
      digits: false,
      symbols: false,
    });
    expect(pw).toMatch(/^[a-z]+$/);
  });

  it("never emits look-alike characters (0 O 1 l I)", () => {
    // A long sample so every class has ample chance to surface an excluded char.
    const pw = generatePassword({ ...ALL, length: 200 });
    expect(pw).not.toMatch(AMBIGUOUS);
  });

  it("includes at least one character from every selected class", () => {
    // Repeat: inclusion must be guaranteed, not merely probable.
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ ...ALL, length: 8 });
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[2-9]/);
      expect(pw).toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it("does not introduce a class that was turned off", () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({
        ...ALL,
        length: 16,
        symbols: false,
      });
      expect(pw).not.toMatch(/[^a-zA-Z0-9]/);
    }
  });

  it("returns an empty string when no class is selected", () => {
    expect(
      generatePassword({
        length: 16,
        lowercase: false,
        uppercase: false,
        digits: false,
        symbols: false,
      }),
    ).toBe("");
  });

  it("produces different passwords on successive calls", () => {
    const a = generatePassword(ALL);
    const b = generatePassword(ALL);
    expect(a).not.toBe(b);
  });

  it("still fills to length when length is below the number of selected classes", () => {
    // 2 chars but 4 classes requested — can't include all, but must not overflow.
    const pw = generatePassword({ ...ALL, length: 2 });
    expect(pw).toHaveLength(2);
  });
});
