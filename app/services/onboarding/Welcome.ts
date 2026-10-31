import { openGettingStartedGuide } from "@app/services/examples/GettingStartedGuide";
import { logFileExists } from "@app/services/data/logFileExists";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";

export type WelcomePluginPort = ExamplePluginPort;

/**
 * Fresh install = nothing saved by the plugin before and no log CSV yet, so
 * updating users never see the onboarding. The flag is saved only after
 * the getting-started page opens.
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

/** Fresh installs go straight to working examples, without a choice modal. */
export async function openOnboarding(
  plugin: WelcomePluginPort,
): Promise<boolean> {
  if (!(await openGettingStartedGuide(plugin))) return false;
  await markWelcomeShown(plugin);
  return true;
}
