import { App, Notice } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { InsertTimerModal } from "@app/features/timer/modals/InsertTimerModal";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { Button } from "@app/components/atoms/Button";
import { Chip } from "@app/components/atoms/Chip";
import { t } from "@app/i18n";

/**
 * EditTimerModal - Modal for editing existing timer code block parameters.
 *
 * Extends InsertTimerModal to reuse form creation, then pre-fills fields
 * with current params and replaces the code block on submit (matched by ID).
 */
export class EditTimerModal extends InsertTimerModal {
  private readonly initialParams: EmbeddedTimerParams;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    params: EmbeddedTimerParams,
  ) {
    super(app, plugin);
    this.initialParams = params;
  }

  protected getModalTitle(): string {
    return t("modal.titles.editTimer");
  }

  protected getButtonText(): string {
    return t("modal.buttons.updateTimer");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.timerUpdated");
  }

  /**
   * Preserve the existing code block ID instead of generating a new one
   */
  protected getCodeBlockId(): string {
    return this.initialParams.id || super.getCodeBlockId();
  }

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    this.prefillFields();
  }

  /**
   * Pre-fill all form fields with the current timer params
   */
  private prefillFields(): void {
    const params = this.initialParams;

    if (!this.timerElements || !this.timerHandlers) return;

    // Set timer type
    if (params.type) {
      this.timerHandlers.setTimerType(params.type);
    }

    // Pre-fill duration
    if (params.duration !== undefined) {
      this.timerElements.durationInput.value = params.duration.toString();
    }

    // Pre-fill rounds
    if (params.rounds !== undefined) {
      this.timerElements.roundsInput.value = params.rounds.toString();
    }

    // Pre-fill exercise
    if (params.exercise) {
      this.timerElements.exerciseInput.value = params.exercise;
    }

    // Pre-fill toggles
    if (params.showControls !== undefined) {
      this.timerElements.showControlsToggle.checked = params.showControls;
    }
    if (params.sound !== undefined) {
      this.timerElements.soundToggle.checked = params.sound;
    }

    // Select preset chip if applicable
    if (params.preset) {
      this.selectedPreset = params.preset;
      for (const [name, chip] of this.presetChips) {
        Chip.setSelected(chip, name === params.preset);
      }
    }
  }

  /**
   * Override button creation to replace code block instead of inserting
   */
  protected createButtons(container: HTMLElement): void {
    const updateBtn = Button.create(container, {
      text: this.getButtonText(),
      variant: "primary",
      ariaLabel: this.getButtonText(),
    });

    const cancelBtn = Button.create(container, {
      text: t("modal.buttons.cancel"),
      variant: "warning",
      ariaLabel: t("modal.buttons.cancel"),
    });

    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(updateBtn, () => {
      const code = this.generateCode();
      const id = this.initialParams.id;

      if (!id) {
        new Notice(t("modal.notices.timerUpdateFailed"));
        this.close();
        return;
      }

      void CodeBlockEditorService.replaceCodeBlock(
        this.app,
        "workout-timer",
        id,
        code,
      ).then((success) => {
        if (success) {
          new Notice(this.getSuccessMessage());
        } else {
          new Notice(t("modal.notices.timerUpdateFailed"));
        }
      });

      this.close();
    });
  }
}
