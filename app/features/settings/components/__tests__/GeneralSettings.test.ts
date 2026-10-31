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
import { WelcomeModal } from "@app/features/modals/welcome/WelcomeModal";

const mockStartTour = jest.fn();
jest.mock("@app/features/tour/startGuidedTour", () => ({
  startGuidedTour: (...a: unknown[]) => mockStartTour(...a),
}));

const mockOpen = jest.fn();
jest.mock("@app/features/modals/welcome/WelcomeModal", () => ({
  WelcomeModal: jest.fn().mockImplementation(() => ({ open: mockOpen })),
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

describe("GeneralSettings welcome window", () => {
  it("opens the welcome window from the button without changing welcomeShown", async () => {
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

    mockSettingNamed(container, t("settings.labels.welcomeWindow"))
      .component("button", 0)
      .buttonEl.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(WelcomeModal).toHaveBeenCalledWith(plugin);
    expect(mockOpen).toHaveBeenCalled();
    expect(plugin.settings.welcomeShown).toBe(true);
    expect(plugin.saveSettings).not.toHaveBeenCalled();
  });
});

describe("GeneralSettings guided tour", () => {
  it("starts the tour from its own row, apart from Show welcome", async () => {
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

    const row = mockSettingNamed(container, t("settings.labels.takeTour"));
    expect(row.component("button", 0).buttonEl.textContent).toBe(
      t("settings.buttons.takeTour"),
    );
    const welcome = mockSettingNamed(
      container,
      t("settings.labels.welcomeWindow"),
    );
    expect(welcome.component("button", 0).buttonEl.textContent).toBe(
      t("settings.buttons.showWelcome"),
    );
    row.component("button", 0).buttonEl.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockStartTour).toHaveBeenCalledWith(plugin, { source: "settings" });
  });
});
