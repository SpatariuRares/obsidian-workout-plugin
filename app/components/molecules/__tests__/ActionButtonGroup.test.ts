/** @jest-environment jsdom */

import { ActionButtonGroup } from "@app/components/molecules/ActionButtonGroup";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

describe("ActionButtonGroup", () => {
  const createParent = () => createObsidianContainer();

  it("renders edit/delete buttons with default icons and labels", () => {
    const parent = createParent();

    const { container, editBtn, deleteBtn } = ActionButtonGroup.create(parent);

    expect(parent.contains(container)).toBe(true);
    expect(
      container.classList.contains("workout-table-action-button-group"),
    ).toBe(true);

    const renderedButtons = container.querySelectorAll("button");
    expect(renderedButtons).toHaveLength(2);

    expect(editBtn.classList.contains("workout-table-action-btn-edit")).toBe(
      true,
    );
    expect(editBtn.getAttribute("title")).toBe(t("general.edit"));
    expect(editBtn.getAttribute("aria-label")).toBe(t("general.edit"));

    expect(
      deleteBtn.classList.contains("workout-table-action-btn-delete"),
    ).toBe(true);
    expect(deleteBtn.getAttribute("title")).toBe(t("general.delete"));
    expect(deleteBtn.getAttribute("aria-label")).toBe(t("general.delete"));
  });

  it("supports overriding titles, icons, and container classes", () => {
    const parent = createParent();

    const overrides = {
      editTitle: "Edit set",
      deleteTitle: "Remove set",
      editIcon: "E",
      deleteIcon: "D",
      className: "is-floating",
    };

    const { container, editBtn, deleteBtn } = ActionButtonGroup.create(
      parent,
      overrides,
    );

    expect(
      container.classList.contains("workout-table-action-button-group"),
    ).toBe(true);
    expect(container.classList.contains("is-floating")).toBe(true);

    expect(editBtn.textContent).toBe("E");
    expect(editBtn.getAttribute("title")).toBe("Edit set");
    expect(editBtn.getAttribute("aria-label")).toBe("Edit set");

    expect(deleteBtn.textContent).toBe("D");
    expect(deleteBtn.getAttribute("title")).toBe("Remove set");
    expect(deleteBtn.getAttribute("aria-label")).toBe("Remove set");
  });
});
