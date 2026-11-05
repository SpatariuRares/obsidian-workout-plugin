/**
 * UndoNotice Molecule
 * An Obsidian notice for something done in one tap that can be taken back:
 * what happened on the left, Undo at the right end. Tapping Undo hides it.
 */
import { Notice } from "obsidian";
import { t } from "@app/i18n";

/** Long enough to read it and reach the button with a thumb */
export const UNDO_NOTICE_MS = 8000;

export interface UndoNoticeProps {
  /** What happened ("Set 2 removed") */
  message: string;
  onUndo: () => void;
  undoLabel?: string;
  duration?: number;
}

export class UndoNotice {
  static show(props: UndoNoticeProps): { hide: () => void } {
    const fragment = createFragment();
    const row = fragment.createDiv({ cls: "workout-undo-notice" });
    row.createSpan({ text: props.message });
    const undo = row.createEl("button", {
      cls: "workout-undo-notice-button mod-cta",
      text: props.undoLabel ?? t("common.undo"),
      attr: { type: "button" },
    });
    const notice = new Notice(fragment, props.duration ?? UNDO_NOTICE_MS);
    // The notice sizes its message to the text; filling it puts Undo at the end
    row.parentElement?.addClass("workout-undo-notice-message");
    undo.addEventListener("click", (event) => {
      event.stopPropagation();
      notice.hide();
      props.onUndo();
    });
    return { hide: () => notice.hide() };
  }
}
