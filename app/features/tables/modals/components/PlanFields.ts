import { AdjustField } from "@app/components/molecules/AdjustField";
import { getDynamicModalLabels } from "@app/constants";
import { MAX_PLANNED_SETS } from "@app/features/tables/exerciseBlockFields";
import { t } from "@app/i18n";

const TARGET_WEIGHT_INCREMENT = 5;
const TARGET_REPS_INCREMENT = 1;

/** The plan inputs of a `workout-log` or `workout-sets` form */
export interface PlanFieldsElements {
  targetWeight: HTMLInputElement;
  targetReps: HTMLInputElement;
  sets: HTMLInputElement;
}

/** The plan parameters (see PLAN_FIELDS); 0 or empty leaves one out */
export interface PlanValues {
  sets?: number;
  targetWeight?: number;
  targetReps?: number;
}

/**
 * Target weight, target reps and planned sets, with +/- buttons. Both block
 * forms use it, so the plan reads and writes the same in either.
 */
export const PlanFields = {
  /** @param initialSets - Planned sets a new block starts with (0 = none) */
  create(container: HTMLElement, initialSets = 0): PlanFieldsElements {
    const grid = container.createDiv({ cls: "workout-parameters-container" });
    return {
      targetWeight: AdjustField.create(grid, {
        label: getDynamicModalLabels().TARGET_WEIGHT,
        value: 0,
        min: 0,
        max: 1000,
        step: TARGET_WEIGHT_INCREMENT,
      }),
      targetReps: AdjustField.create(grid, {
        label: t("modal.labels.targetReps"),
        value: 0,
        min: 0,
        max: 100,
        step: TARGET_REPS_INCREMENT,
      }),
      sets: AdjustField.create(grid, {
        label: t("modal.labels.plannedSets"),
        value: initialSets,
        min: 0,
        max: MAX_PLANNED_SETS,
        step: 1,
      }),
    };
  },

  read(elements: PlanFieldsElements): PlanValues {
    const weight = parseFloat(elements.targetWeight.value) || 0;
    const reps = parseInt(elements.targetReps.value) || 0;
    const sets = parseInt(elements.sets.value) || 0;
    return {
      sets: sets > 0 ? sets : undefined,
      targetWeight: weight > 0 ? weight : undefined,
      targetReps: reps > 0 ? reps : undefined,
    };
  },

  /** Shows a block's plan; an unset value shows as 0, which `read` leaves out */
  fill(elements: PlanFieldsElements, plan: PlanValues): void {
    elements.targetWeight.value = String(plan.targetWeight ?? 0);
    elements.targetReps.value = String(plan.targetReps ?? 0);
    elements.sets.value = String(plan.sets ?? 0);
  },
};
