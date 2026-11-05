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

/** Where an edit modal finds its block */
export interface EditTarget {
  /** The note the block is written in (`ctx.sourcePath`) */
  sourcePath: string;
  /** How to find a block written without an id (it gets one when saved) */
  matchWithoutId?: CodeBlockMatch;
  /**
   * Parameters whose value in the block is invalid: Update writes the form's
   * value for them even when the form is as it opened (it can't tell they
   * were wrong)
   */
  invalidKeys?: string[];
}

export interface EditButtonsOptions<P> {
  schema: CodeBlockSchema<P>;
  target: EditTarget;
  /** The block's id; without one the block is found by `target.matchWithoutId` */
  id?: string;
  collectParams: () => P;
  /**
   * Checks the form before Update writes it: false keeps the modal open (the
   * fields show what to fix)
   */
  validate?: () => boolean;
  /** Parameters the form no longer offers: Update removes them from the block */
  retiredParams?: (keyof P)[];
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
    if (options.validate && !options.validate()) return;
    const formNow = options.collectParams();
    const changes = changedParams(formAtOpen, formNow);
    for (const key of options.target.invalidKeys ?? []) {
      changes[key as keyof P] = formNow[key as keyof P];
    }
    for (const key of options.retiredParams ?? []) changes[key] = undefined as P[keyof P];
    applyBlockEdit(modal, options, changes);
  });
}

/**
 * Writes `changes` into the block and closes the modal, with the notice for
 * the outcome. The block is found by its id or, without one, by its body
 * (and gets an id, so the next edit finds it by id).
 */
export function applyBlockEdit<P extends { id?: string }>(
  modal: Modal,
  options: Pick<
    EditButtonsOptions<P>,
    "schema" | "target" | "id" | "successMessage" | "failureMessage"
  >,
  changes: P,
): void {
  const { id, target } = options;
  const match: CodeBlockMatch | undefined = id
    ? { id }
    : target.matchWithoutId;
  if (!match) {
    new Notice(options.failureMessage);
    modal.close();
    return;
  }

  if ("body" in match) changes.id = generateCodeBlockId();

  void CodeBlockEditorService.patchCodeBlock(
    modal.app,
    options.schema,
    target.sourcePath,
    match,
    changes,
  ).then((success) => {
    new Notice(success ? options.successMessage : options.failureMessage);
  });

  modal.close();
}
