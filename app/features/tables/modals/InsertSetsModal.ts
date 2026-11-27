import { App, Notice } from "obsidian";
import { reviewRows } from "@app/features/tables/business/setsReview";
import { WizardModal, type WizardStep } from "@app/features/modals/base/WizardModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { AdjustField } from "@app/components/molecules/AdjustField";
import { ProtocolPicker } from "@app/components/molecules/ProtocolPicker";
import { Button, BUTTONVARIANT, DeleteButton } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import {
  setsBlock,
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
import { getDynamicModalLabels } from "@app/constants";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { FormatUtils } from "@app/utils/FormatUtils";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

const DEFAULT_SETS = 3;
const MAX_WARMUPS = 10;
const REST_INCREMENT = 15;
const MAX_REST = 600;

function supersetGroupLabel(count: number): string {
  if (count <= 2) return t("modal.wizard.groupLabel.superset", { count });
  if (count === 3) return t("modal.wizard.groupLabel.triset", { count });
  return t("modal.wizard.groupLabel.giantSet", { count });
}

function clampNonNegativeInt(raw: string | undefined, max?: number): number {
  const n = Math.max(0, parseInt(raw ?? "", 10) || 0);
  return max === undefined ? n : Math.min(max, n);
}

/**
 * Inserts a `workout-sets` block through three adaptive steps:
 * Exercise (protocol + single or superset exercises + workout),
 * Plan (sets/rounds, warm-ups, targets in single mode), and
 * Rest (with restBetween + rhythm preview in superset mode, and Review).
 */
export class InsertSetsModal extends WizardModal {
  protected exerciseInput?: HTMLInputElement;
  protected workoutInput?: HTMLInputElement;
  protected planFields?: PlanFieldsElements;
  protected roundsInput?: HTMLInputElement;
  protected warmupsInput?: HTMLInputElement;
  protected restBetweenInput?: HTMLInputElement;
  protected restInput?: HTMLInputElement;
  /** The rest the form starts with; 0 leaves `rest` out */
  protected defaultRest = 0;

  protected selectedProtocol: string = WorkoutProtocol.STANDARD;
  protected singleExercise = "";
  protected supersetExercises: string[] = ["", ""];
  protected workoutValue = "";
  protected plannedSets: number | undefined = DEFAULT_SETS;
  protected warmupsValue = 0;
  protected targetWeightValue: number | undefined;
  protected targetRepsValue: number | undefined;
  protected restBetweenValue = 0;
  protected restValue?: number;

  private exerciseBodyEl?: HTMLElement;
  private supersetSlotInputs: HTMLInputElement[] = [];
  private planPanelEl?: HTMLElement;
  private planContext?: HTMLElement;
  private renderedPlanSuperset?: boolean;
  private restPanelEl?: HTMLElement;
  private renderedRestSuperset?: boolean;
  private restFallbackHelperEl?: HTMLElement;
  private rhythmPreviewEl?: HTMLElement;
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

  protected createConfigurationSections(container: HTMLElement): void {
    if (this.restValue === undefined) this.restValue = this.defaultRest;
    super.createConfigurationSections(container);
  }

  protected isSupersetMode(): boolean {
    return protocolId(this.selectedProtocol) === (WorkoutProtocol.SUPERSET as string);
  }

  protected protocolCatalog(): ProtocolCatalog {
    return new ProtocolCatalog(this.plugin?.settings?.customProtocols);
  }

  protected getProtocolOptions(catalog: ProtocolCatalog): ProtocolInfo[] {
    return catalog.all().filter((p) => p.id !== (WorkoutProtocol.WARMUP as string));
  }

  protected getSteps(): WizardStep[] {
    return [
      {
        id: "exercise",
        label: t("wizard.steps.exercise"),
        render: (el) => this.renderExerciseStep(el),
        validate: () => this.validateExercise(),
        isComplete: () => this.isExerciseStepComplete(),
      },
      {
        id: "plan",
        label: t("wizard.steps.plan"),
        render: (el) => this.renderPlanStep(el),
        onEnter: () => this.enterPlanStep(),
      },
      {
        id: "rest",
        label: t("wizard.steps.rest"),
        render: (el) => this.renderRestStep(el),
        onEnter: () => this.enterRestStep(),
      },
    ];
  }

  private renderExerciseStep(el: HTMLElement): void {
    if (!this.plugin) throw new Error(t("modal.errors.missingElements"));

    const target = this.createSection(el, t("modal.sections.target"));
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
      selected: this.selectedProtocol,
      onPick: (id) => this.handleProtocolPick(id, syncProtocolHelp),
      focusKeyPrefix: "wizard-protocol",
    });
    protocolWrap.prepend(picker);
    syncProtocolHelp(this.selectedProtocol);

    this.exerciseBodyEl = target.createDiv({ cls: "workout-wizard-exercise-body" });
    this.renderExerciseBody();

    this.workoutInput = this.createTextField(
      target,
      t("sets.workoutLabel"),
      t("sets.workoutPlaceholder", { note: this.getCurrentFileName() }),
      this.workoutValue,
    );
    const syncWorkout = () => {
      this.workoutValue = this.workoutInput?.value ?? "";
    };
    this.workoutInput.addEventListener("input", syncWorkout);
    this.workoutInput.addEventListener("change", syncWorkout);
  }

  private handleProtocolPick(
    id: string,
    syncProtocolHelp: (id: string) => void,
  ): void {
    const wasSuperset = this.isSupersetMode();
    if (wasSuperset) this.syncSupersetFromDom();
    else this.syncSingleFromDom();

    this.selectedProtocol = id;
    syncProtocolHelp(id);
    const nowSuperset = this.isSupersetMode();

    if (!wasSuperset && nowSuperset) {
      const first = this.singleExercise.trim();
      if (this.supersetExercises.length < 2) {
        this.supersetExercises = [first, ""];
      } else if (first) {
        this.supersetExercises[0] = first;
      }
      while (this.supersetExercises.length < 2) this.supersetExercises.push("");
      this.renderExerciseBody();
      this.refreshHeader();
      const second = this.supersetSlotInputs[1];
      if (second && !second.value.trim()) second.focus();
      return;
    }

    if (wasSuperset && !nowSuperset) {
      const first = this.supersetExercises[0]?.trim();
      if (first) this.singleExercise = first;
      this.renderExerciseBody();
      this.refreshHeader();
      return;
    }

    this.refreshHeader();
  }

  private renderExerciseBody(): void {
    if (!this.exerciseBodyEl || !this.plugin) return;
    this.setStepError("exercise", null);
    this.exerciseBodyEl.empty();
    this.exerciseInput = undefined;
    this.supersetSlotInputs = [];

    if (!this.isSupersetMode()) {
      const { elements } = ExerciseAutocomplete.create(
        this,
        this.exerciseBodyEl,
        this.plugin,
        this.singleExercise,
        { showCreateButton: false },
      );
      this.exerciseInput = elements.exerciseInput;

      const syncExercise = () => {
        this.singleExercise = this.exerciseInput?.value ?? "";
        if (this.singleExercise.trim() !== "") {
          this.setStepError("exercise", null, this.exerciseInput);
        }
        this.refreshHeader();
      };
      this.exerciseInput.addEventListener("input", syncExercise);
      this.exerciseInput.addEventListener("change", syncExercise);
      return;
    }

    while (this.supersetExercises.length < 2) this.supersetExercises.push("");

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
      text: supersetGroupLabel(this.supersetExercises.length),
    });

    const listEl = supersetWrap.createDiv({ cls: "workout-superset-list" });
    this.supersetExercises.forEach((name, idx) => {
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
        this.syncSupersetFromDom();
        const targetIdx = idx + delta;
        if (targetIdx < 0 || targetIdx >= this.supersetExercises.length) return;
        const copy = [...this.supersetExercises];
        [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
        this.supersetExercises = copy;
        this.renderExerciseBody();
        this.refreshHeader();
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
        disabled: idx === this.supersetExercises.length - 1,
      });
      Button.onClick(downBtn, () => move(1));

      if (this.supersetExercises.length > 2) {
        DeleteButton.create(controls, {
          label: t("modal.wizard.removeExercise", { letter }),
          onClick: () => {
            this.syncSupersetFromDom();
            this.supersetExercises.splice(idx, 1);
            this.renderExerciseBody();
            this.refreshHeader();
          },
        });
      }

      this.supersetSlotInputs.push(elements.exerciseInput);

      const syncSlot = () => {
        this.supersetExercises[idx] = elements.exerciseInput.value;
        if (elements.exerciseInput.value.trim() !== "") {
          this.setStepError("exercise", null, elements.exerciseInput);
        }
        this.refreshHeader();
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
      this.syncSupersetFromDom();
      this.supersetExercises.push("");
      this.renderExerciseBody();
      this.refreshHeader();
      this.supersetSlotInputs[this.supersetExercises.length - 1]?.focus();
    });
  }

  private renderPlanStep(el: HTMLElement): void {
    this.planPanelEl = el;
    this.buildPlanStepBody();
  }

  private buildPlanStepBody(): void {
    const el = this.planPanelEl;
    if (!el) return;
    el.empty();

    this.planContext = el.createDiv({ cls: "workout-wizard-context" });
    const superset = this.isSupersetMode();
    this.renderedPlanSuperset = superset;
    const plan = this.createSection(el, t("modal.sections.progressiveOverload"));

    if (superset) {
      this.planFields = undefined;
      const grid = plan.createDiv({ cls: "workout-parameters-container" });
      this.roundsInput = AdjustField.create(grid, {
        label: t("modal.rounds"),
        value: this.plannedSets ?? 0,
        min: 0,
        max: MAX_PLANNED_SETS,
        step: 1,
      });
      this.warmupsInput = AdjustField.create(grid, {
        label: t("modal.wizard.warmupRounds"),
        value: this.warmupsValue,
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

      const syncRounds = () => this.syncPlanFromDom();
      this.roundsInput.addEventListener("input", syncRounds);
      this.roundsInput.addEventListener("change", syncRounds);
    } else {
      this.roundsInput = undefined;
      this.planFields = PlanFields.create(plan, this.plannedSets ?? 0);
      PlanFields.fill(this.planFields, {
        sets: this.plannedSets,
        targetWeight: this.targetWeightValue,
        targetReps: this.targetRepsValue,
      });
      const grid =
        this.planFields.sets.closest<HTMLElement>(".workout-parameters-container") ?? plan;
      this.warmupsInput = AdjustField.create(grid, {
        label: t("modal.wizard.warmupSets"),
        value: this.warmupsValue,
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

      const syncPlan = () => this.syncPlanFromDom();
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
      this.warmupsValue = clampNonNegativeInt(this.warmupsInput?.value, MAX_WARMUPS);
    };
    this.warmupsInput.addEventListener("input", syncWarmups);
    this.warmupsInput.addEventListener("change", syncWarmups);
  }

  private enterPlanStep(): void {
    if (this.renderedPlanSuperset !== this.isSupersetMode()) {
      this.syncPlanFromDom();
      this.buildPlanStepBody();
    }
    this.refreshPlanContext();
  }

  private renderRestStep(el: HTMLElement): void {
    this.restPanelEl = el;
    this.buildRestStepBody();
  }

  private buildRestStepBody(): void {
    const el = this.restPanelEl;
    if (!el) return;
    el.empty();
    this.restBetweenInput = undefined;
    this.restFallbackHelperEl = undefined;
    this.rhythmPreviewEl = undefined;

    const superset = this.isSupersetMode();
    this.renderedRestSuperset = superset;
    const restSection = this.createSection(el, t("modal.rest"));
    const currentRest = this.restValue ?? this.defaultRest;

    if (superset) {
      const grid = restSection.createDiv({ cls: "workout-parameters-container" });
      this.restBetweenInput = AdjustField.create(grid, {
        label: t("modal.wizard.restBetweenLabel"),
        value: this.restBetweenValue,
        min: 0,
        max: MAX_REST,
        step: REST_INCREMENT,
        unit: "s",
      });

      const hasFallback = currentRest === 0 && this.restBetweenValue > 0;
      this.restInput = AdjustField.create(grid, {
        label: t("modal.wizard.restRoundLabel"),
        value: hasFallback ? undefined : currentRest,
        suggestion: () =>
          (this.restValue ?? 0) === 0 && this.restBetweenValue > 0
            ? this.restBetweenValue
            : undefined,
        min: 0,
        max: MAX_REST,
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

      const syncRestBetween = () => {
        this.restBetweenValue = clampNonNegativeInt(this.restBetweenInput?.value);
        this.syncSupersetRestUi();
      };
      this.restBetweenInput.addEventListener("input", syncRestBetween);
      this.restBetweenInput.addEventListener("change", syncRestBetween);

      const syncRest = () => {
        this.restValue = clampNonNegativeInt(this.restInput?.value);
        this.syncSupersetRestUi();
      };
      this.restInput.addEventListener("input", syncRest);
      this.restInput.addEventListener("change", syncRest);
    } else {
      // 0 leaves `rest` out: the rest of the section's workout-timer
      this.restInput = AdjustField.create(restSection, {
        label: t("sets.restLabel"),
        value: currentRest,
        min: 0,
        max: MAX_REST,
        step: REST_INCREMENT,
        unit: "s",
      });
      const syncRest = () => {
        this.restValue = clampNonNegativeInt(this.restInput?.value);
        this.refreshReview();
      };
      this.restInput.addEventListener("input", syncRest);
      this.restInput.addEventListener("change", syncRest);
    }

    el.createEl("h3", { text: t("sets.wizard.review"), cls: "workout-wizard-review-title" });
    this.review = el.createDiv({ cls: "workout-wizard-review" });

    if (superset) {
      this.syncSupersetRestUi();
    }
  }

  private enterRestStep(): void {
    if (this.renderedRestSuperset !== this.isSupersetMode()) {
      this.syncRestFromDom();
      this.buildRestStepBody();
    } else if (this.isSupersetMode()) {
      this.syncSupersetRestUi();
      return;
    }
    this.refreshReview();
  }

  private syncSupersetRestUi(): void {
    const rest = this.restValue ?? 0;
    const restBetween = this.restBetweenValue;
    const showFallback = rest === 0 && restBetween > 0;

    if (this.restInput) {
      this.restInput.placeholder = showFallback ? String(restBetween) : "";
      if (showFallback && this.restInput.value === "0") {
        this.restInput.value = "";
      } else if (!showFallback && this.restInput.value === "" && rest === 0) {
        this.restInput.value = "0";
      }
    }
    if (this.restFallbackHelperEl) {
      this.restFallbackHelperEl.textContent = showFallback
        ? t("modal.wizard.restRoundFallbackHelper", {
            duration: FormatUtils.formatDuration(restBetween),
          })
        : "";
      this.restFallbackHelperEl.hidden = !showFallback;
    }
    this.renderRhythmPreview();
    this.refreshReview();
  }

  private renderRhythmPreview(): void {
    if (!this.rhythmPreviewEl) return;
    this.rhythmPreviewEl.empty();

    const count = Math.max(this.currentExerciseValues().length, 2);
    const between = this.restBetweenValue;
    const rest = this.restValue ?? 0;
    const roundRest = rest > 0 ? rest : between;
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

  private syncSingleFromDom(): void {
    if (this.exerciseInput) {
      this.singleExercise = this.exerciseInput.value;
    }
  }

  private syncSupersetFromDom(): void {
    if (this.supersetSlotInputs.length > 0) {
      this.supersetExercises = this.supersetSlotInputs.map((i) => i.value);
    }
  }

  private syncPlanFromDom(): void {
    if (this.planFields) {
      const plan = PlanFields.read(this.planFields);
      this.plannedSets = plan.sets;
      this.targetWeightValue = plan.targetWeight;
      this.targetRepsValue = plan.targetReps;
    }
    if (this.roundsInput) {
      const rounds = clampNonNegativeInt(this.roundsInput.value);
      this.plannedSets = rounds > 0 ? rounds : undefined;
    }
    if (this.warmupsInput) {
      this.warmupsValue = clampNonNegativeInt(this.warmupsInput.value, MAX_WARMUPS);
    }
  }

  private syncRestFromDom(): void {
    if (this.restBetweenInput) {
      this.restBetweenValue = clampNonNegativeInt(this.restBetweenInput.value);
    }
    if (this.restInput) {
      this.restValue = clampNonNegativeInt(this.restInput.value);
    }
  }

  private currentExerciseValues(): string[] {
    if (this.supersetSlotInputs.length > 0) {
      return this.supersetSlotInputs.map((i) => i.value);
    }
    return this.supersetExercises;
  }

  private exerciseName(): string {
    return (this.exerciseInput?.value ?? this.singleExercise).trim();
  }

  private isExerciseStepComplete(): boolean {
    if (this.isSupersetMode()) {
      const values = this.currentExerciseValues();
      return values.length >= 2 && values.every((e) => e.trim() !== "");
    }
    return this.exerciseName() !== "";
  }

  private validateExercise(): boolean {
    if (this.isSupersetMode()) {
      this.syncSupersetFromDom();
      const firstEmpty = this.supersetExercises.findIndex((e) => e.trim() === "");
      if (firstEmpty !== -1) {
        this.setStepError(
          "exercise",
          t("modal.wizard.chooseExerciseSlot", { letter: slotLetter(firstEmpty) }),
          this.supersetSlotInputs[firstEmpty],
        );
        return false;
      }
      this.setStepError("exercise", null);
      return this.supersetExercises.length >= 2;
    }

    const ok = this.exerciseName() !== "";
    this.setStepError(
      "exercise",
      ok ? null : t("modal.notices.validChooseExercise"),
      this.exerciseInput,
    );
    return ok;
  }

  private refreshPlanContext(): void {
    if (!this.planContext) return;
    if (this.isSupersetMode()) {
      const names = this.currentExerciseValues()
        .map((e) => e.trim())
        .filter(Boolean)
        .join(" + ");
      const protoName = this.protocolCatalog().resolve(this.selectedProtocol).name;
      this.planContext.setText([protoName, names].filter(Boolean).join(" · "));
      return;
    }

    const proto = protocolId(this.selectedProtocol);
    const name = this.exerciseName();
    if (proto === (WorkoutProtocol.STANDARD as string)) {
      this.planContext.setText(t("sets.wizard.planningFor", { exercise: name }));
    } else {
      const protoName = this.protocolCatalog().resolve(proto).name;
      this.planContext.setText([protoName, name].filter(Boolean).join(" · "));
    }
  }

  /** A compact key/value summary of what Insert will write */
  private refreshReview(): void {
    const review = this.review;
    if (!review) return;
    review.empty();
    const rows = reviewRows(this.collectParams(), {
      weightUnit: this.plugin?.settings.weightUnit ?? "",
      noteName: this.getCurrentFileName(),
      targetWeightLabel: getDynamicModalLabels().TARGET_WEIGHT,
      customProtocols: this.plugin?.settings.customProtocols,
    });
    for (const [key, value] of rows) {
      const row = review.createDiv({ cls: "workout-wizard-review-row" });
      row.createSpan({ cls: "workout-wizard-review-key", text: key });
      row.createSpan({ cls: "workout-wizard-review-value", text: value });
    }
  }

  /** A direct submit (Update from any step, Insert) needs valid exercise(s) too */
  protected canInsert(): boolean {
    if (this.isExerciseStepComplete()) return true;
    new Notice(t("modal.notices.validChooseExercise"));
    return false;
  }

  protected generateCode(): string {
    return setsBlock.serialize({ id: generateCodeBlockId(), ...this.collectParams() });
  }

  /** The block parameters the form sets; empty or zero ones are left out */
  protected collectParams(): EmbeddedSetsParams {
    const superset = this.isSupersetMode();
    if (superset) this.syncSupersetFromDom();
    else this.syncSingleFromDom();

    if (this.workoutInput) {
      this.workoutValue = this.workoutInput.value;
    }
    this.syncPlanFromDom();
    this.syncRestFromDom();

    const proto = protocolId(this.selectedProtocol);
    const validExercises = this.supersetExercises.map((e) => e.trim()).filter(Boolean);
    const rest = this.restValue ?? this.defaultRest;

    return {
      exercise: superset ? undefined : this.singleExercise.trim() || undefined,
      exercises: superset && validExercises.length >= 2 ? validExercises : undefined,
      protocol: superset
        ? WorkoutProtocol.SUPERSET
        : proto === (WorkoutProtocol.STANDARD as string)
          ? undefined
          : proto,
      workout: this.workoutValue.trim() || undefined,
      sets: this.plannedSets && this.plannedSets > 0 ? this.plannedSets : undefined,
      warmups: this.warmupsValue > 0 ? this.warmupsValue : undefined,
      targetWeight:
        !superset && this.targetWeightValue && this.targetWeightValue > 0
          ? this.targetWeightValue
          : undefined,
      targetReps:
        !superset && this.targetRepsValue && this.targetRepsValue > 0
          ? this.targetRepsValue
          : undefined,
      restBetween:
        superset && this.restBetweenValue > 0 ? this.restBetweenValue : undefined,
      rest: rest > 0 ? rest : undefined,
    };
  }
}
