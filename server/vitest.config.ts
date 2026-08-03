import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests share one real Postgres DB and truncate tables
    // between runs, so test files must not run concurrently.
    fileParallelism: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
