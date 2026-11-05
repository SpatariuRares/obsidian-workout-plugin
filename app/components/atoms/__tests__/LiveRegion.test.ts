/** @jest-environment jsdom */

import { LiveRegion } from "@app/components/atoms/LiveRegion";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("LiveRegion atom", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("is a polite, hidden status region", () => {
    const { el } = LiveRegion.create(createObsidianContainer());

    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    expect(el.getAttribute("aria-atomic")).toBe("true");
    expect(el.classList.contains("workout-visually-hidden")).toBe(true);
  });

  it("empties itself before saying a text, so the same text is said again", () => {
    const { el, announce } = LiveRegion.create(createObsidianContainer());

    announce("1/4 sets");
    expect(el.textContent).toBe("");
    jest.runAllTimers();
    expect(el.textContent).toBe("1/4 sets");

    announce("1/4 sets");
    expect(el.textContent).toBe("");
    jest.runAllTimers();
    expect(el.textContent).toBe("1/4 sets");
  });

  it("says only the last of quick announcements", () => {
    const { el, announce } = LiveRegion.create(createObsidianContainer());

    announce("1/4 sets");
    announce("2/4 sets");
    jest.runAllTimers();

    expect(el.textContent).toBe("2/4 sets");
  });
});
