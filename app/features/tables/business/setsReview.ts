import type { EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import { t } from "@app/i18n";

export interface ReviewContext {
  weightUnit: string;
  /** The note the block is written in: the workout when none is named */
  noteName: string;
  targetWeightLabel: string;
}

/** Label/value pairs summarizing what the sets wizard will write */
export function reviewRows(
  params: EmbeddedSetsParams,
  ctx: ReviewContext,
): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    [t("modal.labels.exercise"), params.exercise ?? ""],
    [
      t("sets.workoutLabel"),
      params.workout ?? t("sets.wizard.workoutDefault", { note: ctx.noteName }),
    ],
  ];
  if (params.sets) rows.push([t("modal.labels.plannedSets"), String(params.sets)]);
  if (params.targetWeight) {
    rows.push([ctx.targetWeightLabel, `${params.targetWeight} ${ctx.weightUnit}`]);
  }
  if (params.targetReps) rows.push([t("modal.labels.targetReps"), String(params.targetReps)]);
  rows.push([
    t("modal.rest"),
    params.rest
      ? t("sets.wizard.restValue", { seconds: params.rest })
      : t("sets.wizard.restSectionTimer"),
  ]);
  return rows;
}
