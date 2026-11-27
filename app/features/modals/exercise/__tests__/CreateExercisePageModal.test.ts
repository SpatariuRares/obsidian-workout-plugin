/** @jest-environment jsdom */
import { App, Notice } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Notice: jest.fn(),
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { openWizard } from "@app/features/modals/base/__tests__/wizardHarness";
import { t } from "@app/i18n";

const TEMPLATE = "---\nexercise_name: \"\"\nexercise_type: strength\ntags: []\n---\n# Page\n";

function open(exerciseName?: string) {
  const create = jest.fn().mockResolvedValue(undefined);
  const w = openWizard(
    class extends CreateExercisePageModal {
      constructor(app: App, plugin: never) {
        super(app, plugin, exerciseName);
        (app as unknown as { vault: { create: unknown } }).vault.create = create;
      }
    } as never,
    {
      settings: { exerciseFolderPath: "Exercises", exerciseTypes: [] },
      templateGeneratorService: { getExercisePageTemplate: async () => TEMPLATE },
      getMuscleTagService: () => ({ tagMap: async () => new Map() }),
    },
  );
  return { ...w, create };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("CreateExercisePageModal", () => {
  it("has two steps with the shared stepper and counter", () => {
    const { visible, contentEl } = open();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelectorAll(".workout-wizard-step")).toHaveLength(2);
    expect(contentEl.querySelector(".workout-wizard-counter")?.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 2 }),
    );
  });

  it("blocks Next without a name, with an inline error and focus", () => {
    const { visible, next, exercise, contentEl } = open();

    next();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-error")?.textContent).toBe(
      t("modal.notices.exercisePageNameRequired"),
    );
    expect(document.activeElement).toBe(exercise());
  });

  it("blocks the second stepper tab while the name is empty", () => {
    const { tab, visible } = open();

    tab(2).click();

    expect(visible()).toEqual(["exercise"]);
  });

  it("keeps the typed name when going Back", () => {
    const { exercise, next, button, visible } = open();
    exercise().value = "Squat";
    next();
    button(t("wizard.back"))!.click();

    expect(visible()).toEqual(["exercise"]);
    expect(exercise().value).toBe("Squat");
  });

  it("creates the page in the chosen folder through the template writer", async () => {
    const { exercise, next, button, create } = open();
    exercise().value = "Bench: press";
    next();
    button(t("modal.buttons.createExercise"))!.click();
    await flush();

    expect(create).toHaveBeenCalledTimes(1);
    const [path, content] = create.mock.calls[0];
    expect(path).toBe("Exercises/Bench_ press.md");
    expect(content).toContain("Bench: press");
    expect(Notice).toHaveBeenCalledWith(t("modal.notices.exercisePageCreated"));
  });

  it("creates nothing when cancelled", () => {
    const { exercise, next, button, create, close } = open();
    exercise().value = "Squat";
    next();
    button(t("modal.buttons.cancel"))!.click();

    expect(close).toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
