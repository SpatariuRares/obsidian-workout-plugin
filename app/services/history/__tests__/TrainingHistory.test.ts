import {
  TrainingHistory,
  trainingDay,
  trendOf,
} from "@app/services/history/TrainingHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

// Tests run with TZ=Europe/Rome (jest.config.js): UTC+1 in winter.

/** A set logged at `iso` (UTC), as WorkoutLogFile reads it back. */
function set(
  iso: string,
  workout?: string,
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData {
  return {
    date: iso,
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
    workout,
    timestamp: Date.parse(iso),
    ...overrides,
  };
}

const minutesLater = (iso: string, minutes: number) =>
  new Date(Date.parse(iso) + minutes * 60_000).toISOString();

describe("trainingDay", () => {
  it("should use the local day, not the UTC day", () => {
    // 00:30 in Rome on 16 Jan is still 15 Jan in UTC
    expect(trainingDay("2024-01-15T23:30:00.000Z")).toBe("2024-01-16");
  });

  it("should keep a date-only value on its own day", () => {
    expect(trainingDay("2024-01-15")).toBe("2024-01-15");
  });
});

describe("TrainingHistory.sessions", () => {
  it("should group sets of one workout on one training day into one session", () => {
    const start = "2024-01-15T17:00:00.000Z";
    const history = new TrainingHistory([
      set(start, "Push"),
      set(minutesLater(start, 3), "Push"),
      set(minutesLater(start, 6), "Push"),
    ]);

    const sessions = history.sessions();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].day).toBe("2024-01-15");
    expect(sessions[0].workout).toBe("Push");
    expect(sessions[0].sets).toHaveLength(3);
  });

  it("should put a set logged just after local midnight on the next training day", () => {
    const history = new TrainingHistory([
      set("2024-01-15T22:50:00.000Z", "Push"), // 23:50 Rome
      set("2024-01-15T23:10:00.000Z", "Push"), // 00:10 Rome, next day
    ]);

    expect(history.sessions().map((s) => s.day)).toEqual([
      "2024-01-15",
      "2024-01-16",
    ]);
  });

  it("should match workout names ignoring case, spacing and stray quotes", () => {
    const start = "2024-01-15T17:00:00.000Z";
    const history = new TrainingHistory([
      set(start, "Push Day"),
      set(minutesLater(start, 3), " push  day "),
      set(minutesLater(start, 6), '"Push Day"'),
    ]);

    const sessions = history.sessions();

    expect(sessions).toHaveLength(1);
    expect(sessions[0].workout).toBe("Push Day");
  });

  it("should keep sets without a workout in their own unnamed session", () => {
    const start = "2024-01-15T17:00:00.000Z";
    const history = new TrainingHistory([
      set(start, undefined),
      set(minutesLater(start, 3), ""),
      set(minutesLater(start, 6), "default"),
    ]);

    const sessions = history.sessions();

    expect(sessions).toHaveLength(2);
    const unnamed = sessions.find((s) => s.workout === undefined);
    expect(unnamed?.sets).toHaveLength(2);
  });

  it("should list sessions in the order they started", () => {
    const history = new TrainingHistory([
      set("2024-01-16T17:00:00.000Z", "Pull"),
      set("2024-01-15T17:00:00.000Z", "Push"),
      set("2024-01-16T09:00:00.000Z", "Legs"),
    ]);

    expect(history.sessions().map((s) => s.workout)).toEqual([
      "Push",
      "Legs",
      "Pull",
    ]);
  });

  it("should return only the sessions of the named workout", () => {
    const history = new TrainingHistory([
      set("2024-01-15T17:00:00.000Z", "Push"),
      set("2024-01-16T17:00:00.000Z", "Pull"),
    ]);

    const sessions = history.sessions({ workout: "push" });

    expect(sessions.map((s) => s.workout)).toEqual(["Push"]);
  });
});

describe("Session duration", () => {
  const start = "2024-01-15T17:00:00.000Z";
  const durationOf = (sets: WorkoutLogData[]) =>
    new TrainingHistory(sets).sessions()[0].duration;

  it("should be the time from the first set to the last, in seconds", () => {
    expect(
      durationOf([
        set(minutesLater(start, 40), "Push"),
        set(start, "Push"),
        set(minutesLater(start, 20), "Push"),
      ]),
    ).toBe(2400);
  });

  it("should be undefined with a single set", () => {
    expect(durationOf([set(start, "Push")])).toBeUndefined();
  });

  it("should be undefined when shorter than 5 minutes", () => {
    expect(
      durationOf([set(start, "Push"), set(minutesLater(start, 4), "Push")]),
    ).toBeUndefined();
  });

  it("should be undefined when longer than 5 hours", () => {
    expect(
      durationOf([set(start, "Push"), set(minutesLater(start, 301), "Push")]),
    ).toBeUndefined();
  });

  it("should ignore sets without a timestamp", () => {
    expect(
      durationOf([
        set(start, "Push"),
        set(minutesLater(start, 30), "Push"),
        set(minutesLater(start, 90), "Push", { timestamp: undefined }),
      ]),
    ).toBe(1800);
  });
});

describe("TrainingHistory.personalRecord", () => {
  const lift = (iso: string, exercise: string, weight: number, reps = 5) =>
    set(iso, "Push", { exercise, weight, reps, volume: weight * reps });

  it("should be the heaviest set of the exercise", () => {
    const history = new TrainingHistory([
      lift("2024-01-01T17:00:00.000Z", "Bench", 80),
      lift("2024-01-08T17:00:00.000Z", "Bench", 90),
      lift("2024-01-15T17:00:00.000Z", "Bench", 85),
    ]);

    expect(history.personalRecord("Bench")).toMatchObject({
      weight: 90,
      reps: 5,
      day: "2024-01-08",
    });
  });

  it("should prefer the set with most reps when the weight ties, then the earliest", () => {
    const history = new TrainingHistory([
      lift("2024-01-01T17:00:00.000Z", "Bench", 100, 5),
      lift("2024-01-08T17:00:00.000Z", "Bench", 100, 8),
      lift("2024-01-15T17:00:00.000Z", "Bench", 100, 8),
    ]);

    expect(history.personalRecord("Bench")).toMatchObject({
      reps: 8,
      day: "2024-01-08",
    });
  });

  it("should match the exercise name ignoring case and spacing", () => {
    const history = new TrainingHistory([
      lift("2024-01-01T17:00:00.000Z", " bench  press", 80),
    ]);

    expect(history.personalRecord("Bench Press")?.weight).toBe(80);
  });

  it("should be undefined for an exercise logged without weight", () => {
    const history = new TrainingHistory([
      lift("2024-01-01T17:00:00.000Z", "Pull up", 0, 10),
    ]);

    expect(history.personalRecord("Pull up")).toBeUndefined();
  });

  it("should date the record by its training day", () => {
    const history = new TrainingHistory([
      lift("2024-01-15T23:30:00.000Z", "Bench", 80),
    ]);

    expect(history.personalRecord("Bench")?.day).toBe("2024-01-16");
  });
});

describe("TrainingHistory.newRecordSets", () => {
  const lift = (iso: string, exercise: string, weight: number) =>
    set(iso, "Push", { exercise, weight, volume: weight * 5 });

  it("should list sets strictly heavier than every earlier set of the exercise", () => {
    const first = lift("2024-01-01T17:00:00.000Z", "Bench", 80);
    const heavier = lift("2024-01-08T17:00:00.000Z", "Bench", 90);
    const tie = lift("2024-01-15T17:00:00.000Z", "Bench", 90);

    expect(new TrainingHistory([tie, first, heavier]).newRecordSets()).toEqual([
      heavier,
    ]);
  });

  it("should not count the first weighted set after bodyweight-only sets", () => {
    const sets = [
      lift("2024-01-01T17:00:00.000Z", "Dip", 0),
      lift("2024-01-08T17:00:00.000Z", "Dip", 10),
    ];

    expect(new TrainingHistory(sets).newRecordSets()).toEqual([]);
  });
});

describe("trendOf", () => {
  it("should be undefined with fewer than two values", () => {
    expect(trendOf([100])).toBeUndefined();
  });

  it("should read the direction from the regression line, not the first and last value", () => {
    // Last value is below the first, but the fitted line rises by more than 5% of the mean
    const trend = trendOf([100, 150, 160, 170, 99]);

    expect(trend?.direction).toBe("up");
    expect(trend?.start).toBeCloseTo(132.2);
    expect(trend?.end).toBeCloseTo(139.4);
    expect(trend?.percentChange).toBeCloseTo(5.45, 1);
  });

  it("should be stable when the line moves less than 5% of the mean", () => {
    expect(trendOf([100, 102, 101, 103])?.direction).toBe("stable");
  });

  it("should be down when the line falls more than 5% of the mean", () => {
    expect(trendOf([130, 120, 110, 100])?.direction).toBe("down");
  });

  it("should leave the percentage undefined when the line starts at zero", () => {
    expect(trendOf([0, 10])?.percentChange).toBeUndefined();
  });
});

describe("TrainingHistory.heaviestPerDay", () => {
  it("should give the heaviest set of each training day, oldest first", () => {
    const lift = (iso: string, exercise: string, weight: number) =>
      set(iso, "Push", { exercise, weight });
    const history = new TrainingHistory([
      lift("2024-01-08T17:00:00.000Z", "Bench", 40),
      lift("2024-01-08T17:10:00.000Z", "Bench", 90),
      lift("2024-01-01T17:00:00.000Z", "bench", 80),
      lift("2024-01-01T17:00:00.000Z", "Squat", 140),
    ]);

    expect(history.heaviestPerDay("Bench")).toEqual([80, 90]);
  });
});
