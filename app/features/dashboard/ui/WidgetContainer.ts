/**
 * WidgetContainer - Creates a standardized dashboard widget shell
 *
 * Encapsulates the repeated pattern of:
 *   <div class="workout-dashboard-widget [widget-wide] [className]">
 *     <h3 class="workout-widget-title">Title</h3>
 *     [<div class="workout-widget-subtitle">Subtitle</div>]
 *   </div>
 */

export interface WidgetContainerProps {
  /** Widget title displayed as h3 */
  title: string;
  /** Optional subtitle displayed below the title */
  subtitle?: string;
  /** Additional CSS class for the widget (e.g., "workout-stats-cards") */
  className?: string;
  /** Whether the widget spans full width */
  isWide?: boolean;
}

export class WidgetContainer {
  /**
   * Creates a dashboard widget container with title and optional subtitle
   * @param parent - Parent element to append to
   * @param props - Widget container configuration
   * @returns The widget container element (children should be appended to this)
   */
  static create(parent: HTMLElement, props: WidgetContainerProps): HTMLElement {
    const classes = ["workout-dashboard-widget"];
    if (props.isWide) classes.push("widget-wide");
    if (props.className) classes.push(props.className);

    const widgetEl = parent.createEl("div", {
      cls: classes.join(" "),
    });

    widgetEl.createEl("h3", {
      text: props.title,
      cls: "workout-widget-title",
    });

    if (props.subtitle) {
      widgetEl.createEl("div", {
        text: props.subtitle,
        cls: "workout-widget-subtitle",
      });
    }

    return widgetEl;
  }
}
