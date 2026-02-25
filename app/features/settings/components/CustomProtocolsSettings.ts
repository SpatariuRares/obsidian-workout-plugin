import { Setting, Notice, App } from "obsidian";
import { t } from "@app/i18n";
import { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { ProtocolBadge } from "@app/components/atoms";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import WorkoutChartsPlugin from "main";

export class CustomProtocolsSettings {
  private protocolsContainer: HTMLElement | null = null;

  constructor(
    private app: App,
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.customProtocols"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.customProtocols"))
      .setDesc(t("settings.descriptions.customProtocols"));

    // Container for protocols list
    this.protocolsContainer = containerEl.createDiv({
      cls: "custom-protocols-container",
    });
    this.renderProtocolsList();

    // Add protocol button
    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText(t("settings.buttons.addProtocol"))
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
        text: t("settings.descriptions.noCustomProtocols"),
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
          .setTooltip(t("settings.tooltips.editProtocol"))
          .onClick(() => {
            this.showProtocolEditor(protocol);
          }),
      )
      .addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip(t("settings.tooltips.deleteProtocol"))
          .onClick(() => {
            new ConfirmModal(
              this.app,
              t("settings.messages.confirmDeleteProtocol"),
              async () => {
                await this.deleteProtocol(protocol.id);
              },
            ).open();
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
    ProtocolBadge.create(container, {
      text: protocol.abbreviation,
      color: protocol.color,
    });

    // Add ID info
    const idText = container.appendChild(document.createElement("span"));
    idText.textContent = `ID: ${protocol.id}`;

    return fragment;
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
      .setName(t("settings.labels.protocolName"))
      .addText((text) =>
        text
          .setValue(formState.name)
          .setPlaceholder(t("settings.placeholders.protocolName"))
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
      .setName(t("settings.labels.protocolAbbreviation"))
      .setDesc(t("settings.descriptions.protocolAbbreviation"))
      .addText((text) =>
        text
          .setValue(formState.abbreviation)
          .setPlaceholder(t("settings.placeholders.protocolAbbreviation"))
          .onChange((value) => {
            // Limit to 3 characters
            formState.abbreviation = value.slice(0, 3).toUpperCase();
            text.setValue(formState.abbreviation);
          }),
      );

    // Protocol color input
    new Setting(editorContainer)
      .setName(t("settings.labels.protocolColor"))
      .setDesc(t("settings.descriptions.protocolColor"))
      .addColorPicker((colorPicker) =>
        colorPicker.setValue(formState.color).onChange((value) => {
          formState.color = value;
        }),
      );

    // Save and Cancel buttons
    new Setting(editorContainer)
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.saveProtocol"))
          .setCta()
          .onClick(async () => {
            await this.saveProtocol(formState, originalId);
            editorContainer.remove();
          }),
      )
      .addButton((button) =>
        button.setButtonText(t("settings.buttons.cancel")).onClick(() => {
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
      new Notice(t("settings.messages.protocolNameRequired"));
      return;
    }

    // Validate abbreviation
    if (!protocol.abbreviation.trim() || protocol.abbreviation.length > 3) {
      new Notice(t("settings.messages.protocolAbbreviationRequired"));
      return;
    }

    // Validate color
    if (!protocol.color.trim() || !/^#[0-9A-Fa-f]{6}$/.test(protocol.color)) {
      new Notice(t("settings.messages.protocolColorRequired"));
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
      new Notice(t("settings.messages.protocolNameExists"));
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
    new Notice(t("settings.messages.protocolSaved"));

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
    new Notice(t("settings.messages.protocolDeleted"));

    this.renderProtocolsList();
  }
}
