/**
 * Path resolution utilities for workout files.
 */
import { normalizePath } from "obsidian";

/**
 * Resolves a relative or absolute file path.
 * @param path - The path specified in the workout parameter
 * @param currentFilePath - The current file's path for relative resolution
 * @returns Normalized path suitable for Obsidian vault operations
 */
export function resolveFilePath(path: string, currentFilePath: string): string {
  // If it's already an absolute path (starts from root), use it directly
  if (path.startsWith("/")) {
    return normalizePath(path.slice(1)); // Remove leading slash for Obsidian
  }

  // Add .md extension if not present
  const pathWithExtension = path.endsWith(".md") ? path : `${path}.md`;

  // Resolve relative to current file's directory
  const currentDir = currentFilePath.substring(
    0,
    currentFilePath.lastIndexOf("/"),
  );
  if (currentDir) {
    return normalizePath(`${currentDir}/${pathWithExtension}`);
  }

  return normalizePath(pathWithExtension);
}
