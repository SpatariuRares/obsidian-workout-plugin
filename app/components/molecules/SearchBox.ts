/**
 * SearchBox Molecule
 * Search input with icon
 * Combines: Icon + Input + Container atoms
 */

import { Icon, Input, Container } from "@app/components/atoms";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { t } from "@app/i18n";

export interface SearchBoxProps {
  placeholder?: string;
  value?: string;
  className?: string;
  icon?: string;
}

export interface SearchBoxResult {
  container: HTMLElement;
  input: HTMLInputElement;
  icon: HTMLSpanElement;
}

/**
 * Creates a search box with icon and input
 * Used in: Exercise search, table filters, autocomplete
 *
 * @example
 * ```typescript
 * const { input } = SearchBox.create(container);
 *
 * Input.onChange(input, (e) => handleSearch(Input.getValue(input)));
 * ```
 */
export class SearchBox {
  // Default search icon
  private static readonly DEFAULT_ICON = "🔍";

  /**
   * Create a search box element
   * @param parent - Parent HTML element
   * @param props - Search box properties
   * @returns Object with container, input, and icon elements
   */
  static create(parent: HTMLElement, props?: SearchBoxProps): SearchBoxResult {
    // Create container
    const container = Container.create(parent, {
      className: `search-box ${props?.className || ""}`.trim(),
    });

    // Add search icon
    const icon = Icon.create(container, {
      name: props?.icon || this.DEFAULT_ICON,
      className: "search-box-icon",
    });

    // Add input
    const input = Input.create(container, {
      type: INPUT_TYPE.TEXT,
      placeholder: props?.placeholder || t("general.search"),
      value: props?.value,
      className: "search-box-input",
    });

    return {
      container,
      input,
      icon,
    };
  }

  /**
   * Clear the search box
   * @param searchBox - Search box result from create()
   */
  static clear(searchBox: SearchBoxResult): void {
    Input.setValue(searchBox.input, "");
  }

  /**
   * Get current search value
   * @param searchBox - Search box result from create()
   * @returns Current input value
   */
  static getValue(searchBox: SearchBoxResult): string {
    return Input.getValue(searchBox.input);
  }
}
