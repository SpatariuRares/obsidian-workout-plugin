import { GeneralSettings } from "@app/features/settings/components/GeneralSettings";
import type { App } from "obsidian";
import type { EventBusPort, WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const textInputs = new Map<string, (value: string) => Promise<void>>();

jest.mock("@app/features/common/suggest/FolderSuggest", () => ({
  FolderSuggest: jest.fn(),
}));

jest.mock("obsidian", () => {
  class Setting {
    private name = "";
    controlEl = {
      createEl: () => ({
        setCssProps: () => {},
        setText: () => {},
        addClass: () => {},
        removeClass: () => {},
      }),
    };
    setName(name: string) {
      this.name = name;
      return this;
    }
    addText(cb: (text: unknown) => void) {
      const text = {
        inputEl: {},
        setPlaceholder: () => text,
        setValue: () => text,
        onChange: (fn: (value: string) => Promise<void>) => {
          textInputs.set(this.name, fn);
          return text;
        },
      };
      cb(text);
      return this;
    }
    setDesc() {
      return this;
    }
    setHeading() {
      return this;
    }
    addDropdown() {
      return this;
    }
    addButton() {
      return this;
    }
    addToggle() {
      return this;
    }
  }
  return {
    ...jest.requireActual("obsidian"),
    Setting,
    normalizePath: (p: string) => p.replace(/\/+$/, ""),
  };
});

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
    const app = { vault: { getAbstractFileByPath: () => null } } as unknown as App;
    new GeneralSettings(
      app,
      plugin as unknown as WorkoutPluginContext & EventBusPort,
      { createEl: () => ({}) } as unknown as HTMLElement,
    ).render();
    return plugin;
  }

  it("saves each keystroke but reloads views once, after typing stops", async () => {
    const plugin = setup();
    const type = textInputs.get(t("settings.labels.exerciseFolder"))!;

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
    const plugin = setup();

    await textInputs.get(t("settings.labels.csvPath"))!("New");
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
