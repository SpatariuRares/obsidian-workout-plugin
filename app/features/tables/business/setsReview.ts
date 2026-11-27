import {
  blockExercises,
  blockProtocol,
  isSupersetBlock,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import { describeTarget } from "@app/features/modals/log/LogHistory";
import { ProtocolCatalog } from "@app/services/protocols/ProtocolCatalog";
import type { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";

export interface ReviewContext {
  weightUnit: string;
  /** The note the block is written in: the workout when none is named */
  noteName: string;
  targetWeightLabel: string;
  customProtocols?: CustomProtocolConfig[];
}

/** Label/value pairs summarizing what the sets wizard will write */
export function reviewRows(
  params: EmbeddedSetsParams,
  ctx: ReviewContext,
): Array<[string, string]> {
  const superset = isSupersetBlock(params);
  const rows: Array<[string, string]> = [];

  const proto = blockProtocol(params);
  if (proto) {
    const catalog = new ProtocolCatalog(ctx.customProtocols);
    rows.push([t("modal.protocol"), catalog.resolve(proto).name]);
  }

  if (superset) {
    rows.push([t("modal.wizard.exercises"), blockExercises(params).join(" + ")]);
  } else {
    rows.push([t("modal.labels.exercise"), params.exercise ?? ""]);
  }

  rows.push([
    t("sets.workoutLabel"),
    params.workout ?? t("sets.wizard.workoutDefault", { note: ctx.noteName }),
  ]);

  if (superset) {
    if (params.sets) rows.push([t("modal.rounds"), String(params.sets)]);
    if (params.warmups) rows.push([t("modal.wizard.warmupRounds"), String(params.warmups)]);
    if (params.restBetween) {
      rows.push([
        t("modal.wizard.restBetweenLabel"),
        FormatUtils.formatDuration(params.restBetween),
      ]);
    }
    const roundRestValue = params.rest
      ? FormatUtils.formatDuration(params.rest)
      : params.restBetween && params.restBetween > 0
        ? t("modal.wizard.restRoundFallbackHelper", {
            duration: FormatUtils.formatDuration(params.restBetween),
          })
        : t("sets.wizard.restSectionTimer");
    rows.push([t("modal.wizard.restRoundLabel"), roundRestValue]);
    return rows;
  }

  if (params.sets) rows.push([t("modal.labels.plannedSets"), String(params.sets)]);
  if (params.warmups) rows.push([t("modal.wizard.warmupSets"), String(params.warmups)]);

  if (params.targetWeight && params.targetReps) {
    const target = describeTarget(params.targetReps, params.targetWeight, ctx.weightUnit);
    if (target) rows.push([t("modal.sections.target"), target]);
  } else if (params.targetWeight) {
    rows.push([ctx.targetWeightLabel, `${params.targetWeight} ${ctx.weightUnit}`]);
  } else if (params.targetReps) {
    rows.push([t("modal.labels.targetReps"), String(params.targetReps)]);
  }

  rows.push([
    t("modal.rest"),
    params.rest
      ? t("sets.wizard.restValue", { seconds: params.rest })
      : t("sets.wizard.restSectionTimer"),
  ]);
  return rows;
}
