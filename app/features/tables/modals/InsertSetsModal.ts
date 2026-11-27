import { App, Notice } from "obsidian";
import {
  WizardModal,
  type WizardStep,
} from "@app/features/modals/base/WizardModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  PlanFields,
  type PlanFieldsElements,
} from "@app/features/tables/modals/components/PlanFields";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { FormatUtils } from "@app/utils/FormatUtils";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const REST_INCREMENT = 15;
let nextExerciseErrorId = 0;

export interface InsertSetsState {
  exercise: string;
  workout: string;
  sets?: number;
  targetWeight?: number;
  targetReps?: number;
  rest: number;
}

/**
 * Inserts a `workout-sets` block using a 3-step wizard:
 * Exercise -> Plan -> Rest & Review.
 */
export class InsertSetsModal extends WizardModal<InsertSetsState> {
  protected exerciseInput?: HTMLInputElement;
  protected workoutInput?: HTMLInputElement;
  protected planFields?: PlanFieldsElements;
  protected restInput?: HTMLInputElement;
  /** The rest the form starts with; 0 leaves `rest` out */
  protected defaultRest = 0;

  private exerciseErrorEl?: HTMLElement;
  private reviewContainer?: HTMLElement;

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

  protected createInitialState(): InsertSetsState {
    return {
      exercise: "",
      workout: "",
      sets: DEFAULT_SETS,
      targetWeight: undefined,
      targetReps: undefined,
      rest: this.defaultRest,
    };
  }

  protected getSteps(): WizardStep<InsertSetsState>[] {
    return [
      {
        id: "exercise",
        label: t("modal.wizard.steps.exercise"),
        isComplete: (state) => state.exercise.trim().length > 0,
        validate: (state) => this.validateExerciseStep(state),
        render: (container, state) => this.renderExerciseStep(container, state),
      },
      {
        id: "plan",
        label: t("modal.wizard.steps.plan"),
        render: (container, state) => this.renderPlanStep(container, state),
      },
      {
        id: "rest",
        label: t("modal.wizard.steps.rest"),
        render: (container, state) => this.renderRestStep(container, state),
      },
    ];
  }

  protected onSubmit(_state: InsertSetsState): void {
    const code = this.generateCode();
    this.insertIntoEditor(code, this.getSuccessMessage());
    this.close();
  }

  private renderExerciseStep(
    container: HTMLElement,
    state: InsertSetsState,
  ): void {
    if (!this.plugin) throw new Error(t("modal.errors.missingElements"));

    const target = this.createSection(container, t("modal.sections.target"));
    const { elements } = ExerciseAutocomplete.create(
      this,
      target,
      this.plugin,
      state.exercise,
      { showCreateButton: false },
    );
    this.exerciseInput = elements.exerciseInput;

    const fieldWrapper = this.exerciseInput.parentElement ?? target;
    const errorId = `workout-sets-exercise-error-${++nextExerciseErrorId}`;
    this.exerciseErrorEl = fieldWrapper.createDiv({
      cls: "workout-field-error",
      attr: { id: errorId, role: "alert" },
    });
    this.exerciseErrorEl.hidden = true;

    const syncExercise = () => {
      state.exercise = this.exerciseInput?.value ?? "";
      if (state.exercise.trim().length > 0) {
        this.setExerciseError();
      }
      this.notifyStateChange();
    };
    this.exerciseInput.addEventListener("input", syncExercise);
    this.exerciseInput.addEventListener("change", syncExercise);

    this.workoutInput = this.createTextField(
      target,
      t("sets.workoutLabel"),
      t("sets.workoutPlaceholder", { note: this.getCurrentFileName() }),
      state.workout,
    );
    const syncWorkout = () => {
      state.workout = this.workoutInput?.value ?? "";
    };
    this.workoutInput.addEventListener("input", syncWorkout);
    this.workoutInput.addEventListener("change", syncWorkout);
  }

  private validateExerciseStep(state: InsertSetsState): boolean {
    const active = this.isActiveStepElement(this.exerciseInput);
    if (active) {
      state.exercise = this.exerciseInput!.value;
    }
    if (!state.exercise.trim()) {
      if (active) {
        this.setExerciseError(t("modal.notices.validChooseExercise"));
        this.exerciseInput?.focus();
      }
      return false;
    }
    if (active) {
      this.setExerciseError();
    }
    return true;
  }

  private setExerciseError(message?: string): void {
    if (!this.exerciseErrorEl || !this.exerciseInput) return;
    this.exerciseErrorEl.textContent = message ?? "";
    this.exerciseErrorEl.hidden = !message;
    this.exerciseInput.parentElement?.classList.toggle("is-invalid", !!message);
    if (message) {
      this.exerciseInput.setAttribute("aria-invalid", "true");
      this.exerciseInput.setAttribute(
        "aria-describedby",
        this.exerciseErrorEl.id,
      );
    } else {
      this.exerciseInput.removeAttribute("aria-invalid");
      this.exerciseInput.removeAttribute("aria-describedby");
    }
  }

  private renderPlanStep(
    container: HTMLElement,
    state: InsertSetsState,
  ): void {
    container.createDiv({
      cls: "workout-wizard-context-line",
      text: state.exercise.trim(),
    });

    const plan = this.createSection(
      container,
      t("modal.wizard.sections.plan"),
    );
    this.planFields = PlanFields.create(plan, state.sets ?? 0);
    PlanFields.fill(this.planFields, {
      sets: state.sets,
      targetWeight: state.targetWeight,
      targetReps: state.targetReps,
    });

    const syncPlan = () => {
      if (!this.planFields) return;
      const values = PlanFields.read(this.planFields);
      state.sets = values.sets;
      state.targetWeight = values.targetWeight;
      state.targetReps = values.targetReps;
    };
    for (const input of [
      this.planFields.sets,
      this.planFields.targetWeight,
      this.planFields.targetReps,
    ]) {
      input.addEventListener("input", syncPlan);
      input.addEventListener("change", syncPlan);
    }
  }

  private renderRestStep(
    container: HTMLElement,
    state: InsertSetsState,
  ): void {
    const restSection = this.createSection(container, t("modal.rest"));
    // 0 leaves `rest` out: the rest of the section's workout-timer
    this.restInput = AdjustField.create(restSection, {
      label: t("sets.restLabel"),
      value: state.rest,
      min: 0,
      max: 600,
      step: REST_INCREMENT,
      unit: "s",
    });

    const syncRest = () => {
      state.rest = Math.max(0, parseInt(this.restInput?.value ?? "", 10) || 0);
      this.renderReviewValues(state);
    };
    this.restInput.addEventListener("input", syncRest);
    this.restInput.addEventListener("change", syncRest);

    const reviewSection = this.createSection(
      container,
      t("modal.wizard.sections.review"),
    );
    this.reviewContainer = reviewSection.createDiv({
      cls: "workout-wizard-review-inset",
    });
    this.renderReviewValues(state);
  }

  private renderReviewValues(state: InsertSetsState): void {
    if (!this.reviewContainer) return;
    this.reviewContainer.empty();

    const addRow = (key: string, value: string) => {
      this.reviewContainer!.createSpan({
        cls: "workout-wizard-review-key",
        text: key,
      });
      this.reviewContainer!.createSpan({
        cls: "workout-wizard-review-val",
        text: value,
      });
    };

    addRow(t("modal.wizard.review.exercise"), state.exercise.trim());
    if (state.workout.trim()) {
      addRow(t("modal.wizard.review.workout"), state.workout.trim());
    }
    addRow(t("modal.wizard.review.plan"), this.formatPlanSummary(state));
    addRow(
      t("modal.wizard.review.rest"),
      state.rest > 0
        ? FormatUtils.formatDuration(state.rest)
        : t("modal.wizard.review.sectionTimer"),
    );
  }

  private formatPlanSummary(state: InsertSetsState): string {
    const parts: string[] = [
      state.sets && state.sets > 0
        ? t("modal.wizard.review.setsCount", { count: state.sets })
        : t("modal.wizard.review.lastTime"),
    ];
    const unit = ParameterUtils.getWeightUnit();
    const { targetWeight, targetReps } = state;
    if (targetWeight && targetWeight > 0 && targetReps && targetReps > 0) {
      parts.push(
        t("modal.wizard.review.targetWeightReps", {
          weight: targetWeight,
          unit,
          reps: targetReps,
        }),
      );
    } else if (targetWeight && targetWeight > 0) {
      parts.push(
        t("modal.wizard.review.targetWeight", { weight: targetWeight, unit }),
      );
    } else if (targetReps && targetReps > 0) {
      parts.push(
        t("modal.wizard.review.targetReps", { reps: targetReps }),
      );
    }
    return parts.join(" · ");
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
    if (this.isActiveStepElement(this.exerciseInput)) {
      this.state.exercise = this.exerciseInput!.value;
    }
    if (this.isActiveStepElement(this.workoutInput)) {
      this.state.workout = this.workoutInput!.value;
    }
    if (this.isActiveStepElement(this.planFields?.sets)) {
      const plan = PlanFields.read(this.planFields!);
      this.state.sets = plan.sets;
      this.state.targetWeight = plan.targetWeight;
      this.state.targetReps = plan.targetReps;
    }
    if (this.isActiveStepElement(this.restInput)) {
      this.state.rest = Math.max(
        0,
        parseInt(this.restInput!.value, 10) || 0,
      );
    }

    return {
      exercise: this.state.exercise.trim() || undefined,
      workout: this.state.workout.trim() || undefined,
      sets: this.state.sets && this.state.sets > 0 ? this.state.sets : undefined,
      targetWeight:
        this.state.targetWeight && this.state.targetWeight > 0
          ? this.state.targetWeight
          : undefined,
      targetReps:
        this.state.targetReps && this.state.targetReps > 0
          ? this.state.targetReps
          : undefined,
      rest: this.state.rest > 0 ? this.state.rest : undefined,
    };
  }
}
