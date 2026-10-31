import { Setting, Notice, App, Modal } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { ProtocolBadge } from "@app/components/atoms";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

export class CustomProtocolsSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    /** Redraws the settings tab after the protocol list changed */
    private refresh: () => void,
  ) {}

  definitions(): DefinitionItem[] {
    const protocols = this.plugin.settings.customProtocols || [];

    return [
      {
        type: "group",
        heading: t("settings.sections.customProtocols"),
        items: [
          {
            name: t("settings.labels.customProtocols"),
            desc: t("settings.descriptions.customProtocols"),
          },
        ],
      },
      {
        type: "list",
        emptyState: t("settings.descriptions.noCustomProtocols"),
        addItem: {
          name: t("settings.buttons.addProtocol"),
          action: () => this.showProtocolEditor(null),
        },
        onDelete: (index) => this.confirmDelete(protocols[index]?.id),
        items: protocols.map((protocol) => ({
          name: protocol.name,
          desc: this.formatProtocolDetails(protocol),
          action: () => this.showProtocolEditor(protocol),
        })),
      },
    ];
  }

  private confirmDelete(id: string | undefined): void {
    if (id === undefined) return;
    new ConfirmModal(
      this.app,
      t("settings.messages.confirmDeleteProtocol"),
      async () => {
        await this.deleteProtocol(id);
      },
    ).open();
  }

  private formatProtocolDetails(
    protocol: CustomProtocolConfig,
  ): DocumentFragment {
    const fragment = createFragment();

    // Create a container for the badge preview and details
    const container = fragment.createSpan();

    // Add abbreviation badge preview
    ProtocolBadge.create(container, {
      text: protocol.abbreviation,
      color: protocol.color,
    });

    // Add ID info
    container.createSpan({ text: `ID: ${protocol.id}` });

    return fragment;
  }

  private showProtocolEditor(
    existingProtocol: CustomProtocolConfig | null,
  ): void {
    const formState: CustomProtocolConfig = existingProtocol
      ? { ...existingProtocol }
      : {
          id: "",
          name: "",
          abbreviation: "",
          color: "#6366f1", // Default indigo color
        };
    const originalId = existingProtocol?.id || null;

    new ProtocolEditorModal(this.app, formState, originalId, () =>
      this.saveProtocol(formState, originalId),
    ).open();
  }

  private async saveProtocol(
    protocol: CustomProtocolConfig,
    originalId: string | null,
  ): Promise<boolean> {
    // Validate name
    if (!protocol.name.trim()) {
      new Notice(t("settings.messages.protocolNameRequired"));
      return false;
    }

    // Validate abbreviation
    if (
      !protocol.abbreviation.trim() ||
      protocol.abbreviation.length > 3
    ) {
      new Notice(t("settings.messages.protocolAbbreviationRequired"));
      return false;
    }

    // Validate color
    if (
      !protocol.color.trim() ||
      !/^#[0-9A-Fa-f]{6}$/.test(protocol.color)
    ) {
      new Notice(t("settings.messages.protocolColorRequired"));
      return false;
    }

    const trimmedName = protocol.name.trim();
    protocol.name = trimmedName;
    protocol.abbreviation = protocol.abbreviation
      .trim()
      .toUpperCase();

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
    const existingIndex =
      this.plugin.settings.customProtocols.findIndex(
        (p) => p.id === protocol.id,
      );
    const existingNameIndex =
      this.plugin.settings.customProtocols.findIndex(
        (p) =>
          p.name.toLowerCase() === trimmedName.toLowerCase() &&
          p.id !== protocol.id,
      );

    if (existingNameIndex !== -1) {
      new Notice(t("settings.messages.protocolNameExists"));
      return false;
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

    this.refresh();
    return true;
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

    this.refresh();
  }
}

/** Form to add or edit a custom protocol */
class ProtocolEditorModal extends Modal {
  constructor(
    app: App,
    private formState: CustomProtocolConfig,
    private originalId: string | null,
    /** Returns false to keep the form open (validation failed) */
    private save: () => Promise<boolean>,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, formState, originalId } = this;
    contentEl.empty();

    new Setting(contentEl)
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

    new Setting(contentEl)
      .setName(t("settings.labels.protocolAbbreviation"))
      .setDesc(t("settings.descriptions.protocolAbbreviation"))
      .addText((text) =>
        text
          .setValue(formState.abbreviation)
          .setPlaceholder(
            t("settings.placeholders.protocolAbbreviation"),
          )
          .onChange((value) => {
            // Limit to 3 characters
            formState.abbreviation = value.slice(0, 3).toUpperCase();
            text.setValue(formState.abbreviation);
          }),
      );

    new Setting(contentEl)
      .setName(t("settings.labels.protocolColor"))
      .setDesc(t("settings.descriptions.protocolColor"))
      .addColorPicker((colorPicker) =>
        colorPicker.setValue(formState.color).onChange((value) => {
          formState.color = value;
        }),
      );

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.saveProtocol"))
          .setCta()
          .onClick(async () => {
            if (await this.save()) this.close();
          }),
      )
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.cancel"))
          .onClick(() => this.close()),
      );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
