/** @jest-environment jsdom */

import { Icon } from "@app/components/atoms/Icon";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Icon atom", () => {
  it("renders an icon span with optional title", () => {
    const parent = createObsidianContainer();

    const icon = Icon.create(parent, {
      name: "flame",
      className: "metric-icon",
      title: "Intensity",
    });

    expect(parent.contains(icon)).toBe(true);
    expect(icon.classList.contains("metric-icon")).toBe(true);
    expect(icon.getAttribute("data-icon")).toBe("flame");
    expect(icon.classList.contains("workout-icon")).toBe(true);
    expect(icon.getAttribute("aria-hidden")).toBe("true");
    expect(icon.getAttribute("title")).toBe("Intensity");
  });

  it("uses the default icon class when none supplied", () => {
    const parent = createObsidianContainer();
    const icon = Icon.create(parent, { name: "sparkles" });

    expect(icon.classList.contains("icon")).toBe(true);
  });
});
