// Base class for insert modals (Chart, Table, Timer)
// Extracts common structure and button creation logic
import { App } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/modals/base/ModalBase";
import { MODAL_BUTTONS } from "@app/constants/ModalConstants";
import { Button } from "@app/components/atoms";

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
   * Uses Button atom for consistent button styling
   */
  protected createButtons(container: HTMLElement): void {
    // Insert button using Button atom
    const insertBtn = Button.create(container, {
      text: this.getButtonText(),
      className: "mod-cta",
      ariaLabel: this.getButtonText(),
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(container, {
      text: MODAL_BUTTONS.CANCEL,
      className: "mod-warning",
      ariaLabel: MODAL_BUTTONS.CANCEL,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(insertBtn, () => {
      const code = this.generateCode();
      this.insertIntoEditor(code, this.getSuccessMessage());
      this.close();
    });
  }
}
