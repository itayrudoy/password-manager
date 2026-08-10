import { describe, it, expect } from "vitest";
import { estimateStrength } from "./passwordStrength";

describe("estimateStrength", () => {
  it("reports an empty password as score 0", () => {
    expect(estimateStrength("").score).toBe(0);
  });

  // Worked examples: bits = length x log2(pool of classes present).
  // Independently computed so the assertions can disagree with the code.
  it("rates a short lowercase-only password as Weak", () => {
    // "abcde" -> 5 x log2(26) = 5 x 4.70 = 23.5 bits  (< 36 => Weak)
    expect(estimateStrength("abcde")).toMatchObject({ score: 1, label: "Weak" });
  });

  it("rates an 8-char lowercase password as Fair", () => {
    // "abcdefgh" -> 8 x log2(26) = 8 x 4.70 = 37.6 bits  (36-59 => Fair)
    expect(estimateStrength("abcdefgh")).toMatchObject({ score: 2, label: "Fair" });
  });

  it("rates a 12-char mixed-case+digits password as Good", () => {
    // pool 26+26+10 = 62; 12 x log2(62) = 12 x 5.95 = 71.4 bits  (60-79 => Good)
    expect(estimateStrength("Abcdefgh1234")).toMatchObject({ score: 3, label: "Good" });
  });

  it("rates a long all-classes password as Strong", () => {
    // pool 94; 20 x log2(94) = 20 x 6.55 = 131 bits  (>= 80 => Strong)
    expect(estimateStrength("Abcdefgh1234!@#$xyzW")).toMatchObject({ score: 4, label: "Strong" });
  });

  it("increases entropy with length for the same alphabet", () => {
    expect(estimateStrength("aaaaaaaaaaaa").bits).toBeGreaterThan(estimateStrength("aaaa").bits);
  });

  it("counts each character class only once regardless of repeats", () => {
    // one lowercase class -> pool 26, not 26 per character.
    // 4 x log2(26) = 18.80 bits (independently computed literal).
    expect(estimateStrength("aaaa").bits).toBeCloseTo(18.8, 1);
  });
});
