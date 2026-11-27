/** @jest-environment jsdom */
import { mockSettingNamed, withHelpers } from "obsidian";
import type { App } from "obsidian";
import { TemplatesSettings } from "@app/features/settings/components/TemplatesSettings";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { t } from "@app/i18n";

jest.mock("@app/features/common/suggest/FolderSuggest", () => ({
  FolderSuggest: jest.fn(),
}));

function setup(
  generate: jest.Mock = jest.fn(),
  templateFolderPath = "Workout Templates",
) {
  const app = {} as App;
  const plugin = {
    settings: { templateFolderPath },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    templateGeneratorService: { generateDefaultTemplates: generate },
  };
  const container = withHelpers(document.createElement("div"));
  renderSettingDefinitions(
    container,
    new TemplatesSettings(
      app,
      plugin as unknown as ConstructorParameters<typeof TemplatesSettings>[1],
    ).definitions(),
  );
  const row = mockSettingNamed(
    container,
    t("settings.labels.generateDefaultTemplates"),
  );
  return {
    app,
    plugin,
    container,
    generate: row.component("button", 0),
    overwrite: row.component("button", 1),
  };
}

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe("templates section", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (FolderSuggest as jest.Mock).mockClear();
  });
  afterEach(() => jest.useRealTimers());

  it("displays the configured template folder path and attaches FolderSuggest", () => {
    const { app, container } = setup(jest.fn(), "Custom/Templates");
    const folderRow = mockSettingNamed(
      container,
      t("settings.labels.templateFolder"),
    );
    const text = folderRow.component("text");

    expect(text.value).toBe("Custom/Templates");
    expect(FolderSuggest).toHaveBeenCalledWith(app, text.inputEl);
  });

  it("normalizes and saves templateFolderPath on change", async () => {
    const { plugin, container } = setup();
    const text = mockSettingNamed(
      container,
      t("settings.labels.templateFolder"),
    ).component("text");

    await text.change(" /My//Templates/ " as never);

    expect(plugin.settings.templateFolderPath).toBe("My/Templates");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("saves an empty string when templateFolderPath is cleared", async () => {
    const { plugin, container } = setup();
    const text = mockSettingNamed(
      container,
      t("settings.labels.templateFolder"),
    ).component("text");

    await text.change("   " as never);

    expect(plugin.settings.templateFolderPath).toBe("");
    expect(plugin.saveSettings).toHaveBeenCalledTimes(1);
  });

  it("shows the button busy while generating, then done, then as it was", async () => {
    let finish: () => void = () => {};
    const generate = jest.fn(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const { generate: button } = setup(generate);

    button.buttonEl.click();
    expect(button.disabled).toBe(true);
    expect(button.text).toBe(t("settings.buttons.generating"));
    expect(generate).toHaveBeenCalledWith(false);

    finish();
    await flush();
    expect(button.text).toBe(t("settings.buttons.generated"));
    expect(button.disabled).toBe(true);

    jest.advanceTimersByTime(2000);
    expect(button.text).toBe(t("settings.buttons.generateTemplates"));
    expect(button.disabled).toBe(false);
  });

  it("says the overwrite failed, then gives the button back", async () => {
    const generate = jest.fn().mockRejectedValue(new Error("disk"));
    const { overwrite } = setup(generate);

    overwrite.buttonEl.click();
    expect(overwrite.text).toBe(t("settings.buttons.overwriting"));
    await flush();

    expect(generate).toHaveBeenCalledWith(true);
    expect(overwrite.text).toBe(t("settings.buttons.failed"));
    jest.advanceTimersByTime(2000);
    expect(overwrite.text).toBe(t("settings.buttons.regenerateOverwrite"));
    expect(overwrite.disabled).toBe(false);
  });
});
