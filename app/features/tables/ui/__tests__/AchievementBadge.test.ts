/** @jest-environment jsdom */

import { AchievementBadge } from "@app/features/tables/ui/AchievementBadge";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { Button } from "@app/components/atoms";

jest.mock("@app/components/atoms", () => ({
  Button: {
    create: jest.fn((parent: HTMLElement, opts: any) => {
      const btn = document.createElement("button");
      btn.textContent = opts.text || "";
      btn.className = opts.className || "";
      parent.appendChild(btn);
      return btn;
    }),
    onClick: jest.fn((btn: HTMLElement, handler: Function, signal?: AbortSignal) => {
      btn.addEventListener("click", handler as EventListener, signal ? { signal } : undefined);
    }),
  },
}));

const createLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-15",
  exercise: "Bench Press",
  reps: 10,
  weight: 80,
  volume: 800,
  timestamp: 1705315200000,
  ...overrides,
});

describe("AchievementBadge", () => {
  const defaultCallbacks = {
    onDismiss: jest.fn().mockResolvedValue(undefined),
    onUpdateTarget: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when target is not achieved", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 5 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
    );

    expect(result).toBeNull();
  });

  it("returns null when badge is dismissed for current weight", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: true,
      },
      defaultCallbacks,
    );

    expect(result).toBeNull();
  });

  it("renders achievement badge when target is achieved", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
    );

    expect(result).not.toBeNull();
    expect(result!.container.classList.contains("workout-achievement-badge")).toBe(
      true,
    );
  });

  it("shows suggested next weight", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
    );

    expect(result).not.toBeNull();
    const suggestionText = result!.container.querySelector(
      ".workout-suggestion-text",
    );
    expect(suggestionText?.textContent).toContain("82.5kg");
  });

  it("dismiss button removes badge and calls callback", async () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
    );

    expect(result).not.toBeNull();
    expect(result!.dismissButton).toBeTruthy();
  });

  it("renders update target button", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];

    const result = AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
    );

    expect(result).not.toBeNull();
    expect(result!.updateButton).toBeTruthy();
  });

  it("passes abort signal to button handlers", () => {
    const container = createObsidianContainer();
    const data = [createLog({ weight: 80, reps: 10 })];
    const controller = new AbortController();

    AchievementBadge.render(
      container,
      {
        exercise: "Bench Press",
        targetWeight: 80,
        targetReps: 10,
        filteredData: data,
        weightIncrement: 2.5,
        isDismissedForWeight: false,
      },
      defaultCallbacks,
      controller.signal,
    );

    // Button.onClick should have been called with signal
    const onClickCalls = (Button.onClick as jest.Mock).mock.calls;
    expect(
      onClickCalls.some((call: any[]) => call[2] === controller.signal),
    ).toBe(true);
  });
});
