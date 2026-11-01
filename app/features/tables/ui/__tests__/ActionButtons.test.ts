/** @jest-environment jsdom */

import { ActionButtons } from "@app/features/tables/ui/ActionButtons";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

describe("ActionButtons", () => {
  it("gives a row one action: the edit button (delete is in the edit form)", () => {
    const container = createObsidianContainer();

    const { container: actions, editBtn } =
      ActionButtons.createActionButtonsContainer(container);

    expect(actions.classList.contains("workout-table-actions")).toBe(true);
    expect(actions.querySelectorAll("button")).toHaveLength(1);
    expect(editBtn.getAttribute("aria-label")).toBe(t("table.editTitle"));
  });
});
