import { Notice } from "obsidian";
import { t } from "@app/i18n";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { tourNotePath } from "@app/features/tour/tourNote";
import {
  startGuidedTour,
  type GuidedTourPluginPort,
} from "@app/features/tour/startGuidedTour";

function makePlugin(opts: { examples?: boolean } = {}) {
  const vault = new FakeVault();
  const settings = { ...DEFAULT_SETTINGS };
  if (opts.examples) {
    void vault.app.vault.create(examplePaths.log(), "");
    settings.csvLogFilePath = examplePaths.log();
  }
  const openFile = jest.fn();
  const start = jest.fn();
  const plugin = {
    settings,
    eventBus: new WorkoutEventBus(),
    app: { ...vault.app, workspace: { getLeaf: () => ({ openFile }) } },
    getTourEngine: () => ({ start }),
  } as unknown as GuidedTourPluginPort;
  return { plugin, vault, openFile, start };
}

jest.mock("obsidian", () => ({
  ...jest.requireActual("obsidian"),
  Notice: jest.fn(),
}));

describe("startGuidedTour", () => {
  beforeEach(() => jest.clearAllMocks());

  it("welcome-scratch runs on the user's data even when examples exist", async () => {
    const { plugin, vault, openFile, start } = makePlugin({ examples: true });
    await startGuidedTour(plugin, { source: "welcome-scratch" });
    expect(vault.content(tourNotePath("mine"))).toBeDefined();
    expect(openFile).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("welcome-examples runs on the examples when the log is the example log", async () => {
    const { plugin, vault, start } = makePlugin({ examples: true });
    await startGuidedTour(plugin, { source: "welcome-examples" });
    expect(vault.content(tourNotePath("examples"))).toBeDefined();
    expect(start).toHaveBeenCalledTimes(1);
  });

  it("welcome-examples runs on the user's data and says so when the views do not read the example log", async () => {
    const { plugin, vault } = makePlugin();
    await startGuidedTour(plugin, { source: "welcome-examples" });
    expect(vault.content(tourNotePath("mine"))).toBeDefined();
    expect(Notice).toHaveBeenCalledWith(t("welcome.tourOnYourData"));
  });

  it("does not claim sample data when the tour runs on the examples or on scratch", async () => {
    const withExamples = makePlugin({ examples: true });
    await startGuidedTour(withExamples.plugin, { source: "welcome-examples" });
    const scratch = makePlugin();
    await startGuidedTour(scratch.plugin, { source: "welcome-scratch" });
    expect(Notice).not.toHaveBeenCalled();
  });

  it("passes the note's path so the engine can tie the tour to it", async () => {
    const { plugin, start } = makePlugin();
    await startGuidedTour(plugin, { source: "command" });
    expect(start.mock.calls[0][1].notePath).toBe(tourNotePath("mine"));
  });

  it("settings and command use the examples when in use, otherwise the user's data", async () => {
    const withExamples = makePlugin({ examples: true });
    await startGuidedTour(withExamples.plugin, { source: "settings" });
    expect(withExamples.vault.content(tourNotePath("examples"))).toBeDefined();

    const without = makePlugin();
    await startGuidedTour(without.plugin, { source: "command" });
    expect(without.vault.content(tourNotePath("mine"))).toBeDefined();
  });

  it("passes onEnd through to the engine", async () => {
    const { plugin, start } = makePlugin();
    const onEnd = jest.fn();
    await startGuidedTour(plugin, { source: "command", onEnd });
    expect(start.mock.calls[0][1].onEnd).toBe(onEnd);
  });
});
