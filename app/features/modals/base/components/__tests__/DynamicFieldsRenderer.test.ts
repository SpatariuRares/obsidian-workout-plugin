/** @jest-environment jsdom */

import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";

const weightParam: ParameterDefinition = {
  key: "weight",
  label: "Weight",
  type: "number",
  required: true,
  min: 0,
};

const renderWeight = async (weightUnit: "kg" | "lb") => {
  const plugin = {
    settings: { weightUnit, weightIncrement: 2.5 },
    getWorkoutLogData: jest.fn().mockResolvedValue([]),
  } as unknown as WorkoutPluginContext;
  const container = createObsidianContainer();
  const inputs = await new DynamicFieldsRenderer(
    plugin,
  ).renderDynamicFields(container, [weightParam]);
  const select = container.querySelector(
    ".workout-weight-unit-select",
  ) as HTMLSelectElement;
  return { input: inputs.get("weight")!, select };
};

describe("DynamicFieldsRenderer weight unit select", () => {
  it("should start at the settings unit", async () => {
    const { input, select } = await renderWeight("lb");

    expect(select.value).toBe("lb");
    expect(input.dataset.weightUnit).toBe("lb");
  });

  it("should convert the typed value when switching unit", async () => {
    const { input, select } = await renderWeight("kg");
    input.value = "20";

    select.value = "lb";
    select.dispatchEvent(new Event("change"));

    expect(input.value).toBe("44.09");
    expect(input.dataset.weightUnit).toBe("lb");
  });

  it("should only change the unit when the field is empty", async () => {
    const { input, select } = await renderWeight("kg");

    select.value = "lb";
    select.dispatchEvent(new Event("change"));

    expect(input.value).toBe("");
    expect(input.dataset.weightUnit).toBe("lb");
  });
});

describe("DynamicFieldsRenderer.setWeightValue", () => {
  it("should set the value and move the unit select to the entry unit", async () => {
    const { input, select } = await renderWeight("kg");

    DynamicFieldsRenderer.setWeightValue(input, 225, "lb");

    expect(input.value).toBe("225");
    expect(input.dataset.weightUnit).toBe("lb");
    expect(select.value).toBe("lb");
  });

  it("should keep the current unit when none is given", async () => {
    const { input, select } = await renderWeight("kg");

    DynamicFieldsRenderer.setWeightValue(input, 100);

    expect(input.value).toBe("100");
    expect(select.value).toBe("kg");
  });
});

describe("DynamicFieldsRenderer quick adjust buttons", () => {
  const render = async (params: ParameterDefinition[], quickWeightIncrement = 2.5) => {
    const plugin = {
      settings: { weightUnit: "kg", weightIncrement: 2.5, quickWeightIncrement },
      getWorkoutLogData: jest.fn().mockResolvedValue([]),
    } as unknown as WorkoutPluginContext;
    const container = createObsidianContainer();
    const inputs = await new DynamicFieldsRenderer(plugin).renderDynamicFields(container, params);
    const plus = (key: string) =>
      inputs.get(key)!.closest(".workout-field-with-adjust")!.querySelector(".workout-adjust-plus") as HTMLButtonElement;
    return { inputs, plus };
  };

  it("should keep two decimals when adding small plates", async () => {
    const { inputs, plus } = await render([weightParam], 1.25);
    inputs.get("weight")!.value = "80";

    plus("weight").click();

    expect(inputs.get("weight")!.value).toBe("81.25");
  });

  it("should add whole reps and step reps by one", async () => {
    const reps: ParameterDefinition = { key: "reps", label: "Reps", type: "number", required: true, min: 0 };
    const { inputs, plus } = await render([reps]);
    inputs.get("reps")!.value = "8";

    plus("reps").click();

    expect(inputs.get("reps")!.value).toBe("9");
    expect(inputs.get("reps")!.step).toBe("1");
  });

  it("should adjust a duration in seconds by five", async () => {
    const duration: ParameterDefinition = { key: "duration", label: "Duration", type: "number", unit: "sec", required: true, min: 0 };
    const { inputs, plus } = await render([duration]);
    inputs.get("duration")!.value = "30";

    plus("duration").click();

    expect(inputs.get("duration")!.value).toBe("35");
  });
});

describe("DynamicFieldsRenderer.carryOver", () => {
  const field = (type: string, value = "", checked = false) =>
    Object.assign(document.createElement("input"), { type, value, checked });

  it("should copy typed values and ticked boxes into the new exercise's fields", () => {
    const before = new Map([
      ["reps", field("number", "8")],
      ["belt", field("checkbox", "on", true)],
      ["band", field("text", "")],
      ["gone", field("number", "3")],
    ]);
    const after = new Map([
      ["reps", field("number")],
      ["belt", field("checkbox")],
      ["band", field("text", "red")],
    ]);

    DynamicFieldsRenderer.carryOver(before, after);

    expect(after.get("reps")!.value).toBe("8");
    expect(after.get("belt")!.checked).toBe(true);
    // An empty field doesn't wipe the new field's default
    expect(after.get("band")!.value).toBe("red");
  });
});
