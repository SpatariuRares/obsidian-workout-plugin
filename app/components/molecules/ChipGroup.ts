/**
 * ChipGroup Molecule
 * One of a few options, picked from chips (DESIGN.md "ChipGroup"): a
 * labelled group, the picked chip pressed, one scrolling row so a long list
 * stays short on a phone. A pick presses the new chip at once, so a caller
 * that doesn't redraw (the heat map's period, side and metric) stays right.
 * `create` returns a handle: a form reads the pick with `value()`, an edit
 * modal picks from code with `select(id)` and a choice whose options depend
 * on other fields swaps them with `setOptions`.
 * `createMulti` is the same group where several chips can be pressed.
 */
import { Chip } from "@app/components/atoms/Chip";
import { DomUtils } from "@app/utils/DomUtils";

export interface ChipOption<T extends string = string> {
  id: T;
  label: string;
}

export interface ChipGroupProps<T extends string = string> {
  /** The group's visible label ("Protocol", "Period") */
  label: string;
  options: ChipOption<T>[];
  selected: T;
  /** A different chip was picked (by a click or `select`) */
  onPick?: (id: T) => void;
  /** Each chip gets `${prefix}-${id}`, to focus it again after a redraw */
  focusKeyPrefix?: string;
  /** The group's own class, for its layout */
  className?: string;
  /** The options name themselves (Week, Month, Year): the label is read, not shown */
  labelHidden?: boolean;
}

export interface ChipGroupResult<T extends string = string> {
  container: HTMLElement;
  /** The picked chip's id */
  value: () => T;
  /**
   * Picks `id` as a click would (onPick runs when it changes the pick);
   * false, and nothing changes, when `id` is not one of the options
   */
  select: (id: string) => boolean;
  /**
   * Draws `options` instead. The pick becomes `selected` when offered, else
   * stays when still offered, else the first option; onPick doesn't run.
   */
  setOptions: (options: ChipOption<T>[], selected?: string) => void;
}

export interface ChipMultiGroupProps {
  label: string;
  options: ChipOption[];
  /** The chips pressed when the group opens */
  selected: string[];
  className?: string;
}

export interface ChipMultiGroupResult {
  container: HTMLElement;
  /** The pressed chips' ids, in the options' order */
  picked: () => string[];
  /** Shows `message` under the chips; none clears it (a pick also does) */
  setError: (message?: string) => void;
}

let nextId = 0;

export class ChipGroup {
  static create<T extends string>(
    parent: HTMLElement,
    props: ChipGroupProps<T>,
  ): ChipGroupResult<T> {
    const { container, group } = this.frame(parent, props);

    let options = props.options;
    let selected = props.selected;
    let chips: HTMLButtonElement[] = [];
    const press = () =>
      chips.forEach((c, i) => Chip.setSelected(c, options[i].id === selected));
    const select = (id: string): boolean => {
      const option = options.find((o) => o.id === id);
      if (!option) return false;
      if (option.id === selected) return true;
      selected = option.id;
      press();
      props.onPick?.(option.id);
      return true;
    };
    const draw = () => {
      group.empty();
      chips = options.map((option) => {
        const chip = Chip.create(group, {
          text: option.label,
          selected: option.id === selected,
          onClick: () => select(option.id),
        });
        if (props.focusKeyPrefix) DomUtils.setFocusKey(chip, `${props.focusKeyPrefix}-${option.id}`);
        return chip;
      });
    };
    draw();

    return {
      container,
      value: () => selected,
      select,
      setOptions: (next, wanted) => {
        options = next;
        const pick =
          next.find((o) => o.id === wanted) ?? next.find((o) => o.id === selected) ?? next[0];
        if (pick) selected = pick.id;
        draw();
      },
    };
  }

  static createMulti(parent: HTMLElement, props: ChipMultiGroupProps): ChipMultiGroupResult {
    const { container, group, labelId } = this.frame(parent, props);
    const error = container.createDiv({
      cls: "workout-chip-group-error workout-field-error",
      attr: { id: `${labelId}-error`, role: "alert" },
    });
    error.hidden = true;
    const setError = (message?: string) => {
      error.textContent = message ?? "";
      error.hidden = !message;
      if (message) group.setAttribute("aria-describedby", error.id);
      else group.removeAttribute("aria-describedby");
    };

    const pressed = new Set(props.selected);
    for (const option of props.options) {
      const chip = Chip.create(group, {
        text: option.label,
        selected: pressed.has(option.id),
        onClick: () => {
          if (pressed.has(option.id)) pressed.delete(option.id);
          else pressed.add(option.id);
          Chip.setSelected(chip, pressed.has(option.id));
          setError();
        },
      });
    }
    return {
      container,
      picked: () => props.options.map((o) => o.id).filter((id) => pressed.has(id)),
      setError,
    };
  }

  /** The labelled group both kinds draw their chips in */
  private static frame(
    parent: HTMLElement,
    props: { label: string; className?: string; labelHidden?: boolean },
  ): { container: HTMLElement; group: HTMLElement; labelId: string } {
    const labelId = `workout-chip-group-${++nextId}`;
    const container = parent.createDiv({ cls: "workout-chip-group" });
    if (props.className) container.addClass(props.className);
    const label = container.createDiv({
      cls: "workout-chip-group-label",
      text: props.label,
      attr: { id: labelId },
    });
    if (props.labelHidden) label.addClass("workout-visually-hidden");
    const group = container.createDiv({
      cls: "workout-chip-group-chips",
      attr: { role: "group", "aria-labelledby": labelId },
    });
    return { container, group, labelId };
  }
}
