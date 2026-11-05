/** @jest-environment jsdom */

import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { t } from "@app/i18n";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Button atom", () => {
  const createParent = () => createObsidianContainer();

  it("creates a button with text, icon, and attributes", () => {
    const parent = createParent();

    const button = Button.create(parent, {
      text: "Save",
      icon: "save",
      variant: "primary",
      title: "Save workout",
      ariaLabel: "Save workout log",
    });

    expect(parent.contains(button)).toBe(true);
    expect(button.classList.contains("workout-btn-primary")).toBe(
      true,
    );
    expect(button.textContent).toBe("Save");
    expect(
      button.querySelector(".workout-btn-icon")?.getAttribute("data-icon"),
    ).toBe("save");
    expect(button.getAttribute("title")).toBe("Save workout");
    expect(button.getAttribute("aria-label")).toBe(
      "Save workout log",
    );
  });

  it("registers click handlers and toggles disabled state", () => {
    const parent = createParent();
    const button = Button.create(parent, {
      text: "Run",
      variant: "secondary",
    });
    const handler = jest.fn();

    Button.onClick(button, handler);

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    Button.setDisabled(button, true);
    expect(button.getAttribute("disabled")).toBe("true");
    expect(button.classList.contains("disabled")).toBe(true);

    Button.setDisabled(button, false);
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.classList.contains("disabled")).toBe(false);
  });

  it("creates button with disabled attribute", () => {
    const parent = createParent();

    const button = Button.create(parent, {
      text: "Submit",
      disabled: true,
      variant: "primary",
    });

    expect(button.getAttribute("disabled")).toBe("true");
  });

  it("uses default className when none provided", () => {
    const parent = createParent();

    const button = Button.create(parent, {
      text: "Default",
      variant: "secondary",
    });

    expect(button.classList.contains("workout-btn")).toBe(true);
    expect(button.classList.contains("workout-btn-secondary")).toBe(
      true,
    );
  });

  it("handles onClick with AbortSignal", () => {
    const parent = createParent();
    const button = Button.create(parent, {
      text: "Abort",
      variant: "secondary",
    });
    const handler = jest.fn();
    const controller = new AbortController();

    Button.onClick(button, handler, controller.signal);

    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);

    // Abort the controller
    controller.abort();

    // Click should no longer trigger handler
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("creates button with only icon", () => {
    const parent = createParent();

    const button = Button.create(parent, {
      icon: "search",
      variant: "secondary",
    });

    expect(button.textContent).toBe("");
    expect(
      button.querySelector(".workout-btn-icon")?.getAttribute("data-icon"),
    ).toBe("search");
    expect(button.classList.contains("workout-btn-with-icon")).toBe(true);
  });

  it("creates button with empty text and no icon", () => {
    const parent = createParent();

    const button = Button.create(parent, {
      variant: "secondary",
    });

    expect(button.textContent).toBe("");
    expect(button.classList.contains("workout-btn-with-icon")).toBe(false);
  });
});

describe("Button.createModalActions", () => {
  const texts = (row: HTMLElement) =>
    Array.from(row.querySelectorAll("button")).map((b) => b.textContent);

  it("draws the primary action first, then Cancel, in the sticky row", () => {
    const parent = createObsidianContainer();
    const onSave = jest.fn();
    const onCancel = jest.fn();

    const actions = Button.createModalActions(parent, {
      primary: { text: "Save", onClick: onSave },
      onCancel,
    });

    expect(actions.row.classList.contains("workout-modal-actions")).toBe(true);
    expect(texts(actions.row)).toEqual(["Save", t("modal.buttons.cancel")]);
    expect(actions.primary?.classList.contains("workout-btn-primary")).toBe(true);
    expect(actions.cancel?.classList.contains("workout-btn-secondary")).toBe(true);

    actions.primary?.click();
    expect(onSave).toHaveBeenCalledTimes(1);
    actions.cancel?.click();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("takes the primary's variant (a destructive confirm) and disabled state", () => {
    const actions = Button.createModalActions(createObsidianContainer(), {
      primary: {
        text: "Delete",
        onClick: jest.fn(),
        variant: BUTTONVARIANT.DANGER,
        disabled: true,
      },
      onCancel: jest.fn(),
    });

    expect(actions.primary?.classList.contains("workout-btn-danger")).toBe(true);
    expect(actions.primary?.hasAttribute("disabled")).toBe(true);
  });

  it("puts other actions after the primary and before Cancel, and rare ones at the start", () => {
    const actions = Button.createModalActions(createObsidianContainer(), {
      start: (row) => row.createEl("button", { text: "Trash" }),
      primary: { text: "Merge", onClick: jest.fn() },
      others: [
        { text: "Replace", onClick: jest.fn(), variant: BUTTONVARIANT.WARNING },
      ],
      onCancel: jest.fn(),
      className: "workout-log-actions",
    });

    expect(texts(actions.row)).toEqual([
      "Trash",
      "Merge",
      "Replace",
      t("modal.buttons.cancel"),
    ]);
    expect(actions.row.classList.contains("workout-log-actions")).toBe(true);
  });

  it("draws only the buttons it is given", () => {
    const close = Button.createModalActions(createObsidianContainer(), {
      primary: { text: "Close", onClick: jest.fn() },
    });
    expect(texts(close.row)).toEqual(["Close"]);
    expect(close.cancel).toBeUndefined();

    const cancelOnly = Button.createModalActions(createObsidianContainer(), {
      onCancel: jest.fn(),
    });
    expect(texts(cancelOnly.row)).toEqual([t("modal.buttons.cancel")]);
    expect(cancelOnly.primary).toBeUndefined();
  });
});
