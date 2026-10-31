import { normalizePath, TFile } from "obsidian";
import { t } from "@app/i18n";
import { logFileExists } from "@app/services/data/logFileExists";
import { tableBlock } from "@app/features/tables/tableBlock";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";
import type { LogModalPort } from "@app/types/PluginPorts";

export type WelcomePluginPort = ExamplePluginPort & LogModalPort;

/**
 * Fresh install = nothing saved by the plugin before and no log CSV yet, so
 * updating users never see the welcome. Shown once: the flag is saved when
 * the modal opens.
 */
export async function shouldShowWelcome(
  plugin: WelcomePluginPort,
  savedData: unknown,
): Promise<boolean> {
  if (plugin.settings.welcomeShown) return false;
  if (savedData !== null && savedData !== undefined) return false;
  return !logFileExists(plugin);
}

export async function markWelcomeShown(
  plugin: WelcomePluginPort,
): Promise<void> {
  plugin.settings.welcomeShown = true;
  await plugin.saveSettings();
}

/**
 * "Start from scratch": a note holding a `workout-log` block, then the log
 * form. Never overwrites an existing note.
 */
export async function startFromScratch(
  plugin: WelcomePluginPort,
): Promise<void> {
  const { vault, workspace } = plugin.app;
  const name = t("welcome.scratchNoteName");
  let path = normalizePath(`${name}.md`);
  for (let n = 1; vault.getAbstractFileByPath(path); n++) {
    path = normalizePath(`${name} ${n}.md`);
  }
  const content = `# ${name}\n\n${tableBlock.serialize({})}\n`;
  const file = await vault.create(path, content);
  if (file instanceof TFile) await workspace.getLeaf(false).openFile(file);
  plugin.createLogModalHandler.openModal();
}
