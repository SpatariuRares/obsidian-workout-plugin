import type { App } from "obsidian";
import { t } from "@app/i18n";
import { ProtocolEditorModal } from "@app/features/settings/modals/ProtocolEditorModal";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { ProtocolBadge } from "@app/components/atoms";
import { settingsListEditor } from "@app/features/settings/settingsListEditor";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import {
  isUnchangedDefaultProtocol,
  protocolHelp,
  protocolIdFromName,
} from "@app/services/protocols/ProtocolCatalog";

export class CustomProtocolsSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    /** Redraws the settings tab after the protocol list changed */
    private refresh: () => void,
  ) {}

  definitions(): DefinitionItem[] {
    // One list: the built-in protocols are entries of it, so a separate
    // "custom protocols" header would read as a second, empty list
    return [
      settingsListEditor<CustomProtocolConfig>({
        app: this.app,
        heading: t("settings.sections.customProtocols"),
        emptyState: t("settings.descriptions.noCustomProtocols"),
        addLabel: t("settings.buttons.addProtocol"),
        editTooltip: t("settings.tooltips.editProtocol"),
        deleteTooltip: t("settings.tooltips.deleteProtocol"),
        items: this.protocols(),
        keyOf: (protocol) => protocol.id,
        describe: (protocol) => ({
          name: protocol.name,
          desc: this.formatProtocolDetails(protocol),
        }),
        blank: () => ({
          id: "",
          name: "",
          abbreviation: "",
          color: "#6366f1", // Default indigo color
        }),
        open: (draft, original, save) =>
          new ProtocolEditorModal(
            this.app,
            draft,
            original?.id || null,
            save,
          ).open(),
        normalize: (protocol) => {
          protocol.name = protocol.name.trim();
          protocol.abbreviation = protocol.abbreviation
            .trim()
            .toUpperCase();
          if (!protocol.id)
            protocol.id = protocolIdFromName(protocol.name);
        },
        validate: (protocol, originalId) =>
          this.problemWith(protocol, originalId),
        upsert: (protocol, originalId) => {
          const list = this.protocols();
          const at = list.findIndex(
            (p) => p.id === (originalId ?? protocol.id),
          );
          if (at !== -1 && list[at].id === protocol.id) {
            list[at] = protocol;
            return;
          }
          // New, or its id changed: the old entry goes, it comes last
          if (at !== -1) list.splice(at, 1);
          list.push(protocol);
        },
        remove: (id) => {
          const list = this.protocols();
          const at = list.findIndex((p) => p.id === id);
          if (at !== -1) list.splice(at, 1);
        },
        persist: () => this.plugin.saveSettings(),
        refresh: this.refresh,
        messages: {
          confirmDelete: t("settings.messages.confirmDeleteProtocol"),
          saved: t("settings.messages.protocolSaved"),
          deleted: t("settings.messages.protocolDeleted"),
        },
      }),
    ];
  }

  /** The settings list, created on first use */
  private protocols(): CustomProtocolConfig[] {
    this.plugin.settings.customProtocols ??= [];
    return this.plugin.settings.customProtocols;
  }

  /** Why the typed protocol cannot be saved, or null */
  private problemWith(
    protocol: CustomProtocolConfig,
    originalId: string | null,
  ): string | null {
    if (!protocol.name)
      return t("settings.messages.protocolNameRequired");
    if (!protocol.abbreviation || protocol.abbreviation.length > 3) {
      return t("settings.messages.protocolAbbreviationRequired");
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(protocol.color)) {
      return t("settings.messages.protocolColorRequired");
    }
    const list = this.protocols();
    const sameName = list.some(
      (p) =>
        p.name.toLowerCase() === protocol.name.toLowerCase() &&
        p.id !== protocol.id,
    );
    // A new protocol whose name gives an id already in the list (e.g.
    // "Superset") would silently replace that entry
    const sameNewId =
      !originalId && list.some((p) => p.id === protocol.id);
    return sameName || sameNewId
      ? t("settings.messages.protocolNameExists")
      : null;
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
    const help = protocolHelp(protocol.id);
    if (help && isUnchangedDefaultProtocol(protocol)) {
      fragment.createDiv({ text: help });
    }

    return fragment;
  }
}
