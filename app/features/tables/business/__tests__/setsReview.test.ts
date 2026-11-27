import { reviewRows } from "@app/features/tables/business/setsReview";
import { t } from "@app/i18n";

const base = { weightUnit: "kg", noteName: "Leg day", targetWeightLabel: "Target weight" };

describe("reviewRows", () => {
  it("lists exercise and workout, defaulting the workout to the note", () => {
    const rows = reviewRows({ exercise: "Squat" }, base);

    expect(rows[0][1]).toBe("Squat");
    expect(rows[1][1]).toBe(t("sets.wizard.workoutDefault", { note: "Leg day" }));
  });

  it("shows the target weight with its unit", () => {
    const rows = reviewRows({ exercise: "Squat", targetWeight: 80 }, base);

    expect(rows.find(([k]) => k === "Target weight")![1]).toBe("80 kg");
  });

  it("leaves out unset plan values and falls back to the section timer", () => {
    const rows = reviewRows({ exercise: "Squat" }, base);

    expect(rows).toHaveLength(3);
    expect(rows[2][1]).toBe(t("sets.wizard.restSectionTimer"));
  });

  it("describes a set rest in seconds", () => {
    const rows = reviewRows({ exercise: "Squat", rest: 90, sets: 4, targetReps: 8 }, base);

    expect(rows.map(([, v]) => v)).toEqual(
      expect.arrayContaining(["4", "8", t("sets.wizard.restValue", { seconds: 90 })]),
    );
  });
});
