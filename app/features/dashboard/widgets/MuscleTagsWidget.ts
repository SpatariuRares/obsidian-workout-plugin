import { EmbeddedDashboardParams } from "@app/types";
import { MUSCLE_TAGS } from "@app/constants/MuscleTags";
import { UI_LABELS } from "@app/constants/LabelConstants";

/**
 * Widget that displays available muscle group tags in the plugin
 * Helps users reference valid tags when creating exercises
 */
export class MuscleTagsWidget {
  static render(container: HTMLElement, _params: EmbeddedDashboardParams): void {
    const widgetEl = container.createEl("div", {
      cls: "dashboard-widget muscle-tags-widget",
    });

    widgetEl.createEl("h3", {
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.TITLE,
      cls: "widget-title",
    });

    widgetEl.createEl("p", {
      cls: "widget-description",
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.DESCRIPTION,
    });

    // Create muscle tags grid
    const tagsGrid = widgetEl.createEl("div", {
      cls: "muscle-tags-grid",
    });

    // Sort tags for consistent display
    const sortedTags = [...MUSCLE_TAGS].sort();

    sortedTags.forEach((tag) => {
      this.createMuscleTagBadge(tagsGrid, tag);
    });

    // Add info section
    const infoEl = widgetEl.createEl("div", {
      cls: "muscle-tags-info",
    });

    infoEl.createEl("small", {
      text: UI_LABELS.DASHBOARD.MUSCLE_TAGS.TOTAL_COUNT(MUSCLE_TAGS.length),
      cls: "muscle-tags-count",
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
      cls: "muscle-tag-badge",
      attr: {
        "data-muscle": muscleName,
      },
    });

    // Emoji
    badgeEl.createEl("span", {
      text: this.getMuscleEmoji(muscleName),
      cls: "muscle-tag-emoji",
    });

    // Name
    badgeEl.createEl("span", {
      text: this.formatMuscleName(muscleName),
      cls: "muscle-tag-name",
    });

    // Add click to copy functionality
    badgeEl.addEventListener("click", () => {
      navigator.clipboard.writeText(muscleName).catch(() => {
        // Silent fail - clipboard copy failed
      });

      // Show visual feedback
      badgeEl.addClass("copied");
      setTimeout(() => {
        badgeEl.removeClass("copied");
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
      lowerName.includes("chest") ||
      lowerName.includes("petto") ||
      lowerName.includes("pettorale")
    )
      return "💪";
    // Back variations
    if (
      lowerName.includes("back") ||
      lowerName.includes("schiena") ||
      lowerName.includes("dorsale")
    )
      return "🦾";
    // Shoulders variations
    if (
      lowerName.includes("shoulder") ||
      lowerName.includes("spalle") ||
      lowerName.includes("deltoidi") ||
      lowerName.includes("delts")
    )
      return "🏋️";
    // Arms
    if (lowerName.includes("biceps") || lowerName.includes("bicipiti"))
      return "💪";
    if (lowerName.includes("triceps") || lowerName.includes("tricipiti"))
      return "💪";
    if (lowerName.includes("forearm") || lowerName.includes("avambracci"))
      return "✊";
    // Legs
    if (lowerName.includes("legs") || lowerName.includes("gambe")) return "🦵";
    if (lowerName.includes("quad") || lowerName.includes("quadricipiti"))
      return "🦵";
    if (
      lowerName.includes("hamstring") ||
      lowerName.includes("ischiocrurali") ||
      lowerName.includes("femorali")
    )
      return "🦵";
    if (lowerName.includes("calves") || lowerName.includes("polpacci"))
      return "🦿";
    // Glutes
    if (
      lowerName.includes("glute") ||
      lowerName.includes("abduttori") ||
      lowerName.includes("adduttori")
    )
      return "🍑";
    // Core
    if (lowerName.includes("abs") || lowerName.includes("addominali"))
      return "🎯";
    if (lowerName.includes("core") || lowerName.includes("cardio")) return "⭐";
    // Other
    if (lowerName.includes("traps") || lowerName.includes("trapezi"))
      return "🔺";
    // Exercise types
    if (lowerName.includes("push") || lowerName.includes("press")) return "🔼";
    if (lowerName.includes("pull") || lowerName.includes("row")) return "⬇️";
    if (lowerName.includes("squat")) return "🏋️";
    if (lowerName.includes("deadlift")) return "💀";
    if (lowerName.includes("curl")) return "💪";
    if (lowerName.includes("extension")) return "📏";
    if (lowerName.includes("fly")) return "🦅";
    if (lowerName.includes("spintaanca")) return "🍑";

    return "💪"; // Default
  }
}

