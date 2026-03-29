/**
 * IconDropdown Molecule
 * An icon-only button that toggles a custom dropdown panel with action items.
 * Better UX than a native <select>: fully styled, accessible, and closes on
 * outside click or Escape key.
 */

export interface IconDropdownOption {
  label: string;
  value: string;
  icon?: string;
}

export interface IconDropdownProps {
  icon: string;
  ariaLabel?: string;
  options: IconDropdownOption[];
  className?: string;
}

export interface IconDropdownResult {
  wrapper: HTMLElement;
  button: HTMLButtonElement;
}

/**
 * Creates an icon button that opens a dropdown list of actions.
 *
 * @example
 * ```typescript
 * const { wrapper } = IconDropdown.create(container, {
 *   icon: "✏️",
 *   ariaLabel: "Actions",
 *   options: [
 *     { label: "Edit timer", value: "edit", icon: "✏️" },
 *   ],
 * });
 *
 * IconDropdown.onChange(wrapper, (value) => {
 *   if (value === "edit") openEditModal();
 * }, signal);
 * ```
 */
export class IconDropdown {
  /**
   * Create the icon button + dropdown panel.
   */
  static create(
    parent: HTMLElement,
    props: IconDropdownProps,
  ): IconDropdownResult {
    const wrapper = parent.createEl("div", {
      cls: `workout-icon-dropdown ${props.className || ""}`.trim(),
    });

    const button = wrapper.createEl("button", {
      cls: "workout-icon-dropdown-btn",
      attr: {
        type: "button",
        ...(props.ariaLabel && { "aria-label": props.ariaLabel }),
        "aria-haspopup": "true",
        "aria-expanded": "false",
      },
    });
    button.textContent = props.icon;

    const panel = wrapper.createEl("div", {
      cls: "workout-icon-dropdown-panel",
      attr: { role: "menu" },
    });

    for (const opt of props.options) {
      const item = panel.createEl("button", {
        cls: "workout-icon-dropdown-item",
        attr: {
          type: "button",
          role: "menuitem",
          "data-value": opt.value,
        },
      });
      item.textContent = opt.icon
        ? `${opt.icon} ${opt.label}`
        : opt.label;
    }

    // Toggle open/close
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = wrapper.hasClass("workout-icon-dropdown--open");
      IconDropdown.close(wrapper);
      if (!isOpen) {
        IconDropdown.open(wrapper);
      }
    });

    return { wrapper, button };
  }

  static open(wrapper: HTMLElement): void {
    wrapper.addClass("workout-icon-dropdown--open");
    wrapper
      .querySelector(".workout-icon-dropdown-btn")
      ?.setAttribute("aria-expanded", "true");
  }

  static close(wrapper: HTMLElement): void {
    wrapper.removeClass("workout-icon-dropdown--open");
    wrapper
      .querySelector(".workout-icon-dropdown-btn")
      ?.setAttribute("aria-expanded", "false");
  }

  /**
   * Attach a change handler. Also registers document-level listeners for
   * outside-click and Escape-key dismissal.
   */
  static onChange(
    wrapper: HTMLElement,
    handler: (value: string) => void,
    signal?: AbortSignal,
  ): void {
    const listenerOpts = signal ? { signal } : undefined;

    // Item click
    wrapper
      .querySelectorAll<HTMLButtonElement>(
        ".workout-icon-dropdown-item",
      )
      .forEach((item) => {
        item.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
            const value = item.dataset.value ?? "";
            IconDropdown.close(wrapper);
            if (value) handler(value);
          },
          listenerOpts,
        );
      });

    // Outside click closes
    document.addEventListener(
      "click",
      () => {
        IconDropdown.close(wrapper);
      },
      listenerOpts,
    );

    // Escape key closes
    document.addEventListener(
      "keydown",
      (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          IconDropdown.close(wrapper);
        }
      },
      listenerOpts,
    );
  }
}
