import { Setting, App } from "obsidian";
import { t } from "@app/i18n";
import { Button } from "@app/components/atoms";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  TIMER_TYPE,
  TimerPresetConfig,
} from "@app/features/timer/types";
import {
  isNonNegative,
  isPositive,
  parseWholeNumber,
  renderNumberField,
} from "@app/features/settings/renderNumberField";

/** Form to add or edit a timer preset */
export class TimerPresetEditorModal extends ModalBase {
  constructor(
    app: App,
    private formState: TimerPresetConfig,
    private isNew: boolean,
    /** Returns false to keep the form open (validation failed) */
    private save: () => Promise<boolean>,
  ) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(
      this.isNew
        ? t("settings.buttons.addPreset")
        : t("settings.tooltips.editPreset"),
    );
    this.renderForm();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /** Number fields whose typed value is not valid (they block Save) */
  private invalid = new Set<Setting>();

  /** A whole-number box with its error line; an invalid value blocks Save */
  private wholeNumberField(
    setting: Setting,
    value: number,
    isValid: (value: number) => boolean,
    error: string,
    set: (value: number) => void,
  ): void {
    renderNumberField(setting, {
      value,
      parse: parseWholeNumber,
      isValid: (parsed) => {
        const valid = isValid(parsed);
        if (valid) this.invalid.delete(setting);
        else this.invalid.add(setting);
        return valid;
      },
      error,
      save: (parsed) => {
        set(parsed);
        return Promise.resolve();
      },
    });
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

    this.invalid.clear();
    this.wholeNumberField(
      new Setting(contentEl)
        .setName(t("settings.labels.presetDuration"))
        .setDesc(t("settings.descriptions.presetDurationDesc")),
      formState.duration,
      isPositive,
      t("settings.validation.mustBePositive"),
      (value) => (formState.duration = value),
    );

    if (formState.type === TIMER_TYPE.INTERVAL) {
      this.wholeNumberField(
        new Setting(contentEl)
          .setName(t("settings.labels.presetRounds"))
          .setDesc(t("settings.descriptions.presetRoundsDesc")),
        formState.rounds || 5,
        isPositive,
        t("settings.validation.mustBePositive"),
        (value) => (formState.rounds = value),
      );

      this.wholeNumberField(
        new Setting(contentEl)
          .setName(t("settings.labels.presetRest"))
          .setDesc(t("settings.descriptions.presetRestDesc")),
        formState.rest ?? 0,
        isNonNegative,
        t("settings.validation.mustBeNonNegative"),
        (value) => (formState.rest = value),
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

    Button.createModalActions(contentEl, {
      primary: {
        text: t("settings.buttons.savePreset"),
        onClick: async () => {
          // A field showing its error would otherwise be saved as it was
          if (this.invalid.size > 0) return;
          if (await this.save()) this.close();
        },
      },
      onCancel: () => this.close(),
    });
  }
}
