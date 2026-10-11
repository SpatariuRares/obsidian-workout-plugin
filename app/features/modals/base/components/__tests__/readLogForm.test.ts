import { readLogForm } from "@app/features/modals/base/components/readLogForm";
import type { LogFormElements } from "@app/types/ModalTypes";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";

const number = (key: string): ParameterDefinition => ({ key, label: key, type: "number", required: false });
const PARAMS: ParameterDefinition[] = [
  number("reps"),
  number("weight"),
  number("duration"),
  number("distance"),
  { key: "band", label: "Band", type: "string", required: false },
  { key: "assisted", label: "Assisted", type: "boolean", required: false },
];

const input = (
  value: string,
  { type = "number", dataset = {}, checked = false } = {} as {
    type?: string;
    dataset?: Record<string, string>;
    checked?: boolean;
  },
) => ({ value, type, dataset, checked }) as unknown as HTMLInputElement;

function form(
  fields: Record<string, HTMLInputElement>,
  extra: Partial<LogFormElements> = {},
): LogFormElements {
  return {
    exerciseElements: { exerciseInput: input(" Squat ", { type: "text" }) },
    notesInput: input(" heavy ", { type: "text" }),
    workoutInput: input("Leg day", { type: "text" }),
    dynamicFieldInputs: new Map(Object.entries(fields)),
    ...extra,
  } as unknown as LogFormElements;
}

describe("readLogForm", () => {
  it("reads reps and weight, and the unit picked next to the weight", () => {
    const { data } = readLogForm(
      form({ reps: input("5"), weight: input("225", { dataset: { weightUnit: "lb" } }) }),
      undefined,
      PARAMS,
    );

    expect(data).toMatchObject({
      exercise: "Squat",
      reps: 5,
      weight: 225,
      weightUnit: "lb",
      workout: "Leg day",
      notes: "heavy",
      protocol: "standard",
    });
  });

  it("leaves the unit to the log file when none or an unknown one is picked", () => {
    for (const dataset of [{}, { weightUnit: "lbs" }]) {
      const { data } = readLogForm(
        form({ weight: input("100", { dataset }) }),
        undefined,
        PARAMS,
      );
      expect(data.weightUnit).toBeUndefined();
    }
  });

  it("types custom fields by input and skips empty ones", () => {
    const { data, fields } = readLogForm(
      form({
        duration: input("60"),
        band: input("red", { type: "text" }),
        assisted: input("on", { type: "checkbox", checked: true }),
        distance: input(""),
      }),
      undefined,
      PARAMS,
    );

    expect(data.customFields).toEqual({ duration: 60, band: "red", assisted: true });
    expect(fields.get("distance")).toBe("");
  });

  it("types fields by the exercise's parameters, not by the input", () => {
    const { data, fields } = readLogForm(
      form({
        band: input("12", { type: "text" }),
        assisted: input("on", { type: "checkbox", checked: false }),
      }),
      undefined,
      PARAMS,
    );

    expect(data.customFields).toEqual({ band: "12", assisted: false });
    expect(fields.get("assisted")).toBe(false);
  });

  it("uses this note as the workout when the toggle is on", () => {
    const { data } = readLogForm(
      form({}, { currentWorkoutToggle: input("", { type: "checkbox", checked: true }) }),
      "Push day",
      PARAMS,
    );

    expect(data.workout).toBe("Push day");
  });
});
