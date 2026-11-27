/** @jest-environment jsdom */
import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { WizardModal, type WizardStep } from "@app/features/modals/base/WizardModal";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

class TestWizard extends WizardModal {
  name!: HTMLInputElement;
  note!: HTMLInputElement;
  submitted = jest.fn();
  entered: string[] = [];

  constructor(quick = false) {
    super({} as App);
    this.quickSubmit = quick;
  }
  protected getModalTitle() {
    return "Wizard";
  }
  protected getButtonText() {
    return "Finish";
  }
  protected getSuccessMessage() {
    return "";
  }
  protected generateCode() {
    return "";
  }
  protected submit() {
    this.submitted(this.name.value, this.note.value);
  }
  protected getSteps(): WizardStep[] {
    return [
      {
        id: "one",
        label: "One",
        render: (el) => {
          this.name = el.createEl("input", { attr: { type: "text" } });
        },
        validate: () => {
          const ok = this.name.value.trim() !== "";
          this.setStepError("one", ok ? null : "Name needed", this.name);
          return ok;
        },
        isComplete: () => this.name.value.trim() !== "",
        onEnter: () => this.entered.push("one"),
      },
      {
        id: "two",
        label: "Two",
        render: (el) => {
          this.note = el.createEl("input", { attr: { type: "text" } });
        },
        onEnter: () => this.entered.push("two"),
      },
      { id: "three", label: "Three", render: (el) => el.createDiv({ text: "review" }) },
    ];
  }
}

function open(quick = false) {
  const modal = new TestWizard(quick);
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();
  const panel = (id: string) => contentEl.querySelector<HTMLElement>(`[data-step-id="${id}"]`)!;
  const visible = () => ["one", "two", "three"].filter((id) => !panel(id).hidden);
  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text) as
      | HTMLButtonElement
      | undefined;
  const tab = (n: number) =>
    contentEl.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")[n - 1];
  return { modal, contentEl, panel, visible, button, tab };
}

describe("WizardModal", () => {
  it("opens on the first step with its counter", () => {
    const { visible, contentEl } = open();

    expect(visible()).toEqual(["one"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 3 }),
    );
  });

  it("shows Next and Cancel on the first step, no Back", () => {
    const { button } = open();

    expect(button(t("wizard.next"))).toBeDefined();
    expect(button(t("modal.buttons.cancel"))).toBeDefined();
    expect(button(t("wizard.back"))).toBeUndefined();
    expect(button("Finish")).toBeUndefined();
  });

  it("blocks Next while the step is invalid, showing the error and focusing the field", () => {
    const { visible, button, contentEl, modal } = open();

    button(t("wizard.next"))!.click();

    expect(visible()).toEqual(["one"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe("Name needed");
    expect(document.activeElement).toBe(modal.name);
  });

  it("clears the error once the field is edited", () => {
    const { button, contentEl, modal } = open();
    button(t("wizard.next"))!.click();

    modal.name.value = "Squat";
    modal.name.dispatchEvent(new Event("input"));

    expect(contentEl.querySelector(".workout-wizard-error")).toBeNull();
  });

  it("moves forward and back, keeping what was typed", () => {
    const { visible, button, modal } = open();
    modal.name.value = "Squat";
    button(t("wizard.next"))!.click();
    modal.note.value = "heavy";

    button(t("wizard.next"))!.click();
    expect(visible()).toEqual(["three"]);
    button(t("wizard.back"))!.click();
    button(t("wizard.back"))!.click();

    expect(visible()).toEqual(["one"]);
    expect(modal.name.value).toBe("Squat");
    expect(modal.note.value).toBe("heavy");
  });

  it("shows Insert and Cancel on the last step", () => {
    const { button, modal } = open();
    modal.name.value = "Squat";
    button(t("wizard.next"))!.click();
    button(t("wizard.next"))!.click();

    expect(button("Finish")).toBeDefined();
    expect(button(t("wizard.next"))).toBeUndefined();
    expect(button(t("wizard.back"))).toBeDefined();
    expect(button(t("modal.buttons.cancel"))).toBeDefined();
  });

  it("does not jump ahead from the stepper while the first step is invalid", () => {
    const { visible, tab, contentEl } = open();

    tab(3).click();

    expect(visible()).toEqual(["one"]);
    expect(contentEl.querySelector(".workout-wizard-error")).not.toBeNull();
  });

  it("jumps straight to step 3 from the stepper once step 1 is valid", () => {
    const { visible, tab, modal } = open();
    modal.name.value = "Squat";

    tab(3).click();

    expect(visible()).toEqual(["three"]);
  });

  it("marks completed, current and upcoming steps", () => {
    const { tab, modal } = open();
    modal.name.value = "Squat";
    tab(2).click();

    expect(tab(1).classList.contains("is-done")).toBe(true);
    expect(tab(2).getAttribute("aria-current")).toBe("step");
    expect(tab(3).classList.contains("is-done")).toBe(false);
  });

  it("fills the progress bar on the last step only", () => {
    const { tab, modal, contentEl } = open();
    const bar = () => contentEl.querySelector(".workout-wizard-progress")!;
    expect(bar().classList.contains("is-done")).toBe(false);
    modal.name.value = "Squat";

    tab(3).click();

    expect(bar().classList.contains("is-done")).toBe(true);
  });

  it("tells a step when it is entered", () => {
    const { tab, modal } = open();
    modal.name.value = "Squat";

    tab(2).click();

    expect(modal.entered).toEqual(["one", "two"]);
  });

  it("submits from the last step", () => {
    const { button, modal } = open();
    modal.name.value = "Squat";
    modal.note.value = "x";
    button(t("wizard.next"))!.click();
    button(t("wizard.next"))!.click();

    button("Finish")!.click();

    expect(modal.submitted).toHaveBeenCalledWith("Squat", "x");
  });

  it("offers no submit on intermediate steps by default", () => {
    const { button } = open(false);

    expect(button("Finish")).toBeUndefined();
  });

  it("offers the submit on every step in quick mode (edit), still gated by validation", () => {
    const { button, modal, contentEl } = open(true);

    button("Finish")!.click();
    expect(modal.submitted).not.toHaveBeenCalled();
    expect(contentEl.querySelector(".workout-wizard-error")).not.toBeNull();

    modal.name.value = "Squat";
    button("Finish")!.click();
    expect(modal.submitted).toHaveBeenCalledTimes(1);
  });

  it("cancel closes the modal", () => {
    const { button, modal } = open();

    button(t("modal.buttons.cancel"))!.click();

    expect((modal as unknown as { close: jest.Mock }).close).toHaveBeenCalled();
  });
});
