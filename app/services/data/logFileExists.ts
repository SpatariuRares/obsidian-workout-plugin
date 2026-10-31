import { normalizePath, TFile } from "obsidian";
import type { AppPort, SettingsPort } from "@app/types/PluginPorts";

/** Whether a workout log file already exists at `settings.csvLogFilePath` */
export function logFileExists(plugin: AppPort & SettingsPort): boolean {
  return (
    plugin.app.vault.getAbstractFileByPath(
      normalizePath(plugin.settings.csvLogFilePath),
    ) instanceof TFile
  );
}
