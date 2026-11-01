import { Notice, App } from "obsidian";
import { t } from "@app/i18n";
import { ProtocolEditorModal } from "@app/features/settings/modals/ProtocolEditorModal";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { ProtocolBadge } from "@app/components/atoms";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  isUnchangedDefaultProtocol,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";

/** Explanation shown under each built-in protocol in the list */
const PROTOCOL_HELP: Record<string, string> = {
  warmup: "settings.protocolHelp.warmup",
  drop_set: "settings.protocolHelp.dropSet",
  myo_reps: "settings.protocolHelp.myoReps",
  rest_pause: "settings.protocolHelp.restPause",
  superset: "settings.protocolHelp.superset",
  twentyone: "settings.protocolHelp.twentyone",
};

export class CustomProtocolsSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    /** Redraws the settings tab after the protocol list changed */
    private refresh: () => void,
  ) {}

  definitions(): DefinitionItem[] {
    const protocols = this.plugin.settings.customProtocols || [];

    // One list: the built-in protocols are entries of it, so a separate
    // "custom protocols" header would read as a second, empty list
    return [
      {
        type: "list",
        heading: t("settings.sections.customProtocols"),
        emptyState: t("settings.descriptions.noCustomProtocols"),
        addItem: {
          name: t("settings.buttons.addProtocol"),
          action: () => this.showProtocolEditor(null),
        },
        onDelete: (index) => this.confirmDelete(protocols[index]?.id),
        deleteTooltip: t("settings.tooltips.deleteProtocol"),
        items: protocols.map((protocol) => ({
          name: protocol.name,
          desc: this.formatProtocolDetails(protocol),
          tooltip: t("settings.tooltips.editProtocol"),
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
    const container = fragment.createSpan({
      cls: "workout-protocol-details",
    });

    // Add abbreviation badge preview
    ProtocolBadge.create(container, {
      text: protocol.abbreviation,
      color: protocol.color,
    });

    // Add ID info
    container.createSpan({ text: `ID: ${protocol.id}` });

    // What a built-in protocol is for, so the default entries explain themselves
    // (only while it is as added: a renamed entry may mean something else)
    const help = PROTOCOL_HELP[protocolId(protocol.id)];
    if (help && isUnchangedDefaultProtocol(protocol)) {
      fragment.createDiv({ text: t(help) });
    }

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

    // A new protocol whose name gives an id already in the list (e.g.
    // "Superset") would silently replace that entry
    if (existingNameIndex !== -1 || (!originalId && existingIndex !== -1)) {
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
