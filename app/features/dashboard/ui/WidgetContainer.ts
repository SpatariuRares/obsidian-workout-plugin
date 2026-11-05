/**
 * WidgetContainer - a dashboard widget's shell: a BlockCard (DESIGN.md
 * "Dashboard"), its title in the top row where WidgetActionSelect puts the
 * ⋮ menu, an optional subtitle under it.
 */

import { BlockCard } from "@app/components/molecules";
import { markTourTarget, type TourTarget } from "@app/features/tour/tourTargets";

export interface WidgetContainerProps {
  /** Widget title, in the card's top row */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Additional CSS class for the widget (e.g., "workout-stats-cards") */
  className?: string;
  /** Whether the widget spans full width */
  isWide?: boolean;
  /** `data-tour` value, so the guided tour can point at this widget */
  tourTarget?: TourTarget;
}

export class WidgetContainer {
  /**
   * Creates a dashboard widget card with title and optional subtitle
   * @param parent - Parent element to append to
   * @param props - Widget container configuration
   * @returns The widget card (children should be appended to this)
   */
  static create(
    parent: HTMLElement,
    props: WidgetContainerProps,
  ): HTMLElement {
    const classes = ["workout-dashboard-widget"];
    if (props.isWide) classes.push("widget-wide");
    if (props.className) classes.push(props.className);

    const { el: widgetEl, header } = BlockCard.create(parent, {
      title: props.title,
      className: classes.join(" "),
    });
    header.firstElementChild?.addClass("workout-widget-title");

    if (props.tourTarget) markTourTarget(widgetEl, props.tourTarget);

    if (props.subtitle) {
      widgetEl.createDiv({
        text: props.subtitle,
        cls: "workout-widget-subtitle",
      });
    }

    return widgetEl;
  }
}
