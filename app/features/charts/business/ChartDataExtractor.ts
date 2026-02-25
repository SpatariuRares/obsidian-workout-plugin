import { CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

/**
 * Extracts and maps chart data from workout log fields.
 * Handles both standard and custom exercise parameter extraction.
 */
export class ChartDataExtractor {
  /**
   * Helper to extract a number from customFields (case-insensitive key matching)
   */
  static getCustomFieldNumber(
    customFields: Record<string, string | number | boolean>,
    key: string,
  ): number {
    // Try exact key first
    if (key in customFields) {
      const value = customFields[key];
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
      }
    }
    // Try case-insensitive match
    const lowerKey = key.toLowerCase();
    for (const [k, v] of Object.entries(customFields)) {
      if (k.toLowerCase() === lowerKey) {
        if (typeof v === "number") return v;
        if (typeof v === "string") {
          const num = parseFloat(v);
          return isNaN(num) ? 0 : num;
        }
      }
    }
    return 0;
  }

  /**
   * Checks if a chartType is a standard CHART_DATA_TYPE or a custom parameter key.
   */
  static isStandardChartType(chartType: string): boolean {
    return Object.values(CHART_DATA_TYPE).includes(
      chartType as CHART_DATA_TYPE,
    );
  }

  /**
   * Get chart data array, label, and color based on chart type.
   * Supports both standard CHART_DATA_TYPE values and custom parameter keys.
   */
  static getChartDataForType(
    chartType: CHART_DATA_TYPE | string,
    displayType: CHART_TYPE,
    dataArrays: {
      volumeData: number[];
      weightData: number[];
      repsData: number[];
      durationData: number[];
      distanceData: number[];
      paceData: number[];
      heartRateData: number[];
      customData?: number[];
    },
    customParamLabel?: string,
  ): { data: number[]; label: string; color: string } {
    const isAggregate =
      displayType === CHART_TYPE.WORKOUT ||
      displayType === CHART_TYPE.COMBINED ||
      displayType === CHART_TYPE.ALL;

    const chartTypeStr = chartType as string;

    switch (chartTypeStr) {
      case "volume":
        return {
          data: dataArrays.volumeData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
          color: "#4CAF50",
        };

      case "weight":
        return {
          data: dataArrays.weightData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_WEIGHT
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_WEIGHT,
          color: "#FF9800",
        };

      case "reps":
        return {
          data: dataArrays.repsData,
          label: isAggregate ? t("general.totalReps") : t("general.avgReps"),
          color: "#FF9800",
        };

      case "duration":
        return {
          data: dataArrays.durationData,
          label: isAggregate ? "Total duration (sec)" : "Avg duration (sec)",
          color: "#2196F3",
        };

      case "distance":
        return {
          data: dataArrays.distanceData,
          label: isAggregate ? "Total distance (km)" : "Avg distance (km)",
          color: "#9C27B0",
        };

      case "pace":
        return {
          data: dataArrays.paceData,
          label: "Pace (min/km)",
          color: "#E91E63",
        };

      case "heartRate":
        return {
          data: dataArrays.heartRateData,
          label: "Avg heart rate (bpm)",
          color: "#F44336",
        };

      default:
        // Handle custom parameter keys
        if (dataArrays.customData && dataArrays.customData.length > 0) {
          const label =
            customParamLabel || ParameterUtils.keyToLabel(chartType);
          return {
            data: dataArrays.customData,
            label: isAggregate ? `Total ${label}` : `Avg ${label}`,
            color: ParameterUtils.getColorForDataType(chartType),
          };
        }

        // Fallback to volume for unknown types with no custom data
        return {
          data: dataArrays.volumeData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
          color: "#4CAF50",
        };
    }
  }
}
