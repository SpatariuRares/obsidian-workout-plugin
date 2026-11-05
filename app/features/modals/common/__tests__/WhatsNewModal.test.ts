/** @jest-environment jsdom */
import { MarkdownRenderer } from "obsidian";
import { LocalizationService, t } from "@app/i18n";
import { WhatsNewModal } from "@app/features/modals/common/WhatsNewModal";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { ReleaseNotes } from "@app/services/onboarding/WhatsNew";

function openModal(releases: ReleaseNotes[]) {
  const modal = new WhatsNewModal({} as never, releases);
  const close = jest.fn();
  Object.assign(modal, { contentEl: createObsidianContainer(), close });
  modal.onOpen();
  return { modal, close };
}

beforeAll(() => LocalizationService.initialize({} as never));

describe("WhatsNewModal", () => {
  it("shows each release's version and notes, rendered as markdown", () => {
    const { modal } = openModal([
      { version: "3.1.0", notes: "**New** thing" },
      { version: "3.0.0", notes: "Older thing" },
    ]);

    const headings = [...modal.contentEl.querySelectorAll("h3")].map(
      (h) => h.textContent,
    );
    expect(headings).toEqual([
      t("whatsNew.version", { version: "3.1.0" }),
      t("whatsNew.version", { version: "3.0.0" }),
    ]);
    expect(
      [...modal.contentEl.querySelectorAll("details")].map((d) => d.open),
    ).toEqual([true, false]);
    expect(MarkdownRenderer.render).toHaveBeenCalledTimes(2);
    expect(modal.contentEl.textContent).toContain("**New** thing");
    expect(modal.contentEl.querySelector("a")?.textContent).toBe(
      t("whatsNew.olderReleases"),
    );
  });

  it("closes from its button", () => {
    const { modal, close } = openModal([]);
    modal.contentEl
      .querySelector<HTMLButtonElement>(".workout-modal-actions button")
      ?.click();
    expect(close).toHaveBeenCalled();
  });
});
