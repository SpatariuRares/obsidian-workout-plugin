/**
 * NotesField Molecule
 * A labelled text area for short notes inside a block: keys stay in it
 * instead of reaching the editor around the block.
 */
import { DomUtils } from "@app/utils/DomUtils";

export interface NotesFieldProps {
  label: string;
  value: string;
  rows?: number;
  /**
   * "input": on every key (a draft kept in memory); "change": once the
   * field is left (a value saved somewhere, written once)
   */
  saveOn?: "input" | "change";
  onChange: (value: string) => void;
  focusKey?: string;
}

let nextId = 0;

export class NotesField {
  static create(parent: HTMLElement, props: NotesFieldProps): HTMLTextAreaElement {
    const id = `workout-notes-field-${++nextId}`;
    const container = parent.createDiv({ cls: "workout-notes-field" });
    container.createEl("label", { cls: "workout-notes-field-label", text: props.label, attr: { for: id } });
    const textarea = container.createEl("textarea", {
      cls: "workout-notes-field-input",
      attr: { id, rows: String(props.rows ?? 2) },
    });
    textarea.value = props.value;
    if (props.focusKey) DomUtils.setFocusKey(textarea, props.focusKey);
    textarea.addEventListener("keydown", (event) => event.stopPropagation());
    textarea.addEventListener(props.saveOn ?? "input", () => props.onChange(textarea.value));
    return textarea;
  }
}
