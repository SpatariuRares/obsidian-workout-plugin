/** @jest-environment jsdom */
import { mockSettingNamed, withHelpers } from "obsidian";
import { TemplatesSettings } from "@app/features/settings/components/TemplatesSettings";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { t } from "@app/i18n";

function setup(generate: jest.Mock) {
  const plugin = {
    settings: { exerciseBlockTemplate: "" },
    saveSettings: jest.fn(),
    templateGeneratorService: { generateDefaultTemplates: generate },
  };
  const container = withHelpers(document.createElement("div"));
  renderSettingDefinitions(
    container,
    new TemplatesSettings(
      plugin as unknown as ConstructorParameters<typeof TemplatesSettings>[0],
    ).definitions(),
  );
  const row = mockSettingNamed(
    container,
    t("settings.labels.generateDefaultTemplates"),
  );
  return {
    generate: row.component("button", 0),
    overwrite: row.component("button", 1),
  };
}

const flush = () => Promise.resolve().then(() => Promise.resolve());

describe("templates section", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

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
