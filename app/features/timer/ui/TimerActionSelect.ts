import { App } from "obsidian";

import { IconDropdown } from "@app/components/molecules/IconDropdown";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { EmbeddedTimerParams } from "@app/features/timer/types";

/**
 * TimerActionSelect - Icon button dropdown for timer-level actions
 *
 * Renders an icon-only button that opens a custom dropdown panel.
 * Only rendered when the code block has an ID.
 */
export interface TimerActionSelectProps {
  app: App;
  plugin: WorkoutPluginContext;
  params: EmbeddedTimerParams;
}

export class TimerActionSelect {
  /**
   * Renders an icon button with a dropdown action panel.
   * Returns null if the code block has no ID (not editable).
   */
  static render(
    container: HTMLElement,
    props: TimerActionSelectProps,
    signal?: AbortSignal,
  ): HTMLElement | null {
    const { app, plugin, params } = props;

    if (!params.id) {
      return null;
    }

    const { wrapper } = IconDropdown.create(container, {
      icon: t("icons.timer.menu"),
      ariaLabel: t("table.actions"),
      options: [
        {
          label: t("timer.editTimer"),
          value: "edit",
          icon: t("icons.tables.edit"),
        },
      ],
    });

    IconDropdown.onChange(
      wrapper,
      (value) => {
        if (value === "edit") {
          const modal = new EditTimerModal(
            app,
            plugin,
            params,
          );
          modal.open();
        }
      },
      signal,
    );

    return wrapper;
  }
}
