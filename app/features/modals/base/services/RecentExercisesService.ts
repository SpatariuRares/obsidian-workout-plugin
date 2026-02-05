import type WorkoutChartsPlugin from "main";

const MAX_RECENT_EXERCISES = 10;
const DEFAULT_DISPLAY_RECENT_COUNT = 5;

/**
 * Tracks recent exercises used in log forms.
 * Shared by create/edit flows for mobile-friendly quick selection.
 */
export class RecentExercisesService {
  constructor(private plugin: WorkoutChartsPlugin) {}

  /**
   * Returns recent exercises for chip display.
   */
  getDisplayRecentExercises(limit = DEFAULT_DISPLAY_RECENT_COUNT): string[] {
    const recentExercises = this.plugin.settings.recentExercises || [];
    return recentExercises.slice(0, limit);
  }

  /**
   * Updates recent exercises list after a successful log submit.
   */
  async trackExercise(exercise: string): Promise<void> {
    const normalizedExercise = exercise.trim();
    if (!normalizedExercise) return;

    const currentRecent = this.plugin.settings.recentExercises || [];
    const alreadyFirst =
      currentRecent[0]?.toLowerCase() === normalizedExercise.toLowerCase();
    if (alreadyFirst) return;

    const filteredRecent = currentRecent.filter(
      (item) => item.toLowerCase() !== normalizedExercise.toLowerCase(),
    );

    this.plugin.settings.recentExercises = [
      normalizedExercise,
      ...filteredRecent,
    ].slice(0, MAX_RECENT_EXERCISES);

    await this.plugin.saveSettings();
  }
}
