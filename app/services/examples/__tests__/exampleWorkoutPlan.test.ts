import {
  generateWorkoutContent,
  generateYogaContent,
} from "@app/services/examples/exampleContentGenerator";
import { readSessionPlan } from "@app/features/session/business/sessionPlan";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { t } from "@app/i18n";

describe("example workout note as a guided session", () => {
  const content = generateWorkoutContent();

  it("has a workout-session block", () => {
    const types = readWorkoutNote(content).blocks.map((block) => block.type);

    expect(types).toContain("workout-session");
  });

  it("writes each exercise as one workout-sets block with its own rest, without timers", () => {
    const types = readWorkoutNote(content).blocks.map((block) => block.type);

    expect(types).not.toContain("workout-timer");
    expect(readSessionPlan(content).map((step) => step.restBlock?.type)).toEqual(
      Array(5).fill("workout-sets"),
    );
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

describe("example yoga flow as a guided session", () => {
  it("plans each pose with three holds and the rest of its section", () => {
    const steps = readSessionPlan(generateYogaContent());

    expect(
      steps.map((step) => [step.exercise, step.sets, step.rest.duration]),
    ).toEqual([
      [t("examples.exercises.downwardDog.name"), 3, 20],
      [t("examples.exercises.warriorTwo.name"), 3, 20],
      [t("examples.exercises.treePose.name"), 3, 20],
    ]);
  });
});
