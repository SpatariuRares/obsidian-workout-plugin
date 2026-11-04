/** @jest-environment jsdom */

import { PlanFields } from "@app/features/tables/modals/components/PlanFields";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("PlanFields", () => {
  it("leaves out the values at 0 and reads the others", () => {
    const fields = PlanFields.create(createObsidianContainer(), 3);
    expect(PlanFields.read(fields)).toEqual({
      sets: 3,
      targetWeight: undefined,
      targetReps: undefined,
    });

    fields.targetWeight.value = "82.5";
    fields.targetReps.value = "8";
    fields.sets.value = "0";
    expect(PlanFields.read(fields)).toEqual({
      sets: undefined,
      targetWeight: 82.5,
      targetReps: 8,
    });
  });

  it("shows a block's plan, unset values as 0", () => {
    const fields = PlanFields.create(createObsidianContainer());
    PlanFields.fill(fields, { sets: 4, targetReps: 10 });

    expect([fields.sets.value, fields.targetReps.value, fields.targetWeight.value]).toEqual([
      "4",
      "10",
      "0",
    ]);
    expect(PlanFields.read(fields)).toEqual({ sets: 4, targetReps: 10, targetWeight: undefined });
  });
});
