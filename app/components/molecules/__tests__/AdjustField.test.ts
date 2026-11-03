/** @jest-environment jsdom */

import { AdjustField } from "@app/components/molecules/AdjustField";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

function field(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
}) {
  const parent = createObsidianContainer();
  const input = AdjustField.create(parent, {
    label: "Days",
    ...props,
  });
  const press = (label: string) =>
    parent
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${label}"]`,
      )!
      .click();
  return { parent, input, press };
}

describe("AdjustField molecule", () => {
  it("shows the label with its unit and the starting value", () => {
    const { parent, input } = field({
      value: 30,
      min: 1,
      max: 365,
      step: 7,
      unit: "d",
    });
    expect(
      parent.querySelector(".workout-field-label")?.textContent,
    ).toBe("Days (d)");
    expect(input.value).toBe("30");
  });

  it("steps up and down by the increment", () => {
    const { input, press } = field({
      value: 30,
      min: 1,
      max: 365,
      step: 7,
    });
    press(
      t("modal.buttons.increaseBy", { label: "Days", increment: 7 }),
    );
    expect(input.value).toBe("37");
    press(
      t("modal.buttons.decreaseBy", { label: "Days", increment: 7 }),
    );
    press(
      t("modal.buttons.decreaseBy", { label: "Days", increment: 7 }),
    );
    expect(input.value).toBe("23");
  });

  it("stays within min and max", () => {
    const { input, press } = field({
      value: 3,
      min: 1,
      max: 5,
      step: 10,
    });
    press(
      t("modal.buttons.increaseBy", { label: "Days", increment: 10 }),
    );
    expect(input.value).toBe("5");
    press(
      t("modal.buttons.decreaseBy", { label: "Days", increment: 10 }),
    );
    expect(input.value).toBe("1");
  });

  it("tells listeners the value changed", () => {
    const { input, press } = field({
      value: 3,
      min: 1,
      max: 9,
      step: 1,
    });
    const onInput = jest.fn();
    input.addEventListener("input", onInput);
    press(
      t("modal.buttons.increaseBy", { label: "Days", increment: 1 }),
    );
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("fills a container the caller already made", () => {
    const container = createObsidianContainer().createDiv({
      cls: "mine",
    });
    const input = AdjustField.fill(container, {
      label: "Rest",
      value: 0,
      min: 0,
      max: 9,
      step: 1,
    });
    expect(container.contains(input)).toBe(true);
  });
});
