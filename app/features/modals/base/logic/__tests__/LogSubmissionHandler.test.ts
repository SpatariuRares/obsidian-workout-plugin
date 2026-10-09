import { LogSubmissionHandler } from "@app/features/modals/base/logic/LogSubmissionHandler";
import { LogFormValidator } from "@app/features/modals/base/logic/LogFormValidator";
import type { LogFormElements } from "@app/types/ModalTypes";

jest.mock("@app/features/modals/base/logic/LogFormValidator", () => ({
  LogFormValidator: { validateDynamicLogData: jest.fn() },
}));

const makeInput = (value: string, dataset: Record<string, string> = {}) =>
  ({ value, type: "number", dataset }) as unknown as HTMLInputElement;

const makeForm = (weightInput: HTMLInputElement): LogFormElements =>
  ({
    exerciseElements: { exerciseInput: makeInput("Squat") },
    notesInput: makeInput(""),
    workoutInput: makeInput(""),
    dynamicFieldInputs: new Map([
      ["reps", makeInput("5")],
      ["weight", weightInput],
    ]),
  }) as unknown as LogFormElements;

describe("LogSubmissionHandler", () => {
  beforeEach(() => {
    (
      LogFormValidator.validateDynamicLogData as jest.Mock
    ).mockReturnValue(true);
  });

  it("should leave the unit to the repository when the field has none", () => {
    const entry = LogSubmissionHandler.extractValidateAndCreateEntry(
      makeForm(makeInput("100")),
      [],
      undefined,
      undefined,
    );

    expect(entry?.weight).toBe(100);
    expect(entry?.volume).toBe(500);
    expect(entry?.weightUnit).toBeUndefined();
  });

  it("should save the weight as typed with the unit chosen in the form", () => {
    const entry = LogSubmissionHandler.extractValidateAndCreateEntry(
      makeForm(makeInput("225", { weightUnit: "lb" })),
      [],
      undefined,
      undefined,
    );

    expect(entry?.weight).toBe(225);
    expect(entry?.volume).toBe(1125);
    expect(entry?.weightUnit).toBe("lb");
  });

  it("should ignore an unknown unit", () => {
    const entry = LogSubmissionHandler.extractValidateAndCreateEntry(
      makeForm(makeInput("100", { weightUnit: "lbs" })),
      [],
      undefined,
      undefined,
    );

    expect(entry?.weightUnit).toBeUndefined();
  });
});
