import { Setting, App } from "obsidian";
import { t } from "@app/i18n";
import { Button } from "@app/components/atoms";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import type { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import { protocolIdFromName } from "@app/services/protocols/ProtocolCatalog";

/** Form to add or edit a custom protocol */
export class ProtocolEditorModal extends ModalBase {
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
    this.titleEl.setText(
      originalId
        ? t("settings.tooltips.editProtocol")
        : t("settings.buttons.addProtocol"),
    );

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
              formState.id = protocolIdFromName(value);
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

    Button.createModalActions(contentEl, {
      primary: {
        text: t("settings.buttons.saveProtocol"),
        onClick: async () => {
          if (await this.save()) this.close();
        },
      },
      onCancel: () => this.close(),
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
