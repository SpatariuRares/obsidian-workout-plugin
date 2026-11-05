/**
 * NumberField Molecule
 * A number to type in quickly on a phone: the right keyboard, a suggestion
 * that is logged when the field is left empty (last time's value), an
 * optional unit, optional − / + steppers (and ↑ / ↓ keys), and its error
 * tied to the field. Text input with `inputmode`, not `type="number"`, so a
 * decimal comma is kept as typed and there are no browser spinners.
 */
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";
import { round2 } from "@app/utils/round2";

export interface NumberFieldProps {
  /** Accessible name ("Reps, set 2"); the unit is added to it */
  label: string;
  value?: string;
  /**
   * Shown in the empty field and used when it stays empty: readable (muted),
   * lighter than a typed value
   */
  suggestion?: string;
  /** Whole numbers: numeric keyboard, steppers round */
  integer?: boolean;
  /** Free text (a grade, a style): the normal keyboard */
  text?: boolean;
  /** Shown at the end of the field ("kg") */
  unit?: string;
  /** Adds − / + buttons and ↑ / ↓ keys that move the value by this much */
  step?: number;
  min?: number;
  max?: number;
  /** Label of the keyboard's enter key */
  enterKeyHint?: "done" | "next" | "go";
  focusKey?: string;
  className?: string;
  onInput?: (value: string) => void;
  /** Enter was pressed in the field */
  onEnter?: () => void;
}

export interface NumberFieldResult {
  container: HTMLElement;
  input: HTMLInputElement;
  /** Shows `message` under the field and marks it invalid; none clears it */
  setError: (message?: string) => void;
}

let nextId = 0;

/** "82,5" → 82.5; NaN when there is no number */
export function parseNumber(text: string | undefined): number {
  return text?.trim() ? Number(text.trim().replace(",", ".")) : NaN;
}

export class NumberField {
  static create(parent: HTMLElement, props: NumberFieldProps): NumberFieldResult {
    const id = `workout-number-field-${++nextId}`;
    const container = parent.createDiv({
      cls: ["workout-number-field", props.className ?? ""].join(" ").trim(),
    });
    const label = props.unit ? `${props.label} (${props.unit})` : props.label;
    const box = container.createDiv({ cls: "workout-number-field-box" });

    // Shows how much it moves ("−2.5"), so the step is known before tapping
    const stepper = (delta: number, sign: string, ariaLabel: string) => {
      const button = box.createEl("button", {
        cls: "workout-number-field-step clickable-icon",
        text: `${sign}${Math.abs(delta)}`,
        // Out of the tab order: ↑ / ↓ in the field do the same
        attr: { type: "button", tabindex: "-1", "aria-label": ariaLabel },
      });
      button.addEventListener("click", () => move(delta));
      return button;
    };
    const increment = { label: props.label, increment: props.step ?? 0 };
    const minus = props.step
      ? stepper(-props.step, t("modal.buttons.adjustMinus"), t("modal.buttons.decreaseBy", increment))
      : undefined;

    const input = box.createEl("input", {
      cls: "workout-number-field-input",
      attr: {
        id,
        type: "text",
        inputmode: props.text ? "text" : props.integer ? "numeric" : "decimal",
        enterkeyhint: props.enterKeyHint ?? "done",
        autocomplete: "off",
        "aria-label": label,
        placeholder: props.suggestion ?? "",
      },
    });
    input.value = props.value ?? "";
    if (props.focusKey) DomUtils.setFocusKey(input, props.focusKey);
    if (props.unit) {
      box.createSpan({ cls: "workout-number-field-unit", text: props.unit, attr: { "aria-hidden": "true" } });
    }
    // Before the unit in the DOM, after it on screen: − field unit +
    if (minus) box.prepend(minus);
    if (props.step) stepper(props.step, t("modal.buttons.adjustPlus"), t("modal.buttons.increaseBy", increment));

    const error = container.createDiv({
      cls: "workout-number-field-error workout-field-error",
      attr: { id: `${id}-error`, role: "alert" },
    });
    error.hidden = true;
    const setError = (message?: string) => {
      error.textContent = message ?? "";
      error.hidden = !message;
      container.classList.toggle("is-invalid", !!message);
      if (message) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error.id);
      } else {
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    };

    const changed = () => {
      setError();
      props.onInput?.(input.value);
    };
    /** From the typed value, else the suggestion, else the lower limit */
    const move = (delta: number) => {
      const typed = parseNumber(input.value);
      const base = Number.isFinite(typed)
        ? typed
        : Number.isFinite(parseNumber(props.suggestion))
          ? parseNumber(props.suggestion)
          : (props.min ?? 0);
      let next = base + delta;
      if (props.min !== undefined) next = Math.max(props.min, next);
      if (props.max !== undefined) next = Math.min(props.max, next);
      input.value = props.integer ? String(Math.round(next)) : String(round2(next));
      // As if typed: listeners on the input (a form's preview) hear it too
      input.dispatchEvent(new Event("input", { bubbles: true }));
    };

    input.addEventListener("input", changed);
    // A typed value is replaced by the first key, as on a calculator
    input.addEventListener("focus", () => input.select());
    input.addEventListener("keydown", (event) => {
      // Keys typed here are the field's, not the editor's around the block
      event.stopPropagation();
      if (event.key === "Enter" && props.onEnter) {
        event.preventDefault();
        props.onEnter();
      } else if (props.step && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        event.preventDefault();
        move(event.key === "ArrowUp" ? props.step : -props.step);
      }
    });

    return { container, input, setError };
  }
}
