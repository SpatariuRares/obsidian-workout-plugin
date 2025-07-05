// Create Exercise Section Modal for generating complete workout sections
import { App, Modal, Setting, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../main";

export class CreateExerciseSectionModal extends Modal {
  private plugin: WorkoutChartsPlugin;
  private exerciseName: string = "";
  private sets: number = 4;
  private reps: string = "8-10";
  private restTime: number = 180;
  private note: string = "";
  private showTimer: boolean = true;
  private showLog: boolean = true;
  private timerAutoStart: boolean = false;
  private timerSound: boolean = true;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create Exercise Section" });

    // Exercise Name
    new Setting(contentEl)
      .setName("Exercise Name")
      .setDesc("Name of the exercise")
      .addText((text) =>
        text
          .setPlaceholder("Hip Thrust con Bilanciere")
          .setValue(this.exerciseName)
          .onChange((value) => {
            this.exerciseName = value;
          })
      );

    // Sets
    new Setting(contentEl)
      .setName("Sets")
      .setDesc("Number of sets")
      .addText((text) =>
        text
          .setPlaceholder("4")
          .setValue(this.sets.toString())
          .onChange((value) => {
            this.sets = parseInt(value) || 4;
          })
      );

    // Reps
    new Setting(contentEl)
      .setName("Reps")
      .setDesc("Repetitions (e.g., 8-10, 12, 5-8)")
      .addText((text) =>
        text
          .setPlaceholder("8-10")
          .setValue(this.reps)
          .onChange((value) => {
            this.reps = value;
          })
      );

    // Rest Time
    new Setting(contentEl)
      .setName("Rest Time (seconds)")
      .setDesc("Rest time between sets")
      .addText((text) =>
        text
          .setPlaceholder("180")
          .setValue(this.restTime.toString())
          .onChange((value) => {
            this.restTime = parseInt(value) || 180;
          })
      );

    // Note
    new Setting(contentEl)
      .setName("Note")
      .setDesc("Additional notes about the exercise")
      .addTextArea((text) =>
        text
          .setPlaceholder(
            "Qui spingi pesante. È il tuo esercizio fondamentale."
          )
          .setValue(this.note)
          .onChange((value) => {
            this.note = value;
          })
      );

    // Show Timer
    new Setting(contentEl)
      .setName("Include Timer")
      .setDesc("Add workout timer for rest periods")
      .addToggle((toggle) =>
        toggle.setValue(this.showTimer).onChange((value) => {
          this.showTimer = value;
        })
      );

    // Timer Auto Start
    if (this.showTimer) {
      new Setting(contentEl)
        .setName("Timer Auto Start")
        .setDesc("Start timer automatically")
        .addToggle((toggle) =>
          toggle.setValue(this.timerAutoStart).onChange((value) => {
            this.timerAutoStart = value;
          })
        );

      // Timer Sound
      new Setting(contentEl)
        .setName("Timer Sound")
        .setDesc("Play sound when timer completes")
        .addToggle((toggle) =>
          toggle.setValue(this.timerSound).onChange((value) => {
            this.timerSound = value;
          })
        );
    }

    // Show Log
    new Setting(contentEl)
      .setName("Include Log")
      .setDesc("Add workout log table")
      .addToggle((toggle) =>
        toggle.setValue(this.showLog).onChange((value) => {
          this.showLog = value;
        })
      );

    // Buttons
    const buttonContainer = contentEl.createEl("div", {
      cls: "workout-charts-buttons",
    });

    buttonContainer
      .createEl("button", {
        text: "Cancel",
        cls: "workout-charts-btn",
      })
      .addEventListener("click", () => {
        this.close();
      });

    buttonContainer
      .createEl("button", {
        text: "Create Section",
        cls: "workout-charts-btn workout-charts-btn-primary",
      })
      .addEventListener("click", () => {
        this.createExerciseSection();
      });
  }

  private createExerciseSection() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView && activeView.editor) {
      let sectionCode = `## ${this.exerciseName}:\n`;
      sectionCode += `### ${this.sets} serie x ${this.reps} ripetizioni (Recupero: ${this.restTime}s)\n\n`;

      if (this.note) {
        sectionCode += `**Nota: ${this.note}**\n`;
      }

      if (this.showTimer) {
        sectionCode += `\`\`\`workout-timer\n`;
        sectionCode += `duration: ${this.restTime}\n`;
        sectionCode += `type: countdown\n`;
        sectionCode += `title: ${this.exerciseName}\n`;
        sectionCode += `showControls: true\n`;
        sectionCode += `autoStart: ${this.timerAutoStart}\n`;
        sectionCode += `sound: ${this.timerSound}\n`;
        sectionCode += "```\n\n";
      }

      if (this.showLog) {
        sectionCode += `\`\`\`workout-log\n`;
        sectionCode += `exercise: ${this.exerciseName}\n`;
        sectionCode += `limit: 12\n`;
        sectionCode += `columns: ["Data", "Esercizio", "Ripetizioni", "Peso (kg)", "Volume", "Link"]\n`;
        sectionCode += `showAddButton: true\n`;
        sectionCode += `exactMatch: true\n`;
        sectionCode += `debug: false\n`;
        sectionCode += "```\n";
      }

      activeView.editor.replaceSelection(sectionCode);
      this.close();
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
