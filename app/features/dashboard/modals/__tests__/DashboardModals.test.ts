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
jest.mock("@app/utils/IdUtils", () => ({
  ...jest.requireActual("@app/utils/IdUtils"),
  generateCodeBlockId: () => "d1",
}));
import { InsertDashboardModal } from "@app/features/dashboard/modals/InsertDashboardModal";
import { EditDashboardModal } from "@app/features/dashboard/modals/EditDashboardModal";
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
      fenceLine,
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

  it("finds a block written without an id by its line and gives it one", async () => {
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
