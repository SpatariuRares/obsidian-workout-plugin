import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { WorkoutPlannerAPI } from "../WorkoutPlannerAPI";
import {
  WorkoutProtocol,
} from "@app/types/WorkoutLogData";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";

describe("WorkoutPlannerAPI", () => {
  it("maps workout logs with defaults and applies filters", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        {
          date: "2026-01-10",
          exercise: "Squat",
          reps: 5,
          weight: 100,
          volume: 500,
          origine: "Leg Day",
        },
        {
          date: "2026-01-31",
          exercise: "Bench",
          reps: 8,
          weight: 80,
          volume: 640,
          workout: "Push",
          notes: "ok",
          timestamp: 123,
          protocol: WorkoutProtocol.DROP_SET,
        },
        {
          date: "not-a-date",
          exercise: "Row",
          reps: 10,
          weight: 60,
          volume: 600,
        },
      ]),
    };

    const api = new WorkoutPlannerAPI(dataService as any);

    const logs = await api.getWorkoutLogs({
      dateRange: { start: "2026-01-01", end: "2026-01-31" },
      protocol: "DROP_SET",
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].exercise).toBe("Bench");
    expect(logs[0].workout).toBe("Push");
    expect(logs[0].notes).toBe("ok");
    expect(logs[0].timestamp).toBe(123);
  });

  it("keeps weight in the settings unit and adds what was entered", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        {
          date: "2026-01-10",
          exercise: "Squat",
          reps: 5,
          weight: 102.06,
          volume: 510.3,
          enteredWeight: 225,
          enteredUnit: "lb",
        },
      ]),
    };

    const api = new WorkoutPlannerAPI(dataService as any);
    const [log] = await api.getWorkoutLogs();

    expect(log.weight).toBe(102.06);
    expect(log.volume).toBe(510.3);
    expect(log.enteredWeight).toBe(225);
    expect(log.enteredUnit).toBe("lb");
  });

  it("defaults missing fields when mapping workout logs", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        {
          date: "2026-01-10",
          exercise: "Squat",
          reps: 5,
          weight: 100,
          volume: 500,
          origine: "Leg Day",
        },
      ]),
    };

    const api = new WorkoutPlannerAPI(dataService as any);
    const logs = await api.getWorkoutLogs();

    expect(logs).toHaveLength(1);
    expect(logs[0].workout).toBe("Leg Day");
    expect(logs[0].notes).toBe("");
    expect(logs[0].timestamp).toBe(0);
    expect(logs[0].protocol).toBe(WorkoutProtocol.STANDARD);
  });

  it("returns default exercise stats when no logs exist", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([]),
    };

    const api = new WorkoutPlannerAPI(dataService as any);
    const stats = await api.getExerciseStats("Bench Press");

    expect(stats.totalVolume).toBe(0);
    expect(stats.maxWeight).toBe(0);
    expect(stats.totalSets).toBe(0);
    expect(stats.trend).toBe("stable");
    expect(stats.lastWorkoutDate).toBeNull();
  });

  it("computes exercise stats and trend from logs", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

    try {
      const dataService = {
        getWorkoutLogData: jest.fn().mockResolvedValue([
          {
            date: "2026-01-20T10:00:00.000Z",
            exercise: "Bench Press",
            reps: 5,
            weight: 120,
            volume: 600,
          },
          {
            date: "2026-01-10T10:00:00.000Z",
            exercise: "Bench Press",
            reps: 6,
            weight: 110,
            volume: 660,
          },
          {
            date: "2025-12-15T10:00:00.000Z",
            exercise: "Bench Press",
            reps: 8,
            weight: 90,
            volume: 720,
          },
          {
            date: "2025-12-01T10:00:00.000Z",
            exercise: "Bench Press",
            reps: 7,
            weight: 100,
            volume: 700,
          },
        ]),
      };

      const api = new WorkoutPlannerAPI(dataService as any);
      const stats = await api.getExerciseStats("Bench Press");

      expect(stats.totalVolume).toBe(2680);
      expect(stats.maxWeight).toBe(120);
      expect(stats.totalSets).toBe(4);
      expect(stats.averageWeight).toBe(105);
      expect(stats.averageReps).toBe(6.5);
      expect(stats.lastWorkoutDate).toBe("2026-01-20");
      expect(stats.prWeight).toBe(120);
      expect(stats.prReps).toBe(5);
      expect(stats.prDate).toBe("2026-01-20");
      expect(stats.trend).toBe("up");
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports the PR set with most reps when the top weight ties, on its local day", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        { date: "2026-01-10T17:00:00.000Z", exercise: "Bench Press", reps: 5, weight: 100, volume: 500 },
        // 00:30 in Rome on 21 Jan
        { date: "2026-01-20T23:30:00.000Z", exercise: "Bench Press", reps: 8, weight: 100, volume: 800 },
      ]),
    };

    const stats = await new WorkoutPlannerAPI(dataService as any).getExerciseStats("Bench Press");

    expect(stats.prWeight).toBe(100);
    expect(stats.prReps).toBe(8);
    expect(stats.prDate).toBe("2026-01-21");
    expect(stats.lastWorkoutDate).toBe("2026-01-21");
  });

  it("reads the trend from the heaviest set of each day, ignoring light warm-up sets", async () => {
    const lift = (date: string, weight: number) => ({
      date, exercise: "Bench Press", reps: 5, weight, volume: weight * 5,
    });
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        lift("2025-11-01T17:00:00.000Z", 100),
        lift("2026-01-10T17:00:00.000Z", 40),
        lift("2026-01-10T17:10:00.000Z", 110),
        lift("2026-01-20T17:00:00.000Z", 40),
        lift("2026-01-20T17:10:00.000Z", 120),
      ]),
    };

    const stats = await new WorkoutPlannerAPI(dataService as any).getExerciseStats("Bench Press");

    expect(stats.trend).toBe("up");
  });

  it("returns unique sorted exercises when no app is provided", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        {
          date: "2026-01-10",
          exercise: "Squat",
          reps: 5,
          weight: 100,
          volume: 500,
        },
        {
          date: "2026-01-11",
          exercise: "Bench Press",
          reps: 8,
          weight: 80,
          volume: 640,
        },
        {
          date: "2026-01-12",
          exercise: "Squat",
          reps: 6,
          weight: 110,
          volume: 660,
        },
      ]),
    };

    const api = new WorkoutPlannerAPI(dataService as any);
    const exercises = await api.getExercises();

    expect(exercises).toEqual(["Bench Press", "Squat"]);
  });

  describe("getExercises from exercise pages", () => {
    const noLogs = { getWorkoutLogData: jest.fn().mockResolvedValue([]) };
    const withPages = (
      notes: ConstructorParameters<typeof FakeVault>[0],
      logs: unknown[] = [],
    ) => {
      const vault = new FakeVault(notes);
      const library = new ExerciseLibrary(vault.app as never, {
        exerciseFolderPath: "exercises",
      });
      return new WorkoutPlannerAPI(
        { getWorkoutLogData: jest.fn().mockResolvedValue(logs) },
        library,
      );
    };

    it("lists the file names of the exercise pages, subfolders included", async () => {
      const api = withPages({
        "exercises/Squat.md": {},
        "exercises/QA/Push Up.md": {},
        "exercises/Bench Press.md": { exercise_name: "Bench press (barbell)" },
        "notes/Other.md": {},
      });

      expect(await api.getExercises()).toEqual(["Bench Press", "Push Up", "Squat"]);
    });

    it("keeps the pages with the tag, however the tags are written", async () => {
      const api = withPages({
        "exercises/Bench Press.md": { tags: ["chest", "compound"] },
        "exercises/QA/Push Up.md": { tags: "#Chest" },
        "exercises/Squat.md": { tags: "legs, compound" },
      });

      expect(await api.getExercises({ tag: "chest" })).toEqual(["Bench Press", "Push Up"]);
      expect(await api.getExercises({ tag: "COMPOUND" })).toEqual(["Bench Press", "Squat"]);
    });

    it("lists a file name once when two pages share it", async () => {
      const api = withPages({
        "exercises/A/Squat.md": {},
        "exercises/B/Squat.md": {},
      });

      expect(await api.getExercises()).toEqual(["Squat"]);
    });

    it("falls back to the exercises in the log when there are no pages", async () => {
      const api = withPages({ "notes/Squat.md": { tags: ["legs"] } }, [
        { date: "2026-01-10", exercise: "Deadlift", reps: 3, weight: 140, volume: 420 },
        { date: "2026-01-11", exercise: "Squat", reps: 3, weight: 140, volume: 420 },
      ]);

      expect(await api.getExercises()).toEqual(["Deadlift", "Squat"]);
      // Without pages there are no tags to match: empty, never unfiltered
      expect(await api.getExercises({ tag: "legs" })).toEqual([]);
    });

    it("falls back to the log without a library", async () => {
      const api = new WorkoutPlannerAPI(noLogs);

      expect(await api.getExercises({ tag: "chest" })).toEqual([]);
    });
  });
});
