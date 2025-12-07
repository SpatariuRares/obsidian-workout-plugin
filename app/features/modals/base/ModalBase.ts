// Base modal class with common functionality
import { App, Modal, Notice, MarkdownView } from "obsidian";
import { FormField } from "@app/components/molecules";
import { MODAL_NOTICES } from "@app/constants/ModalConstants";
import { TEXT_CONSTANTS } from "@app/constants";
import { INPUT_TYPE } from "@app/types";

export abstract class ModalBase extends Modal {
  constructor(app: App) {
    super(app);
  }

  /**
   * Creates a styled section container
   */
  public createSection(parent: HTMLElement, title: string): HTMLElement {
    const section = parent.createEl("div", { cls: "workout-modal-section" });
    section.createEl("h3", { text: title });
    return section;
  }

  /**
   * Creates a form group container
   */
  public createFormGroup(parent: HTMLElement): HTMLElement {
    return parent.createEl("div", {
      cls: "workout-charts-form-group",
    });
  }

  /**
   * Creates a checkbox group container
   */
  public createCheckboxGroup(parent: HTMLElement): HTMLElement {
    return parent.createEl("div", {
      cls: "workout-charts-form-group workout-charts-checkbox-group",
    });
  }

  /**
   * Creates a buttons section
   */
  protected createButtonsSection(parent: HTMLElement): HTMLElement {
    const buttonsSection = parent.createEl("div", {
      cls: "workout-charts-buttons",
    });
    return buttonsSection;
  }

  /**
   * Gets the current file name
   */
  protected getCurrentFileName(): string {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    return activeView?.file?.basename || TEXT_CONSTANTS.UI.LABELS.CURRENT_FILE;
  }

  /**
   * Inserts code into the current editor
   */
  protected insertIntoEditor(
    code: string,
    successMessage: string = TEXT_CONSTANTS.MESSAGES.SUCCESS.CODE_INSERTED
  ): void {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(code + "\n\n", cursor);
      new Notice(successMessage);
    } else {
      new Notice(MODAL_NOTICES.INSERT_CODE_NO_FILE);
    }
  }

  /**
   * Creates a text input field
   * Uses FormField molecule for consistent styling
   */
  public createTextInput(
    container: HTMLElement,
    label: string,
    placeholder: string = "",
    value: string = ""
  ): HTMLInputElement {
    const { input } = FormField.create(container, {
      label: label,
      inputProps: {
        type: INPUT_TYPE.TEXT,
        placeholder: placeholder,
        value: value,
      },
    });
    return input;
  }

  /**
   * Creates a number input field
   * Uses FormField molecule for consistent styling
   */
  public createNumberInput(
    container: HTMLElement,
    label: string,
    value: string = "",
    min?: number,
    max?: number,
    placeholder: string = ""
  ): HTMLInputElement {
    const { input } = FormField.create(container, {
      label: label,
      inputProps: {
        type: INPUT_TYPE.NUMBER,
        placeholder: placeholder,
        value: value,
        min: min,
        max: max,
      },
    });
    return input;
  }

  /**
   * Creates a select dropdown
   */
  public createSelect(
    container: HTMLElement,
    label: string,
    options: Array<{ text: string; value: string }>
  ): HTMLSelectElement {
    container.createEl("label", { text: label });
    const select = container.createEl("select");
    options.forEach((option) => {
      select.createEl("option", {
        text: option.text,
        value: option.value,
      });
    });
    return select;
  }

  /**
   * Creates a checkbox with label
   */
  public createCheckbox(
    container: HTMLElement,
    label: string,
    checked: boolean = false,
    id?: string
  ): HTMLInputElement {
    const checkbox = container.createEl("input", { type: "checkbox" });
    if (checked) checkbox.checked = true;
    if (id) {
      checkbox.id = id;
      const labelEl = container.createEl("label", { text: label });
      labelEl.setAttribute("for", id);
    } else {
      container.createEl("label", { text: label });
    }
    return checkbox;
  }

  /**
   * Creates a textarea field
   */
  public createTextarea(
    container: HTMLElement,
    label: string,
    placeholder: string = "",
    rows: number = 3,
    value: string = ""
  ): HTMLTextAreaElement {
    container.createEl("label", { text: label });
    const textarea = container.createEl("textarea", {
      placeholder: placeholder,
    });
    textarea.rows = rows;
    if (value) textarea.value = value;
    return textarea;
  }

  /**
   * Creates a styled main container for modals
   */
  protected createStyledMainContainer(contentEl: HTMLElement): HTMLElement {
    const mainContainer = contentEl.createEl("div", {
      cls: "workout-charts-form workout-charts-modal-main-container",
    });
    return mainContainer;
  }

  /**
   * Creates a current file info element
   */
  public createCurrentFileInfo(
    parent: HTMLElement,
    currentFileName: string
  ): HTMLElement {
    const currentFileInfo = parent.createEl("div", {
      cls: "workout-current-file-info",
    });
    currentFileInfo.textContent = `Current file: ${currentFileName}`;
    return currentFileInfo;
  }

  /**
   * Helper methods that combine form group creation with input creation
   * These reduce boilerplate by ~30%
   */

  /**
   * Creates a text input field with form group wrapper
   */
  public createTextField(
    parent: HTMLElement,
    label: string,
    placeholder: string = "",
    value: string = ""
  ): HTMLInputElement {
    const container = this.createFormGroup(parent);
    return this.createTextInput(container, label, placeholder, value);
  }

  /**
   * Creates a number input field with form group wrapper
   */
  public createNumberField(
    parent: HTMLElement,
    label: string,
    defaultValue: number,
    options?: {
      min?: number;
      max?: number;
      placeholder?: string;
    }
  ): HTMLInputElement {
    const container = this.createFormGroup(parent);
    return this.createNumberInput(
      container,
      label,
      defaultValue.toString(),
      options?.min,
      options?.max,
      options?.placeholder
    );
  }

  /**
   * Creates a select field with form group wrapper
   */
  public createSelectField(
    parent: HTMLElement,
    label: string,
    options: Array<{ text: string; value: string }>
  ): HTMLSelectElement {
    const container = this.createFormGroup(parent);
    return this.createSelect(container, label, options);
  }

  /**
   * Creates a checkbox field with checkbox group wrapper
   */
  public createCheckboxField(
    parent: HTMLElement,
    label: string,
    checked: boolean = false,
    id?: string
  ): HTMLInputElement {
    const container = this.createCheckboxGroup(parent);
    return this.createCheckbox(container, label, checked, id);
  }

  /**
   * Creates a textarea field with form group wrapper
   */
  public createTextareaField(
    parent: HTMLElement,
    label: string,
    placeholder: string = "",
    rows: number = 3,
    value: string = ""
  ): HTMLTextAreaElement {
    const container = this.createFormGroup(parent);
    return this.createTextarea(container, label, placeholder, rows, value);
  }
}
