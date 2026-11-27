import { reviewRows } from "@app/features/tables/business/setsReview";
import { LocalizationService, t } from "@app/i18n";

beforeAll(() => {
  LocalizationService.initialize({} as never);
});

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

  it("includes protocol, warm-up sets, and combined target via describeTarget when set", () => {
    const rows = reviewRows(
      {
        exercise: "Leg Extension",
        protocol: "drop_set",
        sets: 3,
        warmups: 2,
        targetWeight: 85,
        targetReps: 8,
      },
      base,
    );

    expect(rows.find(([k]) => k === t("modal.protocol"))?.[1]).toBe(
      t("modal.selectOptions.dropSet"),
    );
    expect(rows.find(([k]) => k === t("modal.wizard.warmupSets"))?.[1]).toBe("2");
    expect(rows.find(([k]) => k === t("modal.sections.target"))?.[1]).toBe(
      t("logs.weightedSet", { weight: 85, unit: "kg", reps: 8 }),
    );
  });

  it("shows superset exercises, rounds, warm-up rounds, omits targets, and formats restBetween + round rest", () => {
    const rows = reviewRows(
      {
        exercises: ["Bench Press", "Bent Over Row"],
        protocol: "superset",
        sets: 4,
        warmups: 1,
        targetWeight: 80,
        targetReps: 10,
        restBetween: 30,
        rest: 120,
      },
      base,
    );

    expect(rows.find(([k]) => k === t("modal.protocol"))?.[1]).toBe(
      t("modal.selectOptions.superset"),
    );
    expect(rows.find(([k]) => k === t("modal.wizard.exercises"))?.[1]).toBe(
      "Bench Press + Bent Over Row",
    );
    expect(rows.find(([k]) => k === t("modal.rounds"))?.[1]).toBe("4");
    expect(rows.find(([k]) => k === t("modal.wizard.warmupRounds"))?.[1]).toBe("1");
    expect(rows.find(([k]) => k === t("modal.sections.target"))).toBeUndefined();
    expect(rows.find(([k]) => k === base.targetWeightLabel)).toBeUndefined();
    expect(rows.find(([k]) => k === t("modal.labels.targetReps"))).toBeUndefined();
    expect(rows.find(([k]) => k === t("modal.wizard.restBetweenLabel"))?.[1]).toBe("30s");
    expect(rows.find(([k]) => k === t("modal.wizard.restRoundLabel"))?.[1]).toBe("2m");
  });

  it("hints restBetween fallback for superset round rest when rest is unset, or section timer when both unset", () => {
    const withFallback = reviewRows(
      { exercises: ["Bench Press", "Bent Over Row"], restBetween: 90 },
      base,
    );
    expect(withFallback.find(([k]) => k === t("modal.wizard.restBetweenLabel"))?.[1]).toBe(
      "1m 30s",
    );
    expect(withFallback.find(([k]) => k === t("modal.wizard.restRoundLabel"))?.[1]).toBe(
      t("modal.wizard.restRoundFallbackHelper", { duration: "1m 30s" }),
    );

    const noRest = reviewRows({ exercises: ["Bench Press", "Bent Over Row"] }, base);
    expect(noRest.find(([k]) => k === t("modal.wizard.restBetweenLabel"))).toBeUndefined();
    expect(noRest.find(([k]) => k === t("modal.wizard.restRoundLabel"))?.[1]).toBe(
      t("sets.wizard.restSectionTimer"),
    );
  });
});
