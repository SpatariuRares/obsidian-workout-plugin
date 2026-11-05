import type { Setting } from "obsidian";

/** A numeric setting: one text box, a check, and a message when it fails */
export interface NumberFieldSpec {
  value: number;
  parse: (raw: string) => number;
  isValid: (value: number) => boolean;
  /** Shown under the box while the typed value is not valid */
  error: string;
  /** Called with each valid value */
  save: (value: number) => Promise<void>;
}

/** Strictly greater than zero (what most numeric settings need) */
export const isPositive = (value: number): boolean =>
  !isNaN(value) && value > 0;

/** Zero or more */
export const isNonNegative = (value: number): boolean =>
  !isNaN(value) && value >= 0;

/** Digits only ("90"); anything else ("", "9.5", "90s") is NaN */
export const parseWholeNumber = (raw: string): number =>
  /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : NaN;

/** Adds the text box of a numeric setting to `setting`, with its error line */
export function renderNumberField(
  setting: Setting,
  field: NumberFieldSpec,
): void {
  setting.addText((text) => {
    text.setValue(String(field.value)).onChange(async (raw) => {
      const value = field.parse(raw);
      const valid = field.isValid(value);
      error.toggleClass("is-visible", !valid);
      if (valid) await field.save(value);
    });
  });
  const error = setting.controlEl.createDiv({
    cls: "workout-setting-error",
    text: field.error,
  });
}
