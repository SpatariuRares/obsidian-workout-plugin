/**
 * AdjustField Molecule
 * A labelled number input with − / + buttons that step it within its limits.
 */

import {
  Button,
  BUTTONSIZE,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";
import { Input } from "@app/components/atoms/Input";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { t } from "@app/i18n";

export interface AdjustFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  /** What − and + add or take away */
  step: number;
  /** Shown after the label, e.g. "s" */
  unit?: string;
}

export class AdjustField {
  /** Make the field's container in `parent` and fill it */
  static create(
    parent: HTMLElement,
    props: AdjustFieldProps,
  ): HTMLInputElement {
    return this.fill(
      parent.createDiv({ cls: "workout-field-with-adjust" }),
      props,
    );
  }

  /** Fill a container the caller already made; returns the number input */
  static fill(
    container: HTMLElement,
    { label, value, min, max, step, unit }: AdjustFieldProps,
  ): HTMLInputElement {
    container.createDiv({
      cls: "workout-field-label",
      text: unit ? `${label} (${unit})` : label,
    });

    const inputContainer = container.createDiv({
      cls: "workout-input-with-adjust",
    });

    const minusBtn = Button.create(inputContainer, {
      text: t("modal.buttons.adjustMinus") + step,
      className: "workout-adjust-btn workout-adjust-minus",
      ariaLabel: t("modal.buttons.decreaseBy", {
        label,
        increment: step,
      }),
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
    });
    minusBtn.type = "button";

    const input = Input.create(inputContainer, {
      type: INPUT_TYPE.NUMBER,
      className: "workout-charts-input",
      min,
      max,
      step: 1,
      value,
    });

    const plusBtn = Button.create(inputContainer, {
      text: t("modal.buttons.adjustPlus") + step,
      className: "workout-adjust-btn workout-adjust-plus",
      ariaLabel: t("modal.buttons.increaseBy", {
        label,
        increment: step,
      }),
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
    });
    plusBtn.type = "button";

    const move = (delta: number) => {
      const current = parseInt(input.value) || 0;
      input.value = Math.min(
        max,
        Math.max(min, current + delta),
      ).toString();
      input.dispatchEvent(new Event("input"));
    };
    Button.onClick(minusBtn, () => move(-step));
    Button.onClick(plusBtn, () => move(step));

    return input;
  }
}
