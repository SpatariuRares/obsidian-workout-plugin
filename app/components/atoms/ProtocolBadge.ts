/**
 * ProtocolBadge Atom
 * Badge for displaying workout protocols with dynamic color support - indivisible UI primitive
 * Centralizes contrast color calculation for accessibility
 */

export interface ProtocolBadgeProps {
  text: string;
  color?: string;
  tooltip?: string;
  className?: string;
}

/**
 * Creates protocol badge elements with dynamic coloring
 * This is an atom - it has no dependencies on other UI components
 */
export class ProtocolBadge {
  /**
   * Create a protocol badge element
   * @param parent - Parent HTML element
   * @param props - Badge properties
   * @returns The created span element
   */
  static create(
    parent: HTMLElement,
    props: ProtocolBadgeProps,
  ): HTMLSpanElement {
    const badge = parent.createEl("span", {
      text: props.text,
      cls: props.className || "workout-protocol-badge",
    });

    if (props.tooltip) {
      badge.setAttribute("title", props.tooltip);
    }

    if (props.color) {
      const rgb = this.parseRgb(props.color);
      // Translucent colors would blend with an unknown page background, so
      // the chosen text color could fail contrast: render them opaque
      badge.style.backgroundColor = rgb
        ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
        : props.color;
      badge.style.color = this.getContrastColor(props.color);
    }

    return badge;
  }

  /**
   * Returns the text color (black or white) with the higher WCAG contrast
   * ratio against the given background. Supports hex (#ff0000, ff0000) and
   * rgb/rgba strings; alpha is ignored because badges render opaque.
   * @param color - Background color string
   * @returns "black" or "white" ("white" when the color can't be parsed)
   */
  static getContrastColor(color: string): string {
    const rgb = this.parseRgb(color);
    if (!rgb) return "white";

    const [r, g, b] = rgb.map((channel) => {
      const c = channel / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const contrastWithWhite = 1.05 / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / 0.05;
    return contrastWithBlack >= contrastWithWhite ? "black" : "white";
  }

  private static parseRgb(color: string): [number, number, number] | null {
    let channels: number[];
    if (color.startsWith("rgb")) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      channels = [match[1], match[2], match[3]].map((v) => parseInt(v, 10));
    } else {
      const hex = color.replace("#", "");
      channels = [0, 2, 4].map((i) => parseInt(hex.substring(i, i + 2), 16));
    }
    return channels.some((v) => Number.isNaN(v))
      ? null
      : [channels[0], channels[1], channels[2]];
  }
}
