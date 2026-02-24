import { CONSTANTS } from "@app/constants";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { CopyableBadge } from "@app/components/molecules";
import type WorkoutChartsPlugin from "main";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

const ICONS = CONSTANTS.WORKOUT.ICONS.EXERCISE;

const MUSCLE_GROUP_EMOJI: Record<string, string> = {
  chest: ICONS.CURL,
  back: ICONS.BACK,
  shoulders: ICONS.SHOULDERS,
  biceps: ICONS.BICEPS,
  triceps: ICONS.TRICEPS,
  forearms: ICONS.FOREARM,
  quads: ICONS.LEGS,
  hamstrings: ICONS.LEGS,
  glutes: ICONS.GLUTES,
  calves: ICONS.CALVES,
  abs: ICONS.CORE,
  core: ICONS.CARDIO,
  traps: ICONS.TRAPS,
  rear_delts: ICONS.SHOULDERS,
};

const DEFAULT_EMOJI = ICONS.DEADLIFT;

/**
 * Widget that displays available muscle group tags in the plugin
 * Helps users reference valid tags when creating exercises
 */
export class MuscleTagsWidget {
  static render(
    container: HTMLElement,
    _params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin,
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.title"),
      className: "workout-muscle-tags-widget",
      isWide: true,
    });

    widgetEl.createEl("p", {
      cls: "workout-widget-description",
      text: t("dashboard.description"),
    });

    // Create muscle tags grid
    const tagsGrid = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-grid",
    });

    // Get tags from MuscleTagService (includes custom user tags)
    const tagMap = plugin.getMuscleTagService().getTagMap();
    const sortedTags = Array.from(tagMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    sortedTags.forEach(([tag, muscleGroup]) => {
      this.createMuscleTagBadge(tagsGrid, tag, muscleGroup);
    });

    // Add info section
    const infoEl = widgetEl.createEl("div", {
      cls: "workout-muscle-tags-info",
    });

    infoEl.createEl("small", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.TOTAL_COUNT(
        sortedTags.length,
      ),
      cls: "workout-muscle-tags-count",
    });
  }

  /**
   * Creates a single muscle tag badge
   */
  private static createMuscleTagBadge(
    container: HTMLElement,
    tag: string,
    muscleGroup: string,
  ): void {
    CopyableBadge.create(container, {
      icon: MUSCLE_GROUP_EMOJI[muscleGroup] ?? DEFAULT_EMOJI,
      text: this.formatMuscleName(tag),
      copyValue: tag,
      tooltip:
        CONSTANTS.WORKOUT.LABELS.DASHBOARD.MUSCLE_TAGS.TOOLTIP(tag),
      className: "workout-muscle-tag-badge",
      dataAttributes: { muscle: tag },
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
}
