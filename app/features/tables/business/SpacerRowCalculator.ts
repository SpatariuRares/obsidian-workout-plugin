import { TableRow } from "@app/features/tables/types";
import { t } from "@app/i18n";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { ICONS, getUnitsMap } from "@app/constants/ui.constants";
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import { FormatUtils } from "@app/utils/FormatUtils";
import { fieldNumber } from "@app/services/exercise/ExerciseFields";

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

      // In seconds; without a known unit the stored value counts as seconds
      const duration = r.durationSeconds ?? fieldNumber(log, "duration");
      if (duration !== undefined && duration > 0) {
        hasDuration = true;
        totalDuration += duration;
      }

      const distance = fieldNumber(log, "distance");
      if (distance !== undefined && distance > 0) {
        hasDistance = true;
        totalDistance += distance;
      }

      const heartRate = fieldNumber(log, "heartRate");
      if (heartRate !== undefined && heartRate > 0) {
        hasHeartRate = true;
        totalHeartRate += heartRate;
        heartRateCount++;
      }
    });

    const stats: SpacerStatData[] = [];
    const units = getUnitsMap();

    if (hasStrengthData) {
      stats.push({
        icon: ICONS.METRICS.REPS,
        value: totalReps.toString(),
      });
      stats.push({
        icon: ICONS.METRICS.WEIGHT,
        value: `${totalWeight.toFixed(1)}${ParameterUtils.getWeightUnit()}`,
      });
      stats.push({
        icon: ICONS.METRICS.VOLUME,
        value: `${totalVolume.toFixed(0)}${ParameterUtils.getWeightUnit()}`,
      });
    } else {
      if (hasDuration) {
        stats.push({
          icon: ICONS.METRICS.DURATION,
          value: FormatUtils.formatDuration(totalDuration),
        });
      }

      if (hasDistance) {
        stats.push({
          icon: ICONS.METRICS.DISTANCE,
          value: `${totalDistance.toFixed(2)}${units[CHART_DATA_TYPE.DISTANCE]}`,
        });
      }

      if (hasHeartRate && heartRateCount > 0) {
        const avgHeartRate = Math.round(
          totalHeartRate / heartRateCount,
        );
        stats.push({
          icon: ICONS.METRICS.HEART_RATE,
          value: `${avgHeartRate}${units[CHART_DATA_TYPE.HEART_RATE]}`,
        });
      }

      if (!hasDuration && !hasDistance && !hasHeartRate) {
        stats.push({
          value: t("table.setCount", { count: groupRows.length }),
        });
      }
    }

    return { stats };
  }
}
