import { App, Notice } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import {
  TargetSectionWithAutocomplete,
  type WorkoutFieldElements,
} from "@app/features/modals/components/TargetSectionWithAutocomplete";
import type { ExerciseAutocompleteElements } from "@app/types/ModalTypes";
import { tableBlock } from "@app/features/tables/tableBlock";
import { timerBlock } from "@app/features/timer/timerBlock";
import { TIMER_TYPE } from "@app/features/timer/types";
import { t } from "@app/i18n";
import { generateCodeBlockId } from "@app/utils/IdUtils";

interface SectionFormElements {
  exercise: ExerciseAutocompleteElements;
  workout: WorkoutFieldElements;
  sets: HTMLInputElement;
  reps: HTMLInputElement;
  restTime: HTMLInputElement;
  note: HTMLInputElement;
  showTimer: HTMLInputElement;
  timerSound: HTMLInputElement;
  showLog: HTMLInputElement;
}

/** Writes an exercise section: heading with the plan, rest timer and log */
export class CreateExerciseSectionModal extends BaseInsertModal {
  private form?: SectionFormElements;
  private currentFileName = "";

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.createExerciseSection");
  }

  protected getButtonText(): string {
    return t("modal.buttons.createSection");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.exerciseSectionCreated");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    if (!this.plugin) throw new Error(t("modal.errors.missingElements"));
    this.currentFileName = this.getCurrentFileName();

    const exerciseSection = this.createSection(
      container,
      t("modal.sections.exerciseConfiguration"),
    );

    const { elements: exercise } = ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin,
      undefined,
      { showCreateButton: false },
    );

    // Workout for combined filtering of the log
    const workout = TargetSectionWithAutocomplete.createWorkoutFields(
      this,
      exerciseSection,
      this.currentFileName,
      t("modal.workoutNameOptional"),
    );

    const sets = this.createNumberField(
      exerciseSection,
      t("modal.sets"),
      parseInt(t("modal.placeholders.sets")),
      { min: 1, max: 20 },
    );

    const reps = this.createTextField(
      exerciseSection,
      t("modal.labels.reps"),
      t("modal.placeholders.repsRange"),
      t("modal.placeholders.repsRange"),
    );

    const restTime = this.createNumberField(
      exerciseSection,
      t("modal.restTime"),
      parseInt(t("modal.placeholders.restTime")),
      { min: 30, max: 600 },
    );

    const note = this.createTextField(
      exerciseSection,
      t("modal.note"),
      t("modal.placeholders.note"),
    );

    const optionsSection = this.createSection(
      container,
      t("modal.sections.options"),
    );

    const showTimer = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.includeTimer"),
      true,
      "showTimer",
    );

    const timerSound = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.timerSound"),
      true,
      "timerSound",
    );

    const showLog = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.includeLog"),
      true,
      "showLog",
    );

    this.form = {
      exercise,
      workout,
      sets,
      reps,
      restTime,
      note,
      showTimer,
      timerSound,
      showLog,
    };
  }

  protected canInsert(): boolean {
    if (this.form?.exercise.exerciseInput.value.trim()) return true;
    new Notice(t("modal.notices.exerciseNameRequired"));
    return false;
  }

  protected generateCode(): string {
    const form = this.form;
    if (!form) throw new Error(t("modal.errors.missingElements"));

    const exerciseName = form.exercise.exerciseInput.value.trim();

    return this.generateExerciseSectionCode({
      exerciseName,
      workoutName: TargetSectionWithAutocomplete.workoutValue(
        form.workout,
        this.currentFileName,
      ),
      sets: parseInt(form.sets.value) || 4,
      reps: form.reps.value.trim(),
      restTime: parseInt(form.restTime.value) || 180,
      note: form.note.value.trim(),
      showTimer: form.showTimer.checked,
      timerSound: form.timerSound.checked,
      showLog: form.showLog.checked,
    });
  }

  private generateExerciseSectionCode(params: {
    exerciseName: string;
    workoutName: string;
    sets: number;
    reps: string;
    restTime: number;
    note: string;
    showTimer: boolean;
    timerSound: boolean;
    showLog: boolean;
  }): string {
    let sectionCode = t("modal.exerciseSectionTemplate", {
      exerciseName: params.exerciseName,
      sets: params.sets,
      reps: params.reps,
      restTime: params.restTime,
    });
    if (params.note) {
      sectionCode += t("modal.noteTemplate", {
        note: params.note,
      });
    }
    if (params.showTimer) {
      const timerCode = timerBlock.serialize({
        id: generateCodeBlockId(),
        type: TIMER_TYPE.COUNTDOWN,
        duration: params.restTime || undefined,
        exercise: params.exerciseName,
        showControls: true,
        sound: params.timerSound,
      });
      // eslint-disable-next-line i18next/no-literal-string -- markdown code block
      sectionCode += `${timerCode}\n\n`;
    }

    if (params.showLog) {
      // With a workout the table shows that exercise in that workout only
      const logCode = tableBlock.serialize({
        id: generateCodeBlockId(),
        exercise: params.exerciseName || undefined,
        workout: params.workoutName || undefined,
        exactMatch: true,
        sets: params.sets,
      });
      sectionCode += logCode;
    }

    return sectionCode;
  }
}
