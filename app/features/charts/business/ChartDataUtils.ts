import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { ChartDataset, CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";
import { DateUtils } from "@app/utils/DateUtils";
import { ChartDataExtractor } from "@app/features/charts/business/ChartDataExtractor";

/**
 * Aggregates and processes workout log data for Chart.js visualizations.
 * Groups data by date and calculates totals/averages based on display type.
 */
export class ChartDataUtils {
  /**
   * Process log data for chart visualization.
   * Extended to support dynamic exercise types (timed, distance, cardio, custom).
   * Custom parameter keys can be passed as chartType for custom exercise types.
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
    const isCustomParam = !ChartDataExtractor.isStandardChartType(chartType as string);
    const customParamKey = isCustomParam ? (chartType as string) : null;

    // Group by date and calculate values
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
        existing.duration += ChartDataExtractor.getCustomFieldNumber(
          log.customFields,
          "duration",
        );
        existing.distance += ChartDataExtractor.getCustomFieldNumber(
          log.customFields,
          "distance",
        );
        existing.heartRate += ChartDataExtractor.getCustomFieldNumber(
          log.customFields,
          "heartRate",
        );

        // Custom parameter value (if chartType is a custom param key)
        if (customParamKey) {
          existing.custom += ChartDataExtractor.getCustomFieldNumber(
            log.customFields,
            customParamKey,
          );
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
        paceData.push(
          values.distance > 0 ? values.duration / values.distance : 0,
        );
        heartRateData.push(
          values.count > 0 ? values.heartRate / values.count : 0,
        );
      } else {
        // For single exercise: show average
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

    // Build data array and label based on chart type
    const datasets: ChartDataset[] = [];
    const { data, label, color } = ChartDataExtractor.getChartDataForType(
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
