import { generateExampleCSVData } from "@app/services/examples/exampleDataGenerator";
import { parseCSVLogFile } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

const HEADER =
  "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate";

describe("generateExampleCSVData", () => {
  let csv: string;
  let lines: string[];

  beforeAll(() => {
    csv = generateExampleCSVData();
    lines = csv.split("\n");
  });

  describe("structure", () => {
    it("should start with the standard header", () => {
      expect(lines[0]).toBe(HEADER);
    });

    it("should have the same number of columns on every row", () => {
      const cols = HEADER.split(",").length;
      for (const line of lines) {
        expect(line.split(",")).toHaveLength(cols);
      }
    });

    it("should generate 12 lower, 12 upper and 11 cardio sessions of rows", () => {
      // lower: 12 * (4+4+4+3+4+3) = 264, upper: 12 * 8 = 96, cardio: 11 * 2 = 22
      expect(lines.length - 1).toBe(264 + 96 + 22);
    });

    it("should use ISO dates within the last 40 days", () => {
      const oldest = Date.now() - 41 * 86400000;
      for (const line of lines.slice(1)) {
        const date = new Date(line.split(",")[0]);
        expect(isNaN(date.getTime())).toBe(false);
        expect(date.getTime()).toBeGreaterThan(oldest);
        expect(date.getTime()).toBeLessThanOrEqual(Date.now());
      }
    });
  });

  describe("parsing back with parseCSVLogFile", () => {
    it("should parse every generated row", () => {
      const entries = parseCSVLogFile(csv);

      expect(entries).toHaveLength(lines.length - 1);
    });

    it("should have consistent volume for strength rows", () => {
      const entries = parseCSVLogFile(csv).filter((e) => e.reps > 0);

      expect(entries.length).toBeGreaterThan(0);
      for (const e of entries) {
        expect(e.volume).toBeCloseTo(e.reps * e.weight, 5);
        expect(e.weight).toBeGreaterThan(0);
      }
    });

    it("should include the localized exercise names", () => {
      const names = new Set(parseCSVLogFile(csv).map((e) => e.exercise));

      for (const key of [
        "squatMultiPower",
        "rdl",
        "legPress45",
        "legCurlSeated",
        "calfMachine",
        "plank",
        "benchPress",
        "running",
        "squat",
        "cycling",
      ]) {
        expect(names).toContain(t(`examples.exercises.${key}.name`));
      }
    });

    it("should use the three localized workout names", () => {
      const workouts = new Set(parseCSVLogFile(csv).map((e) => e.workout));

      expect(workouts).toEqual(
        new Set([
          t("examples.workouts.lowerBodyA.name"),
          t("examples.workouts.upperBodyPower.name"),
          t("examples.workouts.cardioDay.name"),
        ]),
      );
    });

    it("should link origine to the workout note", () => {
      for (const e of parseCSVLogFile(csv)) {
        expect(e.origine).toBe(`[[${e.workout}]]`);
      }
    });

    it("should produce valid numeric timestamps", () => {
      for (const e of parseCSVLogFile(csv)) {
        expect(Number.isFinite(e.timestamp)).toBe(true);
        expect(e.timestamp).toBeGreaterThan(0);
      }
    });

    it("should cover several protocols besides standard", () => {
      const protocols = new Set(parseCSVLogFile(csv).map((e) => e.protocol));

      expect(protocols.size).toBeGreaterThan(1);
      expect(protocols).toContain("standard");
    });

    it("should expose duration, distance and heart rate as custom fields for cardio and timed rows", () => {
      const entries = parseCSVLogFile(csv);
      const running = entries.filter(
        (e) => e.exercise === t("examples.exercises.running.name"),
      );
      const plank = entries.filter(
        (e) => e.exercise === t("examples.exercises.plank.name"),
      );

      expect(running).toHaveLength(11);
      expect(plank).toHaveLength(36);
      for (const r of running) {
        expect(r.customFields?.duration).toBeGreaterThan(0);
        expect(r.customFields?.distance).toBeGreaterThan(0);
        expect(r.customFields?.heartRate).toBeGreaterThan(0);
      }
      for (const p of plank) {
        expect(p.customFields?.duration).toBeGreaterThan(0);
      }
    });
  });

  describe("progression", () => {
    it("should increase bench press weight from the first to the last session", () => {
      const bench = parseCSVLogFile(csv)
        .filter((e) => e.exercise === t("examples.exercises.benchPress.name"))
        .sort((a, b) => a.timestamp - b.timestamp);

      expect(bench[bench.length - 1].weight).toBeGreaterThan(bench[0].weight);
    });
  });

  it("should not touch the vault or any global state (pure string generator)", () => {
    expect(typeof generateExampleCSVData()).toBe("string");
  });
});

describe("generateExampleCSVData with translations containing commas", () => {
  it("keeps every row intact when a localized name contains a comma", () => {
    jest.isolateModules(() => {
      jest.doMock("@app/i18n", () => ({
        t: (key: string) =>
          key === "examples.exercises.squat.name" ? "Squat, high bar" : key,
      }));
      const { generateExampleCSVData: generate } = jest.requireActual(
        "@app/services/examples/exampleDataGenerator",
      ) as typeof import("@app/services/examples/exampleDataGenerator");
      const { parseCSVLogFile: parse } = jest.requireActual(
        "@app/types/WorkoutLogData",
      ) as typeof import("@app/types/WorkoutLogData");

      const csv = generate();
      const rowCount = csv.trim().split("\n").length - 1;
      const entries = parse(csv);

      expect(entries).toHaveLength(rowCount);
      expect(entries.map((e) => e.exercise)).toContain("Squat, high bar");
    });
  });
});
