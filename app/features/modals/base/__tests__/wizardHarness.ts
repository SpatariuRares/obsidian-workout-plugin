import type { App } from "obsidian";
import { setsBlock } from "@app/features/tables/setsBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

/**
 * Opens a wizard modal in jsdom with a fake editor (what it inserts is
 * collected) and gives the handles its tests use. The test file must mock
 * obsidian's `Modal`.
 */
export function openWizard(
  ModalClass: new (app: App, plugin: WorkoutPluginContext) => unknown,
) {
  const inserted: string[] = [];
  const app = {
    workspace: {
      getActiveViewOfType: () => ({
        file: { path: "Leg day.md", basename: "Leg day" },
        editor: {
          getCursor: () => ({ line: 0, ch: 0 }),
          replaceRange: (code: string) => inserted.push(code),
        },
      }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { timerPresets: {}, defaultTimerPreset: null, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const modal = new ModalClass(app, plugin) as { onOpen(): void };
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();

  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text) as
      | HTMLButtonElement
      | undefined;
  const panel = (id: string) => contentEl.querySelector<HTMLElement>(`[data-step-id="${id}"]`)!;
  const visible = () =>
    [...contentEl.querySelectorAll<HTMLElement>("[data-step-id]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.stepId);
  const exercise = () => panel("exercise").querySelector<HTMLInputElement>("input[type='text']")!;
  const next = () => button(t("wizard.next"))!.click();
  const field = (label: string) =>
    [...contentEl.querySelectorAll(".workout-field-with-adjust")]
      .find((el) => el.textContent?.includes(label))!
      .querySelector("input")!;
  const tab = (n: number) =>
    contentEl.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")[n - 1];
  return { modal, contentEl, inserted, close, button, panel, visible, exercise, next, field, tab };
}

/** The block's parameters, read back with its schema */
export function blockParams(code: string) {
  const body = /```workout-sets\n([\s\S]*?)```/.exec(code)?.[1] ?? "";
  return setsBlock.parse(body).params;
}
