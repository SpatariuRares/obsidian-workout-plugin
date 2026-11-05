import { App, MarkdownView, TFolder } from "obsidian";

/**
 * Utility for path computation and folder management related to CSV files.
 */
export class PathUtils {
  /**
   * Gets the parent folder path from a file path.
   * @param filePath - Full file path (e.g., "folder/sub/file.csv")
   * @returns Folder path or empty string if no folder (e.g., "folder/sub")
   */
  static getFolderPath(filePath: string): string {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash > 0 ? filePath.substring(0, lastSlash) : "";
  }

  /**
   * A note's name from its vault path ("Workouts/Leg Day.md" → "Leg Day"),
   * which is also the workout name of the sets logged from it.
   */
  static noteName(notePath: string): string {
    return PathUtils.linkTarget(notePath.split("/").pop() ?? "");
  }

  /**
   * Builds a wiki link to a note from its vault path.
   * @param notePath - Note path (e.g., "Workouts/Leg Day.md")
   * @returns Wiki link (e.g., "[[Leg Day]]") or empty string if no path
   */
  static toWikiLink(notePath: string): string {
    const name = PathUtils.noteName(notePath);
    return name ? `[[${name}]]` : "";
  }

  /**
   * Computes a sibling file path in the same folder as the given file.
   * @param filePath - Reference file path (e.g., "folder/workout_logs.csv")
   * @param siblingName - Name of the sibling file (e.g., "muscle-tags.csv")
   * @returns Sibling path (e.g., "folder/muscle-tags.csv")
   */
  static getSiblingPath(
    filePath: string,
    siblingName: string,
  ): string {
    const folder = this.getFolderPath(filePath);
    return folder ? `${folder}/${siblingName}` : siblingName;
  }

  /**
   * Ensures a folder exists, creating it if necessary.
   * @throws when a file already holds the path
   */
  static async ensureFolder(app: App, path: string): Promise<void> {
    const existing = app.vault.getAbstractFileByPath(path);
    if (!existing) {
      await app.vault.createFolder(path);
    } else if (!(existing instanceof TFolder)) {
      throw new Error(`Path '${path}' exists but is not a folder.`);
    }
  }

  /**
   * Ensures the folder a file goes in exists (nothing to do at the vault root).
   * @throws when a file already holds the folder's path
   */
  static async ensureParentFolder(
    app: App,
    filePath: string,
  ): Promise<void> {
    const folder = this.getFolderPath(filePath);
    if (folder) await this.ensureFolder(app, folder);
  }

  /**
   * A note's path as a wiki link names it, without `.md`
   * ("Workouts/Leg Day.md" → "Workouts/Leg Day").
   */
  static linkTarget(notePath: string): string {
    return notePath.replace(/\.md$/i, "");
  }

  /**
   * A wiki link to the note open in the active editor, "" without one.
   * Prefer the block's own note (`ctx.sourcePath`) when it is known.
   */
  static activeNoteLink(app: App): string {
    const file = app.workspace.getActiveViewOfType(MarkdownView)?.file;
    return file ? this.toWikiLink(file.path) : "";
  }
}
