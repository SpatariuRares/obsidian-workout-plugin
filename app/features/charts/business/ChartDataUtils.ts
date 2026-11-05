import { getTypeNames } from "@app/constants/ui.constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  ChartDataset,
  CHART_DATA_TYPE,
  CHART_TYPE,
  isAggregateChart,
} from "@app/features/charts/types";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import { DateUtils } from "@app/utils/DateUtils";
import { ChartDataExtractor } from "@app/features/charts/business/ChartDataExtractor";
import { fieldNumber } from "@app/services/exercise/ExerciseFields";

/** A training day (YYYY-MM-DD) as a chart label; local noon keeps the day. */
function dayLabel(day: string, dateFormat: string): string {
  // eslint-disable-next-line i18next/no-literal-string -- ISO time, not UI text
  return DateUtils.formatDateWithFormat(`${day}T12:00:00`, dateFormat);
}

/**
 * Aggregates and processes workout log data for Chart.js visualizations.
 * Groups data by date and calculates totals/averages based on display type.
 */
export class ChartDataUtils {
  /**
   * Keep only the latest `limit` points (the `limit` code block param).
   * Labels must be in ascending date order. Returns new arrays.
   */
  static limitToLatest(
    labels: string[],
    datasets: ChartDataset[],
    limit?: number,
  ): { labels: string[]; datasets: ChartDataset[] } {
    if (!limit || limit <= 0 || labels.length <= limit) {
      return { labels, datasets };
    }
    return {
      labels: labels.slice(-limit),
      datasets: datasets.map((d) => ({
        ...d,
        data: d.data.slice(-limit),
      })),
    };
  }

  /**
   * Process log data for chart visualization.
   * Extended to support dynamic exercise types (timed, distance, cardio, custom).
   * Custom parameter keys can be passed as chartType for custom exercise types.
   * `logData` is already filtered (DataFilter applies `dateRange`) and in
   * ascending date order.
   */
  static processChartData(
    logData: WorkoutLogData[],
    chartType: CHART_DATA_TYPE | string,
    dateFormat: string = "DD/MM/YYYY",
    displayType: CHART_TYPE = CHART_TYPE.EXERCISE,
    customParamLabel?: string,
  ): { labels: string[]; datasets: ChartDataset[] } {
    if (chartType === "e1rm") {
      const daily = new TrainingHistory(
        logData,
      ).estimatedOneRepMaxPerDay();
      return {
        labels: [...daily.keys()].map((day) => dayLabel(day, dateFormat)),
        datasets: daily.size
          ? [
              {
                label: getTypeNames()[CHART_DATA_TYPE.E1RM],
                data: [...daily.values()],
              },
            ]
          : [],
      };
    }

    // Check if chartType is a custom parameter key (not a standard type)
    const isCustomParam =
      !ChartDataExtractor.isStandardChartType(chartType);
    const customParamKey = isCustomParam ? chartType : null;

    // Totals of each training day
    const dateGroups = new TrainingHistory(logData).perDay((sets) => {
      const totals = {
        volume: 0,
        weight: 0,
        maxWeight: 0,
        reps: 0,
        duration: 0,
        distance: 0,
        heartRate: 0,
        custom: 0,
        count: 0,
      };
      for (const log of sets) {
        // Standard fields
        totals.volume += log.volume || 0;
        totals.weight += log.weight || 0;
        totals.maxWeight = Math.max(totals.maxWeight, log.weight || 0);
        totals.reps += log.reps || 0;

        // Fields of dynamic exercise types, however their column is written
        totals.duration += fieldNumber(log, "duration") ?? 0;
        totals.distance += fieldNumber(log, "distance") ?? 0;
        totals.heartRate += fieldNumber(log, "heartRate") ?? 0;
        // Custom parameter value (if chartType is a custom param key)
        if (customParamKey) {
          totals.custom += fieldNumber(log, customParamKey) ?? 0;
        }

        totals.count += 1;
      }
      return totals;
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

    dateGroups.forEach((values, day) => {
      labels.push(dayLabel(day, dateFormat));

      if (isAggregateChart(displayType)) {
        // For workout/combined/all: totals, but weight is the heaviest set
        volumeData.push(values.volume);
        weightData.push(values.maxWeight);
        repsData.push(values.reps);
        durationData.push(values.duration);
        distanceData.push(values.distance);
        customData.push(values.custom);
        paceData.push(
          values.distance > 0 ? values.duration / values.distance : 0,
        );
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0,
        );
      } else {
        // For single exercise: show average
        volumeData.push(
          values.count > 0 ? values.volume / values.count : 0,
        );
        weightData.push(
          values.count > 0 ? values.weight / values.count : 0,
        );
        repsData.push(
          values.count > 0 ? values.reps / values.count : 0,
        );
        durationData.push(
          values.count > 0 ? values.duration / values.count : 0,
        );
        distanceData.push(
          values.count > 0 ? values.distance / values.count : 0,
        );
        customData.push(
          values.count > 0 ? values.custom / values.count : 0,
        );
        const avgDuration =
          values.count > 0 ? values.duration / values.count : 0;
        const avgDistance =
          values.count > 0 ? values.distance / values.count : 0;
        paceData.push(
          avgDistance > 0 ? avgDuration / avgDistance : 0,
        );
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0,
        );
      }
    });

    // Build data array and label based on chart type
    const datasets: ChartDataset[] = [];
    const { data, label } =
      ChartDataExtractor.getChartDataForType(
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
      // ChartConfigBuilder.styleMainDataset styles it before drawing
      datasets.push({ label, data });
    }

    return { labels, datasets };
  }
}
