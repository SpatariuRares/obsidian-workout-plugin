/**
 * CheckToggle Atom
 * The tick that marks something done, and takes it back once done
 * (a set logged, a step completed). Outlined while to do, filled when done.
 */
import { setIcon } from "obsidian";
import { ICONS } from "@app/constants/ui.constants";
import { DomUtils } from "@app/utils/DomUtils";

export interface CheckToggleProps {
  done: boolean;
  /**
   * What a tap does, as the screen reader says it: "Log set 2" while to do,
   * "Remove set 2 from the log" when done. Name the action, since the same
   * control does opposite things in its two states.
   */
  label: string;
  onClick: () => void;
  /** Name to focus it by after the parent redraws (DomUtils.focusByKey) */
  focusKey?: string;
  className?: string;
}

export class CheckToggle {
  static create(parent: HTMLElement, props: CheckToggleProps): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: ["workout-check-toggle", props.className ?? ""].join(" ").trim(),
      attr: { type: "button", "aria-label": props.label },
    });
    if (props.done) button.addClass("is-done");
    setIcon(button, ICONS.ACTIONS.DONE);
    if (props.focusKey) DomUtils.setFocusKey(button, props.focusKey);
    button.addEventListener("click", () => props.onClick());
    return button;
  }
}
