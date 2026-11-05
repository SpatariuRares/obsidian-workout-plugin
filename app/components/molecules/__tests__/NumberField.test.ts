/** @jest-environment jsdom */

import { NumberField, parseNumber } from "@app/components/molecules/NumberField";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

const key = (input: HTMLInputElement, name: string) => {
  const event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true });
  input.dispatchEvent(event);
  return event;
};

describe("parseNumber", () => {
  it("reads a decimal comma or point, and nothing as NaN", () => {
    expect(parseNumber("82,5")).toBe(82.5);
    expect(parseNumber(" 80 ")).toBe(80);
    expect(parseNumber("")).toBeNaN();
    expect(parseNumber(undefined)).toBeNaN();
  });
});

describe("NumberField molecule", () => {
  it("is a text field with the right keyboard and the suggestion as placeholder", () => {
    const { input } = NumberField.create(createObsidianContainer(), {
      label: "Reps, set 1",
      suggestion: "10",
      integer: true,
    });
    const decimal = NumberField.create(createObsidianContainer(), { label: "Weight" }).input;

    expect(input.type).toBe("text");
    expect(input.getAttribute("inputmode")).toBe("numeric");
    expect(input.getAttribute("enterkeyhint")).toBe("done");
    expect(input.getAttribute("autocomplete")).toBe("off");
    expect(input.placeholder).toBe("10");
    expect(input.getAttribute("aria-label")).toBe("Reps, set 1");
    expect(decimal.getAttribute("inputmode")).toBe("decimal");
  });

  it("shows its unit and says it in its name", () => {
    const { container, input } = NumberField.create(createObsidianContainer(), {
      label: "Weight",
      unit: "kg",
    });

    expect(input.getAttribute("aria-label")).toBe("Weight (kg)");
    const unit = container.querySelector(".workout-number-field-unit")!;
    expect(unit.textContent).toBe("kg");
    expect(unit.getAttribute("aria-hidden")).toBe("true");
  });

  it("hands every change over and keeps its value", () => {
    const onInput = jest.fn();
    const { input } = NumberField.create(createObsidianContainer(), {
      label: "Reps",
      value: "8",
      onInput,
    });
    expect(input.value).toBe("8");

    input.value = "9";
    input.dispatchEvent(new Event("input"));

    expect(onInput).toHaveBeenCalledWith("9");
  });

  it("keeps keys from the editor around it and hands Enter over", () => {
    const onEnter = jest.fn();
    const parent = createObsidianContainer();
    const outside = jest.fn();
    parent.addEventListener("keydown", outside);
    const { input } = NumberField.create(parent, { label: "Reps", onEnter });

    expect(key(input, "5").defaultPrevented).toBe(false);
    const enter = key(input, "Enter");

    expect(outside).not.toHaveBeenCalled();
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(enter.defaultPrevented).toBe(true);
  });

  it("selects a typed value on focus, so the first key replaces it", () => {
    const { input } = NumberField.create(createObsidianContainer(), { label: "Reps", value: "12" });
    const select = jest.spyOn(input, "select");

    input.dispatchEvent(new FocusEvent("focus"));

    expect(select).toHaveBeenCalled();
  });

  describe("steppers", () => {
    it("has none without a step", () => {
      const { container } = NumberField.create(createObsidianContainer(), { label: "Reps" });
      expect(container.querySelectorAll(".workout-number-field-step")).toHaveLength(0);
    });

    it("draws − before and + after the field with the step, out of the tab order", () => {
      const { container } = NumberField.create(createObsidianContainer(), {
        label: "Weight",
        step: 2.5,
      });
      const box = container.querySelector(".workout-number-field-box")!;
      const steps = box.querySelectorAll<HTMLButtonElement>(".workout-number-field-step");

      expect(box.firstElementChild).toBe(steps[0]);
      expect(box.lastElementChild).toBe(steps[1]);
      expect(steps[0].textContent).toBe(`${t("modal.buttons.adjustMinus")}2.5`);
      expect(steps[1].textContent).toBe(`${t("modal.buttons.adjustPlus")}2.5`);
      expect(steps[0].getAttribute("tabindex")).toBe("-1");
      expect(steps[0].getAttribute("aria-label")).toBe(
        t("modal.buttons.decreaseBy", { label: "Weight", increment: 2.5 }),
      );
    });

    it("starts from the suggestion when empty, then from the typed value", () => {
      const onInput = jest.fn();
      const { container, input } = NumberField.create(createObsidianContainer(), {
        label: "Weight",
        suggestion: "80",
        step: 2.5,
        onInput,
      });
      const [minus, plus] = Array.from(
        container.querySelectorAll<HTMLButtonElement>(".workout-number-field-step"),
      );

      plus.click();
      expect(input.value).toBe("82.5");
      minus.click();
      minus.click();
      expect(input.value).toBe("77.5");
      expect(onInput).toHaveBeenLastCalledWith("77.5");
    });

    it("rounds whole numbers, stays within its limits, and reads a comma", () => {
      const reps = NumberField.create(createObsidianContainer(), {
        label: "Reps",
        integer: true,
        step: 1,
        min: 0,
        max: 3,
        value: "3",
      });
      key(reps.input, "ArrowUp");
      expect(reps.input.value).toBe("3");
      reps.input.value = "0";
      key(reps.input, "ArrowDown");
      expect(reps.input.value).toBe("0");

      const weight = NumberField.create(createObsidianContainer(), {
        label: "Weight",
        step: 1.25,
        value: "82,5",
      });
      expect(key(weight.input, "ArrowUp").defaultPrevented).toBe(true);
      expect(weight.input.value).toBe("83.75");
    });

    it("starts from the lower limit without a value or a suggestion", () => {
      const { input } = NumberField.create(createObsidianContainer(), {
        label: "Reps",
        integer: true,
        step: 1,
        min: 1,
      });

      key(input, "ArrowUp");

      expect(input.value).toBe("2");
    });

    it("leaves the arrow keys alone without a step", () => {
      const { input } = NumberField.create(createObsidianContainer(), { label: "Reps", value: "5" });

      expect(key(input, "ArrowUp").defaultPrevented).toBe(false);
      expect(input.value).toBe("5");
    });
  });

  describe("errors", () => {
    it("ties its message to the field, and clears it when typing", () => {
      const { container, input, setError } = NumberField.create(createObsidianContainer(), {
        label: "Reps",
      });
      const error = container.querySelector<HTMLElement>(".workout-number-field-error")!;
      expect(error.hidden).toBe(true);
      expect(error.getAttribute("role")).toBe("alert");

      setError("Reps must be at least 1");

      expect(error.hidden).toBe(false);
      expect(error.textContent).toBe("Reps must be at least 1");
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.getAttribute("aria-describedby")).toBe(error.id);
      expect(container.classList.contains("is-invalid")).toBe(true);

      input.value = "2";
      input.dispatchEvent(new Event("input"));

      expect(error.hidden).toBe(true);
      expect(input.hasAttribute("aria-invalid")).toBe(false);
      expect(input.hasAttribute("aria-describedby")).toBe(false);
      expect(container.classList.contains("is-invalid")).toBe(false);
    });

    it("gives every field its own ids", () => {
      const a = NumberField.create(createObsidianContainer(), { label: "A" }).input;
      const b = NumberField.create(createObsidianContainer(), { label: "B" }).input;

      expect(a.id).not.toBe(b.id);
    });
  });
});
