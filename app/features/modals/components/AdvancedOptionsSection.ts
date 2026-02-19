import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";

export interface AdvancedOptionsElements {
  exactMatchToggle: HTMLInputElement;
  titleInput?: HTMLInputElement;
  searchByNameToggle?: HTMLInputElement;
  addButtonToggle?: HTMLInputElement;
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
      showAddButton?: boolean;
      compact?: boolean;
    } = {},
  ): AdvancedOptionsElements {
    const advancedSection = modal.createSection(
      container,
      CONSTANTS.WORKOUT.MODAL.SECTIONS.ADVANCED_OPTIONS,
    );

    // Compact mode: wrap checkboxes in a flex row
    const checkboxParent = options.compact
      ? advancedSection.createDiv({ cls: "workout-table-options-row" })
      : advancedSection;

    // Exact match toggle
    const exactMatchContainer = modal.createCheckboxGroup(checkboxParent);
    const exactMatchToggle = modal.createCheckbox(
      exactMatchContainer,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.EXACT_MATCH,
      false,
      "exactMatch",
    );

    const elements: AdvancedOptionsElements = {
      exactMatchToggle,
    };

    // Optional title input
    if (options.showTitle) {
      const titleContainer = modal.createFormGroup(advancedSection);
      const titleInput = modal.createTextInput(
        titleContainer,
        CONSTANTS.WORKOUT.MODAL.LABELS.CUSTOM_TITLE,
        CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.CUSTOM_TITLE,
      );
      elements.titleInput = titleInput;
    }

    // Optional search by name toggle
    if (options.showSearchByName) {
      const searchByNameContainer = modal.createCheckboxGroup(checkboxParent);
      const searchByNameToggle = modal.createCheckbox(
        searchByNameContainer,
        CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SEARCH_BY_NAME,
        false,
        "searchByName",
      );
      elements.searchByNameToggle = searchByNameToggle;
    }

    // Optional add button toggle
    if (options.showAddButton) {
      const addButtonContainer = modal.createCheckboxGroup(checkboxParent);
      const addButtonToggle = modal.createCheckbox(
        addButtonContainer,
        CONSTANTS.WORKOUT.MODAL.CHECKBOXES.SHOW_ADD_BUTTON,
        true,
        "showAddButton",
      );
      elements.addButtonToggle = addButtonToggle;
    }

    return elements;
  }

  /**
   * Gets the advanced options values
   */
  static getValues(elements: AdvancedOptionsElements): {
    exactMatch: boolean;
    title?: string;
    searchByName?: boolean;
  } {
    const values: {
      exactMatch: boolean;
      title?: string;
      searchByName?: boolean;
    } = {
      exactMatch: elements.exactMatchToggle.checked,
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
