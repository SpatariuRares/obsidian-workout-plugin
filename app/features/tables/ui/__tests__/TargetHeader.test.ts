/** @jest-environment jsdom */

import { TargetHeader } from "@app/features/tables/ui/TargetHeader";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { CONSTANTS } from "@app/constants";

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15",
  exercise: "Bench Press",
  reps: 8,
  weight: 80,
  volume: 640,
  ...overrides,
});

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
    expect(result!.classList.contains("workout-target-header")).toBe(true);
    expect(result!.textContent).toContain("100kg");
  });

  it("renders target text with reps only", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetReps: 10,
      filteredData: [],
      weightUnit: "kg",
    });

    const repsSuffix = CONSTANTS.WORKOUT.TABLE.TARGET.REPS_SUFFIX;
    expect(result).not.toBeNull();
    expect(result!.textContent).toContain(`10 ${repsSuffix}`);
  });

  it("renders target text with both weight and reps", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: [],
      weightUnit: "kg",
    });

    const repsSuffix = CONSTANTS.WORKOUT.TABLE.TARGET.REPS_SUFFIX;
    expect(result).not.toBeNull();
    expect(result!.textContent).toContain("100kg");
    expect(result!.textContent).toContain(`10 ${repsSuffix}`);
  });

  it("renders progress bar when both targets and matching data exist", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 100, reps: 7 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    const progressBar = result!.querySelector(".workout-progress-bar");
    expect(progressBar).not.toBeNull();
  });

  it("does not render progress bar when no data at target weight", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 60, reps: 10 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    const progressBar = result!.querySelector(".workout-progress-bar");
    expect(progressBar).toBeNull();
  });

  it("does not render progress bar when only weight is set", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 100, reps: 7 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      filteredData: data,
      weightUnit: "kg",
    });

    expect(result).not.toBeNull();
    const progressBar = result!.querySelector(".workout-progress-bar");
    expect(progressBar).toBeNull();
  });

  it("applies correct progress level class", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 100, reps: 10 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const progressFill = result!.querySelector(".workout-progress-fill");
    expect(progressFill).not.toBeNull();
    expect(progressFill!.classList.contains("workout-progress-complete")).toBe(
      true,
    );
  });

  it("sets progress bar width as percentage", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 100, reps: 5 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const progressFill = result!.querySelector(
      ".workout-progress-fill",
    ) as HTMLElement;
    expect(progressFill).not.toBeNull();
    expect(progressFill.style.width).toBe("50%");
  });

  it("sets tooltip on progress bar", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 100, reps: 8 })];

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      targetReps: 10,
      filteredData: data,
      weightUnit: "kg",
    });

    const progressBar = result!.querySelector(".workout-progress-bar");
    expect(progressBar).not.toBeNull();
    const expectedTooltip = CONSTANTS.WORKOUT.TABLE.TARGET.PROGRESS_TOOLTIP(8, 10);
    expect(progressBar!.getAttribute("title")).toBe(expectedTooltip);
    expect(progressBar!.getAttribute("aria-label")).toBe(expectedTooltip);
  });

  it("renders target text with lb unit", () => {
    const container = createObsidianContainer();

    const result = TargetHeader.render(container, {
      targetWeight: 100,
      filteredData: [],
      weightUnit: "lb",
    });

    expect(result).not.toBeNull();
    expect(result!.textContent).toContain("100lb");
  });
});
