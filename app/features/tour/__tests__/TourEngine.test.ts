/** @jest-environment jsdom */
import { App, Scope, withHelpers } from "obsidian";
import { TourEngine } from "@app/features/tour/TourEngine";
import type { Tour } from "@app/features/tour/TourStep";
import { t } from "@app/i18n";

const tour: Tour = {
  id: "t",
  steps: [
    { id: "a", target: "add-button", title: "Add", text: "Press plus" },
    { id: "b", title: "Middle", text: "Desktop text", mobileText: "Mobile text" },
    { id: "c", target: "missing", title: "Last", text: "Bye" },
  ],
};

let frames: FrameRequestCallback[] = [];
const runFrame = () => {
  const queued = frames;
  frames = [];
  queued.forEach((cb) => cb(0));
};

function addTarget(
  id: string,
  rect = { left: 100, top: 100, width: 40, height: 20 },
) {
  const el = withHelpers(document.body).createDiv();
  el.setAttribute("data-tour", id);
  el.getClientRects = () => [{}] as unknown as DOMRectList;
  el.getBoundingClientRect = () =>
    ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
    }) as DOMRect;
  return el;
}

const root = () => document.body.querySelector<HTMLElement>(".workout-tour");
const card = () =>
  root()?.querySelector<HTMLElement>(".workout-tour-card") ?? null;
const ring = () =>
  root()!.querySelector<HTMLElement>(".workout-tour-ring")!;
const button = (label: string) =>
  [...(card()?.querySelectorAll("button") ?? [])].find(
    (b) => b.textContent === label,
  ) as HTMLButtonElement;

describe("TourEngine", () => {
  let app: App;
  let engine: TourEngine;

  beforeEach(() => {
    withHelpers(document.body).empty();
    document.body.className = "";
    frames = [];
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      frames.push(cb);
      return frames.length;
    });
    jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation(() => undefined);
    app = new App();
    engine = new TourEngine(app as never);
  });

  afterEach(() => {
    engine.destroy();
    jest.restoreAllMocks();
  });

  it("shows the first step with its progress and no Back", () => {
    addTarget("add-button");
    engine.start(tour);
    expect(card()?.textContent).toContain("Press plus");
    expect(card()?.textContent).toContain(
      t("tour.progress", { current: 1, total: 3 }),
    );
    expect(button(t("tour.back")).disabled).toBe(true);
  });

  it("moves with Next and Back, and Done on the last step ends the tour", () => {
    const onEnd = jest.fn();
    engine.start(tour, { onEnd });
    button(t("tour.next")).click();
    expect(card()?.textContent).toContain("Desktop text");
    button(t("tour.back")).click();
    expect(card()?.textContent).toContain("Press plus");
    button(t("tour.next")).click();
    button(t("tour.next")).click();
    expect(card()?.textContent).toContain("Bye");
    button(t("tour.done")).click();
    expect(root()).toBeNull();
    expect(onEnd).toHaveBeenCalledWith("finished");
  });

  it("Skip ends the tour", () => {
    const onEnd = jest.fn();
    engine.start(tour, { onEnd });
    button(t("tour.skip")).click();
    expect(root()).toBeNull();
    expect(onEnd).toHaveBeenCalledWith("skipped");
  });

  it("Esc, through a pushed scope, ends the tour and pops the scope", () => {
    const onEnd = jest.fn();
    engine.start(tour, { onEnd });
    const pushed = (app.keymap.pushScope as jest.Mock).mock
      .calls[0][0] as Scope;
    const esc = pushed.keys.find((k) => k.key === "Escape");
    expect(esc?.func(new KeyboardEvent("keydown"), {})).toBe(false);
    expect(root()).toBeNull();
    expect(app.keymap.popScope).toHaveBeenCalledWith(pushed);
    expect(onEnd).toHaveBeenCalledWith("escaped");
  });

  it("shows a centred card without a ring when the target is missing", () => {
    engine.start({ id: "x", steps: [tour.steps[2]] });
    runFrame();
    expect(card()?.classList.contains("is-centered")).toBe(true);
    expect(ring().classList.contains("is-hidden")).toBe(true);
  });

  it("puts the ring on the target and follows a target that is replaced", () => {
    const first = addTarget("add-button", {
      left: 10,
      top: 20,
      width: 30,
      height: 40,
    });
    engine.start(tour);
    runFrame();
    expect(ring().classList.contains("is-hidden")).toBe(false);
    expect(ring().style.top).toBe("20px");
    first.remove();
    addTarget("add-button", { left: 10, top: 300, width: 30, height: 40 });
    runFrame();
    expect(ring().style.top).toBe("300px");
  });

  it("ignores hidden copies of the target (no client rects)", () => {
    const hidden = withHelpers(document.body).createDiv();
    hidden.setAttribute("data-tour", "add-button");
    addTarget("add-button", { left: 5, top: 7, width: 10, height: 10 });
    engine.start(tour);
    runFrame();
    expect(ring().style.top).toBe("7px");
  });

  it("uses the mobile text on mobile", () => {
    document.body.classList.add("is-mobile");
    engine.start(tour);
    button(t("tour.next")).click();
    expect(card()?.textContent).toContain("Mobile text");
  });

  it("arms a step's completion and advances when it completes", () => {
    const dispose = jest.fn();
    let complete: () => void = () => undefined;
    const withHook: Tour = {
      id: "h",
      steps: [
        {
          id: "a",
          title: "A",
          text: "first",
          completion: {
            arm: (ctx) => {
              complete = ctx.complete;
              return dispose;
            },
          },
        },
        { id: "b", title: "B", text: "second" },
      ],
    };
    engine.start(withHook);
    complete();
    expect(card()?.textContent).toContain("second");
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes the armed completion when the tour stops", () => {
    const dispose = jest.fn();
    engine.start({
      id: "h",
      steps: [
        { id: "a", title: "A", text: "x", completion: { arm: () => dispose } },
      ],
    });
    engine.stop();
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("runs one tour at a time", () => {
    const onEnd = jest.fn();
    engine.start(tour, { onEnd });
    engine.start({
      id: "other",
      steps: [{ id: "z", title: "Z", text: "other" }],
    });
    expect(onEnd).toHaveBeenCalledWith("replaced");
    expect(document.body.querySelectorAll(".workout-tour")).toHaveLength(1);
    expect(card()?.textContent).toContain("other");
  });

  it("destroy (plugin unload) removes the overlay, scope and frame loop", () => {
    engine.start(tour);
    engine.destroy();
    expect(root()).toBeNull();
    expect(engine.isRunning()).toBe(false);
    expect(app.keymap.popScope).toHaveBeenCalled();
    expect(() => runFrame()).not.toThrow();
    expect(root()).toBeNull();
  });

  it("blurs the focused editor when starting", () => {
    const input = withHelpers(document.body).createEl("input");
    input.focus();
    expect(document.activeElement).toBe(input);
    engine.start(tour);
    expect(document.activeElement).not.toBe(input);
  });
});
