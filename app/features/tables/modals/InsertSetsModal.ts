import { App, Notice } from "obsidian";
import {
  WizardModal,
  type WizardStep,
} from "@app/features/modals/base/WizardModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { ProtocolPicker } from "@app/components/molecules/ProtocolPicker";
import {
  Button,
  BUTTONVARIANT,
  DeleteButton,
} from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import {
  setsBlock,
  isSupersetBlock,
  slotLetter,
  type EmbeddedSetsParams,
} from "@app/features/tables/setsBlock";
import {
  PlanFields,
  type PlanFieldsElements,
} from "@app/features/tables/modals/components/PlanFields";
import { MAX_PLANNED_SETS } from "@app/features/tables/exerciseBlockFields";
import {
  ProtocolCatalog,
  protocolHelp,
  protocolId,
  type ProtocolInfo,
} from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { FormatUtils } from "@app/utils/FormatUtils";
import { describeTarget } from "@app/features/modals/log/LogHistory";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const MAX_WARMUPS = 10;
const REST_INCREMENT = 15;
let nextExerciseErrorId = 0;

function supersetGroupLabel(count: number): string {
  if (count <= 2) return t("modal.wizard.groupLabel.superset", { count });
  if (count === 3) return t("modal.wizard.groupLabel.triset", { count });
  return t("modal.wizard.groupLabel.giantSet", { count });
}

export interface InsertSetsState {
  protocol: string;
  exercise: string;
  exercises: string[];
  workout: string;
  sets?: number;
  warmups: number;
  targetWeight?: number;
  targetReps?: number;
  restBetween: number;
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
  protected roundsInput?: HTMLInputElement;
  protected warmupsInput?: HTMLInputElement;
  protected restBetweenInput?: HTMLInputElement;
  protected restInput?: HTMLInputElement;
  /** The rest the form starts with; 0 leaves `rest` out */
  protected defaultRest = 0;

  private exerciseBodyEl?: HTMLElement;
  private exerciseErrorEl?: HTMLElement;
  private supersetSlotInputs: HTMLInputElement[] = [];
  private supersetSlotErrors: HTMLElement[] = [];
  private restFallbackHelperEl?: HTMLElement;
  private rhythmPreviewEl?: HTMLElement;
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
      protocol: WorkoutProtocol.STANDARD,
      exercise: "",
      exercises: ["", ""],
      workout: "",
      sets: DEFAULT_SETS,
      warmups: 0,
      targetWeight: undefined,
      targetReps: undefined,
      restBetween: 0,
      rest: this.defaultRest,
    };
  }

  protected isSupersetMode(state: InsertSetsState = this.state): boolean {
    return protocolId(state.protocol) === (WorkoutProtocol.SUPERSET as string);
  }

  protected getProtocolOptions(catalog: ProtocolCatalog): ProtocolInfo[] {
    return catalog.all().filter((p) => p.id !== (WorkoutProtocol.WARMUP as string));
  }

  protected protocolCatalog(): ProtocolCatalog {
    return new ProtocolCatalog(this.plugin?.settings?.customProtocols);
  }

  protected getSteps(): WizardStep<InsertSetsState>[] {
    return [
      {
        id: "exercise",
        label: t("modal.wizard.steps.exercise"),
        isComplete: (state) =>
          this.isSupersetMode(state)
            ? state.exercises.length >= 2 &&
              state.exercises.every((e) => e.trim().length > 0)
            : state.exercise.trim().length > 0,
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
    const catalog = this.protocolCatalog();
    const protocolOptions = this.getProtocolOptions(catalog);
    const protocolWrap = target.createDiv({ cls: "workout-wizard-protocol-wrap" });
    const helpEl = protocolWrap.createDiv({
      cls: "workout-field-helper workout-protocol-help",
    });
    const syncProtocolHelp = (id: string) => {
      const help = protocolHelp(id);
      helpEl.textContent = help ?? "";
      helpEl.hidden = !help;
    };

    const picker = ProtocolPicker.create(protocolWrap, {
      label: t("modal.protocol"),
      options: protocolOptions.map(({ id, name }) => ({ id, name })),
      selected: state.protocol,
      onPick: (id) => {
        const wasSuperset = this.isSupersetMode(state);
        state.protocol = id;
        syncProtocolHelp(id);
        const nowSuperset = this.isSupersetMode(state);

        if (!wasSuperset && nowSuperset) {
          const first = state.exercise.trim();
          if (state.exercises.length < 2) {
            state.exercises = [first, ""];
          } else if (first) {
            state.exercises[0] = first;
          }
          while (state.exercises.length < 2) state.exercises.push("");
          this.renderExerciseBody(state);
          this.notifyStateChange();
          const second = this.supersetSlotInputs[1];
          if (second && !second.value.trim()) second.focus();
          return;
        }

        if (wasSuperset && !nowSuperset) {
          const first = state.exercises[0]?.trim();
          if (first) state.exercise = first;
          this.renderExerciseBody(state);
          this.notifyStateChange();
          return;
        }

        this.notifyStateChange();
      },
      focusKeyPrefix: "wizard-protocol",
    });
    protocolWrap.prepend(picker);
    syncProtocolHelp(state.protocol);

    this.exerciseBodyEl = target.createDiv({ cls: "workout-wizard-exercise-body" });
    this.renderExerciseBody(state);

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

  private renderExerciseBody(state: InsertSetsState): void {
    if (!this.exerciseBodyEl || !this.plugin) return;
    this.exerciseBodyEl.empty();
    this.exerciseInput = undefined;
    this.exerciseErrorEl = undefined;
    this.supersetSlotInputs = [];
    this.supersetSlotErrors = [];

    if (!this.isSupersetMode(state)) {
      const { elements } = ExerciseAutocomplete.create(
        this,
        this.exerciseBodyEl,
        this.plugin,
        state.exercise,
        { showCreateButton: false },
      );
      this.exerciseInput = elements.exerciseInput;

      const fieldWrapper = this.exerciseInput.parentElement ?? this.exerciseBodyEl;
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
      return;
    }

    while (state.exercises.length < 2) state.exercises.push("");

    const supersetWrap = this.exerciseBodyEl.createDiv({
      cls: "workout-superset-section",
    });
    const headerRow = supersetWrap.createDiv({ cls: "workout-superset-header" });
    headerRow.createSpan({
      cls: "workout-field-label",
      text: t("modal.wizard.exercises"),
    });
    headerRow.createSpan({
      cls: "workout-superset-count",
      text: supersetGroupLabel(state.exercises.length),
    });

    const listEl = supersetWrap.createDiv({ cls: "workout-superset-list" });
    state.exercises.forEach((name, idx) => {
      const letter = slotLetter(idx);
      const slotEl = listEl.createDiv({ cls: "workout-superset-slot" });
      const rowEl = slotEl.createDiv({ cls: "workout-superset-slot-row" });

      rowEl.createSpan({ cls: "workout-superset-letter", text: letter });

      const fieldWrap = rowEl.createDiv({ cls: "workout-superset-slot-field" });
      const { elements } = ExerciseAutocomplete.create(
        this,
        fieldWrap,
        this.plugin!,
        name,
        { showCreateButton: false },
      );
      const slotLabel = t("modal.wizard.exerciseSlot", { letter });
      const autoLabel = fieldWrap.querySelector<HTMLLabelElement>(
        ".workout-form-field-label",
      );
      if (autoLabel) {
        autoLabel.textContent = slotLabel;
        autoLabel.addClass("workout-visually-hidden");
      }
      elements.exerciseInput.setAttribute("aria-label", slotLabel);

      const controls = rowEl.createDiv({
        cls: "workout-superset-slot-controls",
      });
      const move = (delta: number) => {
        const targetIdx = idx + delta;
        if (targetIdx < 0 || targetIdx >= state.exercises.length) return;
        const copy = [...state.exercises];
        [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
        state.exercises = copy;
        this.renderExerciseBody(state);
        this.notifyStateChange();
      };

      const upBtn = Button.create(controls, {
        icon: ICONS.ACTIONS.MOVE_UP,
        variant: BUTTONVARIANT.SECONDARY,
        className: "workout-superset-move-btn",
        ariaLabel: t("modal.wizard.moveExerciseUp", { letter }),
        disabled: idx === 0,
      });
      Button.onClick(upBtn, () => move(-1));

      const downBtn = Button.create(controls, {
        icon: ICONS.ACTIONS.MOVE_DOWN,
        variant: BUTTONVARIANT.SECONDARY,
        className: "workout-superset-move-btn",
        ariaLabel: t("modal.wizard.moveExerciseDown", { letter }),
        disabled: idx === state.exercises.length - 1,
      });
      Button.onClick(downBtn, () => move(1));

      if (state.exercises.length > 2) {
        DeleteButton.create(controls, {
          label: t("modal.wizard.removeExercise", { letter }),
          onClick: () => {
            state.exercises.splice(idx, 1);
            this.renderExerciseBody(state);
            this.notifyStateChange();
          },
        });
      }

      const errorId = `workout-sets-exercise-error-${++nextExerciseErrorId}`;
      const errorEl = slotEl.createDiv({
        cls: "workout-field-error",
        attr: { id: errorId, role: "alert" },
      });
      errorEl.hidden = true;

      this.supersetSlotInputs.push(elements.exerciseInput);
      this.supersetSlotErrors.push(errorEl);

      const syncSlot = () => {
        state.exercises[idx] = elements.exerciseInput.value;
        if (state.exercises[idx].trim().length > 0) {
          this.setSlotError(idx);
        }
        this.notifyStateChange();
      };
      elements.exerciseInput.addEventListener("input", syncSlot);
      elements.exerciseInput.addEventListener("change", syncSlot);
    });

    const addBtn = Button.create(supersetWrap, {
      text: t("modal.wizard.addExercise"),
      icon: ICONS.ACTIONS.ADD,
      variant: BUTTONVARIANT.SECONDARY,
      className: "workout-superset-add-btn",
    });
    Button.onClick(addBtn, () => {
      state.exercises.push("");
      this.renderExerciseBody(state);
      this.notifyStateChange();
      this.supersetSlotInputs[state.exercises.length - 1]?.focus();
    });
  }

  private validateExerciseStep(state: InsertSetsState): boolean {
    if (this.isSupersetMode(state)) {
      const active = this.isActiveStepElement(this.exerciseBodyEl);
      if (active) {
        this.supersetSlotInputs.forEach((input, idx) => {
          state.exercises[idx] = input.value;
        });
      }
      let firstEmpty = -1;
      state.exercises.forEach((name, idx) => {
        if (!name.trim()) {
          if (firstEmpty === -1) firstEmpty = idx;
          if (active) {
            this.setSlotError(
              idx,
              t("modal.wizard.chooseExerciseSlot", {
                letter: slotLetter(idx),
              }),
            );
          }
        } else if (active) {
          this.setSlotError(idx);
        }
      });
      if (firstEmpty !== -1) {
        if (active) {
          this.supersetSlotInputs[firstEmpty]?.focus();
        }
        return false;
      }
      return state.exercises.length >= 2;
    }

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

  private setSlotError(index: number, message?: string): void {
    const input = this.supersetSlotInputs[index];
    const errorEl = this.supersetSlotErrors[index];
    if (!input || !errorEl) return;
    errorEl.textContent = message ?? "";
    errorEl.hidden = !message;
    input.closest(".workout-superset-slot")?.classList.toggle("is-invalid", !!message);
    if (message) {
      input.setAttribute("aria-invalid", "true");
      input.setAttribute("aria-describedby", errorEl.id);
    } else {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    }
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
    const superset = this.isSupersetMode(state);
    const proto = protocolId(state.protocol);
    const protoName = this.protocolCatalog().resolve(proto).name;
    const contextText = superset
      ? [
          protoName,
          state.exercises
            .map((e) => e.trim())
            .filter(Boolean)
            .join(" + "),
        ].join(" · ")
      : proto === (WorkoutProtocol.STANDARD as string)
        ? state.exercise.trim()
        : [protoName, state.exercise.trim()].join(" · ");
    container.createDiv({
      cls: "workout-wizard-context-line",
      text: contextText,
    });

    const plan = this.createSection(
      container,
      t("modal.wizard.sections.plan"),
    );

    const readWarmups = () =>
      Math.min(
        MAX_WARMUPS,
        Math.max(0, parseInt(this.warmupsInput?.value ?? "", 10) || 0),
      );

    if (superset) {
      this.planFields = undefined;
      const grid = plan.createDiv({ cls: "workout-parameters-container" });
      this.roundsInput = AdjustField.create(grid, {
        label: t("modal.rounds"),
        value: state.sets ?? 0,
        min: 0,
        max: MAX_PLANNED_SETS,
        step: 1,
      });
      this.warmupsInput = AdjustField.create(grid, {
        label: t("modal.wizard.warmupRounds"),
        value: state.warmups,
        min: 0,
        max: MAX_WARMUPS,
        step: 1,
      });
      this.warmupsInput
        .closest(".workout-field-with-adjust")
        ?.createDiv({
          cls: "workout-field-helper",
          text: t("modal.wizard.warmupHelper"),
        });
      plan.createDiv({
        cls: "workout-field-helper",
        text: t("modal.wizard.supersetTargetsNote"),
      });

      const syncRounds = () => {
        const rounds = Math.max(
          0,
          parseInt(this.roundsInput?.value ?? "", 10) || 0,
        );
        state.sets = rounds > 0 ? rounds : undefined;
      };
      this.roundsInput.addEventListener("input", syncRounds);
      this.roundsInput.addEventListener("change", syncRounds);
    } else {
      this.roundsInput = undefined;
      this.planFields = PlanFields.create(plan, state.sets ?? 0);
      PlanFields.fill(this.planFields, {
        sets: state.sets,
        targetWeight: state.targetWeight,
        targetReps: state.targetReps,
      });
      const grid =
        this.planFields.sets.closest<HTMLElement>(
          ".workout-parameters-container",
        ) ?? plan;
      this.warmupsInput = AdjustField.create(grid, {
        label: t("modal.wizard.warmupSets"),
        value: state.warmups,
        min: 0,
        max: MAX_WARMUPS,
        step: 1,
      });
      this.warmupsInput
        .closest(".workout-field-with-adjust")
        ?.createDiv({
          cls: "workout-field-helper",
          text: t("modal.wizard.warmupHelper"),
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

    const syncWarmups = () => {
      state.warmups = readWarmups();
    };
    this.warmupsInput.addEventListener("input", syncWarmups);
    this.warmupsInput.addEventListener("change", syncWarmups);
  }

  private renderRestStep(
    container: HTMLElement,
    state: InsertSetsState,
  ): void {
    const superset = this.isSupersetMode(state);
    this.restBetweenInput = undefined;
    this.restFallbackHelperEl = undefined;
    this.rhythmPreviewEl = undefined;

    const restSection = this.createSection(container, t("modal.rest"));

    if (superset) {
      const grid = restSection.createDiv({
        cls: "workout-parameters-container",
      });
      this.restBetweenInput = AdjustField.create(grid, {
        label: t("modal.wizard.restBetweenLabel"),
        value: state.restBetween,
        min: 0,
        max: 600,
        step: REST_INCREMENT,
        unit: "s",
      });

      const hasFallback = state.rest === 0 && state.restBetween > 0;
      this.restInput = AdjustField.create(grid, {
        label: t("modal.wizard.restRoundLabel"),
        value: hasFallback ? undefined : state.rest,
        suggestion: () =>
          state.rest === 0 && state.restBetween > 0
            ? state.restBetween
            : undefined,
        min: 0,
        max: 600,
        step: REST_INCREMENT,
        unit: "s",
      });
      this.restFallbackHelperEl =
        this.restInput
          .closest(".workout-field-with-adjust")
          ?.createDiv({ cls: "workout-field-helper" }) ?? undefined;

      this.rhythmPreviewEl = restSection.createDiv({
        cls: "workout-wizard-rhythm-preview",
        attr: { "aria-label": t("modal.wizard.rhythmLabel") },
      });

      const syncFallbackAndPreview = () => {
        const showFallback = state.rest === 0 && state.restBetween > 0;
        if (this.restInput) {
          this.restInput.placeholder = showFallback
            ? String(state.restBetween)
            : "";
          if (showFallback && this.restInput.value === "0") {
            this.restInput.value = "";
          } else if (
            !showFallback &&
            this.restInput.value === "" &&
            state.rest === 0
          ) {
            this.restInput.value = "0";
          }
        }
        if (this.restFallbackHelperEl) {
          this.restFallbackHelperEl.textContent = showFallback
            ? t("modal.wizard.restRoundFallbackHelper", {
                duration: FormatUtils.formatDuration(state.restBetween),
              })
            : "";
          this.restFallbackHelperEl.hidden = !showFallback;
        }
        this.renderRhythmPreview(state);
        this.renderReviewValues(state);
      };

      const syncRestBetween = () => {
        state.restBetween = Math.max(
          0,
          parseInt(this.restBetweenInput?.value ?? "", 10) || 0,
        );
        syncFallbackAndPreview();
      };
      this.restBetweenInput.addEventListener("input", syncRestBetween);
      this.restBetweenInput.addEventListener("change", syncRestBetween);

      const syncRest = () => {
        state.rest = Math.max(
          0,
          parseInt(this.restInput?.value ?? "", 10) || 0,
        );
        syncFallbackAndPreview();
      };
      this.restInput.addEventListener("input", syncRest);
      this.restInput.addEventListener("change", syncRest);

      syncFallbackAndPreview();
    } else {
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
        state.rest = Math.max(
          0,
          parseInt(this.restInput?.value ?? "", 10) || 0,
        );
        this.renderReviewValues(state);
      };
      this.restInput.addEventListener("input", syncRest);
      this.restInput.addEventListener("change", syncRest);
    }

    const reviewSection = this.createSection(
      container,
      t("modal.wizard.sections.review"),
    );
    this.reviewContainer = reviewSection.createDiv({
      cls: "workout-wizard-review-inset",
    });
    this.renderReviewValues(state);
  }

  private renderRhythmPreview(state: InsertSetsState): void {
    if (!this.rhythmPreviewEl) return;
    this.rhythmPreviewEl.empty();

    const count = Math.max(state.exercises.length, 2);
    const between = state.restBetween;
    const roundRest = state.rest > 0 ? state.rest : state.restBetween;
    const arrow = " → ";

    for (let i = 0; i < count; i++) {
      this.rhythmPreviewEl.createSpan({
        cls: "workout-rhythm-step",
        text: slotLetter(i),
      });
      if (i < count - 1) {
        this.rhythmPreviewEl.createSpan({
          cls: "workout-rhythm-arrow",
          text: arrow,
        });
        if (between > 0) {
          this.rhythmPreviewEl.createSpan({
            cls: "workout-rhythm-rest",
            text: FormatUtils.formatDuration(between),
          });
          this.rhythmPreviewEl.createSpan({
            cls: "workout-rhythm-arrow",
            text: arrow,
          });
        }
      }
    }

    this.rhythmPreviewEl.createSpan({
      cls: "workout-rhythm-arrow",
      text: arrow,
    });
    if (roundRest > 0) {
      this.rhythmPreviewEl.createSpan({
        cls: "workout-rhythm-rest",
        text: FormatUtils.formatDuration(roundRest),
      });
      this.rhythmPreviewEl.createSpan({
        cls: "workout-rhythm-arrow",
        text: arrow,
      });
      this.rhythmPreviewEl.createSpan({
        text: t("modal.wizard.rhythmNextRound"),
      });
    } else {
      this.rhythmPreviewEl.createSpan({
        text: t("modal.wizard.rhythmNextRoundNoTimer"),
      });
    }
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

    const superset = this.isSupersetMode(state);
    addRow(
      t("modal.wizard.review.protocol"),
      this.protocolCatalog().resolve(state.protocol).name,
    );
    if (superset) {
      addRow(
        t("modal.wizard.review.exercises"),
        state.exercises
          .map((e) => e.trim())
          .filter(Boolean)
          .join(" + "),
      );
    } else {
      addRow(t("modal.wizard.review.exercise"), state.exercise.trim());
    }
    if (state.workout.trim()) {
      addRow(t("modal.wizard.review.workout"), state.workout.trim());
    }
    addRow(t("modal.wizard.review.plan"), this.formatPlanSummary(state));

    if (superset) {
      const roundRest = state.rest > 0 ? state.rest : state.restBetween;
      const betweenText =
        state.restBetween > 0
          ? t("modal.wizard.review.restBetween", {
              duration: FormatUtils.formatDuration(state.restBetween),
            })
          : t("modal.wizard.review.noRestBetween");
      const roundText =
        roundRest > 0
          ? t("modal.wizard.review.restAfterRound", {
              duration: FormatUtils.formatDuration(roundRest),
            })
          : t("modal.wizard.review.noRoundTimer");
      addRow(t("modal.wizard.review.rest"), [betweenText, roundText].join(" · "));
    } else {
      addRow(
        t("modal.wizard.review.rest"),
        state.rest > 0
          ? FormatUtils.formatDuration(state.rest)
          : t("modal.wizard.review.sectionTimer"),
      );
    }
  }

  private formatPlanSummary(state: InsertSetsState): string {
    const superset = this.isSupersetMode(state);
    const parts: string[] = [
      state.sets && state.sets > 0
        ? t(
            superset
              ? "modal.wizard.review.roundsCount"
              : "modal.wizard.review.setsCount",
            { count: state.sets },
          )
        : t("modal.wizard.review.lastTime"),
    ];
    if (state.warmups > 0) {
      parts.push(
        state.warmups === 1
          ? t("modal.wizard.review.warmupsOne")
          : t("modal.wizard.review.warmupsMany", { count: state.warmups }),
      );
    }
    if (!superset) {
      const unit =
        this.plugin?.settings?.weightUnit ?? ParameterUtils.getWeightUnit();
      const target = describeTarget(
        state.targetReps && state.targetReps > 0 ? state.targetReps : undefined,
        state.targetWeight && state.targetWeight > 0
          ? state.targetWeight
          : undefined,
        unit,
      );
      if (target) parts.push(target);
    }
    return parts.join(" · ");
  }

  protected generateCode(): string {
    const params = this.collectParams();
    const valid = isSupersetBlock(params)
      ? Boolean(params.exercises && params.exercises.length >= 2)
      : !this.isSupersetMode() && Boolean(params.exercise);
    if (!valid) {
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
    if (this.isActiveStepElement(this.exerciseBodyEl) && this.isSupersetMode()) {
      this.supersetSlotInputs.forEach((input, idx) => {
        this.state.exercises[idx] = input.value;
      });
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
    if (this.isActiveStepElement(this.roundsInput)) {
      const rounds = Math.max(
        0,
        parseInt(this.roundsInput!.value, 10) || 0,
      );
      this.state.sets = rounds > 0 ? rounds : undefined;
    }
    if (this.isActiveStepElement(this.warmupsInput)) {
      this.state.warmups = Math.min(
        MAX_WARMUPS,
        Math.max(0, parseInt(this.warmupsInput!.value, 10) || 0),
      );
    }
    if (this.isActiveStepElement(this.restBetweenInput)) {
      this.state.restBetween = Math.max(
        0,
        parseInt(this.restBetweenInput!.value, 10) || 0,
      );
    }
    if (this.isActiveStepElement(this.restInput)) {
      this.state.rest = Math.max(
        0,
        parseInt(this.restInput!.value, 10) || 0,
      );
    }

    const superset = this.isSupersetMode();
    const proto = protocolId(this.state.protocol);
    const validExercises = this.state.exercises
      .map((e) => e.trim())
      .filter(Boolean);

    return {
      exercise: superset ? undefined : this.state.exercise.trim() || undefined,
      exercises:
        superset && validExercises.length >= 2 ? validExercises : undefined,
      protocol: superset
        ? WorkoutProtocol.SUPERSET
        : proto === (WorkoutProtocol.STANDARD as string)
          ? undefined
          : proto,
      workout: this.state.workout.trim() || undefined,
      sets: this.state.sets && this.state.sets > 0 ? this.state.sets : undefined,
      warmups: this.state.warmups > 0 ? this.state.warmups : undefined,
      targetWeight:
        !superset && this.state.targetWeight && this.state.targetWeight > 0
          ? this.state.targetWeight
          : undefined,
      targetReps:
        !superset && this.state.targetReps && this.state.targetReps > 0
          ? this.state.targetReps
          : undefined,
      restBetween:
        superset && this.state.restBetween > 0
          ? this.state.restBetween
          : undefined,
      rest: this.state.rest > 0 ? this.state.rest : undefined,
    };
  }
}
