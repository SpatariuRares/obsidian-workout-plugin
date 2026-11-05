/**
 * DeleteButton Atom
 * The red trash icon that deletes or removes something (a set, a widget, a
 * row). Deleting is rare, so it is a small icon, not a labelled button; the
 * caller asks to confirm when the action can't be undone.
 */
import { setIcon } from "obsidian";
import { ICONS } from "@app/constants/ui.constants";

export interface DeleteButtonProps {
  /** What it deletes ("Delete set"), read by screen readers */
  label: string;
  onClick: () => void;
  className?: string;
}

export class DeleteButton {
  static create(parent: HTMLElement, props: DeleteButtonProps): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: ["workout-delete-button clickable-icon", props.className ?? ""].join(" ").trim(),
      attr: { type: "button", "aria-label": props.label },
    });
    setIcon(button, ICONS.ACTIONS.DELETE);
    button.addEventListener("click", () => props.onClick());
    return button;
  }
}
