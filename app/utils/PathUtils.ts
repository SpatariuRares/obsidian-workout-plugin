import { App } from "obsidian";

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
   * Computes a sibling file path in the same folder as the given file.
   * @param filePath - Reference file path (e.g., "folder/workout_logs.csv")
   * @param siblingName - Name of the sibling file (e.g., "muscle-tags.csv")
   * @returns Sibling path (e.g., "folder/muscle-tags.csv")
   */
  static getSiblingPath(filePath: string, siblingName: string): string {
    const folder = this.getFolderPath(filePath);
    return folder ? `${folder}/${siblingName}` : siblingName;
  }

  /**
   * Ensures the parent folder of a file path exists, creating it if necessary.
   * @param app - Obsidian App instance
   * @param filePath - File path whose parent folder should exist
   */
  static async ensureFolderExists(app: App, filePath: string): Promise<void> {
    const folder = this.getFolderPath(filePath);
    if (folder) {
      const folderExists = app.vault.getAbstractFileByPath(folder);
      if (!folderExists) {
        await app.vault.createFolder(folder);
      }
    }
  }
}
