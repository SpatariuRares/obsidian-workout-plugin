import { DASHBOARD_WIDGET_IDS } from "@app/features/dashboard/types";
import {
  cellProps,
  minColumnsOf,
  widgetLabel,
} from "@app/features/dashboard/layout/dashboardGrid";
import { Icon } from "@app/components/atoms/Icon";
import { ICONS } from "@app/constants/ui.constants";
import {
  GridCell,
  moveTo,
  placeFirstFree,
  Placement,
  resizeTo,
} from "@app/features/dashboard/layout/gridLayout";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";

export interface GridEditorProps {
  columns: number;
  placements: Placement[];
  /** Tells the owner about a layout the user made (the editor keeps it) */
  onChange(placements: Placement[]): void;
}

type Drag =
  | {
      kind: "move";
      id: string;
      grab: { column: number; row: number };
    }
  | { kind: "resize"; id: string };

/**
 * The grid ("inventory") editor of the dashboard modal: one tile per placed
 * widget and a stash of the others. Tiles are dragged to move them, by their
 * corner to resize them, and work with the keyboard (arrows move,
 * Shift+arrows resize, Delete stashes). Every rule comes from gridLayout.
 */
export class GridEditor {
  private gridEl!: HTMLElement;
  private stashEl!: HTMLElement;
  /** The document listeners of a drag in progress */
  private dragListeners: AbortController | null = null;

  constructor(
    private readonly el: HTMLElement,
    private props: GridEditorProps,
  ) {
    this.render();
  }

  update(props: Partial<GridEditorProps>, focusId?: string): void {
    this.props = { ...this.props, ...props };
    this.render(focusId);
  }

  destroy(): void {
    this.dragListeners?.abort();
  }

  /** Keeps a new layout (null: refused, nothing changes) and redraws */
  private change(
    placements: Placement[] | null,
    focusId?: string,
  ): void {
    if (placements) {
      this.props = { ...this.props, placements };
      this.props.onChange(placements);
    }
    this.render(focusId);
  }

  private render(focusId?: string): void {
    const { columns, placements } = this.props;
    this.el.empty();
    const rows =
      Math.max(0, ...placements.map((p) => p.row + p.height - 1)) + 1;

    this.gridEl = this.el.createDiv({ cls: "workout-grid-editor" });
    DomUtils.setCssProps(this.gridEl, {
      "--workout-grid-columns": String(columns),
      "--workout-grid-rows": String(rows),
    });
    for (let row = 1; row <= rows; row++) {
      for (let column = 1; column <= columns; column++) {
        const cell = this.gridEl.createDiv({
          cls: "workout-grid-editor-cell",
          attr: { "aria-hidden": "true" },
        });
        place(cell, { column, row, width: 1, height: 1 });
      }
    }
    for (const placement of placements) this.renderTile(placement);

    this.stashEl = this.el.createDiv({ cls: "workout-grid-stash" });
    this.stashEl.createDiv({
      text: t("dashboard.modal.stash"),
      cls: "workout-grid-stash-title",
    });
    const stashed = DASHBOARD_WIDGET_IDS.filter(
      (id) => !placements.some((p) => p.id === id),
    );
    if (stashed.length === 0) {
      this.stashEl.createDiv({
        text: t("dashboard.modal.stashEmpty"),
        cls: "workout-grid-stash-empty",
      });
    }
    // Same columns as the grid: each widget takes the width it needs at least
    const itemsEl = this.stashEl.createDiv({
      cls: "workout-grid-stash-items",
    });
    DomUtils.setCssProps(itemsEl, {
      "--workout-grid-columns": String(columns),
    });
    for (const id of stashed) {
      const min = Math.min(minColumnsOf(id), columns);
      const item = itemsEl.createEl("button", {
        cls: "workout-grid-stash-item",
        attr: { type: "button", "data-widget": id },
      });
      DomUtils.setCssProps(item, {
        "--workout-cell-column": `span ${min}`,
      });
      item.createSpan({
        text: widgetLabel(id),
        cls: "workout-grid-tile-label",
      });
      item.createSpan({
        text:
          min === 1
            ? t("dashboard.modal.minOneColumn")
            : t("dashboard.modal.minColumns", {
                columns: String(min),
              }),
        cls: "workout-grid-size",
      });
      item.addEventListener("click", () =>
        this.change(
          placeFirstFree(
            this.props.placements,
            { id, width: minColumnsOf(id), height: 1 },
            this.props.columns,
          ),
          id,
        ),
      );
      item.addEventListener("pointerdown", (event) =>
        this.startDrag(event, {
          kind: "move",
          id,
          grab: { column: 0, row: 0 },
        }),
      );
    }

    if (focusId) {
      // The tile, or the widget in the stash once it was taken off
      this.el
        .querySelector<HTMLElement>(
          `.workout-grid-tile[data-widget="${focusId}"], .workout-grid-stash-item[data-widget="${focusId}"]`,
        )
        ?.focus();
    }
  }

  private remove(id: string): void {
    this.change(
      this.props.placements.filter((p) => p.id !== id),
      id,
    );
  }

  private renderTile(placement: Placement): void {
    const tile = this.gridEl.createDiv({
      cls: "workout-grid-tile",
      attr: {
        "data-widget": placement.id,
        tabindex: "0",
        role: "button",
        "aria-label": t("dashboard.modal.tile", {
          widget: widgetLabel(placement.id),
          column: String(placement.column),
          row: String(placement.row),
          width: String(placement.width),
          height: String(placement.height),
        }),
      },
    });
    place(tile, placement);
    tile.createSpan({
      text: widgetLabel(placement.id),
      cls: "workout-grid-tile-label",
    });
    tile.createSpan({
      text: t("dashboard.modal.size", {
        width: String(placement.width),
        height: String(placement.height),
      }),
      cls: "workout-grid-size",
    });
    const corner = tile.createSpan({
      cls: "workout-grid-tile-resize",
      attr: { "aria-hidden": "true" },
    });
    const removeBtn = tile.createEl("button", {
      cls: "workout-grid-tile-remove",
      attr: {
        type: "button",
        "aria-label": t("dashboard.modal.remove", {
          widget: widgetLabel(placement.id),
        }),
      },
    });
    Icon.create(removeBtn, { name: ICONS.ACTIONS.REMOVE });
    removeBtn.addEventListener("click", () =>
      this.remove(placement.id),
    );

    tile.addEventListener("keydown", (event) =>
      this.onKey(event, placement),
    );
    tile.addEventListener("pointerdown", (event) => {
      if (removeBtn.contains(event.target as Node)) return;
      // The drag cancels the default focus; Delete needs the tile focused
      tile.focus();
      if (event.target === corner) {
        this.startDrag(event, { kind: "resize", id: placement.id });
        return;
      }
      const cell = this.cellAt(event);
      this.startDrag(event, {
        kind: "move",
        id: placement.id,
        grab: {
          column: cell.column - placement.column,
          row: cell.row - placement.row,
        },
      });
    });
  }

  private onKey(event: KeyboardEvent, placement: Placement): void {
    const { columns, placements } = this.props;
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.remove(placement.id);
      return;
    }
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    const [dx, dy] = step;
    const next = event.shiftKey
      ? resizeTo(
          placements,
          placement.id,
          placement.width + dx,
          placement.height + dy,
          columns,
          minColumnsOf,
        )
      : moveTo(
          placements,
          placement.id,
          placement.column + dx,
          placement.row + dy,
          columns,
        );
    this.change(next, placement.id);
  }

  /** The cell under the pointer; rows past the grid count, for growing it */
  private cellAt(event: PointerEvent): {
    column: number;
    row: number;
  } {
    const box = this.gridEl.getBoundingClientRect();
    const rows = Number(
      this.gridEl.style.getPropertyValue("--workout-grid-rows") || 1,
    );
    const column = Math.floor(
      ((event.clientX - box.left) / Math.max(box.width, 1)) *
        this.props.columns,
    );
    const row = Math.floor(
      ((event.clientY - box.top) / Math.max(box.height, 1)) * rows,
    );
    return {
      column: Math.min(Math.max(column + 1, 1), this.props.columns),
      row: Math.max(row + 1, 1),
    };
  }

  /** The layout the pointer asks for, or null when it doesn't fit */
  private target(
    drag: Drag,
    event: PointerEvent,
  ): Placement[] | null {
    const { columns, placements } = this.props;
    const cell = this.cellAt(event);
    if (drag.kind === "resize") {
      const current = placements.find((p) => p.id === drag.id);
      if (!current) return null;
      return resizeTo(
        placements,
        drag.id,
        cell.column - current.column + 1,
        cell.row - current.row + 1,
        columns,
        minColumnsOf,
      );
    }
    return moveTo(
      placements,
      drag.id,
      cell.column - drag.grab.column,
      cell.row - drag.grab.row,
      columns,
      { width: Math.min(minColumnsOf(drag.id), columns), height: 1 },
    );
  }

  /** Whether a point is over the grid (a drop elsewhere changes nothing) */
  private overGrid(event: PointerEvent): boolean {
    const box = this.gridEl.getBoundingClientRect();
    return (
      event.clientX >= box.left &&
      event.clientX <= box.right &&
      event.clientY >= box.top &&
      event.clientY <= box.bottom
    );
  }

  /**
   * Follows the pointer with a preview of the tile, red where it doesn't
   * fit. The listeners sit on the document: re-rendering moves elements and
   * drops any pointer capture.
   */
  private startDrag(event: PointerEvent, drag: Drag): void {
    event.preventDefault();
    this.dragListeners?.abort();
    const listeners = new AbortController();
    this.dragListeners = listeners;
    const doc = this.el.ownerDocument;
    let preview: HTMLElement | null = null;
    let next: Placement[] | null = null;
    let moved = false;
    const start = { x: event.clientX, y: event.clientY };

    const onMove = (move: PointerEvent) => {
      // A few pixels of jitter are still a click
      if (
        !moved &&
        Math.hypot(move.clientX - start.x, move.clientY - start.y) < 5
      ) {
        return;
      }
      moved = true;
      next = this.target(drag, move);
      const shown = next?.find((p) => p.id === drag.id);
      preview ??= this.gridEl.createDiv({
        cls: "workout-grid-tile workout-grid-preview",
        attr: { "aria-hidden": "true" },
      });
      preview.classList.toggle("is-conflict", !next);
      if (shown) {
        place(preview, shown);
      } else {
        const cell = this.cellAt(move);
        place(preview, { ...cell, width: 1, height: 1 });
      }
    };
    const onEnd = (end: PointerEvent) => {
      listeners.abort();
      // The element under the finger: on touch, end.target stays the tile
      const under = doc.elementFromPoint?.(end.clientX, end.clientY);
      const onStash = under?.closest(".workout-grid-stash");
      if (moved && onStash && drag.kind === "move") {
        this.remove(drag.id);
      } else if (moved && this.overGrid(end)) {
        this.change(next, drag.id);
      } else {
        // A click, or a drop outside the grid: nothing changes
        preview?.remove();
      }
    };
    doc.addEventListener("pointermove", onMove, {
      signal: listeners.signal,
    });
    doc.addEventListener("pointerup", onEnd, {
      signal: listeners.signal,
    });
    doc.addEventListener("pointercancel", onEnd, {
      signal: listeners.signal,
    });
  }
}

/** Puts an element in its cells of the editor grid */
function place(el: HTMLElement, cell: GridCell): void {
  DomUtils.setCssProps(el, cellProps(cell));
}
