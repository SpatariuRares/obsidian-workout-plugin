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
    meter.createDiv({ cls: "workout-progress-meter-fill" });
    ProgressMeter.update(meter, value);
    return meter;
  }

  /** Moves an existing meter to `value` (of its own max), keeping the done look in step */
  static update(meter: HTMLElement, value: number): void {
    const max = Number(meter.getAttribute("aria-valuemax")) || 0;
    const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
    meter.setAttribute("aria-valuenow", String(Math.min(value, max)));
    meter.classList.toggle("is-done", ratio >= 1);
    const fill = meter.querySelector<HTMLElement>(".workout-progress-meter-fill");
    if (fill) DomUtils.setCssProps(fill, { "--workout-progress-value": `${ratio * 100}%` });
  }
}
