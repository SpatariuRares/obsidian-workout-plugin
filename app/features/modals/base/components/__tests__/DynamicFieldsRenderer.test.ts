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
