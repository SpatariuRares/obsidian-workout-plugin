import {
  ExerciseConversionService,
  type FieldMapping,
} from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import {
  EXERCISE_TYPE_IDS,
  getExerciseTypeById,
} from "@app/constants/exerciseTypes.constants";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const type = (id: string) => getExerciseTypeById(id)!;

const mapping = (from: string, to: string): FieldMapping => ({
  fromField: from,
  toField: to,
  fromLabel: from,
  toLabel: to,
});

const makeLog = (
  overrides: Partial<WorkoutLogData> = {},
): WorkoutLogData => ({
  date: "2024-01-01",
  exercise: "Plank",
  reps: 0,
  weight: 0,
  volume: 0,
  ...overrides,
});

describe("ExerciseConversionService", () => {
  let logs: WorkoutLogData[];
  let plugin: {
    getWorkoutLogData: jest.Mock;
    updateWorkoutLogEntry: jest.Mock;
    batchOperation: jest.Mock;
    getExerciseDefinitionService: jest.Mock;
  };
  let definitionService: {
    getExerciseDefinition: jest.Mock;
    saveExerciseDefinition: jest.Mock;
  };
  let service: ExerciseConversionService;

  beforeEach(() => {
    logs = [];
    definitionService = {
      getExerciseDefinition: jest.fn(),
      saveExerciseDefinition: jest.fn().mockResolvedValue(undefined),
    };
    plugin = {
      getWorkoutLogData: jest.fn(async () => logs),
      updateWorkoutLogEntry: jest.fn().mockResolvedValue(undefined),
      batchOperation: jest.fn(
        async (_op: string, fn: () => Promise<void>) => fn(),
      ),
      getExerciseDefinitionService: jest.fn(
        () => definitionService,
      ),
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
          volume: 250,
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
      expect(updated.volume).toBe(0);
      expect(updated.customFields).toEqual({ duration: 45 });
      expect(updated.date).toBe("2024-01-01");
      expect(updated.exercise).toBe("Plank");
      expect(updated.workout).toBe("Core");
      expect(updated.notes).toBe("hard");
      expect(updated.origine).toBe("x");
    });

    it("should move duration into reps and recalculate volume when converting timed to strength", async () => {
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
      expect(updated.volume).toBe(0);
      expect(updated.customFields).toEqual({});
    });

    it("should compute volume as reps times weight for strength targets", async () => {
      logs = [makeLog({ reps: 5, weight: 80, volume: 1 })];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [],
      );

      expect(plugin.updateWorkoutLogEntry.mock.calls[0][1].volume).toBe(
        400,
      );
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
      logs = [
        makeLog({ customFields: { a: "12", b: "7.5" } }),
      ];

      await service.convertExerciseData(
        "Plank",
        EXERCISE_TYPE_IDS.STRENGTH,
        [mapping("a", "reps"), mapping("b", "weight")],
      );

      const updated = plugin.updateWorkoutLogEntry.mock.calls[0][1];
      expect(updated.reps).toBe(12);
      expect(updated.weight).toBe(7.5);
      expect(updated.volume).toBe(90);
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
      expect(updated.volume).toBe(0);
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

    it("should do nothing when the exercise has no definition", async () => {
      definitionService.getExerciseDefinition.mockResolvedValue(null);

      await service.updateExerciseFrontmatter("Ghost", "timed");

      expect(
        definitionService.saveExerciseDefinition,
      ).not.toHaveBeenCalled();
    });
  });
});
