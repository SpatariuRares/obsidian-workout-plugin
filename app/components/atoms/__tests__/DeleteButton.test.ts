/** @jest-environment jsdom */

import { DeleteButton } from "@app/components/atoms/DeleteButton";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("DeleteButton atom", () => {
  it("renders an icon button named by its label", () => {
    const parent = createObsidianContainer();

    const button = DeleteButton.create(parent, { label: "Delete set", onClick: () => {} });

    expect(parent.contains(button)).toBe(true);
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Delete set");
    expect(button.classList.contains("workout-delete-button")).toBe(true);
    expect(button.classList.contains("clickable-icon")).toBe(true);
  });

  it("adds the caller's class", () => {
    const button = DeleteButton.create(createObsidianContainer(), {
      label: "Remove",
      onClick: () => {},
      className: "workout-sets-remove",
    });

    expect(button.classList.contains("workout-sets-remove")).toBe(true);
  });

  it("calls onClick when clicked", () => {
    const onClick = jest.fn();
    const button = DeleteButton.create(createObsidianContainer(), { label: "Remove", onClick });

    button.click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
