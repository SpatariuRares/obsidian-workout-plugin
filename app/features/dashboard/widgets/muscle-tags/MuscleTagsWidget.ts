import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { CopyableBadge } from "@app/components/molecules";
import type { MuscleTagPort } from "@app/types/PluginPorts";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import {
  MUSCLE_GROUP_EMOJI,
  OTHER_MUSCLE_EMOJI,
} from "@app/constants/muscles.constants";
import { StringUtils } from "@app/utils/StringUtils";

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
    params: EmbeddedDashboardParams,
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

    // Get tags from MuscleTagService (includes custom user tags)
    const tagMap = await plugin.getMuscleTagService().tagMap();
    const sortedTags = Array.from(tagMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );

    if (params.muscleTagsGroupByMuscle) {
      const byGroup = new Map<string, [string, string][]>();
      for (const entry of sortedTags) {
        const group = byGroup.get(entry[1]) ?? [];
        group.push(entry);
        byGroup.set(entry[1], group);
      }
      const groups = [...byGroup.keys()].sort((a, b) => a.localeCompare(b));
      // One card per muscle, side by side; its tags are cards inside it
      const cardsEl = widgetEl.createDiv({
        cls: "workout-muscle-group-cards",
      });
      for (const muscleGroup of groups) {
        const cardEl = cardsEl.createDiv({
          cls: "workout-muscle-group-card",
        });
        cardEl.createEl("h4", {
          text: `${getMuscleGroupEmoji(muscleGroup)} ${StringUtils.humanize(muscleGroup)}`,
          cls: "workout-muscle-group-title",
        });
        const tagsEl = cardEl.createDiv({
          cls: "workout-muscle-group-tags",
        });
        for (const [tag] of byGroup.get(muscleGroup) ?? []) {
          this.createMuscleTagBadge(tagsEl, tag, muscleGroup);
        }
      }
    } else {
      const tagsGrid = widgetEl.createDiv({
        cls: "workout-muscle-tags-grid",
      });
      sortedTags.forEach(([tag, muscleGroup]) => {
        this.createMuscleTagBadge(tagsGrid, tag, muscleGroup);
      });
    }

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
      text: StringUtils.humanize(tag),
      copyValue: tag,
      tooltip: t("dashboard.muscleTags.tooltip", { tag }),
      className: "workout-muscle-tag-badge",
      dataAttributes: { muscle: tag },
    });
  }
}
