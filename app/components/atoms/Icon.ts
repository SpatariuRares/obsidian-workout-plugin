/**
 * Icon Atom
 * One of Obsidian's (Lucide) icons - indivisible UI primitive
 */
import { setIcon } from "obsidian";

export interface IconProps {
  /** Lucide icon id, from ICONS (`@app/constants/ui.constants`) */
  name: string;
  className?: string;
  title?: string;
}

/**
 * Creates icon elements drawn by Obsidian, so they follow the theme
 * This is an atom - it has no dependencies on other UI components
 */
export class Icon {
  /**
   * Create an icon element
   * @param parent - Parent HTML element
   * @param props - Icon properties
   * @returns The created icon element
   */
  static create(
    parent: HTMLElement,
    props: IconProps,
  ): HTMLSpanElement {
    const span = parent.createSpan({
      cls: `workout-icon ${props.className || "icon"}`,
      attr: {
        "aria-hidden": "true",
        ...(props.title && { title: props.title }),
      },
    });
    setIcon(span, props.name);
    return span;
  }
}
