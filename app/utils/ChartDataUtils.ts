import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { ChartDataset, CHART_DATA_TYPE, CHART_TYPE } from "@app/types";
import { DateUtils } from "@app/utils/DateUtils";
import { ParameterUtils } from "@app/utils/ParameterUtils";

/**
 * Utility class for chart data processing operations
 * Handles data transformation for Chart.js visualizations
 */
export class ChartDataUtils {
  /**
   * Helper to extract a number from customFields (case-insensitive key matching)
   */
  private static getCustomFieldNumber(
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
   * Get chart data array, label, and color based on chart type.
   * Supports both standard CHART_DATA_TYPE values and custom parameter keys.
   */
  private static getChartDataForType(
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
    // WORKOUT, COMBINED, and ALL show totals (aggregated data)
    // EXERCISE shows averages per entry
    const isAggregate =
      displayType === CHART_TYPE.WORKOUT ||
      displayType === CHART_TYPE.COMBINED ||
      displayType === CHART_TYPE.ALL;

    // Use string comparison to handle both CHART_DATA_TYPE enum and custom string keys
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
          label: isAggregate
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_REPS
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_REPS,
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

  /**
   * Checks if a chartType is a standard CHART_DATA_TYPE or a custom parameter key.
   */
  private static isStandardChartType(chartType: string): boolean {
    return Object.values(CHART_DATA_TYPE).includes(
      chartType as CHART_DATA_TYPE,
    );
  }

  /**
   * Process log data for chart visualization.
   * Extended to support dynamic exercise types (timed, distance, cardio, custom).
   * Custom parameter keys can be passed as chartType for custom exercise types.
   *
   * @param logData - Array of workout log data
   * @param chartType - Standard CHART_DATA_TYPE or custom parameter key
   * @param dateRange - Number of days to include
   * @param dateFormat - Format for date labels
   * @param displayType - Chart display type (EXERCISE, WORKOUT, COMBINED, ALL)
   * @param customParamLabel - Optional label for custom parameter (uses keyToLabel if not provided)
   */
  static processChartData(
    logData: WorkoutLogData[],
    chartType: CHART_DATA_TYPE | string,
    dateRange: number = 30,
    dateFormat: string = "DD/MM/YYYY",
    displayType: CHART_TYPE = CHART_TYPE.EXERCISE,
    customParamLabel?: string,
  ): { labels: string[]; datasets: ChartDataset[] } {
    // Filter by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRange);

    const filteredData = logData.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= cutoffDate;
    });

    // Sort by date
    filteredData.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Check if chartType is a custom parameter key (not a standard type)
    const isCustomParam = !this.isStandardChartType(chartType as string);
    const customParamKey = isCustomParam ? (chartType as string) : null;

    // Group by date and calculate values
    // Extended to include duration, distance, heartRate from customFields
    // Also supports custom parameter aggregation
    const dateGroups = new Map<
      string,
      {
        volume: number;
        weight: number;
        reps: number;
        duration: number;
        distance: number;
        heartRate: number;
        custom: number;
        count: number;
      }
    >();

    filteredData.forEach((log) => {
      const dateKey = DateUtils.formatDateWithFormat(log.date, dateFormat);
      const existing = dateGroups.get(dateKey) || {
        volume: 0,
        weight: 0,
        reps: 0,
        duration: 0,
        distance: 0,
        heartRate: 0,
        custom: 0,
        count: 0,
      };

      // Standard fields
      existing.volume += log.volume || 0;
      existing.weight += log.weight || 0;
      existing.reps += log.reps || 0;

      // Extract from customFields for dynamic exercise types
      if (log.customFields) {
        // Duration from customFields (case-insensitive)
        const durationValue = this.getCustomFieldNumber(
          log.customFields,
          "duration",
        );
        existing.duration += durationValue;

        // Distance from customFields
        const distanceValue = this.getCustomFieldNumber(
          log.customFields,
          "distance",
        );
        existing.distance += distanceValue;

        // Heart rate from customFields
        const heartRateValue = this.getCustomFieldNumber(
          log.customFields,
          "heartRate",
        );
        existing.heartRate += heartRateValue;

        // Custom parameter value (if chartType is a custom param key)
        if (customParamKey) {
          const customValue = this.getCustomFieldNumber(
            log.customFields,
            customParamKey,
          );
          existing.custom += customValue;
        }
      }

      existing.count += 1;
      dateGroups.set(dateKey, existing);
    });

    // Calculate values based on display type
    const labels: string[] = [];
    const volumeData: number[] = [];
    const weightData: number[] = [];
    const repsData: number[] = [];
    const durationData: number[] = [];
    const distanceData: number[] = [];
    const paceData: number[] = [];
    const heartRateData: number[] = [];
    const customData: number[] = [];

    dateGroups.forEach((values, date) => {
      labels.push(date);

      if (
        displayType === CHART_TYPE.WORKOUT ||
        displayType === CHART_TYPE.COMBINED ||
        displayType === CHART_TYPE.ALL
      ) {
        // For workout/combined/all: show total values (sum)
        volumeData.push(values.volume);
        weightData.push(values.weight);
        repsData.push(values.reps);
        durationData.push(values.duration);
        distanceData.push(values.distance);
        customData.push(values.custom);
        // Pace = total time / total distance (min/km)
        paceData.push(
          values.distance > 0 ? values.duration / values.distance : 0,
        );
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0,
        ); // Avg heart rate
      } else {
        // For single exercise: show average (current behavior)
        volumeData.push(values.count > 0 ? values.volume / values.count : 0);
        weightData.push(values.count > 0 ? values.weight / values.count : 0);
        repsData.push(values.count > 0 ? values.reps / values.count : 0);
        durationData.push(
          values.count > 0 ? values.duration / values.count : 0,
        );
        distanceData.push(
          values.count > 0 ? values.distance / values.count : 0,
        );
        customData.push(values.count > 0 ? values.custom / values.count : 0);
        // Pace = avg time / avg distance (min/km)
        const avgDuration =
          values.count > 0 ? values.duration / values.count : 0;
        const avgDistance =
          values.count > 0 ? values.distance / values.count : 0;
        paceData.push(avgDistance > 0 ? avgDuration / avgDistance : 0);
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0,
        );
      }
    });

    // Create datasets based on chart type
    const datasets: ChartDataset[] = [];

    // Build data array and label based on chart type
    const { data, label, color } = this.getChartDataForType(
      chartType,
      displayType,
      {
        volumeData,
        weightData,
        repsData,
        durationData,
        distanceData,
        paceData,
        heartRateData,
        customData,
      },
      customParamLabel,
    );

    if (data.length > 0) {
      datasets.push({
        label,
        data,
        borderColor: color,
        backgroundColor: color + "20",
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      });
    }

    return { labels, datasets };
  }
}
