import { describe, expect, it, vi, beforeEach } from "vitest";
import { api } from "../api/client";
import { encryptItem, type ItemFields } from "../lib/itemCrypto";
import { listCredentials, saveCredential, deleteCredential } from "./credentials";
import type { EncryptedCredential } from "./types";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

const USER_ID = "u1";

async function makeVaultKey(): Promise<CryptoKey> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

const FIELDS: ItemFields = {
  title: "GitHub",
  url: "https://github.com",
  username: "octocat",
  password: "s3cret",
  notes: "note",
};

/** Builds a stored row the way the server would return one, from real ciphertext. */
async function makeRow(key: CryptoKey, id: string, fields: ItemFields): Promise<EncryptedCredential> {
  const blob = await encryptItem(key, USER_ID, fields);
  return { id, ...blob, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z" };
}

describe("vault credentials data layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrypts every row it lists back into UI credentials", async () => {
    const key = await makeVaultKey();
    mockGet.mockResolvedValue([
      await makeRow(key, "1", FIELDS),
      await makeRow(key, "2", { ...FIELDS, title: "GitLab", password: "other" }),
    ]);

    const items = await listCredentials(key, USER_ID);

    expect(mockGet).toHaveBeenCalledWith("/credentials");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ id: "1", title: "GitHub", password: "s3cret" });
    expect(items[1]).toMatchObject({ id: "2", title: "GitLab", password: "other" });
  });

  it("encrypts on create and posts only ciphertext, then returns the decrypted item", async () => {
    const key = await makeVaultKey();
    mockPost.mockImplementation(async (_path, body) => ({
      id: "new",
      ...(body as object),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    }));

    const saved = await saveCredential(key, USER_ID, FIELDS);

    expect(mockPost).toHaveBeenCalledOnce();
    const [path, body] = mockPost.mock.calls[0];
    expect(path).toBe("/credentials");
    // The wire body is opaque ciphertext — no plaintext field leaks.
    const wire = JSON.stringify(body);
    expect(wire).toContain("overviewCiphertext");
    expect(wire).not.toContain("s3cret");
    expect(wire).not.toContain("octocat");
    // What we hand back to the UI is the decrypted item.
    expect(saved).toMatchObject({ id: "new", title: "GitHub", password: "s3cret" });
  });

  it("routes an edit through PUT with the item id", async () => {
    const key = await makeVaultKey();
    mockPut.mockImplementation(async (_path, body) => ({
      id: "42",
      ...(body as object),
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    }));

    const saved = await saveCredential(key, USER_ID, FIELDS, "42");

    expect(mockPut).toHaveBeenCalledOnce();
    expect(mockPut.mock.calls[0][0]).toBe("/credentials/42");
    expect(mockPost).not.toHaveBeenCalled();
    expect(saved).toMatchObject({ id: "42", title: "GitHub" });
  });

  it("deletes by id", async () => {
    await deleteCredential("7");
    expect(mockDelete).toHaveBeenCalledWith("/credentials/7");
  });
});
