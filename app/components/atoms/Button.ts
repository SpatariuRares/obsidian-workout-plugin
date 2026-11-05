/**
 * Button Atom
 * Basic button component - indivisible UI primitive
 */
import { Icon } from "@app/components/atoms/Icon";
import { t } from "@app/i18n";

export enum BUTTONSIZE {
  SMALL = "small",
  MEDIUM = "medium",
  BIG = "big",
  GIANT = "giant",
}

export enum BUTTONVARIANT {
  PRIMARY = "primary",
  SECONDARY = "secondary",
  DANGER = "danger",
  WARNING = "warning",
}

export interface ButtonProps {
  text?: string;
  /** Lucide icon id, from ICONS */
  icon?: string;
  className?: string;
  variant: BUTTONVARIANT;
  title?: string;
  disabled?: boolean;
  ariaLabel?: string;
  extraContainerCls?: string;
  size?: BUTTONSIZE;
}

/** One labelled button of a modal's action row */
export interface ModalAction {
  text: string;
  onClick: () => void | Promise<void>;
  /** Primary for the primary action, secondary for `others` */
  variant?: BUTTONVARIANT;
  /** Defaults to the text */
  ariaLabel?: string;
  disabled?: boolean;
}

export interface ModalActionsOptions {
  /** Save, insert, update, confirm, ...: drawn first */
  primary?: ModalAction;
  /** Further choices, after the primary action */
  others?: ModalAction[];
  /** Draws Cancel at the end, calling this when it is clicked */
  onCancel?: () => void;
  /** Draws rare actions (a delete icon) at the start of the row */
  start?: (row: HTMLElement) => void;
  /** An extra class on the row */
  className?: string;
}

export interface ModalActions {
  row: HTMLElement;
  primary?: HTMLButtonElement;
  cancel?: HTMLButtonElement;
}

/**
 * Creates button elements
 * This is an atom - it has no dependencies on other UI components
 */
export class Button {
  /**
   * Create a button element
   * @param parent - Parent HTML element
   * @param props - Button properties
   * @returns The created button element
   */
  /**
   * Create a button container with the workout-button-container class
   */
  static createContainer(parent: HTMLElement): HTMLElement {
    return parent.createDiv({
      cls: "workout-buttons-container",
    });
  }

  /**
   * The row of a modal's main buttons: it stays at the bottom of the modal
   * while the form scrolls under it. One order for every modal: `start`
   * (rare actions such as delete), the primary action, `others`, Cancel.
   */
  static createModalActions(
    parent: HTMLElement,
    options: ModalActionsOptions,
  ): ModalActions {
    const row = Button.createContainer(parent);
    row.addClass("workout-modal-actions");
    if (options.className) row.addClass(options.className);

    options.start?.(row);
    const primary = options.primary
      ? Button.createAction(row, options.primary, BUTTONVARIANT.PRIMARY)
      : undefined;
    for (const other of options.others ?? []) {
      Button.createAction(row, other, BUTTONVARIANT.SECONDARY);
    }

    let cancel: HTMLButtonElement | undefined;
    const onCancel = options.onCancel;
    if (onCancel) {
      cancel = Button.create(row, {
        text: t("modal.buttons.cancel"),
        ariaLabel: t("modal.buttons.cancel"),
        variant: BUTTONVARIANT.SECONDARY,
      });
      Button.onClick(cancel, () => onCancel());
    }

    return { row, primary, cancel };
  }

  private static createAction(
    row: HTMLElement,
    action: ModalAction,
    defaultVariant: BUTTONVARIANT,
  ): HTMLButtonElement {
    const btn = Button.create(row, {
      text: action.text,
      ariaLabel: action.ariaLabel ?? action.text,
      variant: action.variant ?? defaultVariant,
      disabled: action.disabled,
    });
    Button.onClick(btn, () => void action.onClick());
    return btn;
  }

  static create(
    parent: HTMLElement,
    props: ButtonProps,
  ): HTMLButtonElement {
    const btn = parent.createEl("button", {
      cls: `${props.className || ""} workout-btn workout-btn-${props.variant} workout-btn-${props.size || BUTTONSIZE.MEDIUM}`,
      attr: {
        ...(props.title && { title: props.title }),
        ...(props.disabled && { disabled: "true" }),
        ...(props.ariaLabel && { "aria-label": props.ariaLabel }),
      },
    });

    if (props.icon) {
      // A class instead of `:has(> .workout-btn-icon)` in CSS: `:has` makes
      // the browser re-check selectors on every DOM change below the button
      btn.addClass("workout-btn-with-icon");
      Icon.create(btn, { name: props.icon, className: "workout-btn-icon" });
    }
    if (props.text) btn.appendText(props.text);

    return btn;
  }

  /**
   * Attach click handler to button
   * @param button - Button element
   * @param handler - Click event handler
   * @param signal - Optional AbortSignal for event listener cleanup
   */
  static onClick(
    button: HTMLButtonElement,
    handler: (e: MouseEvent) => void,
    signal?: AbortSignal,
  ): void {
    button.addEventListener(
      "click",
      handler,
      signal ? { signal } : undefined,
    );
  }

  /**
   * Enable/disable button
   * @param button - Button element
   * @param disabled - Whether to disable
   */
  static setDisabled(
    button: HTMLButtonElement,
    disabled: boolean,
  ): void {
    if (disabled) {
      button.setAttribute("disabled", "true");
      button.addClass("disabled");
    } else {
      button.removeAttribute("disabled");
      button.removeClass("disabled");
    }
  }
}
