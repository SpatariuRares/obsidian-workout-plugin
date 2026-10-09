import { ModalBase } from "@app/features/modals/base/ModalBase";
import { t } from "@app/i18n";

export interface AdvancedOptionsElements {
  exactMatchToggle: HTMLInputElement;
  titleInput?: HTMLInputElement;
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
      showAddButton?: boolean;
      compact?: boolean;
    } = {},
  ): AdvancedOptionsElements {
    const advancedSection = modal.createSection(
      container,
      t("modal.sections.advancedOptions"),
    );

    // Compact mode: wrap checkboxes in a flex row
    const checkboxParent = options.compact
      ? advancedSection.createDiv({
          cls: "workout-table-options-row",
        })
      : advancedSection;

    // Exact match toggle
    const exactMatchContainer =
      modal.createCheckboxGroup(checkboxParent);
    const exactMatchToggle = modal.createCheckbox(
      exactMatchContainer,
      t("modal.checkboxes.exactMatch"),
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
        t("modal.customTitle"),
        t("modal.placeholders.customTitle"),
      );
      elements.titleInput = titleInput;
    }

    // Optional add button toggle
    if (options.showAddButton) {
      const addButtonContainer =
        modal.createCheckboxGroup(checkboxParent);
      const addButtonToggle = modal.createCheckbox(
        addButtonContainer,
        t("modal.checkboxes.showAddButton"),
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
  } {
    const values: {
      exactMatch: boolean;
      title?: string;
    } = {
      exactMatch: elements.exactMatchToggle.checked,
    };

    if (elements.titleInput) {
      values.title = elements.titleInput.value.trim();
    }

    return values;
  }
}
