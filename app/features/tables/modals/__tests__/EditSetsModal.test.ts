/** @jest-environment jsdom */
import { App, MarkdownView, Notice, TFile } from "obsidian";

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
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import type { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { LocalizationService, t } from "@app/i18n";

const FULL_NOTE = [
  "# Push Day",
  "```workout-sets",
  "id: ws-1",
  "exercise: Bench Press",
  "# warm-up and top set",
  "workout: Upper A",
  "sets: 4",
  "targetWeight: 85",
  "targetReps: 8",
  "warmups: 2",
  "rest: 90",
  "timer.sound: false",
  "```",
].join("\n");

function openEditModal(options?: {
  note?: string;
  params?: EmbeddedSetsParams;
  target?: Partial<EditTarget>;
  customProtocols?: CustomProtocolConfig[];
}) {
  const note = options?.note ?? FULL_NOTE;
  const noteState = { content: note };
  const body = /```workout-sets\n([\s\S]*?)```/.exec(note)?.[1] ?? "";
  const parsed = setsBlock.parse(body);
  const params = options?.params ?? { ...setsBlock.defaults, ...parsed.params };

  const activeView = Object.assign(new MarkdownView(), {
    file: { path: "Workouts/Push Day.md", basename: "Push Day" },
  });

  const process = jest.fn(async (_file: unknown, fn: (c: string) => string) => {
    noteState.content = fn(noteState.content);
  });

  const app = {
    workspace: {
      getActiveViewOfType: jest.fn(() => activeView),
      getActiveFile: jest.fn(() => activeView.file),
    },
    vault: {
      getMarkdownFiles: jest.fn(() => []),
      getAbstractFileByPath: jest.fn((path: string) =>
        Object.assign(new TFile(), { path }),
      ),
      process,
    },
    metadataCache: { getFileCache: jest.fn(() => null) },
  } as unknown as App;

  const pages = ["Bench Press", "Squat"].map((name) => ({
    file: { basename: name, path: `Exercises/${name}.md` },
    names: [name],
  }));

  const plugin = {
    app,
    settings: {
      weightUnit: "kg",
      timerPresets: {},
      defaultTimerPreset: null,
      recentExercises: [],
      customProtocols: options?.customProtocols ?? defaultProtocolEntries(),
    },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => pages, find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => pages.map((p) => p.file.basename),
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const target: EditTarget = {
    sourcePath: "Workouts/Push Day.md",
    invalidKeys: parsed.invalidKeys,
    ...options?.target,
  };

  const modal = new EditSetsModal(app, plugin, params, target);
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();

  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text) as
      | HTMLButtonElement
      | undefined;
  const field = (label: string) =>
    [...contentEl.querySelectorAll(".workout-field-with-adjust")]
      .find((el) => el.textContent?.includes(label))!
      .querySelector("input")!;
  const tab = (n: number) =>
    contentEl.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")[n - 1];
  const visible = () =>
    [...contentEl.querySelectorAll<HTMLElement>("[data-step-id]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.stepId);
  const exercise = () =>
    contentEl
      .querySelector<HTMLElement>("[data-step-id='exercise']")!
      .querySelector<HTMLInputElement>("input[type='text']")!;
  const update = () => button(t("modal.buttons.update"))!.click();

  return {
    modal,
    contentEl,
    close,
    noteState,
    process,
    button,
    field,
    tab,
    visible,
    exercise,
    update,
  };
}

function stepButtons(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")];
}

function actionButtons(root: HTMLElement): HTMLButtonElement[] {
  return [...root.querySelectorAll<HTMLButtonElement>(".workout-modal-actions button")];
}

function setFieldValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

beforeAll(() => {
  LocalizationService.initialize({} as never);
});

describe("EditSetsModal wizard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("prefills all 3 steps, unlocks stepper immediately on open, and shows Update beside Next on steps 1 and 2 and as primary on step 3", () => {
    const { contentEl, button, tab, visible, field } = openEditModal();

    expect(contentEl.querySelector("h2")?.textContent).toBe(t("sets.editBlock"));
    expect(visible()).toEqual(["exercise"]);

    const step1Inputs = contentEl.querySelectorAll<HTMLInputElement>("input[type='text']");
    expect(step1Inputs[0].value).toBe("Bench Press");
    expect(step1Inputs[1].value).toBe("Upper A");

    const steps = stepButtons(contentEl);
    expect(steps[1].disabled).toBe(false);
    expect(steps[2].disabled).toBe(false);

    // Step 1 footer: Next (primary) + Update + Cancel
    expect(button(t("modal.buttons.update"))).toBeDefined();
    expect(button(t("wizard.next"))).toBeDefined();
    const step1Actions = actionButtons(contentEl);
    expect(step1Actions.map((b) => b.textContent?.trim())).toEqual([
      t("wizard.next"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);

    // Jump directly to Step 2 via stepper
    tab(2).click();
    expect(visible()).toEqual(["plan"]);
    expect(field(t("modal.labels.plannedSets")).value).toBe("4");
    expect(field(t("modal.labels.targetWeight", { unit: "kg" })).value).toBe("85");
    expect(field(t("modal.labels.targetReps")).value).toBe("8");
    expect(field(t("modal.wizard.warmupSets")).value).toBe("2");

    const step2Actions = actionButtons(contentEl);
    expect(step2Actions.map((b) => b.textContent?.trim())).toEqual([
      t("wizard.back"),
      t("wizard.next"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);

    // Jump directly to Step 3 via stepper
    tab(3).click();
    expect(visible()).toEqual(["rest"]);
    expect(field(t("sets.restLabel")).value).toBe("90");
    const reviewText = contentEl.querySelector(".workout-wizard-review")?.textContent;
    expect(reviewText).toContain("Bench Press");
    expect(reviewText).toContain("Upper A");

    const step3Actions = actionButtons(contentEl);
    expect(step3Actions.map((b) => b.textContent?.trim())).toEqual([
      t("wizard.back"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);
  });

  it("leaves the note as it is when nothing changed, and quick-updates from Step 1 preserving comments", async () => {
    const noop = openEditModal();
    noop.tab(2).click();
    noop.tab(3).click();
    noop.update();
    await flush();
    expect(noop.noteState.content).toBe(FULL_NOTE);
    expect(noop.close).toHaveBeenCalledTimes(1);

    document.body.innerHTML = "";
    jest.clearAllMocks();

    const { contentEl, close, noteState, update } = openEditModal();
    const step1Inputs = contentEl.querySelectorAll<HTMLInputElement>("input[type='text']");
    setFieldValue(step1Inputs[1], "Push A");
    update();
    await flush();

    expect(noteState.content).toBe(FULL_NOTE.replace("workout: Upper A", "workout: Push A"));
    expect(Notice).toHaveBeenCalledWith(t("sets.blockUpdated"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("updates straight from step 1 with a changed exercise and from step 2 with a changed plan", async () => {
    const first = openEditModal();
    first.exercise().value = "Squat";
    first.update();
    await flush();
    expect(first.noteState.content).toBe(
      FULL_NOTE.replace("exercise: Bench Press", "exercise: Squat"),
    );

    document.body.innerHTML = "";
    jest.clearAllMocks();

    const second = openEditModal();
    second.tab(2).click();
    second.tab(3).click();
    second.tab(2).click();
    second.field(t("modal.labels.plannedSets")).value = "5";
    second.field(t("modal.labels.targetWeight", { unit: "kg" })).value = "0";
    second.update();
    await flush();

    expect(second.noteState.content).toBe(
      FULL_NOTE.replace("sets: 4\n", "sets: 5\n").replace("targetWeight: 85\n", ""),
    );
    expect(second.close).toHaveBeenCalledTimes(1);
  });

  it("patches only the rest changed on step 3, keeping comments", async () => {
    const { noteState, tab, field, update, close } = openEditModal();
    tab(3).click();

    field(t("sets.restLabel")).value = "120";
    update();
    await flush();

    expect(noteState.content).toBe(FULL_NOTE.replace("rest: 90", "rest: 120"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("blocks Update when exercise is missing or cleared on Step 1, then unlocks and patches once filled via autocomplete", async () => {
    const { contentEl, close, noteState, process, exercise, tab, update, visible } =
      openEditModal();

    setFieldValue(exercise(), "   ");

    expect(tab(2).disabled).toBe(true);
    expect(tab(3).disabled).toBe(true);

    update();
    await flush();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe(
      t("modal.notices.validChooseExercise"),
    );
    expect(exercise().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(exercise());
    expect(process).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(noteState.content).toBe(FULL_NOTE);

    // Pick suggestion via autocomplete (dispatches "change") -> clears error, unlocks steps, patches on Update
    exercise().value = "Squ";
    exercise().dispatchEvent(new Event("input", { bubbles: true }));
    contentEl
      .querySelector<HTMLElement>(".workout-exercise-autocomplete-suggestion")!
      .click();

    expect(exercise().value).toBe("Squat");
    expect(contentEl.querySelector(".workout-wizard-error")).toBeNull();
    expect(tab(2).disabled).toBe(false);
    expect(tab(3).disabled).toBe(false);

    update();
    await flush();

    expect(noteState.content).toBe(
      FULL_NOTE.replace("exercise: Bench Press", "exercise: Squat"),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("brings the user back to the exercise step when Update fails from Rest", async () => {
    const { noteState, exercise, tab, update, visible } = openEditModal();
    exercise().value = "";
    tab(3).click();

    update();
    await flush();

    expect(noteState.content).toBe(FULL_NOTE);
    expect(visible()).toEqual(["exercise"]);
  });

  it("closes without patching when Cancel is clicked", async () => {
    const { close, noteState, process, tab, field, button } = openEditModal();

    tab(2).click();
    setFieldValue(field(t("modal.labels.plannedSets")), "6");
    button(t("modal.buttons.cancel"))!.click();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    expect(process).not.toHaveBeenCalled();
    expect(noteState.content).toBe(FULL_NOTE);
  });

  it("writes a generated id when matchWithoutId is used and repairs invalidKeys", async () => {
    const noteWithoutId = [
      "# Push Day",
      "```workout-sets",
      "exercise: Bench Press",
      "# keep comment",
      "sets: 0",
      "rest: 90",
      "```",
    ].join("\n");
    const body = /```workout-sets\n([\s\S]*?)```/.exec(noteWithoutId)![1];

    const { close, noteState, tab, field, update } = openEditModal({
      note: noteWithoutId,
      target: { matchWithoutId: { body } },
    });

    tab(3).click();
    setFieldValue(field(t("sets.restLabel")), "75");
    update();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    expect(noteState.content).toContain("# keep comment");
    expect(noteState.content).toContain("rest: 75");
    expect(noteState.content).not.toContain("sets: 0");
    const updatedBody = /```workout-sets\n([\s\S]*?)```/.exec(noteState.content)![1];
    const reparsed = setsBlock.parse(updatedBody);
    expect(reparsed.params.id).toBeTruthy();
    expect(reparsed.errors).toEqual([]);
  });

  it("keeps a deleted protocol via optionsIncluding in edit mode and patches protocol changes cleanly", async () => {
    const note = [
      "# Push Day",
      "```workout-sets",
      "id: ws-del",
      "exercise: Leg Extension",
      "protocol: tempo",
      "sets: 3",
      "```",
    ].join("\n");

    const { close, noteState, button, update } = openEditModal({
      note,
      customProtocols: defaultProtocolEntries(),
    });

    const tempoChip = button("tempo")!;
    expect(tempoChip.getAttribute("aria-pressed")).toBe("true");

    button(t("modal.selectOptions.dropSet"))!.click();
    update();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    expect(noteState.content).toBe(note.replace("protocol: tempo", "protocol: drop_set"));
  });

  it("prefills Superset params across all 3 steps (including omitted protocol: superset) and patches only changed keys", async () => {
    const supersetNote = [
      "# Upper",
      "```workout-sets",
      "id: ws-ss",
      "exercises: [Bench Press, Bent Over Row]",
      "# paired push/pull",
      "sets: 4",
      "warmups: 1",
      "restBetween: 30",
      "rest: 120",
      "```",
    ].join("\n");

    const noop = openEditModal({ note: supersetNote });
    expect(
      noop.button(t("modal.selectOptions.superset"))!.getAttribute("aria-pressed"),
    ).toBe("true");
    const slots = noop.contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    expect([...slots].map((i) => i.value)).toEqual(["Bench Press", "Bent Over Row"]);

    noop.tab(2).click();
    expect(noop.field(t("modal.rounds")).value).toBe("4");
    expect(noop.field(t("modal.wizard.warmupRounds")).value).toBe("1");

    noop.tab(3).click();
    expect(noop.field(t("modal.wizard.restBetweenLabel")).value).toBe("30");
    expect(noop.field(t("modal.wizard.restRoundLabel")).value).toBe("120");

    noop.update();
    await flush();
    expect(noop.noteState.content).toBe(supersetNote);

    document.body.innerHTML = "";
    jest.clearAllMocks();

    const edit = openEditModal({ note: supersetNote });
    edit.contentEl
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.moveExerciseUp", { letter: "B" })}"]`,
      )!
      .click();
    edit.tab(3).click();
    setFieldValue(edit.field(t("modal.wizard.restBetweenLabel")), "45");
    edit.update();
    await flush();

    expect(edit.close).toHaveBeenCalledTimes(1);
    expect(edit.noteState.content).toBe(
      supersetNote
        .replace(
          "exercises: [Bench Press, Bent Over Row]",
          "exercises: [Bent Over Row, Bench Press]",
        )
        .replace("restBetween: 30", "restBetween: 45"),
    );
  });

  it("converts Single -> Superset cleanly via changesSince (removes exercise/targets, adds exercises/protocol/restBetween)", async () => {
    const { contentEl, close, noteState, process, tab, field, button, update } =
      openEditModal();

    button(t("modal.selectOptions.superset"))!.click();
    const slots = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    expect(slots[0].value).toBe("Bench Press");
    expect(document.activeElement).toBe(slots[1]);

    // Empty slot B blocks Update and focuses slot B
    update();
    await flush();
    expect(process).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(slots[1]);

    setFieldValue(slots[1], "Bent Over Row");
    tab(3).click();
    setFieldValue(field(t("modal.wizard.restBetweenLabel")), "30");
    setFieldValue(field(t("modal.wizard.restRoundLabel")), "120");

    update();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    const body = /```workout-sets\n([\s\S]*?)```/.exec(noteState.content)![1];
    const parsed = setsBlock.parse(body).params;
    expect(parsed).toEqual({
      id: "ws-1",
      exercises: ["Bench Press", "Bent Over Row"],
      protocol: "superset",
      workout: "Upper A",
      sets: 4,
      warmups: 2,
      restBetween: 30,
      rest: 120,
      "timer.sound": false,
    });
    expect(noteState.content).toContain("# warm-up and top set");
    expect(noteState.content).not.toContain("exercise:");
    expect(noteState.content).not.toContain("targetWeight:");
    expect(noteState.content).not.toContain("targetReps:");
  });

  it("converts Superset -> Single cleanly via changesSince (removes exercises/protocol/restBetween, adds exercise)", async () => {
    const supersetNote = [
      "# Upper",
      "```workout-sets",
      "id: ws-ss",
      "exercises: [Bench Press, Bent Over Row]",
      "protocol: superset",
      "# keep note",
      "sets: 4",
      "warmups: 1",
      "restBetween: 30",
      "rest: 120",
      "```",
    ].join("\n");

    const { close, noteState, button, exercise, update } = openEditModal({
      note: supersetNote,
    });

    button(t("modal.selectOptions.standard"))!.click();
    expect(exercise().value).toBe("Bench Press");

    update();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    const body = /```workout-sets\n([\s\S]*?)```/.exec(noteState.content)![1];
    expect(setsBlock.parse(body).params).toEqual({
      id: "ws-ss",
      exercise: "Bench Press",
      sets: 4,
      warmups: 1,
      rest: 120,
    });
    expect(noteState.content).toContain("# keep note");
    expect(noteState.content).not.toContain("exercises:");
    expect(noteState.content).not.toContain("protocol:");
    expect(noteState.content).not.toContain("restBetween:");
  });
});
