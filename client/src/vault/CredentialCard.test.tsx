import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CredentialCard } from "./CredentialCard";
import { copyText } from "../lib/clipboard";
import type { Credential } from "./types";

// The card's copy actions go through lib/clipboard; stub it so the copy outcome
// is controllable regardless of the jsdom clipboard environment.
vi.mock("../lib/clipboard", () => ({
  copyText: vi.fn().mockResolvedValue(true),
}));

function makeCredential(overrides: Partial<Credential> = {}): Credential {
  return {
    id: "1",
    title: "GitHub",
    url: "github.com",
    username: "octocat",
    password: "s3cr3t-pw",
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const noop = () => {};

describe("CredentialCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reveals and re-hides the password", async () => {
    const user = userEvent.setup();
    render(<CredentialCard item={makeCredential()} onEdit={noop} onDelete={noop} />);

    // Masked initially.
    expect(screen.queryByText("s3cr3t-pw")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reveal password" }));
    expect(screen.getByText("s3cr3t-pw")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.queryByText("s3cr3t-pw")).not.toBeInTheDocument();
  });

  it("does not show a copied confirmation when the copy fails", async () => {
    const user = userEvent.setup();
    vi.mocked(copyText).mockResolvedValueOnce(false);
    render(<CredentialCard item={makeCredential()} onEdit={noop} onDelete={noop} />);

    const copyPassword = screen.getByRole("button", { name: "Copy password" });
    await user.click(copyPassword);

    // The copy attempt ran, but a failed copy must never flash a false "Copied".
    await waitFor(() => expect(copyText).toHaveBeenCalledWith("s3cr3t-pw"));
    expect(copyPassword).not.toHaveClass("is-copied");
  });

  it("renders username and website only when present", () => {
    const { rerender } = render(
      <CredentialCard
        item={makeCredential({ username: "octocat", url: "github.com" })}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    expect(screen.getByText("octocat")).toBeInTheDocument();
    expect(screen.getByText("github.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy username" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy website" })).toBeInTheDocument();

    rerender(
      <CredentialCard
        item={makeCredential({ username: null, url: null })}
        onEdit={noop}
        onDelete={noop}
      />,
    );
    expect(screen.queryByText("octocat")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy username" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy website" })).not.toBeInTheDocument();
  });
});
