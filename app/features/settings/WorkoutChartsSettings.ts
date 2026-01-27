// Settings tab for the Workout Charts plugin
import { CONSTANTS } from "@app/constants/Constants";
import { TIMER_TYPE, TimerPresetConfig, CustomProtocolConfig } from "@app/types";
import WorkoutChartsPlugin from "main";
import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import { Notice } from "obsidian";
import { FolderSuggest } from "@app/services/suggest/FolderSuggest";

export class WorkoutChartsSettingTab extends PluginSettingTab {
  plugin: WorkoutChartsPlugin;
  private presetsContainer: HTMLElement | null = null;
  private protocolsContainer: HTMLElement | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.CSV_PATH)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CSV_PATH)
      .addText((text) =>
        text
          .setPlaceholder(CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_CSV_PATH)
          .setValue(this.plugin.settings.csvLogFilePath)
          .onChange(async (value) => {
            this.plugin.settings.csvLogFilePath = normalizePath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.EXERCISE_FOLDER)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.EXERCISE_FOLDER)
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS.ENTER_FOLDER_PATH)
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.exerciseFolderPath = normalizePath(value);
            await this.plugin.saveSettings();
          });
      });

    // Filtering Section
    new Setting(containerEl).setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.FILTERING).setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.DEFAULT_EXACT_MATCH)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.DEFAULT_EXACT_MATCH)
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.defaultExactMatch)
          .onChange(async (value) => {
            this.plugin.settings.defaultExactMatch = value;
            await this.plugin.saveSettings();
          })
      );

    // CSV Management Section
    new Setting(containerEl).setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.CSV_MANAGEMENT).setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.COMMANDS.CREATE_CSV)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CREATE_CSV)
      .addButton((button) =>
        button.setButtonText(CONSTANTS.WORKOUT.UI.BUTTONS.CREATE_FILE).onClick(async () => {
          try {
            await this.plugin.createCSVLogFile();
            new Notice(CONSTANTS.WORKOUT.MESSAGES.SUCCESS.CSV_CREATED);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            new Notice(`Error creating CSV file: ${errorMessage}`);
          }
        })
      );

    // Timer Presets Section
    this.renderTimerPresetsSection(containerEl);

    // Custom Protocols Section
    this.renderCustomProtocolsSection(containerEl);

    // Templates Section
    this.renderTemplatesSection(containerEl);

    // Progressive Overload Section
    this.renderProgressiveOverloadSection(containerEl);
  }

  private renderTimerPresetsSection(containerEl: HTMLElement): void {
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
    this.presetsContainer = containerEl.createDiv({ cls: "timer-presets-container" });
    this.renderPresetsList();

    // Add preset button
    new Setting(containerEl)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.ADD_PRESET)
          .setCta()
          .onClick(() => {
            this.showPresetEditor(null);
          })
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
        cls: "setting-item-description",
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
          })
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete preset")
          .onClick(async () => {
            if (confirm(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CONFIRM_DELETE_PRESET)) {
              await this.deletePreset(preset.name);
            }
          })
      );
  }

  private formatPresetDetails(preset: TimerPresetConfig): string {
    const parts: string[] = [];
    parts.push(`Type: ${preset.type}`);
    parts.push(`Duration: ${preset.duration}s`);

    if (preset.type === TIMER_TYPE.INTERVAL) {
      if (preset.intervalTime) parts.push(`Interval: ${preset.intervalTime}s`);
      if (preset.rounds) parts.push(`Rounds: ${preset.rounds}`);
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
    const existingEditor = this.containerEl.querySelector(".preset-editor-container");
    if (existingEditor) {
      existingEditor.remove();
    }

    const editorContainer = this.containerEl.createDiv({ cls: "preset-editor-container" });

    // Move editor right after presets container
    this.presetsContainer.after(editorContainer);

    // Create form state
    const formState: TimerPresetConfig = existingPreset ? { ...existingPreset } : {
      name: "",
      type: TIMER_TYPE.COUNTDOWN,
      duration: 90,
      showControls: true,
      autoStart: false,
      sound: true,
      intervalTime: 30,
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
          })
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
        text
          .setValue(String(formState.duration))
          .onChange((value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              formState.duration = num;
            }
          })
      );

    // Interval-specific options
    if (formState.type === TIMER_TYPE.INTERVAL) {
      new Setting(editorContainer)
        .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_INTERVAL)
        .addText((text) =>
          text
            .setValue(String(formState.intervalTime || 30))
            .onChange((value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num > 0) {
                formState.intervalTime = num;
              }
            })
        );

      new Setting(editorContainer)
        .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_ROUNDS)
        .addText((text) =>
          text
            .setValue(String(formState.rounds || 5))
            .onChange((value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num > 0) {
                formState.rounds = num;
              }
            })
        );
    }

    // Boolean toggles
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_SHOW_CONTROLS)
      .addToggle((toggle) =>
        toggle.setValue(formState.showControls).onChange((value) => {
          formState.showControls = value;
        })
      );

    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_AUTO_START)
      .addToggle((toggle) =>
        toggle.setValue(formState.autoStart).onChange((value) => {
          formState.autoStart = value;
        })
      );

    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PRESET_SOUND)
      .addToggle((toggle) =>
        toggle.setValue(formState.sound).onChange((value) => {
          formState.sound = value;
        })
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
          })
      )
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CANCEL)
          .onClick(() => {
            editorContainer.remove();
          })
      );
  }

  private async savePreset(preset: TimerPresetConfig, originalName: string | null): Promise<void> {
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

    // Re-render the entire settings page to update all sections
    this.display();
  }

  private async deletePreset(name: string): Promise<void> {
    delete this.plugin.settings.timerPresets[name];

    // Clear default if it was this preset
    if (this.plugin.settings.defaultTimerPreset === name) {
      this.plugin.settings.defaultTimerPreset = null;
    }

    await this.plugin.saveSettings();
    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PRESET_DELETED);

    // Re-render the entire settings page to update all sections
    this.display();
  }

  private renderCustomProtocolsSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.CUSTOM_PROTOCOLS)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.CUSTOM_PROTOCOLS)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CUSTOM_PROTOCOLS);

    // Container for protocols list
    this.protocolsContainer = containerEl.createDiv({ cls: "custom-protocols-container" });
    this.renderProtocolsList();

    // Add protocol button
    new Setting(containerEl)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.ADD_PROTOCOL)
          .setCta()
          .onClick(() => {
            this.showProtocolEditor(null);
          })
      );
  }

  private renderProtocolsList(): void {
    if (!this.protocolsContainer) return;

    this.protocolsContainer.empty();

    const protocols = this.plugin.settings.customProtocols || [];

    if (protocols.length === 0) {
      this.protocolsContainer.createEl("p", {
        text: CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.NO_CUSTOM_PROTOCOLS,
        cls: "setting-item-description",
      });
      return;
    }

    protocols.forEach((protocol) => {
      this.renderProtocolItem(protocol);
    });
  }

  private renderProtocolItem(protocol: CustomProtocolConfig): void {
    if (!this.protocolsContainer) return;

    const protocolSetting = new Setting(this.protocolsContainer);

    // Format protocol details for description
    const details = this.formatProtocolDetails(protocol);

    protocolSetting
      .setName(protocol.name)
      .setDesc(details)
      .addButton((button) =>
        button
          .setIcon("pencil")
          .setTooltip("Edit protocol")
          .onClick(() => {
            this.showProtocolEditor(protocol);
          })
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete protocol")
          .onClick(async () => {
            if (confirm(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CONFIRM_DELETE_PROTOCOL)) {
              await this.deleteProtocol(protocol.id);
            }
          })
      );
  }

  private formatProtocolDetails(protocol: CustomProtocolConfig): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Create a container for the badge preview and details
    const container = fragment.appendChild(document.createElement("span"));

    // Add abbreviation badge preview
    const badge = container.appendChild(document.createElement("span"));
    badge.style.display = "inline-block";
    badge.style.padding = "2px 6px";
    badge.style.borderRadius = "3px";
    badge.style.backgroundColor = protocol.color;
    badge.style.color = this.getContrastColor(protocol.color);
    badge.style.fontSize = "10px";
    badge.style.fontWeight = "bold";
    badge.style.textTransform = "uppercase";
    badge.style.marginRight = "8px";
    badge.textContent = protocol.abbreviation;

    // Add ID info
    const idText = container.appendChild(document.createElement("span"));
    idText.textContent = `ID: ${protocol.id}`;

    return fragment;
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black or white based on luminance
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  private showProtocolEditor(existingProtocol: CustomProtocolConfig | null): void {
    if (!this.protocolsContainer) return;

    // Remove any existing editor
    const existingEditor = this.containerEl.querySelector(".protocol-editor-container");
    if (existingEditor) {
      existingEditor.remove();
    }

    const editorContainer = this.containerEl.createDiv({ cls: "protocol-editor-container" });

    // Move editor right after protocols container
    this.protocolsContainer.after(editorContainer);

    // Create form state
    const formState: CustomProtocolConfig = existingProtocol ? { ...existingProtocol } : {
      id: "",
      name: "",
      abbreviation: "",
      color: "#6366f1", // Default indigo color
    };

    const originalId = existingProtocol?.id || null;

    // Protocol name input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PROTOCOL_NAME)
      .addText((text) =>
        text
          .setValue(formState.name)
          .setPlaceholder("e.g., Giant Set")
          .onChange((value) => {
            formState.name = value;
            // Auto-generate ID from name if creating new protocol
            if (!originalId) {
              formState.id = value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
            }
          })
      );

    // Protocol abbreviation input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PROTOCOL_ABBREVIATION)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.PROTOCOL_ABBREVIATION)
      .addText((text) =>
        text
          .setValue(formState.abbreviation)
          .setPlaceholder("e.g., GS")
          .onChange((value) => {
            // Limit to 3 characters
            formState.abbreviation = value.slice(0, 3).toUpperCase();
            text.setValue(formState.abbreviation);
          })
      );

    // Protocol color input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PROTOCOL_COLOR)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.PROTOCOL_COLOR)
      .addColorPicker((colorPicker) =>
        colorPicker
          .setValue(formState.color)
          .onChange((value) => {
            formState.color = value;
          })
      );

    // Save and Cancel buttons
    new Setting(editorContainer)
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.SAVE_PROTOCOL)
          .setCta()
          .onClick(async () => {
            await this.saveProtocol(formState, originalId);
            editorContainer.remove();
          })
      )
      .addButton((button) =>
        button
          .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.CANCEL)
          .onClick(() => {
            editorContainer.remove();
          })
      );
  }

  private async saveProtocol(protocol: CustomProtocolConfig, originalId: string | null): Promise<void> {
    // Validate name
    if (!protocol.name.trim()) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_NAME_REQUIRED);
      return;
    }

    // Validate abbreviation
    if (!protocol.abbreviation.trim() || protocol.abbreviation.length > 3) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_ABBREVIATION_REQUIRED);
      return;
    }

    // Validate color
    if (!protocol.color.trim() || !/^#[0-9A-Fa-f]{6}$/.test(protocol.color)) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_COLOR_REQUIRED);
      return;
    }

    const trimmedName = protocol.name.trim();
    protocol.name = trimmedName;
    protocol.abbreviation = protocol.abbreviation.trim().toUpperCase();

    // Ensure ID is valid
    if (!protocol.id) {
      protocol.id = trimmedName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    }

    // Initialize customProtocols array if needed
    if (!this.plugin.settings.customProtocols) {
      this.plugin.settings.customProtocols = [];
    }

    // Check for duplicate names (unless editing the same protocol)
    const existingIndex = this.plugin.settings.customProtocols.findIndex(
      (p) => p.id === protocol.id
    );
    const existingNameIndex = this.plugin.settings.customProtocols.findIndex(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== protocol.id
    );

    if (existingNameIndex !== -1) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_NAME_EXISTS);
      return;
    }

    if (originalId && originalId !== protocol.id) {
      // Renaming: remove old and add new
      const oldIndex = this.plugin.settings.customProtocols.findIndex(
        (p) => p.id === originalId
      );
      if (oldIndex !== -1) {
        this.plugin.settings.customProtocols.splice(oldIndex, 1);
      }
      this.plugin.settings.customProtocols.push(protocol);
    } else if (existingIndex !== -1) {
      // Updating existing
      this.plugin.settings.customProtocols[existingIndex] = protocol;
    } else {
      // Adding new
      this.plugin.settings.customProtocols.push(protocol);
    }

    await this.plugin.saveSettings();
    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_SAVED);

    // Re-render the entire settings page to update all sections
    this.display();
  }

  private async deleteProtocol(id: string): Promise<void> {
    if (!this.plugin.settings.customProtocols) {
      return;
    }

    const index = this.plugin.settings.customProtocols.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.plugin.settings.customProtocols.splice(index, 1);
    }

    await this.plugin.saveSettings();
    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_DELETED);

    // Re-render the entire settings page to update all sections
    this.display();
  }

  private renderTemplatesSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.TEMPLATES)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.EXERCISE_BLOCK_TEMPLATE)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.EXERCISE_BLOCK_TEMPLATE)
      .addTextArea((text) => {
        text
          .setValue(this.plugin.settings.exerciseBlockTemplate)
          .setPlaceholder(this.plugin.settings.exerciseBlockTemplate)
          .onChange(async (value) => {
            this.plugin.settings.exerciseBlockTemplate = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.rows = 10;
        text.inputEl.cols = 50;
      });
  }

  private renderProgressiveOverloadSection(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.PROGRESSIVE_OVERLOAD)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.WEIGHT_INCREMENT)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.WEIGHT_INCREMENT)
      .addText((text) =>
        text
          .setValue(String(this.plugin.settings.weightIncrement))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.weightIncrement = numValue;
              await this.plugin.saveSettings();
            }
          })
      );
  }
}
