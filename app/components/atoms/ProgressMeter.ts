/**
 * ProgressMeter Atom
 * A thin bar for how far something is from done (reps toward a target,
 * sets of a session). Neutral while on the way, accent fill once done:
 * the accent means "done", never how far behind.
 */
import { DomUtils } from "@app/utils/DomUtils";

export interface ProgressMeterProps {
  value: number;
  max: number;
  /** What the bar measures, as the screen reader says it ("7 of 8 reps") */
  label: string;
  className?: string;
}

export class ProgressMeter {
  static create(parent: HTMLElement, props: ProgressMeterProps): HTMLElement {
    const { value, max, label } = props;
    const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    const meter = parent.createDiv({
      cls: ["workout-progress-meter", props.className ?? ""].join(" ").trim(),
      attr: {
        role: "progressbar",
        "aria-label": label,
        "aria-valuemin": "0",
        "aria-valuemax": String(max),
        "aria-valuenow": String(Math.min(value, max)),
      },
    });
    if (ratio >= 1) meter.addClass("is-done");
    const fill = meter.createDiv({ cls: "workout-progress-meter-fill" });
    DomUtils.setCssProps(fill, { "--workout-progress-value": `${ratio * 100}%` });
    return meter;
  }
}
