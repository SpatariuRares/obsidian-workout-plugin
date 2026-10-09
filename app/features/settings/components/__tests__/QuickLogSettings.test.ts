import { QuickLogSettings } from "@app/features/settings/components/QuickLogSettings";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";

const toggles = new Map<string, (value: boolean) => Promise<void>>();

jest.mock("obsidian", () => {
  class Setting {
    private name = "";
    controlEl = { createEl: jest.fn(() => ({ toggleClass: jest.fn() })) };
    setName(name: string) {
      this.name = name;
      return this;
    }
    setDesc() {
      return this;
    }
    setHeading() {
      return this;
    }
    addToggle(cb: (toggle: unknown) => void) {
      const toggle = {
        setValue: () => toggle,
        onChange: (fn: (value: boolean) => Promise<void>) => {
          toggles.set(this.name, fn);
          return toggle;
        },
      };
      cb(toggle);
      return this;
    }
    addText(cb: (text: unknown) => void) {
      const text = { setValue: () => text, onChange: () => text };
      cb(text);
      return this;
    }
  }
  return { Setting };
});

describe("QuickLogSettings ribbon toggle", () => {
  it("saves showRibbonIcon and refreshes the ribbon", async () => {
    const plugin = {
      settings: { showRibbonIcon: true, quickWeightIncrement: 2.5 },
      saveSettings: jest.fn().mockResolvedValue(undefined),
      updateQuickLogRibbon: jest.fn(),
    };

    new QuickLogSettings(
      plugin as unknown as WorkoutChartsPlugin,
      {} as HTMLElement,
    ).render();
    await toggles.get(t("settings.labels.showRibbonIcon"))!(false);

    expect(plugin.settings.showRibbonIcon).toBe(false);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(plugin.updateQuickLogRibbon).toHaveBeenCalled();
  });
});
