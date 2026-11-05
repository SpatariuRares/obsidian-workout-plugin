import {
  fieldFor,
  fieldKey,
  fieldValue,
  formatFieldNumber,
  hasFieldValue,
  readField,
  setFieldValue,
} from "@app/services/exercise/ExerciseFields";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { t } from "@app/i18n";

const param = (key: string, typeId = "strength") =>
  getExerciseTypeById(typeId)!.parameters.find((p) => p.key === key)!;

const custom = (over: Partial<ParameterDefinition>): ParameterDefinition => ({
  key: "incline",
  label: "Incline",
  type: "number",
  required: false,
  ...over,
});

describe("fieldKey", () => {
  it.each([
    ["reps", "reps"],
    ["Rep", "reps"],
    ["Repetitions", "reps"],
    ["Wgt", "weight"],
    ["weight", "weight"],
    ["Dur", "duration"],
    ["Dist", "distance"],
    ["HR", "heartRate"],
    ["heartrate", "heartRate"],
    ["Heart Rate", "heartRate"],
    ["heart_rate", "heartRate"],
    ["Vol", "volume"],
    ["Prot", "protocol"],
    ["Date", "date"],
    ["Notes", "notes"],
    ["Actions", "actions"],
  ])("should read %p as the %p field", (name, key) => {
    expect(fieldKey(name)).toBe(key);
  });

  it("should drop a unit written after the name", () => {
    expect(fieldKey("Dur (min)")).toBe("duration");
    expect(fieldKey("Wgt (kg)")).toBe("weight");
  });

  it("should keep a custom field's key as written", () => {
    expect(fieldKey(" incline ")).toBe("incline");
  });
});

describe("fieldFor", () => {
  it("should take whole numbers for reps, heart rate and durations in seconds", () => {
    expect(fieldFor(param("reps")).integer).toBe(true);
    expect(fieldFor(param("heartRate", "cardio")).integer).toBe(true);
    expect(fieldFor(param("duration", "timed")).integer).toBe(true);
    expect(fieldFor(param("duration", "cardio")).integer).toBe(false);
    expect(fieldFor(param("weight")).integer).toBe(false);
    expect(fieldFor(custom({})).integer).toBe(false);
  });

  it("should step and adjust each field by a sensible amount", () => {
    const of = (p: ParameterDefinition) => {
      const f = fieldFor(p);
      return [f.step, f.increment];
    };
    expect(of(param("reps"))).toEqual([1, 1]);
    expect(of(param("duration", "timed"))).toEqual([1, 5]);
    expect(of(param("duration", "cardio"))).toEqual([1, 1]);
    expect(of(param("distance", "distance"))).toEqual([0.1, 0.5]);
    expect(of(param("heartRate", "cardio"))).toEqual([1, 5]);
    expect(of(custom({}))).toEqual([0.1, 1]);
  });
});

describe("readField", () => {
  const reps = fieldFor(param("reps"));

  it("should read a number", () => {
    expect(readField(reps, " 8 ")).toEqual({ value: 8 });
    expect(readField(fieldFor(param("weight")), "82.5")).toEqual({ value: 82.5 });
  });

  it("should read a decimal comma, as a phone's decimal pad types it", () => {
    expect(readField(fieldFor(param("weight")), "82,5")).toEqual({ value: 82.5 });
    expect(readField(reps, "8,5")).toEqual({
      error: t("modal.notices.validMustBeWholeNumber", { field: "Reps" }),
    });
  });

  it("should refuse a decimal where a whole number is expected", () => {
    expect(readField(reps, "8.5")).toEqual({
      error: t("modal.notices.validMustBeWholeNumber", { field: "Reps" }),
    });
  });

  it("should refuse text in a number field", () => {
    expect(readField(reps, "eight")).toEqual({
      error: t("modal.notices.validMustBeNumber", { field: "Reps" }),
    });
  });

  it("should check the limits of any filled-in number, required or not", () => {
    const hr = fieldFor(param("heartRate", "cardio"));
    expect(readField(hr, "300")).toEqual({
      error: t("modal.notices.validMaxValue", { field: "Heart rate", max: 250 }),
    });
    expect(readField(reps, "-1")).toEqual({
      error: t("modal.notices.validMinValue", { field: "Reps", min: 0 }),
    });
  });

  it("should report a missing required value and accept a missing optional one", () => {
    expect(readField(reps, "  ")).toEqual({
      error: t("modal.notices.validMissingField", { field: "Reps" }),
    });
    expect(readField(fieldFor(param("heartRate", "cardio")), "")).toEqual({});
  });

  it("should read text and checkboxes", () => {
    const note = fieldFor(custom({ key: "grip", label: "Grip", type: "string", required: true }));
    expect(readField(note, " wide ")).toEqual({ value: "wide" });
    expect(readField(note, "")).toEqual({
      error: t("modal.notices.validFieldRequired", { field: "Grip" }),
    });
    const belt = fieldFor(custom({ key: "belt", label: "Belt", type: "boolean" }));
    expect(readField(belt, true)).toEqual({ value: true });
    expect(readField(belt, false)).toEqual({ value: false });
  });
});

describe("formatFieldNumber", () => {
  it("should round whole-number fields and keep up to two decimals otherwise", () => {
    expect(formatFieldNumber(fieldFor(param("reps")), 7.6)).toBe("8");
    expect(formatFieldNumber(fieldFor(param("weight")), 81.25)).toBe("81.25");
    expect(formatFieldNumber(fieldFor(param("weight")), 80)).toBe("80");
    expect(formatFieldNumber(fieldFor(param("distance", "distance")), 5.5)).toBe("5.5");
  });
});

describe("setFieldValue", () => {
  const set = () => ({
    reps: 0,
    weight: 0,
    customFields: {} as Record<string, string | number | boolean>,
  });

  it("should write reps and weight on the set itself, however the field is written", () => {
    const entry = set();
    setFieldValue(entry, "Rep", 8);
    setFieldValue(entry, "Wgt (kg)", 82.5);
    expect(entry).toEqual({ reps: 8, weight: 82.5, customFields: {} });
  });

  it("should read reps and weight written as text, whole reps", () => {
    const entry = set();
    setFieldValue(entry, "reps", "8.5");
    setFieldValue(entry, "weight", "82.5");
    expect(entry).toMatchObject({ reps: 8, weight: 82.5 });
    setFieldValue(entry, "reps", "none");
    expect(entry.reps).toBe(0);
  });

  it("should write any other field under its key", () => {
    const entry: { reps: number; weight: number; customFields?: Record<string, number> } = {
      reps: 0,
      weight: 0,
    };
    setFieldValue(entry, "duration", 90);
    expect(entry.customFields).toEqual({ duration: 90 });
  });
});

describe("fieldValue", () => {
  const set = (customFields: Record<string, string | number | boolean>) => ({
    reps: 8,
    weight: 80,
    customFields,
  });

  it("should read reps and weight from the set itself", () => {
    expect(fieldValue(set({}), "Rep")).toBe(8);
    expect(fieldValue(set({}), "Wgt (kg)")).toBe(80);
  });

  it.each([
    ["HR", "heartRate"],
    ["heart rate", "heartRate"],
    ["heartrate", "heartRate"],
    ["Duration (s)", "duration"],
    ["Max load", "max_load"],
  ])("should find a %p column when asked for %p", (column, key) => {
    expect(fieldValue(set({ [column]: 42 }), key)).toBe(42);
  });

  it("should read a number written as text as a number", () => {
    expect(fieldValue(set({ duration: "82,5" }), "duration")).toBe(82.5);
    expect(fieldValue(set({ notes2: "easy" }), "notes2")).toBe("easy");
  });

  it("should give nothing for a field the set doesn't record", () => {
    expect(fieldValue(set({ distance: 5 }), "heartRate")).toBeUndefined();
    expect(fieldValue({}, "reps")).toBeUndefined();
  });
});

describe("hasFieldValue", () => {
  it.each([
    [undefined, false],
    ["", false],
    [0, false],
    [12, true],
    ["easy", true],
    [true, true],
  ])("should say %p is filled in: %p", (value, filled) => {
    expect(hasFieldValue(value)).toBe(filled);
  });
});
