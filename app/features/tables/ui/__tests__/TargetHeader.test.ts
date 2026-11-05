/** @jest-environment jsdom */

import { TargetHeader } from "@app/features/tables/ui/TargetHeader";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { logRow } from "@app/types/__tests__/logRow";

import { t } from "@app/i18n";

describe("TargetHeader", () => {
  it("returns null when no targets set", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      filteredData: [],
      weightUnit: "kg",
    });

    expect(result).toBeNull();
  });

  it("renders target text with weight only", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      filteredData: [],
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(result!.classList.contains("workout-target-header")).toBe(
      true,
    );
    expect(result!.querySelector(".workout-target-text")!.textContent).toBe(
      t("session.targetWeight", { weight: 100, unit: "kg" }),
    );
  });

  it("renders target text with reps only", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetReps: 10,
      filteredData: [],
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(result!.querySelector(".workout-target-text")!.textContent).toBe(
      t("session.targetReps", { reps: 10 }),
    );
  });

  it("renders target text with both weight and reps", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: [],
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(result!.querySelector(".workout-target-text")!.textContent).toBe(
      t("logs.weightedSet", { weight: 100, unit: "kg", reps: 10 }),
    );
  });

  it("renders the best reps and a progress meter when both targets and matching data exist", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 100, reps: 7 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(result!.querySelector(".workout-progress-meter")).not.toBeNull();
    expect(
      result!.querySelector(".workout-target-progress")!.textContent,
    ).toBe(t("table.target.progress", { best: 7, target: 10 }));
  });

  it("says no set was done at the target weight yet, over an empty meter", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 60, reps: 10 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(
      result!.querySelector(".workout-progress-meter")!.getAttribute("aria-valuenow"),
    ).toBe("0");
    expect(
      result!.querySelector(".workout-target-progress")!.textContent,
    ).toBe(t("table.target.noSetsYet", {
        weight: t("session.targetWeight", { weight: 100, unit: "kg" }),
      }));
  });

  it("does not render progress bar when only weight is set", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 100, reps: 7 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    expect(result!.querySelector(".workout-progress-meter")).toBeNull();
    expect(result!.querySelector(".workout-target-progress")).toBeNull();
  });

  it("marks the meter done once the target reps are reached", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 100, reps: 10 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const meter = result!.querySelector(".workout-progress-meter");
    expect(meter!.classList.contains("is-done")).toBe(true);
  });

  it("fills the meter in proportion to the best reps", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 100, reps: 5 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const fill = result!.querySelector(
      ".workout-progress-meter-fill",
    ) as HTMLElement;
    expect(fill.style.getPropertyValue("--workout-progress-value")).toBe("50%");
  });

  it("names the meter for screen readers", () => {
    const container = createObsidianContainer();
    const data = [logRow({ weight: 100, reps: 8 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const meter = result!.querySelector(".workout-progress-meter");
    expect(meter!.getAttribute("role")).toBe("progressbar");
    expect(meter!.getAttribute("aria-label")).toBe(
      t("table.target.progressTooltip", { best: 8, target: 10 }),
    );
  });

  it("renders target text with lb unit", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      filteredData: [],
      weightUnit: "lb",
    });

    expect(result).not.toBeNull();
    expect(result!.textContent).toContain(
      t("session.targetWeight", { weight: 100, unit: "lb" }),
    );
  });
});
