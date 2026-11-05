/** @jest-environment jsdom */

import { ProgressMeter } from "@app/components/atoms/ProgressMeter";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("ProgressMeter atom", () => {
  it("is a named progressbar filled in proportion to its value", () => {
    const meter = ProgressMeter.create(createObsidianContainer(), {
      value: 6,
      max: 8,
      label: "6 of 8 reps",
    });
    const fill = meter.querySelector<HTMLElement>(".workout-progress-meter-fill")!;

    expect(meter.getAttribute("role")).toBe("progressbar");
    expect(meter.getAttribute("aria-label")).toBe("6 of 8 reps");
    expect(meter.getAttribute("aria-valuenow")).toBe("6");
    expect(meter.getAttribute("aria-valuemax")).toBe("8");
    expect(fill.style.getPropertyValue("--workout-progress-value")).toBe("75%");
    expect(meter.classList.contains("is-done")).toBe(false);
  });

  it("is done at its max and never fills past it", () => {
    const meter = ProgressMeter.create(createObsidianContainer(), {
      value: 10,
      max: 8,
      label: "10 of 8 reps",
    });
    const fill = meter.querySelector<HTMLElement>(".workout-progress-meter-fill")!;

    expect(meter.classList.contains("is-done")).toBe(true);
    expect(meter.getAttribute("aria-valuenow")).toBe("8");
    expect(fill.style.getPropertyValue("--workout-progress-value")).toBe("100%");
  });

  it("stays empty with nothing to reach", () => {
    const meter = ProgressMeter.create(createObsidianContainer(), {
      value: 3,
      max: 0,
      label: "none",
    });
    const fill = meter.querySelector<HTMLElement>(".workout-progress-meter-fill")!;

    expect(fill.style.getPropertyValue("--workout-progress-value")).toBe("0%");
  });
});
