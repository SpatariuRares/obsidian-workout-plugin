import { calculateSummaryMetrics } from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

let clock = 0;
function set(day: string, exercise: string, weight: number): WorkoutLogData {
  clock += 1;
  return {
    date: `2026-${day}T10:00:00.000Z`,
    exercise,
    reps: 5,
    weight,
    volume: weight * 5,
    timestamp: clock,
  };
}

/** Personal records in `period`, judged against everything in `history` */
function records(period: WorkoutLogData[], history: WorkoutLogData[]): number {
  return calculateSummaryMetrics(period, history).personalRecords;
}

describe("personal records in the summary", () => {
  const before = [
    set("01-10", "Squat", 100),
    set("01-10", "Bench", 80),
    set("01-12", "Deadlift", 140),
  ];

  it("counts exercises where a set in the period beat every earlier set", () => {
    const period = [
      set("03-01", "Squat", 105), // record
      set("03-01", "Bench", 80), // ties the best: not a record
      set("03-02", "Deadlift", 130), // below the best
    ];

    expect(records(period, [...before, ...period])).toBe(1);
  });

  it("counts an exercise once even with several records", () => {
    const period = [set("03-01", "Squat", 105), set("03-08", "Squat", 110)];

    expect(records(period, [...before, ...period])).toBe(1);
  });

  it("judges each set against all earlier sets, inside the period too", () => {
    // 120 then 110: only the first beat what came before it
    const period = [set("03-01", "Bench", 120), set("03-08", "Bench", 110)];

    expect(records(period, [...before, ...period])).toBe(1);
  });

  it("doesn't count an exercise done for the first time, or bodyweight work", () => {
    const period = [set("03-01", "Pull up", 0), set("03-01", "Pull up", 0), set("03-02", "Row", 60)];

    expect(records(period, [...before, ...period])).toBe(0);
  });

  it("doesn't count the first weighted set after bodyweight-only sets", () => {
    const period = [set("03-01", "Dip", 0), set("03-08", "Dip", 10)];

    expect(records(period, [...before, ...period])).toBe(0);
  });

  it("matches exercise names ignoring case and spaces", () => {
    const period = [set("03-01", " squat ", 105)];

    expect(records(period, [...before, ...period])).toBe(1);
  });

  it("orders sets by timestamp, not by their position in the file", () => {
    const later = set("03-01", "Squat", 105);
    const earlier = { ...set("01-01", "Squat", 110), timestamp: 0 };

    // The 110 came first, so 105 is not a record
    expect(records([later], [later, earlier])).toBe(0);
  });

  it("with no separate history, counts exercises improved within the data", () => {
    const all = [...before, set("03-01", "Squat", 105)];

    expect(calculateSummaryMetrics(all).personalRecords).toBe(1);
  });
});
