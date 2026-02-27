// Refactored CreateExerciseSectionModal using reusable components

import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { TABLE_TYPE } from "@app/features/tables/types";
import { TIMER_TYPE } from "@app/features/timer/types";
import { Button } from "@app/components/atoms";
import { setupWorkoutToggle } from "@app/utils/form/FormUtils";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export class CreateExerciseSectionModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", {
      text: t("modal.titles.createExerciseSection"),
    });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise Configuration Section
    const exerciseSection = this.createSection(
      mainContainer,
      t("modal.sections.exerciseConfiguration"),
    );

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin,
    );

    // Workout input for combined filtering
    const workoutInput = this.createTextField(
      exerciseSection,
      t("modal.workoutNameOptional"),
      t("modal.placeholders.workout"),
    );

    // Current Workout checkbox
    const currentWorkoutToggle = this.createCheckboxField(
      exerciseSection,
      t("modal.checkboxes.useCurrentWorkoutFile"),
      false,
      "currentWorkout",
    );

    // Sets input
    const setsInput = this.createNumberField(
      exerciseSection,
      t("modal.sets"),
      parseInt(t("modal.placeholders.sets")),
      {
        min: 1,
        max: 20,
      },
    );

    // Reps input
    const repsInput = this.createTextField(
      exerciseSection,
      t("modal.labels.reps"),
      t("modal.placeholders.repsRange"),
      t("modal.placeholders.repsRange"),
    );

    // Rest time input
    const restTimeInput = this.createNumberField(
      exerciseSection,
      t("modal.restTime"),
      parseInt(t("modal.placeholders.restTime")),
      {
        min: 30,
        max: 600,
      },
    );

    // Note input
    const noteInput = this.createTextField(
      exerciseSection,
      t("modal.note"),
      t("modal.placeholders.note"),
    );

    // Options Section
    const optionsSection = this.createSection(
      mainContainer,
      t("modal.sections.options"),
    );

    // Show timer toggle
    const showTimerToggle = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.includeTimer"),
      true,
      "showTimer",
    );

    const timerSoundToggle = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.timerSound"),
      true,
      "timerSound",
    );

    // Show log toggle
    const showLogToggle = this.createCheckboxField(
      optionsSection,
      t("modal.checkboxes.includeLog"),
      true,
      "showLog",
    );

    // Buttons Section
    const buttonsSection = Button.createContainer(mainContainer);

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonsSection, {
      text: t("modal.buttons.cancel"),
      ariaLabel: t("modal.buttons.cancel"),
      variant: "warning",
    });

    // Create button using Button atom
    const createBtn = Button.create(buttonsSection, {
      text: t("modal.buttons.createSection"),
      variant: "primary",
      ariaLabel: t("modal.buttons.createSection"),
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    // Handle current workout toggle
    setupWorkoutToggle(currentWorkoutToggle, workoutInput, () =>
      this.getCurrentFileName(),
    );

    Button.onClick(createBtn, () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
      const useCurrentWorkout = currentWorkoutToggle.checked;
      const currentFileName = this.getCurrentFileName();
      const workoutName = useCurrentWorkout
        ? currentFileName
        : workoutInput.value.trim();
      const sets = parseInt(setsInput.value) || 4;
      const reps = repsInput.value.trim();
      const restTime = parseInt(restTimeInput.value) || 180;
      const note = noteInput.value.trim();
      const showTimer = showTimerToggle.checked;
      const timerSound = timerSoundToggle.checked;
      const showLog = showLogToggle.checked;

      if (!exerciseName) {
        this.insertIntoEditor("", t("modal.notices.exerciseNameRequired"));
        return;
      }

      const sectionCode = this.generateExerciseSectionCode({
        exerciseName,
        workoutName,
        sets,
        reps,
        restTime,
        note,
        showTimer,
        timerSound,
        showLog,
      });

      this.insertIntoEditor(
        sectionCode,
        t("modal.notices.exerciseSectionCreated"),
      );
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
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
    let sectionCode = `## ${params.exerciseName}:\n`;
    sectionCode += `### ${params.sets} sets x ${params.reps} reps (Rest: ${params.restTime}s)\n\n`;

    if (params.note) {
      sectionCode += `**Note: ${params.note}**\n`;
    }

    if (params.showTimer) {
      const timerCode = CodeGenerator.generateTimerCode({
        type: TIMER_TYPE.COUNTDOWN,
        duration: params.restTime,
        exercise: params.exerciseName,
        showControls: true,
        sound: params.timerSound,
      });
      sectionCode += `${timerCode}\n\n`;
    }

    if (params.showLog) {
      // Determine table type based on whether workout is specified
      const tableType: TABLE_TYPE = params.workoutName
        ? TABLE_TYPE.COMBINED
        : TABLE_TYPE.EXERCISE;
      const logCode = CodeGenerator.generateTableCode({
        id: generateCodeBlockId(),
        tableType,
        exercise: params.exerciseName,
        workout: params.workoutName,
        limit: CONSTANTS.WORKOUT.MODAL.DEFAULTS.TABLE_LIMIT,
        showAddButton: true,
        searchByName: false,
        exactMatch: true,
      });
      sectionCode += logCode;
    }

    return sectionCode;
  }
}
