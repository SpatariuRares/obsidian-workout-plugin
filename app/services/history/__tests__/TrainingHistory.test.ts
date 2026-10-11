import {
  TrainingHistory,
  trainingDay,
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
