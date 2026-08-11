import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );

    const overlay = container.querySelector(".modal-overlay")!;
    await user.click(overlay as Element);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when the dialog panel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );

    await user.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("locks body scroll while open and restores it on unmount", () => {
    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <Modal onClose={() => {}}>
        <p>Body</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe("hidden");

    unmount();
    expect(document.body.style.overflow).toBe("scroll");
  });
});
