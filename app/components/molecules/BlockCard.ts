/**
 * BlockCard Molecule
 * A block's surface (DESIGN.md "Block card"): card color, control border,
 * its parts one under the other. Its top row is the title, the meta and
 * whatever the caller adds after them (the ⋮ menu), always in the top right
 * corner. `workout-log`, `workout-sets`, `workout-session`, `workout-chart` and `workout-duration` are block cards.
 */

export interface BlockCardTitleLink {
  /** Vault path (or unresolved exercise name) used as link target */
  href: string;
  /** Marks the link as unresolved (`is-unresolved`) when no page exists yet */
  unresolved?: boolean;
  /** Invoked on primary click or middle-click (`auxclick` button 1) */
  onOpen: (event: MouseEvent) => void;
  /** Invoked on pointer hover (`mouseover`) for page preview */
  onHover?: (event: MouseEvent, targetEl: HTMLElement) => void;
  /** Optional signal to detach listeners when the caller re-renders */
  signal?: AbortSignal;
}

export interface BlockCardProps {
  /** The block's subject (an exercise), in accent text */
  title?: string;
  /** Renders the title as an interactive Obsidian internal link */
  titleLink?: BlockCardTitleLink;
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
      if (props.titleIsMessage || !props.titleLink) {
        const title = header.createDiv({ cls: "workout-block-title", text: props.title });
        if (props.titleIsMessage) title.addClass("is-message");
      } else {
        const title = header.createDiv({ cls: "workout-block-title" });
        BlockCard.renderTitleLink(title, props.title, props.titleLink);
      }
    }
    if (props.meta) header.createDiv({ cls: "workout-block-meta", text: props.meta });
    return { el, header };
  }

  /** Renders an interactive Obsidian internal link with middle-click and Page Preview support */
  static renderTitleLink(
    parent: HTMLElement,
    title: string,
    titleLink: BlockCardTitleLink,
  ): HTMLAnchorElement {
    const link = parent.createEl("a", {
      cls: titleLink.unresolved
        ? "internal-link workout-block-title-link is-unresolved"
        : "internal-link workout-block-title-link",
      text: title,
      attr: {
        href: titleLink.href,
        "data-href": titleLink.href,
        rel: "noopener",
      },
    });
    const listenerOptions = titleLink.signal ? { signal: titleLink.signal } : undefined;
    link.addEventListener(
      "click",
      (event) => {
        event.preventDefault();
        titleLink.onOpen(event);
      },
      listenerOptions,
    );
    link.addEventListener(
      "auxclick",
      (event) => {
        if (event.button !== 1) return;
        event.preventDefault();
        titleLink.onOpen(event);
      },
      listenerOptions,
    );
    if (titleLink.onHover) {
      const { onHover } = titleLink;
      link.addEventListener(
        "mouseover",
        (event) => {
          onHover(event, link);
        },
        listenerOptions,
      );
    }
    return link;
  }

  /** The card's last row, for its actions (Add set, Add log), at the right end */
  static footer(card: HTMLElement): HTMLElement {
    return card.createDiv({ cls: "workout-block-footer" });
  }
}
