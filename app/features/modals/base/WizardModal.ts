import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  WizardShell,
  type WizardStep,
} from "@app/features/modals/base/WizardShell";

export type { WizardStep };

/**
 * A modal made of steps (see WizardShell): a clickable stepper with a counter
 * and a thin progress bar on top, one step at a time, and a sticky footer
 * (Back, Next/Insert, Cancel).
 *
 * A subclass gives `getSteps()` and the usual insert-modal methods
 * (`generateCode`, ...). An edit modal sets `quickSubmit` so the submit
 * button is on every step, and overrides `submit()` to patch the block.
 */
export abstract class WizardModal extends BaseInsertModal {
  /** Edit mode: the submit button (Update) shows on every step, next to Next */
  protected quickSubmit = false;

  private shell?: WizardShell;

  protected abstract getSteps(): WizardStep[];

  /** The modal's own insert flow; an edit modal overrides it to write its change */
  protected submit(): void | Promise<void> {
    if (!this.canInsert()) return;
    const code = this.generateCode();
    this.insertIntoEditor(code, this.getSuccessMessage());
    this.close();
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    this.shell = new WizardShell({
      steps: this.getSteps(),
      buttonText: () => this.getButtonText(),
      quickSubmit: () => this.quickSubmit,
      submit: () => this.submit(),
      close: () => this.close(),
    });
    this.shell.mount(container);
  }

  /** The sticky footer; an edit modal that wants its own row overrides this */
  protected createButtons(parent: HTMLElement): void {
    this.shell?.createFooter(parent);
  }

  /**
   * Shows `message` under the step's field (red, announced) and focuses it;
   * null clears it. Typing in the field clears it too.
   */
  protected setStepError(
    stepId: string,
    message: string | null,
    field?: HTMLElement,
  ): void {
    this.shell?.setStepError(stepId, message, field);
  }

  /** Moves to a step; going forward first checks every step before it */
  protected goTo(target: number): void {
    this.shell?.goTo(target);
  }

  /** Checks every step in order; the first one not filled in is shown with its problem */
  protected validateAll(): boolean {
    return this.shell?.validateAll() ?? true;
  }

  /** Redraws the stepper, counter and progress (call after filling fields programmatically) */
  protected refreshHeader(): void {
    this.shell?.refreshHeader();
  }
}
