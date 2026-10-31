import { Setting } from "obsidian";
import { t } from "@app/i18n";
import type {
  ActionRowDefinition,
  DefinitionItem,
  GroupDefinition,
  ListDefinition,
  PageDefinition,
  RenderRowDefinition,
  RowDefinition,
} from "@app/features/settings/settingDefinitionTypes";

/**
 * Draws setting definitions with the classic `Setting` API.
 *
 * Obsidian 1.13+ draws `getSettingDefinitions()` itself (and indexes it for
 * search) and never calls `display()`. Older versions only call `display()`,
 * which uses this to draw the very same definitions, so the rows exist in
 * one place only.
 *
 * Only the shapes in `settingDefinitionTypes` are supported: groups, lists,
 * pages and rows with `render` or `action`.
 */
export function renderSettingDefinitions(
  containerEl: HTMLElement,
  items: DefinitionItem[],
): void {
  for (const item of items) renderItem(containerEl, item);
}

function isShown(
  visible: boolean | (() => boolean) | undefined,
): boolean {
  return typeof visible === "function"
    ? visible()
    : (visible ?? true);
}

function isPage(item: DefinitionItem): item is PageDefinition {
  return "type" in item && item.type === "page";
}

function isGroup(
  item: DefinitionItem,
): item is GroupDefinition | ListDefinition {
  return (
    "type" in item && (item.type === "group" || item.type === "list")
  );
}

function renderItem(
  containerEl: HTMLElement,
  item: DefinitionItem,
): void {
  if (!isShown(item.visible)) return;
  if (isPage(item)) {
    renderPage(containerEl, item);
  } else if (isGroup(item)) {
    renderGroup(containerEl, item);
  } else {
    renderRow(containerEl, item);
  }
}

function renderPage(
  containerEl: HTMLElement,
  page: PageDefinition,
): void {
  // Before 1.13 there are no sub-pages: a collapsible section stands in
  const details = containerEl.createEl("details", {
    cls: "workout-advanced-section",
  });
  details.createEl("summary", {
    cls: "workout-advanced-section__toggle",
    text: page.name,
  });
  renderSettingDefinitions(details, page.items);
}

function renderGroup(
  containerEl: HTMLElement,
  group: GroupDefinition | ListDefinition,
): void {
  if (group.heading) {
    new Setting(containerEl).setName(group.heading).setHeading();
  }

  const list = group.type === "list" ? group : null;
  const shown = group.items.filter((item) => isShown(item.visible));

  if (list?.emptyState && shown.length === 0) {
    containerEl.createEl("p", {
      text: list.emptyState,
      cls: "workout-setting-item-description",
    });
  }

  shown.forEach((item, index) => {
    const setting = renderRow(containerEl, item, index);
    const onDelete = list?.onDelete;
    if (onDelete) {
      setting.addButton((button) =>
        button
          .setIcon("trash")
          .setTooltip(t("settings.tooltips.deleteItem"))
          .onClick(() => onDelete(index)),
      );
    }
  });

  const addItem = list?.addItem;
  if (addItem) {
    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText(addItem.name)
        .setCta()
        .onClick(() => addItem.action(button.buttonEl)),
    );
  }
}

function isRender(row: RowDefinition): row is RenderRowDefinition {
  return "render" in row;
}

function isAction(row: RowDefinition): row is ActionRowDefinition {
  return "action" in row;
}

function renderRow(
  containerEl: HTMLElement,
  row: RowDefinition,
  index = 0,
): Setting {
  const setting = new Setting(containerEl).setName(row.name);
  if (row.desc) setting.setDesc(row.desc);

  if (isRender(row)) {
    row.render(setting);
  } else if (isAction(row)) {
    const { action } = row;
    setting.addButton((button) =>
      button
        .setIcon("pencil")
        .setTooltip(row.name)
        .onClick(() => action(button.buttonEl, index)),
    );
  }
  return setting;
}
