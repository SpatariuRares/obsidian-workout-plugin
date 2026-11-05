/** @jest-environment jsdom */
import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { ConvertExerciseDataModal } from "@app/features/exercise-conversion/ConvertExerciseDataModal";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { logRow } from "@app/types/__tests__/logRow";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";
import { exerciseTypeName } from "@app/constants/ui.constants";

const CLIMBING = {
  id: "climbing",
  name: "Rock climbing",
  parameters: [
    {
      key: "grade",
      label: "Grade",
      type: "number" as const,
      required: true,
    },
  ],
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function open(logs: WorkoutLogData[]) {
  const strength = getExerciseTypeById("strength")!;
  const plugin = {
    settings: { exerciseTypes: [CLIMBING] },
    getExerciseLibrary: () => ({ pages: () => [] }),
    getExerciseDefinitionService: () => ({
      getExerciseType: async () => strength,
      getParametersForExercise: async () => strength.parameters,
      getExerciseDefinition: async () => undefined,
    }),
    getWorkoutLogData: async () => logs,
    updateWorkoutLogEntry: jest.fn().mockResolvedValue(undefined),
    batchOperation: async (_op: string, fn: () => Promise<void>) =>
      fn(),
  };
  const modal = new ConvertExerciseDataModal(
    {} as App,
    plugin as unknown as WorkoutPluginContext,
  );
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();

  const input = contentEl.querySelector(
    "input[type='text']",
  ) as HTMLInputElement;
  input.value = "Bouldering";
  input.dispatchEvent(new Event("change"));
  await flush();

  const button = (label: string) =>
    [...contentEl.querySelectorAll("button")].find(
      (b) =>
        b.getAttribute("aria-label") === label ||
        b.textContent === label,
    ) as HTMLButtonElement;
  const chips = () =>
    [
      ...contentEl.querySelectorAll(
        ".workout-modal-type-chips button",
      ),
    ].map((chip) => chip.textContent);
  return { contentEl, plugin, button, chips };
}

describe("ConvertExerciseDataModal", () => {
  it("offers the user's own types and every type but the exercise's own", async () => {
    const { chips } = await open([
      logRow({ exercise: "Bouldering" }),
    ]);

    expect(chips()).toContain("Rock climbing");
    expect(chips()).toContain(
      exerciseTypeName(getExerciseTypeById("timed")!),
    );
    expect(chips()).not.toContain(
      exerciseTypeName(getExerciseTypeById("strength")!),
    );
  });

  it("converts the sets into a type of the user's own through a mapping", async () => {
    const { contentEl, plugin, button } = await open([
      logRow({ exercise: "Bouldering", reps: 6, weight: 10 }),
    ]);

    button("Rock climbing").click();
    expect(contentEl.textContent).toContain(
      t("convert.fieldMapping.empty"),
    );
    expect(button(t("common.convert")).disabled).toBe(true);

    button(t("convert.fieldMapping.addMapping")).click();
    const [from, to] = [
      ...contentEl.querySelectorAll<HTMLSelectElement>(
        ".workout-convert-mapping-row select",
      ),
    ];
    from.value = "reps";
    from.dispatchEvent(new Event("change"));
    expect(to.value).toBe("grade");
    expect(button(t("common.convert")).disabled).toBe(false);

    button(t("common.convert")).click();
    await flush();

    expect(plugin.updateWorkoutLogEntry).toHaveBeenCalledTimes(1);
    expect(
      plugin.updateWorkoutLogEntry.mock.calls[0][1],
    ).toMatchObject({
      reps: 0,
      weight: 0,
      customFields: { grade: 6 },
    });
  });

  it("says when the exercise has no sets to convert", async () => {
    const { contentEl, button } = await open([]);

    expect(contentEl.textContent).toContain(
      t("convert.preview.noEntries"),
    );
    button("Rock climbing").click();
    button(t("convert.fieldMapping.addMapping")).click();
    expect(button(t("common.convert")).disabled).toBe(true);
  });

  it("removes a mapping with its trash button", async () => {
    const { contentEl, button } = await open([
      logRow({ exercise: "Bouldering" }),
    ]);
    button("Rock climbing").click();
    button(t("convert.fieldMapping.addMapping")).click();
    expect(
      contentEl.querySelectorAll(".workout-convert-mapping-row"),
    ).toHaveLength(1);

    button(t("convert.fieldMapping.removeMapping")).click();

    expect(
      contentEl.querySelectorAll(".workout-convert-mapping-row"),
    ).toHaveLength(0);
    expect(button(t("common.convert")).disabled).toBe(true);
  });
});
