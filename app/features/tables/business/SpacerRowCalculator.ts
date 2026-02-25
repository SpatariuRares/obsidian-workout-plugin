import { TableRow } from "@app/features/tables/types";
import { t } from "@app/i18n";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";

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
        icon: t("icons.tables.reps"),
        value: totalReps.toString(),
      });
      stats.push({
        icon: t("icons.tables.weight"),
        value: `${totalWeight.toFixed(1)}${ParameterUtils.getWeightUnit()}`,
      });
      stats.push({
        icon: t("icons.tables.volume"),
        value: `${totalVolume.toFixed(0)}${ParameterUtils.getWeightUnit()}`,
      });
    } else {
      if (hasDuration) {
        const durationDisplay =
          totalDuration >= 60
            ? `${Math.floor(totalDuration / 60)}m${Math.round(totalDuration % 60)}s`
            : `${Math.round(totalDuration)}s`;
        stats.push({
          icon: t("icons.tables.duration"),
          value: durationDisplay,
        });
      }

      if (hasDistance) {
        stats.push({
          icon: t("icons.tables.distance"),
          value: `${totalDistance.toFixed(2)}km`,
        });
      }

      if (hasHeartRate && heartRateCount > 0) {
        const avgHeartRate = Math.round(totalHeartRate / heartRateCount);
        stats.push({
          icon: t("icons.tables.heartRate"),
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
