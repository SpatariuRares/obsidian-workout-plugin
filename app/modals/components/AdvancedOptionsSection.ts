// Reusable advanced options section component
import { ModalBase } from "@app/modals/base/ModalBase";

export interface AdvancedOptionsElements {
  exactMatchToggle: HTMLInputElement;
  debugToggle: HTMLInputElement;
  titleInput?: HTMLInputElement;
  searchByNameToggle?: HTMLInputElement;
}

export class AdvancedOptionsSection {
  /**
   * Creates the advanced options section
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    options: {
      showTitle?: boolean;
      showSearchByName?: boolean;
    } = {}
  ): AdvancedOptionsElements {
    const advancedSection = modal.createSection(container, "Advanced options");

    // Exact match toggle
    const exactMatchContainer = modal.createCheckboxGroup(advancedSection);
    const exactMatchToggle = modal.createCheckbox(
      exactMatchContainer,
      "Exact match",
      false,
      "exactMatch"
    );

    // Debug mode toggle
    const debugContainer = modal.createCheckboxGroup(advancedSection);
    const debugToggle = modal.createCheckbox(
      debugContainer,
      "Debug mode",
      false,
      "debug"
    );

    const elements: AdvancedOptionsElements = {
      exactMatchToggle,
      debugToggle,
    };

    // Optional title input
    if (options.showTitle) {
      const titleContainer = modal.createFormGroup(advancedSection);
      const titleInput = modal.createTextInput(
        titleContainer,
        "Custom title:",
        "Leave empty for automatic title"
      );
      elements.titleInput = titleInput;
    }

    // Optional search by name toggle
    if (options.showSearchByName) {
      const searchByNameContainer = modal.createCheckboxGroup(advancedSection);
      const searchByNameToggle = modal.createCheckbox(
        searchByNameContainer,
        "Search by file name",
        false,
        "searchByName"
      );
      elements.searchByNameToggle = searchByNameToggle;
    }

    return elements;
  }

  /**
   * Gets the advanced options values
   */
  static getValues(elements: AdvancedOptionsElements): {
    exactMatch: boolean;
    debug: boolean;
    title?: string;
    searchByName?: boolean;
  } {
    const values: {
      exactMatch: boolean;
      debug: boolean;
      title?: string;
      searchByName?: boolean;
    } = {
      exactMatch: elements.exactMatchToggle.checked,
      debug: elements.debugToggle.checked,
    };

    if (elements.titleInput) {
      values.title = elements.titleInput.value.trim();
    }

    if (elements.searchByNameToggle) {
      values.searchByName = elements.searchByNameToggle.checked;
    }

    return values;
  }
}
