import { CONSTANTS } from "@app/constants";
import { SearchBox } from "@app/components/molecules";
import { Button, Input } from "@app/components/atoms";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { DomUtils } from "@app/utils/DomUtils";
import { MuscleTagFormRenderer } from "@app/features/modals/muscle/components/MuscleTagFormRenderer";
import { MuscleTagImportPreviewRenderer } from "@app/features/modals/muscle/components/MuscleTagImportPreviewRenderer";

export interface MuscleTagLayoutCallbacks {
  onSearch: (value: string) => void;
  onAdd: () => void;
  onExport: () => void;
  onFileSelect: (event: Event) => void;
}

export interface MuscleTagLayoutRefs {
  tableBody: HTMLElement;
  countDisplay: HTMLElement;
  formRenderer: MuscleTagFormRenderer;
  importPreviewRenderer: MuscleTagImportPreviewRenderer;
}

export class MuscleTagLayoutRenderer {
  static render(
    container: HTMLElement,
    callbacks: MuscleTagLayoutCallbacks,
    searchValue: string,
  ): MuscleTagLayoutRefs {
    container.empty();

    const headerSection = container.createEl("div", {
      cls: "workout-modal-section workout-tag-header",
    });
    this.renderHeader(headerSection, callbacks, searchValue);

    const importPreviewContainer = container.createEl("div", {
      cls: "workout-tag-import-preview workout-modal-section",
    });
    DomUtils.setCssProps(importPreviewContainer, { display: "none" });

    const formContainer = container.createEl("div", {
      cls: "workout-tag-form-container workout-modal-section",
    });
    DomUtils.setCssProps(formContainer, { display: "none" });

    const countDisplay = container.createEl("p", {
      cls: "workout-tag-count",
    });

    const tableContainer = container.createEl("div", {
      cls: "workout-tag-table-container",
    });
    const tableBody = this.createTable(tableContainer);

    return {
      tableBody,
      countDisplay,
      formRenderer: new MuscleTagFormRenderer(formContainer),
      importPreviewRenderer: new MuscleTagImportPreviewRenderer(
        importPreviewContainer,
      ),
    };
  }

  private static renderHeader(
    headerSection: HTMLElement,
    callbacks: MuscleTagLayoutCallbacks,
    searchValue: string,
  ): void {
    const searchBox = SearchBox.create(headerSection, {
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.SEARCH_TAGS,
    });

    if (searchValue) {
      searchBox.input.value = searchValue;
    }

    searchBox.input.addEventListener("input", () => {
      callbacks.onSearch(SearchBox.getValue(searchBox).toLowerCase());
    });

    const buttonContainer = headerSection.createEl("div", {
      cls: "workout-tag-header-buttons",
    });

    const addButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.ADD_TAG,
      className: "mod-cta workout-tag-add-btn",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.ADD_TAG,
    });
    Button.onClick(addButton, callbacks.onAdd);

    const exportButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.EXPORT_TAGS,
      className: "workout-tag-export-btn",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.EXPORT_TAGS,
    });
    Button.onClick(exportButton, callbacks.onExport);

    const importButton = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.IMPORT_TAGS,
      className: "workout-tag-import-btn",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.LABELS.IMPORT_TAGS,
    });

    const fileInput = Input.create(buttonContainer, {
      type: INPUT_TYPE.FILE,
    });
    fileInput.setAttribute("accept", ".csv");
    DomUtils.setCssProps(fileInput, { display: "none" });
    fileInput.addEventListener("change", callbacks.onFileSelect);

    Button.onClick(importButton, () => fileInput.click());
  }

  private static createTable(container: HTMLElement): HTMLElement {
    const table = container.createEl("table", {
      cls: "workout-tag-table",
    });

    const thead = table.createEl("thead");
    const headerRow = thead.createEl("tr");
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TAG,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.MUSCLE_GROUP,
    });
    headerRow.createEl("th", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.ACTIONS,
      cls: "workout-tag-actions-header",
    });

    return table.createEl("tbody");
  }
}
