import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VaultPage } from "./VaultPage";
import { api } from "../api/client";
import type { Credential } from "./types";

vi.mock("../api/client", () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

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

const mockGet = vi.mocked(api.get);

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
  });

  it("shows the loading state while the vault is being fetched", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<VaultPage />);
    expect(screen.getByText("Loading your vault…")).toBeInTheDocument();
  });

  it("shows an error state when the fetch fails", async () => {
    mockGet.mockRejectedValue(new Error("network"));
    render(<VaultPage />);
    expect(await screen.findByText("Failed to load your vault")).toBeInTheDocument();
    expect(screen.queryByText("Loading your vault…")).not.toBeInTheDocument();
  });

  it("shows the empty state when there are no credentials", async () => {
    mockGet.mockResolvedValue([]);
    render(<VaultPage />);
    expect(await screen.findByText("No logins yet")).toBeInTheDocument();
  });

  it("renders a card per credential when the vault is populated", async () => {
    mockGet.mockResolvedValue([
      makeCredential({ id: "1", title: "GitHub" }),
      makeCredential({ id: "2", title: "GitLab" }),
    ]);
    render(<VaultPage />);

    expect(await screen.findByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("GitLab")).toBeInTheDocument();
    expect(screen.queryByText("No logins yet")).not.toBeInTheDocument();
  });
});
