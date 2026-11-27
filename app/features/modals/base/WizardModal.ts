import { App } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  Button,
  BUTTONVARIANT,
  Icon,
  type ModalAction,
} from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

export interface WizardStep<TState> {
  id: string;
  label: string;
  render: (container: HTMLElement, state: TState) => void;
  /**
   * Interactive check run before advancing past this step or submitting.
   * Return false (after showing inline feedback and focusing) to stay on this step.
   */
  validate?: (state: TState) => boolean;
  /**
   * Pure predicate telling whether this step satisfies its requirements so
   * future stepper buttons can unlock. Defaults to true when omitted.
   */
  isComplete?: (state: TState) => boolean;
}

type TransitionDirection = "forward" | "backward" | "none";

/**
 * Reusable multi-step modal shell extending `ModalBase`.
 * Renders a header with a clickable horizontal stepper, `Step X of N` counter,
 * and slim 3px progress track; a scrollable step pane with directional
 * transitions; and a sticky `Button.createModalActions` footer.
 */
export abstract class WizardModal<TState> extends ModalBase {
  protected state!: TState;
  private steps: WizardStep<TState>[] = [];
  private currentStepIndex = 0;
  private headerEl?: HTMLElement;
  private bodyEl?: HTMLElement;
  private footerEl?: HTMLElement;
  private stepButtons: HTMLButtonElement[] = [];

  constructor(
    app: App,
    protected plugin?: WorkoutPluginContext,
  ) {
    super(app);
  }

  protected abstract getModalTitle(): string;
  protected abstract getButtonText(): string;
  protected abstract createInitialState(): TState;
  protected abstract getSteps(): WizardStep<TState>[];
  protected abstract onSubmit(state: TState): void;

  protected get stepCount(): number {
    return this.steps.length;
  }

  /**
   * Optional secondary actions rendered in the sticky footer next to the
   * primary button (e.g. a quick Update button in edit mode).
   */
  protected getSecondaryActions(_stepIndex: number): ModalAction[] {
    return [];
  }

  /**
   * Optional rare actions rendered at the start of the footer row.
   */
  protected renderFooterStartExtras(
    _row: HTMLElement,
    _stepIndex: number,
  ): void {}

  /**
   * Refreshes the stepper navigation state (e.g. enabling/disabling future
   * step buttons) without re-rendering the active step pane.
   */
  protected notifyStateChange(): void {
    this.syncStepperButtons();
  }

  protected isActiveStepElement(el?: HTMLElement): boolean {
    return Boolean(el && this.bodyEl?.contains(el));
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");
    contentEl.addClass("workout-wizard-modal");

    const mainContainer = this.createStyledMainContainer(contentEl);
    mainContainer.addClass("workout-wizard-container");

    this.state = this.createInitialState();
    this.steps = this.getSteps();
    this.currentStepIndex = 0;

    this.headerEl = mainContainer.createDiv({ cls: "workout-wizard-header" });
    this.bodyEl = mainContainer.createDiv({ cls: "workout-wizard-body" });
    this.footerEl = mainContainer.createDiv({ cls: "workout-wizard-footer" });

    this.renderAll("none");
  }

  onClose(): void {
    this.contentEl.empty();
    this.stepButtons = [];
  }

  protected goToStep(targetIndex: number): void {
    if (
      targetIndex < 0 ||
      targetIndex >= this.steps.length ||
      targetIndex === this.currentStepIndex
    ) {
      return;
    }

    if (targetIndex > this.currentStepIndex) {
      for (let i = this.currentStepIndex; i < targetIndex; i++) {
        const step = this.steps[i];
        if (step.validate) {
          if (i !== this.currentStepIndex) {
            this.currentStepIndex = i;
            this.renderAll("none");
          }
          if (!step.validate(this.state)) {
            return;
          }
        } else if (!this.isStepComplete(i)) {
          if (i !== this.currentStepIndex) {
            this.currentStepIndex = i;
            this.renderAll("none");
          }
          return;
        }
      }
    }

    const direction: TransitionDirection =
      targetIndex > this.currentStepIndex ? "forward" : "backward";
    this.currentStepIndex = targetIndex;
    this.renderAll(direction);
  }

  protected goNext(): void {
    this.goToStep(this.currentStepIndex + 1);
  }

  protected goBack(): void {
    this.goToStep(this.currentStepIndex - 1);
  }

  protected handleSubmit(): void {
    for (let i = 0; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (!step.validate) continue;
      if (i !== this.currentStepIndex) {
        const valid = this.isStepComplete(i) && step.validate(this.state);
        if (!valid) {
          this.currentStepIndex = i;
          this.renderAll("none");
          step.validate(this.state);
          return;
        }
        continue;
      }
      if (!step.validate(this.state)) {
        return;
      }
    }
    this.onSubmit(this.state);
  }

  private isStepComplete(index: number): boolean {
    const step = this.steps[index];
    return step?.isComplete ? step.isComplete(this.state) : true;
  }

  private canReachStep(targetIndex: number): boolean {
    if (targetIndex <= this.currentStepIndex) return true;
    for (let i = 0; i < targetIndex; i++) {
      if (!this.isStepComplete(i)) return false;
    }
    return true;
  }

  private renderAll(direction: TransitionDirection): void {
    this.renderHeader();
    this.renderBody(direction);
    this.renderFooter();
  }

  private renderHeader(): void {
    if (!this.headerEl) return;
    this.headerEl.empty();
    this.stepButtons = [];

    const total = this.steps.length;
    const current = this.currentStepIndex + 1;

    const titleRow = this.headerEl.createDiv({
      cls: "workout-wizard-title-row",
    });
    titleRow.createEl("h2", {
      cls: "workout-wizard-title",
      text: this.getModalTitle(),
    });
    titleRow.createSpan({
      cls: "workout-wizard-step-meta",
      text: t("modal.wizard.stepOf", { current, total }),
    });

    const stepper = this.headerEl.createEl("nav", {
      cls: "workout-wizard-stepper",
      attr: { "aria-label": t("modal.wizard.stepsLabel") },
    });
    DomUtils.setCssProps(stepper, {
      "--workout-wizard-steps": String(total),
    });

    this.steps.forEach((step, index) => {
      const btn = stepper.createEl("button", {
        cls: "workout-wizard-step-btn",
        attr: { type: "button" },
      });
      btn.createSpan({ cls: "workout-wizard-step-badge" });
      btn.createSpan({
        cls: "workout-wizard-step-label",
        text: step.label,
      });
      btn.addEventListener("click", () => this.goToStep(index));
      this.stepButtons.push(btn);
    });

    this.syncStepperButtons();

    const track = this.headerEl.createDiv({
      cls: "workout-wizard-progress-track",
      attr: { "aria-hidden": "true" },
    });
    const fill = track.createDiv({ cls: "workout-wizard-progress-fill" });
    if (this.currentStepIndex === total - 1) {
      fill.addClass("is-done");
    }
    const progress = total > 0 ? (current / total) * 100 : 0;
    DomUtils.setCssProps(fill, {
      "--workout-wizard-progress": `${progress}%`,
    });
  }

  private syncStepperButtons(): void {
    this.stepButtons.forEach((btn, index) => {
      const isCurrent = index === this.currentStepIndex;
      const isCompleted =
        !isCurrent &&
        index < this.currentStepIndex &&
        this.isStepComplete(index);
      const reachable = this.canReachStep(index);

      btn.classList.toggle("is-current", isCurrent);
      btn.classList.toggle("is-completed", isCompleted);
      btn.disabled = !reachable;

      if (isCurrent) {
        btn.setAttribute("aria-current", "step");
      } else {
        btn.removeAttribute("aria-current");
      }

      const badge = btn.querySelector<HTMLElement>(
        ".workout-wizard-step-badge",
      );
      if (badge) {
        badge.empty();
        if (isCompleted) {
          Icon.create(badge, {
            name: ICONS.ACTIONS.DONE,
            className: "workout-wizard-step-check",
          });
        } else {
          badge.setText(String(index + 1));
        }
      }
    });
  }

  private renderBody(direction: TransitionDirection): void {
    if (!this.bodyEl) return;
    this.bodyEl.empty();

    const pane = this.bodyEl.createDiv({ cls: "workout-wizard-step-pane" });
    if (direction === "forward") {
      pane.addClass("anim-forward");
    } else if (direction === "backward") {
      pane.addClass("anim-backward");
    }

    const step = this.steps[this.currentStepIndex];
    step?.render(pane, this.state);
  }

  private renderFooter(): void {
    if (!this.footerEl) return;
    this.footerEl.empty();

    const isLastStep = this.currentStepIndex === this.steps.length - 1;
    const secondary = this.getSecondaryActions(this.currentStepIndex);

    Button.createModalActions(this.footerEl, {
      className: "workout-wizard-actions",
      start: (row) => {
        if (this.currentStepIndex > 0) {
          const backBtn = Button.create(row, {
            text: t("modal.buttons.back"),
            icon: ICONS.ACTIONS.BACK,
            variant: BUTTONVARIANT.SECONDARY,
            className: "workout-wizard-back",
          });
          Button.onClick(backBtn, () => this.goBack());
        }
        this.renderFooterStartExtras(row, this.currentStepIndex);
      },
      primary: isLastStep
        ? {
            text: this.getButtonText(),
            onClick: () => this.handleSubmit(),
          }
        : {
            text: t("modal.buttons.next"),
            onClick: () => this.goNext(),
          },
      others: secondary.length > 0 ? secondary : undefined,
      onCancel: () => this.close(),
    });
  }
}
