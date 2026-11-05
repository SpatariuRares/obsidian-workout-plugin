/** @jest-environment jsdom */

import { DisclosureToggle } from "@app/components/atoms/DisclosureToggle";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("DisclosureToggle atom", () => {
  it("is a chevron that says whether its details are shown", () => {
    const closed = DisclosureToggle.create(createObsidianContainer(), {
      expanded: false,
      label: "Protocol and notes of set 2",
      onToggle: () => {},
    });
    const open = DisclosureToggle.create(createObsidianContainer(), {
      expanded: true,
      label: "Protocol and notes of set 2",
      onToggle: () => {},
      controls: "details-2",
    });

    expect(closed.getAttribute("aria-expanded")).toBe("false");
    expect(closed.classList.contains("is-expanded")).toBe(false);
    expect(closed.dataset.icon).toBe("chevron-down");
    expect(closed.getAttribute("aria-label")).toBe("Protocol and notes of set 2");
    expect(open.getAttribute("aria-expanded")).toBe("true");
    expect(open.classList.contains("is-expanded")).toBe(true);
    expect(open.getAttribute("aria-controls")).toBe("details-2");
  });

  it("shows the dot only when the hidden details hold something", () => {
    const plain = DisclosureToggle.create(createObsidianContainer(), {
      expanded: false,
      label: "Details",
      onToggle: () => {},
    });
    const marked = DisclosureToggle.create(createObsidianContainer(), {
      expanded: false,
      label: "Details",
      onToggle: () => {},
      marked: true,
    });

    expect(plain.querySelector(".workout-disclosure-toggle-dot")).toBeNull();
    expect(marked.querySelector(".workout-disclosure-toggle-dot")).not.toBeNull();
  });

  it("calls onToggle when clicked", () => {
    const onToggle = jest.fn();
    DisclosureToggle.create(createObsidianContainer(), {
      expanded: false,
      label: "Details",
      onToggle,
    }).click();

    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
