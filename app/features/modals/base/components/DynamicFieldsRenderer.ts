import { ParameterDefinition } from "@app/types/ExerciseTypes";

import type WorkoutChartsPlugin from "main";
import { Button, Input } from "@app/components/atoms";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

export class DynamicFieldsRenderer {
  constructor(private plugin: WorkoutChartsPlugin) {}

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

    const label = fieldContainer.createDiv({ cls: "workout-field-label" });
    const labelText = param.unit
      ? `${param.label} (${param.unit})`
      : param.label;
    label.textContent = labelText;

    // For numeric fields, add adjust buttons
    if (param.type === "number") {
      const inputContainer = fieldContainer.createDiv({
        cls: "workout-input-with-adjust",
      });

      // Quick adjust buttons
      const increment = await this.getIncrementForParameter(param, context);

      const minusBtn = Button.create(inputContainer, {
        text: t("modal.buttons.adjustMinus") + increment,
        className: "workout-adjust-btn workout-adjust-minus",
        ariaLabel: `Decrease ${param.label} by ${increment}`,
        variant: "secondary",
        size: "small",
      });
      minusBtn.type = "button";

      const input = Input.create(inputContainer, {
        type: INPUT_TYPE.NUMBER,
        className: "workout-charts-input",
        min: param.min ?? 0,
        max: param.max,
        step: this.getStepForParameter(param),
        placeholder: param.default?.toString() || "",
      });

      const plusBtn = Button.create(inputContainer, {
        text: t("modal.buttons.adjustPlus") + increment,
        className: "workout-adjust-btn workout-adjust-plus",
        ariaLabel: `Increase ${param.label} by ${increment}`,
        variant: "secondary",
        size: "small",
      });
      plusBtn.type = "button";

      Button.onClick(minusBtn, () => {
        const current = parseFloat(input.value) || 0;
        const newValue = Math.max(param.min || 0, current - increment);
        input.value = this.formatNumericValue(newValue, param);
      });

      Button.onClick(plusBtn, () => {
        const current = parseFloat(input.value) || 0;
        const newValue = current + increment;
        input.value =
          param.max !== undefined
            ? this.formatNumericValue(Math.min(param.max, newValue), param)
            : this.formatNumericValue(newValue, param);
      });

      if (param.required) {
        input.required = true;
      }

      return input;
    }

    // Boolean checkbox
    if (param.type === "boolean") {
      const input = Input.create(fieldContainer, {
        type: INPUT_TYPE.CHECKBOX,
        className: "workout-charts-checkbox",
      });
      if (param.default === true) {
        input.checked = true;
      }
      return input;
    }

    // String/text input (default)
    const input = Input.create(fieldContainer, {
      type: INPUT_TYPE.TEXT,
      className: "workout-charts-input",
      value: param.default !== undefined ? String(param.default) : undefined,
    });
    if (param.required) {
      input.required = true;
    }
    return input;
  }

  /**
   * Formats a numeric value based on parameter type (integer vs decimal).
   */
  private formatNumericValue(
    value: number,
    param: ParameterDefinition,
  ): string {
    // Use integer format for reps, duration in seconds
    if (param.key === "reps" || param.key === "heartRate") {
      return Math.round(value).toString();
    }
    if (param.key === "duration" && param.unit === "sec") {
      return Math.round(value).toString();
    }
    // Use decimal for weight, distance
    return value.toFixed(1);
  }

  /**
   * Determines increment value for quick-adjust buttons based on parameter key.
   */
  private async getIncrementForParameter(
    param: ParameterDefinition,
    context?: { workoutName?: string; exerciseName?: string },
  ): Promise<number> {
    if (param.key === "reps") return 1;
    if (param.key === "weight") {
      if (context?.exerciseName) {
        try {
          const allowedIncrements = [1, 1.25, 2, 2.5, 3, 5, 10, 15, 20];
          const sortedIncrements = [...allowedIncrements].sort((a, b) => b - a);

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
              if (typeof prev === "number" && typeof curr === "number") {
                const diff = Math.abs(curr - prev);
                if (diff > 0) {
                  const match = sortedIncrements.find(
                    (inc) => inc <= diff + 0.001,
                  );
                  if (match) {
                    diffCounts.set(match, (diffCounts.get(match) || 0) + 1);
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
        } catch (e) {
          // Fallback to defaults on error
          console.error("Failed to fetch logs for dynamic increment", e);
        }
      }

      const quickIncrement = this.plugin.settings.quickWeightIncrement;
      if (typeof quickIncrement === "number" && quickIncrement > 0) {
        return quickIncrement;
      }
      return this.plugin.settings.weightIncrement;
    }
    if (param.key === "duration" && param.unit === "sec") return 5;
    if (param.key === "duration" && param.unit === "min") return 1;
    if (param.key === "distance") return 0.5;
    if (param.key === "heartRate") return 5;

    // Default based on unit
    if (param.unit?.includes("km")) return 0.5;
    if (param.unit?.includes("min") || param.unit?.includes("sec")) return 1;
    return 1;
  }

  /**
   * Determines step value for numeric input based on parameter.
   */
  private getStepForParameter(param: ParameterDefinition): number {
    if (param.key === "weight") return 0.5;
    if (param.key === "distance") return 0.1;
    if (
      param.key === "reps" ||
      param.key === "duration" ||
      param.key === "heartRate"
    )
      return 1;
    return 0.1;
  }
}
