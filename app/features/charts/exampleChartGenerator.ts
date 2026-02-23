import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";
import { t } from "@app/i18n";

export function getChartSectionsForExerciseType(
  name: string,
  type: string,
): string {
  switch (type) {
    case "strength":
      return `## ${t("examples.exercise.volumeChartTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.VOLUME, { showStats: true })}

## ${t("examples.exercise.weightProgressionTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.WEIGHT)}

## ${t("examples.exercise.repTrackingTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.REPS, { showTrendLine: false })}`;

    case "timed":
      return `## ${t("examples.exercise.durationChartTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.DURATION, { showStats: true })}`;

    case "cardio":
      return `## ${t("examples.exercise.durationChartTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.DURATION, { showStats: true })}

## ${t("examples.exercise.heartRateTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.HEART_RATE, { showStats: true })}`;

    case "distance":
      return `## ${t("examples.exercise.distanceChartTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.DISTANCE, { showStats: true })}

## ${t("examples.exercise.durationTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.DURATION, { showStats: true })}

## ${t("examples.exercise.paceTrackingTitle")}

${t("examples.exercise.paceTrackingNote")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.PACE, { showStats: true })}`;

    default:
      return `## ${t("examples.exercise.chartTitle")}

${generateExerciseChartBlock(name, CHART_DATA_TYPE.VOLUME, { showTrendLine: true })}`;
  }
}

export function generateWorkoutChartBlock(
  workoutName: string,
  opts?: { dateRange?: number; showStats?: boolean },
): string {
  return CodeGenerator.generateChartCode({
    chartType: CHART_TYPE.WORKOUT,
    type: CHART_DATA_TYPE.VOLUME,
    workout: workoutName,
    dateRange: opts?.dateRange ?? 60,
    limit: 50,
    showTrendLine: true,
    showTrend: true,
    showStats: opts?.showStats ?? true,
  });
}

export function generateExerciseChartBlock(
  exercise: string,
  dataType: CHART_DATA_TYPE,
  opts?: { dateRange?: number; showStats?: boolean; showTrendLine?: boolean },
): string {
  return CodeGenerator.generateChartCode({
    chartType: CHART_TYPE.EXERCISE,
    type: dataType,
    exercise,
    dateRange: opts?.dateRange ?? 30,
    limit: 50,
    showTrendLine: opts?.showTrendLine ?? true,
    showTrend: true,
    showStats: opts?.showStats ?? false,
  });
}

export function generateAllDataChartBlock(
  dataType: CHART_DATA_TYPE,
  opts?: { dateRange?: number },
): string {
  return CodeGenerator.generateChartCode({
    chartType: CHART_TYPE.ALL,
    type: dataType,
    dateRange: opts?.dateRange ?? 30,
    limit: 50,
    showTrendLine: true,
    showTrend: true,
    showStats: false,
  });
}
