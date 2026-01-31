import { Setting, Notice } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { CustomProtocolConfig } from "@app/types";
import { setCssProps } from "@app/utils/utils";
import WorkoutChartsPlugin from "main";

export class CustomProtocolsSettings {
  private protocolsContainer: HTMLElement | null = null;

  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.CUSTOM_PROTOCOLS)
      .setHeading();

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.CUSTOM_PROTOCOLS)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.CUSTOM_PROTOCOLS);

    // Container for protocols list
    this.protocolsContainer = containerEl.createDiv({
      cls: "custom-protocols-container",
    });
    this.renderProtocolsList();

    // Add protocol button
    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText(CONSTANTS.WORKOUT.SETTINGS.BUTTONS.ADD_PROTOCOL)
        .setCta()
        .onClick(() => {
          this.showProtocolEditor(null);
        }),
    );
  }

  private renderProtocolsList(): void {
    if (!this.protocolsContainer) return;

    this.protocolsContainer.empty();

    const protocols = this.plugin.settings.customProtocols || [];

    if (protocols.length === 0) {
      this.protocolsContainer.createEl("p", {
        text: CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.NO_CUSTOM_PROTOCOLS,
        cls: "workout-setting-item-description",
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
          }),
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete protocol")
          .onClick(async () => {
            if (
              confirm(
                CONSTANTS.WORKOUT.SETTINGS.MESSAGES.CONFIRM_DELETE_PROTOCOL,
              )
            ) {
              await this.deleteProtocol(protocol.id);
            }
          }),
      );
  }

  private formatProtocolDetails(
    protocol: CustomProtocolConfig,
  ): DocumentFragment {
    const fragment = document.createDocumentFragment();

    // Create a container for the badge preview and details
    const container = fragment.appendChild(document.createElement("span"));

    // Add abbreviation badge preview
    const badge = container.appendChild(document.createElement("span"));

    badge.classList.add("workout-protocol-badge");

    setCssProps(badge, {
      backgroundColor: protocol.color,
      color: this.getContrastColor(protocol.color),
    });
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

  private showProtocolEditor(
    existingProtocol: CustomProtocolConfig | null,
  ): void {
    if (!this.protocolsContainer) return;

    // Remove any existing editor
    const existingEditor = this.containerEl.querySelector(
      ".protocol-editor-container",
    );
    if (existingEditor) {
      existingEditor.remove();
    }

    const editorContainer = this.containerEl.createDiv({
      cls: "protocol-editor-container",
    });

    // Move editor right after protocols container
    this.protocolsContainer.after(editorContainer);

    // Create form state
    const formState: CustomProtocolConfig = existingProtocol
      ? { ...existingProtocol }
      : {
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
          .setPlaceholder("E.g., giant set")
          .onChange((value) => {
            formState.name = value;
            // Auto-generate ID from name if creating new protocol
            if (!originalId) {
              formState.id = value
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^a-z0-9_]/g, "");
            }
          }),
      );

    // Protocol abbreviation input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PROTOCOL_ABBREVIATION)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.PROTOCOL_ABBREVIATION)
      .addText((text) =>
        text
          .setValue(formState.abbreviation)
          .setPlaceholder("E.g., gs")
          .onChange((value) => {
            // Limit to 3 characters
            formState.abbreviation = value.slice(0, 3).toUpperCase();
            text.setValue(formState.abbreviation);
          }),
      );

    // Protocol color input
    new Setting(editorContainer)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.PROTOCOL_COLOR)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.PROTOCOL_COLOR)
      .addColorPicker((colorPicker) =>
        colorPicker.setValue(formState.color).onChange((value) => {
          formState.color = value;
        }),
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

  private async saveProtocol(
    protocol: CustomProtocolConfig,
    originalId: string | null,
  ): Promise<void> {
    // Validate name
    if (!protocol.name.trim()) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_NAME_REQUIRED);
      return;
    }

    // Validate abbreviation
    if (!protocol.abbreviation.trim() || protocol.abbreviation.length > 3) {
      new Notice(
        CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_ABBREVIATION_REQUIRED,
      );
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
      protocol.id = trimmedName
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    }

    // Initialize customProtocols array if needed
    if (!this.plugin.settings.customProtocols) {
      this.plugin.settings.customProtocols = [];
    }

    // Check for duplicate names (unless editing the same protocol)
    const existingIndex = this.plugin.settings.customProtocols.findIndex(
      (p) => p.id === protocol.id,
    );
    const existingNameIndex = this.plugin.settings.customProtocols.findIndex(
      (p) =>
        p.name.toLowerCase() === trimmedName.toLowerCase() &&
        p.id !== protocol.id,
    );

    if (existingNameIndex !== -1) {
      new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_NAME_EXISTS);
      return;
    }

    if (originalId && originalId !== protocol.id) {
      // Renaming: remove old and add new
      const oldIndex = this.plugin.settings.customProtocols.findIndex(
        (p) => p.id === originalId,
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

    this.renderProtocolsList();
  }

  private async deleteProtocol(id: string): Promise<void> {
    if (!this.plugin.settings.customProtocols) {
      return;
    }

    const index = this.plugin.settings.customProtocols.findIndex(
      (p) => p.id === id,
    );
    if (index !== -1) {
      this.plugin.settings.customProtocols.splice(index, 1);
    }

    await this.plugin.saveSettings();
    new Notice(CONSTANTS.WORKOUT.SETTINGS.MESSAGES.PROTOCOL_DELETED);

    this.renderProtocolsList();
  }
}
