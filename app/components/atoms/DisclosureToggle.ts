/**
 * DisclosureToggle Atom
 * The chevron that shows or hides a row's extra details. A dot on it says
 * the hidden details hold something other than the defaults.
 */
import { setIcon } from "obsidian";
import { ICONS } from "@app/constants/ui.constants";
import { DomUtils } from "@app/utils/DomUtils";

export interface DisclosureToggleProps {
  expanded: boolean;
  /** What it shows ("Protocol and notes of set 2") */
  label: string;
  onToggle: () => void;
  /** The hidden details hold something set: shows the dot */
  marked?: boolean;
  /** Id of the element it shows, for aria-controls */
  controls?: string;
  focusKey?: string;
  className?: string;
}

export class DisclosureToggle {
  static create(parent: HTMLElement, props: DisclosureToggleProps): HTMLButtonElement {
    const button = parent.createEl("button", {
      cls: ["workout-disclosure-toggle clickable-icon", props.className ?? ""].join(" ").trim(),
      attr: {
        type: "button",
        "aria-label": props.label,
        "aria-expanded": String(props.expanded),
        ...(props.controls && { "aria-controls": props.controls }),
      },
    });
    if (props.expanded) button.addClass("is-expanded");
    setIcon(button, ICONS.ACTIONS.EXPAND);
    if (props.marked) button.createSpan({ cls: "workout-disclosure-toggle-dot" });
    if (props.focusKey) DomUtils.setFocusKey(button, props.focusKey);
    button.addEventListener("click", () => props.onToggle());
    return button;
  }
}
