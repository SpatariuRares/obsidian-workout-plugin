/** @jest-environment jsdom */

import { Icon } from "@app/components/atoms/Icon";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Icon atom", () => {
  it("renders an icon span with optional title", () => {
    const parent = createObsidianContainer();

    const icon = Icon.create(parent, {
      name: "🔥",
      className: "metric-icon",
      title: "Intensity",
    });

    expect(parent.contains(icon)).toBe(true);
    expect(icon.classList.contains("metric-icon")).toBe(true);
    expect(icon.textContent).toBe("🔥");
    expect(icon.getAttribute("title")).toBe("Intensity");
  });

  it("uses the default icon class when none supplied", () => {
    const parent = createObsidianContainer();
    const icon = Icon.create(parent, { name: "✨" });

    expect(icon.classList.contains("icon")).toBe(true);
  });
});
