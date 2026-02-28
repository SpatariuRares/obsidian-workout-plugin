import { App } from "obsidian";

import { SelectDropdown } from "@app/components/molecules/SelectDropdown";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { EmbeddedTimerParams } from "@app/features/timer/types";

/**
 * TimerActionSelect - Dropdown select for timer-level actions
 *
 * Offers an "Edit timer" action for embedded timers.
 * Only rendered when the code block has an ID.
 */
export interface TimerActionSelectProps {
  app: App;
  plugin: WorkoutChartsPlugin;
  params: EmbeddedTimerParams;
}

export class TimerActionSelect {
  /**
   * Renders an action select dropdown with the edit option.
   * Returns null if the code block has no ID (not editable).
   */
  static render(
    container: HTMLElement,
    props: TimerActionSelectProps,
    signal?: AbortSignal,
  ): HTMLSelectElement | null {
    const { app, plugin, params } = props;

    if (!params.id) {
      return null;
    }

    const { select } = SelectDropdown.create(container, {
      placeholder: `${t("icons.tables.edit")} ${t("table.actions")}`,
      ariaLabel: t("table.actions"),
      options: [
        {
          label: `${t("icons.tables.edit")} ${t("timer.editTimer")}`,
          value: "edit",
        },
      ],
    });

    SelectDropdown.onChange(
      select,
      (value) => {
        if (value === "edit") {
          const modal = new EditTimerModal(app, plugin, params);
          modal.open();
        }
      },
      signal,
    );

    return select;
  }
}
