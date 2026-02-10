/**
 * DashboardCard Molecule
 * Displays a card with an icon, title, and optional value/children
 * Used for dashboard statistics and summaries
 */

import { Icon, Text, Container } from "@app/components/atoms";

export interface DashboardCardProps {
  /** Icon name from CONSTANTS */
  icon: string;
  /** Title text */
  title: string;
  /** Main value text (optional, can use children instead) */
  value?: string;
  /** Visual variant of the card */
  variant?: "stats" | "summary";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dashboard Card Component
 * standardized card component for dashboard widgets
 */
export class DashboardCard {
  /**
   * Create a dashboard card
   * @param parent Parent element
   * @param props Card properties
   * @returns The created card element
   */
  static create(parent: HTMLElement, props: DashboardCardProps): HTMLElement {
    const { icon, title, value, variant = "summary", className = "" } = props;

    const isStats = variant === "stats";
    const baseClass = isStats ? "workout-stats-card" : "workout-summary-card";

    const card = Container.create(parent, {
      className: `${baseClass} ${className}`.trim(),
    });

    if (isStats) {
      // Stats variant: Header (Icon + Title) then content (appended by caller)
      const header = Container.create(card, {
        className: "workout-card-header",
      });

      // Icon
      Icon.create(header, {
        name: icon,
        className: "workout-card-icon",
      });

      // Title
      Text.create(header, {
        text: title,
        className: "workout-card-title",
        tag: "h4",
      });
    } else {
      // Summary variant: Icon, Value, Title
      // Icon works as a text/emoji icon here
      Container.create(card, {
        className: "workout-card-icon",
      }).setText(icon);

      // Value
      if (value) {
        Text.create(card, {
          text: value,
          className: "workout-card-value",
          tag: "div",
        });
      }

      // Title
      Text.create(card, {
        text: title,
        className: "workout-card-title",
        tag: "div",
      });
    }

    return card;
  }
}
