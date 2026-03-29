import { ParameterDefinition } from "@app/types/ExerciseTypes";

import { Notice } from "obsidian";
import { t } from "@app/i18n";

export class LogFormValidator {
  /**
   * Validates form data based on current exercise parameters.
   * @returns true if valid, false otherwise
   */
  static validateDynamicLogData(
    exercise: string,
    dynamicFieldInputs: Map<string, HTMLInputElement>,
    currentParameters: ParameterDefinition[],
  ): boolean {
    // Exercise is always required
    if (!exercise) {
      new Notice(t("modal.notices.validationFillAll"));
      return false;
    }

    // Validate each required parameter
    for (const param of currentParameters) {
      if (!param.required) continue;

      const input = dynamicFieldInputs.get(param.key);
      if (!input) {
        new Notice(t("modal.notices.validMissingField", { field: param.label }));
        return false;
      }

      const value = input.value.trim();

      if (param.type === "number") {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          new Notice(t("modal.notices.validMustBeNumber", { field: param.label }));
          return false;
        }

        // Check min/max
        if (param.min !== undefined && numValue < param.min) {
          new Notice(t("modal.notices.validMinValue", { field: param.label, min: param.min }));
          return false;
        }
        if (param.max !== undefined && numValue > param.max) {
          new Notice(t("modal.notices.validMaxValue", { field: param.label, max: param.max }));
          return false;
        }
      } else if (param.type === "string" && !value) {
        new Notice(t("modal.notices.validFieldRequired", { field: param.label }));
        return false;
      }
    }

    return true;
  }
}
