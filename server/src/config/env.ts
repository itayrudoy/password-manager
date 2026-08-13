import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Decodes standard-base64 key material and checks it's exactly `bytes` long.
// Node's base64 decoder silently drops invalid characters, so a length check
// alone can pass garbage; the round-trip re-encode rejects anything that isn't
// clean, canonical base64. Exported for unit testing. Throws on bad input.
export function decodeKey(value: string, bytes: number): Buffer {
  const key = Buffer.from(value, "base64");
  if (key.length !== bytes || key.toString("base64") !== value) {
    throw new Error(`expected ${bytes} bytes of valid base64`);
  }
  return key;
}

// A required env var holding raw key material. Decoded and validated at boot so
// a misconfigured key fails fast, not mid-request.
function requiredKey(name: string, bytes: number): Buffer {
  try {
    return decodeKey(required(name), bytes);
  } catch {
    throw new Error(`Env var ${name} must be ${bytes} bytes of valid base64`);
  }
}

export const env = {
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  // One server-wide key that locks every user's Vault Key (see keychain module).
  serverKey: requiredKey("SERVER_KEY", 32),
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
};
