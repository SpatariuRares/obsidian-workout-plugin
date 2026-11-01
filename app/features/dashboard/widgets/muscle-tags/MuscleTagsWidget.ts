import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { CopyableBadge } from "@app/components/molecules";
import type { MuscleTagPort } from "@app/types/PluginPorts";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import {
  MUSCLE_GROUP_EMOJI,
  OTHER_MUSCLE_EMOJI,
} from "@app/constants/muscles.constants";

function getMuscleGroupEmoji(muscleGroup: string): string {
  return MUSCLE_GROUP_EMOJI[muscleGroup] ?? OTHER_MUSCLE_EMOJI;
}

/**
 * Widget that displays available muscle group tags in the plugin
 * Helps users reference valid tags when creating exercises
 */
export class MuscleTagsWidget {
  static async render(
    container: HTMLElement,
    _params: EmbeddedDashboardParams,
    plugin: MuscleTagPort,
  ): Promise<void> {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.muscleTags.title"),
      className: "workout-muscle-tags-widget",
      isWide: true,
    });

    widgetEl.createEl("p", {
      cls: "workout-widget-description",
      text: t("dashboard.muscleTags.description"),
    });

    // Create muscle tags grid
    const tagsGrid = widgetEl.createDiv({
      cls: "workout-muscle-tags-grid",
    });

    // Get tags from MuscleTagService (includes custom user tags)
    const tagMap = await plugin.getMuscleTagService().tagMap();
    const sortedTags = Array.from(tagMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    sortedTags.forEach(([tag, muscleGroup]) => {
      this.createMuscleTagBadge(tagsGrid, tag, muscleGroup);
    });

    // Add info section
    const infoEl = widgetEl.createDiv({
      cls: "workout-muscle-tags-info",
    });

    infoEl.createEl("small", {
      text: t("dashboard.muscleTags.totalCount", {
        count: sortedTags.length,
      }),
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
      icon: getMuscleGroupEmoji(muscleGroup),
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
