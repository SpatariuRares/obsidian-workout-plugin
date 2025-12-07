// Refactored CreateExerciseSectionModal using reusable components
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_LABELS,
  MODAL_PLACEHOLDERS,
  MODAL_CHECKBOXES,
  MODAL_SECTIONS,
  MODAL_NOTICES,
  MODAL_DEFAULT_VALUES,
} from "@app/constants/ModalConstants";
import { TABLE_DEFAULTS } from "@app/constants/TableConstats";
import { TableColumnType, TABLE_TYPE, TIMER_TYPE } from "@app/types";
import { Button } from "@app/components/atoms";

export class CreateExerciseSectionModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: MODAL_TITLES.CREATE_EXERCISE_SECTION });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise Configuration Section
    const exerciseSection = this.createSection(
      mainContainer,
      MODAL_SECTIONS.EXERCISE_CONFIGURATION
    );

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin
    );

    // Workout input for combined filtering
    const workoutInput = this.createTextField(
      exerciseSection,
      MODAL_LABELS.WORKOUT_NAME_OPTIONAL,
      MODAL_PLACEHOLDERS.WORKOUT
    );

    // Current Workout checkbox
    const currentWorkoutToggle = this.createCheckboxField(
      exerciseSection,
      MODAL_CHECKBOXES.USE_CURRENT_WORKOUT_FILE,
      false,
      "currentWorkout"
    );

    // Sets input
    const setsInput = this.createNumberField(
      exerciseSection,
      MODAL_LABELS.SETS,
      parseInt(MODAL_PLACEHOLDERS.SETS),
      {
        min: 1,
        max: 20,
      }
    );

    // Reps input
    const repsInput = this.createTextField(
      exerciseSection,
      MODAL_LABELS.REPS,
      MODAL_PLACEHOLDERS.REPS_RANGE,
      MODAL_PLACEHOLDERS.REPS_RANGE
    );

    // Rest time input
    const restTimeInput = this.createNumberField(
      exerciseSection,
      MODAL_LABELS.REST_TIME,
      parseInt(MODAL_PLACEHOLDERS.REST_TIME),
      {
        min: 30,
        max: 600,
      }
    );

    // Note input
    const noteInput = this.createTextField(
      exerciseSection,
      MODAL_LABELS.NOTE,
      MODAL_PLACEHOLDERS.NOTE
    );

    // Options Section
    const optionsSection = this.createSection(
      mainContainer,
      MODAL_SECTIONS.OPTIONS
    );

    // Show timer toggle
    const showTimerToggle = this.createCheckboxField(
      optionsSection,
      MODAL_CHECKBOXES.INCLUDE_TIMER,
      true,
      "showTimer"
    );

    // Timer options (conditional)
    const timerAutoStartToggle = this.createCheckboxField(
      optionsSection,
      MODAL_CHECKBOXES.TIMER_AUTO_START,
      false,
      "timerAutoStart"
    );

    const timerSoundToggle = this.createCheckboxField(
      optionsSection,
      MODAL_CHECKBOXES.TIMER_SOUND,
      true,
      "timerSound"
    );

    // Show log toggle
    const showLogToggle = this.createCheckboxField(
      optionsSection,
      MODAL_CHECKBOXES.INCLUDE_LOG,
      true,
      "showLog"
    );

    // Buttons Section
    const buttonsSection = this.createButtonsSection(mainContainer);

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonsSection, {
      text: MODAL_BUTTONS.CANCEL,
      className: "workout-charts-btn",
      ariaLabel: MODAL_BUTTONS.CANCEL,
    });

    // Create button using Button atom
    const createBtn = Button.create(buttonsSection, {
      text: MODAL_BUTTONS.CREATE_SECTION,
      className: "workout-charts-btn workout-charts-btn-primary",
      ariaLabel: MODAL_BUTTONS.CREATE_SECTION,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    // Handle current workout toggle
    currentWorkoutToggle.addEventListener("change", () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = this.getCurrentFileName();
        workoutInput.classList.add("workout-opacity-50");
        workoutInput.classList.remove("workout-opacity-100");
      } else {
        workoutInput.disabled = false;
        workoutInput.value = "";
        workoutInput.classList.add("workout-opacity-100");
        workoutInput.classList.remove("workout-opacity-50");
      }
    });

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
      const timerAutoStart = timerAutoStartToggle.checked;
      const timerSound = timerSoundToggle.checked;
      const showLog = showLogToggle.checked;

      if (!exerciseName) {
        this.insertIntoEditor("", MODAL_NOTICES.EXERCISE_NAME_REQUIRED);
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
        timerAutoStart,
        timerSound,
        showLog,
      });

      this.insertIntoEditor(
        sectionCode,
        MODAL_NOTICES.EXERCISE_SECTION_CREATED
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
    timerAutoStart: boolean;
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
        title: params.exerciseName,
        showControls: true,
        autoStart: params.timerAutoStart,
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
        tableType,
        exercise: params.exerciseName,
        workout: params.workoutName,
        limit: MODAL_DEFAULT_VALUES.TABLE_LIMIT,
        columnsType: TableColumnType.STANDARD,
        showAddButton: true,
        buttonText: TABLE_DEFAULTS.BUTTON_TEXT,
        searchByName: false,
        exactMatch: true,
      });
      sectionCode += logCode;
    }

    return sectionCode;
  }
}
