import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

/** Install (or remove) a fake navigator.clipboard for a single test. */
function setClipboard(value: { writeText: (t: string) => Promise<void> } | undefined) {
  Object.defineProperty(navigator, "clipboard", {
    value,
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  setClipboard(undefined);
  vi.restoreAllMocks();
});

describe("copyText", () => {
  it("uses navigator.clipboard when available and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });

    await expect(copyText("hunter2")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hunter2");
  });

  it("still copies via the fallback when the clipboard API is unavailable", async () => {
    setClipboard(undefined);
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });

    await expect(copyText("fallback-secret")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    // The temporary textarea is cleaned up.
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("returns false when the copy cannot happen at all", async () => {
    setClipboard(undefined);
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
    });

    await expect(copyText("nope")).resolves.toBe(false);
    expect(document.querySelector("textarea")).toBeNull();
  });
});
