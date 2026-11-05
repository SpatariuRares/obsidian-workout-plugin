import {
  CHART_DATA_TYPE,
  CHART_TYPE,
  isAggregateChart,
} from "@app/features/charts/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

/**
 * Extracts and maps chart data from workout log fields.
 * Handles both standard and custom exercise parameter extraction.
 */
export class ChartDataExtractor {
  /**
   * Checks if a chartType is a standard CHART_DATA_TYPE or a custom parameter key.
   */
  static isStandardChartType(chartType: string): boolean {
    return Object.values(CHART_DATA_TYPE).includes(
      chartType as CHART_DATA_TYPE,
    );
  }

  /**
   * Get chart data array and label based on chart type (ChartConfigBuilder
   * styles the dataset).
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
  ): { data: number[]; label: string } {
    const isAggregate = isAggregateChart(displayType);

    switch (chartType) {
      case "volume":
        return {
          data: dataArrays.volumeData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
        };

      case "weight":
        return {
          data: dataArrays.weightData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_WEIGHT
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_WEIGHT,
        };

      case "reps":
        return {
          data: dataArrays.repsData,
          label: isAggregate
            ? t("general.totalReps")
            : t("general.avgReps"),
        };

      case "duration":
        return {
          data: dataArrays.durationData,
          label: isAggregate
            ? t("general.labels.totalDuration")
            : t("general.labels.avgDuration"),
        };

      case "distance":
        return {
          data: dataArrays.distanceData,
          label: isAggregate
            ? t("general.labels.totalDistance")
            : t("general.labels.avgDistance"),
        };

      case "pace":
        return {
          data: dataArrays.paceData,
          label: t("general.labels.pace"),
        };

      case "heartRate":
        return {
          data: dataArrays.heartRateData,
          label: t("general.labels.avgHeartRate"),
        };

      default:
        // Handle custom parameter keys
        if (
          dataArrays.customData &&
          dataArrays.customData.length > 0
        ) {
          const label =
            customParamLabel || ParameterUtils.keyToLabel(chartType);
          return {
            data: dataArrays.customData,
            label: isAggregate
              ? t("general.labels.totalCustom", { label })
              : t("general.labels.avgCustom", { label }),
          };
        }

        // Fallback to volume for unknown types with no custom data
        return {
          data: dataArrays.volumeData,
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
        };
    }
  }
}
