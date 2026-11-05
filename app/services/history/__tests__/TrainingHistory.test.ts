import {
  TrainingHistory,
  sameWorkout,
  trainingDay,
  trendOf,
  workoutKey,
  workoutMatches,
} from "@app/services/history/TrainingHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";

// Tests run with TZ=Europe/Rome (jest.config.js): UTC+1 in winter.

/** A set logged at `iso` (UTC), as WorkoutLogFile reads it back. */
function set(
  iso: string,
  workout?: string,
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData {
  return logRow({
    date: iso,
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
    workout,
    timestamp: Date.parse(iso),
    ...overrides,
  });
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

describe("TrainingHistory.latestSessions", () => {
  it("should give the n most recent sessions, most recent first", () => {
    const history = new TrainingHistory([
      set("2024-01-15T17:00:00.000Z", "Push"),
      set("2024-01-17T17:00:00.000Z", "Legs"),
      set("2024-01-16T17:00:00.000Z", "Pull"),
    ]);

    expect(history.latestSessions(2).map((s) => s.workout)).toEqual([
      "Legs",
      "Pull",
    ]);
  });

  it("should order sessions of the same day by their first set", () => {
    const history = new TrainingHistory([
      set("2024-01-16T09:00:00.000Z", "Morning"),
      set("2024-01-16T17:00:00.000Z", "Evening"),
    ]);

    expect(history.latestSessions(5).map((s) => s.workout)).toEqual([
      "Evening",
      "Morning",
    ]);
  });

  it("should put a session whose date was edited on its new day", () => {
    // Moved to the 30th in the CSV, but it keeps the timestamp of the 20th
    const moved = set("2026-10-30T13:00:00Z", "Moved", {
      timestamp: Date.parse("2026-10-20T13:00:00Z"),
    });
    const history = new TrainingHistory([
      set("2026-10-29T13:00:00Z", "Before"),
      moved,
    ]);

    expect(history.latestSessions(1).map((s) => s.workout)).toEqual(["Moved"]);
    expect(history.sessions().map((s) => s.workout)).toEqual([
      "Before",
      "Moved",
    ]);
  });

  it("should take the latest of the sessions a filter keeps", () => {
    const history = new TrainingHistory([
      set("2024-01-15T17:00:00.000Z", "Push"),
      set("2024-01-16T17:00:00.000Z", undefined),
    ]);

    expect(
      history
        .latestSessions(1, (s) => s.workout !== undefined)
        .map((s) => s.workout),
    ).toEqual(["Push"]);
  });

  it("should give every session when there are fewer than n", () => {
    const history = new TrainingHistory([set("2024-01-15T17:00:00.000Z", "Push")]);

    expect(history.latestSessions(10)).toHaveLength(1);
    expect(history.latestSessions(0)).toEqual([]);
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

describe("TrainingHistory.perDay", () => {
  it("aggregates each training day's sets, days in the order they first appear", () => {
    const lift = (iso: string, volume: number) =>
      set(iso, "Push", { volume });
    const history = new TrainingHistory([
      lift("2024-01-08T17:00:00.000Z", 100),
      lift("2024-01-01T17:00:00.000Z", 10),
      // 23:30 UTC is 00:30 on the 9th in Rome
      lift("2024-01-08T23:30:00.000Z", 1000),
      lift("2024-01-08T18:00:00.000Z", 200),
    ]);

    const total = history.perDay((sets) =>
      sets.reduce((sum, s) => sum + s.volume, 0),
    );

    expect([...total]).toEqual([
      ["2024-01-08", 300],
      ["2024-01-01", 10],
      ["2024-01-09", 1000],
    ]);
  });
});

describe("TrainingHistory.streak", () => {
  // Wednesday 17 January 2024, local time
  const today = new Date(2024, 0, 17, 12, 0);
  const at = (iso: string) => set(iso, "Push");

  it("should count consecutive calendar weeks with a session, starting this week", () => {
    const history = new TrainingHistory([
      at("2024-01-15T17:00:00.000Z"), // Mon, this week
      at("2024-01-14T17:00:00.000Z"), // Sun, last week
      at("2024-01-03T17:00:00.000Z"), // Wed, two weeks ago
    ]);

    expect(history.streak(today)).toBe(3);
  });

  it("should not break while the current week has no session yet", () => {
    const history = new TrainingHistory([
      at("2024-01-10T17:00:00.000Z"),
      at("2024-01-03T17:00:00.000Z"),
    ]);

    expect(history.streak(today)).toBe(2);
  });

  it("should stop at the first week without a session", () => {
    const history = new TrainingHistory([
      at("2024-01-16T17:00:00.000Z"),
      at("2024-01-03T17:00:00.000Z"),
    ]);

    expect(history.streak(today)).toBe(1);
  });

  it("should start weeks on Monday in local time", () => {
    const history = new TrainingHistory([
      at("2024-01-14T23:30:00.000Z"), // Mon 00:30 in Rome: this week
      at("2024-01-07T12:00:00.000Z"), // Sun: two weeks ago
    ]);

    expect(history.streak(today)).toBe(1);
  });

  it("should be zero without sessions", () => {
    expect(new TrainingHistory([]).streak(today)).toBe(0);
  });

  it("should count only weeks with at least the weekly goal of training days", () => {
    const history = new TrainingHistory([
      at("2024-01-08T17:00:00.000Z"), // last week: Mon, Wed (and Wed again)
      at("2024-01-10T17:00:00.000Z"),
      set("2024-01-10T17:30:00.000Z", "Pull"),
      at("2024-01-01T17:00:00.000Z"), // two weeks ago: one day only
      at("2023-12-26T17:00:00.000Z"), // three weeks ago: two days
      at("2023-12-27T17:00:00.000Z"),
    ]);

    expect(history.streak(today, 2)).toBe(1);
  });

  it("should not break while the current week is still short of the goal", () => {
    const history = new TrainingHistory([
      at("2024-01-15T17:00:00.000Z"), // this week: one day so far
      at("2024-01-08T17:00:00.000Z"),
      at("2024-01-09T17:00:00.000Z"),
    ]);

    expect(history.streak(today, 2)).toBe(1);
  });
});

describe("TrainingHistory.weekProgress", () => {
  // Wednesday 17 January 2024, local time
  const today = new Date(2024, 0, 17, 12, 0);
  const at = (iso: string) => set(iso, "Push");

  it("should count this week's training days up to today against the goal", () => {
    const history = new TrainingHistory([
      at("2024-01-14T17:00:00.000Z"), // last Sunday
      at("2024-01-15T17:00:00.000Z"),
      set("2024-01-15T18:00:00.000Z", "Pull"), // same day
      at("2024-01-17T08:00:00.000Z"),
      at("2024-01-19T17:00:00.000Z"), // Friday: not trained yet
    ]);

    expect(history.weekProgress(today, 2)).toEqual({
      days: 2,
      goal: 2,
      met: true,
    });
    expect(history.weekProgress(today, 3).met).toBe(false);
  });

  it("should treat a goal below one as one", () => {
    expect(new TrainingHistory([]).weekProgress(today, 0)).toEqual({
      days: 0,
      goal: 1,
      met: false,
    });
  });
});

describe("TrainingHistory.bestStreak", () => {
  const at = (iso: string) => set(iso, "Push");

  it("should give the longest run of weeks that met the goal, wherever it is", () => {
    const history = new TrainingHistory([
      // Three weeks in a row in 2023 with two days each
      at("2023-03-06T17:00:00.000Z"),
      at("2023-03-08T17:00:00.000Z"),
      at("2023-03-13T17:00:00.000Z"),
      at("2023-03-15T17:00:00.000Z"),
      at("2023-03-20T17:00:00.000Z"),
      at("2023-03-22T17:00:00.000Z"),
      // Then one week with a single day, then a week with two
      at("2023-03-27T17:00:00.000Z"),
      at("2023-04-03T17:00:00.000Z"),
      at("2023-04-05T17:00:00.000Z"),
    ]);

    expect(history.bestStreak(2)).toBe(3);
    expect(history.bestStreak()).toBe(5);
  });

  it("should be zero when no week met the goal", () => {
    const history = new TrainingHistory([at("2024-01-15T17:00:00.000Z")]);

    expect(history.bestStreak(3)).toBe(0);
    expect(new TrainingHistory([]).bestStreak()).toBe(0);
  });
});

describe("TrainingHistory volume", () => {
  const lift = (iso: string, exercise: string, volume: number) =>
    set(iso, "Push", { exercise, volume });

  it("should total the volume of every set", () => {
    const history = new TrainingHistory([
      lift("2024-01-15T17:00:00.000Z", "Squat", 500),
      lift("2024-01-16T17:00:00.000Z", "Bench", 300),
    ]);

    expect(history.totalVolume()).toBe(800);
  });

  it("should sum volume per training day", () => {
    const history = new TrainingHistory([
      lift("2024-01-15T17:00:00.000Z", "Squat", 500),
      lift("2024-01-15T23:30:00.000Z", "Squat", 300), // 16 Jan in Rome
    ]);

    expect(history.volumeByDay()).toEqual(
      new Map([
        ["2024-01-15", 500],
        ["2024-01-16", 300],
      ]),
    );
  });

  it("should rank exercises by volume, matching names ignoring case and spacing", () => {
    const history = new TrainingHistory([
      lift("2024-01-15T17:00:00.000Z", "Squat", 500),
      lift("2024-01-15T17:10:00.000Z", " squat", 400),
      lift("2024-01-15T17:20:00.000Z", "Bench", 600),
      lift("2024-01-15T17:30:00.000Z", "Curl", 100),
    ]);

    expect(history.topExercisesByVolume(2)).toEqual([
      ["Squat", 900],
      ["Bench", 600],
    ]);
  });
});

describe("lastSet before a day", () => {
  it("skips the sets of that day and later", () => {
    const history = new TrainingHistory([
      set("2026-10-30T10:00:00Z", undefined, { weight: 90 }),
      set("2026-11-02T10:00:00Z", undefined, { weight: 105 }),
    ]);

    expect(history.lastSet("Squat")?.weight).toBe(105);
    expect(history.lastSet("Squat", { before: "2026-11-02" })?.weight).toBe(90);
    expect(history.lastSet("Squat", { before: "2026-10-30" })).toBeUndefined();
  });
});

describe("sameWorkout", () => {
  it("ignores case, spacing and surrounding quotes", () => {
    expect(sameWorkout('"Leg  Day"', "leg day")).toBe(true);
    expect(sameWorkout("Leg Day", "Push Day")).toBe(false);
  });

  it("ignores wiki-link brackets", () => {
    expect(sameWorkout("[[Push Day]]", "Push Day")).toBe(true);
  });
});

describe("workoutKey", () => {
  it("strips wiki-link brackets, quotes, case and spacing", () => {
    expect(workoutKey(' "[[Push   Day]]" ')).toBe("push day");
    expect(workoutKey("'Leg Day'")).toBe("leg day");
    expect(workoutKey(undefined)).toBe("");
  });
});

describe("workoutMatches", () => {
  it("matches a set whose workout contains the filter", () => {
    expect(workoutMatches("[[Push Day]]", "Push Day")).toBe(true);
    expect(workoutMatches("push", "[[Push Day A]]")).toBe(true);
    expect(workoutMatches("Push Day A", "Push Day")).toBe(false);
    expect(workoutMatches("Push Day", "Pull Day")).toBe(false);
  });

  it("matches everything when the filter is empty", () => {
    expect(workoutMatches("", "Push Day")).toBe(true);
    expect(workoutMatches(undefined, undefined)).toBe(true);
  });

  it("never matches a set without a workout when the filter names one", () => {
    expect(workoutMatches("Push Day", undefined)).toBe(false);
  });
});

describe("set order", () => {
  // A set whose day was changed in the CSV keeps its old timestamp
  const moved = set("2026-10-30T13:00:00Z", undefined, {
    weight: 105,
    timestamp: Date.parse("2026-10-20T13:00:00Z"),
  });
  const earlier = set("2026-10-29T13:00:00Z", undefined, { weight: 82.5 });

  it("follows the training day before the timestamp", () => {
    const history = new TrainingHistory([earlier, moved]);

    expect(history.lastSet("Squat")?.weight).toBe(105);
  });

  it("orders sets of the same day by timestamp", () => {
    const first = set("2026-10-30T09:00:00Z", undefined, { weight: 90 });
    const second = set("2026-10-30T10:00:00Z", undefined, { weight: 95 });

    expect(new TrainingHistory([second, first]).lastSet("Squat")?.weight).toBe(95);
  });

  it("measures a record against the days before it", () => {
    // Done on a later day, but with an older timestamp than the new set
    const later = set("2026-11-01T13:00:00Z", undefined, {
      weight: 110,
      timestamp: Date.parse("2026-10-15T13:00:00Z"),
    });
    const history = new TrainingHistory([earlier, later]);

    expect(
      history.recordIncrease(set("2026-10-30T13:00:00Z", undefined, { weight: 105 })),
    ).toBe(22.5);
  });
});

describe("setsOf", () => {
  it("gives every set of the exercise in set order, ignoring case and spacing", () => {
    const history = new TrainingHistory([
      set("2026-11-02T10:00:00Z", "A", { weight: 105 }),
      set("2026-10-30T10:00:00Z", "B", { weight: 90, exercise: " squat " }),
      set("2026-10-31T10:00:00Z", "A", { exercise: "Bench" }),
    ]);

    expect(history.setsOf("SQUAT").map((s) => s.weight)).toEqual([90, 105]);
  });
});

describe("setsOn", () => {
  it("gives the exercise's sets of that day in set order, optionally one workout's", () => {
    const history = new TrainingHistory([
      set("2026-11-02T10:10:00Z", "Leg Day", { weight: 110 }),
      set("2026-11-02T10:00:00Z", "Leg Day", { weight: 100 }),
      set("2026-11-02T18:00:00Z", "Evening", { weight: 60 }),
      set("2026-11-01T10:00:00Z", "Leg Day", { weight: 90 }),
      set("2026-11-02T10:05:00Z", "Leg Day", { exercise: "Bench" }),
    ]);

    expect(history.setsOn("squat", "2026-11-02").map((s) => s.weight)).toEqual([
      100, 110, 60,
    ]);
    expect(
      history
        .setsOn("Squat", "2026-11-02", { workout: "leg  day" })
        .map((s) => s.weight),
    ).toEqual([100, 110]);
  });
});

describe("previousDay", () => {
  it("gives the last earlier day with the exercise and all its sets", () => {
    const history = new TrainingHistory([
      set("2026-10-28T10:00:00Z", "A", { weight: 80 }),
      set("2026-10-30T10:00:00Z", "A", { weight: 90 }),
      set("2026-10-30T10:05:00Z", "B", { weight: 95 }),
      set("2026-11-02T10:00:00Z", "A", { weight: 105 }),
    ]);

    expect(history.previousDay("Squat", "2026-11-02")).toEqual({
      day: "2026-10-30",
      sets: [expect.objectContaining({ weight: 90 }), expect.objectContaining({ weight: 95 })],
    });
    expect(history.previousDay("Squat", "2026-10-28")).toBeUndefined();
  });
});
