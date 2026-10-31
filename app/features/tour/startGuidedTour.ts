import { TFile } from "obsidian";
import { buildTour, type TourMode } from "@app/features/tour/tourSteps";
import { ensureTourNote } from "@app/features/tour/tourNote";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import type {
  AppPort,
  EventBusPort,
  SettingsPort,
  TourPort,
} from "@app/types/PluginPorts";
import type { TourEndReason } from "@app/features/tour/TourStep";

export type GuidedTourPluginPort = AppPort &
  SettingsPort &
  EventBusPort &
  TourPort;

/** Where the request came from: the welcome choice, or the settings / command. */
export type GuidedTourSource =
  | "welcome-examples"
  | "welcome-scratch"
  | "settings"
  | "command";

export interface GuidedTourOptions {
  source: GuidedTourSource;
  onEnd?: (reason: TourEndReason) => void;
}

/**
 * The tour follows the welcome choice: "Start from scratch" runs on the user's
 * own data; everything else runs on the examples when they exist and the views
 * read their log, otherwise on the user's own data.
 */
function modeFor(
  plugin: GuidedTourPluginPort,
  source: GuidedTourSource,
): TourMode {
  if (source === "welcome-scratch") return "mine";
  const exampleLog = plugin.app.vault.getAbstractFileByPath(examplePaths.log());
  const inUse =
    exampleLog instanceof TFile &&
    plugin.settings.csvLogFilePath === examplePaths.log();
  return inUse ? "examples" : "mine";
}

/**
 * Opens the tour note (created if missing) and starts the tour on it. The one
 * call for every entry point (welcome, settings, command).
 */
export async function startGuidedTour(
  plugin: GuidedTourPluginPort,
  options: GuidedTourOptions,
): Promise<void> {
  const mode = modeFor(plugin, options.source);
  const file = await ensureTourNote(plugin.app, mode);
  await plugin.app.workspace.getLeaf(false).openFile(file);
  plugin
    .getTourEngine()
    .start(buildTour({ bus: plugin.eventBus, mode }), { onEnd: options.onEnd });
}
