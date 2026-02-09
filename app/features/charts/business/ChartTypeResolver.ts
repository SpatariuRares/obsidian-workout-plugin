import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { CHART_DATA_TYPE, CHART_TYPE, EmbeddedChartParams } from "@app/features/charts/types";
import {
  getDefaultChartDataType,
  isValidChartDataType,
  getAvailableChartDataTypes,
} from "@app/features/charts/config/ChartConstants";
import WorkoutChartsPlugin from "main";
import { ParameterUtils } from "@app/utils";

/**
 * Resolves and validates chart data types based on exercise definitions.
 * Extracted from EmbeddedChartView to separate business logic from rendering.
 */
export class ChartTypeResolver {
  /**
   * Resolves the chart data type based on exercise definition.
   * If a type is explicitly provided, uses that.
   * Otherwise determines the default type based on the exercise's type definition.
   */
  static async resolve(
    plugin: WorkoutChartsPlugin,
    params: EmbeddedChartParams,
  ): Promise<CHART_DATA_TYPE> {
    // If type is explicitly provided, use it
    if (params.type) {
      return params.type;
    }

    // Try to get exercise definition to determine default type
    if (params.exercise) {
      const exerciseDefService = plugin.getExerciseDefinitionService();
      if (exerciseDefService) {
        const exerciseType = await exerciseDefService.getExerciseType(
          params.exercise,
        );
        const customNumericParams = this.getNumericParamKeys(
          exerciseType.parameters,
        );
        const defaultType = getDefaultChartDataType(
          exerciseType.id,
          customNumericParams,
        );
        return defaultType as CHART_DATA_TYPE;
      }
    }

    // Fallback to volume for backward compatibility
    return CHART_DATA_TYPE.VOLUME;
  }

  /**
   * Validates that the requested chart data type is available for the exercise type.
   * If the exercise has no explicit definition (defaults to strength), allow any type
   * for backward compatibility.
   */
  static async validate(
    plugin: WorkoutChartsPlugin,
    params: EmbeddedChartParams,
    chartDataType: CHART_DATA_TYPE,
  ): Promise<{ isValid: boolean; errorMessage: string }> {
    // If no exercise filter or chartType is ALL, allow any type
    if (!params.exercise || params.chartType === CHART_TYPE.ALL) {
      return { isValid: true, errorMessage: "" };
    }

    const exerciseDefService = plugin.getExerciseDefinitionService();
    if (!exerciseDefService) {
      return { isValid: true, errorMessage: "" };
    }

    // Check if exercise has an explicit definition
    const exerciseDefinition = await exerciseDefService.getExerciseDefinition(
      params.exercise,
    );

    // If no explicit definition found, allow any chart type (backward compatible)
    if (!exerciseDefinition) {
      return { isValid: true, errorMessage: "" };
    }

    const exerciseType = await exerciseDefService.getExerciseType(
      params.exercise,
    );
    const customNumericParams = this.getNumericParamKeys(
      exerciseType.parameters,
    );

    // Check if the requested type is valid for this exercise type
    if (
      !isValidChartDataType(exerciseType.id, chartDataType, customNumericParams)
    ) {
      const availableTypes = getAvailableChartDataTypes(
        exerciseType.id,
        customNumericParams,
      );
      const typeList =
        availableTypes.length > 0
          ? availableTypes.join(", ")
          : "no chart types available";
      return {
        isValid: false,
        errorMessage: `Chart type "${chartDataType}" is not available for ${exerciseType.name} exercises. Available types: ${typeList}`,
      };
    }

    return { isValid: true, errorMessage: "" };
  }

  /**
   * Extracts numeric parameter keys from parameter definitions.
   */
  private static getNumericParamKeys(parameters: ParameterDefinition[]): string[] {
    return ParameterUtils.getNumericParamKeys(parameters);
  }
}
