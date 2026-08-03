import dotenv from "dotenv";

// Loaded before any test file imports env.ts, so its `dotenv/config` call
// (which never overwrites already-set vars) sees these and leaves them alone.
// Keeps integration tests pointed at password_manager_test, never the dev DB.
dotenv.config({ path: ".env.test" });
