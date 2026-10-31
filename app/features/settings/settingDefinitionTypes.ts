import type { Setting } from "obsidian";

/**
 * The shapes of Obsidian 1.13's setting definitions that this plugin uses,
 * written out here so the code that builds and draws them names no 1.13-only
 * member (minAppVersion is below 1.13). They are assignable to Obsidian's
 * `SettingDefinitionItem`, which `getSettingDefinitions()` returns.
 */

/** A row the section draws itself with the classic `Setting` API */
export interface RenderRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: boolean;
  render: (setting: Setting) => void;
}

/** A clickable row (a list entry opening its editor) */
export interface ActionRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: boolean;
  /** Tooltip of the button that runs `action` */
  tooltip?: string;
  action: (el: HTMLElement) => void;
}

/** A row that only shows text */
export interface TextRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: boolean;
}

export type RowDefinition =
  | RenderRowDefinition
  | ActionRowDefinition
  | TextRowDefinition;

export interface GroupDefinition {
  type: "group";
  heading?: string;
  visible?: boolean;
  items: RowDefinition[];
}

/** An entry of a list: always drawn, so its index is its place in `items` */
export interface ListItemDefinition {
  name: string;
  desc?: string | DocumentFragment;
  /** Tooltip of the edit button */
  tooltip?: string;
  action: (el: HTMLElement) => void;
}

/** Entries the user adds, edits and deletes */
export interface ListDefinition {
  type: "list";
  heading?: string;
  visible?: boolean;
  emptyState?: string;
  addItem?: { name: string; action: (el: HTMLElement) => void };
  /** Gets the index of the entry in `items` */
  onDelete?: (index: number) => void;
  /** Tooltip of every delete button */
  deleteTooltip?: string;
  items: ListItemDefinition[];
}

/** A sub-page; a collapsible section before Obsidian 1.13 */
export interface PageDefinition {
  type: "page";
  name: string;
  visible?: boolean;
  items: DefinitionItem[];
}

export type DefinitionItem =
  | RowDefinition
  | GroupDefinition
  | ListDefinition
  | PageDefinition;
