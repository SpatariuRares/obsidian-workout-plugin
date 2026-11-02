/** @jest-environment jsdom */

import { TrainingCalendarWidget } from "@app/features/dashboard/widgets/training-calendar/TrainingCalendarWidget";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const set = (date: string): WorkoutLogData => ({
  date,
  exercise: "Squat",
  reps: 5,
  weight: 100,
  volume: 500,
});

// Wednesday 17 January 2024, local time
const today = new Date(2024, 0, 17, 12, 0);

function render(history: WorkoutLogData[], weeklyGoal: number) {
  const container = createObsidianContainer();
  TrainingCalendarWidget.render(
    container,
    history,
    weeklyGoal,
    today,
  );
  return container;
}

describe("TrainingCalendarWidget", () => {
  it("should draw a year of days, trained ones graded", () => {
    const container = render(
      [set("2024-01-15"), set("2024-01-16")],
      1,
    );

    const grid = container.querySelector(".workout-calendar-grid");
    expect(grid?.children).toHaveLength(53 * 7);
    expect(
      grid?.querySelectorAll(".workout-calendar-level-4"),
    ).toHaveLength(2);
    expect(grid?.querySelectorAll(".is-future")).toHaveLength(4);
  });

  it("should put the current week first, so a narrow grid starts at it", () => {
    const container = render([set("2024-01-15")], 1);

    const cells = Array.from(
      container.querySelector(".workout-calendar-grid")?.children ?? [],
    );
    // This week (Mon 15 .. Sun 21): Monday trained, Thursday to Sunday to come
    const thisWeek = cells.slice(0, 7);
    expect(thisWeek[0].classList).toContain("workout-calendar-level-4");
    expect(thisWeek.filter((c) => c.classList.contains("is-future"))).toHaveLength(4);
    expect(
      cells.slice(-7).some((c) => c.classList.contains("is-future")),
    ).toBe(false);
  });

  it("should show the streaks against the weekly goal and this week's progress", () => {
    const container = render(
      [
        set("2024-01-15"),
        set("2024-01-08"),
        set("2024-01-09"),
        set("2024-01-01"),
        set("2024-01-02"),
      ],
      2,
    );

    const values = Array.from(
      container.querySelectorAll(".workout-calendar-stat-value"),
    ).map((el) => el.textContent);
    expect(values).toEqual([
      t("dashboard.trainingCalendar.weeks", { count: 2 }),
      t("dashboard.trainingCalendar.weeks", { count: 2 }),
      t("dashboard.trainingCalendar.daysOfGoal", {
        days: 1,
        goal: 2,
      }),
    ]);
    expect(container.querySelector(".is-met")).toBeNull();
  });
});
