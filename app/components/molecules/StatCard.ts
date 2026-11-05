/**
 * StatCard Molecule
 * One figure of a summary (DESIGN.md "StatCard"): its label above (label
 * type, muted), the figure (figure type, tabular numerals) and an optional
 * detail under it (when it happened, what it is compared with).
 * Combines: Icon + Text + Container atoms
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface StatCardProps {
  label: string;
  value: string | number;
  /** Muted line under the figure ("05/11/2026", "last 3") */
  detail?: string;
  /** Lucide icon before the label */
  icon?: string;
  className?: string;
}

/**
 * Used in: the stats row of `workout-chart`, the breakdown of `workout-duration`
 *
 * @example
 * ```typescript
 * StatCard.create(row, { label: "Max", value: "820 kg", detail: "05/11/2026" });
 * ```
 */
export class StatCard {
  /**
   * The row StatCards sit in: a grid on the card under a subtle border
   * @param className - The block's own class for the row
   */
  static row(parent: HTMLElement, className?: string): HTMLElement {
    const row = parent.createDiv({ cls: "stat-card-row" });
    if (className) row.addClass(className);
    return row;
  }

  static create(
    parent: HTMLElement,
    props: StatCardProps,
  ): HTMLElement {
    const card = Container.create(parent, {
      className: `stat-card ${props.className || ""}`.trim(),
    });

    const label = Text.create(card, {
      text: props.label,
      className: "stat-card-label",
      tag: "span",
    });
    if (props.icon) {
      label.prepend(Icon.create(card, { name: props.icon, className: "stat-card-icon" }));
    }

    Text.create(card, {
      text: String(props.value),
      className: "stat-card-value",
      tag: "div",
    });

    if (props.detail) {
      Text.create(card, {
        text: props.detail,
        className: "stat-card-detail",
        tag: "span",
      });
    }

    return card;
  }
}
