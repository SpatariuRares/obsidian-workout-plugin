/**
 * The tour's data model. The engine knows nothing about workouts: content
 * (#57) supplies `Tour`s, completion conditions (#56) supply `StepCompletion`s.
 */

/** What a completion condition can do to the running step. */
export interface StepContext {
  /** The step's goal is reached: the engine moves to the next step (or ends). */
  complete(): void;
}

/**
 * Optional condition that advances a step by itself (e.g. wait for `log:added`
 * on the event bus). The engine calls `arm` when the step is shown and the
 * returned disposer when the step is left or the tour ends. Next / Back / Skip
 * stay available whatever the condition.
 */
export interface StepCompletion {
  arm(ctx: StepContext): () => void;
}

export interface TourStep {
  id: string;
  /** Value of the `data-tour` attribute to highlight. Missing or not on screen: centred card. */
  target?: string;
  /** Already translated. */
  title: string;
  /** Already translated. */
  text: string;
  /** Shown instead of `text` on mobile. */
  mobileText?: string;
  completion?: StepCompletion;
}

export interface Tour {
  id: string;
  steps: TourStep[];
}

/**
 * Why a tour ended: `finished` (Done on the last step), `skipped` (Skip),
 * `escaped` (Esc), `stopped` (`stop()` / unload), `replaced` (another tour started).
 */
export type TourEndReason =
  | "finished"
  | "skipped"
  | "escaped"
  | "stopped"
  | "replaced";

export interface TourStartOptions {
  onEnd?: (reason: TourEndReason) => void;
}
