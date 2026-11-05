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

export interface ChipOptionalGroupProps<T extends string = string>
  extends Omit<ChipGroupProps<T>, "selected" | "onPick"> {
  /** The first chip's label ("None"): picked when no option is */
  none: string;
  /** The option picked when the group opens; none when unset */
  selected?: T;
  /** The pick changed (undefined = none), by a click or `select` */
  onPick?: (id: T | undefined) => void;
}

export interface ChipOptionalGroupResult<T extends string = string> {
  container: HTMLElement;
  /** The picked option's id; undefined when none is */
  value: () => T | undefined;
  /** Picks `id` (undefined = none) as a click would; false when `id` is not offered */
  select: (id: string | undefined) => boolean;
  /**
   * Draws `options` instead. The pick becomes `selected` when offered, else
   * stays when still offered, else none; onPick doesn't run.
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
    const { onPick } = props;
    const group = this.single<T>(parent, props, {
      initial: props.selected,
      // Without a None chip the pick is never undefined
      onPick: onPick && ((id) => id !== undefined && onPick(id)),
    });
    return {
      container: group.container,
      // Starts as `selected` and only moves to an option (see `single`), so
      // never undefined; the shared state is typed for the optional group too
      value: () => group.value() as T,
      select: group.select,
      setOptions: group.setOptions,
    };
  }

  /**
   * One option or none: a None chip comes first, and clicking the picked
   * chip again also picks none (a timer preset, which a block may not name).
   */
  static createOptional<T extends string>(
    parent: HTMLElement,
    props: ChipOptionalGroupProps<T>,
  ): ChipOptionalGroupResult<T> {
    return this.single<T>(parent, props, {
      initial: props.selected,
      onPick: props.onPick,
      none: props.none,
    });
  }

  /**
   * The single-pick group both kinds share. With `none`, a None chip comes
   * first and stands for the undefined pick; without it the pick is always
   * an option (or `initial`).
   */
  private static single<T extends string>(
    parent: HTMLElement,
    props: Omit<ChipGroupProps<T>, "selected" | "onPick">,
    choice: {
      initial: T | undefined;
      onPick?: (id: T | undefined) => void;
      /** The None chip's label; unset = no None chip */
      none?: string;
    },
  ): ChipOptionalGroupResult<T> {
    const { none } = choice;
    const { container, group } = this.frame(parent, props);

    let options = props.options;
    let selected: T | undefined = choice.initial;
    /** Each drawn chip with the pick it stands for (undefined = the None chip) */
    let chips: { chip: HTMLButtonElement; id: T | undefined }[] = [];
    const press = () => chips.forEach(({ chip, id }) => Chip.setSelected(chip, id === selected));
    const pick = (id: T | undefined) => {
      if (id === selected) return;
      selected = id;
      press();
      choice.onPick?.(id);
    };
    const select = (id: string | undefined): boolean => {
      if (id === undefined) {
        if (none === undefined) return false;
        pick(undefined);
        return true;
      }
      const option = options.find((o) => o.id === id);
      if (!option) return false;
      pick(option.id);
      return true;
    };
    const chipFor = (text: string, id: T | undefined) => {
      const chip = Chip.create(group, {
        text,
        selected: id === selected,
        onClick: () => pick(none !== undefined && id === selected ? undefined : id),
      });
      if (props.focusKeyPrefix) DomUtils.setFocusKey(chip, `${props.focusKeyPrefix}-${id ?? ""}`);
      return { chip, id };
    };
    const draw = () => {
      group.empty();
      chips = none === undefined ? [] : [chipFor(none, undefined)];
      for (const option of options) chips.push(chipFor(option.label, option.id));
    };
    draw();

    /**
     * The pick when the new options offer neither the wanted nor the current
     * one: none when there is a None chip, else the first option (the current
     * pick stays when there is no option at all)
     */
    const pickWhenDropped = (next: ChipOption<T>[]): T | undefined => {
      if (none !== undefined) return undefined;
      return next.length > 0 ? next[0].id : selected;
    };

    return {
      container,
      value: () => selected,
      select,
      setOptions: (next, wanted) => {
        options = next;
        const offered = (id: string | undefined) => next.find((o) => o.id === id)?.id;
        selected = offered(wanted) ?? offered(selected) ?? pickWhenDropped(next);
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
