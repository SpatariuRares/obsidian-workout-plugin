import { CONSTANTS } from "@app/constants";
import { TableRow } from "@app/features/tables/types";

export interface SpacerStatData {
  icon?: string;
  value: string;
}

export interface SpacerRowData {
  stats: SpacerStatData[];
}

/**
 * Pure business logic for calculating spacer row summary stats.
 * Aggregates metrics for a group of rows sharing the same date.
 */
export class SpacerRowCalculator {
  /**
   * Calculate summary stats for a group of table rows.
   * Determines whether to show strength metrics or cardio/timed metrics.
   */
  static calculate(groupRows: TableRow[]): SpacerRowData {
    let totalVolume = 0;
    let totalWeight = 0;
    let totalReps = 0;

    let totalDuration = 0;
    let totalDistance = 0;
    let totalHeartRate = 0;
    let heartRateCount = 0;

    let hasStrengthData = false;
    let hasDuration = false;
    let hasDistance = false;
    let hasHeartRate = false;

    groupRows.forEach((r) => {
      const log = r.originalLog;
      if (!log) return;

      if (log.reps > 0 || log.weight > 0) {
        hasStrengthData = true;
        totalVolume += log.volume || 0;
        totalWeight += log.weight || 0;
        totalReps += log.reps || 0;
      }

      if (log.customFields) {
        const duration = log.customFields["duration"];
        if (typeof duration === "number" && duration > 0) {
          hasDuration = true;
          totalDuration += duration;
        }

        const distance = log.customFields["distance"];
        if (typeof distance === "number" && distance > 0) {
          hasDistance = true;
          totalDistance += distance;
        }

        const heartRate =
          log.customFields["heartrate"] || log.customFields["heartRate"];
        if (typeof heartRate === "number" && heartRate > 0) {
          hasHeartRate = true;
          totalHeartRate += heartRate;
          heartRateCount++;
        }
      }
    });

    const stats: SpacerStatData[] = [];

    if (hasStrengthData) {
      stats.push({
        icon: CONSTANTS.WORKOUT.TABLE.ICONS.REPS,
        value: totalReps.toString(),
      });
      stats.push({
        icon: CONSTANTS.WORKOUT.TABLE.ICONS.WEIGHT,
        value: `${totalWeight.toFixed(1)}kg`,
      });
      stats.push({
        icon: CONSTANTS.WORKOUT.TABLE.ICONS.VOLUME,
        value: totalVolume.toFixed(0),
      });
    } else {
      if (hasDuration) {
        const durationDisplay =
          totalDuration >= 60
            ? `${Math.floor(totalDuration / 60)}m${Math.round(totalDuration % 60)}s`
            : `${Math.round(totalDuration)}s`;
        stats.push({
          icon: CONSTANTS.WORKOUT.TABLE.ICONS.DURATION,
          value: durationDisplay,
        });
      }

      if (hasDistance) {
        stats.push({
          icon: CONSTANTS.WORKOUT.TABLE.ICONS.DISTANCE,
          value: `${totalDistance.toFixed(2)}km`,
        });
      }

      if (hasHeartRate && heartRateCount > 0) {
        const avgHeartRate = Math.round(totalHeartRate / heartRateCount);
        stats.push({
          icon: CONSTANTS.WORKOUT.TABLE.ICONS.HEART_RATE,
          value: `${avgHeartRate}bpm`,
        });
      }

      if (!hasDuration && !hasDistance && !hasHeartRate) {
        stats.push({
          value: `${groupRows.length} sets`,
        });
      }
    }

    return { stats };
  }
}
