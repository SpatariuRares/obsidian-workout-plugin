/** @jest-environment jsdom */
import { App } from "obsidian";
import { LocalizationService, t } from "@app/i18n";
import {
  WizardModal,
  type WizardStep,
} from "@app/features/modals/base/WizardModal";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

interface TestWizardState {
  name: string;
  count: number;
  note: string;
  errorShown: boolean;
}

class TestWizardModal extends WizardModal<TestWizardState> {
  public submitted: TestWizardState | null = null;
  public validateSpy = jest.fn((state: TestWizardState) => {
    const valid = state.name.trim().length > 0;
    state.errorShown = !valid;
    return valid;
  });

  protected getModalTitle(): string {
    return t("modal.titles.insertSets");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertSets");
  }

  protected createInitialState(): TestWizardState {
    return { name: "", count: 3, note: "", errorShown: false };
  }

  protected getSteps(): WizardStep<TestWizardState>[] {
    return [
      {
        id: "step1",
        label: t("modal.wizard.steps.exercise"),
        isComplete: (s) => s.name.trim().length > 0,
        validate: (s) => this.validateSpy(s),
        render: (container, state) => {
          const input = container.createEl("input", {
            value: state.name,
            attr: { type: "text", "data-field": "name" },
          });
          input.addEventListener("input", () => {
            state.name = input.value;
            this.notifyStateChange();
          });
        },
      },
      {
        id: "step2",
        label: t("modal.wizard.steps.plan"),
        render: (container, state) => {
          const input = container.createEl("input", {
            value: String(state.count),
            attr: { type: "text", "data-field": "count" },
          });
          input.addEventListener("input", () => {
            state.count = Number(input.value) || 0;
            this.notifyStateChange();
          });
        },
      },
      {
        id: "step3",
        label: t("modal.wizard.steps.rest"),
        render: (container, state) => {
          container.createDiv({
            text: state.name,
            attr: { "data-summary": "name" },
          });
          const input = container.createEl("input", {
            value: state.note,
            attr: { type: "text", "data-field": "note" },
          });
          input.addEventListener("input", () => {
            state.note = input.value;
          });
        },
      },
    ];
  }

  protected onSubmit(state: TestWizardState): void {
    this.submitted = { ...state };
    this.close();
  }
}

function openWizard() {
  const modal = new TestWizardModal(new App());
  const contentEl = createObsidianContainer();
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();
  return { modal, contentEl, close };
}

function setInputValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`Button "${text}" not found`);
  return btn;
}

beforeAll(() => {
  LocalizationService.initialize({} as never);
});

describe("WizardModal", () => {
  it("renders header counter, horizontal stepper, progress track, step 1 body, and modal actions on open", () => {
    const { contentEl } = openWizard();

    expect(contentEl.querySelector("h2")?.textContent).toBe(
      t("modal.titles.insertSets"),
    );
    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));

    const stepBtns = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-wizard-step-btn",
      ),
    ];
    expect(stepBtns.map((b) => b.textContent?.trim())).toEqual([
      `1${t("modal.wizard.steps.exercise")}`,
      `2${t("modal.wizard.steps.plan")}`,
      `3${t("modal.wizard.steps.rest")}`,
    ]);
    expect(stepBtns[0].classList.contains("is-current")).toBe(true);
    expect(stepBtns[0].getAttribute("aria-current")).toBe("step");
    expect(stepBtns[1].disabled).toBe(true);
    expect(stepBtns[2].disabled).toBe(true);

    const progressFill = contentEl.querySelector<HTMLElement>(
      ".workout-wizard-progress-fill",
    );
    expect(progressFill).not.toBeNull();
    expect(progressFill!.classList.contains("is-done")).toBe(false);

    expect(
      contentEl.querySelector("input[data-field='name']"),
    ).not.toBeNull();

    const actionBtns = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-modal-actions button",
      ),
    ];
    expect(actionBtns.map((b) => b.textContent)).toEqual([
      t("modal.buttons.next"),
      t("modal.buttons.cancel"),
    ]);
  });

  it("blocks Next when step 1 validation fails, then advances forward and preserves state backward", () => {
    const { modal, contentEl } = openWizard();

    buttonByText(contentEl, t("modal.buttons.next")).click();
    expect(modal.validateSpy).toHaveBeenCalledTimes(1);
    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));

    const nameInput = contentEl.querySelector<HTMLInputElement>(
      "input[data-field='name']",
    )!;
    setInputValue(nameInput, "Bench Press");

    const stepBtnsAfterInput = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-wizard-step-btn",
      ),
    ];
    expect(stepBtnsAfterInput[1].disabled).toBe(false);
    expect(stepBtnsAfterInput[2].disabled).toBe(false);

    buttonByText(contentEl, t("modal.buttons.next")).click();

    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 2, total: 3 }));
    expect(
      contentEl
        .querySelector(".workout-wizard-step-pane")
        ?.classList.contains("anim-forward"),
    ).toBe(true);

    const stepBtnsOn2 = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-wizard-step-btn",
      ),
    ];
    expect(stepBtnsOn2[0].classList.contains("is-completed")).toBe(true);
    expect(
      stepBtnsOn2[0].querySelector(".workout-wizard-step-check"),
    ).not.toBeNull();
    expect(stepBtnsOn2[1].classList.contains("is-current")).toBe(true);

    const actionsOn2 = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-modal-actions button",
      ),
    ];
    expect(actionsOn2.map((b) => b.textContent)).toEqual([
      t("modal.buttons.back"),
      t("modal.buttons.next"),
      t("modal.buttons.cancel"),
    ]);
    expect(actionsOn2[0].classList.contains("workout-wizard-back")).toBe(true);

    const countInput = contentEl.querySelector<HTMLInputElement>(
      "input[data-field='count']",
    )!;
    setInputValue(countInput, "5");

    buttonByText(contentEl, t("modal.buttons.back")).click();
    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));
    expect(
      contentEl
        .querySelector(".workout-wizard-step-pane")
        ?.classList.contains("anim-backward"),
    ).toBe(true);
    expect(
      contentEl.querySelector<HTMLInputElement>("input[data-field='name']")
        ?.value,
    ).toBe("Bench Press");

    buttonByText(contentEl, t("modal.buttons.next")).click();
    expect(
      contentEl.querySelector<HTMLInputElement>("input[data-field='count']")
        ?.value,
    ).toBe("5");
  });

  it("jumps directly via stepper buttons once earlier steps are valid, submits preserved state, and supports secondary actions", () => {
    class SecondaryActionWizardModal extends TestWizardModal {
      public quickActionSpy = jest.fn();

      protected override getSecondaryActions(stepIndex: number) {
        if (stepIndex < 2) {
          return [
            {
              text: t("modal.buttons.update"),
              onClick: () => this.quickActionSpy(stepIndex),
            },
          ];
        }
        return [];
      }
    }

    const modal = new SecondaryActionWizardModal(new App());
    const contentEl = createObsidianContainer();
    const close = jest.fn();
    Object.assign(modal, { contentEl, close });
    modal.onOpen();

    // Quick secondary action is present on step 1
    buttonByText(contentEl, t("modal.buttons.update")).click();
    expect(modal.quickActionSpy).toHaveBeenCalledWith(0);

    const nameInput = contentEl.querySelector<HTMLInputElement>(
      "input[data-field='name']",
    )!;
    setInputValue(nameInput, "Squat");

    // Jump directly from step 1 to step 3 via stepper
    const step3Btn = contentEl.querySelectorAll<HTMLButtonElement>(
      ".workout-wizard-step-btn",
    )[2];
    step3Btn.click();

    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 3, total: 3 }));
    expect(
      contentEl
        .querySelector(".workout-wizard-progress-fill")
        ?.classList.contains("is-done"),
    ).toBe(true);
    expect(
      contentEl.querySelector("[data-summary='name']")?.textContent,
    ).toBe("Squat");

    const noteInput = contentEl.querySelector<HTMLInputElement>(
      "input[data-field='note']",
    )!;
    setInputValue(noteInput, "Heavy day");

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();
    expect(modal.submitted).toEqual({
      name: "Squat",
      count: 3,
      note: "Heavy day",
      errorShown: false,
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes when Cancel is clicked", () => {
    const { contentEl, close } = openWizard();

    buttonByText(contentEl, t("modal.buttons.cancel")).click();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("skips rendering intermediate steps without validate when jumping directly to a later step", () => {
    const step2RenderSpy = jest.fn();

    class JumpSpyWizardModal extends TestWizardModal {
      protected override getSteps(): WizardStep<TestWizardState>[] {
        const base = super.getSteps();
        const originalRender = base[1].render;
        return [
          base[0],
          {
            ...base[1],
            render: (container, state) => {
              step2RenderSpy();
              originalRender(container, state);
            },
          },
          base[2],
        ];
      }
    }

    const modal = new JumpSpyWizardModal(new App());
    const contentEl = createObsidianContainer();
    Object.assign(modal, { contentEl, close: jest.fn() });
    modal.onOpen();

    const nameInput = contentEl.querySelector<HTMLInputElement>(
      "input[data-field='name']",
    )!;
    setInputValue(nameInput, "Deadlift");

    contentEl
      .querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn")[2]
      .click();

    expect(step2RenderSpy).not.toHaveBeenCalled();
    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 3, total: 3 }));
  });
});
