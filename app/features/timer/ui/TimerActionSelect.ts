import { App } from "obsidian";

import { BlockMenu } from "@app/features/common/ui/BlockMenu";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { EmbeddedTimerParams } from "@app/features/timer/types";
import { ICONS } from "@app/constants/ui.constants";

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
  /** The note the block is written in */
  sourcePath: string;
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
    const { app, plugin, params, sourcePath } = props;

    if (!params.id) {
      return null;
    }

    return BlockMenu.render(
      container,
      [
        {
          label: t("timer.editTimer"),
          icon: ICONS.ACTIONS.EDIT,
          edits: true,
          run: () =>
            new EditTimerModal(app, plugin, params, {
              sourcePath,
            }).open(),
        },
      ],
      signal,
    );
  }
}
