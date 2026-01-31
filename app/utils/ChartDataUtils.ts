import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  ChartDataset,
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/types";

/**
 * Utility class for chart data processing operations
 * Handles data transformation for Chart.js visualizations
 */
export class ChartDataUtils {
  /**
   * Format date for display in charts
   */
  static formatDate(
    date: string | Date,
    format: string = "DD/MM/YYYY"
  ): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    switch (format) {
      case "YYYY-MM-DD":
        return `${year}-${month}-${day}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD/MM/YYYY":
      default:
        return `${day}/${month}/${year}`;
    }
  }

  /**
   * Helper to extract a number from customFields (case-insensitive key matching)
   */
  private static getCustomFieldNumber(
    customFields: Record<string, string | number | boolean>,
    key: string
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
   * Get chart data array, label, and color based on chart type
   */
  private static getChartDataForType(
    chartType: CHART_DATA_TYPE,
    displayType: CHART_TYPE,
    dataArrays: {
      volumeData: number[];
      weightData: number[];
      repsData: number[];
      durationData: number[];
      distanceData: number[];
      paceData: number[];
      heartRateData: number[];
    }
  ): { data: number[]; label: string; color: string } {
    const isWorkout = displayType === CHART_TYPE.WORKOUT;

    switch (chartType) {
      case CHART_DATA_TYPE.VOLUME:
        return {
          data: dataArrays.volumeData,
          label: isWorkout
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
          color: "#4CAF50",
        };

      case CHART_DATA_TYPE.WEIGHT:
        return {
          data: dataArrays.weightData,
          label: isWorkout
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_WEIGHT
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_WEIGHT,
          color: "#FF9800",
        };

      case CHART_DATA_TYPE.REPS:
        return {
          data: dataArrays.repsData,
          label: isWorkout
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_REPS
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_REPS,
          color: "#FF9800",
        };

      case CHART_DATA_TYPE.DURATION:
        return {
          data: dataArrays.durationData,
          label: isWorkout ? "Total duration" : "Avg duration",
          color: "#2196F3",
        };

      case CHART_DATA_TYPE.DISTANCE:
        return {
          data: dataArrays.distanceData,
          label: isWorkout ? "Total distance" : "Avg distance",
          color: "#9C27B0",
        };

      case CHART_DATA_TYPE.PACE:
        return {
          data: dataArrays.paceData,
          label: "Pace (min/km)",
          color: "#E91E63",
        };

      case CHART_DATA_TYPE.HEART_RATE:
        return {
          data: dataArrays.heartRateData,
          label: "Avg heart rate (bpm)",
          color: "#F44336",
        };

      default:
        // Fallback to volume for unknown types
        return {
          data: dataArrays.volumeData,
          label: isWorkout
            ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
            : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
          color: "#4CAF50",
        };
    }
  }

  /**
   * Process log data for chart visualization
   * Extended to support dynamic exercise types (timed, distance, cardio, custom)
   */
  static processChartData(
    logData: WorkoutLogData[],
    chartType: CHART_DATA_TYPE,
    dateRange: number = 30,
    dateFormat: string = "DD/MM/YYYY",
    displayType: CHART_TYPE = CHART_TYPE.EXERCISE
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
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Group by date and calculate values
    // Extended to include duration, distance, heartRate from customFields
    const dateGroups = new Map<
      string,
      {
        volume: number;
        weight: number;
        reps: number;
        duration: number;
        distance: number;
        heartRate: number;
        count: number;
      }
    >();

    filteredData.forEach((log) => {
      const dateKey = this.formatDate(log.date, dateFormat);
      const existing = dateGroups.get(dateKey) || {
        volume: 0,
        weight: 0,
        reps: 0,
        duration: 0,
        distance: 0,
        heartRate: 0,
        count: 0,
      };

      // Standard fields
      existing.volume += log.volume || 0;
      existing.weight += log.weight || 0;
      existing.reps += log.reps || 0;

      // Extract from customFields for dynamic exercise types
      if (log.customFields) {
        // Duration from customFields (case-insensitive)
        const durationValue = this.getCustomFieldNumber(log.customFields, "duration");
        existing.duration += durationValue;

        // Distance from customFields
        const distanceValue = this.getCustomFieldNumber(log.customFields, "distance");
        existing.distance += distanceValue;

        // Heart rate from customFields
        const heartRateValue =
          this.getCustomFieldNumber(log.customFields, "heartRate") ||
          this.getCustomFieldNumber(log.customFields, "heartrate");
        existing.heartRate += heartRateValue;
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

    dateGroups.forEach((values, date) => {
      labels.push(date);

      if (displayType === CHART_TYPE.WORKOUT) {
        // For total workout: show total values (sum)
        volumeData.push(values.volume);
        weightData.push(values.weight);
        repsData.push(values.reps);
        durationData.push(values.duration);
        distanceData.push(values.distance);
        // Pace = total time / total distance (min/km)
        paceData.push(
          values.distance > 0 ? values.duration / values.distance : 0
        );
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0
        ); // Avg heart rate
      } else {
        // For single exercise: show average (current behavior)
        volumeData.push(values.count > 0 ? values.volume / values.count : 0);
        weightData.push(values.count > 0 ? values.weight / values.count : 0);
        repsData.push(values.count > 0 ? values.reps / values.count : 0);
        durationData.push(values.count > 0 ? values.duration / values.count : 0);
        distanceData.push(values.count > 0 ? values.distance / values.count : 0);
        // Pace = avg time / avg distance (min/km)
        const avgDuration = values.count > 0 ? values.duration / values.count : 0;
        const avgDistance = values.count > 0 ? values.distance / values.count : 0;
        paceData.push(avgDistance > 0 ? avgDuration / avgDistance : 0);
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0
        );
      }
    });

    // Create datasets based on chart type
    const datasets: ChartDataset[] = [];

    // Build data array and label based on chart type
    const { data, label, color } = this.getChartDataForType(chartType, displayType, {
      volumeData,
      weightData,
      repsData,
      durationData,
      distanceData,
      paceData,
      heartRateData,
    });

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

 