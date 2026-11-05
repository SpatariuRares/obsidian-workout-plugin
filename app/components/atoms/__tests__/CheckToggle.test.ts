/** @jest-environment jsdom */

import { CheckToggle } from "@app/components/atoms/CheckToggle";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { DomUtils } from "@app/utils/DomUtils";

describe("CheckToggle atom", () => {
  it("is an outlined tick named by its action while to do", () => {
    const button = CheckToggle.create(createObsidianContainer(), {
      done: false,
      label: "Log set 2",
      onClick: () => {},
    });

    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-label")).toBe("Log set 2");
    expect(button.classList.contains("workout-check-toggle")).toBe(true);
    expect(button.classList.contains("is-done")).toBe(false);
    expect(button.dataset.icon).toBe("check");
  });

  it("is filled when done, and names the action of that state", () => {
    const button = CheckToggle.create(createObsidianContainer(), {
      done: true,
      label: "Remove set 2 from the log",
      onClick: () => {},
    });

    expect(button.classList.contains("is-done")).toBe(true);
    expect(button.getAttribute("aria-label")).toBe("Remove set 2 from the log");
    // The label says what a tap does; a pressed state would contradict it
    expect(button.hasAttribute("aria-pressed")).toBe(false);
  });

  it("calls onClick, and can be focused again by its key", () => {
    const parent = createObsidianContainer();
    document.body.appendChild(parent);
    const onClick = jest.fn();
    const button = CheckToggle.create(parent, {
      done: false,
      label: "Log set 1",
      onClick,
      focusKey: "row-1-check",
      className: "extra",
    });

    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(button.classList.contains("extra")).toBe(true);
    expect(DomUtils.focusByKey(parent, "row-1-check")).toBe(true);
    expect(document.activeElement).toBe(button);
    parent.remove();
  });
});
