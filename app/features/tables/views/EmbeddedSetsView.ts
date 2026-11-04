import { MarkdownRenderChild, Notice, setIcon } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { describeSet } from "@app/features/modals/log/LogHistory";
import { TableColumnResolver } from "@app/features/tables/business/TableColumnResolver";
import { TableRowProcessor } from "@app/features/tables/business/TableRowProcessor";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import { renderTargetSection } from "@app/features/tables/ui/TargetSection";
import { toEntry } from "@app/features/modals/base/logic/LogEntryDraft";
import {
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
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { Chip } from "@app/components/atoms/Chip";
import { ProtocolBadge, type BadgeProtocol } from "@app/components/atoms/ProtocolBadge";
import { ICONS, mapColumnIdentifiersToLabels } from "@app/constants";
import { DateUtils } from "@app/utils/DateUtils";
import { DomUtils } from "@app/utils/DomUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { PathUtils } from "@app/utils/PathUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { WorkoutProtocol, type WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import { readNotePlan } from "@app/features/session/business/sessionPlan";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { RestTimer } from "@app/features/timer/views/RestTimer";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import { betaEnabled } from "@app/services/features/BetaFeatures";
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
   */
  createSets(
    container: HTMLElement,
    params: EmbeddedSetsParams,
    sourcePath: string,
    editAction?: BlockMenuAction,
  ): SetSheet {
    return this.track(
      new SetSheet(
        container,
        this.plugin,
        new RestTimer(this.plugin, this.activeTimers),
        params,
        sourcePath,
        editAction,
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

  constructor(
    containerEl: HTMLElement,
    private plugin: WorkoutPluginContext,
    private restTimer: RestTimer,
    private params: EmbeddedSetsParams,
    private sourcePath: string,
    private editAction: BlockMenuAction | undefined,
    private onError: (error: unknown) => void,
  ) {
    super(containerEl);
    this.workout = params.workout || PathUtils.noteName(sourcePath);
  }

  onunload(): void {
    this.restTimer.destroy();
  }

  async render(): Promise<void> {
    const render = ++this.renders;
    const exercise = this.params.exercise;
    try {
      if (!betaEnabled(this.plugin.settings, "setSheet")) {
        // Drawn again on settings:changed, so turning it on shows the sheet
        this.containerEl.empty();
        const sheet = this.containerEl.createDiv({ cls: "workout-sets" });
        this.renderHeader(sheet, exercise);
        sheet.createDiv({
          cls: "workout-sets-message",
          text: t("settings.beta.disabledBlock", { feature: t("settings.beta.setSheet.name") }),
        });
        return;
      }
      if (!exercise) {
        this.containerEl.empty();
        this.renderHeader(this.containerEl.createDiv({ cls: "workout-sets" }));
        return;
      }

      const [logs, parameters, plan] = await Promise.all([
        this.plugin.getWorkoutLogData(),
        parametersOrNone(this.plugin, exercise),
        readNotePlan(this.plugin.app.vault, this.sourcePath),
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
        rest: restOf(this.params, plan ?? []),
        todayCount: todaysSets.length,
        planned: plannedSets(input),
      };

      this.containerEl.empty();
      const sheet = this.containerEl.createDiv({ cls: "workout-sets" });
      this.renderHeader(
        sheet,
        exercise,
        t("sets.progress", { done: todaysSets.length, sets: drawn.planned }),
      );
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
      if (previous) this.renderLastTime(sheet, previous.sets, parameters);

      const table = sheet.createDiv({ cls: "workout-sets-rows" });
      DomUtils.setCssProps(table, {
        "--workout-sets-fields": String(Math.max(parameters.length, 1)),
      });
      this.renderColumns(table, drawn.labels);
      for (const row of rows) this.renderRow(table, row, drawn);

      const footer = sheet.createDiv({ cls: "workout-sets-footer" });
      const add = Button.create(footer, {
        text: t("sets.addSet"),
        icon: ICONS.ACTIONS.ADD,
        variant: BUTTONVARIANT.SECONDARY,
      });
      Button.onClick(add, () => {
        this.extraRows++;
        void this.render();
      });
    } catch (error) {
      this.onError(error);
    }
  }

  /**
   * The block's top row: the exercise (or what to add) and, always in the
   * top right corner, the ⋮ menu `workout-log` has: go to the exercise and
   * edit this block. The menu sits on the row, so it never wraps under the
   * title on a narrow phone.
   * @param progress - Text before the menu ("2/4 sets")
   */
  private renderHeader(sheet: HTMLElement, exercise?: string, progress?: string): void {
    const header = sheet.createDiv({ cls: "workout-sets-header" });
    header.createDiv({
      cls: exercise ? "workout-sets-title workout-sets-exercise" : "workout-sets-title workout-sets-message",
      text: exercise ?? t("sets.noExercise"),
    });
    if (progress) header.createDiv({ cls: "workout-sets-meta", text: progress });
    ExerciseActionSelect.render(header, {
      exerciseName: exercise ?? "",
      plugin: this.plugin,
      edit: this.editAction,
    });
  }

  /** "Last time (31/10): 80 kg × 8 · 80 kg × 7" */
  private renderLastTime(
    sheet: HTMLElement,
    sets: WorkoutLogData[],
    parameters: ParameterDefinition[],
  ): void {
    const unit = this.plugin.settings.weightUnit;
    sheet.createDiv({
      cls: "workout-sets-meta",
      text: t("sets.lastTime", {
        date: DateUtils.toShortDate(sets[0].date),
        sets: sets.map((set) => describeSet(set, parameters, unit)).join(" · "),
      }),
    });
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
    const inputs = drawn.parameters.map((param, index) =>
      this.renderInput(main, row, draft, param, drawn.labels[index]),
    );

    const details = main.createEl("button", {
      cls: "workout-sets-details-toggle clickable-icon",
      attr: {
        type: "button",
        "aria-label": t("sets.details", { set: row.number }),
        "aria-expanded": String(open),
      },
    });
    setIcon(details, "chevron-down");
    if (
      rowProtocol(row, draft) !== protocolId(WorkoutProtocol.STANDARD) ||
      draft.notes.trim()
    ) {
      details.createSpan({ cls: "workout-sets-details-dot" });
    }
    details.addEventListener("click", () => {
      this.openRow = open ? undefined : row.number;
      void this.render();
    });

    const check = main.createEl("button", {
      cls: "workout-sets-check",
      attr: { type: "button", "aria-label": t("sets.logSet", { set: row.number }) },
    });
    setIcon(check, "check");
    check.addEventListener("click", () => void this.logRow(row, drawn, el, inputs));
    for (const input of inputs) {
      input.addEventListener("keydown", (event) => {
        // Keys typed here are the field's, not the editor's around the block
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          void this.logRow(row, drawn, el, inputs);
        }
      });
    }

    if (open) this.renderDetails(el, row, draft, drawn.protocols);
  }

  private renderLoggedRow(
    el: HTMLElement,
    row: SetRow,
    set: WorkoutLogData,
    drawn: Drawn,
  ): void {
    el.addClass("is-logged");
    const main = el.createDiv({
      cls: "workout-sets-row-main",
      attr: {
        role: "button",
        tabindex: "0",
        "aria-label": t("sets.editSet", { set: row.number }),
      },
    });
    this.renderNumber(main, row.number, drawn.protocols.resolve(set.protocol));
    // The values as the table shows them (weight as entered, N/A…)
    for (const value of TableRowProcessor.displayRow(set, drawn.columns)) {
      main.createDiv({ cls: "workout-sets-value", text: value });
    }
    main.createSpan();
    const check = main.createSpan({ cls: "workout-sets-check is-done" });
    setIcon(check, "check");
    if (set.notes) {
      el.createDiv({ cls: "workout-sets-note workout-sets-meta", text: set.notes });
    }

    const edit = () =>
      new EditLogModal(this.plugin.app, this.plugin, set).open();
    main.addEventListener("click", edit);
    main.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        edit();
      }
    });
  }

  private renderNumber(main: HTMLElement, number: number, protocol: BadgeProtocol): void {
    ProtocolBadge.forProtocol(
      main.createDiv({ cls: "workout-sets-number", text: String(number) }),
      protocol,
    );
  }

  private renderInput(
    main: HTMLElement,
    row: SetRow,
    draft: SetDraft,
    param: ParameterDefinition,
    column: string,
  ): HTMLInputElement {
    const cell = main.createDiv({ cls: "workout-sets-field" });
    const label = t("sets.fieldOfSet", { field: column, set: row.number });
    if (param.type === "boolean") {
      const box = cell.createEl("input", {
        attr: { type: "checkbox", "aria-label": label },
      });
      box.checked = draft.values[param.key] === "true";
      box.addEventListener("change", () => {
        draft.values[param.key] = box.checked ? "true" : "";
      });
      return box;
    }

    const field = fieldFor(param);
    const input = cell.createEl("input", {
      cls: "workout-sets-input",
      attr: {
        type: "text",
        inputmode:
          param.type === "number" ? (field.integer ? "numeric" : "decimal") : "text",
        enterkeyhint: "done",
        autocomplete: "off",
        "aria-label": label,
        placeholder: row.placeholders[param.key] ?? "",
      },
    });
    input.value = draft.values[param.key] ?? "";
    input.addEventListener("input", () => {
      draft.values[param.key] = input.value;
      input.removeAttribute("aria-invalid");
    });
    return input;
  }

  /** The row's protocol chips and notes */
  private renderDetails(
    el: HTMLElement,
    row: SetRow,
    draft: SetDraft,
    catalog: ProtocolCatalog,
  ): void {
    const details = el.createDiv({ cls: "workout-sets-details" });
    details.createDiv({ cls: "workout-sets-label", text: t("sets.protocol") });
    const chips = details.createDiv({ cls: "workout-sets-chips" });
    const current = rowProtocol(row, draft);
    const protocols = catalog.all();
    // A suggestion no longer in the settings list still shows (and stays)
    if (!protocols.some((p) => p.id === current)) protocols.push(catalog.resolve(current));
    for (const protocol of protocols) {
      Chip.create(chips, {
        text: protocol.name,
        selected: protocol.id === current,
        onClick: () => {
          draft.protocol = protocol.id;
          void this.render();
        },
      });
    }

    details.createDiv({ cls: "workout-sets-label", text: t("sets.notes") });
    const notes = details.createEl("textarea", {
      cls: "workout-sets-notes",
      attr: { rows: "2", "aria-label": t("sets.notes") },
    });
    notes.value = draft.notes;
    notes.addEventListener("keydown", (event) => event.stopPropagation());
    notes.addEventListener("input", () => {
      draft.notes = notes.value;
    });
  }

  /** Logs a row: its typed values, else its placeholders */
  private async logRow(
    row: SetRow,
    drawn: Drawn,
    el: HTMLElement,
    inputs: HTMLInputElement[],
  ): Promise<void> {
    const exercise = this.params.exercise;
    if (!exercise || this.saving !== undefined) return;
    const draft = this.draftOf(row, drawn);
    const result = rowToFormData(row, draft, {
      exercise,
      workout: this.workout,
      parameters: drawn.parameters,
    });
    el.querySelector(".workout-field-error")?.remove();
    if ("error" in result) {
      const index = drawn.parameters.findIndex((p) => p.key === result.error.field);
      const input = inputs[index];
      el.createDiv({
        cls: "workout-field-error",
        text: result.error.message,
        attr: { role: "alert" },
      });
      if (input) {
        input.setAttribute("aria-invalid", "true");
        input.focus();
      }
      return;
    }

    // Out of the drafts before the set is added: the log:added redraw
    // already shows it as logged, and the rows after it keep their drafts
    const before = { drafts: [...this.drafts], extraRows: this.extraRows, openRow: this.openRow };
    this.drafts.splice(row.number - 1 - drawn.todayCount, 1);
    if (drawn.todayCount >= drawn.planned) this.extraRows = Math.max(this.extraRows - 1, 0);
    if (this.openRow === row.number) this.openRow = undefined;
    else if (this.openRow !== undefined && this.openRow > row.number) this.openRow--;
    this.saving = row.number;
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
      Object.assign(this, before);
      new Notice(t("modal.notices.genericError", { error: ErrorUtils.getErrorMessage(error) }));
      await this.render();
    } finally {
      this.saving = undefined;
    }
  }

  /** The draft of a row to fill in, kept across redraws */
  private draftOf(row: SetRow, drawn: Drawn): SetDraft {
    const index = row.number - 1 - drawn.todayCount;
    while (this.drafts.length <= index) this.drafts.push(emptyDraft());
    return this.drafts[index];
  }
}
