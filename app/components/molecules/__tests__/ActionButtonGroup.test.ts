/** @jest-environment jsdom */

import { CONSTANTS } from "@app/constants/Constants";
import { ActionButtonGroup } from "@app/components/molecules/ActionButtonGroup";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ActionButtonGroup", () => {
	const createParent = () => createObsidianContainer();

	it("renders edit/delete buttons with default icons and labels", () => {
		const parent = createParent();

		const { container, editBtn, deleteBtn } = ActionButtonGroup.create(parent);

		expect(parent.contains(container)).toBe(true);
		expect(container.classList.contains("action-button-group")).toBe(true);

		const renderedButtons = container.querySelectorAll("button");
		expect(renderedButtons).toHaveLength(2);

		expect(editBtn.classList.contains("action-btn-edit")).toBe(true);
		expect(editBtn.getAttribute("title")).toBe(CONSTANTS.WORKOUT.LABELS.ACTIONS.EDIT);
		expect(editBtn.getAttribute("aria-label")).toBe(CONSTANTS.WORKOUT.LABELS.ACTIONS.EDIT);
		expect(editBtn.textContent).toBe(CONSTANTS.WORKOUT.ICONS.ACTIONS.EDIT.trim());

		expect(deleteBtn.classList.contains("action-btn-delete")).toBe(true);
		expect(deleteBtn.getAttribute("title")).toBe(CONSTANTS.WORKOUT.LABELS.ACTIONS.DELETE);
		expect(deleteBtn.getAttribute("aria-label")).toBe(CONSTANTS.WORKOUT.LABELS.ACTIONS.DELETE);
		expect(deleteBtn.textContent).toBe(CONSTANTS.WORKOUT.ICONS.ACTIONS.DELETE.trim());
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
			overrides
		);

		expect(container.classList.contains("action-button-group")).toBe(true);
		expect(container.classList.contains("is-floating")).toBe(true);

		expect(editBtn.textContent).toBe("E");
		expect(editBtn.getAttribute("title")).toBe("Edit set");
		expect(editBtn.getAttribute("aria-label")).toBe("Edit set");

		expect(deleteBtn.textContent).toBe("D");
		expect(deleteBtn.getAttribute("title")).toBe("Remove set");
		expect(deleteBtn.getAttribute("aria-label")).toBe("Remove set");
	});
});
