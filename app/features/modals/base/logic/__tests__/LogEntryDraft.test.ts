// Dates are read and written in the user's local time. jest.config.js pins
// it to Europe/Rome, so the UTC/local edge cases below are the ones a user
// in Italy hits.

import {
  fromLog,
  toEntry,
  validate,
} from "@app/features/modals/base/logic/LogEntryDraft";
import {
  WorkoutProtocol,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import { t } from "@app/i18n";

function log(overrides: Partial<WorkoutLogData> = {}): WorkoutLogData {
  return {
    date: "2026-03-10T09:00:00.000Z",
    exercise: "Squat",
    reps: 5,
    weight: 45.36,
    volume: 226.8,
    enteredWeight: 100,
    enteredUnit: "lb",
    workout: "Leg day",
    notes: "felt good",
    timestamp: 1000,
    protocol: WorkoutProtocol.DROP_SET,
    origine: "[[Leg day]]",
    customFields: { rpe: 8 },
    ...overrides,
  };
}

/** What the edit form submits when the user changes nothing */
function unchanged(original: WorkoutLogData): LogFormData {
  const values = fromLog(original);
  return {
    exercise: values.exercise!,
    reps: values.reps,
    weight: values.weight,
    weightUnit: values.weightUnit,
    workout: values.workout!,
    notes: values.notes!,
    date: values.date,
    protocol: values.protocol,
    customFields: values.customFields,
  };
}

describe("LogEntryDraft", () => {
  describe("fromLog", () => {
    it("fills the form with what was entered, in its own unit", () => {
      expect(fromLog(log())).toEqual({
        exercise: "Squat",
        reps: 5,
        weight: 100,
        weightUnit: "lb",
        workout: "Leg day",
        notes: "felt good",
        date: "2026-03-10",
        protocol: WorkoutProtocol.DROP_SET,
        customFields: { rpe: 8 },
      });
    });

    it("shows the local day of a set logged just after midnight", () => {
      // 00:30 in Rome on 10 March is 23:30 UTC on 9 March
      expect(fromLog(log({ date: "2026-03-09T23:30:00.000Z" })).date).toBe(
        "2026-03-10",
      );
    });
  });

  describe("toEntry when editing", () => {
    it("keeps the exact date when the user changes nothing, even after midnight", () => {
      const original = log({ date: "2026-03-09T23:30:00.000Z" });

      const entry = toEntry(unchanged(original), {
        original,
        now: new Date(),
        pageLink: original.origine,
      });

      expect(entry.date).toBe("2026-03-09T23:30:00.000Z");
    });

    it("moves the set to the picked day and keeps its time of day", () => {
      const original = log({ date: "2026-01-31T10:00:00.000Z" });

      const entry = toEntry(
        { ...unchanged(original), date: "2026-02-15" },
        { original, now: new Date(), pageLink: original.origine },
      );

      expect(entry.date).toBe("2026-02-15T10:00:00.000Z");
    });

    it("writes back the weight and unit as entered", () => {
      const original = log();

      const entry = toEntry(unchanged(original), {
        original,
        now: new Date(),
        pageLink: original.origine,
      });

      expect(entry).toEqual({
        date: original.date,
        exercise: "Squat",
        reps: 5,
        weight: 100,
        weightUnit: "lb",
        origine: "[[Leg day]]",
        workout: "Leg day",
        notes: "felt good",
        protocol: WorkoutProtocol.DROP_SET,
        customFields: { rpe: 8 },
      });
    });
  });

  describe("toEntry when creating", () => {
    const now = new Date("2026-10-11T18:00:00.000Z");

    it("logs the set now, links the note it was logged from and defaults to standard", () => {
      expect(
        toEntry(
          { exercise: "Squat", reps: 5, weight: 100, workout: "", notes: "" },
          { now, pageLink: "[[Leg day]]" },
        ),
      ).toEqual({
        date: "2026-10-11T18:00:00.000Z",
        exercise: "Squat",
        reps: 5,
        weight: 100,
        weightUnit: undefined,
        origine: "[[Leg day]]",
        workout: undefined,
        notes: undefined,
        protocol: WorkoutProtocol.STANDARD,
        customFields: undefined,
      });
    });

    it("falls back to the plugin link outside a note", () => {
      const entry = toEntry(
        { exercise: "Squat", workout: "", notes: "" },
        { now },
      );

      expect(entry.origine).toBe("[[Workout Charts Plugin]]");
      expect([entry.reps, entry.weight]).toEqual([0, 0]);
    });
  });

  describe("validate", () => {
    const params: ParameterDefinition[] = [
      { key: "reps", label: "Reps", type: "number", required: true, min: 1 },
      { key: "weight", label: "Weight", type: "number", required: true, min: 0, max: 500 },
      { key: "band", label: "Band", type: "string", required: true },
      { key: "rpe", label: "RPE", type: "number", required: false },
      { key: "heartRate", label: "Heart rate", type: "number", required: false, max: 250 },
    ] as ParameterDefinition[];
    const fields = (values: Record<string, string>) =>
      new Map(Object.entries({ reps: "5", weight: "100", band: "red", ...values }));

    it("accepts a complete set", () => {
      expect(validate("Squat", fields({}), params)).toBeNull();
    });

    it.each([
      ["no exercise", "", {}, t("modal.notices.validationFillAll")],
      ["text in a number", "Squat", { reps: "five" }, t("modal.notices.validMustBeNumber", { field: "Reps" })],
      ["below the minimum", "Squat", { reps: "0" }, t("modal.notices.validMinValue", { field: "Reps", min: 1 })],
      ["above the maximum", "Squat", { weight: "600" }, t("modal.notices.validMaxValue", { field: "Weight", max: 500 })],
      ["an empty required text", "Squat", { band: "  " }, t("modal.notices.validFieldRequired", { field: "Band" })],
      ["decimal reps", "Squat", { reps: "8.5" }, t("modal.notices.validMustBeWholeNumber", { field: "Reps" })],
      ["an optional field out of its limits", "Squat", { heartRate: "300" }, t("modal.notices.validMaxValue", { field: "Heart rate", max: 250 })],
    ])("rejects %s", (_case, exercise, values, message) => {
      expect(validate(exercise, fields(values), params)).toBe(message);
    });

    it("rejects a required field the form doesn't have", () => {
      const missing = new Map([["reps", "5"]]);
      expect(validate("Squat", missing, params)).toBe(
        t("modal.notices.validMissingField", { field: "Weight" }),
      );
    });

    it("ignores optional fields", () => {
      expect(validate("Squat", fields({ rpe: "" }), params)).toBeNull();
    });
  });
});
