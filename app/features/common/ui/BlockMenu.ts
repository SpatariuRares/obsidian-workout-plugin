import { IconDropdown } from "@app/components/molecules/IconDropdown";
import { t } from "@app/i18n";
import { ICONS } from "@app/constants/ui.constants";

/** On a menu that can edit the block: the block draws no second one */
export const BLOCK_MENU_CLASS = "workout-block-menu";

export interface BlockMenuAction {
  label: string;
  icon: string;
  run: () => void;
  /** The action opens the block's edit modal */
  edits?: boolean;
}

/**
 * BlockMenu - the kebab menu of an embedded block. Chart, log, timer and
 * dashboard build their actions and leave the dropdown to this.
 */
export class BlockMenu {
  static render(
    container: HTMLElement,
    actions: BlockMenuAction[],
    signal?: AbortSignal,
  ): HTMLElement {
    const { wrapper } = IconDropdown.create(container, {
      icon: ICONS.ACTIONS.MENU,
      ariaLabel: t("table.actions"),
      options: actions.map(({ label, icon }, i) => ({
        label,
        icon,
        value: String(i),
      })),
      className: actions.some((a) => a.edits)
        ? BLOCK_MENU_CLASS
        : undefined,
    });
    IconDropdown.onChange(
      wrapper,
      (value) => actions[Number(value)]?.run(),
      signal,
    );
    return wrapper;
  }
}
