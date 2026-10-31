import { Platform, Scope, type App, type EventRef } from "obsidian";
import { t } from "@app/i18n";
import type {
  Tour,
  TourEndReason,
  TourStartOptions,
  TourStep,
} from "@app/features/tour/TourStep";
import {
  isInViewport,
  placeCard,
  type Box,
} from "@app/features/tour/tourPlacement";

const FALLBACK_CARD = { width: 320, height: 160 };

interface Running {
  tour: Tour;
  index: number;
  options: TourStartOptions;
  scope: Scope;
  root: HTMLElement;
  blockers: HTMLElement[];
  ring: HTMLElement;
  card: HTMLElement;
  disposeCompletion: (() => void) | null;
  frame: number | null;
  showMe: HTMLButtonElement | null;
  workspaceRefs: EventRef[];
  lastLayout: string;
  scrolledStep: number;
}

/**
 * Spotlight tour: dims the screen, rings the `data-tour` target (clicks inside
 * the ring reach it, clicks outside are blocked) and shows a card with
 * Back / Skip / Next. One tour at a time. The target is looked up again on
 * every frame, because views re-render and replace their buttons.
 */
export class TourEngine {
  private running: Running | null = null;

  constructor(private readonly app: App) {}

  isRunning(): boolean {
    return this.running !== null;
  }

  start(tour: Tour, options: TourStartOptions = {}): void {
    if (this.running) this.end("replaced");
    if (tour.steps.length === 0) return;

    // Blockers stop clicks, not keystrokes: don't leave an editor focused.
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();

    const root = document.body.createDiv({ cls: "workout-tour" });
    const blockers = [0, 1, 2, 3].map(() =>
      root.createDiv({ cls: "workout-tour-blocker" }),
    );
    const ring = root.createDiv({ cls: "workout-tour-ring is-hidden" });
    const card = root.createDiv({ cls: "workout-tour-card" });

    const scope = new Scope(this.app.scope);
    // eslint-disable-next-line i18next/no-literal-string -- key name
    scope.register([], "Escape", () => {
      this.end("escaped");
      return false;
    });
    this.app.keymap.pushScope(scope);

    this.running = {
      tour,
      index: 0,
      options,
      scope,
      root,
      blockers,
      ring,
      card,
      disposeCompletion: null,
      frame: null,
      showMe: null,
      workspaceRefs: [],
      lastLayout: "",
      scrolledStep: -1,
    };
    this.watchNote(this.running, options.notePath);
    this.showStep();
    this.schedule();
  }

  /**
   * The tour belongs to its note: it ends when the note's leaf is closed or
   * another file becomes the active one. Leaves without a file (sidebars) are
   * ignored.
   */
  private watchNote(run: Running, notePath: string | undefined): void {
    if (!notePath) return;
    const { workspace } = this.app;
    run.workspaceRefs.push(
      workspace.on("active-leaf-change", (leaf) => {
        const file = (leaf?.view as { file?: { path: string } } | undefined)
          ?.file;
        if (file && file.path !== notePath) this.end("stopped");
      }),
      workspace.on("layout-change", () => {
        const shown = workspace
          .getLeavesOfType("markdown")
          .some(
            (leaf) =>
              (leaf.view as { file?: { path: string } }).file?.path ===
              notePath,
          );
        if (!shown) this.end("stopped");
      }),
    );
  }

  /** Ends the tour if one runs. */
  stop(): void {
    this.end("stopped");
  }

  /** Plugin unload: same as stop, nothing may stay on screen or registered. */
  destroy(): void {
    this.end("stopped");
  }

  private end(reason: TourEndReason): void {
    const run = this.running;
    if (!run) return;
    this.running = null;
    run.disposeCompletion?.();
    if (run.frame !== null) window.cancelAnimationFrame(run.frame);
    run.workspaceRefs.forEach((ref) => this.app.workspace.offref(ref));
    this.app.keymap.popScope(run.scope);
    run.root.remove();
    run.options.onEnd?.(reason);
  }

  private go(delta: number): void {
    const run = this.running;
    if (!run) return;
    const next = run.index + delta;
    if (next < 0) return;
    if (next >= run.tour.steps.length) {
      this.end("finished");
      return;
    }
    run.index = next;
    this.showStep();
  }

  private showStep(): void {
    const run = this.running;
    if (!run) return;
    const step = run.tour.steps[run.index];
    const total = run.tour.steps.length;
    const last = run.index === total - 1;

    run.disposeCompletion?.();
    run.disposeCompletion = null;
    run.lastLayout = "";

    run.card.empty();
    run.card.createDiv({ cls: "workout-tour-title", text: step.title });
    const text = Platform.isMobile ? (step.mobileText ?? step.text) : step.text;
    run.card.createDiv({ cls: "workout-tour-text", text });
    run.showMe = run.card.createEl("button", {
      cls: "workout-tour-show-me is-hidden",
      text: t("tour.showMe"),
    });
    run.showMe.addEventListener("click", () => this.scrollToTarget(step));
    const footer = run.card.createDiv({ cls: "workout-tour-footer" });
    footer.createSpan({
      cls: "workout-tour-progress",
      text: t("tour.progress", { current: run.index + 1, total }),
    });
    const back = footer.createEl("button", { text: t("tour.back") });
    back.disabled = run.index === 0;
    back.addEventListener("click", () => this.go(-1));
    const skip = footer.createEl("button", { text: t("tour.skip") });
    skip.addEventListener("click", () => this.end("skipped"));
    const next = footer.createEl("button", {
      cls: "mod-cta",
      text: last ? t("tour.done") : t("tour.next"),
    });
    next.addEventListener("click", () => this.go(1));

    if (step.completion) {
      const index = run.index;
      run.disposeCompletion = step.completion.arm({
        complete: () => {
          // Ignore a late completion of a step the user already left.
          if (this.running === run && run.index === index) this.go(1);
        },
      });
    }
    this.layout();
  }

  private schedule(): void {
    const run = this.running;
    if (!run) return;
    run.frame = window.requestAnimationFrame(() => {
      if (this.running !== run) return;
      this.layout();
      this.schedule();
    });
  }

  /** First match that is rendered: a leaf also holds a hidden copy of each block. */
  private resolveTarget(step: TourStep): HTMLElement | null {
    if (!step.target) return null;
    const matches = document.querySelectorAll<HTMLElement>("[data-tour]");
    for (const el of Array.from(matches)) {
      if (
        el.getAttribute("data-tour") === step.target &&
        el.getClientRects().length > 0
      ) {
        return el;
      }
    }
    return null;
  }

  private scrollToTarget(step: TourStep): void {
    this.resolveTarget(step)?.scrollIntoView?.({
      block: Platform.isMobile ? "start" : "center",
    });
  }

  private layout(): void {
    const run = this.running;
    if (!run) return;
    const step = run.tour.steps[run.index];
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const el = this.resolveTarget(step);

    if (el && run.scrolledStep !== run.index) {
      run.scrolledStep = run.index;
      this.scrollToTarget(step);
    }

    const rect = el?.getBoundingClientRect();
    const box: Box | null =
      rect && isInViewport(rect, viewport)
        ? {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          }
        : null;

    // Found but outside the viewport (e.g. in a long note): offer "Show me"
    const offscreen = el !== null && box === null;

    // eslint-disable-next-line i18next/no-literal-string -- cache key, not UI text
    const key = `${run.index}|${offscreen}|${box ? `${box.left},${box.top},${box.width},${box.height}` : "none"}|${viewport.width}x${viewport.height}`;
    if (key === run.lastLayout) return;
    run.lastLayout = key;

    run.showMe?.toggleClass("is-hidden", !offscreen);
    this.applyHole(run, box, viewport);
    this.applyCard(run, box, viewport);
  }

  private applyHole(
    run: Running,
    box: Box | null,
    viewport: { width: number; height: number },
  ): void {
    run.root.toggleClass("has-target", box !== null);
    run.ring.toggleClass("is-hidden", box === null);
    const rects: Box[] = box
      ? [
          { left: 0, top: 0, width: viewport.width, height: box.top },
          {
            left: 0,
            top: box.top + box.height,
            width: viewport.width,
            height: viewport.height - box.top - box.height,
          },
          { left: 0, top: box.top, width: box.left, height: box.height },
          {
            left: box.left + box.width,
            top: box.top,
            width: viewport.width - box.left - box.width,
            height: box.height,
          },
        ]
      : [{ left: 0, top: 0, width: viewport.width, height: viewport.height }];
    run.blockers.forEach((blocker, i) => {
      const r = rects[i];
      blocker.toggleClass("is-hidden", !r);
      if (!r) return;
      blocker.setCssProps({ left: `${r.left}px` });
      blocker.setCssProps({ top: `${r.top}px` });
      blocker.setCssProps({ width: `${Math.max(0, r.width)}px` });
      blocker.setCssProps({ height: `${Math.max(0, r.height)}px` });
    });
    if (box) {
      run.ring.setCssProps({ left: `${box.left}px` });
      run.ring.setCssProps({ top: `${box.top}px` });
      run.ring.setCssProps({ width: `${box.width}px` });
      run.ring.setCssProps({ height: `${box.height}px` });
    }
  }

  private applyCard(
    run: Running,
    box: Box | null,
    viewport: { width: number; height: number },
  ): void {
    const size = {
      width: run.card.offsetWidth || FALLBACK_CARD.width,
      height: run.card.offsetHeight || FALLBACK_CARD.height,
    };
    const placement = placeCard(box, size, viewport, Platform.isMobile);
    run.card.toggleClass("is-centered", placement.mode === "centered");
    run.card.toggleClass("is-docked", placement.mode === "docked");
    run.card.toggleClass(
      "is-docked-top",
      placement.mode === "docked" && placement.edge === "top",
    );
    if (placement.mode === "floating") {
      run.card.setCssProps({ left: `${placement.left}px` });
      run.card.setCssProps({ top: `${placement.top}px` });
    } else {
      run.card.setCssProps({ left: "" });
      run.card.setCssProps({ top: "" });
    }
  }
}
