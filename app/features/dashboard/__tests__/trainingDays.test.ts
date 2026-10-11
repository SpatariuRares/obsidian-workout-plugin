import { calculatePeriodStats } from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import { getRecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/business/getRecentWorkouts";
import { calculateSummaryMetrics } from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import { prepareVolumeTrendData } from "@app/features/dashboard/widgets/volume-analytics/business/volumeAnalyticsData";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

// The dashboard counts sessions and days the way CONTEXT.md defines them:
// local training days, sessions keyed by day + workout name.
// Tests run with TZ=Europe/Rome (UTC+1 in winter).

function set(date: Date | string, workout?: string): WorkoutLogData {
  const d = new Date(date);
  return {
    date: d.toISOString(),
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
    workout,
    timestamp: d.getTime(),
  };
}

const ALL_TIME = 100_000;

describe("dashboard training days and sessions", () => {
  it("should count sets either side of local midnight as two workouts", () => {
    const data = [
      set("2024-01-15T22:50:00.000Z", "Push"), // 23:50 Rome, 15 Jan
      set("2024-01-15T23:10:00.000Z", "Push"), // 00:10 Rome, 16 Jan
    ];

    expect(calculatePeriodStats(data, ALL_TIME).workouts).toBe(2);
  });

  it("should count one workout when names differ only in case and spacing", () => {
    const data = [
      set("2024-01-15T17:00:00.000Z", "Push Day"),
      set("2024-01-15T17:10:00.000Z", "push  day"),
    ];

    expect(calculateSummaryMetrics(data).totalWorkouts).toBe(1);
  });

  it("should date recent workouts by their local training day", () => {
    const [recent] = getRecentWorkouts(
      [set("2024-01-15T23:10:00.000Z", "Push")],
      5,
    );

    expect(recent.date).toBe("2024-01-16");
  });

  it("should keep sets without a workout apart from a workout named default", () => {
    const recent = getRecentWorkouts(
      [
        set("2024-01-15T17:00:00.000Z", undefined),
        set("2024-01-15T17:10:00.000Z", "default"),
      ],
      5,
    );

    expect(recent).toHaveLength(2);
  });

  it("should put a set logged at 00:30 today on today's volume bar", () => {
    const justAfterMidnight = new Date();
    justAfterMidnight.setHours(0, 30, 0, 0);

    const trend = prepareVolumeTrendData([set(justAfterMidnight)], 7);

    expect(trend.data[trend.data.length - 1]).toBe(500);
  });

  it("should keep the streak while this week has no workout yet", () => {
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      d.setHours(12, 0, 0, 0);
      return d;
    };

    const metrics = calculateSummaryMetrics([
      set(daysAgo(7), "Push"),
      set(daysAgo(14), "Push"),
    ]);

    expect(metrics.currentStreak).toBe(2);
  });
});
