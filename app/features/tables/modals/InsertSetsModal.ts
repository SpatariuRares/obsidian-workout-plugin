import { App } from "obsidian";
import { WizardModal, type WizardStep } from "@app/features/modals/base/WizardModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  PlanFields,
  type PlanFieldsElements,
} from "@app/features/tables/modals/components/PlanFields";
import { getDynamicModalLabels } from "@app/constants";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const REST_INCREMENT = 15;

/**
 * Inserts a `workout-sets` block through three steps: Exercise (exercise and
 * workout), Plan (planned sets and targets) and Rest, with a review of the
 * choices before Insert
 */
export class InsertSetsModal extends WizardModal {
  protected exerciseInput?: HTMLInputElement;
  protected workoutInput?: HTMLInputElement;
  protected planFields?: PlanFieldsElements;
  protected restInput?: HTMLInputElement;
  /** The rest the form starts with; 0 leaves `rest` out */
  protected defaultRest = 0;

  private planContext?: HTMLElement;
  private review?: HTMLElement;

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

  protected getSteps(): WizardStep[] {
    return [
      {
        id: "exercise",
        label: t("wizard.steps.exercise"),
        render: (el) => this.renderExerciseStep(el),
        validate: () => this.validateExercise(),
        isComplete: () => this.exerciseName() !== "",
      },
      {
        id: "plan",
        label: t("wizard.steps.plan"),
        render: (el) => this.renderPlanStep(el),
        onEnter: () => this.refreshPlanContext(),
      },
      {
        id: "rest",
        label: t("wizard.steps.rest"),
        render: (el) => this.renderRestStep(el),
        onEnter: () => this.refreshReview(),
      },
    ];
  }

  private renderExerciseStep(el: HTMLElement): void {
    if (!this.plugin) throw new Error(t("modal.errors.missingElements"));
    const target = this.createSection(el, t("modal.sections.target"));
    const { elements } = ExerciseAutocomplete.create(this, target, this.plugin, undefined, {
      showCreateButton: false,
    });
    this.exerciseInput = elements.exerciseInput;
    this.workoutInput = this.createTextField(
      target,
      t("sets.workoutLabel"),
      t("sets.workoutPlaceholder", { note: this.getCurrentFileName() }),
    );
  }

  private renderPlanStep(el: HTMLElement): void {
    this.planContext = el.createDiv({ cls: "workout-wizard-context" });
    const plan = this.createSection(el, t("modal.sections.progressiveOverload"));
    this.planFields = PlanFields.create(plan, DEFAULT_SETS);
  }

  private renderRestStep(el: HTMLElement): void {
    const rest = this.createSection(el, t("modal.rest"));
    // 0 leaves `rest` out: the rest of the section's workout-timer
    this.restInput = AdjustField.create(rest, {
      label: t("sets.restLabel"),
      value: this.defaultRest,
      min: 0,
      max: 600,
      step: REST_INCREMENT,
      unit: "s",
    });
    this.restInput.addEventListener("input", () => this.refreshReview());
    this.restInput.addEventListener("change", () => this.refreshReview());
    el.createEl("h3", { text: t("sets.wizard.review"), cls: "workout-wizard-review-title" });
    this.review = el.createDiv({ cls: "workout-wizard-review" });
  }

  private exerciseName(): string {
    return this.exerciseInput?.value.trim() ?? "";
  }

  private validateExercise(): boolean {
    const ok = this.exerciseName() !== "";
    this.setStepError(
      "exercise",
      ok ? null : t("modal.notices.validChooseExercise"),
      this.exerciseInput,
    );
    return ok;
  }

  private refreshPlanContext(): void {
    this.planContext?.setText(t("sets.wizard.planningFor", { exercise: this.exerciseName() }));
  }

  /** A compact key/value summary of what Insert will write */
  private refreshReview(): void {
    const review = this.review;
    if (!review) return;
    review.empty();
    const params = this.collectParams();
    const labels = getDynamicModalLabels();
    const rows: Array<[string, string]> = [
      [t("modal.labels.exercise"), params.exercise ?? ""],
      [t("sets.workoutLabel"), params.workout ?? t("sets.wizard.workoutDefault", { note: this.getCurrentFileName() })],
    ];
    if (params.sets) rows.push([t("modal.labels.plannedSets"), String(params.sets)]);
    if (params.targetWeight) rows.push([labels.TARGET_WEIGHT, String(params.targetWeight)]);
    if (params.targetReps) rows.push([t("modal.labels.targetReps"), String(params.targetReps)]);
    rows.push([
      t("modal.rest"),
      params.rest
        ? t("sets.wizard.restValue", { seconds: params.rest })
        : t("sets.wizard.restSectionTimer"),
    ]);
    for (const [key, value] of rows) {
      const row = review.createDiv({ cls: "workout-wizard-review-row" });
      row.createSpan({ cls: "workout-wizard-review-key", text: key });
      row.createSpan({ cls: "workout-wizard-review-value", text: value });
    }
  }

  protected generateCode(): string {
    return setsBlock.serialize({ id: generateCodeBlockId(), ...this.collectParams() });
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
