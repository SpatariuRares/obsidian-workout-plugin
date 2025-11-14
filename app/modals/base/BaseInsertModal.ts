// Base class for insert modals (Chart, Table, Timer)
// Extracts common structure and button creation logic
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { MODAL_BUTTONS } from "@app/constants/ModalConstants";

/**
 * Abstract base class for insert modals.
 * Provides shared modal structure, button creation, and code insertion logic.
 * Subclasses implement specific configuration sections and code generation.
 */
export abstract class BaseInsertModal extends ModalBase {
  constructor(app: App, protected plugin?: WorkoutChartsPlugin) {
    super(app);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract getModalTitle(): string;
  protected abstract getButtonText(): string;
  protected abstract getSuccessMessage(): string;
  protected abstract createConfigurationSections(container: HTMLElement): void;
  protected abstract generateCode(): string;

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.getModalTitle() });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Subclass creates their specific configuration sections
    this.createConfigurationSections(mainContainer);

    // Create buttons section (common to all insert modals)
    const buttonsSection = this.createButtonsSection(mainContainer);
    this.createButtons(buttonsSection);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * Creates Insert and Cancel buttons with standard behavior
   */
  protected createButtons(container: HTMLElement): void {
    // Insert button
    const insertBtn = container.createEl("button", {
      text: this.getButtonText(),
      cls: "mod-cta",
    });

    // Cancel button
    const cancelBtn = container.createEl("button", {
      text: MODAL_BUTTONS.CANCEL,
      cls: "mod-warning",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    insertBtn.addEventListener("click", () => {
      const code = this.generateCode();
      this.insertIntoEditor(code, this.getSuccessMessage());
      this.close();
    });
  }
}
