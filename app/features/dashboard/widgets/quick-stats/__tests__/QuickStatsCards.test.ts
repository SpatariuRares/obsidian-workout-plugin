/** @jest-environment jsdom */
// Time zone: Europe/Rome, pinned in jest.config.js

import { QuickStatsCards } from "@app/features/dashboard/widgets/quick-stats/QuickStatsCards";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

const set = (days: number, volume: number, workout: string): WorkoutLogData => ({
  date: daysAgo(days),
  exercise: "Squat",
  reps: 10,
  weight: volume / 10,
  volume,
  workout,
});

describe("QuickStatsCards", () => {
  it("compares week, month and year in one table, metrics as rows", () => {
    const container = createObsidianContainer();
    const data = [
      set(1, 1000, "Leg day"), // this week
      set(20, 3000, "Push day"), // this month
      set(200, 11000, "Pull day"), // this year
    ];

    QuickStatsCards.render(container, data, {});

    const table = container.querySelector("table.workout-quick-stats-table")!;
    const columns = [...table.querySelectorAll("thead th")].map((th) => th.textContent);
    expect(columns).toEqual([
      t("dashboard.quickStats.week"),
      t("dashboard.quickStats.month"),
      t("dashboard.quickStats.year"),
    ]);
    expect(table.querySelectorAll('thead th[scope="col"]')).toHaveLength(3);

    const rows = [...table.querySelectorAll("tbody tr")].map((tr) => ({
      label: tr.querySelector('th[scope="row"]')!.textContent,
      values: [...tr.querySelectorAll("td")].map((td) => td.textContent),
    }));
    expect(rows[0]).toEqual({
      label: t("dashboard.quickStats.workouts"),
      values: ["1", "2", "3"],
    });
    expect(rows[1].values).toEqual(["1,000", "4,000", "15,000"]);
    expect(rows[2].values).toEqual(["1,000", "2,000", "5,000"]);
  });
});
