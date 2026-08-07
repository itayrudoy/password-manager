import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "./clipboard";

/** Copies text to the clipboard and briefly tracks which key was copied so the
 *  UI can show a "Copied" confirmation. `copied` holds the key of the most
 *  recent successful copy (or null); it resets after `resetMs`. */
export function useCopyFeedback(resetMs = 1100) {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (value: string, key = "default") => {
      if (!(await copyText(value))) return false;
      setCopied(key);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(
        () => setCopied((c) => (c === key ? null : c)),
        resetMs,
      );
      return true;
    },
    [resetMs],
  );

  return { copied, copy };
}
