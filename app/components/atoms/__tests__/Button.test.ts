/** @jest-environment jsdom */

import { Button } from "@app/components/atoms/Button";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Button atom", () => {
	const createParent = () => createObsidianContainer();

	it("creates a button with text, icon, and attributes", () => {
		const parent = createParent();

		const button = Button.create(parent, {
			text: "Save",
			icon: "💾",
			className: "btn-primary",
			title: "Save workout",
			ariaLabel: "Save workout log",
		});

		expect(parent.contains(button)).toBe(true);
		expect(button.classList.contains("btn-primary")).toBe(true);
		expect(button.textContent).toBe("💾 Save");
		expect(button.getAttribute("title")).toBe("Save workout");
		expect(button.getAttribute("aria-label")).toBe("Save workout log");
	});

	it("registers click handlers and toggles disabled state", () => {
		const parent = createParent();
		const button = Button.create(parent, { text: "Run" });
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
});
