import {
  startGuidedTour,
  type GuidedTourPluginPort,
} from "@app/features/tour/startGuidedTour";

const openGuide = jest.fn();
jest.mock("@app/services/examples/GettingStartedGuide", () => ({
  openGettingStartedGuide: (...args: unknown[]) => openGuide(...args),
}));

it.each(["command", "settings"] as const)(
  "%s opens the native walkthrough and stops any old overlay",
  async (source) => {
    const stop = jest.fn();
    const start = jest.fn();
    const plugin = {
      getTourEngine: () => ({ stop, start }),
    } as unknown as GuidedTourPluginPort;
    await startGuidedTour(plugin, { source });
    expect(stop).toHaveBeenCalledTimes(1);
    expect(start).not.toHaveBeenCalled();
    expect(openGuide).toHaveBeenCalledWith(plugin);
  },
);
