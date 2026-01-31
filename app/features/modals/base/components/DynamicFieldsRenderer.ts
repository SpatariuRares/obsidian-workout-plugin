import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { CONSTANTS } from "@app/constants";
import type WorkoutChartsPlugin from "main";

export class DynamicFieldsRenderer {
  constructor(private plugin: WorkoutChartsPlugin) {}

  /**
   * Renders dynamic fields based on parameter definitions.
   * Clears existing fields and creates new inputs for each parameter.
   */
  renderDynamicFields(
    container: HTMLElement,
    parameters: ParameterDefinition[]
  ): Map<string, HTMLInputElement> {
    // Clear existing fields
    container.empty();

    const fieldInputs = new Map<string, HTMLInputElement>();

    for (const param of parameters) {
      const input = this.renderParameterFieldWithAdjust(container, param);
      fieldInputs.set(param.key, input);
    }

    return fieldInputs;
  }

  /**
   * Renders a parameter field with optional quick-adjust buttons for numeric types.
   */
  private renderParameterFieldWithAdjust(
    container: HTMLElement,
    param: ParameterDefinition
  ): HTMLInputElement {
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

      const input = inputContainer.createEl("input", {
        type: "number",
        cls: "workout-charts-input",
        attr: {
          min: param.min?.toString() || "0",
          max: param.max?.toString() || "",
          step: this.getStepForParameter(param),
          placeholder: param.default?.toString() || "",
        },
      });

      // Quick adjust buttons
      const increment = this.getIncrementForParameter(param);
      const adjustButtons = inputContainer.createDiv({
        cls: "workout-adjust-buttons",
      });

      const minusBtn = adjustButtons.createEl("button", {
        text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_MINUS + increment,
        cls: "workout-adjust-btn workout-adjust-minus",
        attr: {
          type: "button",
          "aria-label": `Decrease ${param.label} by ${increment}`,
        },
      });

      const plusBtn = adjustButtons.createEl("button", {
        text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADJUST_PLUS + increment,
        cls: "workout-adjust-btn workout-adjust-plus",
        attr: {
          type: "button",
          "aria-label": `Increase ${param.label} by ${increment}`,
        },
      });

      minusBtn.addEventListener("click", () => {
        const current = parseFloat(input.value) || 0;
        const newValue = Math.max(param.min || 0, current - increment);
        input.value = this.formatNumericValue(newValue, param);
      });

      plusBtn.addEventListener("click", () => {
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
      const input = fieldContainer.createEl("input", {
        type: "checkbox",
        cls: "workout-charts-checkbox",
      });
      if (param.default === true) {
        input.checked = true;
      }
      return input;
    }

    // String/text input (default)
    const input = fieldContainer.createEl("input", {
      type: "text",
      cls: "workout-charts-input",
    });
    if (param.default !== undefined) {
      input.value = param.default.toString();
    }
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
    param: ParameterDefinition
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
  private getIncrementForParameter(param: ParameterDefinition): number {
    if (param.key === "reps") return 1;
    if (param.key === "weight") return this.plugin.settings.weightIncrement;
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
  private getStepForParameter(param: ParameterDefinition): string {
    if (param.key === "weight") return "0.5";
    if (param.key === "distance") return "0.1";
    if (
      param.key === "reps" ||
      param.key === "duration" ||
      param.key === "heartRate"
    )
      return "1";
    return "0.1";
  }
}
