import type { Setting } from "obsidian";

/**
 * The shapes of Obsidian 1.13's setting definitions that this plugin uses,
 * written out here so the code that builds and draws them names no 1.13-only
 * member (minAppVersion is below 1.13). They are assignable to Obsidian's
 * `SettingDefinitionItem`, which `getSettingDefinitions()` returns.
 */

type Flag = boolean | (() => boolean);

/** A row the section draws itself with the classic `Setting` API */
export interface RenderRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: Flag;
  render: (setting: Setting) => void;
}

/** A clickable row (a list entry opening its editor) */
export interface ActionRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: Flag;
  action: (el: HTMLElement, index: number) => void;
}

/** A row that only shows text */
export interface TextRowDefinition {
  name: string;
  desc?: string | DocumentFragment;
  visible?: Flag;
}

export type RowDefinition =
  | RenderRowDefinition
  | ActionRowDefinition
  | TextRowDefinition;

export interface GroupDefinition {
  type: "group";
  heading?: string;
  visible?: Flag;
  items: RowDefinition[];
}

/** Entries the user adds, edits and deletes */
export interface ListDefinition {
  type: "list";
  heading?: string;
  visible?: Flag;
  emptyState?: string;
  addItem?: { name: string; action: (el: HTMLElement) => void };
  onDelete?: (index: number) => void;
  items: RowDefinition[];
}

/** A sub-page; a collapsible section before Obsidian 1.13 */
export interface PageDefinition {
  type: "page";
  name: string;
  visible?: Flag;
  items: DefinitionItem[];
}

export type DefinitionItem =
  | RowDefinition
  | GroupDefinition
  | ListDefinition
  | PageDefinition;
