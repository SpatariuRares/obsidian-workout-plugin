// Reusable advanced options section component
import { ModalBase } from "../base/ModalBase";

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
    const advancedSection = modal.createSection(container, "Opzioni Avanzate");

    // Exact match toggle
    const exactMatchContainer = modal.createCheckboxGroup(advancedSection);
    const exactMatchToggle = modal.createCheckbox(
      exactMatchContainer,
      "Matching Esatto",
      false,
      "exactMatch"
    );

    // Debug mode toggle
    const debugContainer = modal.createCheckboxGroup(advancedSection);
    const debugToggle = modal.createCheckbox(
      debugContainer,
      "Modalità Debug",
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
        "Titolo Personalizzato:",
        "Lascia vuoto per titolo automatico"
      );
      elements.titleInput = titleInput;
    }

    // Optional search by name toggle
    if (options.showSearchByName) {
      const searchByNameContainer = modal.createCheckboxGroup(advancedSection);
      const searchByNameToggle = modal.createCheckbox(
        searchByNameContainer,
        "Ricerca per Nome File",
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
    const values: any = {
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
