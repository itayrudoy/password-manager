import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { VaultKeyProvider, useVaultKey } from "./VaultKeyContext";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

vi.mock("../api/client", () => ({
  api: { get: vi.fn() },
  ApiError: class ApiError extends Error {},
}));

vi.mock("../auth/AuthContext", () => ({ useAuth: vi.fn() }));

const mockGet = vi.mocked(api.get);
const mockUseAuth = vi.mocked(useAuth);

/** Renders the current status + whether a key is present. */
function Probe() {
  const { vaultKey, status } = useVaultKey();
  return <div data-testid="probe">{`${status}:${vaultKey ? "key" : "none"}`}</div>;
}

function renderProvider() {
  return render(
    <VaultKeyProvider>
      <Probe />
    </VaultKeyProvider>,
  );
}

const SIGNED_IN = {
  user: { id: "u1", email: "user@example.com" },
  isLoading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
};

// 32 zero bytes, base64 — a well-formed Vault Key the server would deliver.
const KEY_B64 = btoa(String.fromCharCode(...new Uint8Array(32)));

describe("VaultKeyProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and imports the Vault Key once the user is signed in", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mockGet.mockResolvedValue({ vaultKey: KEY_B64 });

    renderProvider();

    expect(await screen.findByText("ready:key")).toBeInTheDocument();
    expect(mockGet).toHaveBeenCalledWith("/keychain/vault-key");
  });

  it("surfaces an error status when the key can't be fetched or imported", async () => {
    mockUseAuth.mockReturnValue(SIGNED_IN);
    mockGet.mockRejectedValue(new Error("network"));

    renderProvider();

    expect(await screen.findByText("error:none")).toBeInTheDocument();
  });

  it("holds no key and does not fetch when there is no user", () => {
    mockUseAuth.mockReturnValue({ ...SIGNED_IN, user: null });

    renderProvider();

    expect(screen.getByTestId("probe")).toHaveTextContent("loading:none");
    expect(mockGet).not.toHaveBeenCalled();
  });
});
