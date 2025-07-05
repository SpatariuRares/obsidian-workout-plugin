// Refactored InsertTimerModal using reusable components
import { App } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { TimerConfigurationSection } from "./components/TimerConfigurationSection";
import { CodeGenerator } from "./components/CodeGenerator";

export class InsertTimerModal extends ModalBase {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Insert Workout Timer" });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Timer Configuration Section using reusable component
    const { elements: timerElements } = TimerConfigurationSection.create(
      this,
      mainContainer
    );

    // Buttons Section
    const buttonsSection = this.createButtonsSection(mainContainer);

    // Cancel button
    const cancelBtn = buttonsSection.createEl("button", {
      text: "Cancel",
      cls: "mod-warning",
    });

    // Insert button
    const insertBtn = buttonsSection.createEl("button", {
      text: "Insert Timer",
      cls: "mod-cta",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    insertBtn.addEventListener("click", () => {
      const timerValues = TimerConfigurationSection.getValues(timerElements);

      const timerCode = CodeGenerator.generateTimerCode({
        timerType: timerValues.timerType,
        duration: timerValues.duration,
        intervalTime: timerValues.intervalTime,
        rounds: timerValues.rounds,
        title: timerValues.title,
        showControls: timerValues.showControls,
        autoStart: timerValues.autoStart,
        sound: timerValues.sound,
      });

      this.insertIntoEditor(timerCode, "✅ Timer inserito con successo!");
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
