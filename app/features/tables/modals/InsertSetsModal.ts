import { App, Notice } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  PlanFields,
  type PlanFieldsElements,
} from "@app/features/tables/modals/components/PlanFields";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const REST_INCREMENT = 15;

/** Inserts a `workout-sets` block: exercise, workout, planned sets and targets */
export class InsertSetsModal extends BaseInsertModal {
  protected exerciseInput?: HTMLInputElement;
  protected workoutInput?: HTMLInputElement;
  protected planFields?: PlanFieldsElements;
  protected restInput?: HTMLInputElement;

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
    this.planFields = PlanFields.create(plan, DEFAULT_SETS);
    // 0 leaves `rest` out: the rest of the section's workout-timer
    this.restInput = AdjustField.create(plan, {
      label: t("sets.restLabel"),
      value: 0,
      min: 0,
      max: 600,
      step: REST_INCREMENT,
      unit: "s",
    });
  }

  protected generateCode(): string {
    const params = this.collectParams();
    if (!params.exercise) {
      new Notice(t("modal.notices.validChooseExercise"));
      throw new Error(t("modal.notices.validChooseExercise"));
    }
    return setsBlock.serialize({ id: generateCodeBlockId(), ...params });
  }

  /** The block parameters the form sets; empty or zero ones are left out */
  protected collectParams(): EmbeddedSetsParams {
    return {
      exercise: this.exerciseInput?.value.trim() || undefined,
      workout: this.workoutInput?.value.trim() || undefined,
      ...(this.planFields ? PlanFields.read(this.planFields) : {}),
      rest: parseInt(this.restInput?.value ?? "") || undefined,
    };
  }
}
