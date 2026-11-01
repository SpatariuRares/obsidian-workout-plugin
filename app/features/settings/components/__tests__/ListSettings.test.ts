/** @jest-environment jsdom */
import { Modal, mockSettingNamed, withHelpers } from "obsidian";
import type { App, SettingDefinitionItem, SettingDefinitionList } from "obsidian";
import { CustomProtocolsSettings } from "@app/features/settings/components/CustomProtocolsSettings";
import { DurationEstimationSettings } from "@app/features/duration/settings/DurationEstimationSettings";
import { TimerPresetsSettings } from "@app/features/timer/settings/TimerPresetsSettings";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import { withDefaultTimerPresets } from "@app/features/timer/business/timerPresets";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

const confirms: Array<() => Promise<void>> = [];
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: class {
    constructor(_app: unknown, _msg: string, onConfirm: () => Promise<void>) {
      confirms.push(onConfirm);
    }
    open() {}
  },
}));

beforeAll(() => {
  (globalThis as unknown as Record<string, unknown>).createFragment = () =>
    withHelpers(document.createDocumentFragment());
});

const app = {} as App;
const listOf = (items: SettingDefinitionItem[]) =>
  items.find(
    (i): i is SettingDefinitionList => "type" in i && i.type === "list",
  )!;

/** Opens the modal an action creates and returns it with its form drawn */
function captureModal(run: () => void): Modal & { onOpen(): void } {
  let opened: (Modal & { onOpen(): void }) | undefined;
  const spy = jest
    .spyOn(Modal.prototype, "open")
    .mockImplementation(function (this: Modal & { onOpen(): void }) {
      opened = this;
      this.onOpen();
    });
  run();
  spy.mockRestore();
  return opened!;
}

describe("custom protocols list", () => {
  function setup() {
    const plugin = {
      settings: {
        customProtocols: [
          { id: "myo", name: "Myo", abbreviation: "MYO", color: "#112233" },
        ],
      },
      saveSettings: jest.fn().mockResolvedValue(undefined),
    };
    const refresh = jest.fn();
    const section = new CustomProtocolsSettings(
      app,
      plugin as unknown as WorkoutPluginContext,
      refresh,
    );
    return { plugin, refresh, list: listOf(section.definitions()) };
  }

  it("explains what a built-in protocol is for under its entry", () => {
    const section = new CustomProtocolsSettings(
      app,
      {
        settings: {
          customProtocols: [
            defaultProtocolEntries()[1],
            { ...defaultProtocolEntries()[1], id: "x", name: "Stripping" },
            { ...defaultProtocolEntries()[2], name: "Myo-reps (mine)" },
          ],
        },
      } as unknown as WorkoutPluginContext,
      jest.fn(),
    );

    const [drop, other, renamed] = listOf(section.definitions()).items.map(
      (i) => (i.desc as DocumentFragment).textContent,
    );

    expect(drop).toContain(t("settings.protocolHelp.dropSet"));
    expect(other).not.toContain(t("settings.protocolHelp.dropSet"));
    expect(renamed).not.toContain(t("settings.protocolHelp.myoReps"));
  });

  it("titles the list so its add button has a header row", () => {
    expect(setup().list.heading).toBe(t("settings.sections.customProtocols"));
  });

  it("titles the form by whether it adds or edits a protocol", () => {
    const { list } = setup();
    const adding = captureModal(() => list.addItem!.action(document.body));
    const editing = captureModal(() =>
      list.items![0].action!(document.body),
    );

    expect(adding.titleEl.textContent).toBe(t("settings.buttons.addProtocol"));
    expect(editing.titleEl.textContent).toBe(
      t("settings.tooltips.editProtocol"),
    );
  });

  it("deletes a protocol once the user confirms", async () => {
    const { plugin, refresh, list } = setup();
    confirms.length = 0;

    list.onDelete!(0);
    expect(plugin.settings.customProtocols).toHaveLength(1);
    await confirms[0]();

    expect(plugin.settings.customProtocols).toHaveLength(0);
    expect(plugin.saveSettings).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("adds a protocol from the form and redraws", async () => {
    const { plugin, refresh, list } = setup();
    const modal = captureModal(() => list.addItem!.action(document.body));
    const form = modal.contentEl;

    await mockSettingNamed(form, t("settings.labels.protocolName"))
      .component("text")
      .change("Rest pause" as never);
    await mockSettingNamed(form, t("settings.labels.protocolAbbreviation"))
      .component("text")
      .change("rp" as never);
    await mockSettingNamed(form, t("settings.labels.protocolColor"))
      .component("color")
      .change("#abcdef" as never);
    const save = Array.from(form.querySelectorAll("button")).find(
      (b) => b.textContent === t("settings.buttons.saveProtocol"),
    )!;
    save.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(plugin.settings.customProtocols.map((p) => p.id)).toEqual([
      "myo",
      "rest_pause",
    ]);
    expect(plugin.settings.customProtocols[1].abbreviation).toBe("RP");
    expect(refresh).toHaveBeenCalled();
  });

  it("refuses a new protocol whose name gives the id of one in the list", async () => {
    const { plugin, refresh, list } = setup();
    const modal = captureModal(() => list.addItem!.action(document.body));
    const form = modal.contentEl;

    await mockSettingNamed(form, t("settings.labels.protocolName"))
      .component("text")
      .change("MYO" as never);
    await mockSettingNamed(form, t("settings.labels.protocolAbbreviation"))
      .component("text")
      .change("MY" as never);
    Array.from(form.querySelectorAll("button"))
      .find((b) => b.textContent === t("settings.buttons.saveProtocol"))!
      .click();
    await new Promise((r) => setTimeout(r, 0));

    expect(plugin.settings.customProtocols).toEqual([
      { id: "myo", name: "Myo", abbreviation: "MYO", color: "#112233" },
    ]);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("keeps the form open and saves nothing when the name is empty", async () => {
    const { plugin, refresh, list } = setup();
    const modal = captureModal(() => list.addItem!.action(document.body));
    const close = jest.spyOn(modal, "close");

    Array.from(modal.contentEl.querySelectorAll("button"))
      .find((b) => b.textContent === t("settings.buttons.saveProtocol"))!
      .click();
    await new Promise((r) => setTimeout(r, 0));

    expect(plugin.settings.customProtocols).toHaveLength(1);
    expect(refresh).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
});

describe("timer presets list", () => {
  function setup() {
    const plugin = {
      settings: {
        defaultTimerPreset: "rest" as string | null,
        timerPresets: {
          rest: {
            name: "rest",
            type: "countdown",
            duration: 90,
            showControls: true,
            sound: true,
          },
        } as Record<string, unknown>,
      },
      saveSettings: jest.fn().mockResolvedValue(undefined),
    };
    const refresh = jest.fn();
    const section = new TimerPresetsSettings(
      app,
      plugin as unknown as WorkoutPluginContext,
      refresh,
    );
    return { plugin, refresh, definitions: section.definitions() };
  }

  it("explains a built-in preset under its entry", () => {
    const { plugin } = setup();
    plugin.settings.timerPresets = withDefaultTimerPresets(
      plugin.settings.timerPresets as never,
    ) as Record<string, unknown>;
    const section = new TimerPresetsSettings(
      app,
      plugin as unknown as WorkoutPluginContext,
      jest.fn(),
    );

    const items = listOf(section.definitions()).items!;

    expect(items.map((i) => i.name)).toEqual(["rest", "Tabata", "EMOM"]);
    expect((items[1].desc as DocumentFragment).textContent).toContain(
      t("settings.presetHelp.tabata"),
    );
    expect(typeof items[0].desc).toBe("string");
  });

  it("titles the list and the form", () => {
    const list = listOf(setup().definitions);
    const adding = captureModal(() => list.addItem!.action(document.body));
    const editing = captureModal(() =>
      list.items![0].action!(document.body),
    );

    expect(list.heading).toBe(t("settings.sections.timerPresets"));
    expect(adding.titleEl.textContent).toBe(t("settings.buttons.addPreset"));
    expect(editing.titleEl.textContent).toBe(t("settings.tooltips.editPreset"));
  });

  it("clears the default when its preset is deleted", async () => {
    const { plugin, refresh, definitions } = setup();
    confirms.length = 0;

    listOf(definitions).onDelete!(0);
    await confirms[0]();

    expect(plugin.settings.timerPresets).toEqual({});
    expect(plugin.settings.defaultTimerPreset).toBeNull();
    expect(refresh).toHaveBeenCalled();
  });

  it("offers the existing presets as the default and saves the choice", async () => {
    const { plugin, definitions } = setup();
    const container = withHelpers(document.createElement("div"));
    renderSettingDefinitions(container, definitions);

    const dropdown = mockSettingNamed(
      container,
      t("settings.labels.defaultTimerPreset"),
    ).component("dropdown");
    expect(Object.keys(dropdown.options)).toEqual(["", "rest"]);
    await dropdown.change("" as never);

    expect(plugin.settings.defaultTimerPreset).toBeNull();
  });

  it("renames a preset from the form and moves the default with it", async () => {
    const { plugin, refresh, definitions } = setup();
    const list = listOf(definitions);
    const modal = captureModal(() =>
      (list.items![0] as { action: (el: HTMLElement, i: number) => void }).action(
        document.body,
        0,
      ),
    );

    await mockSettingNamed(modal.contentEl, t("settings.labels.presetName"))
      .component("text")
      .change("long rest" as never);
    Array.from(modal.contentEl.querySelectorAll("button"))
      .find((b) => b.textContent === t("settings.buttons.savePreset"))!
      .click();
    await new Promise((r) => setTimeout(r, 0));

    expect(Object.keys(plugin.settings.timerPresets)).toEqual(["long rest"]);
    expect(plugin.settings.defaultTimerPreset).toBe("long rest");
    expect(refresh).toHaveBeenCalled();
  });
});

describe("training parameters", () => {
  it("saves a valid number and flags an invalid one", async () => {
    const plugin = {
      settings: {
        weightIncrement: 2.5,
        repDuration: 3,
        defaultRepsPerSet: 10,
        setDuration: 45,
      },
      saveSettings: jest.fn().mockResolvedValue(undefined),
    };
    const container = withHelpers(document.createElement("div"));
    renderSettingDefinitions(
      container,
      new DurationEstimationSettings(
        plugin as unknown as ConstructorParameters<
          typeof DurationEstimationSettings
        >[0],
      ).definitions(),
    );
    const row = mockSettingNamed(container, t("settings.labels.defaultRepsPerSet"));
    const error = row.controlEl.querySelector(".workout-setting-error")!;

    await row.component("text").change("0" as never);
    expect(plugin.settings.defaultRepsPerSet).toBe(0);
    expect(error.classList.contains("is-visible")).toBe(false);

    await row.component("text").change("abc" as never);
    expect(plugin.settings.defaultRepsPerSet).toBe(0);
    expect(error.classList.contains("is-visible")).toBe(true);
  });
});
