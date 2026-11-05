import { BlockMenu } from "@app/features/common/ui/BlockMenu";
import { EditWidgetModal } from "@app/features/dashboard/modals/EditWidgetModal";
import {
  DashboardWidgetId,
  EmbeddedDashboardParams,
} from "@app/features/dashboard/types";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { ICONS } from "@app/constants/ui.constants";
import { App } from "obsidian";
import { t } from "@app/i18n";

/**
 * WidgetActionSelect - the kebab menu at the right end of a widget card's top
 * row, like the one on the dashboard itself. A widget without a top row gets
 * it in its top corner.
 */
export class WidgetActionSelect {
  static render(
    widgetEl: HTMLElement,
    app: App,
    id: DashboardWidgetId,
    params: EmbeddedDashboardParams,
    where: {
      sourcePath: string;
      /** How to find the block when it has no id, read when the menu is used */
      matchWithoutId?: () => EditTarget["matchWithoutId"];
    },
  ): HTMLElement {
    const header = widgetEl.querySelector<HTMLElement>(
      ":scope > .workout-block-header",
    );
    const menu = BlockMenu.render(header ?? widgetEl, [
      {
        label: t("dashboard.widgetModal.edit"),
        icon: ICONS.ACTIONS.EDIT,
        run: () =>
          new EditWidgetModal(app, id, params, {
            sourcePath: where.sourcePath,
            matchWithoutId: where.matchWithoutId?.(),
          }).open(),
      },
    ]);
    if (!header) menu.addClass("workout-widget-menu-corner");
    return menu;
  }
}
