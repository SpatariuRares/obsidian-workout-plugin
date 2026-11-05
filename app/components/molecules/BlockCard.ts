/**
 * BlockCard Molecule
 * A block's surface (DESIGN.md "Block card"): card color, control border,
 * its parts one under the other. Its top row is the title, the meta and
 * whatever the caller adds after them (the ⋮ menu), always in the top right
 * corner. `workout-log`, `workout-sets`, `workout-session`, `workout-chart` and `workout-duration` are block cards.
 */

export interface BlockCardProps {
  /** The block's subject (an exercise), in accent text */
  title?: string;
  /** The title says what is missing ("Choose an exercise"): muted, not accent */
  titleIsMessage?: boolean;
  /** Text before the menu ("2/4 sets") */
  meta?: string;
  /** The block's own classes (space-separated), for its layout */
  className?: string;
}

export interface BlockCardResult {
  el: HTMLElement;
  /** The top row: add the ⋮ menu here, after the title and meta */
  header: HTMLElement;
}

export class BlockCard {
  static create(parent: HTMLElement, props: BlockCardProps = {}): BlockCardResult {
    const el = parent.createDiv({ cls: "workout-block-card" });
    if (props.className) el.addClass(...props.className.split(/\s+/).filter(Boolean));

    // Empty (no title, meta or menu) it is hidden by CSS
    const header = el.createDiv({ cls: "workout-block-header" });
    if (props.title !== undefined) {
      const title = header.createDiv({ cls: "workout-block-title", text: props.title });
      if (props.titleIsMessage) title.addClass("is-message");
    }
    if (props.meta) header.createDiv({ cls: "workout-block-meta", text: props.meta });
    return { el, header };
  }

  /** The card's last row, for its actions (Add set, Add log), at the right end */
  static footer(card: HTMLElement): HTMLElement {
    return card.createDiv({ cls: "workout-block-footer" });
  }
}
