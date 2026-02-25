import { Setting, Notice, App } from "obsidian";
import { t } from "@app/i18n";
import { TIMER_TYPE, TimerPresetConfig } from "@app/features/timer";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import WorkoutChartsPlugin from "main";

export class TimerPresetsSettings {
  private presetsContainer: HTMLElement | null = null;

  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.timerPresets"))
      .setHeading();

    // Default timer preset dropdown
    const presetNames = Object.keys(this.plugin.settings.timerPresets);

    new Setting(containerEl)
      .setName(t("settings.labels.defaultTimerPreset"))
      .setDesc(t("settings.descriptions.defaultTimerPreset"))
      .addDropdown((dropdown) => {
        dropdown.addOption("", t("settings.options.none"));
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
        .setButtonText(t("settings.buttons.addPreset"))
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
        text: t("settings.descriptions.noPresets"),
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
          .setTooltip(t("settings.tooltips.editPreset"))
          .onClick(() => {
            this.showPresetEditor(preset);
          }),
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip(t("settings.tooltips.deletePreset"))
          .onClick(() => {
            new ConfirmModal(
              this.app,
              t("settings.messages.confirmDeletePreset"),
              async () => {
                await this.deletePreset(preset.name);
              },
            ).open();
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
    if (preset.showControls) options.push(t("timer.presets.detailsControls"));
    if (preset.sound) options.push(t("timer.presets.detailsSound"));

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
          sound: true,
          rounds: 5,
        };

    const originalName = existingPreset?.name || null;

    // Preset name input
    new Setting(editorContainer)
      .setName(t("settings.labels.presetName"))
      .setDesc(t("settings.descriptions.presetNameDesc"))
      .addText((text) =>
        text
          .setValue(formState.name)
          .setPlaceholder(t("settings.placeholders.presetName"))
          .onChange((value) => {
            formState.name = value;
          }),
      );

    // Timer type dropdown
    new Setting(editorContainer)
      .setName(t("settings.labels.presetType"))
      .addDropdown((dropdown) => {
        dropdown.addOption(TIMER_TYPE.COUNTDOWN, t("timer.countdown"));
        dropdown.addOption(TIMER_TYPE.INTERVAL, t("timer.interval"));
        dropdown.addOption(TIMER_TYPE.STOPWATCH, t("timer.stopwatch"));
        dropdown.setValue(formState.type);
        dropdown.onChange((value) => {
          formState.type = value as TIMER_TYPE;
          // Refresh editor to show/hide interval options
          this.showPresetEditor({ ...formState });
        });
      });

    // Duration input
    new Setting(editorContainer)
      .setName(t("settings.labels.presetDuration"))
      .setDesc(t("settings.descriptions.presetDurationDesc"))
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
        .setName(t("settings.labels.presetRounds"))
        .setDesc(t("settings.descriptions.presetRoundsDesc"))
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
      .setName(t("settings.labels.presetShowControls"))
      .addToggle((toggle) =>
        toggle.setValue(formState.showControls).onChange((value) => {
          formState.showControls = value;
        }),
      );

    new Setting(editorContainer)
      .setName(t("settings.labels.presetSound"))
      .addToggle((toggle) =>
        toggle.setValue(formState.sound).onChange((value) => {
          formState.sound = value;
        }),
      );

    // Save and Cancel buttons
    new Setting(editorContainer)
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.savePreset"))
          .setCta()
          .onClick(async () => {
            await this.savePreset(formState, originalName);
            editorContainer.remove();
          }),
      )
      .addButton((button) =>
        button.setButtonText(t("settings.buttons.cancel")).onClick(() => {
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
      new Notice(t("settings.messages.presetNameRequired"));
      return;
    }

    const trimmedName = preset.name.trim();
    preset.name = trimmedName;

    // Check for duplicate names (unless editing the same preset)
    if (
      originalName !== trimmedName &&
      this.plugin.settings.timerPresets[trimmedName]
    ) {
      new Notice(t("settings.messages.presetNameExists"));
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

    new Notice(t("settings.messages.presetSaved"));
    this.renderPresetsList();
  }

  private async deletePreset(name: string): Promise<void> {
    delete this.plugin.settings.timerPresets[name];

    // Clear default if it was this preset
    if (this.plugin.settings.defaultTimerPreset === name) {
      this.plugin.settings.defaultTimerPreset = null;
    }

    await this.plugin.saveSettings();
    new Notice(t("settings.messages.presetDeleted"));

    this.renderPresetsList();
  }
}
