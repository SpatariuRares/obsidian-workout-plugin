/**
 * LiveRegion Atom
 * Tells a screen reader what changed ("2/4 sets") without moving focus.
 * Create it once and keep it out of what the parent redraws: a region that
 * is drawn again with its text already in it is not read.
 */

export interface LiveRegionResult {
  el: HTMLElement;
  /** Says `text` once; the same text again is said again */
  announce: (text: string) => void;
}

export class LiveRegion {
  static create(parent: HTMLElement): LiveRegionResult {
    const el = parent.createDiv({
      cls: "workout-visually-hidden",
      attr: { role: "status", "aria-live": "polite", "aria-atomic": "true" },
    });
    let timer: number | undefined;
    return {
      el,
      announce: (text) => {
        // Emptied first and filled on the next tick, so a repeat is a change
        el.textContent = "";
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          el.textContent = text;
        }, 50);
      },
    };
  }
}
