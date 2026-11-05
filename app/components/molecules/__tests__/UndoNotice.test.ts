/** @jest-environment jsdom */

import { Notice } from "obsidian";
import { UndoNotice, UNDO_NOTICE_MS } from "@app/components/molecules/UndoNotice";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

// Obsidian's global: a fragment with createDiv/createEl
(globalThis as unknown as Record<string, unknown>).createFragment = () => createObsidianContainer();

const shown: { message: HTMLElement; duration: number; hide: jest.Mock }[] = [];
(Notice as unknown as jest.Mock).mockImplementation((message: HTMLElement, duration: number) => {
  const notice = { message, duration, hide: jest.fn() };
  shown.push(notice);
  return { hide: notice.hide };
});

beforeEach(() => {
  shown.length = 0;
});

describe("UndoNotice molecule", () => {
  it("shows what happened, then Undo, for 8 seconds", () => {
    UndoNotice.show({ message: "Set 1 removed", onUndo: () => {} });
    const row = shown[0].message.querySelector(".workout-undo-notice")!;

    expect(row.firstElementChild!.textContent).toBe("Set 1 removed");
    expect(row.lastElementChild!.textContent).toBe(t("common.undo"));
    expect(row.lastElementChild!.classList.contains("mod-cta")).toBe(true);
    expect(shown[0].duration).toBe(UNDO_NOTICE_MS);
  });

  it("fills the notice's message, so Undo sits at the right end", () => {
    UndoNotice.show({ message: "Set 1 removed", onUndo: () => {} });

    expect(shown[0].message.classList.contains("workout-undo-notice-message")).toBe(true);
  });

  it("hides itself and undoes on Undo", () => {
    const onUndo = jest.fn();
    UndoNotice.show({ message: "Set 1 removed", onUndo, undoLabel: "Put back", duration: 3000 });
    const undo = shown[0].message.querySelector<HTMLButtonElement>("button")!;

    expect(undo.textContent).toBe("Put back");
    expect(shown[0].duration).toBe(3000);
    undo.click();

    expect(shown[0].hide).toHaveBeenCalled();
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it("can be hidden by the caller", () => {
    const notice = UndoNotice.show({ message: "Set 1 removed", onUndo: () => {} });

    notice.hide();

    expect(shown[0].hide).toHaveBeenCalled();
  });
});
