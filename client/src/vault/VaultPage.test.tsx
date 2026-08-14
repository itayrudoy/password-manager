import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VaultPage } from "./VaultPage";
import { listCredentials } from "./credentials";
import { useVaultKey } from "../keychain/VaultKeyContext";
import type { Credential } from "./types";

vi.mock("./credentials", () => ({
  listCredentials: vi.fn(),
  deleteCredential: vi.fn(),
}));

vi.mock("../keychain/VaultKeyContext", () => ({ useVaultKey: vi.fn() }));

// Auth is orthogonal to what we're testing here; provide a stable signed-in user.
vi.mock("../auth/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "user@example.com" },
    isLoading: false,
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  }),
}));

const mockList = vi.mocked(listCredentials);
const mockUseVaultKey = vi.mocked(useVaultKey);

// A stand-in CryptoKey — VaultPage only forwards it to the (mocked) data layer.
const READY_KEY = { vaultKey: {} as CryptoKey, status: "ready" as const };

function makeCredential(overrides: Partial<Credential> = {}): Credential {
  return {
    id: "1",
    title: "GitHub",
    url: "github.com",
    username: "octocat",
    password: "pw",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("VaultPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVaultKey.mockReturnValue(READY_KEY);
  });

  it("shows the loading state while the vault is being fetched", () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves
    render(<VaultPage />);
    expect(screen.getByText("Loading your vault…")).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    mockList.mockRejectedValue(new Error("network"));
    render(<VaultPage />);
    expect(await screen.findByText("Failed to load your vault")).toBeInTheDocument();
    expect(screen.queryByText("Loading your vault…")).not.toBeInTheDocument();
  });

  it("shows an unlock error when the Vault Key can't be obtained", async () => {
    mockUseVaultKey.mockReturnValue({ vaultKey: null, status: "error" });
    render(<VaultPage />);
    expect(await screen.findByText("Couldn’t unlock your vault")).toBeInTheDocument();
    expect(mockList).not.toHaveBeenCalled();
  });

  it("stays in the loading state until the Vault Key is ready", () => {
    mockUseVaultKey.mockReturnValue({ vaultKey: null, status: "loading" });
    render(<VaultPage />);
    expect(screen.getByText("Loading your vault…")).toBeInTheDocument();
    expect(mockList).not.toHaveBeenCalled();
  });

  it("shows the empty state when there are no credentials", async () => {
    mockList.mockResolvedValue([]);
    render(<VaultPage />);
    expect(await screen.findByText("No logins yet")).toBeInTheDocument();
  });

  it("renders a card per credential when the vault is populated", async () => {
    mockList.mockResolvedValue([
      makeCredential({ id: "1", title: "GitHub" }),
      makeCredential({ id: "2", title: "GitLab" }),
    ]);
    render(<VaultPage />);

    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("GitLab")).toBeInTheDocument();
    expect(screen.queryByText("No logins yet")).not.toBeInTheDocument();
  });
});
