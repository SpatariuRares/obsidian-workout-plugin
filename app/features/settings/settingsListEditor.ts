import { Notice } from "obsidian";
import type { App } from "obsidian";
import type { ListDefinition } from "@app/features/settings/settingDefinitionTypes";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";

/**
 * A settings list the user adds to, edits and deletes from (protocols, timer
 * presets). The entries' own rules come in through the spec; the flow is
 * the same for all: the form edits a copy, Save checks it, writes it, saves
 * the settings and redraws; Delete asks first.
 */
export interface SettingsListEditorSpec<T> {
  app: App;
  heading: string;
  emptyState: string;
  addLabel: string;
  editTooltip: string;
  deleteTooltip: string;
  items: readonly T[];
  /** The entry's identity (id, name): what `upsert` and `remove` find it by */
  keyOf: (item: T) => string;
  /** Its row in the list */
  describe: (item: T) => {
    name: string;
    desc: string | DocumentFragment;
  };
  /** A new entry's starting values */
  blank: () => T;
  /**
   * Opens the form on `draft` (a copy); `save` returns false to keep it open.
   * `original` is null when adding.
   */
  open: (
    draft: T,
    original: T | null,
    save: () => Promise<boolean>,
  ) => void;
  /** Tidies the typed values (trim, ids) before they are checked */
  normalize?: (draft: T, originalKey: string | null) => void;
  /** Why `draft` cannot be saved, or null */
  validate: (draft: T, originalKey: string | null) => string | null;
  /** Writes `draft` into the settings, replacing the entry `originalKey` */
  upsert: (draft: T, originalKey: string | null) => void;
  /** Takes the entry out of the settings */
  remove: (key: string) => void;
  persist: () => Promise<void>;
  /** Redraws the settings tab after the list changed */
  refresh: () => void;
  messages: {
    /** Or the question for the entry `key` (what deleting it changes) */
    confirmDelete: string | ((key: string) => string);
    saved: string;
    deleted: string;
  };
}

/** The list definition of `spec`, with its add, edit and delete flows */
export function settingsListEditor<T>(
  spec: SettingsListEditorSpec<T>,
): ListDefinition {
  const keys = spec.items.map(spec.keyOf);

  const edit = (original: T | null) => {
    const draft = { ...(original ?? spec.blank()) };
    const originalKey = original ? spec.keyOf(original) : null;
    spec.open(draft, original, async () => {
      spec.normalize?.(draft, originalKey);
      const problem = spec.validate(draft, originalKey);
      if (problem) {
        new Notice(problem);
        return false;
      }
      spec.upsert(draft, originalKey);
      await spec.persist();
      new Notice(spec.messages.saved);
      spec.refresh();
      return true;
    });
  };

  const confirmDelete = (key: string | undefined) => {
    if (key === undefined) return;
    const { confirmDelete: question } = spec.messages;
    new ConfirmModal(
      spec.app,
      typeof question === "function" ? question(key) : question,
      async () => {
        spec.remove(key);
        await spec.persist();
        new Notice(spec.messages.deleted);
        spec.refresh();
      },
    ).open();
  };

  return {
    type: "list",
    heading: spec.heading,
    emptyState: spec.emptyState,
    addItem: { name: spec.addLabel, action: () => edit(null) },
    onDelete: (index) => confirmDelete(keys[index]),
    deleteTooltip: spec.deleteTooltip,
    items: spec.items.map((item) => ({
      ...spec.describe(item),
      tooltip: spec.editTooltip,
      action: () => edit(item),
    })),
  };
}
