/**
 * Button Atom
 * Basic button component - indivisible UI primitive
 */

export interface ButtonProps {
  text?: string;
  icon?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
  ariaLabel?: string;
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
  static create(parent: HTMLElement, props: ButtonProps): HTMLButtonElement {
    const btn = parent.createEl("button", {
      cls: props.className || "workout-btn workout-btn-secondary",
      attr: {
        ...(props.title && { title: props.title }),
        ...(props.disabled && { disabled: "true" }),
        ...(props.ariaLabel && { "aria-label": props.ariaLabel }),
      },
    });

    btn.textContent = `${props.icon || ""} ${props.text || ""}`.trim();

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
    signal?: AbortSignal
  ): void {
    button.addEventListener("click", handler, signal ? { signal } : undefined);
  }

  /**
   * Enable/disable button
   * @param button - Button element
   * @param disabled - Whether to disable
   */
  static setDisabled(button: HTMLButtonElement, disabled: boolean): void {
    if (disabled) {
      button.setAttribute("disabled", "true");
      button.addClass("disabled");
    } else {
      button.removeAttribute("disabled");
      button.removeClass("disabled");
    }
  }
}
