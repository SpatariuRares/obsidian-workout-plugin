import { App } from "obsidian";

import { IconDropdown } from "@app/components/molecules/IconDropdown";
import { t } from "@app/i18n";
import { EditDashboardModal } from "@app/features/dashboard/modals/EditDashboardModal";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import type { CodeBlockMatch } from "@app/services/editor/CodeBlockEditorService";
import { ICONS } from "@app/constants/ui.constants";

/**
 * DashboardActionSelect - the kebab menu at the top of a dashboard.
 * The edit modal finds the block by its id or, for a block written without
 * one, by its body.
 */
export class DashboardActionSelect {
  static render(
    container: HTMLElement,
    app: App,
    params: EmbeddedDashboardParams,
    where: {
      /** The note the block is written in */
      sourcePath: string;
      /** How to find the block when it has no id */
      matchWithoutId?: () => CodeBlockMatch;
      /** The dashboard's width in the note, read when the menu is used */
      noteWidth: () => number;
    },
  ): HTMLElement {
    const { wrapper } = IconDropdown.create(container, {
      icon: ICONS.ACTIONS.MENU,
      ariaLabel: t("table.actions"),
      options: [
        {
          label: t("dashboard.editDashboard"),
          value: "edit",
          icon: ICONS.ACTIONS.EDIT,
        },
      ],
    });

    IconDropdown.onChange(wrapper, (value) => {
      if (value === "edit") {
        new EditDashboardModal(app, params, {
          sourcePath: where.sourcePath,
          matchWithoutId: where.matchWithoutId?.(),
          noteWidth: where.noteWidth() || undefined,
        }).open();
      }
    });

    return wrapper;
  }
}
