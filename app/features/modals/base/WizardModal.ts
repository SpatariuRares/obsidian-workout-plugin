import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { ProgressMeter } from "@app/components/atoms/ProgressMeter";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";

/** One screen of a wizard */
export interface WizardStep {
  id: string;
  /** Shown in the stepper */
  label: string;
  /** Draws the step once, when the modal opens; its fields keep their value across navigation */
  render: (container: HTMLElement) => void;
  /**
   * Checks the step when the user tries to leave it forward: shows the problem
   * (`setStepError`), focuses the field and returns false to keep them here
   */
  validate?: () => boolean;
  /** Silent check: is the step filled in? (stepper look); unset = always */
  isComplete?: () => boolean;
  /** The step was just shown (refresh a summary of earlier steps) */
  onEnter?: () => void;
}

/**
 * A modal made of steps: a clickable stepper with a counter and a thin
 * progress bar on top, one step at a time, and a sticky footer (Back,
 * Next/Insert, Cancel). Every step is drawn once and only hidden when it is
 * not current, so what was typed stays across Back and Next.
 *
 * A subclass gives `getSteps()` and the usual insert-modal methods
 * (`generateCode`, ...). An edit modal sets `quickSubmit` so the submit
 * button is on every step, and overrides `submit()` to patch the block.
 */
export abstract class WizardModal extends BaseInsertModal {
  /** Edit mode: the submit button (Update) shows on every step, next to Next */
  protected quickSubmit = false;

  private steps: WizardStep[] = [];
  private panels: HTMLElement[] = [];
  private tabs: HTMLButtonElement[] = [];
  private errors: Array<HTMLElement | null> = [];
  private current = 0;
  private counter?: HTMLElement;
  private progress?: HTMLElement;
  private footerHost?: HTMLElement;

  protected abstract getSteps(): WizardStep[];

  /** The modal's own insert flow; an edit modal overrides it to write its change */
  protected submit(): void | Promise<void> {
    if (!this.canInsert()) return;
    const code = this.generateCode();
    this.insertIntoEditor(code, this.getSuccessMessage());
    this.close();
  }

  protected createConfigurationSections(container: HTMLElement): void {
    this.steps = this.getSteps();
    this.current = 0;
    container.addClass("workout-wizard");

    const header = container.createDiv({ cls: "workout-wizard-header" });
    const nav = header.createEl("nav", {
      cls: "workout-wizard-stepper",
      attr: { "aria-label": t("wizard.stepperLabel") },
    });
    this.tabs = this.steps.map((step, i) => {
      const tab = nav.createEl("button", {
        cls: "workout-wizard-step",
        attr: { type: "button" },
      });
      tab.createSpan({ cls: "workout-wizard-step-badge", text: String(i + 1) });
      tab.createSpan({ cls: "workout-wizard-step-label", text: step.label });
      tab.addEventListener("click", () => this.goTo(i));
      return tab;
    });
    this.counter = header.createDiv({ cls: "workout-wizard-counter" });
    this.progress = ProgressMeter.create(header, {
      value: 0,
      max: this.steps.length,
      label: t("wizard.stepperLabel"),
      className: "workout-wizard-progress",
    });

    const body = container.createDiv({ cls: "workout-wizard-body" });
    this.errors = this.steps.map(() => null);
    this.panels = this.steps.map((step) => {
      const panel = body.createDiv({
        cls: "workout-wizard-panel",
        attr: { "data-step-id": step.id },
      });
      step.render(panel);
      return panel;
    });
    this.show(0);
  }

  /** The sticky footer; an edit modal that wants its own row overrides this */
  protected createButtons(parent: HTMLElement): void {
    this.footerHost = parent.createDiv({ cls: "workout-wizard-footer" });
    this.renderFooter();
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
    const index = this.steps.findIndex((s) => s.id === stepId);
    if (index < 0) return;
    this.errors[index]?.remove();
    this.errors[index] = null;
    field?.removeAttribute("aria-invalid");
    if (!message || !field) return;

    const error = createErrorAfter(field, message);
    this.errors[index] = error;
    field.setAttribute("aria-invalid", "true");
    field.addEventListener("input", () => this.setStepError(stepId, null, field), {
      once: true,
    });
    field.focus();
  }

  /** Moves to a step; going forward first checks every step before it */
  protected goTo(target: number): void {
    if (target < 0 || target >= this.steps.length || target === this.current) return;
    const blocked = target > this.current ? this.firstIncomplete(target) : null;
    if (blocked !== null) {
      this.stopAt(blocked);
      return;
    }
    this.show(target);
  }

  /** Checks every step in order; the first one not filled in is shown with its problem */
  protected validateAll(): boolean {
    const blocked = this.firstIncomplete(this.steps.length);
    if (blocked === null) return true;
    this.stopAt(blocked);
    return false;
  }

  private stopAt(index: number): void {
    this.show(index);
    this.steps[index].validate?.();
  }

  /** The first step before `end` that says it is not filled in (silently) */
  private firstIncomplete(end: number): number | null {
    for (let i = 0; i < end; i++) {
      if (this.steps[i].isComplete?.() === false) return i;
    }
    return null;
  }

  private show(index: number): void {
    const forward = index >= this.current;
    this.current = index;
    this.panels.forEach((panel, i) => {
      panel.hidden = i !== index;
      panel.classList.toggle("is-forward", forward);
      panel.classList.toggle("is-backward", !forward);
    });
    this.steps[index].onEnter?.();
    this.refreshHeader();
    this.renderFooter();
  }

  private refreshHeader(): void {
    const last = this.steps.length - 1;
    this.steps.forEach((step, i) => {
      const tab = this.tabs[i];
      const done = i !== this.current && (i < this.current || step.isComplete?.() === true);
      tab.classList.toggle("is-done", done);
      tab.classList.toggle("is-current", i === this.current);
      tab.classList.toggle("is-upcoming", i > this.current && !done);
      tab.classList.toggle("is-blocked", i > this.current && this.firstIncomplete(i) !== null);
      if (i === this.current) tab.setAttribute("aria-current", "step");
      else tab.removeAttribute("aria-current");
      tab.setAttribute(
        "aria-label",
        done ? t("wizard.stepDone", { step: step.label }) : step.label,
      );
    });
    if (this.counter) {
      this.counter.textContent = t("wizard.stepCounter", {
        current: this.current + 1,
        total: this.steps.length,
      });
    }
    if (this.progress) {
      const value = this.current === last ? this.steps.length : this.current + 1;
      this.progress.setAttribute("aria-valuenow", String(value));
      this.progress.classList.toggle("is-done", this.current === last);
      const fill = this.progress.querySelector<HTMLElement>(".workout-progress-meter-fill");
      if (fill) {
        DomUtils.setCssProps(fill, {
          "--workout-progress-value": `${(value / this.steps.length) * 100}%`,
        });
      }
    }
  }

  private renderFooter(): void {
    const host = this.footerHost;
    if (!host) return;
    host.empty();
    const last = this.current === this.steps.length - 1;
    const submitText = this.getButtonText();
    const submit = {
      text: submitText,
      onClick: () => {
        if (this.validateAll()) void this.submit();
      },
    };

    Button.createModalActions(host, {
      start:
        this.current > 0
          ? (row) => {
              const back = Button.create(row, {
                text: t("wizard.back"),
                ariaLabel: t("wizard.back"),
                variant: BUTTONVARIANT.SECONDARY,
                className: "workout-wizard-back",
              });
              Button.onClick(back, () => this.goTo(this.current - 1));
            }
          : undefined,
      primary: last
        ? submit
        : { text: t("wizard.next"), onClick: () => this.goTo(this.current + 1) },
      others: !last && this.quickSubmit ? [submit] : [],
      onCancel: () => this.close(),
    });
  }
}

function createErrorAfter(field: HTMLElement, message: string): HTMLElement {
  // After the field's own group (autocomplete lists live inside it)
  const anchor = field.closest(".workout-charts-form-group") ?? field;
  const error = (anchor.parentElement ?? anchor).createDiv({
    cls: "workout-wizard-error",
    text: message,
    attr: { role: "alert" },
  });
  anchor.after(error);
  return error;
}
