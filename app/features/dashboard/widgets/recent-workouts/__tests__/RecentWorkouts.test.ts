/** @jest-environment jsdom */

import { RecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/RecentWorkouts";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

const logs: WorkoutLogData[] = Array.from({ length: 8 }, (_, i) => ({
  date: `2026-03-${String(10 + i).padStart(2, "0")}T10:00:00`,
  exercise: "Squat",
  reps: 5,
  weight: 100,
  volume: 500,
  workout: `Day ${i}`,
}));

const countItems = (params: { recentWorkoutsLimit?: number }) => {
  const container = createObsidianContainer();
  RecentWorkouts.render(container, logs, params);
  return container.querySelectorAll(".workout-recent-workout-item")
    .length;
};

describe("RecentWorkouts", () => {
  it("shows 5 workouts by default", () => {
    expect(countItems({})).toBe(5);
  });

  it("respects recentWorkoutsLimit", () => {
    expect(countItems({ recentWorkoutsLimit: 3 })).toBe(3);
  });
});
