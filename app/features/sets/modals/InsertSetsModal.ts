import { App, Notice } from "obsidian";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { getDynamicModalLabels } from "@app/constants";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import {
  MAX_PLANNED_SETS,
  setsBlock,
  type EmbeddedSetsParams,
} from "@app/features/sets/setsBlock";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const TARGET_WEIGHT_INCREMENT = 5;

/** Inserts a `workout-sets` block: exercise, workout, planned sets and targets */
export class InsertSetsModal extends BaseInsertModal {
  protected exerciseInput?: HTMLInputElement;
  protected workoutInput?: HTMLInputElement;
  protected setsInput?: HTMLInputElement;
  protected targetRepsInput?: HTMLInputElement;
  protected targetWeightInput?: HTMLInputElement;

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertSets");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertSets");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.setsInserted");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    if (!this.plugin) throw new Error(t("modal.errors.missingElements"));

    const target = this.createSection(container, t("modal.sections.target"));
    const { elements } = ExerciseAutocomplete.create(this, target, this.plugin, undefined, {
      showCreateButton: false,
    });
    this.exerciseInput = elements.exerciseInput;
    this.workoutInput = this.createTextField(
      target,
      t("sets.workoutLabel"),
      t("sets.workoutPlaceholder", { note: this.getCurrentFileName() }),
    );

    const plan = this.createSection(container, t("modal.sections.progressiveOverload"));
    const grid = plan.createDiv({ cls: "workout-parameters-container" });
    this.setsInput = AdjustField.create(grid, {
      label: t("modal.labels.plannedSets"),
      value: DEFAULT_SETS,
      min: 0,
      max: MAX_PLANNED_SETS,
      step: 1,
    });
    this.targetRepsInput = AdjustField.create(grid, {
      label: t("modal.labels.targetReps"),
      value: 0,
      min: 0,
      max: 100,
      step: 1,
    });
    this.targetWeightInput = AdjustField.create(grid, {
      label: getDynamicModalLabels().TARGET_WEIGHT,
      value: 0,
      min: 0,
      max: 1000,
      step: TARGET_WEIGHT_INCREMENT,
    });
  }

  protected generateCode(): string {
    const params = this.collectParams();
    if (!params.exercise) {
      new Notice(t("modal.notices.validChooseExercise"));
      throw new Error(t("modal.notices.validChooseExercise"));
    }
    return setsBlock.serialize(params);
  }

  /** The block parameters the form sets; empty or zero ones are left out */
  protected collectParams(): EmbeddedSetsParams {
    const positive = (input?: HTMLInputElement) => {
      const value = parseFloat(input?.value ?? "");
      return Number.isFinite(value) && value > 0 ? value : undefined;
    };
    const sets = positive(this.setsInput);
    return {
      id: this.getCodeBlockId(),
      exercise: this.exerciseInput?.value.trim() || undefined,
      workout: this.workoutInput?.value.trim() || undefined,
      sets: sets !== undefined ? Math.round(sets) : undefined,
      targetReps: positive(this.targetRepsInput),
      targetWeight: positive(this.targetWeightInput),
    };
  }

  /** A new id; the edit modal keeps the block's */
  protected getCodeBlockId(): string {
    return generateCodeBlockId();
  }
}
