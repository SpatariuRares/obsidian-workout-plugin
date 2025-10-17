// Refactored CreateExerciseSectionModal using reusable components
import { App, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { CodeGenerator } from "@app/modals/components/CodeGenerator";
import { ExerciseAutocomplete } from "@app/modals/components/ExerciseAutocomplete";

export class CreateExerciseSectionModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create exercise section" });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise Configuration Section
    const exerciseSection = this.createSection(
      mainContainer,
      "Exercise configuration"
    );

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin
    );

    // Workout input for combined filtering
    const workoutContainer = this.createFormGroup(exerciseSection);
    const workoutInput = this.createTextInput(
      workoutContainer,
      "Workout Name (optional):",
      "e.g. Workout A, Training B, or use checkbox below"
    );

    // Current Workout checkbox
    const currentWorkoutContainer = this.createCheckboxGroup(exerciseSection);
    const currentWorkoutToggle = this.createCheckbox(
      currentWorkoutContainer,
      "Use Current Workout (file name)",
      false,
      "currentWorkout"
    );

    // Sets input
    const setsContainer = this.createFormGroup(exerciseSection);
    const setsInput = this.createNumberInput(
      setsContainer,
      "Sets:",
      "4",
      1,
      20,
      "4"
    );

    // Reps input
    const repsContainer = this.createFormGroup(exerciseSection);
    const repsInput = this.createTextInput(
      repsContainer,
      "Reps:",
      "8-10",
      "8-10"
    );

    // Rest time input
    const restTimeContainer = this.createFormGroup(exerciseSection);
    const restTimeInput = this.createNumberInput(
      restTimeContainer,
      "Rest Time (seconds):",
      "90",
      30,
      600,
      "90"
    );

    // Note input
    const noteContainer = this.createFormGroup(exerciseSection);
    const noteInput = this.createTextInput(
      noteContainer,
      "Note:",
      "Push hard here. This is your fundamental exercise."
    );

    // Options Section
    const optionsSection = this.createSection(mainContainer, "Options");

    // Show timer toggle
    const showTimerContainer = this.createCheckboxGroup(optionsSection);
    const showTimerToggle = this.createCheckbox(
      showTimerContainer,
      "Include Timer",
      true,
      "showTimer"
    );

    // Timer options (conditional)
    const timerOptionsContainer = this.createCheckboxGroup(optionsSection);
    const timerAutoStartToggle = this.createCheckbox(
      timerOptionsContainer,
      "Timer Auto Start",
      false,
      "timerAutoStart"
    );

    const timerSoundContainer = this.createCheckboxGroup(optionsSection);
    const timerSoundToggle = this.createCheckbox(
      timerSoundContainer,
      "Timer Sound",
      true,
      "timerSound"
    );

    // Show log toggle
    const showLogContainer = this.createCheckboxGroup(optionsSection);
    const showLogToggle = this.createCheckbox(
      showLogContainer,
      "Include Log",
      true,
      "showLog"
    );

    // Buttons Section
    const buttonsSection = this.createButtonsSection(mainContainer);

    // Cancel button
    const cancelBtn = buttonsSection.createEl("button", {
      text: "Cancel",
      cls: "workout-charts-btn",
    });

    // Create button
    const createBtn = buttonsSection.createEl("button", {
      text: "Create section",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    // Handle current workout toggle
    currentWorkoutToggle.addEventListener("change", () => {
      if (currentWorkoutToggle.checked) {
        workoutInput.disabled = true;
        workoutInput.value = this.getCurrentFileName();
        workoutInput.classList.add("opacity-50");
        workoutInput.classList.remove("opacity-100");
      } else {
        workoutInput.disabled = false;
        workoutInput.value = "";
        workoutInput.classList.add("opacity-100");
        workoutInput.classList.remove("opacity-50");
      }
    });

    createBtn.addEventListener("click", () => {
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
        this.insertIntoEditor("", "❌ Please enter an exercise name");
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
        "✅ Exercise section created successfully!"
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
        timerType: "countdown",
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
      const tableType = params.workoutName ? "combined" : "exercise";
      const logCode = CodeGenerator.generateTableCode({
        tableType,
        exercise: params.exerciseName,
        workout: params.workoutName,
        limit: 12,
        columnsType: "standard",
        showAddButton: true,
        buttonText: "➕ Add Log",
        searchByName: false,
        exactMatch: true,
        debug: false,
      });
      sectionCode += logCode;
    }

    return sectionCode;
  }
}
