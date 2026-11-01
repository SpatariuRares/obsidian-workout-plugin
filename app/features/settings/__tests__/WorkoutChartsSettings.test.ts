/** @jest-environment jsdom */
import { withHelpers } from "obsidian";
import type { App, SettingDefinitionItem } from "obsidian";
import { WorkoutChartsSettingTab } from "@app/features/settings/WorkoutChartsSettings";
import { t } from "@app/i18n";

jest.mock("@app/features/common/suggest/FolderSuggest", () => ({
  FolderSuggest: jest.fn(),
}));

beforeAll(() => {
  // Obsidian's global; the protocol rows describe themselves with it
  (globalThis as unknown as Record<string, unknown>).createFragment = () =>
    withHelpers(document.createDocumentFragment());
});

type AnyItem = SettingDefinitionItem & {
  name?: string;
  heading?: string;
  items?: AnyItem[];
  type?: string;
};

function makePlugin() {
  return {
    settings: {
      csvLogFilePath: "Workouts/workout_logs.csv",
      exerciseFolderPath: "Exercises",
      weightUnit: "kg",
      defaultExactMatch: false,
      showRibbonIcon: true,
      quickWeightIncrement: 2.5,
      weightIncrement: 2.5,
      repDuration: 3,
      defaultRepsPerSet: 10,
      setDuration: 45,
      exerciseBlockTemplate: "template",
      defaultTimerPreset: null as string | null,
      timerPresets: {
        rest: {
          name: "rest",
          type: "countdown",
          duration: 90,
          showControls: true,
          sound: true,
        },
      } as Record<string, unknown>,
      customProtocols: [
        {
          id: "myo",
          name: "Myo",
          abbreviation: "MYO",
          color: "#112233",
        },
      ],
    },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    updateQuickLogRibbon: jest.fn(),
    eventBus: { emit: jest.fn() },
    templateGeneratorService: { generateDefaultTemplates: jest.fn() },
  };
}

function makeTab(plugin = makePlugin()) {
  const app = {
    vault: { getAbstractFileByPath: () => null },
  } as unknown as App;
  const tab = new WorkoutChartsSettingTab(
    app,
    plugin as unknown as ConstructorParameters<
      typeof WorkoutChartsSettingTab
    >[1],
  );
  return { tab, plugin };
}

/** Every row name reachable from the definitions, groups and pages included */
function rowNames(items: AnyItem[]): string[] {
  return items.flatMap((item) => [
    ...(item.type === "group" ||
    item.type === "list" ||
    item.type === "page"
      ? []
      : item.name
        ? [item.name]
        : []),
    ...rowNames(item.items ?? []),
  ]);
}

const EXPECTED_ROWS = [
  "settings.labels.csvPath",
  "settings.labels.exerciseFolder",
  "settings.labels.weightUnit",
  "settings.labels.setupCSV",
  "commands.openGettingStartedGuide",
  "settings.labels.defaultExactMatch",
  "settings.labels.showRibbonIcon",
  "settings.labels.defaultTimerPreset",
  "settings.labels.repDuration",
  "settings.labels.defaultRepsPerSet",
  "settings.labels.setDuration",
  "settings.labels.generateDefaultTemplates",
  "settings.labels.exerciseBlockTemplate",
  "settings.labels.runAllMaintenance",
];

describe("WorkoutChartsSettingTab definitions (settings search)", () => {
  it("describes every row of every section so none is hidden from search", () => {
    const { tab } = makeTab();
    const names = rowNames(tab.getSettingDefinitions() as AnyItem[]);

    for (const key of EXPECTED_ROWS) {
      expect(names).toContain(t(key));
    }
  });

  it("puts Templates and Maintenance on an Advanced page", () => {
    const { tab } = makeTab();
    const page = (tab.getSettingDefinitions() as AnyItem[]).find(
      (item) => item.type === "page",
    );

    expect(page?.name).toBe(t("settings.sections.advanced"));
    const advancedNames = rowNames(page?.items ?? []);
    expect(advancedNames).toContain(
      t("settings.labels.exerciseBlockTemplate"),
    );
    expect(advancedNames).toContain(
      t("settings.labels.runAllMaintenance"),
    );
  });

  it("lists protocols and timer presets as lists with their entries", () => {
    const { tab } = makeTab();
    const lists = (tab.getSettingDefinitions() as AnyItem[]).filter(
      (item) => item.type === "list",
    );

    expect(lists.length).toBe(2);
    expect(lists.map((l) => l.items?.map((i) => i.name))).toEqual([
      ["rest"],
      ["Myo"],
    ]);
  });
});

describe("WorkoutChartsSettingTab display() fallback (Obsidian before 1.13)", () => {
  it("renders the same rows as the definitions", () => {
    const { tab } = makeTab();
    tab.display();

    const shown = Array.from(
      tab.containerEl.querySelectorAll(".setting-item-name"),
    ).map((el) => el.textContent);

    for (const key of EXPECTED_ROWS) {
      expect(shown).toContain(t(key));
    }
    expect(
      tab.containerEl.querySelector("details summary")?.textContent,
    ).toBe(t("settings.sections.advanced"));
    expect(shown).toContain("rest");
    expect(shown).toContain("Myo");
  });

  it("redraws through display() after a change when update() is missing", () => {
    const { tab } = makeTab();
    tab.display();
    const before = tab.containerEl.children.length;
    tab.refresh();
    expect(tab.containerEl.children.length).toBe(before);
  });

  it("uses update() instead when Obsidian provides it", () => {
    const { tab } = makeTab();
    const update = jest.fn();
    (tab as unknown as { update: () => void }).update = update;
    const display = jest.spyOn(tab, "display");

    tab.refresh();

    expect(update).toHaveBeenCalled();
    expect(display).not.toHaveBeenCalled();
  });
});
