import { Setting, App } from "obsidian";
import { t } from "@app/i18n";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { TIMER_TYPE, TimerPresetConfig } from "@app/features/timer/types";

/** Form to add or edit a timer preset */
export class TimerPresetEditorModal extends ModalBase {
  constructor(
    app: App,
    private formState: TimerPresetConfig,
    /** Returns false to keep the form open (validation failed) */
    private save: () => Promise<boolean>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.renderForm();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderForm(): void {
    const { contentEl, formState } = this;
    contentEl.empty();

    new Setting(contentEl)
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

    new Setting(contentEl)
      .setName(t("settings.labels.presetType"))
      .addDropdown((dropdown) => {
        dropdown.addOption(
          TIMER_TYPE.COUNTDOWN,
          t("timer.countdown"),
        );
        dropdown.addOption(TIMER_TYPE.INTERVAL, t("timer.interval"));
        dropdown.addOption(
          TIMER_TYPE.STOPWATCH,
          t("timer.stopwatch"),
        );
        dropdown.setValue(formState.type);
        dropdown.onChange((value) => {
          formState.type = value as TIMER_TYPE;
          // Redraw to show/hide interval options
          this.renderForm();
        });
      });

    new Setting(contentEl)
      .setName(t("settings.labels.presetDuration"))
      .setDesc(t("settings.descriptions.presetDurationDesc"))
      .addText((text) =>
        text
          .setValue(String(formState.duration))
          .onChange((value) => {
            const num = parseInt(value);
            if (!isNaN(num) && num > 0) {
              formState.duration = num;
            }
          }),
      );

    if (formState.type === TIMER_TYPE.INTERVAL) {
      new Setting(contentEl)
        .setName(t("settings.labels.presetRounds"))
        .setDesc(t("settings.descriptions.presetRoundsDesc"))
        .addText((text) =>
          text
            .setValue(String(formState.rounds || 5))
            .onChange((value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num > 0) {
                formState.rounds = num;
              }
            }),
        );
    }

    new Setting(contentEl)
      .setName(t("settings.labels.presetShowControls"))
      .addToggle((toggle) =>
        toggle.setValue(formState.showControls).onChange((value) => {
          formState.showControls = value;
        }),
      );

    new Setting(contentEl)
      .setName(t("settings.labels.presetSound"))
      .addToggle((toggle) =>
        toggle.setValue(formState.sound).onChange((value) => {
          formState.sound = value;
        }),
      );

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.savePreset"))
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
}
