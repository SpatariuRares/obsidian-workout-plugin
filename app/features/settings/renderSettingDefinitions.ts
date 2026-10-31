import { Setting } from "obsidian";
import type {
  ActionRowDefinition,
  DefinitionItem,
  GroupDefinition,
  ListDefinition,
  ListItemDefinition,
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
  if (item.visible === false) return;
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

  if (group.type === "list") {
    renderList(containerEl, group);
  } else {
    for (const row of group.items) {
      if (row.visible !== false) renderRow(containerEl, row);
    }
  }
}

function renderList(
  containerEl: HTMLElement,
  list: ListDefinition,
): void {
  if (list.emptyState && list.items.length === 0) {
    containerEl.createEl("p", {
      text: list.emptyState,
      cls: "workout-setting-item-description",
    });
  }

  const { onDelete } = list;
  list.items.forEach((item, index) => {
    const setting = renderRow(containerEl, item);
    if (onDelete) {
      setting.addButton((button) => {
        button.setIcon("trash").onClick(() => onDelete(index));
        if (list.deleteTooltip) button.setTooltip(list.deleteTooltip);
      });
    }
  });

  const { addItem } = list;
  if (addItem) {
    new Setting(containerEl).addButton((button) =>
      button
        .setButtonText(addItem.name)
        .setCta()
        .onClick(() => addItem.action(button.buttonEl)),
    );
  }
}

function isRender(row: RowDefinition | ListItemDefinition): row is RenderRowDefinition {
  return "render" in row;
}

function isAction(
  row: RowDefinition | ListItemDefinition,
): row is ActionRowDefinition | ListItemDefinition {
  return "action" in row;
}

function renderRow(
  containerEl: HTMLElement,
  row: RowDefinition | ListItemDefinition,
): Setting {
  const setting = new Setting(containerEl).setName(row.name);
  if (row.desc) setting.setDesc(row.desc);

  if (isRender(row)) {
    row.render(setting);
  } else if (isAction(row)) {
    const { action } = row;
    setting.addButton((button) => {
      button.setIcon("pencil").onClick(() => action(button.buttonEl));
      if (row.tooltip) button.setTooltip(row.tooltip);
    });
  }
  return setting;
}
