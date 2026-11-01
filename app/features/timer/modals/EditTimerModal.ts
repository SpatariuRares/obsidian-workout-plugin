import { App, Notice } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertTimerModal } from "@app/features/timer/modals/InsertTimerModal";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import { changedParams } from "@app/services/codeblocks/CodeBlockSchema";
import { timerBlock } from "@app/features/timer/timerBlock";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { Chip } from "@app/components/atoms/Chip";
import { t } from "@app/i18n";

/**
 * EditTimerModal - Modal for editing existing timer code block parameters.
 *
 * Extends InsertTimerModal to reuse form creation, then pre-fills fields
 * with current params and patches the parameters the user changed into the
 * code block on submit (matched by ID).
 */
export class EditTimerModal extends InsertTimerModal {
  private readonly initialParams: EmbeddedTimerParams;
  /** The form as it opened, to tell which parameters the user changed */
  private formAtOpen: EmbeddedTimerParams = {};

  constructor(
    app: App,
    plugin: WorkoutPluginContext,
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

  /**
   * An interval block written with `duration` (before `work` existed) keeps
   * that line, so editing the work never leaves two conflicting values
   */
  protected collectParams(): EmbeddedTimerParams {
    const params = super.collectParams();
    if (
      params.work !== undefined &&
      this.initialParams.work === undefined &&
      this.initialParams.duration !== undefined
    ) {
      return { ...params, duration: params.work, work: undefined };
    }
    return params;
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    super.createConfigurationSections(container);
    this.prefillFields();
    this.formAtOpen = this.collectParams();
  }

  /**
   * Pre-fill all form fields with the current timer params
   */
  private prefillFields(): void {
    const params = this.initialParams;

    if (!this.timerElements || !this.timerHandlers) return;

    // Apply preset values as base first, then override with explicit params.
    // This ensures preset-only timers (e.g. `preset: rest90` with no explicit
    // duration/type) show the correct preset values instead of form defaults.
    if (params.preset) {
      this.applyPresetValues(params.preset);
      this.selectedPreset = params.preset;
      for (const [name, chip] of this.presetChips) {
        Chip.setSelected(chip, name === params.preset);
      }
    }

    // Override with explicit params from the code block
    if (params.type) {
      this.timerHandlers.setTimerType(params.type);
    }
    // For intervals the duration field shows the work phase
    const duration = params.work ?? params.duration;
    if (duration !== undefined) {
      this.timerElements.durationInput.value = duration.toString();
    }
    if (params.rest !== undefined) {
      this.timerElements.restInput.value = params.rest.toString();
    }
    if (params.rounds !== undefined) {
      this.timerElements.roundsInput.value = params.rounds.toString();
    }
    if (params.exercise) {
      this.timerElements.exerciseInput.value = params.exercise;
    }
    if (params.showControls !== undefined) {
      this.timerElements.showControlsToggle.checked =
        params.showControls;
    }
    if (params.sound !== undefined) {
      this.timerElements.soundToggle.checked = params.sound;
    }
  }

  /**
   * Override button creation to replace code block instead of inserting
   */
  protected createButtons(container: HTMLElement): void {
    const updateBtn = Button.create(container, {
      text: this.getButtonText(),
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: this.getButtonText(),
    });

    const cancelBtn = Button.create(container, {
      text: t("modal.buttons.cancel"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("modal.buttons.cancel"),
    });

    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(updateBtn, () => {
      const id = this.initialParams.id;

      if (!id) {
        new Notice(t("modal.notices.timerUpdateFailed"));
        this.close();
        return;
      }

      // Only what the user changed: autoStart, workout, comments and the
      // line order stay as they are in the note
      const changes = changedParams(this.formAtOpen, this.collectParams());

      void CodeBlockEditorService.patchCodeBlock(
        this.app,
        timerBlock,
        { id },
        changes,
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
