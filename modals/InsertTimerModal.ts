// Insert Timer Modal for creating workout timer code blocks
import { App, Modal, Setting, MarkdownView } from "obsidian";
import type WorkoutChartsPlugin from "../main";

export class InsertTimerModal extends Modal {
  private plugin: WorkoutChartsPlugin;
  private duration: number = 90;
  private timerType: string = "countdown";
  private title: string = "Workout Timer";
  private showControls: boolean = true;
  private autoStart: boolean = false;
  private intervalTime: number = 30;
  private rounds: number = 5;
  private sound: boolean = false;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Insert Workout Timer" });

    // Timer Type
    new Setting(contentEl)
      .setName("Timer Type")
      .setDesc("Choose the type of timer")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("countdown", "Countdown")
          .setValue(this.timerType)
          .onChange((value) => {
            this.timerType = value;
          })
      );

    // Duration (for countdown)
    if (this.timerType === "countdown") {
      new Setting(contentEl)
        .setName("Duration (seconds)")
        .setDesc("Timer duration in seconds")
        .addText((text) =>
          text
            .setPlaceholder("300")
            .setValue(this.duration.toString())
            .onChange((value) => {
              this.duration = parseInt(value) || 300;
            })
        );
    }

    // Interval Time (for interval timer)
    if (this.timerType === "interval") {
      new Setting(contentEl)
        .setName("Interval Time (seconds)")
        .setDesc("Duration of each interval")
        .addText((text) =>
          text
            .setPlaceholder("30")
            .setValue(this.intervalTime.toString())
            .onChange((value) => {
              this.intervalTime = parseInt(value) || 30;
            })
        );

      new Setting(contentEl)
        .setName("Rounds")
        .setDesc("Number of intervals")
        .addText((text) =>
          text
            .setPlaceholder("5")
            .setValue(this.rounds.toString())
            .onChange((value) => {
              this.rounds = parseInt(value) || 5;
            })
        );
    }

    // Title
    new Setting(contentEl)
      .setName("Title")
      .setDesc("Timer title")
      .addText((text) =>
        text
          .setPlaceholder("Workout Timer")
          .setValue(this.title)
          .onChange((value) => {
            this.title = value;
          })
      );

    // Show Controls
    new Setting(contentEl)
      .setName("Show Controls")
      .setDesc("Show start/stop/reset buttons")
      .addToggle((toggle) =>
        toggle.setValue(this.showControls).onChange((value) => {
          this.showControls = value;
        })
      );

    // Auto Start
    new Setting(contentEl)
      .setName("Auto Start")
      .setDesc("Start timer automatically")
      .addToggle((toggle) =>
        toggle.setValue(this.autoStart).onChange((value) => {
          this.autoStart = value;
        })
      );

    // Sound
    new Setting(contentEl)
      .setName("Sound")
      .setDesc("Play sound on completion")
      .addToggle((toggle) =>
        toggle.setValue(this.sound).onChange((value) => {
          this.sound = value;
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
        text: "Insert Timer",
        cls: "workout-charts-btn workout-charts-btn-primary",
      })
      .addEventListener("click", () => {
        this.insertTimer();
      });
  }

  private insertTimer() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView && activeView.editor) {
      let timerCode = `\`\`\`workout-timer\n`;

      if (this.timerType === "countdown") {
        timerCode += `duration: ${this.duration}\n`;
      } else if (this.timerType === "interval") {
        timerCode += `intervalTime: ${this.intervalTime}\n`;
        timerCode += `rounds: ${this.rounds}\n`;
      }

      timerCode += `type: ${this.timerType}\n`;
      timerCode += `title: ${this.title}\n`;
      timerCode += `showControls: ${this.showControls}\n`;
      timerCode += `autoStart: ${this.autoStart}\n`;
      timerCode += `sound: ${this.sound}\n`;
      timerCode += "```";

      activeView.editor.replaceSelection(timerCode);
      this.close();
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
