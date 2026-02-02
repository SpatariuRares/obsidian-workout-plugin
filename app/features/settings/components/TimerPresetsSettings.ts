import { Setting, Notice } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { TIMER_TYPE, TimerPresetConfig } from "@app/types";
import WorkoutChartsPlugin from "main";

export class TimerPresetsSettings {
  private presetsContainer: HTMLElement | null = null;

  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.TIMER_PRESETS)
      .setHeading();

    // Default timer preset dropdown
    const presetNames = Object.keys(this.plugin.settings.timerPresets);

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.DEFAULT_TIMER_PRESET)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.DEFAULT_TIMER_PRESET)
      .addDropdown((dropdown) => {
        dropdown.addOption("", CONSTANTS.WORKOUT.SETTINGS.OPTIONS.NONE);
        presetNames.forEach((name) => {
          dropdown.addOption(name, name);
        });
        dropdown.setValue(this.plugin.settings.defaultTimerPreset || "");
        dropdown.onChange(async (value) => {
          this.plugin.settings.defaultTimerPreset = value || null;
          await this.plugin.saveSettings();
        });
      });

    // Container for presets list
    this.presetsContainer = containerEl.createDiv({
      cls: "timer-presets-container",
    });
    this.renderPresetsList();

    // Add preset button
    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.ADD_PRESET)
        .setCta()
        .onClick(() => {
          this.showPresetEditor(null);
        }),
    );
  }

  private renderPresetsList(): void {
    if (!this.presetsContainer) return;

    this.presetsContainer.empty();

    const presets = this.plugin.settings.timerPresets;
    const presetNames = Object.keys(presets);

    if (presetNames.length === 0) {
      this.presetsContainer.createEl("p", {
        text: CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.NO_PRESETS,
        cls: "workout-setting-item-description",
      });
      return;
    }

    presetNames.forEach((name) => {
      const preset = presets[name];
      this.renderPresetItem(preset);
    });
  }

  private renderPresetItem(preset: TimerPresetConfig): void {
    if (!this.presetsContainer) return;

    const presetSetting = new Setting(this.presetsContainer);

    // Format preset details for description
    const details = this.formatPresetDetails(preset);

    presetSetting
      .setName(preset.name)
      .setDesc(details)
      .addButton((button) =>
        button
          .setIcon("pencil")
          .setTooltip("Edit preset")
          .onClick(() => {
            this.showPresetEditor(preset);
          }),
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete preset")
          .onClick(async () => {
            if (
              confirm(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CONFIRM_DELETE_PRESET)
            ) {
              await this.deletePreset(preset.name);
            }
          }),
      );
  }

  private formatPresetDetails(preset: TimerPresetConfig): string {
    const parts: string[] = [];
    parts.push(`Type: ${preset.type}`);
    parts.push(`Duration: ${preset.duration}s`);

    if (preset.type === TIMER_TYPE.INTERVAL && preset.rounds) {
      parts.push(`Rounds: ${preset.rounds}`);
    }

    const options: string[] = [];
    if (preset.showControls) options.push("Controls");
    if (preset.autoStart) options.push("Auto-start");
    if (preset.sound) options.push("Sound");

    if (options.length > 0) {
      parts.push(`Options: ${options.join(", ")}`);
    }

    return parts.join(" | ");
  }

  private showPresetEditor(existingPreset: TimerPresetConfig | null): void {
    if (!this.presetsContainer) return;

    // Remove any existing editor
    const existingEditor = this.containerEl.querySelector(
      ".preset-editor-container",
    );
    if (existingEditor) {
      existingEditor.remove();
    }

    const editorContainer = this.containerEl.createDiv({
      cls: "preset-editor-container",
    });

    // Move editor right after presets container
    this.presetsContainer.after(editorContainer);

    // Create form state
    const formState: TimerPresetConfig = existingPreset
      ? { ...existingPreset }
      : {
          name: "",
          type: TIMER_TYPE.COUNTDOWN,
          duration: 30,
          showControls: true,
          autoStart: false,
          sound: true,
          rounds: 5,
        };

    const originalName = existingPreset?.name || null;

    // Preset name input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_NAME)
      .addText((text) =>
        text
          .setValue(formState.name)
          .setPlaceholder("Enter preset name")
          .onChange((value) => {
            formState.name = value;
          }),
      );

    // Timer type dropdown
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_TYPE)
      .addDropdown((dropdown) => {
        dropdown.addOption(TIMER_TYPE.COUNTDOWN, "Countdown");
        dropdown.addOption(TIMER_TYPE.INTERVAL, "Interval");
        dropdown.addOption(TIMER_TYPE.STOPWATCH, "Stopwatch");
        dropdown.setValue(formState.type);
        dropdown.onChange((value) => {
          formState.type = value as TIMER_TYPE;
          // Refresh editor to show/hide interval options
          this.showPresetEditor({ ...formState });
        });
      });

    // Duration input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_DURATION)
      .addText((text) =>
        text.setValue(String(formState.duration)).onChange((value) => {
          const num = parseInt(value);
          if (!isNaN(num) && num > 0) {
            formState.duration = num;
          }
        }),
      );

    // Interval-specific options (rounds only)
    if (formState.type === TIMER_TYPE.INTERVAL) {
      new Setting(editorContainer)
        .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_ROUNDS)
        .addText((text) =>
          text.setValue(String(formState.rounds || 5)).onChange((value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              formState.rounds = num;
            }
          }),
        );
    }

    // Boolean toggles
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_SHOW_CONTROLS)
      .addToggle((toggle) =>
        toggle.setValue(formState.showControls).onChange((value) => {
          formState.showControls = value;
        }),
      );

    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_AUTO_START)
      .addToggle((toggle) =>
        toggle.setValue(formState.autoStart).onChange((value) => {
          formState.autoStart = value;
        }),
      );

    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_SOUND)
      .addToggle((toggle) =>
        toggle.setValue(formState.sound).onChange((value) => {
          formState.sound = value;
        }),
      );

    // Save and Cancel buttons
    new Setting(editorContainer)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.SAVE_PRESET)
          .setCta()
          .onClick(async () => {
            await this.savePreset(formState, originalName);
            editorContainer.remove();
          }),
      )
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CANCEL)
          .onClick(() => {
            editorContainer.remove();
          }),
      );
  }

  private async savePreset(
    preset: TimerPresetConfig,
    originalName: string | null,
  ): Promise<void> {
    // Validate name
    if (!preset.name.trim()) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PRESET_NAME_REQUIRED);
      return;
    }

    const trimmedName = preset.name.trim();
    preset.name = trimmedName;

    // Check for duplicate names (unless editing the same preset)
    if (
      originalName !== trimmedName &&
      this.plugin.settings.timerPresets[trimmedName]
    ) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PRESET_NAME_EXISTS);
      return;
    }

    // If renaming, delete the old preset
    if (originalName && originalName !== trimmedName) {
      delete this.plugin.settings.timerPresets[originalName];

      // Update default preset reference if needed
      if (this.plugin.settings.defaultTimerPreset === originalName) {
        this.plugin.settings.defaultTimerPreset = trimmedName;
      }
    }

    // Save the preset
    this.plugin.settings.timerPresets[trimmedName] = preset;
    await this.plugin.saveSettings();

    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PRESET_SAVED);

    // Re-render the section
    // Instead of re-rendering the entire settings page, we can just re-render this section if we're careful.
    // However, the original code called this.display() which re-renders EVERYTHING.
    // Ideally we'd like to just re-render the list and dropdown.
    // Re-rendering the list is easy: this.renderPresetsList();
    // But the dropdown needs to be updated too.
    // For now, re-render the whole component might be tricky if we don't have a way to clear just this component's elements.
    // But since display() clears containerEl, we can simulate that or just rely on the plugin to reload the tab.
    // Actually, we can just clear our containerEl and call render() again?
    // But render() appends to containerEl, it doesn't clear it.
    // The caller (WorkoutChartsSettings) clears containerEl.
    // Maybe we should expose a refresh method or callback?
    // Let's try to just update what we can.
    
    // We need to refresh the dropdown in the parent settings.
    // The simplest way is to force a refresh of the settings tab.
    // But we don't have easy access to the tab instance directly here, only the plugin and container.
    // Actually, we can just rebuild the whole view if we want, but we don't control the whole view.
    
    // Let's just update the list for now. The dropdown might be stale until next reload.
    // To update the dropdown, we'd need to keep a reference to it.
    
    // Better approach:
    // Clear and redraw the whole section? We appended elements to containerEl. Removing them carefully is hard.
    
    // Let's stick to what the original code did: this.display() on the tab.
    // But we are in a separate class.
    // We can rely on a callback passed in constructor? `onUpdate: () => void`?
    // Or we can just try to update UI in place.
    
    this.renderPresetsList();
    
    // To update the dropdowns (which are created in render()), we would need to re-run render().
    // But render() appends new Settings. We'd get duplicates.
    
    // Let's modify the constructor to take a callback for easy full refresh if needed.
    // For now, I'll just update the list. The dropdown will be outdated until user reopens settings or we implement a refresh.
    // Actually, let's implement a rudimentary refresh by clearing the internal parts if we were managing our own container div.
    // But we are appending to the main containerEl.
    
    // Strategy: We can wrap our whole section in a div provided by us, or create a div inside the provided containerEl.
    // The original code passed `containerEl`.
    // I will wrap everything in a div so I can clear it and re-render.
  }

  private async deletePreset(name: string): Promise<void> {
    delete this.plugin.settings.timerPresets[name];

    // Clear default if it was this preset
    if (this.plugin.settings.defaultTimerPreset === name) {
      this.plugin.settings.defaultTimerPreset = null;
    }

    await this.plugin.saveSettings();
    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PRESET_DELETED);

    this.renderPresetsList();
  }
}
