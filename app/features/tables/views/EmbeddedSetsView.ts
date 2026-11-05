import { MarkdownRenderChild, Notice } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { describeLastTime } from "@app/features/modals/log/LogHistory";
import { TableColumnResolver } from "@app/features/tables/business/TableColumnResolver";
import { TableRowProcessor } from "@app/features/tables/business/TableRowProcessor";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import type {
  BlockLocation,
  CodeBlockMatch,
} from "@app/services/editor/CodeBlockEditorService";
import { restBlockAction } from "@app/features/tables/modals/restBlockAction";
import { renderTargetSection } from "@app/features/tables/ui/TargetSection";
import { toEntry } from "@app/features/modals/base/logic/LogEntryDraft";
import { toLogEntryInput } from "@app/services/data/WorkoutLogCodec";
import {
  draftFromSet,
  emptyDraft,
  rowProtocol,
  rowToFormData,
  plannedSets,
  restOf,
  setRows,
  type SetDraft,
  type SetRow,
} from "@app/features/tables/business/setSheet";
import { setsBlock, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  TrainingHistory,
  localDay,
} from "@app/services/history/TrainingHistory";
import { fieldFor } from "@app/services/exercise/ExerciseFields";
import {
  ProtocolCatalog,
  isStandardProtocol,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { DeleteButton } from "@app/components/atoms/DeleteButton";
import { ProtocolBadge, type BadgeProtocol } from "@app/components/atoms/ProtocolBadge";
import { CheckToggle } from "@app/components/atoms/CheckToggle";
import { DisclosureToggle } from "@app/components/atoms/DisclosureToggle";
import { LiveRegion, type LiveRegionResult } from "@app/components/atoms/LiveRegion";
import { NumberField } from "@app/components/molecules/NumberField";
import { ProtocolPicker } from "@app/components/molecules/ProtocolPicker";
import { NotesField } from "@app/components/molecules/NotesField";
import { UndoNotice } from "@app/components/molecules/UndoNotice";
import { BlockCard } from "@app/components/molecules/BlockCard";
import { ICONS, mapColumnIdentifiersToLabels } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { PathUtils } from "@app/utils/PathUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogEntryInput, WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import { readNote } from "@app/features/session/business/sessionPlan";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { RestTimer } from "@app/features/timer/views/RestTimer";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import { t } from "@app/i18n";

/**
 * The `workout-sets` block: today's sets of one exercise as rows to fill in
 * and tick (see setSheet), under the rest timer that starts on each tick. What is logged comes from the log; what is typed
 * in rows not ticked yet lives only here, until the note is closed.
 */
export class EmbeddedSetsView extends BaseView {
  /**
   * @param activeTimers - The plugin's timers by block id, shared with the
   * `workout-timer` blocks so a section's rest runs on one timer
   */
  constructor(
    plugin: WorkoutPluginContext,
    private activeTimers: Map<string, EmbeddedTimerView>,
  ) {
    super(plugin);
  }

  /**
   * The block's render child. It draws on `render()`: the caller draws it
   * once, then on every log change (EventAwareRenderChild), like a table.
   * @param sourcePath - The note the block is written in: its workout and the sets' origin
   * @param editAction - The block's edit action (CodeBlockProcessorService), in its ⋮ menu
   * @param location - Where the block is written, for its rest timer's edit action
   */
  createSets(
    container: HTMLElement,
    params: EmbeddedSetsParams,
    sourcePath: string,
    editAction?: BlockMenuAction,
    location?: BlockLocation,
  ): SetSheet {
    return this.track(
      new SetSheet(
        container,
        this.plugin,
        new RestTimer(this.plugin, this.activeTimers),
        params,
        sourcePath,
        editAction,
        location,
        (error) => this.handleError(container, error),
      ),
    );
  }
}

/** What a drawn sheet knows, for its event handlers */
interface Drawn {
  rows: SetRow[];
  parameters: ParameterDefinition[];
  /** Each parameter's column, as the table names it ("Wgt (kg)") */
  columns: string[];
  /** The columns as the table's header shows them */
  labels: string[];
  protocols: ProtocolCatalog;
  /** The rest after each set; undefined with `rest: 0` */
  rest?: EmbeddedTimerParams;
  /** Today's sets, to tell whether a ticked row was planned or added */
  todayCount: number;
  planned: number;
}

/** Names of a sheet's controls, to focus them again after a redraw */
const FOCUS = {
  addSet: "add-set",
  field: (row: number, index: number) => `row-${row}-field-${index}`,
  check: (row: number) => `row-${row}-check`,
  details: (row: number) => `row-${row}-details`,
  protocol: (row: number) => `row-${row}-protocol`,
};

/** A row to fill in's place among the drafts: they come after today's sets */
const draftIndex = (row: SetRow, drawn: Pick<Drawn, "todayCount">): number =>
  row.number - 1 - drawn.todayCount;

/** A row's field to fill in, and how to show its error */
interface RowField {
  input: HTMLInputElement;
  setError: (message?: string) => void;
}

export class SetSheet extends MarkdownRenderChild {
  private readonly workout: string;
  /** Drafts of the rows to fill in, in row order */
  private drafts: SetDraft[] = [];
  private extraRows = 0;
  /** Row number whose protocol and notes are shown */
  private openRow?: number;
  /** Row number being logged, so a second tap doesn't log it twice */
  private saving?: number;
  private renders = 0;
  /** What render draws into; the live region beside it is never redrawn */
  private bodyEl?: HTMLElement;
  private live?: LiveRegionResult;
  /**
   * Focus keys to try after the next draw, first found wins: a redraw on a
   * log change would otherwise drop the focus on the note
   */
  private focusAfterRender: string[] = [];
  /** Say the progress after the next draw (a set was logged or taken back) */
  private announceAfterRender = false;

  constructor(
    containerEl: HTMLElement,
    private plugin: WorkoutPluginContext,
    private restTimer: RestTimer,
    private params: EmbeddedSetsParams,
    private sourcePath: string,
    private editAction: BlockMenuAction | undefined,
    private location: BlockLocation | undefined,
    private onError: (error: unknown) => void,
  ) {
    super(containerEl);
    this.workout = params.workout || PathUtils.noteName(sourcePath);
  }

  onunload(): void {
    this.restTimer.destroy();
  }

  /** How to find this block in its note: its id, else where it is written */
  private blockMatch(): CodeBlockMatch | undefined {
    return this.params.id ? { id: this.params.id } : this.location?.matchWithoutId();
  }

  /** The emptied element to draw into, next to the block's live region */
  private body(): HTMLElement {
    // Made once; again only if something emptied the block (an error message)
    if (this.bodyEl?.parentElement !== this.containerEl) {
      this.containerEl.empty();
      this.bodyEl = this.containerEl.createDiv();
      this.live = LiveRegion.create(this.containerEl);
    }
    this.bodyEl.empty();
    return this.bodyEl;
  }

  async render(): Promise<void> {
    const render = ++this.renders;
    const exercise = this.params.exercise;
    try {
      if (!exercise) {
        this.renderCard();
        return;
      }

      const [logs, parameters, note] = await Promise.all([
        this.plugin.getWorkoutLogData(),
        parametersOrNone(this.plugin, exercise),
        readNote(this.plugin.app.vault, this.sourcePath),
      ]);
      if (render !== this.renders) return;

      const today = localDay(new Date());
      const history = new TrainingHistory(logs);
      const todaysSets = history.setsOn(exercise, today, { workout: this.workout });
      const previous = history.previousDay(exercise, today);
      const input = {
        parameters,
        today: todaysSets,
        previous: previous?.sets ?? [],
        sets: this.params.sets,
        targetReps: this.params.targetReps,
        targetWeight: this.params.targetWeight,
        extraRows: this.extraRows,
      };
      const rows = setRows(input);
      const columns = parameters.map((p) => TableColumnResolver.formatParameterHeader(p));
      const drawn: Drawn = {
        rows,
        parameters,
        columns,
        labels: mapColumnIdentifiersToLabels(columns),
        protocols: new ProtocolCatalog(this.plugin.settings.customProtocols),
        rest: restOf(this.params, note, this.blockMatch()),
        todayCount: todaysSets.length,
        planned: plannedSets(input),
      };

      const progress = t("sets.progress", { done: todaysSets.length, sets: drawn.planned });
      const sheet = this.renderCard(exercise, progress, drawn.rest);
      if (drawn.rest) {
        this.restTimer.draw(sheet.createDiv({ cls: "workout-sets-rest" }), drawn.rest);
      }
      renderTargetSection(sheet, {
        plugin: this.plugin,
        params: this.params,
        schema: setsBlock,
        sourcePath: this.sourcePath,
        sets: history.setsOf(exercise),
        onTargetUpdated: (updated) => {
          this.params = updated;
          return this.render();
        },
      });
      if (previous) {
        sheet.createDiv({
          cls: "workout-sets-meta",
          text: describeLastTime(previous, parameters, this.plugin.settings.weightUnit),
        });
      }

      const table = sheet.createDiv({ cls: "workout-sets-rows" });
      DomUtils.setCssProps(table, {
        "--workout-sets-fields": String(Math.max(parameters.length, 1)),
      });
      this.renderColumns(table, drawn.labels);
      for (const row of rows) this.renderRow(table, row, drawn);

      const add = Button.create(BlockCard.footer(sheet), {
        text: t("sets.addSet"),
        icon: ICONS.ACTIONS.ADD,
        variant: BUTTONVARIANT.SECONDARY,
      });
      DomUtils.setFocusKey(add, FOCUS.addSet);
      Button.onClick(add, () => {
        this.extraRows++;
        this.focusAfterRender = [FOCUS.field(rows.length + 1, 0), FOCUS.check(rows.length + 1)];
        void this.render();
      });

      const focus = this.focusAfterRender;
      this.focusAfterRender = [];
      focus.some((key) => DomUtils.focusByKey(sheet, key));
      if (this.announceAfterRender) {
        this.announceAfterRender = false;
        this.live?.announce(progress);
      }
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * The block's card, with its top row: the exercise (or what to add) and,
   * always in the top right corner, the ⋮ menu `workout-log` has: go to the
   * exercise and edit this block.
   * @param progress - Text before the menu ("2/4 sets")
   */
  /** @param rest - The timer the block rests on, edited from its ⋮ menu */
  private renderCard(
    exercise?: string,
    progress?: string,
    rest?: EmbeddedTimerParams,
  ): HTMLElement {
    const { el, header } = BlockCard.create(this.body(), {
      title: exercise ?? t("sets.noExercise"),
      titleIsMessage: !exercise,
      meta: progress,
      className: "workout-sets",
    });
    ExerciseActionSelect.render(header, {
      exerciseName: exercise ?? "",
      plugin: this.plugin,
      edit: this.editAction,
      // Every option of the rest timer, written into this block
      more: rest
        ? [
            restBlockAction(
              this.plugin,
              this.sourcePath,
              { type: "workout-sets", params: this.params, match: () => this.location?.matchWithoutId() },
              rest,
            ),
          ]
        : [],
    });
    return el;
  }

  private renderColumns(table: HTMLElement, labels: string[]): void {
    const row = table.createDiv({
      cls: "workout-sets-columns",
      attr: { "aria-hidden": "true" },
    });
    for (const label of [t("sets.setColumn"), ...labels]) row.createSpan({ text: label });
  }

  private renderRow(table: HTMLElement, row: SetRow, drawn: Drawn): void {
    const el = table.createDiv({ cls: "workout-sets-row" });
    if (row.logged) {
      this.renderLoggedRow(el, row, row.logged, drawn);
      return;
    }

    const draft = this.draftOf(row, drawn);
    const open = this.openRow === row.number;
    if (open) el.addClass("is-open");
    const main = el.createDiv({ cls: "workout-sets-row-main" });
    this.renderNumber(main, row.number, drawn.protocols.resolve(rowProtocol(row, draft)));
    const log = () => void this.logRow(row, drawn, el, fields);
    const fields = drawn.parameters.map((param, index) =>
      this.renderInput(main, row, draft, param, drawn.labels[index], index, log),
    );

    this.renderDetailsToggle(
      main,
      row.number,
      open,
      !isStandardProtocol(rowProtocol(row, draft)) || !!draft.notes.trim(),
    );
    CheckToggle.create(main, {
      done: false,
      label: t("sets.logSet", { set: row.number }),
      focusKey: FOCUS.check(row.number),
      onClick: log,
    });

    if (open) {
      this.renderDetails(el, row.number, drawn.protocols, rowProtocol(row, draft), draft.notes, {
        onProtocol: (protocol) => {
          draft.protocol = protocol;
          this.focusAfterRender = [`${FOCUS.protocol(row.number)}-${protocol}`];
          void this.render();
        },
        onNotes: (notes) => {
          draft.notes = notes;
        },
        // Only a row added with "Add set" goes away; the planned ones stay
        onRemove: row.number > Math.max(drawn.planned, drawn.todayCount)
          ? () => this.removeRow(row, drawn)
          : undefined,
      });
    }
  }

  /**
   * A logged set: its values as the table shows them, the details to change
   * its protocol and notes, and the tick to take it back (it is deleted from
   * the log and its row goes back to fill in, with its values).
   */
  private renderLoggedRow(
    el: HTMLElement,
    row: SetRow,
    set: WorkoutLogData,
    drawn: Drawn,
  ): void {
    el.addClass("is-logged");
    const open = this.openRow === row.number;
    if (open) el.addClass("is-open");
    const main = el.createDiv({ cls: "workout-sets-row-main" });
    this.renderNumber(main, row.number, drawn.protocols.resolve(set.protocol));
    // The values as the table shows them (weight as entered, N/A…)
    TableRowProcessor.displayRow(set, drawn.columns).forEach((value, index) => {
      const cell = main.createDiv({ cls: "workout-sets-value" });
      cell.createSpan({ text: value, attr: { "aria-hidden": "true" } });
      // The column headers are hidden from screen readers: each value says its field
      cell.createSpan({
        cls: "workout-visually-hidden",
        text: t("sets.valueOfSet", { field: drawn.labels[index], set: row.number, value }),
      });
    });
    this.renderDetailsToggle(
      main,
      row.number,
      open,
      !isStandardProtocol(set.protocol) || !!set.notes?.trim(),
    );
    CheckToggle.create(main, {
      done: true,
      label: t("sets.unlogSet", { set: row.number }),
      focusKey: FOCUS.check(row.number),
      onClick: () => void this.unlogRow(row, set, drawn),
    });

    if (open) {
      const save = (change: Partial<LogEntryInput>) =>
        this.plugin
          .updateWorkoutLogEntry(set, { ...toLogEntryInput(set), ...change })
          .catch((error: unknown) => this.notifyError(error));
      this.renderDetails(el, row.number, drawn.protocols, protocolId(set.protocol), set.notes ?? "", {
        onProtocol: (protocol) => {
          this.focusAfterRender = [`${FOCUS.protocol(row.number)}-${protocol}`];
          void save({ protocol });
        },
        onNotes: (notes) => {
          if (notes.trim() !== (set.notes ?? "").trim()) void save({ notes: notes.trim() });
        },
        notesOn: "change",
      });
    } else if (set.notes) {
      el.createDiv({ cls: "workout-sets-note workout-sets-meta", text: set.notes });
    }
  }

  /** The chevron that shows the row's protocol and notes */
  private renderDetailsToggle(
    main: HTMLElement,
    number: number,
    open: boolean,
    hasDetails: boolean,
  ): void {
    const key = FOCUS.details(number);
    DisclosureToggle.create(main, {
      expanded: open,
      label: t("sets.details", { set: number }),
      marked: hasDetails,
      focusKey: key,
      onToggle: () => {
        this.openRow = open ? undefined : number;
        this.focusAfterRender = [key];
        void this.render();
      },
    });
  }

  private renderNumber(main: HTMLElement, number: number, protocol: BadgeProtocol): void {
    ProtocolBadge.forProtocol(
      main.createDiv({ cls: "workout-sets-number", text: String(number) }),
      protocol,
    );
  }

  /**
   * A row's field: a checkbox for a yes/no parameter, else a NumberField
   * with last time's value as its suggestion
   * @param onEnter - Enter in the field logs the row
   */
  private renderInput(
    main: HTMLElement,
    row: SetRow,
    draft: SetDraft,
    param: ParameterDefinition,
    column: string,
    index: number,
    onEnter: () => void,
  ): RowField {
    const label = t("sets.fieldOfSet", { field: column, set: row.number });
    const focusKey = FOCUS.field(row.number, index);
    if (param.type === "boolean") {
      const cell = main.createDiv({ cls: "workout-sets-field" });
      const box = cell.createEl("input", {
        attr: { type: "checkbox", "aria-label": label },
      });
      DomUtils.setFocusKey(box, focusKey);
      box.checked = draft.values[param.key] === "true";
      box.addEventListener("change", () => {
        draft.values[param.key] = box.checked ? "true" : "";
      });
      return {
        input: box,
        setError: (message) => box.toggleAttribute("aria-invalid", !!message),
      };
    }

    return NumberField.create(main, {
      className: "workout-sets-field",
      label,
      value: draft.values[param.key],
      suggestion: row.placeholders[param.key],
      integer: param.type === "number" && fieldFor(param).integer,
      focusKey,
      onInput: (value) => {
        draft.values[param.key] = value;
      },
      onEnter,
    });
  }

  /**
   * The row's protocol chips and notes
   * @param notesOn - When the notes are handed over: on each key (a draft),
   * or once they are left ("change", a logged set saved to the log)
   * @param onRemove - Shows "Remove set", for a row the user added
   */
  private renderDetails(
    el: HTMLElement,
    number: number,
    catalog: ProtocolCatalog,
    current: string,
    notesValue: string,
    {
      onProtocol,
      onNotes,
      notesOn = "input",
      onRemove,
    }: {
      onProtocol: (protocol: string) => void;
      onNotes: (notes: string) => void;
      notesOn?: "input" | "change";
      onRemove?: () => void;
    },
  ): void {
    const details = el.createDiv({ cls: "workout-sets-details" });
    // A suggestion no longer in the settings list still shows (and stays)
    const protocols = catalog.optionsIncluding(current);
    ProtocolPicker.create(details, {
      label: t("sets.protocol"),
      options: protocols,
      selected: current,
      onPick: onProtocol,
      focusKeyPrefix: FOCUS.protocol(number),
    });
    NotesField.create(details, {
      label: t("sets.notes"),
      value: notesValue,
      saveOn: notesOn,
      onChange: onNotes,
    });

    if (onRemove) {
      DeleteButton.create(details, {
        label: t("sets.removeSet"),
        onClick: onRemove,
        className: "workout-sets-remove",
      });
    }
  }

  /**
   * Takes back a row added with "Add set", with what was typed in it; the
   * rows after it keep their drafts. Nothing is logged, so nothing to undo.
   */
  private removeRow(row: SetRow, drawn: Drawn): void {
    this.drafts.splice(draftIndex(row, drawn), 1);
    this.extraRows = Math.max(this.extraRows - 1, 0);
    this.openRow = undefined;
    this.focusAfterRender = [FOCUS.addSet];
    void this.render();
  }

  /** Logs a row: its typed values, else its placeholders */
  private async logRow(
    row: SetRow,
    drawn: Drawn,
    el: HTMLElement,
    fields: RowField[],
  ): Promise<void> {
    const exercise = this.params.exercise;
    if (!exercise || this.saving !== undefined) return;
    const draft = this.draftOf(row, drawn);
    const result = rowToFormData(row, draft, {
      exercise,
      workout: this.workout,
      parameters: drawn.parameters,
    });
    for (const field of fields) field.setError();
    el.querySelector(":scope > .workout-field-error")?.remove();
    if ("error" in result) {
      const field = fields[drawn.parameters.findIndex((p) => p.key === result.error.field)];
      field?.setError(result.error.message);
      // A NumberField shows its own message; a checkbox or no field, under the row
      if (field?.input.type !== "text") {
        el.createDiv({ cls: "workout-field-error", text: result.error.message, attr: { role: "alert" } });
      }
      field?.input.focus();
      return;
    }

    // Out of the drafts before the set is added: the log:added redraw
    // already shows it as logged, and the rows after it keep their drafts
    const restore = this.snapshot();
    this.drafts.splice(draftIndex(row, drawn), 1);
    if (drawn.todayCount >= drawn.planned) this.extraRows = Math.max(this.extraRows - 1, 0);
    if (this.openRow === row.number) this.openRow = undefined;
    else if (this.openRow !== undefined && this.openRow > row.number) this.openRow--;
    this.saving = row.number;
    // After the log:added redraw: the next row to fill in, else "Add set"
    this.focusAfterRender = [FOCUS.field(row.number + 1, 0), FOCUS.check(row.number + 1), FOCUS.addSet];
    this.announceAfterRender = true;
    try {
      await this.plugin.addWorkoutLogEntry(
        toEntry(result.data, {
          now: new Date(),
          pageLink: PathUtils.toWikiLink(this.sourcePath),
        }),
      );
      // The log:added redraw (EventAwareRenderChild) shows it logged; the
      // rest starts, unless that was the last row to fill in
      const rowsLeft = drawn.rows.filter((r) => !r.logged).length - 1;
      if (drawn.rest && rowsLeft > 0) this.restTimer.restart(drawn.rest);
    } catch (error) {
      await this.rollBack(restore, error);
    } finally {
      this.saving = undefined;
    }
  }

  /**
   * Takes a logged set back: deletes it from the log, and its values become
   * the first row to fill in, so ticking it again logs the same set. A
   * notice offers to undo, which puts the very set back (same timestamp, so
   * the same place in the set order).
   */
  private async unlogRow(row: SetRow, set: WorkoutLogData, drawn: Drawn): Promise<void> {
    if (this.saving !== undefined) return;
    // The inverse of logRow: the draft is in place before the log:deleted
    // redraw, and a set beyond the plan keeps its row
    const restore = this.snapshot();
    const draft = draftFromSet(set, drawn.parameters);
    const keepsRow = drawn.todayCount > drawn.planned;
    this.drafts.unshift(draft);
    if (keepsRow) this.extraRows++;
    // The logged rows after it move up one; the freed row is the last logged one
    if (this.openRow === row.number) this.openRow = drawn.todayCount;
    else if (this.openRow !== undefined && this.openRow > row.number && this.openRow <= drawn.todayCount) {
      this.openRow--;
    }
    this.saving = row.number;
    // After the log:deleted redraw: the row it went back to
    this.focusAfterRender = [FOCUS.field(drawn.todayCount, 0), FOCUS.check(drawn.todayCount)];
    this.announceAfterRender = true;
    try {
      await this.plugin.deleteWorkoutLogEntry(set);
    } catch (error) {
      await this.rollBack(restore, error);
      return;
    } finally {
      this.saving = undefined;
    }
    // The rest running now was started by this set when it was the last one
    if (drawn.rest && row.number === drawn.todayCount && this.restTimer.isRunning(drawn.rest)) {
      this.restTimer.cancel(drawn.rest);
    }
    this.offerUndo(row.number, set, {
      // Ticked again in the meantime: the set is back already
      canUndo: () => this.drafts.includes(draft),
      takeBack: () => {
        this.drafts.splice(this.drafts.indexOf(draft), 1);
        if (keepsRow) this.extraRows = Math.max(this.extraRows - 1, 0);
        this.openRow = undefined;
      },
      giveBack: () => {
        this.drafts.unshift(draft);
        if (keepsRow) this.extraRows++;
      },
    });
  }

  /**
   * "Set 2 removed · Undo". Undo puts the deleted set back as it was
   * (entered weight and unit, protocol, notes, timestamp) and takes its row's
   * draft back; if that fails the draft stays, so nothing typed is lost.
   */
  private offerUndo(
    number: number,
    set: WorkoutLogData,
    draft: { canUndo: () => boolean; takeBack: () => void; giveBack: () => void },
  ): void {
    UndoNotice.show({
      message: t("sets.setRemoved", { set: number }),
      onUndo: () => {
        if (!draft.canUndo()) return;
        // Out of the drafts before the add, as in logRow: the log:added
        // redraw shows the set logged, not also as a row to fill in
        draft.takeBack();
        this.announceAfterRender = true;
        this.plugin
          .addWorkoutLogEntry(toLogEntryInput(set), { timestamp: set.timestamp })
          .catch(async (error: unknown) => {
            draft.giveBack();
            this.notifyError(error);
            await this.render();
          });
      },
    });
  }

  /**
   * The rows as they are now (drafts, added rows, open details), to put back
   * when a log change made ahead of the save fails
   */
  private snapshot(): () => void {
    const drafts = [...this.drafts];
    const { extraRows, openRow } = this;
    return () => {
      this.drafts = drafts;
      this.extraRows = extraRows;
      this.openRow = openRow;
    };
  }

  /** The save failed: the rows as they were, the error said, nothing moved */
  private async rollBack(restore: () => void, error: unknown): Promise<void> {
    restore();
    this.focusAfterRender = [];
    this.announceAfterRender = false;
    this.notifyError(error);
    await this.render();
  }

  private notifyError(error: unknown): void {
    new Notice(t("modal.notices.genericError", { error: ErrorUtils.getErrorMessage(error) }));
  }

  /** The draft of a row to fill in, kept across redraws */
  private draftOf(row: SetRow, drawn: Drawn): SetDraft {
    const index = draftIndex(row, drawn);
    while (this.drafts.length <= index) this.drafts.push(emptyDraft());
    return this.drafts[index];
  }
}
