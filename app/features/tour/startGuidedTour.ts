import { openGettingStartedGuide } from "@app/services/examples/GettingStartedGuide";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";
import type { TourPort } from "@app/types/PluginPorts";

export type GuidedTourPluginPort = ExamplePluginPort & TourPort;
export type GuidedTourSource = "settings" | "command";

/** Keep the existing command working; native notes replace the spotlight tour. */
export async function startGuidedTour(
  plugin: GuidedTourPluginPort,
  _options: { source: GuidedTourSource },
): Promise<void> {
  plugin.getTourEngine().stop();
  await openGettingStartedGuide(plugin);
}
