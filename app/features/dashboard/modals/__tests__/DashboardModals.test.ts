/** @jest-environment jsdom */
import { App, TFile } from "obsidian";

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
jest.mock("@app/utils/IdUtils", () => ({
  ...jest.requireActual("@app/utils/IdUtils"),
  generateCodeBlockId: () => "d1",
}));
// Confirming is the only way through: the mock confirms as it opens
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: class {
    constructor(
      _app: unknown,
      _message: string,
      private onConfirm: () => void,
    ) {}
    open() {
      this.onConfirm();
    }
  },
}));
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { EditDashboardModal } from "@app/features/dashboard/modals/EditDashboardModal";
import { EditWidgetModal } from "@app/features/dashboard/modals/EditWidgetModal";
import type {
  DashboardWidgetId,
  EmbeddedDashboardParams,
} from "@app/features/dashboard/types";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { t } from "@app/i18n";

const note = (...lines: string[]) => lines.join("\n");

function fakeApp(content = "") {
  const state = { content, inserted: "" };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({
        file: { path: "Stats.md", basename: "Stats" },
        editor: {
          getCursor: () => ({ line: 0, ch: 0 }),
          replaceRange: (text: string) => {
            state.inserted = text;
          },
        },
      }),
    },
    vault: {
      getAbstractFileByPath: (path: string) =>
        Object.assign(new TFile(), { path }),
      process: jest.fn(
        async (_file: unknown, fn: (c: string) => string) => {
          state.content = fn(state.content);
        },
      ),
    },
  } as unknown as App;
  return { app, state };
}

function form(modal: InsertDashboardModal, buttonText: string) {
  const contentEl = createObsidianContainer();
  // A checkbox fires change on click only when it is in the document
  document.body.appendChild(contentEl);
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();
  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find(
      (b) => b.getAttribute("aria-label") === text,
    )!;
  const row = (label: string) =>
    [
      ...contentEl.querySelectorAll<HTMLElement>(
        ".workout-dashboard-widget-row",
      ),
    ].find((el) => el.textContent === label)!;
  const checkbox = (label: string) =>
    row(label).querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;
  return {
    contentEl,
    checkbox,
    moveUp: (label: string) =>
      row(label)
        .querySelector<HTMLButtonElement>(
          `button[aria-label="${t("dashboard.modal.moveUp", { widget: label })}"]`,
        )!
        .click(),
    submit: () => button(buttonText).click(),
  };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("InsertDashboardModal", () => {
  it("inserts a block with only an id when every widget stays as it is", () => {
    const { app, state } = fakeApp();
    form(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    ).submit();

    expect(state.inserted).toBe(
      note("```workout-dashboard", "id: d1", "```", "", ""),
    );
  });

  it("lists the widgets when one is left out or moved", () => {
    const { app, state } = fakeApp();
    const f = form(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    );

    f.checkbox(t("dashboard.quickStats.title")).click();
    f.moveUp(t("general.muscleHeatMap"));
    f.moveUp(t("general.muscleHeatMap"));
    f.submit();

    const { params } = dashboardBlock.parse(
      state.inserted.split("\n").slice(1, -3).join("\n"),
    );
    expect(params.widgets?.slice(0, 3)).toEqual([
      "heatMap",
      "summary",
      "volume",
    ]);
    expect(params.widgets).not.toContain("quickStats");
  });

  const settingField = (contentEl: HTMLElement, label: string) =>
    [...contentEl.querySelectorAll<HTMLElement>(".workout-charts-form-group")]
      .find((group) => group.textContent?.includes(label))!
      .querySelector<HTMLInputElement>(".workout-number-field-input")!;

  it("shows a widget's setting as its own menu does, and writes it once changed", () => {
    const { app, state } = fakeApp();
    const f = form(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    );

    const limit = settingField(
      f.contentEl,
      t("dashboard.widgetModal.recentWorkoutsLimit"),
    );
    expect(limit.value).toBe("5");
    limit.value = "8";
    f.submit();

    expect(state.inserted).toBe(
      note("```workout-dashboard", "id: d1", "recentWorkoutsLimit: 8", "```", "", ""),
    );
  });

  it("inserts nothing while a setting is out of its limits, saying why under it", () => {
    const { app, state } = fakeApp();
    const f = form(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    );

    const days = settingField(
      f.contentEl,
      t("dashboard.widgetModal.volumeTrendDays"),
    );
    days.value = "0";
    f.submit();

    expect(state.inserted).toBe("");
    expect(days.getAttribute("aria-invalid")).toBe("true");
    expect(
      days
        .closest(".workout-charts-form-group")
        ?.querySelector(".workout-number-field-error")?.textContent,
    ).toBe(t("dashboard.widgetModal.numberRange", { min: 1, max: 365 }));
  });
});

describe("dragging a widget by its grip", () => {
  it("keeps following the pointer after the row has moved", () => {
    const { app, state } = fakeApp();
    const f = form(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    );
    const grip = f.contentEl.querySelector<HTMLElement>(
      ".workout-dashboard-widget-grip",
    )!;
    // jsdom lays nothing out: every row sits at y = 0, so any y > 0 is
    // below all of them. Real browsers drop the pointer capture once the
    // row moves, so the later events reach the document, not the grip.
    const pointer = (type: string, target: EventTarget) =>
      target.dispatchEvent(
        Object.assign(
          new MouseEvent(type, { bubbles: true, clientY: 500 }),
          {
            pointerId: 1,
          },
        ),
      );
    pointer("pointerdown", grip);
    pointer("pointermove", document);
    pointer("pointermove", document);
    pointer("pointerup", document);
    f.submit();

    const { params } = dashboardBlock.parse(
      state.inserted.split("\n").slice(1, -3).join("\n"),
    );
    expect(params.widgets?.[0]).toBe("quickStats");
    expect(params.widgets?.at(-1)).toBe("summary");
  });
});

describe("EditDashboardModal", () => {
  const OLD = note(
    "# my dashboard",
    "```workout-dashboard",
    "id: d1",
    "title: Overview",
    "widgets: [summary, heatMap, volume]",
    "```",
  );

  const open = (content: string, fenceLine?: number) => {
    const { app, state } = fakeApp(content);
    const lines = content.split("\n");
    const start = fenceLine ?? lines.indexOf("```workout-dashboard");
    const end = lines.indexOf("```", start + 1);
    const body = lines.slice(start + 1, end).join("\n");
    const modal = new EditDashboardModal(
      app,
      dashboardBlock.parse(body).params,
      {
        sourcePath: "Stats.md",
        matchWithoutId:
          fenceLine === undefined
            ? undefined
            : { body, lines: { start: fenceLine, end } },
      },
    );
    return {
      state,
      ...form(modal, t("modal.buttons.updateDashboard")),
    };
  };

  it("opens with only the block's widgets ticked", () => {
    const f = open(OLD);

    expect(f.checkbox(t("dashboard.quickStats.title")).checked).toBe(
      false,
    );
    expect(f.checkbox(t("dashboard.summary.title")).checked).toBe(
      true,
    );
  });

  it("leaves the block untouched when nothing changed", async () => {
    const f = open(OLD);

    f.submit();
    await flush();

    expect(f.state.content).toBe(OLD);
  });

  it("rewrites only the widget line when a widget is unticked", async () => {
    const f = open(OLD);

    f.checkbox(t("dashboard.summary.title")).click();
    f.submit();
    await flush();

    expect(f.state.content).toBe(
      OLD.replace(
        "widgets: [summary, heatMap, volume]",
        "widgets: [heatMap, volume]",
      ),
    );
  });

  it("finds a block written without an id by its body and lines and gives it one", async () => {
    const withoutId = note(
      "```workout-dashboard",
      "dateRange: 30",
      "```",
      "",
      "```workout-dashboard",
      "dateRange: 60",
      "```",
    );
    const g = open(withoutId, 4);

    g.checkbox(t("dashboard.summary.title")).click();
    g.submit();
    await flush();

    const [first, second] = g.state.content.split("\n\n");
    expect(first).toBe(
      note("```workout-dashboard", "dateRange: 30", "```"),
    );
    const { params } = dashboardBlock.parse(second);
    expect(params.id).toBe("d1");
    expect(params.dateRange).toBe(60);
    expect(params.widgets).not.toContain("summary");
  });
});

describe("dashboard modal, grid layout", () => {
  const inserted = (text: string) =>
    dashboardBlock.parse(text.split("\n").slice(1, -3).join("\n"))
      .params;

  const gridForm = (
    modal: InsertDashboardModal,
    buttonText: string,
  ) => {
    const f = form(modal, buttonText);
    const tile = (id: string) =>
      f.contentEl.querySelector<HTMLElement>(
        `.workout-grid-tile[data-widget="${id}"]`,
      );
    const key = (id: string, keyName: string, shiftKey = false) =>
      tile(id)!.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: keyName,
          shiftKey,
          bubbles: true,
        }),
      );
    const layoutSelect = f.contentEl.querySelector<HTMLSelectElement>(
      "select.workout-dashboard-layout",
    )!;
    const setLayout = (value: "list" | "grid") => {
      layoutSelect.value = value;
      layoutSelect.dispatchEvent(new Event("change"));
    };
    return { ...f, tile, key, setLayout };
  };

  it("packs the ticked widgets into the note's columns when switched to grid", () => {
    const { app, state } = fakeApp();
    // (900 + 16) / (280 + 16): three columns fit
    const f = gridForm(
      new InsertDashboardModal(app, {}, 900),
      t("modal.buttons.insertDashboard"),
    );

    f.setLayout("grid");
    f.submit();

    const params = inserted(state.inserted);
    expect(params.layout).toBe("grid");
    expect(params.columns).toBe(3);
    expect(params.widgets).toBeUndefined();
    expect(params["grid.summary"]).toEqual({
      column: 1,
      row: 1,
      width: 1,
      height: 1,
    });
    expect(params["grid.quickStats"]).toEqual({
      column: 2,
      row: 1,
      width: 1,
      height: 1,
    });
    // The heat map needs two columns: the rest of row 1 is too narrow
    expect(params["grid.heatMap"]).toEqual({
      column: 1,
      row: 2,
      width: 2,
      height: 1,
    });
  });

  it("asks for the columns when only one fits, as on a phone", () => {
    const { app } = fakeApp();
    const f = gridForm(
      new InsertDashboardModal(app, {}, 300),
      t("modal.buttons.insertDashboard"),
    );

    f.setLayout("grid");

    expect(
      f.contentEl.querySelector<HTMLInputElement>(
        "input.workout-dashboard-grid-columns",
      )?.value,
    ).toBe("2");
  });

  it("asks for the columns when it can't measure the note", () => {
    const { app } = fakeApp();
    const f = gridForm(
      new InsertDashboardModal(app),
      t("modal.buttons.insertDashboard"),
    );

    f.setLayout("grid");

    const columns = f.contentEl.querySelector<HTMLInputElement>(
      "input.workout-dashboard-grid-columns",
    );
    expect(columns?.value).toBe("2");
  });

  describe("editing a grid", () => {
    const GRID = note(
      "```workout-dashboard",
      "id: d1",
      "layout: grid",
      "columns: 2",
      "grid.summary: 1 1 1 1",
      "grid.recentWorkouts: 2 1 1 1",
      "```",
    );

    const openGrid = () => {
      const { app, state } = fakeApp(GRID);
      const params = dashboardBlock.parse(
        GRID.split("\n").slice(1, -1).join("\n"),
      ).params;
      const f = gridForm(
        new EditDashboardModal(app, params, { sourcePath: "Stats.md", noteWidth: 600 }),
        t("modal.buttons.updateDashboard"),
      );
      return { state, ...f };
    };

    it("moves a widget with the arrow keys, rewriting only its line", async () => {
      const f = openGrid();

      f.key("summary", "ArrowDown");
      f.submit();
      await flush();

      expect(f.state.content).toBe(
        GRID.replace(
          "grid.summary: 1 1 1 1",
          "grid.summary: 1 2 1 1",
        ),
      );
    });

    it("refuses to move a widget onto another", async () => {
      const f = openGrid();

      f.key("summary", "ArrowRight");
      f.submit();
      await flush();

      expect(f.state.content).toBe(GRID);
    });

    it("makes a widget taller with Shift and an arrow", async () => {
      const f = openGrid();

      f.key("summary", "ArrowDown", true);
      f.submit();
      await flush();

      expect(f.state.content).toBe(
        GRID.replace(
          "grid.summary: 1 1 1 1",
          "grid.summary: 1 1 1 2",
        ),
      );
    });

    it("sends a widget to the stash with Delete, and back to the first free spot with a click", async () => {
      const f = openGrid();

      f.key("summary", "Delete");
      expect(f.tile("summary")).toBeNull();
      const stashed = f.contentEl.querySelector<HTMLElement>(
        '.workout-grid-stash [data-widget="summary"]',
      )!;
      stashed.click();
      f.submit();
      await flush();

      expect(f.state.content).toBe(GRID);
    });

    it("takes a widget off with its × and moves the focus to it in the stash", async () => {
      const f = openGrid();

      f.tile("summary")!
        .querySelector<HTMLButtonElement>(
          ".workout-grid-tile-remove",
        )!
        .click();

      expect(f.tile("summary")).toBeNull();
      expect(
        document.activeElement?.getAttribute("data-widget"),
      ).toBe("summary");
      f.submit();
      await flush();
      expect(f.state.content).toBe(
        GRID.replace("grid.summary: 1 1 1 1\n", ""),
      );
    });

    it("keeps the saved columns in a note too narrow for them, so a move doesn't repack the grid", async () => {
      const { app, state } = fakeApp(GRID);
      const params = dashboardBlock.parse(
        GRID.split("\n").slice(1, -1).join("\n"),
      ).params;
      // 300px fit one column (a phone): the grid was made for two
      const f = gridForm(
        new EditDashboardModal(app, params, { sourcePath: "Stats.md", noteWidth: 300 }),
        t("modal.buttons.updateDashboard"),
      );

      expect(
        f.contentEl.querySelector<HTMLInputElement>(
          "input.workout-dashboard-grid-columns",
        )?.value,
      ).toBe("2");
      f.key("summary", "ArrowDown");
      f.submit();
      await flush();

      expect(state.content).toBe(
        GRID.replace(
          "grid.summary: 1 1 1 1",
          "grid.summary: 1 2 1 1",
        ),
      );
    });

    it("leaves the grid lines alone when only the title changes in a wider note", async () => {
      const { app, state } = fakeApp(GRID);
      const params = dashboardBlock.parse(
        GRID.split("\n").slice(1, -1).join("\n"),
      ).params;
      // 1300px fit four columns, the grid was saved for two
      const f = gridForm(
        new EditDashboardModal(app, params, { sourcePath: "Stats.md", noteWidth: 1300 }),
        t("modal.buttons.updateDashboard"),
      );
      const title = f.contentEl.querySelector<HTMLInputElement>(
        "input[type=text]",
      )!;

      title.value = "Legs";
      f.submit();
      await flush();

      // Only the new title line: columns and cells stay as saved
      expect(state.content).toBe(
        GRID.replace(
          "grid.recentWorkouts: 2 1 1 1\n```",
          "grid.recentWorkouts: 2 1 1 1\ntitle: Legs\n```",
        ),
      );
    });

    it("writes the widgets in reading order when switched back to list", async () => {
      const f = openGrid();

      f.setLayout("list");
      f.submit();
      await flush();

      expect(f.state.content).toBe(
        note(
          "```workout-dashboard",
          "id: d1",
          "widgets: [summary, recentWorkouts]",
          "```",
        ),
      );
    });
  });
});

describe("EditWidgetModal", () => {
  const open = (
    content: string,
    id: DashboardWidgetId,
    params: EmbeddedDashboardParams,
  ) => {
    const { app, state } = fakeApp(content);
    const modal = new EditWidgetModal(app, id, params, {
      sourcePath: "Stats.md",
    });
    const contentEl = createObsidianContainer();
    Object.assign(modal, { contentEl, close: jest.fn() });
    modal.onOpen();
    const button = (text: string) =>
      [...contentEl.querySelectorAll("button")].find(
        (b) => b.getAttribute("aria-label") === text,
      );
    return { state, contentEl, button };
  };

  it("writes only the widget's changed setting", async () => {
    const note0 = note("```workout-dashboard", "id: d1", "```");
    const { state, contentEl, button } = open(note0, "recentWorkouts", {
      id: "d1",
    });

    contentEl.querySelector<HTMLInputElement>(".workout-number-field-input")!.value = "8";
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toBe(
      note("```workout-dashboard", "id: d1", "recentWorkoutsLimit: 8", "```"),
    );
  });

  it("writes a choice only when it differs from the widget's default", async () => {
    const { state, contentEl, button } = open(
      note("```workout-dashboard", "id: d1", "```"),
      "heatMap",
      { id: "d1" },
    );
    const chip = (text: string) =>
      [...contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip")].find(
        (c) => c.textContent === text,
      )!;
    chip(t("timeperiods.month")).click();
    chip(t("dashboard.muscleHeatMap.metrics.sets")).click();
    chip(t("dashboard.muscleHeatMap.metrics.volume")).click(); // back to its default: not written
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toBe(
      note("```workout-dashboard", "id: d1", "heatMapTimeFrame: month", "```"),
    );
  });

  it("writes a toggle only when it differs from the widget's default", async () => {
    const { state, contentEl, button } = open(
      note("```workout-dashboard", "id: d1", "```"),
      "volume",
      { id: "d1" },
    );
    const toggle = contentEl.querySelector<HTMLInputElement>(
      "input[type=checkbox]",
    )!;
    toggle.checked = false;
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toBe(
      note("```workout-dashboard", "id: d1", "volumeShowBreakdown: false", "```"),
    );
  });

  it("leaves a number without a default empty, and writes it once filled", async () => {
    const { state, contentEl, button } = open(
      note("```workout-dashboard", "id: d1", "```"),
      "fileErrors",
      { id: "d1" },
    );
    const [maxItems, maxTags] = [
      ...contentEl.querySelectorAll<HTMLInputElement>(".workout-number-field-input"),
    ];
    expect(maxItems.value).toBe("");
    expect(maxItems.placeholder).toBe(t("dashboard.widgetModal.all"));
    expect(maxTags.value).toBe("3");
    maxItems.value = "10";
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toContain("fileErrorsMaxItems: 10");
  });

  it("writes the checked options of a list, and none when all are", async () => {
    const { state, contentEl, button } = open(
      note("```workout-dashboard", "id: d1", "```"),
      "quickStats",
      { id: "d1" },
    );
    const month = [...contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip")].find(
      (c) => c.textContent === t("dashboard.quickStats.month"),
    )!;
    expect(month.getAttribute("aria-pressed")).toBe("true");
    month.click();
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toContain("quickStatsPeriods: [week, year]");
    expect(state.content).not.toContain("quickStatsMetrics");
  });

  it("keeps a number out of its limits from being written, saying why under it", async () => {
    const note0 = note("```workout-dashboard", "id: d1", "recentWorkoutsLimit: 8", "```");
    const { state, contentEl, button } = open(note0, "recentWorkouts", {
      id: "d1",
      recentWorkoutsLimit: 8,
    });
    const input = contentEl.querySelector<HTMLInputElement>(".workout-number-field-input")!;
    input.value = "0";
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toBe(note0);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(contentEl.querySelector(".workout-number-field-error")?.textContent).toBe(
      t("dashboard.widgetModal.numberRange", { min: 1, max: 50 }),
    );
  });

  it("keeps a value above the form's max that the block already holds", async () => {
    const note0 = note(
      "```workout-dashboard",
      "id: d1",
      "recentWorkoutsLimit: 120",
      "volumeTrendDays: 30",
      "```",
    );
    const { state, contentEl, button } = open(note0, "recentWorkouts", {
      id: "d1",
      recentWorkoutsLimit: 120,
    });
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(contentEl.querySelector(".workout-number-field-error")?.textContent ?? "").toBe("");
    expect(state.content).toBe(note0);
  });

  it("asks for at least one option instead of writing an empty list", async () => {
    const note0 = note("```workout-dashboard", "id: d1", "```");
    const { state, contentEl, button } = open(note0, "quickActions", { id: "d1" });
    for (const chip of contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip")) chip.click();
    button(t("dashboard.widgetModal.update"))!.click();
    await flush();

    expect(state.content).toBe(note0);
    expect(contentEl.querySelector(".workout-chip-group-error")?.textContent).toBe(
      t("dashboard.widgetModal.pickOne"),
    );
  });

  it("ties a toggle's label to its checkbox", () => {
    const { contentEl } = open(note("```workout-dashboard", "id: d1", "```"), "volume", {
      id: "d1",
    });
    const box = contentEl.querySelector<HTMLInputElement>("input[type=checkbox]")!;

    expect(contentEl.querySelector(`label[for="${box.id}"]`)?.textContent).toBe(
      t("dashboard.widgetModal.volumeShowBreakdown"),
    );
  });

  it("removes the widget from a list, writing the ones left", async () => {
    const { state, button } = open(
      note("```workout-dashboard", "id: d1", "widgets: [summary, volume]", "```"),
      "volume",
      { id: "d1", widgets: ["summary", "volume"] },
    );

    button(t("dashboard.widgetModal.remove"))!.click();
    await flush();

    expect(state.content).toContain("widgets: [summary]");
  });

  it("removes the widget from a grid by dropping its line", async () => {
    const { state, button } = open(
      note(
        "```workout-dashboard",
        "id: d1",
        "layout: grid",
        "grid.summary: 1 1 2 1",
        "grid.volume: 1 2 2 2",
        "```",
      ),
      "volume",
      {
        id: "d1",
        layout: "grid",
        "grid.summary": { column: 1, row: 1, width: 2, height: 1 },
        "grid.volume": { column: 1, row: 2, width: 2, height: 2 },
      },
    );

    button(t("dashboard.widgetModal.remove"))!.click();
    await flush();

    expect(state.content).not.toContain("grid.volume");
    expect(state.content).toContain("grid.summary: 1 1 2 1");
  });

  it("does not offer to remove the last widget of a list", () => {
    const { button } = open("", "summary", {
      id: "d1",
      widgets: ["summary"],
    });

    expect(button(t("dashboard.widgetModal.remove"))).toBeUndefined();
  });
});
