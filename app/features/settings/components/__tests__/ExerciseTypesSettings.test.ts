/** @jest-environment jsdom */
import { Modal, mockSettingNamed } from "obsidian";
import type { App, SettingDefinitionItem, SettingDefinitionList } from "obsidian";
import { ExerciseTypesSettings } from "@app/features/settings/components/ExerciseTypesSettings";
import { t } from "@app/i18n";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

const confirms: Array<{ message: string; onConfirm: () => Promise<void> }> = [];
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: class {
    constructor(_app: unknown, message: string, onConfirm: () => Promise<void>) {
      confirms.push({ message, onConfirm });
    }
    open() {}
  },
}));

const app = {} as App;
const listOf = (items: SettingDefinitionItem[]) =>
  items.find((i): i is SettingDefinitionList => "type" in i && i.type === "list")!;

const climbing = (extra: Partial<CustomExerciseType> = {}): CustomExerciseType => ({
  id: "climbing",
  name: "Climbing",
  parameters: [{ key: "grade", label: "Grade", type: "string", required: true }],
  ...extra,
});

function setup(exerciseTypes: CustomExerciseType[]) {
  const plugin = {
    settings: { exerciseTypes },
    saveSettings: jest.fn().mockResolvedValue(undefined),
    getExerciseLibrary: () => ({
      pages: () => [
        { names: ["Lead"], type: "climbing" },
        { names: ["Bench Press"], type: "strength" },
      ],
    }),
  };
  const refresh = jest.fn();
  const section = new ExerciseTypesSettings(app, plugin as unknown as WorkoutPluginContext, refresh);
  return { plugin, refresh, section };
}

/** Opens the modal an action creates and returns it with its form drawn */
function captureModal(run: () => void): Modal & { onOpen(): void } {
  let opened: (Modal & { onOpen(): void }) | undefined;
  const spy = jest.spyOn(Modal.prototype, "open").mockImplementation(function (
    this: Modal & { onOpen(): void },
  ) {
    opened = this;
    this.onOpen();
  });
  run();
  spy.mockRestore();
  return opened!;
}

beforeEach(() => {
  confirms.length = 0;
});

describe("ExerciseTypesSettings", () => {
  it("lists the built-in types apart, and only the user's types not deleted", () => {
    const { section } = setup([climbing(), climbing({ id: "old", name: "Old", retired: true })]);
    const [builtIns] = section.definitions() as Array<{ items: Array<{ name: string }> }>;

    expect(builtIns.items.map((i) => i.name)).toContain(t("modal.selectOptions.strength"));
    expect(listOf(section.definitions()).items.map((i) => i.name)).toEqual(["Climbing"]);
  });

  it("says which exercises use a type before deleting it, then keeps it as deleted", async () => {
    const { plugin, section } = setup([climbing()]);

    listOf(section.definitions()).onDelete!(0);

    expect(confirms[0].message).toBe(
      t("settings.exerciseTypes.confirmDeleteUsed", { exercises: "Lead" }),
    );
    await confirms[0].onConfirm();
    expect(plugin.settings.exerciseTypes).toEqual([climbing({ retired: true })]);
    expect(plugin.saveSettings).toHaveBeenCalled();
  });

  it("makes a type with a new field, its key from the field's name", async () => {
    const { plugin, refresh, section } = setup([]);
    const add = listOf(section.definitions()).addItem!;
    const modal = captureModal(() => add.action(document.createElement("div")));
    const { contentEl } = modal as unknown as { contentEl: HTMLElement };

    await mockSettingNamed(contentEl, t("settings.exerciseTypes.name"))
      .component("text")
      .change("Rock climbing" as never);
    const newField = Array.from(
      contentEl.querySelectorAll<HTMLButtonElement>(".workout-exercise-type-add-buttons button"),
    ).find((b) => b.textContent === t("settings.exerciseTypes.newField"))!;
    newField.click();
    const label = contentEl.querySelector<HTMLInputElement>(".workout-exercise-type-field-name")!;
    label.value = "Max grade";
    label.dispatchEvent(new Event("input"));
    Array.from(contentEl.querySelectorAll<HTMLButtonElement>("button"))
      .find((b) => b.textContent === t("settings.exerciseTypes.save"))!
      .click();
    await new Promise((r) => setTimeout(r, 0));

    expect(plugin.settings.exerciseTypes).toEqual([
      {
        id: "rock_climbing",
        name: "Rock climbing",
        parameters: [{ key: "max_grade", label: "Max grade", type: "number", required: false }],
      },
    ]);
    expect(refresh).toHaveBeenCalled();
  });

  it("warns that a removed field keeps its logged values", () => {
    const { section } = setup([climbing()]);
    const item = listOf(section.definitions()).items[0];
    const modal = captureModal(() => item.action(document.createElement("div")));
    const { contentEl } = modal as unknown as { contentEl: HTMLElement };

    contentEl.querySelector<HTMLButtonElement>(".workout-delete-button")!.click();

    expect(contentEl.querySelector(".workout-exercise-type-removed")?.textContent).toBe(
      t("settings.exerciseTypes.removedWarning", { fields: "Grade" }),
    );
  });
});
