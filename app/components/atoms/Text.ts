/**
 * Text Atom
 * Basic text elements (span, div, p, strong) - indivisible UI primitive
 */

export interface TextProps {
  text: string;
  className?: string;
  tag?:
    | "span"
    | "div"
    | "p"
    | "strong"
    | "em"
    | "small"
    | "label"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "h5"
    | "h6";
}

/**
 * Creates basic text elements
 * This is an atom - it has no dependencies on other UI components
 */
export class Text {
  /**
   * Create a text element
   * @param parent - Parent HTML element
   * @param props - Text properties
   * @returns The created text element
   */
  static create(parent: HTMLElement, props: TextProps): HTMLElement {
    const tag = props.tag || "span";
    return parent.createEl(tag, {
      text: props.text,
      cls: props.className,
    });
  }

  /**
   * Create a span element (shorthand)
   * @param parent - Parent HTML element
   * @param text - Text content
   * @param className - Optional CSS class
   * @returns The created span element
   */
  static createSpan(
    parent: HTMLElement,
    text: string,
    className?: string,
  ): HTMLSpanElement {
    return parent.createSpan({
      text,
      cls: className,
    });
  }

  /**
   * Create a strong element (shorthand)
   * @param parent - Parent HTML element
   * @param text - Text content
   * @param className - Optional CSS class
   * @returns The created strong element
   */
  static createStrong(
    parent: HTMLElement,
    text: string,
    className?: string,
  ): HTMLElement {
    return parent.createEl("strong", {
      text,
      cls: className,
    });
  }

  /**
   * Create a div with text (shorthand)
   * @param parent - Parent HTML element
   * @param text - Text content
   * @param className - Optional CSS class
   * @returns The created div element
   */
  static createDiv(
    parent: HTMLElement,
    text: string,
    className?: string,
  ): HTMLDivElement {
    return parent.createDiv({
      text,
      cls: className,
    });
  }
}
