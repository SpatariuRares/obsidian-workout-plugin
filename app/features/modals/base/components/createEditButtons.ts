import { Modal, Notice } from "obsidian";
import {
  CodeBlockEditorService,
  CodeBlockMatch,
} from "@app/services/editor/CodeBlockEditorService";
import {
  changedParams,
  CodeBlockSchema,
} from "@app/services/codeblocks/CodeBlockSchema";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { t } from "@app/i18n";

export interface EditButtonsOptions<P> {
  schema: CodeBlockSchema<P>;
  /** The note the block is written in (`ctx.sourcePath`) */
  path: string;
  /** How to find the block; null when it can't be found (update fails) */
  match: CodeBlockMatch | null;
  collectParams: () => P;
  buttonText: string;
  successMessage: string;
  failureMessage: string;
}

/**
 * Update and Cancel buttons of an edit modal. The form is snapshotted now,
 * so call it once the form is filled in: Update patches only the parameters
 * the user changed, and comments, line order and parameters the form doesn't
 * show stay as typed in the note.
 */
export function createEditButtons<P extends { id?: string }>(
  modal: Modal,
  container: HTMLElement,
  options: EditButtonsOptions<P>,
): void {
  const formAtOpen = options.collectParams();

  const updateBtn = Button.create(container, {
    text: options.buttonText,
    variant: BUTTONVARIANT.PRIMARY,
    ariaLabel: options.buttonText,
  });
  const cancelBtn = Button.create(container, {
    text: t("modal.buttons.cancel"),
    variant: BUTTONVARIANT.SECONDARY,
    ariaLabel: t("modal.buttons.cancel"),
  });

  Button.onClick(cancelBtn, () => modal.close());

  Button.onClick(updateBtn, () => {
    const { match } = options;
    if (!match) {
      new Notice(options.failureMessage);
      modal.close();
      return;
    }

    const changes = changedParams(formAtOpen, options.collectParams());
    // A block found by its body gets an id, so the next edit finds it by id
    if ("body" in match) changes.id = generateCodeBlockId();

    void CodeBlockEditorService.patchCodeBlock(
      modal.app,
      options.schema,
      options.path,
      match,
      changes,
    ).then((success) => {
      new Notice(success ? options.successMessage : options.failureMessage);
    });

    modal.close();
  });
}
