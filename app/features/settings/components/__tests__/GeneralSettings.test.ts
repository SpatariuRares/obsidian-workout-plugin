/** @jest-environment jsdom */
import { GeneralSettings } from "@app/features/settings/components/GeneralSettings";
import { mockSettingNamed } from "obsidian";
import type { App } from "obsidian";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const mockOpenGuide = jest.fn();
jest.mock("@app/services/examples/GettingStartedGuide", () => ({
  openGettingStartedGuide: (...args: unknown[]) =>
    mockOpenGuide(...args),
}));

const mockOpenWhatsNew = jest.fn();
jest.mock("@app/features/modals/common/WhatsNewModal", () => ({
  WhatsNewModal: jest.fn().mockImplementation((...args: unknown[]) => ({
    open: () => mockOpenWhatsNew(...args),
  })),
}));

jest.mock("@app/features/common/suggest/FolderSuggest", () => ({
  FolderSuggest: jest.fn(),
}));

describe("GeneralSettings data paths", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  function setup() {
    const plugin = {
      settings: {
        csvLogFilePath: "Old/workout_logs.csv",
        exerciseFolderPath: "Old exercises",
        weightUnit: "kg",
      },
      saveSettings: jest.fn().mockResolvedValue(undefined),
      triggerMuscleTagRefresh: jest.fn(),
      getExerciseDefinitionService: () => ({ clearCache: jest.fn() }),
      eventBus: { emit: jest.fn() },
    };
    const app = {
      vault: { getAbstractFileByPath: () => null },
    } as unknown as App;
    const container = document.createElement("div");
    renderSettingDefinitions(
      container,
      new GeneralSettings(
        app,
        plugin as unknown as WorkoutPluginContext & EventBusPort,
      ).definitions(),
    );
    const typeInto = (name: string) => (value: string) =>
      mockSettingNamed(container, name)
        .component("text")
        .change(value as never);
    return { plugin, typeInto };
  }

  it("saves each keystroke but reloads views once, after typing stops", async () => {
    const { plugin, typeInto } = setup();
    const type = typeInto(t("settings.labels.exerciseFolder"));

    await type("E");
    await type("Ex");
    await type("Exercises");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(3);
    expect(plugin.eventBus.emit).not.toHaveBeenCalled();

    jest.advanceTimersByTime(600);

    expect(plugin.eventBus.emit).toHaveBeenCalledTimes(1);
    expect(plugin.eventBus.emit).toHaveBeenCalledWith({
      type: "settings:changed",
      payload: {
        key: "exerciseFolderPath",
        previousValue: "Old exercises",
        newValue: "Exercises",
      },
    });
    expect(plugin.triggerMuscleTagRefresh).toHaveBeenCalledTimes(1);
  });

  it("announces a moved log file the same way", async () => {
    const { plugin, typeInto } = setup();

    await typeInto(t("settings.labels.csvPath"))("New");
    jest.advanceTimersByTime(600);

    expect(plugin.eventBus.emit).toHaveBeenCalledWith({
      type: "settings:changed",
      payload: {
        key: "csvLogFilePath",
        previousValue: "Old/workout_logs.csv",
        newValue: "New/workout_logs.csv",
      },
    });
  });
});

describe("GeneralSettings getting started", () => {
  const draw = () => {
    const plugin = {
      settings: {
        welcomeShown: true,
        csvLogFilePath: "Log/workout_logs.csv",
        exerciseFolderPath: "Exercises",
        weightUnit: "kg",
      },
      saveSettings: jest.fn(),
    } as unknown as WorkoutPluginContext & EventBusPort;
    const container = document.createElement("div");
    renderSettingDefinitions(
      container,
      new GeneralSettings({} as App, plugin).definitions(),
    );
    const click = async (name: string) => {
      mockSettingNamed(container, name).component("button", 0).buttonEl.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    };
    return { plugin, click, container };
  };

  it("has one row for the guide, which also adds the examples", () => {
    const { container } = draw();
    const names = [...container.querySelectorAll(".setting-item-name")].map(
      (el) => el.textContent,
    );

    expect(names).toContain(t("commands.openGettingStartedGuide"));
    expect(names).not.toContain(t("commands.createExampleNotes"));
    expect(names).not.toContain(t("commands.startTour"));
  });

  it("shows the changelog of every release", async () => {
    const { click } = draw();

    await click(t("commands.showWhatsNew"));

    expect(mockOpenWhatsNew).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(Array),
    );
  });

  it("opens the getting-started guide without changing welcomeShown", async () => {
    const { plugin, click } = draw();

    await click(t("commands.openGettingStartedGuide"));

    expect(mockOpenGuide).toHaveBeenCalledWith(plugin);
    expect(plugin.settings.welcomeShown).toBe(true);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });
});
