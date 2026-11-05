/**
 * AdjustField Molecule
 * A labelled whole number for a form: the visible label above a
 * NumberField with − / + that step it within its limits.
 */

import {
  NumberField,
  type NumberFieldResult,
} from "@app/components/molecules/NumberField";

export interface AdjustFieldProps {
  label: string;
  /** Unset: the field opens empty, showing `suggestion` */
  value?: number;
  min: number;
  max: number;
  /** What − and + add or take away */
  step: number;
  /** Shown at the end of the field, e.g. "s" */
  unit?: string;
  /** Muted text in the empty field ("All" for a limit that is optional) */
  suggestion?: string;
}

export class AdjustField {
  /** Make the field's container in `parent` and fill it */
  static create(
    parent: HTMLElement,
    props: AdjustFieldProps,
  ): HTMLInputElement {
    return this.createField(parent, props).input;
  }

  /** As `create`, with the field's `setError` for a form that checks it */
  static createField(
    parent: HTMLElement,
    props: AdjustFieldProps,
  ): NumberFieldResult {
    return this.fillField(
      parent.createDiv({ cls: "workout-field-with-adjust" }),
      props,
    );
  }

  /** Fill a container the caller already made; returns the number input */
  static fill(
    container: HTMLElement,
    props: AdjustFieldProps,
  ): HTMLInputElement {
    return this.fillField(container, props).input;
  }

  private static fillField(
    container: HTMLElement,
    { label, value, min, max, step, unit, suggestion }: AdjustFieldProps,
  ): NumberFieldResult {
    const labelEl = container.createEl("label", {
      cls: "workout-field-label",
      text: label,
    });
    const field = NumberField.create(container, {
      label,
      value: value === undefined ? "" : String(value),
      suggestion,
      integer: true,
      unit,
      step,
      min,
      max,
    });
    labelEl.htmlFor = field.input.id;
    return field;
  }
}
