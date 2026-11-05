import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { fieldFor } from "@app/services/exercise/ExerciseFields";

import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { Input } from "@app/components/atoms";
import { NumberField } from "@app/components/molecules/NumberField";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { fillDynamicInputsFromCustomFields } from "@app/utils/form/FormUtils";
import { t } from "@app/i18n";
import {
  convertWeight,
  isWeightUnit,
  WEIGHT_UNITS,
  type WeightUnit,
} from "@app/utils/WeightUnitUtils";

export class DynamicFieldsRenderer {
  constructor(private plugin: WorkoutPluginContext) {}

  /**
   * Renders dynamic fields based on parameter definitions.
   * Clears existing fields and creates new inputs for each parameter.
   */
  async renderDynamicFields(
    container: HTMLElement,
    parameters: ParameterDefinition[],
    context?: { workoutName?: string; exerciseName?: string },
  ): Promise<Map<string, HTMLInputElement>> {
    // Clear existing fields
    container.empty();

    const fieldInputs = new Map<string, HTMLInputElement>();

    for (const param of parameters) {
      const input = await this.renderParameterFieldWithAdjust(
        container,
        param,
        context,
      );
      fieldInputs.set(param.key, input);
    }

    return fieldInputs;
  }

  /**
   * Renders a parameter field with optional quick-adjust buttons for numeric types.
   */
  private async renderParameterFieldWithAdjust(
    container: HTMLElement,
    param: ParameterDefinition,
    context?: { workoutName?: string; exerciseName?: string },
  ): Promise<HTMLInputElement> {
    const fieldContainer = container.createDiv({
      cls: "workout-field-with-adjust",
    });

    // A number's unit is at the end of its field
    const label = fieldContainer.createEl("label", {
      cls: "workout-field-label",
      text:
        param.unit && param.type !== "number"
          ? `${param.label} (${param.unit})`
          : param.label,
    });

    // For numeric fields, a NumberField with − / + by the quick increment
    if (param.type === "number") {
      const field = fieldFor(param);
      const isWeight = param.key === "weight";
      const increment = isWeight
        ? await this.getWeightIncrement(context)
        : field.increment;

      const { input } = NumberField.create(fieldContainer, {
        label: param.label,
        integer: field.integer,
        // The weight's unit is the picker next to its label
        unit: isWeight ? undefined : param.unit,
        step: increment,
        min: param.min ?? 0,
        max: param.max,
      });
      label.htmlFor = input.id;
      if (param.required) {
        input.required = true;
      }

      if (isWeight) {
        this.renderWeightUnitSelect(label, input);
      }

      return input;
    }

    // Boolean checkbox
    if (param.type === "boolean") {
      const input = Input.create(fieldContainer, {
        type: INPUT_TYPE.CHECKBOX,
        className: "workout-charts-checkbox",
      });
      input.setAttribute("aria-label", param.label);
      if (param.default === true) {
        input.checked = true;
      }
      return input;
    }

    // String/text input (default)
    const input = Input.create(fieldContainer, {
      type: INPUT_TYPE.TEXT,
      className: "workout-charts-input",
      value:
        param.default !== undefined
          ? String(param.default)
          : undefined,
    });
    input.setAttribute("aria-label", param.label);
    input.id = `workout-log-field-${param.key}`;
    label.htmlFor = input.id;
    if (param.required) {
      input.required = true;
    }
    return input;
  }

  /**
   * After the exercise changes, copies what was typed or ticked into the
   * fields the new exercise shares; empty fields keep the new defaults.
   */
  static carryOver(
    from: Map<string, HTMLInputElement>,
    to: Map<string, HTMLInputElement>,
  ): void {
    for (const [key, old] of from) {
      const input = to.get(key);
      if (!input) continue;
      if (old.type === "checkbox") {
        input.checked = old.checked;
      } else if (old.value) {
        input.value = old.value;
      }
    }
  }

  /** Apply the last set in its entered unit. */
  static fillFromLog(
    inputs: Map<string, HTMLInputElement>,
    log: WorkoutLogData,
  ): void {
    const reps = inputs.get("reps");
    if (reps && log.reps >= 0) reps.value = String(log.reps);
    const weight = inputs.get("weight");
    if (weight && log.weight >= 0) {
      this.setWeightValue(
        weight,
        log.enteredWeight ?? log.weight,
        log.enteredUnit,
      );
    }
    fillDynamicInputsFromCustomFields(log.customFields, inputs);
  }

  /**
   * Fills the weight field with a stored value in its own unit (edit modal,
   * last-entry autofill), keeping the unit picker in sync.
   */
  static setWeightValue(
    input: HTMLInputElement,
    value: number,
    unit?: WeightUnit,
  ): void {
    input.value = String(value);
    if (!unit) return;
    input.dataset.weightUnit = unit;
    const select = input
      .closest(".workout-field-with-adjust")
      ?.querySelector<HTMLSelectElement>(
        ".workout-weight-unit-select",
      );
    if (select) select.value = unit;
  }

  /** The unit picked next to a weight field, if it is a known one */
  static getWeightUnit(
    input: HTMLInputElement,
  ): WeightUnit | undefined {
    const unit = input.dataset.weightUnit;
    return isWeightUnit(unit) ? unit : undefined;
  }

  /**
   * Adds a kg/lb picker for this entry only. It starts at the settings unit;
   * switching converts the value already in the field. The set is saved as
   * typed with this unit (see getWeightUnit).
   */
  private renderWeightUnitSelect(
    label: HTMLElement,
    input: HTMLInputElement,
  ): void {
    const settingsUnit = this.plugin.settings.weightUnit;
    input.dataset.weightUnit = settingsUnit;

    const select = label.createEl("select", {
      cls: "dropdown workout-weight-unit-select",
      attr: { "aria-label": t("modal.weightUnitToggle") },
    });
    for (const unit of WEIGHT_UNITS) {
      select.createEl("option", { text: unit, value: unit });
    }
    select.value = settingsUnit;

    select.addEventListener("change", () => {
      const from = input.dataset.weightUnit;
      const to = select.value;
      if (!isWeightUnit(from) || !isWeightUnit(to)) return;
      const current = parseFloat(input.value);
      if (!isNaN(current)) {
        input.value = String(convertWeight(current, from, to));
      }
      input.dataset.weightUnit = to;
    });
  }

  /**
   * Weight step for the quick buttons: the most common jump between this
   * exercise's recent sets, else the quick increment from settings.
   */
  private async getWeightIncrement(context?: {
    workoutName?: string;
    exerciseName?: string;
  }): Promise<number> {
    if (context?.exerciseName) {
      try {
        const allowedIncrements = [1, 1.25, 2, 2.5, 3, 5, 10, 15, 20];
        const sortedIncrements = [...allowedIncrements].sort(
          (a, b) => b - a,
        );

        const allLogs: WorkoutLogData[] =
          await this.plugin.getWorkoutLogData();

        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

        let filteredLogs = allLogs.filter((log: WorkoutLogData) => {
          const logTimestamp =
            typeof log.timestamp === "string"
              ? new Date(log.timestamp).getTime()
              : log.timestamp || 0;

          return (
            log.exercise.toLowerCase() ===
              context.exerciseName?.toLowerCase() &&
            logTimestamp >= thirtyDaysAgo
          );
        });

        if (context.workoutName) {
          const workoutFiltered = filteredLogs.filter(
            (log: WorkoutLogData) =>
              log.workout?.toLowerCase() ===
              context.workoutName?.toLowerCase(),
          );
          if (workoutFiltered.length >= 2) {
            filteredLogs = workoutFiltered;
          }
        }

        if (filteredLogs.length > 1) {
          filteredLogs.sort((a, b) => {
            const timeA =
              typeof a.timestamp === "string"
                ? new Date(a.timestamp).getTime()
                : a.timestamp || 0;
            const timeB =
              typeof b.timestamp === "string"
                ? new Date(b.timestamp).getTime()
                : b.timestamp || 0;
            return timeA - timeB;
          });
          const diffCounts = new Map<number, number>();

          for (let i = 1; i < filteredLogs.length; i++) {
            const prev = filteredLogs[i - 1].weight;
            const curr = filteredLogs[i].weight;
            if (
              typeof prev === "number" &&
              typeof curr === "number"
            ) {
              const diff = Math.abs(curr - prev);
              if (diff > 0) {
                const match = sortedIncrements.find(
                  (inc) => inc <= diff + 0.001,
                );
                if (match) {
                  diffCounts.set(
                    match,
                    (diffCounts.get(match) || 0) + 1,
                  );
                }
              }
            }
          }

          let bestIncrement = 0;
          let maxCount = 0;
          for (const [inc, count] of diffCounts.entries()) {
            if (count > maxCount) {
              maxCount = count;
              bestIncrement = inc;
            } else if (count === maxCount && inc > bestIncrement) {
              bestIncrement = inc;
            }
          }

          if (bestIncrement > 0) {
            return bestIncrement;
          }
        }
      } catch {
        // Fallback to defaults on error
      }
    }

    const quickIncrement = this.plugin.settings.quickWeightIncrement;
    if (typeof quickIncrement === "number" && quickIncrement > 0) {
      return quickIncrement;
    }
    return this.plugin.settings.weightIncrement;
  }
}
