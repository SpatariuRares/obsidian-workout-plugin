import { WorkoutDataChangedEvent } from "@app/types/WorkoutEvents";
import type WorkoutChartsPlugin from "main";
import { MarkdownRenderChild } from "obsidian";

/**
 * RenderChild that listens to "workout-planner:data-changed" events
 * and selectively refreshes tables/charts based on exercise/workout matching.
 *
 * For views with no filter params (e.g. dashboards), pass `{}` as params
 * so that `shouldRefresh` always returns true.
 */
export class DataAwareRenderChild extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private plugin: WorkoutChartsPlugin,
    private params: Record<string, unknown>,
    private refreshFn: (evt?: WorkoutDataChangedEvent) => Promise<void>,
  ) {
    super(containerEl);
  }

  onload() {
    this.registerEvent(
      this.plugin.app.workspace.on(
        "workout-planner:data-changed",
        (evt: WorkoutDataChangedEvent) => {
          const should = this.shouldRefresh(evt);
          if (should) {
            void this.refreshFn(evt);
          }
        },
      ),
    );
  }

  private shouldRefresh(evt: WorkoutDataChangedEvent): boolean {
    // No context = refresh everything (global refresh)
    if (!evt.exercise && !evt.workout) return true;

    const viewExercise = this.params.exercise as string | undefined;
    const viewWorkout = this.params.workout as string | undefined;
    const exactMatch = this.params.exactMatch as boolean | undefined;

    // No filter params on the view = show everything = always refresh
    if (!viewExercise && !viewWorkout) return true;

    // Match by exercise
    if (evt.exercise && viewExercise) {
      if (exactMatch) {
        if (evt.exercise.toLowerCase() !== viewExercise.toLowerCase())
          return false;
      } else {
        const evtLower = evt.exercise.toLowerCase();
        const viewLower = viewExercise.toLowerCase();
        if (!evtLower.includes(viewLower) && !viewLower.includes(evtLower))
          return false;
      }
    }

    // Match by workout
    if (evt.workout && viewWorkout) {
      const evtLower = evt.workout.toLowerCase();
      const viewLower = viewWorkout.toLowerCase();
      if (!evtLower.includes(viewLower) && !viewLower.includes(evtLower))
        return false;
    }

    return true;
  }
}
