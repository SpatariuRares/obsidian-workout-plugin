import {
  ExerciseConversionService,
  type FieldMapping,
} from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import {
  EXERCISE_TYPE_IDS,
  getExerciseTypeById,
} from "@app/constants/exerciseTypes.constants";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type {
  WorkoutChartsSettings,
  WorkoutLogData,
} from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import { WorkoutLogFile } from "@app/services/data/WorkoutLogFile";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { InMemoryLogStorage } from "@app/services/data/__tests__/InMemoryLogStorage";
import { parseCsv } from "@app/utils/data/CsvCodec";

const type = (id: string) => getExerciseTypeById(id)!;

const mapping = (from: string, to: string): FieldMapping => ({
  fromField: from,
  toField: to,
  fromLabel: from,
  toLabel: to,
});

const makeLog = (overrides: Partial<WorkoutLogData> = {}) =>
  logRow({
    date: "2024-01-01",
    exercise: "Plank",
    reps: 0,
    weight: 0,
    volume: 0,
    ...overrides,
  });

/** A type the user made in Settings → Exercise types */
const CLIMBING = {
  id: "climbing",
  name: "Rock climbing",
  parameters: [
    {
      key: "grade",
      label: "Grade",
      type: "number" as const,
      required: true,
    },
    {
      key: "duration",
      label: "Duration",
      type: "number" as const,
      unit: "sec",
      required: false,
    },
  ],
};

describe("ExerciseConversionService", () => {
  let logs: WorkoutLogData[];
  let plugin: {
    settings: Pick<WorkoutChartsSettings, "exerciseTypes">;
    getWorkoutLogData: jest.Mock;
    updateWorkoutLogEntry: jest.Mock;
    batchOperation: jest.Mock;
    getExerciseDefinitionService: jest.Mock;
  };
  let definitionService: {
    getParametersForExercise: jest.Mock;
    getExerciseDefinition: jest.Mock;
    saveExerciseDefinition: jest.Mock;
  };
  let service: ExerciseConversionService;

  beforeEach(() => {
    logs = [];
    definitionService = {
      getParametersForExercise: jest.fn(async () => []),
      getExerciseDefinition: jest.fn(),
      saveExerciseDefinition: jest.fn().mockResolvedValue(undefined),
    };
    plugin = {
      settings: { exerciseTypes: [CLIMBING] },
      getWorkoutLogData: jest.fn(async () => logs),
      updateWorkoutLogEntry: jest.fn().mockResolvedValue(undefined),
      batchOperation: jest.fn(
        async (_op: string, fn: () => Promise<void>) => fn(),
      ),
      getExerciseDefinitionService: jest.fn(() => definitionService),
    };
    service = new ExerciseConversionService(
      plugin as unknown as WorkoutPluginContext,
    );
  });

  describe("suggestInitialMappings", () => {
    it("should suggest reps to duration when converting strength to timed", () => {
      expect(
        service.suggestInitialMappings(
          type(EXERCISE_TYPE_IDS.STRENGTH),
          type(EXERCISE_TYPE_IDS.TIMED),
        ),
      ).toEqual([{ from: "reps", to: "duration" }]);
    });

    it("should suggest duration to reps when converting timed to strength", () => {
      expect(
        service.suggestInitialMappings(
          type(EXERCISE_TYPE_IDS.TIMED),
          type(EXERCISE_TYPE_IDS.STRENGTH),
        ),
      ).toEqual([{ from: "duration", to: "reps" }]);
    });

    it("should return no suggestions when the type pair has no smart default", () => {
      expect(
        service.suggestInitialMappings(
          type(EXERCISE_TYPE_IDS.CARDIO),
          type(EXERCISE_TYPE_IDS.DISTANCE),
        ),
      ).toEqual([]);
      expect(
        service.suggestInitialMappings(
          type(EXERCISE_TYPE_IDS.STRENGTH),
          type(EXERCISE_TYPE_IDS.STRENGTH),
        ),
      ).toEqual([]);
    });
  });

  describe("the user's own exercise types", () => {
    it("offers them as targets after the built-in ones, never a deleted one", () => {
      plugin.settings.exerciseTypes = [
        CLIMBING,
        { ...CLIMBING, id: "old", name: "Old", retired: true },
      ];

      const ids = service.targetTypes().map((type) => type.id);

      expect(ids).toContain(EXERCISE_TYPE_IDS.STRENGTH);
      expect(ids[ids.length - 1]).toBe("climbing");
      expect(ids).not.toContain("old");
      expect(ids).not.toContain(EXERCISE_TYPE_IDS.CUSTOM);
    });

    it("resolves one by its id with its fields", () => {
      expect(service.resolveType("climbing")?.parameters).toEqual(
        CLIMBING.parameters,
      );
    });

    it("keeps only the fields of the user's type when converting to it", async () => {
      logs = [
        makeLog({
          exercise: "Bouldering",
          reps: 6,
          weight: 10,
          customFields: { duration: 300, heartRate: 140 },
        }),
      ];

      await service.convertExerciseData("Bouldering", "climbing", [
        mapping("reps", "grade"),
      ]);

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated).toMatchObject({
        reps: 0,
        weight: 0,
        customFields: { grade: 6, duration: 300 },
      });
      expect(updated.customFields).not.toHaveProperty("heartRate");
    });

    it("suggests no mapping between types without a smart default", () => {
      expect(
        service.suggestInitialMappings(
          type(EXERCISE_TYPE_IDS.STRENGTH),
          service.resolveType("climbing")!,
        ),
      ).toEqual([]);
    });
  });

  describe("sourceFields", () => {
    it("gives the exercise's fields, then the other columns its sets fill in", async () => {
      definitionService.getParametersForExercise.mockResolvedValue(
        CLIMBING.parameters,
      );
      logs = [
        makeLog({
          exercise: "Bouldering",
          customFields: {
            grade: 6,
            Duration: 60,
            attempts: 3,
            empty: "",
          },
        }),
        makeLog({ exercise: "Other", customFields: { other: 1 } }),
      ];

      const fields = await service.sourceFields("Bouldering");

      expect(fields.map((field) => field.key)).toEqual([
        "grade",
        "duration",
        "attempts",
      ]);
      expect(
        definitionService.getParametersForExercise,
      ).toHaveBeenCalledWith("Bouldering");
    });
  });

  describe("setsOf", () => {
    it("returns the sets of exactly that exercise, ignoring case and spacing", async () => {
      logs = [
        makeLog({ exercise: "Bench Press", reps: 1 }),
        makeLog({ exercise: "bench  press", reps: 2 }),
        makeLog({ exercise: "Incline Bench Press", reps: 3 }),
      ];

      const sets = await service.setsOf("Bench Press");

      expect(sets.map((s) => s.reps)).toEqual([1, 2]);
    });
  });

  describe("convertExerciseData", () => {
    describe("never drops data the user mapped", () => {
      it("keeps a field mapped to a key the target type does not define", async () => {
        logs = [makeLog({ exercise: "Jump Rope", reps: 50 })];

        await service.convertExerciseData(
          "Jump Rope",
          EXERCISE_TYPE_IDS.TIMED,
          [mapping("reps", "rounds")],
        );

        const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
        expect(updated.customFields).toEqual({ rounds: 50 });
      });

      it("keeps all existing data when converting to the custom type", async () => {
        logs = [
          makeLog({
            exercise: "Jump Rope",
            reps: 50,
            weight: 5,
            volume: 250,
            customFields: { duration: 60 },
          }),
        ];

        await service.convertExerciseData(
          "Jump Rope",
          EXERCISE_TYPE_IDS.CUSTOM,
          [mapping("reps", "rounds")],
        );

        const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
        expect(updated).toMatchObject({
          reps: 50,
          weight: 5,
          customFields: { duration: 60, rounds: 50 },
        });
      });
    });

    it("should return 0 and not update anything when the exercise has no logs", async () => {
      logs = [makeLog({ exercise: "Other" })];

      const count = await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [],
      );

      expect(count).toBe(0);
      expect(plugin.updateWorkoutLogEntry).not.toHaveBeenCalled();
    });

    it("should return 0 when there is no log data at all", async () => {
      const count = await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [],
      );
      expect(count).toBe(0);
    });

    it("should run all updates inside a single batch operation", async () => {
      logs = [makeLog(), makeLog({ date: "2024-01-02" })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [],
      );

      expect(plugin.batchOperation).toHaveBeenCalledTimes(1);
      expect(plugin.batchOperation.mock.calls[0][0]).toBe("other");
      expect(plugin.updateWorkoutLogEntry).toHaveBeenCalledTimes(2);
    });

    it("should only convert logs matching the exercise name exactly, ignoring case", async () => {
      logs = [
        makeLog({ exercise: "plank", reps: 5 }),
        makeLog({ exercise: "Side Plank", reps: 6 }),
        makeLog({ exercise: "Squat", reps: 7 }),
      ];

      const count = await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [mapping("reps", "duration")],
      );

      expect(count).toBe(1);
      expect(plugin.updateWorkoutLogEntry.mock.calls[0][0]).toBe(
        logs[0],
      );
    });

    it("should move reps into duration and zero reps when converting strength to timed", async () => {
      const log = makeLog({
        exercise: "Plank",
        reps: 45,
        weight: 20,
        volume: 900,
        workout: "Core",
        notes: "hard",
        origine: "x",
      });
      logs = [log];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [mapping("reps", "duration")],
      );

      const [original, updated] =
        plugin.updateWorkoutLogEntry.mock.calls[0];
      expect(original).toBe(log);
      expect(updated.reps).toBe(0);
      expect(updated.weight).toBe(0);
      expect(updated.customFields).toEqual({ duration: 45 });
      expect(updated.date).toBe("2024-01-01");
      expect(updated.exercise).toBe("Plank");
      expect(updated.workout).toBe("Core");
      expect(updated.notes).toBe("hard");
      expect(updated.origine).toBe("x");
    });

    it("should move duration into reps when converting timed to strength", async () => {
      logs = [
        makeLog({
          customFields: { duration: 30 },
        }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("duration", "reps")],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated.reps).toBe(30);
      expect(updated.weight).toBe(0);
      expect(updated.customFields).toEqual({});
    });

    it("should write back the weight and unit the set was entered in", async () => {
      logs = [
        makeLog({
          reps: 5,
          weight: 45.36,
          volume: 226.8,
          enteredWeight: 100,
          enteredUnit: "lb",
        }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated).toMatchObject({
        weight: 100,
        weightUnit: "lb",
      });
    });

    it("should keep reps and weight untouched when the target is strength and no mappings are given", async () => {
      logs = [makeLog({ reps: 8, weight: 60 })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated.reps).toBe(8);
      expect(updated.weight).toBe(60);
    });

    it("should drop custom fields that the target type does not define", async () => {
      logs = [
        makeLog({
          customFields: { duration: 10, distance: 5, heartRate: 140 },
        }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [],
      );

      expect(
        plugin.updateWorkoutLogEntry.mock.calls[0][1].customFields,
      ).toEqual({ duration: 10 });
    });

    it("should keep custom fields defined by the target type", async () => {
      logs = [
        makeLog({
          customFields: { duration: 10, distance: 5, heartRate: 140 },
        }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.CARDIO,
        [],
      );

      const fields =
        plugin.updateWorkoutLogEntry.mock.calls[0][1].customFields;
      expect(fields.duration).toBe(10);
      expect(fields.distance).toBe(5);
      expect(fields).not.toHaveProperty("unknown");
    });

    it("should not mutate the original log's custom fields", async () => {
      const customFields = { duration: 10, distance: 5 };
      logs = [makeLog({ customFields })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [],
      );

      expect(customFields).toEqual({ duration: 10, distance: 5 });
    });

    it("should skip a mapping when the source custom field is missing", async () => {
      logs = [makeLog({ reps: 4, customFields: {} })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("duration", "reps")],
      );

      expect(plugin.updateWorkoutLogEntry.mock.calls[0][1].reps).toBe(
        4,
      );
    });

    it("should skip a mapping when the log has no custom fields at all", async () => {
      logs = [makeLog({ reps: 4 })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("duration", "reps")],
      );

      expect(plugin.updateWorkoutLogEntry.mock.calls[0][1].reps).toBe(
        4,
      );
    });

    it("should parse numeric strings when mapping a custom field into reps and weight", async () => {
      logs = [makeLog({ customFields: { a: "12", b: "7.5" } })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("a", "reps"), mapping("b", "weight")],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated.reps).toBe(12);
      expect(updated.weight).toBe(7.5);
    });

    it("should fall back to 0 when a mapped value is not numeric", async () => {
      logs = [
        makeLog({
          reps: 3,
          weight: 3,
          customFields: { a: "abc", b: "xyz" },
        }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("a", "reps"), mapping("b", "weight")],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated.reps).toBe(0);
      expect(updated.weight).toBe(0);
    });

    it("should map a boolean custom field into reps as 0", async () => {
      logs = [makeLog({ reps: 9, customFields: { flag: true } })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("flag", "reps")],
      );

      expect(plugin.updateWorkoutLogEntry.mock.calls[0][1].reps).toBe(
        0,
      );
    });

    it("should map reps into weight and weight into reps when both mappings are given", async () => {
      logs = [makeLog({ reps: 5, weight: 100 })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("reps", "weight"), mapping("weight", "reps")],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      // Mapping reads the original log, so values swap cleanly.
      expect(updated.weight).toBe(5);
      expect(updated.reps).toBe(100);
    });

    it("should map between custom fields", async () => {
      logs = [makeLog({ customFields: { duration: 20 } })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.DISTANCE,
        [mapping("duration", "distance")],
      );

      const fields =
        plugin.updateWorkoutLogEntry.mock.calls[0][1].customFields;
      expect(fields.distance).toBe(20);
      expect(fields.duration).toBe(20);
    });

    it("should convert every matching log and return the count", async () => {
      logs = [
        makeLog({ date: "2024-01-01", reps: 10 }),
        makeLog({ date: "2024-01-02", reps: 20 }),
        makeLog({ date: "2024-01-03", reps: 30 }),
      ];

      const count = await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.TIMED,
        [mapping("reps", "duration")],
      );

      expect(count).toBe(3);
      const durations = plugin.updateWorkoutLogEntry.mock.calls.map(
        (c) => c[1].customFields.duration,
      );
      expect(durations).toEqual([10, 20, 30]);
    });

    it("should propagate errors thrown while updating an entry", async () => {
      logs = [makeLog()];
      plugin.updateWorkoutLogEntry.mockRejectedValueOnce(
        new Error("write failed"),
      );

      await expect(
        service.convertExerciseData(
          "Plank",
          EXERCISE_TYPE_IDS.TIMED,
          [],
        ),
      ).rejects.toThrow("write failed");
    });
  });

  describe("convertExerciseData on the log file", () => {
    const HEADER =
      "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,weightUnit";

    function onLogFile(content: string) {
      const storage = new InMemoryLogStorage(content);
      const logFile = new WorkoutLogFile(
        storage,
        {
          csvLogFilePath: "workout_logs.csv",
          weightUnit: "kg",
        } as WorkoutChartsSettings,
        new WorkoutEventBus(),
        { retryDelayMs: 0 },
      );
      const context = {
        settings: { exerciseTypes: [] },
        getWorkoutLogData: () => logFile.read(),
        updateWorkoutLogEntry: (
          log: WorkoutLogData,
          entry: Parameters<WorkoutLogFile["update"]>[1],
        ) => logFile.update(log, entry),
        batchOperation: async (
          _op: string,
          fn: () => Promise<void>,
        ) => fn(),
      };
      return {
        storage,
        service: new ExerciseConversionService(
          context as unknown as WorkoutPluginContext,
        ),
      };
    }

    function firstRow(
      storage: InMemoryLogStorage,
    ): Record<string, string> {
      const [header, row] = parseCsv(storage.content ?? "");
      return Object.fromEntries(
        header.map((name, i) => [name, row[i]]),
      );
    }

    it("keeps a set logged in lb in lb when the weight is mapped, with settings in kg", async () => {
      const { storage, service } = onLogFile(
        [
          HEADER,
          "2026-01-01,Farmer Walk,40,100,4000,,Carry,1000,,standard,lb",
        ].join("\n"),
      );

      await service.convertExerciseData(
        "Farmer Walk",
        EXERCISE_TYPE_IDS.TIMED,
        [mapping("reps", "duration"), mapping("weight", "weight")],
      );

      const cells = firstRow(storage);
      expect(cells).toMatchObject({
        weight: "100",
        weightUnit: "lb",
        duration: "40",
      });
    });

    it("copies the weight as entered when it is mapped to another field", async () => {
      const { storage, service } = onLogFile(
        [
          HEADER,
          "2026-01-01,Farmer Walk,40,100,4000,,Carry,1000,,standard,lb",
        ].join("\n"),
      );

      await service.convertExerciseData(
        "Farmer Walk",
        EXERCISE_TYPE_IDS.TIMED,
        [mapping("weight", "duration")],
      );

      const cells = firstRow(storage);
      expect(cells.duration).toBe("100");
    });
  });

  describe("updateExerciseFrontmatter", () => {
    it("should save the definition with the new type id when it exists", async () => {
      const definition = { name: "Plank", typeId: "strength" };
      definitionService.getExerciseDefinition.mockResolvedValue(
        definition,
      );

      await service.updateExerciseFrontmatter("Plank", "timed");

      expect(
        definitionService.getExerciseDefinition,
      ).toHaveBeenCalledWith("Plank");
      expect(
        definitionService.saveExerciseDefinition,
      ).toHaveBeenCalledWith({ name: "Plank", typeId: "timed" });
    });

    it("drops the page's own fields along with the old type", async () => {
      definitionService.getExerciseDefinition.mockResolvedValue({
        name: "Bouldering",
        typeId: "custom",
        customParameters: [
          {
            key: "attempts",
            label: "Attempts",
            type: "number",
            required: false,
          },
        ],
      });

      await service.updateExerciseFrontmatter(
        "Bouldering",
        "climbing",
      );

      const saved =
        definitionService.saveExerciseDefinition.mock.calls[0][0];
      expect(saved).toEqual({
        name: "Bouldering",
        typeId: "climbing",
      });
      expect(saved).not.toHaveProperty("customParameters");
    });

    it("should do nothing when the exercise has no definition", async () => {
      definitionService.getExerciseDefinition.mockResolvedValue(null);

      await service.updateExerciseFrontmatter("Ghost", "timed");

      expect(
        definitionService.saveExerciseDefinition,
      ).not.toHaveBeenCalled();
    });
  });
});
