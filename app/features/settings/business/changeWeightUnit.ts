import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

/**
 * Switch the settings weight unit (charts, totals, default for new logs).
 * Rows saved before units were stored per row get the previous unit first,
 * so they keep their meaning instead of being relabelled.
 */
export async function changeWeightUnit(
  plugin: WorkoutPluginContext & EventBusPort,
  previousValue: WeightUnit,
  newValue: WeightUnit,
): Promise<void> {
  await plugin.stampMissingWeightUnits(previousValue);

  plugin.settings.weightUnit = newValue;
  ParameterUtils.setWeightUnit(newValue);
  await plugin.saveSettings();
  // Views re-render with weights converted to the new unit
  plugin.eventBus.emit({
    type: "settings:changed",
    payload: { key: "weightUnit", previousValue, newValue },
  });
}
