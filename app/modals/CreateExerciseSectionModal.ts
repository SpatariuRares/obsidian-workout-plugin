// Refactored CreateExerciseSectionModal using reusable components
import { App, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { CodeGenerator } from "./components/CodeGenerator";
import { ExerciseAutocomplete } from "./components/ExerciseAutocomplete";

export class CreateExerciseSectionModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create Exercise Section" });

    // Create main container with better styling
    const mainContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });
    Object.assign(mainContainer.style, {
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
    });

    // Exercise Configuration Section
    const exerciseSection = this.createSection(
      mainContainer,
      "Exercise Configuration"
    );

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = await ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin
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
      "Qui spingi pesante. È il tuo esercizio fondamentale."
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
      text: "Create Section",
      cls: "workout-charts-btn workout-charts-btn-primary",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    createBtn.addEventListener("click", () => {
      const exerciseName = exerciseElements.exerciseInput.value.trim();
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
    sectionCode += `### ${params.sets} serie x ${params.reps} ripetizioni (Recupero: ${params.restTime}s)\n\n`;

    if (params.note) {
      sectionCode += `**Nota: ${params.note}**\n`;
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
      const logCode = CodeGenerator.generateTableCode({
        tableType: "exercise",
        exercise: params.exerciseName,
        workout: "",
        limit: 12,
        columnsType: "standard",
        showAddButton: true,
        buttonText: "➕ Aggiungi Log",
        searchByName: false,
        exactMatch: true,
        debug: false,
      });
      sectionCode += logCode;
    }

    return sectionCode;
  }
}
