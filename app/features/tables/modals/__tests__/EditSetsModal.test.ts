/** @jest-environment jsdom */
import { App, MarkdownView, Notice, TFile } from "obsidian";
import { LocalizationService, t } from "@app/i18n";
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import type { CustomProtocolConfig } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

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
  const params = options?.params ?? parsed.params;

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

  return { modal, contentEl, close, noteState, process };
}

function stepButtons(root: HTMLElement): HTMLButtonElement[] {
  return [
    ...root.querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn"),
  ];
}

function actionButtons(root: HTMLElement): HTMLButtonElement[] {
  return [
    ...root.querySelectorAll<HTMLButtonElement>(".workout-modal-actions button"),
  ];
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`Button "${text}" not found`);
  return btn;
}

function adjustFieldInput(
  root: HTMLElement,
  labelText: string,
): HTMLInputElement {
  const container = [
    ...root.querySelectorAll<HTMLElement>(".workout-field-with-adjust"),
  ].find((el) => el.textContent?.includes(labelText));
  if (!container) throw new Error(`AdjustField "${labelText}" not found`);
  return container.querySelector<HTMLInputElement>("input")!;
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

describe("EditSetsModal", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("prefills all 3 steps, unlocks stepper immediately on open, and shows Update on every step", () => {
    const { contentEl } = openEditModal();

    expect(contentEl.querySelector("h2")?.textContent).toBe(
      t("sets.editBlock"),
    );

    // Step 1 prefill + immediate stepper reachability
    const step1Inputs = contentEl.querySelectorAll<HTMLInputElement>(
      "input[type='text']",
    );
    expect(step1Inputs[0].value).toBe("Bench Press");
    expect(step1Inputs[1].value).toBe("Upper A");

    const steps = stepButtons(contentEl);
    expect(steps[1].disabled).toBe(false);
    expect(steps[2].disabled).toBe(false);

    // Step 1 footer: Next (primary) + Update (secondary in others) + Cancel
    const step1Actions = actionButtons(contentEl);
    expect(step1Actions.map((b) => b.textContent?.trim())).toEqual([
      t("modal.buttons.next"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);
    expect(step1Actions[0].classList.contains("workout-btn-primary")).toBe(
      true,
    );
    expect(step1Actions[1].classList.contains("workout-btn-secondary")).toBe(
      true,
    );

    // Jump directly to Step 2 via stepper
    steps[1].click();
    expect(
      adjustFieldInput(contentEl, t("modal.labels.plannedSets")).value,
    ).toBe("4");
    expect(
      adjustFieldInput(
        contentEl,
        t("modal.labels.targetWeight", { unit: "kg" }),
      ).value,
    ).toBe("85");
    expect(
      adjustFieldInput(contentEl, t("modal.labels.targetReps")).value,
    ).toBe("8");

    // Step 2 footer: Back + Next (primary) + Update (secondary) + Cancel
    const step2Actions = actionButtons(contentEl);
    expect(step2Actions.map((b) => b.textContent?.trim())).toEqual([
      t("modal.buttons.back"),
      t("modal.buttons.next"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);
    expect(step2Actions[1].classList.contains("workout-btn-primary")).toBe(
      true,
    );
    expect(step2Actions[2].classList.contains("workout-btn-secondary")).toBe(
      true,
    );

    // Jump directly to Step 3 via stepper
    stepButtons(contentEl)[2].click();
    expect(adjustFieldInput(contentEl, t("sets.restLabel")).value).toBe("90");
    const reviewText = contentEl.querySelector(
      ".workout-wizard-review-inset",
    )?.textContent;
    expect(reviewText).toContain("Bench Press");
    expect(reviewText).toContain("Upper A");

    // Step 3 footer: Back + Update (primary, no duplicate) + Cancel
    const step3Actions = actionButtons(contentEl);
    expect(step3Actions.map((b) => b.textContent?.trim())).toEqual([
      t("modal.buttons.back"),
      t("modal.buttons.update"),
      t("modal.buttons.cancel"),
    ]);
    expect(step3Actions[1].classList.contains("workout-btn-primary")).toBe(
      true,
    );
  });

  it("quick-updates from Step 1 preserving comments, key order, and untouched keys", async () => {
    const { contentEl, close, noteState } = openEditModal();

    const step1Inputs = contentEl.querySelectorAll<HTMLInputElement>(
      "input[type='text']",
    );
    setFieldValue(step1Inputs[1], "Push A");

    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(noteState.content).toBe(
      FULL_NOTE.replace("workout: Upper A", "workout: Push A"),
    );
    expect(Notice).toHaveBeenCalledWith(t("sets.blockUpdated"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("snapshots formAtOpen once on open and quick-updates from Step 2 across footer re-renders", async () => {
    const { contentEl, close, noteState } = openEditModal();

    // Navigate Step 1 -> Step 2 -> Step 3 -> Step 2 so footer re-renders multiple times
    stepButtons(contentEl)[1].click();
    stepButtons(contentEl)[2].click();
    stepButtons(contentEl)[1].click();

    setFieldValue(adjustFieldInput(contentEl, t("modal.labels.plannedSets")), "5");
    setFieldValue(
      adjustFieldInput(
        contentEl,
        t("modal.labels.targetWeight", { unit: "kg" }),
      ),
      "0",
    );

    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(noteState.content).toBe(
      FULL_NOTE.replace("sets: 4\n", "sets: 5\n").replace(
        "targetWeight: 85\n",
        "",
      ),
    );
    expect(Notice).toHaveBeenCalledWith(t("sets.blockUpdated"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("updates from Step 3 without disturbing untouched keys, and leaves block untouched on no-op", async () => {
    const first = openEditModal();
    stepButtons(first.contentEl)[2].click();
    setFieldValue(adjustFieldInput(first.contentEl, t("sets.restLabel")), "120");
    buttonByText(first.contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(first.noteState.content).toBe(
      FULL_NOTE.replace("rest: 90", "rest: 120"),
    );
    expect(first.close).toHaveBeenCalledTimes(1);

    document.body.innerHTML = "";
    jest.clearAllMocks();

    const second = openEditModal();
    stepButtons(second.contentEl)[1].click();
    stepButtons(second.contentEl)[2].click();
    buttonByText(second.contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(second.noteState.content).toBe(FULL_NOTE);
    expect(second.close).toHaveBeenCalledTimes(1);
  });

  it("blocks Update when exercise is missing or cleared on Step 1, then unlocks and patches once filled", async () => {
    const { contentEl, close, noteState, process } = openEditModal();

    const exerciseInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(exerciseInput, "   ");

    // Stepper locks future steps when Step 1 is incomplete
    expect(stepButtons(contentEl)[1].disabled).toBe(true);
    expect(stepButtons(contentEl)[2].disabled).toBe(true);

    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    const errorEl = contentEl.querySelector<HTMLElement>(".workout-field-error");
    expect(errorEl?.hidden).toBe(false);
    expect(errorEl?.textContent).toBe(t("modal.notices.validChooseExercise"));
    expect(exerciseInput.getAttribute("aria-invalid")).toBe("true");
    expect(exerciseInput.parentElement?.classList.contains("is-invalid")).toBe(
      true,
    );
    expect(document.activeElement).toBe(exerciseInput);
    expect(process).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
    expect(noteState.content).toBe(FULL_NOTE);

    // Pick suggestion via autocomplete (dispatches "change") -> clears error, unlocks steps, patches on Update
    exerciseInput.value = "Squ";
    exerciseInput.dispatchEvent(new Event("input", { bubbles: true }));
    contentEl
      .querySelector<HTMLElement>(".workout-exercise-autocomplete-suggestion")!
      .click();

    expect(exerciseInput.value).toBe("Squat");
    expect(errorEl?.hidden).toBe(true);
    expect(stepButtons(contentEl)[1].disabled).toBe(false);
    expect(stepButtons(contentEl)[2].disabled).toBe(false);

    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(noteState.content).toBe(
      FULL_NOTE.replace("exercise: Bench Press", "exercise: Squat"),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("closes without patching when Cancel is clicked", async () => {
    const { contentEl, close, noteState, process } = openEditModal();

    stepButtons(contentEl)[1].click();
    setFieldValue(adjustFieldInput(contentEl, t("modal.labels.plannedSets")), "6");
    buttonByText(contentEl, t("modal.buttons.cancel")).click();
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

    const { contentEl, close, noteState } = openEditModal({
      note: noteWithoutId,
      target: { matchWithoutId: { body } },
    });

    stepButtons(contentEl)[2].click();
    setFieldValue(adjustFieldInput(contentEl, t("sets.restLabel")), "75");
    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    expect(noteState.content).toContain("# keep comment");
    expect(noteState.content).toContain("rest: 75");
    expect(noteState.content).not.toContain("sets: 0");
    const updatedBody = /```workout-sets\n([\s\S]*?)```/.exec(
      noteState.content,
    )![1];
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

    const { contentEl, close, noteState } = openEditModal({
      note,
      customProtocols: defaultProtocolEntries(),
    });

    const tempoChip = buttonByText(contentEl, "tempo");
    expect(tempoChip.getAttribute("aria-pressed")).toBe("true");

    // Switch to Drop set -> patches only protocol
    buttonByText(contentEl, t("modal.selectOptions.dropSet")).click();
    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();

    expect(close).toHaveBeenCalledTimes(1);
    expect(noteState.content).toBe(
      note.replace("protocol: tempo", "protocol: drop_set"),
    );
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

    // 1. No-op leaves block untouched (does not inject protocol: superset)
    const noop = openEditModal({ note: supersetNote });
    expect(
      buttonByText(noop.contentEl, t("modal.selectOptions.superset")).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
    const slots = noop.contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    expect([...slots].map((i) => i.value)).toEqual([
      "Bench Press",
      "Bent Over Row",
    ]);

    stepButtons(noop.contentEl)[1].click();
    expect(adjustFieldInput(noop.contentEl, t("modal.rounds")).value).toBe("4");
    expect(
      adjustFieldInput(noop.contentEl, t("modal.wizard.warmupRounds")).value,
    ).toBe("1");

    stepButtons(noop.contentEl)[2].click();
    expect(
      adjustFieldInput(noop.contentEl, t("modal.wizard.restBetweenLabel")).value,
    ).toBe("30");
    expect(
      adjustFieldInput(noop.contentEl, t("modal.wizard.restRoundLabel")).value,
    ).toBe("120");

    buttonByText(noop.contentEl, t("modal.buttons.update")).click();
    await flush();
    expect(noop.noteState.content).toBe(supersetNote);

    document.body.innerHTML = "";
    jest.clearAllMocks();

    // 2. Reorder exercises + change restBetween -> patches only those two
    const edit = openEditModal({ note: supersetNote });
    edit.contentEl
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.moveExerciseUp", { letter: "B" })}"]`,
      )!
      .click();
    stepButtons(edit.contentEl)[2].click();
    setFieldValue(
      adjustFieldInput(edit.contentEl, t("modal.wizard.restBetweenLabel")),
      "45",
    );
    buttonByText(edit.contentEl, t("modal.buttons.update")).click();
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

  it("converts Single -> Superset cleanly via changedParams (removes exercise/targets, adds exercises/protocol/restBetween)", async () => {
    const { contentEl, close, noteState, process } = openEditModal();

    buttonByText(contentEl, t("modal.selectOptions.superset")).click();
    const slots = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    expect(slots[0].value).toBe("Bench Press");
    expect(document.activeElement).toBe(slots[1]);

    // Empty slot B blocks Update and focuses slot B
    buttonByText(contentEl, t("modal.buttons.update")).click();
    await flush();
    expect(process).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(slots[1]);

    setFieldValue(slots[1], "Bent Over Row");
    stepButtons(contentEl)[2].click();
    setFieldValue(
      adjustFieldInput(contentEl, t("modal.wizard.restBetweenLabel")),
      "30",
    );
    setFieldValue(
      adjustFieldInput(contentEl, t("modal.wizard.restRoundLabel")),
      "120",
    );

    buttonByText(contentEl, t("modal.buttons.update")).click();
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

  it("converts Superset -> Single cleanly via changedParams (removes exercises/protocol/restBetween, adds exercise)", async () => {
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

    const { contentEl, close, noteState } = openEditModal({
      note: supersetNote,
    });

    buttonByText(contentEl, t("modal.selectOptions.standard")).click();
    const singleInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    expect(singleInput.value).toBe("Bench Press");

    buttonByText(contentEl, t("modal.buttons.update")).click();
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
