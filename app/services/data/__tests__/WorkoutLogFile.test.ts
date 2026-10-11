import { Notice } from "obsidian";
import { WorkoutLogFile } from "@app/services/data/WorkoutLogFile";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutEvent } from "@app/services/events/WorkoutEventTypes";
import { InMemoryLogStorage } from "@app/services/data/__tests__/InMemoryLogStorage";
import {
  WorkoutProtocol,
  type LogEntryInput,
  type WorkoutChartsSettings,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const HEADER =
  "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol";

function csv(...lines: string[]): string {
  return lines.join("\n");
}

function setup(content: string | null, weightUnit: "kg" | "lb" = "kg") {
  const storage = new InMemoryLogStorage(content);
  const settings = {
    csvLogFilePath: "workout_logs.csv",
    weightUnit,
  } as WorkoutChartsSettings;
  const eventBus = new WorkoutEventBus();
  const events: WorkoutEvent[] = [];
  const emit = eventBus.emit.bind(eventBus);
  eventBus.emit = (event: WorkoutEvent) => {
    events.push(event);
    emit(event);
  };
  const logFile = new WorkoutLogFile(storage, settings, eventBus, {
    retryDelayMs: 0,
  });
  return { storage, settings, eventBus, events, logFile };
}

function lines(storage: InMemoryLogStorage): string[] {
  return (storage.content ?? "").split("\n");
}

const squat: LogEntryInput = {
  date: "2026-02-01",
  exercise: "Squat",
  reps: 5,
  weight: 100,
  workout: "Leg Day",
  protocol: WorkoutProtocol.STANDARD,
};

describe("WorkoutLogFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("read", () => {
    it("returns each row in the settings unit and keeps what was entered", async () => {
      const { logFile } = setup(
        csv(
          `${HEADER},weightUnit`,
          "2026-01-01,Squat,5,100,500,,Leg Day,1000,,standard,lb",
        ),
      );

      const [log] = await logFile.read();

      expect(log).toMatchObject({
        exercise: "Squat",
        reps: 5,
        weight: 45.36,
        volume: 226.8,
        enteredWeight: 100,
        enteredUnit: "lb",
        workout: "Leg Day",
        timestamp: 1000,
      });
    });

    it("reads rows without a unit in the settings unit", async () => {
      const { logFile } = setup(
        csv(HEADER, "2026-01-01,Squat,5,100,500,,,1000,,standard"),
        "lb",
      );

      const [log] = await logFile.read();

      expect(log).toMatchObject({ weight: 100, enteredUnit: "lb" });
    });

    it("returns nothing when there is no log file", async () => {
      const { logFile } = setup(null);

      expect(await logFile.read()).toEqual([]);
    });

    it("skips rows it cannot trust and keeps the rest", async () => {
      const { logFile } = setup(
        csv(
          `${HEADER},duration`,
          "2026-01-01,NaN reps,x,100,500,,,1,,standard,",
          "2026-01-01,Negative,5,-1,0,,,2,,standard,",
          "2026-01-01,,5,100,500,,,3,,standard,",
          "2026-01-01,No reps,0,0,0,,,4,,standard,",
          "2026-01-01,Short,5,100",
          "2026-01-01,Bodyweight,10,0,0,,,5,,standard,",
          "2026-01-01,Plank,0,0,0,,,6,,standard,60",
        ),
      );

      const logs = await logFile.read();

      expect(logs.map((log) => log.exercise)).toEqual([
        "Bodyweight",
        "Plank",
      ]);
    });

    it("types custom values and reads unknown protocols as standard", async () => {
      const { logFile } = setup(
        csv(
          `${HEADER},duration,assisted,band`,
          "2026-01-01,Pull up,5,0,0,,,1,,mystery,30,true,red",
        ),
      );

      const [log] = await logFile.read();

      expect(log.protocol).toBe(WorkoutProtocol.STANDARD);
      expect(log.customFields).toEqual({
        duration: 30,
        assisted: true,
        band: "red",
      });
    });

    it("reads multi-line notes, CRLF files and formula-like text as typed", async () => {
      const { logFile } = setup(
        [
          HEADER,
          `2026-01-01,Squat,5,100,500,,,1,"felt good\nkeep going",standard`,
          `2026-01-01,'=Row,5,100,500,,,2,,standard`,
        ].join("\r\n"),
      );

      const logs = await logFile.read();

      expect(logs.map((log) => log.notes)).toEqual([
        "felt good\nkeep going",
        undefined,
      ]);
      expect(logs[1].exercise).toBe("=Row");
    });

    it("serves the cached rows for 5 seconds", async () => {
      const now = jest.spyOn(Date, "now").mockReturnValue(10_000);
      const { logFile, storage } = setup(
        csv(HEADER, "2026-01-01,Squat,5,100,500,,,1,,standard"),
      );
      await logFile.read();
      storage.content = csv(HEADER);

      now.mockReturnValue(14_000);
      expect(await logFile.read()).toHaveLength(1);

      now.mockReturnValue(15_001);
      expect(await logFile.read()).toHaveLength(0);
      now.mockRestore();
    });

    it("reads the file again after clearCache", async () => {
      const { logFile, storage } = setup(
        csv(HEADER, "2026-01-01,Squat,5,100,500,,,1,,standard"),
      );
      await logFile.read();
      storage.content = csv(HEADER);

      logFile.clearCache();

      expect(await logFile.read()).toHaveLength(0);
    });

    it("loads the file once for simultaneous reads", async () => {
      const { logFile, storage } = setup(csv(HEADER));
      const read = jest.spyOn(storage, "read");

      await Promise.all([logFile.read(), logFile.read()]);

      expect(read).toHaveBeenCalledTimes(1);
    });

    it("re-reads when the weight unit setting changes, not other settings", async () => {
      const { logFile, storage, eventBus } = setup(csv(HEADER));
      await logFile.read();
      const read = jest.spyOn(storage, "read");

      eventBus.emit({
        type: "settings:changed",
        payload: { key: "csvLogFilePath", previousValue: "", newValue: "" },
      });
      await logFile.read();
      expect(read).not.toHaveBeenCalled();

      eventBus.emit({
        type: "settings:changed",
        payload: { key: "weightUnit", previousValue: "kg", newValue: "lb" },
      });
      await logFile.read();
      expect(read).toHaveBeenCalledTimes(1);
    });

    it("re-reads after an external log refresh event, until destroyed", async () => {
      const { logFile, storage, eventBus } = setup(csv(HEADER));
      await logFile.read();
      const read = jest.spyOn(storage, "read");
      const refresh = () =>
        eventBus.emit({
          type: "log:bulk-changed",
          payload: { count: 0, operation: "other" },
        });

      refresh();
      await logFile.read();
      expect(read).toHaveBeenCalledTimes(1);

      logFile.destroy();
      await logFile.read();
      refresh();
      await logFile.read();
      expect(read).toHaveBeenCalledTimes(2);
    });

    it("shows a notice and returns nothing when the file cannot be read", async () => {
      const { logFile, storage } = setup(csv(HEADER));
      jest.spyOn(storage, "read").mockRejectedValue(new Error("locked"));

      expect(await logFile.read()).toEqual([]);
      expect(Notice).toHaveBeenCalledWith(
        t("messages.errors.csvLoadError", { error: "locked" }),
      );
    });
  });

  describe("findLastForExercise", () => {
    it("returns the newest set of the exercise, ignoring case and spaces", async () => {
      const { logFile } = setup(
        csv(
          HEADER,
          "2026-01-01,Squat,5,100,500,,,3,,standard",
          "2026-01-02,Squat,5,110,550,,,9,,standard",
          "2026-01-03,Bench,5,80,400,,,20,,standard",
        ),
      );

      const last = await logFile.findLastForExercise("  squat ");

      expect(last?.weight).toBe(110);
      expect(await logFile.findLastForExercise("")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("writes the header and a sample set", async () => {
      const { logFile, storage } = setup(null);

      await logFile.create();

      expect(lines(storage)[0]).toBe(HEADER);
      expect(await logFile.read()).toHaveLength(1);
    });
  });

  describe("add", () => {
    it("appends the set with a new timestamp, reps × weight volume and the settings unit", async () => {
      jest.spyOn(Date, "now").mockReturnValue(5000);
      const { logFile, storage } = setup(csv(HEADER));

      await logFile.add(squat);

      expect(lines(storage)).toEqual([
        `${HEADER},weightUnit`,
        "2026-02-01,Squat,5,100,500,,Leg Day,5000,,standard,kg",
      ]);
      jest.restoreAllMocks();
    });

    it("keeps the unit the set was entered in", async () => {
      const { logFile } = setup(csv(HEADER), "kg");

      await logFile.add({ ...squat, weight: 225, weightUnit: "lb" });

      const [log] = await logFile.read();
      expect(log).toMatchObject({ enteredWeight: 225, enteredUnit: "lb" });
    });

    it("emits log:added with the set as views read it", async () => {
      const { logFile, events } = setup(csv(HEADER), "kg");

      await logFile.add({ ...squat, weight: 100, weightUnit: "lb" });

      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({
        type: "log:added",
        payload: {
          entry: { exercise: "Squat", weight: 45.36, enteredWeight: 100 },
          context: { exercise: "Squat", workout: "Leg Day" },
        },
      });
    });

    it("creates the log file when it is missing", async () => {
      const { logFile } = setup(null);

      await logFile.add(squat);

      const logs = await logFile.read();
      expect(logs.map((log) => log.exercise)).toEqual([
        "Sample Exercise",
        "Squat",
      ]);
    });

    it("fails with the path when the file cannot be created", async () => {
      const { logFile, storage, events } = setup(null);
      jest.spyOn(storage, "create").mockResolvedValue();

      const message = t("messages.errors.workoutLogCreateError", {
        path: "workout_logs.csv",
      });
      await expect(logFile.add(squat)).rejects.toThrow(message);
      expect(Notice).toHaveBeenCalledWith(message);
      expect(events).toHaveLength(0);
    });

    it("adds a new custom column before the unit column, blank for older rows", async () => {
      const { logFile, storage } = setup(
        csv(
          `${HEADER},duration,weightUnit`,
          "2026-01-01,Plank,0,0,0,,,1,,standard,60,kg",
        ),
      );

      await logFile.add({
        ...squat,
        exercise: "Run",
        reps: 0,
        weight: 0,
        customFields: { distance: 5 },
      });

      const [header, plank, run] = lines(storage);
      expect(header).toBe(`${HEADER},duration,distance,weightUnit`);
      expect(plank.endsWith(",60,,kg")).toBe(true);
      expect(run.endsWith(",,5,kg")).toBe(true);
    });

    it("stores formula-like text so spreadsheets don't run it", async () => {
      const { logFile, storage } = setup(csv(HEADER));

      await logFile.add({ ...squat, notes: "=1+1" });

      expect(lines(storage)[1]).toContain(",'=1+1,");
      const [log] = await logFile.read();
      expect(log.notes).toBe("=1+1");
    });
  });

  describe("update", () => {
    const content = csv(
      `${HEADER},weightUnit`,
      "2026-01-01,Squat,5,100,500,,,1000,,standard,lb",
      "2026-01-02,Bench,5,80,400,,,2000,,standard,kg",
    );

    it("replaces the set found by timestamp and keeps its timestamp", async () => {
      const { logFile, events } = setup(content);
      const [original] = await logFile.read();

      await logFile.update(original, { ...squat, reps: 6, weightUnit: "lb" });

      const [updated] = await logFile.read();
      expect(updated).toMatchObject({
        reps: 6,
        enteredWeight: 100,
        enteredUnit: "lb",
        volume: 272.16,
        timestamp: 1000,
      });
      expect(events).toEqual([
        expect.objectContaining({
          type: "log:updated",
          payload: {
            previous: original,
            updated: expect.objectContaining({ reps: 6, timestamp: 1000 }),
          },
        }),
      ]);
    });

    it("falls back to date, exercise, reps and entered weight", async () => {
      const { logFile } = setup(content);
      const [original] = await logFile.read();

      await logFile.update(
        { ...original, timestamp: 42 },
        { ...squat, date: "2026-01-01", reps: 8 },
      );

      const logs = await logFile.read();
      expect(logs.map((log) => log.reps)).toEqual([8, 5]);
    });

    it("fails without writing when the set is gone", async () => {
      const { logFile, storage, events } = setup(content);
      const before = storage.content;
      const ghost = { ...squat, volume: 0, timestamp: 1 } as WorkoutLogData;

      await expect(logFile.update(ghost, squat)).rejects.toThrow(
        "Original log entry not found in CSV file",
      );
      expect(storage.content).toBe(before);
      expect(events).toHaveLength(0);
    });

    it("fails when there is no log file", async () => {
      const { logFile } = setup(null);

      await expect(
        logFile.update({} as WorkoutLogData, squat),
      ).rejects.toThrow(t("messages.csvNotFound"));
    });
  });

  describe("delete", () => {
    it("removes the set and keeps the column order, empty columns included", async () => {
      const { logFile, storage, events } = setup(
        csv(
          `${HEADER},zone,duration,unused,weightUnit`,
          "2026-01-01,Run,0,0,0,,,1,,standard,2,30,,kg",
          "2026-01-02,Run,0,0,0,,,2,,standard,3,40,,kg",
        ),
      );
      const [first] = await logFile.read();

      await logFile.delete(first);

      expect(lines(storage)).toEqual([
        `${HEADER},zone,duration,unused,weightUnit`,
        "2026-01-02,Run,0,0,0,,,2,,standard,3,40,,kg",
      ]);
      expect(events[0]).toMatchObject({
        type: "log:deleted",
        payload: { entry: first, context: { exercise: "Run" } },
      });
    });

    it("fails when the set is gone or there is no file", async () => {
      const { logFile } = setup(csv(HEADER));
      const ghost = { ...squat, volume: 0, timestamp: 1 } as WorkoutLogData;

      await expect(logFile.delete(ghost)).rejects.toThrow(
        "Log entry not found in CSV file",
      );
      await expect(setup(null).logFile.delete(ghost)).rejects.toThrow(
        t("messages.csvNotFound"),
      );
    });
  });

  describe("renameExercise", () => {
    it("renames every matching set and keeps the column order", async () => {
      const { logFile, storage, events } = setup(
        csv(
          `${HEADER},zone,duration`,
          "2026-01-01,squat ,5,100,500,,,1,,standard,,",
          "2026-01-02,Bench,5,80,400,,,2,,standard,,",
          "2026-01-03,SQUAT,5,100,500,,,3,,standard,,",
        ),
      );

      const count = await logFile.renameExercise("Squat", " Back squat ");

      expect(count).toBe(2);
      const [header, ...rows] = lines(storage);
      expect(header).toBe(`${HEADER},zone,duration`);
      expect(rows.map((row) => row.split(",")[1])).toEqual([
        "Back squat",
        "Bench",
        "Back squat",
      ]);
      expect(events[0]).toEqual({
        type: "log:bulk-changed",
        payload: { count: 2, operation: "rename" },
      });
    });

    it("explains why the rename failed", async () => {
      const { logFile, storage } = setup(csv(HEADER));
      jest.spyOn(storage, "process").mockRejectedValue(new Error("locked"));

      await expect(logFile.renameExercise("a", "b")).rejects.toThrow(
        "Failed to rename exercise: locked",
      );
    });
  });

  describe("stampMissingWeightUnits", () => {
    const content = csv(
      `${HEADER},weightUnit`,
      "2026-01-01,Squat,5,100,500,,,1,,standard,",
      "2026-01-02,Squat,5,220,1100,,,2,,standard,lb",
    );

    it("backs up the file, then gives only unit-less rows the unit", async () => {
      const { logFile, storage, events } = setup(content);

      const count = await logFile.stampMissingWeightUnits("kg");

      expect(count).toBe(1);
      expect(storage.backups).toEqual([content]);
      const logs = await logFile.read();
      expect(logs.map((log) => [log.enteredWeight, log.enteredUnit])).toEqual(
        [
          [100, "kg"],
          [220, "lb"],
        ],
      );
      expect(events[0]).toEqual({
        type: "log:bulk-changed",
        payload: { count: 1, operation: "migrate-unit" },
      });
    });

    it("does nothing once every row has a unit", async () => {
      const { logFile, storage } = setup(content);
      await logFile.stampMissingWeightUnits("kg");

      expect(await logFile.stampMissingWeightUnits("lb")).toBe(0);
      expect(storage.backups).toHaveLength(1);
    });

    it("does not stamp when the backup fails", async () => {
      const { logFile, storage } = setup(content);
      jest.spyOn(storage, "backup").mockRejectedValue(new Error("disk full"));

      await expect(logFile.stampMissingWeightUnits("kg")).rejects.toThrow(
        "disk full",
      );
      expect(storage.content).toBe(content);
    });

    it("returns 0 when there is no log file yet", async () => {
      expect(await setup(null).logFile.stampMissingWeightUnits("kg")).toBe(0);
    });
  });
});
