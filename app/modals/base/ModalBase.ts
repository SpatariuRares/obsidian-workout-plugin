// Base modal class with common functionality
import { App, Modal, Notice, MarkdownView } from "obsidian";

export abstract class ModalBase extends Modal {
  constructor(app: App) {
    super(app);
  }

  /**
   * Creates a styled section container
   */
  public createSection(parent: HTMLElement, title: string): HTMLElement {
    const section = parent.createEl("div", { cls: "modal-section" });
    const sectionTitle = section.createEl("h3", { text: title });
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
    return activeView?.file?.basename || "Current file";
  }

  /**
   * Inserts code into the current editor
   */
  protected insertIntoEditor(
    code: string,
    successMessage: string = "✅ Code inserted successfully!"
  ): void {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView) {
      const editor = activeView.editor;
      const cursor = editor.getCursor();
      editor.replaceRange(code + "\n\n", cursor);
      new Notice(successMessage);
    } else {
      new Notice("❌ Open a markdown file to insert the code.");
    }
  }

  /**
   * Creates a text input field
   */
  public createTextInput(
    container: HTMLElement,
    label: string,
    placeholder: string = "",
    value: string = ""
  ): HTMLInputElement {
    container.createEl("label", { text: label });
    const input = container.createEl("input", { type: "text" });
    input.placeholder = placeholder;
    if (value) input.value = value;
    return input;
  }

  /**
   * Creates a number input field
   */
  public createNumberInput(
    container: HTMLElement,
    label: string,
    value: string = "",
    min?: number,
    max?: number,
    placeholder: string = ""
  ): HTMLInputElement {
    container.createEl("label", { text: label });
    const input = container.createEl("input", { type: "number" });
    if (value) input.value = value;
    if (min !== undefined) input.setAttribute("min", min.toString());
    if (max !== undefined) input.setAttribute("max", max.toString());
    if (placeholder) input.placeholder = placeholder;
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
      cls: "current-file-info",
    });
    currentFileInfo.textContent = `Current file: ${currentFileName}`;
    return currentFileInfo;
  }
}
