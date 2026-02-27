/**
 * SelectDropdown Molecule
 * Action select dropdown with placeholder and auto-reset
 * Combines: select element + options + event handling
 */

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectDropdownProps {
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}

export interface SelectDropdownResult {
  select: HTMLSelectElement;
}

/**
 * Creates a select dropdown with placeholder support and auto-reset behavior.
 * When an option is selected, onChange fires and the select resets to the placeholder.
 *
 * @example
 * ```typescript
 * const { select } = SelectDropdown.create(parent, {
 *   placeholder: "Actions",
 *   options: [
 *     { label: "Goto exercise", value: "goto" },
 *     { label: "Edit table", value: "edit" },
 *   ],
 * });
 *
 * SelectDropdown.onChange(select, (value) => {
 *   if (value === "goto") navigateToExercise();
 *   if (value === "edit") openEditModal();
 * });
 * ```
 */
export class SelectDropdown {
  /**
   * Create a select dropdown
   * @param parent - Parent HTML element
   * @param props - Select properties
   * @returns Object with the select element
   */
  static create(
    parent: HTMLElement,
    props: SelectDropdownProps,
  ): SelectDropdownResult {
    const select = parent.createEl("select", {
      cls: `workout-select-dropdown ${props.className || ""}`.trim(),
      attr: {
        ...(props.ariaLabel && { "aria-label": props.ariaLabel }),
      },
    });

    if (props.placeholder) {
      const placeholder = select.createEl("option", {
        text: props.placeholder,
        value: "",
      });
      placeholder.disabled = true;
      placeholder.selected = true;
    }

    for (const option of props.options) {
      select.createEl("option", {
        text: option.label,
        value: option.value,
      });
    }

    return { select };
  }

  /**
   * Attach change handler with auto-reset to placeholder
   * @param select - Select element
   * @param handler - Change handler receiving the selected value
   * @param signal - Optional AbortSignal for cleanup
   */
  static onChange(
    select: HTMLSelectElement,
    handler: (value: string) => void,
    signal?: AbortSignal,
  ): void {
    select.addEventListener(
      "change",
      () => {
        const value = select.value;
        select.selectedIndex = 0;
        if (value) {
          handler(value);
        }
      },
      signal ? { signal } : undefined,
    );
  }
}
