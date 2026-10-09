import { changeWeightUnit } from "@app/features/settings/business/changeWeightUnit";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";

const makePlugin = () => {
  const calls: string[] = [];
  const plugin = {
    settings: { weightUnit: "kg" },
    stampMissingWeightUnits: jest.fn(async (unit: string) => {
      calls.push(`stamp:${unit}`);
      return 3;
    }),
    saveSettings: jest.fn(async () => {
      calls.push(`save:${plugin.settings.weightUnit}`);
    }),
    eventBus: {
      emit: jest.fn(() => calls.push("emit")),
    },
  };
  return {
    plugin: plugin as unknown as WorkoutPluginContext & EventBusPort,
    raw: plugin,
    calls,
  };
};

describe("changeWeightUnit", () => {
  afterEach(() => ParameterUtils.setWeightUnit("kg"));

  it("should stamp legacy rows with the previous unit before saving the new one", async () => {
    const { plugin, calls } = makePlugin();

    await changeWeightUnit(plugin, "kg", "lb");

    expect(calls).toEqual(["stamp:kg", "save:lb", "emit"]);
    expect(plugin.settings.weightUnit).toBe("lb");
    expect(ParameterUtils.getWeightUnit()).toBe("lb");
  });

  it("should announce the change on the event bus", async () => {
    const { plugin, raw } = makePlugin();

    await changeWeightUnit(plugin, "kg", "lb");

    expect(raw.eventBus.emit).toHaveBeenCalledWith({
      type: "settings:changed",
      payload: { key: "weightUnit", previousValue: "kg", newValue: "lb" },
    });
  });

  it("should keep the old unit if stamping fails", async () => {
    const { plugin, raw } = makePlugin();
    raw.stampMissingWeightUnits.mockRejectedValueOnce(
      new Error("disk full"),
    );

    await expect(changeWeightUnit(plugin, "kg", "lb")).rejects.toThrow(
      "disk full",
    );
    expect(plugin.settings.weightUnit).toBe("kg");
    expect(raw.saveSettings).not.toHaveBeenCalled();
  });
});
