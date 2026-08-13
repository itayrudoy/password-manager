import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { decodeKey } from "../env.js";

describe("decodeKey", () => {
  it("decodes a valid 32-byte base64 key", () => {
    const value = randomBytes(32).toString("base64");
    expect(decodeKey(value, 32)).toHaveLength(32);
  });

  it("rejects a key of the wrong length", () => {
    const tooShort = randomBytes(16).toString("base64");
    expect(() => decodeKey(tooShort, 32)).toThrow();
  });

  it("rejects malformed base64 even if it decodes to the right length", () => {
    // Node's lenient decoder would otherwise skip the stray characters.
    expect(() => decodeKey("not-valid-base64!!!!", 32)).toThrow();
  });
});
