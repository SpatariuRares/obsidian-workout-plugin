import { generateWorkoutContent } from "@app/services/examples/exampleContentGenerator";
import { readSessionPlan } from "@app/features/session/business/sessionPlan";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { t } from "@app/i18n";

describe("example workout note as a guided session", () => {
  const content = generateWorkoutContent();

  it("has a workout-session block", () => {
    const types = readWorkoutNote(content).blocks.map((block) => block.type);

    expect(types).toContain("workout-session");
  });

  it("plans each exercise with the sets and rest its section describes", () => {
    const steps = readSessionPlan(content);

    expect(
      steps.map((step) => [step.exercise, step.sets, step.rest.duration]),
    ).toEqual([
      [t("examples.exercises.squatMultiPower.name"), 4, 180],
      [t("examples.exercises.rdl.name"), 4, 180],
      [t("examples.exercises.legPress45.name"), 4, 120],
      [t("examples.exercises.legCurlSeated.name"), 3, 90],
      [t("examples.exercises.calfMachine.name"), 4, 60],
    ]);
  });
});
