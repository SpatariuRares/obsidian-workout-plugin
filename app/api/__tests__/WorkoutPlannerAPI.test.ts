import { CHART_DATA_TYPE } from "@app/features/charts";
import { WorkoutPlannerAPI } from "../WorkoutPlannerAPI";
import {
  WorkoutProtocol,
  WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";
import { TFolder } from "obsidian";

const createSettings = (): WorkoutChartsSettings => ({
  csvLogFilePath: "logs.csv",
  exerciseFolderPath: "exercises",
  defaultExercise: "",
  weightUnit: "kg",
  chartType: CHART_DATA_TYPE.VOLUME,
  dateRange: 30,
  showTrendLine: false,
  chartHeight: 300,
  defaultExactMatch: false,
  timerPresets: {},
  defaultTimerPreset: null,
  exerciseBlockTemplate: "",
  weightIncrement: 2.5,
  achievedTargets: {},
  customProtocols: [],
  setDuration: 45,
  showQuickLogRibbon: true,
  recentExercises: [],
  quickWeightIncrement: 2.5,
  repDuration: 5,
  defaultRepsPerSet: 0,
});

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

  it("reads exercises from folder and supports tag filtering", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([]),
    };

    const folder = new TFolder();
    folder.children = [
      {
        path: "exercises/bench.md",
        basename: "Bench Press",
        extension: "md",
      } as any,
      {
        path: "exercises/pushup.md",
        basename: "Push Up",
        extension: "md",
      } as any,
      {
        path: "exercises/squat.md",
        basename: "Squat",
        extension: "md",
      } as any,
      { name: "notes", extension: "txt" } as any,
    ];

    const app = {
      vault: {
        getAbstractFileByPath: jest.fn().mockReturnValue(folder),
        cachedRead: jest.fn((file: { path: string }) => {
          if (file.path.includes("bench")) {
            return Promise.resolve("---\ntags: [chest, compound]\n---");
          }
          if (file.path.includes("pushup")) {
            return Promise.resolve("---\ntags: chest\n---");
          }
          if (file.path.includes("squat")) {
            return Promise.resolve("---\ntags:\n  - legs\n  - compound\n---");
          }
          return Promise.resolve("");
        }),
      },
    } as any;

    const api = new WorkoutPlannerAPI(
      dataService as any,
      app,
      createSettings(),
    );

    const allExercises = await api.getExercises();
    expect(allExercises).toEqual(["Bench Press", "Push Up", "Squat"]);

    const filtered = await api.getExercises({ tag: "chest" });
    expect(filtered).toEqual(["Bench Press", "Push Up"]);
  });

  it("falls back to logs when folder is missing", async () => {
    const dataService = {
      getWorkoutLogData: jest.fn().mockResolvedValue([
        {
          date: "2026-01-10",
          exercise: "Deadlift",
          reps: 3,
          weight: 140,
          volume: 420,
        },
      ]),
    };

    const app = {
      vault: {
        getAbstractFileByPath: jest.fn().mockReturnValue(null),
      },
    } as any;

    const api = new WorkoutPlannerAPI(
      dataService as any,
      app,
      createSettings(),
    );

    const exercises = await api.getExercises();
    expect(exercises).toEqual(["Deadlift"]);
  });
});
