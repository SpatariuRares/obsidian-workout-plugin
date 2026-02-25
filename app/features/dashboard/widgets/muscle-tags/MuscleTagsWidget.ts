import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { CopyableBadge } from "@app/components/molecules";
import type WorkoutChartsPlugin from "main";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

const MUSCLE_GROUP_EMOJI: Record<string, string> = {
  chest: t("icons.exercise.chest"),
  back: t("icons.exercise.back"),
  shoulders: t("icons.exercise.shoulders"),
  biceps: t("icons.exercise.biceps"),
  triceps: t("icons.exercise.triceps"),
  forearms: t("icons.exercise.forearms"),
  quads: t("icons.exercise.quads"),
  hamstrings: t("icons.exercise.hamstrings"),
  glutes: t("icons.exercise.glutes"),
  calves: t("icons.exercise.calves"),
  abs: t("icons.exercise.abs"),
  core: t("icons.exercise.core"),
  traps: t("icons.exercise.traps"),
  rear_delts: t("icons.exercise.rear_delts"),
};

const DEFAULT_EMOJI = t("icons.exercise.deadlift");

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
      text: t("dashboard.muscleTags.totalCount", { count: sortedTags.length }),
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
      tooltip: t("dashboard.muscleTags.tooltip", { tag }),
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
