import { EmbeddedDashboardParams } from "@app/types";
import { MUSCLE_TAGS, TAG_MUSCLE_MAP } from "@app/constants/MuscleTags";
import { UI_LABELS } from "@app/constants/LabelConstants";
import { UI_ICONS } from "@app/constants";

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
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.TITLE,
      cls: "workout-widget-title",
    });

    widgetEl.createEl("p", {
      cls: "workout-widget-description",
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.DESCRIPTION,
    });

    // Create muscle tags grid
    const tagsGrid = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-grid",
    });

    // Sort tags for consistent display
    const sortedTags = [...MUSCLE_TAGS].sort();

    sortedTags.forEach((tag) => {
      this.createMuscleTagBadge(tagsGrid, tag);
    });

    // Add info section
    const infoEl = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-info",
    });

    infoEl.createEl("small", {
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.TOTAL_COUNT(MUSCLE_TAGS.length),
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
    const badgeEl = container.createEl("div", {
      cls: "workout-muscle-tag-badge",
      attr: {
        "data-muscle": muscleName,
      },
    });

    // Emoji
    badgeEl.createEl("span", {
      text: this.getMuscleEmoji(muscleName),
      cls: "workout-muscle-tag-emoji",
    });

    // Name
    badgeEl.createEl("span", {
      text: this.formatMuscleName(muscleName),
      cls: "workout-muscle-tag-name",
    });

    // Add click to copy functionality
    badgeEl.addEventListener("click", () => {
      navigator.clipboard.writeText(muscleName).catch(() => {
        // Silent fail - clipboard copy failed
      });

      // Show visual feedback
      badgeEl.addClass("workout-copied");
      setTimeout(() => {
        badgeEl.removeClass("workout-copied");
      }, 1000);
    });

    // Add hover tooltip
    badgeEl.setAttribute(
      "title",
      UI_LABELS.DASHBOARD.MUSCLE_TAGS.TOOLTIP(muscleName)
    );
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
      lowerName.includes(TAG_MUSCLE_MAP.chest) ||
      lowerName.includes("petto") ||
      lowerName.includes("pettorale")
    )
      return UI_ICONS.EXERCISE.CURL;
    // Back variations
    if (
      lowerName.includes(TAG_MUSCLE_MAP.back) ||
      lowerName.includes("schiena") ||
      lowerName.includes("dorsale")
    )
      return UI_ICONS.EXERCISE.BACK;
    // Shoulders variations
    if (
      lowerName.includes(TAG_MUSCLE_MAP.shoulder) ||
      lowerName.includes("spalle") ||
      lowerName.includes("deltoidi") ||
      lowerName.includes("delts")
    )
      return UI_ICONS.EXERCISE.SHOULDERS;
    // Arms
    if (lowerName.includes(TAG_MUSCLE_MAP.biceps) || lowerName.includes("bicipiti"))
      return UI_ICONS.EXERCISE.BICEPS;
    if (lowerName.includes(TAG_MUSCLE_MAP.triceps) || lowerName.includes("tricipiti"))
      return UI_ICONS.EXERCISE.TRICEPS;
    if (lowerName.includes("forearm") || lowerName.includes("avambracci"))
      return UI_ICONS.EXERCISE.FOREARM;
    // Legs
    if (lowerName.includes("legs") || lowerName.includes("gambe")) return "🦵";
    if (lowerName.includes("quad") || lowerName.includes("quadricipiti"))
      return UI_ICONS.EXERCISE.LEGS;
    if (
      lowerName.includes("hamstring") ||
      lowerName.includes("ischiocrurali") ||
      lowerName.includes("femorali")
    )
      return UI_ICONS.EXERCISE.LEGS;
    if (lowerName.includes(TAG_MUSCLE_MAP.calves) || lowerName.includes("polpacci"))
      return UI_ICONS.EXERCISE.CALVES;
    // Glutes
    if (
      lowerName.includes("glute") ||
      lowerName.includes("abduttori") ||
      lowerName.includes("adduttori")
    )
      return UI_ICONS.EXERCISE.GLUTES;
    // Core
    if (lowerName.includes(TAG_MUSCLE_MAP.abs) || lowerName.includes("addominali"))
      return UI_ICONS.EXERCISE.CORE;
    // Cardio
    if (lowerName.includes(TAG_MUSCLE_MAP.core) || lowerName.includes("cardio"))
      return UI_ICONS.EXERCISE.CARDIO;
    // Other
    if (lowerName.includes(TAG_MUSCLE_MAP.traps) || lowerName.includes("trapezi"))
      return UI_ICONS.EXERCISE.TRAPS;
    // Exercise types
    if (lowerName.includes("push") || lowerName.includes("press")) return UI_ICONS.EXERCISE.PUSH;
    if (lowerName.includes("pull") || lowerName.includes("row")) return UI_ICONS.EXERCISE.PULL;
    if (lowerName.includes("squat")) return UI_ICONS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS;
    if (lowerName.includes("deadlift")) return UI_ICONS.EXERCISE.DEADLIFT;
    if (lowerName.includes("curl")) return UI_ICONS.EXERCISE.CURL;
    if (lowerName.includes("extension")) return UI_ICONS.EXERCISE.EXTENSION;
    if (lowerName.includes("fly")) return UI_ICONS.EXERCISE.FLY;
    if (lowerName.includes("spintaanca")) return UI_ICONS.EXERCISE.HIP_TRUST;

    return UI_ICONS.EXERCISE.DEADLIFT;
  }
}

