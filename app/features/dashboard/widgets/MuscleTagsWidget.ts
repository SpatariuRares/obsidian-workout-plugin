import { CONSTANTS } from "@app/constants";
import { EmbeddedDashboardParams } from "@app/types";
import { CopyableBadge } from "@app/components/molecules";

/**
 * Widget that displays available muscle group tags in the plugin
 * Helps users reference valid tags when creating exercises
 */
export class MuscleTagsWidget {
  static render(container: HTMLElement, _params: EmbeddedDashboardParams): void {
    const widgetEl = container.createEl("div", {
      cls: "workout-dashboard-widget workout-muscle-tags-widget",
    });

    widgetEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.TITLE,
      cls: "workout-widget-title",
    });

    widgetEl.createEl("p", {
      cls: "workout-widget-description",
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.DESCRIPTION,
    });

    // Create muscle tags grid
    const tagsGrid = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-grid",
    });

    // Sort tags for consistent display
    const sortedTags = [...CONSTANTS.WORKOUT.MUSCLES.TAGS].sort();

    sortedTags.forEach((tag) => {
      this.createMuscleTagBadge(tagsGrid, tag);
    });

    // Add info section
    const infoEl = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-info",
    });

    infoEl.createEl("small", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.TOTAL_COUNT(sortedTags.length),
      cls: "workout-muscle-tags-count",
    });
  }

  /**
   * Creates a single muscle tag badge
   */
  private static createMuscleTagBadge(
    container: HTMLElement,
    muscleName: string
  ): void {
    CopyableBadge.create(container, {
      icon: this.getMuscleEmoji(muscleName),
      text: this.formatMuscleName(muscleName),
      copyValue: muscleName,
      tooltip: CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.TOOLTIP(muscleName),
      className: "workout-muscle-tag-badge",
      dataAttributes: { muscle: muscleName },
    });
  }

  /**
   * Format muscle name for display (capitalize first letter)
   */
  private static formatMuscleName(name: string): string {
    // Convert snake_case to space-separated words
    const words = name.replace(/_/g, " ").split(" ");
    return words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Get emoji for muscle group
   */
  private static getMuscleEmoji(muscleName: string): string {
    const lowerName = muscleName.toLowerCase();

    // Chest variations
    if (
      lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.chest) ||
      lowerName.includes("petto") ||
      lowerName.includes("pettorale")
    )
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.CURL;
    // Back variations
    if (
      lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.back) ||
      lowerName.includes("schiena") ||
      lowerName.includes("dorsale")
    )
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.BACK;
    // Shoulders variations
    if (
      lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.shoulder) ||
      lowerName.includes("spalle") ||
      lowerName.includes("deltoidi") ||
      lowerName.includes("delts")
    )
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.SHOULDERS;
    // Arms
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.biceps) || lowerName.includes("bicipiti"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.BICEPS;
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.triceps) || lowerName.includes("tricipiti"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.TRICEPS;
    if (lowerName.includes("forearm") || lowerName.includes("avambracci"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.FOREARM;
    // Legs
    if (lowerName.includes("legs") || lowerName.includes("gambe")) return "🦵";
    if (lowerName.includes("quad") || lowerName.includes("quadricipiti"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.LEGS;
    if (
      lowerName.includes("hamstring") ||
      lowerName.includes("ischiocrurali") ||
      lowerName.includes("femorali")
    )
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.LEGS;
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.calves) || lowerName.includes("polpacci"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.CALVES;
    // Glutes
    if (
      lowerName.includes("glute") ||
      lowerName.includes("abduttori") ||
      lowerName.includes("adduttori")
    )
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.GLUTES;
    // Core
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.abs) || lowerName.includes("addominali"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.CORE;
    // Cardio
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.core) || lowerName.includes("cardio"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.CARDIO;
    // Other
    if (lowerName.includes(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP.traps) || lowerName.includes("trapezi"))
      return CONSTANTS.WORKOUT.ICONS.EXERCISE.TRAPS;
    // Exercise types
    if (lowerName.includes("push") || lowerName.includes("press")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.PUSH;
    if (lowerName.includes("pull") || lowerName.includes("row")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.PULL;
    if (lowerName.includes("squat")) return CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS;
    if (lowerName.includes("deadlift")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.DEADLIFT;
    if (lowerName.includes("curl")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.CURL;
    if (lowerName.includes("extension")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.EXTENSION;
    if (lowerName.includes("fly")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.FLY;
    if (lowerName.includes("spintaanca")) return CONSTANTS.WORKOUT.ICONS.EXERCISE.HIP_TRUST;

    return CONSTANTS.WORKOUT.ICONS.EXERCISE.DEADLIFT;
  }
}

