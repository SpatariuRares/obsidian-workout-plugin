// Base class for insert modals (Chart, Table, Timer)
// Extracts common structure and button creation logic

import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { Button } from "@app/components/atoms";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";
import {
  createEditButtons,
  type EditButtonsOptions,
} from "@app/features/modals/base/components/createEditButtons";

/** The block an edit modal writes into and how it reads its form (createEditButtons) */
export type BlockEdit<P> = Omit<
  EditButtonsOptions<P>,
  "schema" | "buttonText" | "successMessage" | "failureMessage"
>;

/**
 * Abstract base class for insert modals.
 * Provides shared modal structure, button creation, and code insertion logic.
 * Subclasses implement specific configuration sections and code generation.
 */
export abstract class BaseInsertModal extends ModalBase {
  constructor(
    app: App,
    protected plugin?: WorkoutPluginContext,
  ) {
    super(app);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  protected abstract getModalTitle(): string;
  protected abstract getButtonText(): string;
  protected abstract getSuccessMessage(): string;
  protected abstract createConfigurationSections(
    container: HTMLElement,
  ): void;
  protected abstract generateCode(): string;

  /**
   * Checked before generateCode: return false (after telling the user why)
   * to keep the modal open without inserting anything
   */
  protected canInsert(): boolean {
    return true;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-modal");

    contentEl.createEl("h2", { text: this.getModalTitle() });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Subclass creates their specific configuration sections
    this.createConfigurationSections(mainContainer);

    // The action row (common to all insert modals)
    this.createButtons(mainContainer);
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /**
   * The action row at the end of `parent`: Insert, then Cancel
   */
  protected createButtons(parent: HTMLElement): void {
    Button.createModalActions(parent, {
      primary: {
        text: this.getButtonText(),
        onClick: () => {
          if (!this.canInsert()) return;
          const code = this.generateCode();
          this.insertIntoEditor(code, this.getSuccessMessage());
          this.close();
        },
      },
      onCancel: () => this.close(),
    });
  }

  /**
   * Update and Cancel for the form opened on an existing block, in place of
   * Insert: an edit modal calls it from `createButtons` once the form is
   * filled in. The button text and success notice are the modal's own.
   */
  protected editButtons<P extends { id?: string }>(
    parent: HTMLElement,
    schema: CodeBlockSchema<P>,
    failureMessage: string,
    edit: BlockEdit<P>,
  ): void {
    createEditButtons(this, parent, {
      ...edit,
      schema,
      buttonText: this.getButtonText(),
      successMessage: this.getSuccessMessage(),
      failureMessage,
    });
  }
}
