import { MarkdownRenderChild, Notice, setIcon } from "obsidian";
import { BaseView } from "@app/features/common/views/BaseView";
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { describeSet } from "@app/features/modals/log/LogHistory";
import { toEntry } from "@app/features/modals/base/logic/LogEntryDraft";
import { describeTarget } from "@app/features/session/business/sessionPlan";
import {
  emptyDraft,
  loggedValue,
  rowProtocol,
  rowToFormData,
  setRows,
  type SetDraft,
  type SetRow,
} from "@app/features/sets/business/setSheet";
import type { EmbeddedSetsParams } from "@app/features/sets/setsBlock";
import {
  TrainingHistory,
  localDay,
} from "@app/services/history/TrainingHistory";
import {
  fieldFor,
  fieldKey,
  formatFieldNumber,
  type FieldValue,
} from "@app/services/exercise/ExerciseFields";
import {
  ProtocolCatalog,
  protocolId,
} from "@app/services/protocols/ProtocolCatalog";
import { Button, BUTTONVARIANT } from "@app/components/atoms/Button";
import { Chip } from "@app/components/atoms/Chip";
import { ProtocolBadge } from "@app/components/atoms/ProtocolBadge";
import { ICONS } from "@app/constants";
import { DateUtils } from "@app/utils/DateUtils";
import { DomUtils } from "@app/utils/DomUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { PathUtils } from "@app/utils/PathUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { WorkoutProtocol, type WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

/**
 * The `workout-sets` block: today's sets of one exercise as rows to fill in
 * and tick (see setSheet). What is logged comes from the log; what is typed
 * in rows not ticked yet lives only here, until the note is closed.
 */
export class EmbeddedSetsView extends BaseView {
  private sheets = new Set<SetsRenderChild>();

  constructor(plugin: WorkoutPluginContext) {
    super(plugin);
  }

  /** @param sourcePath - The note the block is written in: its workout and the sets' origin */
  createSets(
    container: HTMLElement,
    params: EmbeddedSetsParams,
    sourcePath: string,
  ): MarkdownRenderChild {
    const sheet = new SetsRenderChild(
      container,
      this.plugin,
      params,
      sourcePath,
      (error) => this.handleError(container, error),
      () => this.sheets.delete(sheet),
    );
    this.sheets.add(sheet);
    return sheet;
  }

  cleanup(): void {
    for (const sheet of this.sheets) sheet.unload();
    this.sheets.clear();
  }
}

/** What a drawn sheet knows, for its event handlers */
interface Drawn {
  rows: SetRow[];
  parameters: ParameterDefinition[];
  /** Today's sets, to tell whether a ticked row was planned or added */
  todayCount: number;
  planned: number;
}

class SetsRenderChild extends MarkdownRenderChild {
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
    private params: EmbeddedSetsParams,
    private sourcePath: string,
    private onError: (error: Error) => void,
    private onUnload: () => void,
  ) {
    super(containerEl);
    this.workout = params.workout || PathUtils.noteName(sourcePath);
  }

  onload(): void {
    const { eventBus } = this.plugin;
    const refresh = () => void this.render();
    this.register(eventBus.on("log:added", refresh));
    this.register(eventBus.on("log:updated", refresh));
    this.register(eventBus.on("log:deleted", refresh));
    this.register(eventBus.on("log:bulk-changed", refresh));
    this.register(eventBus.on("settings:changed", refresh));
    refresh();
  }

  onunload(): void {
    this.onUnload();
  }

  private async render(): Promise<void> {
    const render = ++this.renders;
    const exercise = this.params.exercise;
    try {
      if (!exercise) {
        this.containerEl.empty();
        this.containerEl.createDiv({
          cls: "workout-sets workout-sets-message",
          text: t("sets.noExercise"),
        });
        return;
      }

      const [logs, parameters] = await Promise.all([
        this.plugin.getWorkoutLogData(),
        this.parametersOf(exercise),
      ]);
      if (render !== this.renders) return;

      const today = localDay(new Date());
      const history = new TrainingHistory(logs);
      const todaysSets = history.setsOn(exercise, today, { workout: this.workout });
      const previous = history.previousDay(exercise, today);
      const rows = setRows({
        parameters,
        today: todaysSets,
        previous: previous?.sets ?? [],
        sets: this.params.sets,
        targetReps: this.params.targetReps,
        targetWeight: this.params.targetWeight,
        extraRows: this.extraRows,
      });
      const drawn: Drawn = {
        rows,
        parameters,
        todayCount: todaysSets.length,
        planned: this.params.sets ?? Math.max(previous?.sets.length ?? 0, 1),
      };

      this.containerEl.empty();
      const sheet = this.containerEl.createDiv({ cls: "workout-sets" });
      this.renderHeader(sheet, exercise, todaysSets.length, drawn.planned);
      if (previous) this.renderLastTime(sheet, previous.sets, parameters);

      const table = sheet.createDiv({ cls: "workout-sets-rows" });
      DomUtils.setCssProps(table, {
        "--workout-sets-fields": String(Math.max(parameters.length, 1)),
      });
      this.renderColumns(table, parameters);
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
      this.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private renderHeader(
    sheet: HTMLElement,
    exercise: string,
    done: number,
    planned: number,
  ): void {
    const header = sheet.createDiv({ cls: "workout-sets-header" });
    header.createDiv({ cls: "workout-sets-exercise", text: exercise });
    header.createDiv({
      cls: "workout-sets-progress",
      text: t("sets.progress", { done, sets: planned }),
    });
    const target = describeTarget(this.params, this.plugin.settings.weightUnit);
    if (target) {
      sheet.createDiv({
        cls: "workout-sets-meta",
        text: t("session.target", { target }),
      });
    }
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

  private renderColumns(table: HTMLElement, parameters: ParameterDefinition[]): void {
    const columns = table.createDiv({
      cls: "workout-sets-columns",
      attr: { "aria-hidden": "true" },
    });
    columns.createSpan({ text: t("sets.setColumn") });
    for (const param of parameters) {
      columns.createSpan({ text: this.labelOf(param) });
    }
  }

  private renderRow(table: HTMLElement, row: SetRow, drawn: Drawn): void {
    const el = table.createDiv({ cls: "workout-sets-row" });
    if (row.logged) {
      this.renderLoggedRow(el, row, row.logged, drawn.parameters);
      return;
    }

    const draft = this.draftOf(row, drawn);
    const open = this.openRow === row.number;
    if (open) el.addClass("is-open");
    const main = el.createDiv({ cls: "workout-sets-row-main" });
    this.renderNumber(main, row.number, rowProtocol(row, draft));

    const inputs: HTMLInputElement[] = [];
    for (const param of drawn.parameters) {
      inputs.push(this.renderInput(main, row, draft, param));
    }

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

    if (open) this.renderDetails(el, row, draft);
  }

  private renderLoggedRow(
    el: HTMLElement,
    row: SetRow,
    set: WorkoutLogData,
    parameters: ParameterDefinition[],
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
    this.renderNumber(main, row.number, set.protocol);
    for (const param of parameters) {
      const value = loggedValue(set, fieldKey(param.key));
      const cell = main.createDiv({ cls: "workout-sets-value" });
      cell.setText(this.formatValue(param, value));
    }
    main.createSpan();
    const check = main.createSpan({ cls: "workout-sets-check is-done" });
    setIcon(check, "check");
    if (set.notes) {
      el.createDiv({ cls: "workout-sets-note", text: set.notes });
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

  private renderNumber(main: HTMLElement, number: number, protocol?: string): void {
    const cell = main.createDiv({ cls: "workout-sets-number", text: String(number) });
    const info = new ProtocolCatalog(this.plugin.settings.customProtocols).resolve(protocol);
    if (info.abbreviation) {
      ProtocolBadge.create(cell, {
        text: info.abbreviation,
        className: `workout-protocol-badge ${info.badgeClass}`,
        tooltip: info.name,
        color: info.badgeColor,
      });
    }
  }

  private renderInput(
    main: HTMLElement,
    row: SetRow,
    draft: SetDraft,
    param: ParameterDefinition,
  ): HTMLInputElement {
    const cell = main.createDiv({ cls: "workout-sets-field" });
    const label = t("sets.fieldOfSet", { field: this.labelOf(param), set: row.number });
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
  private renderDetails(el: HTMLElement, row: SetRow, draft: SetDraft): void {
    const details = el.createDiv({ cls: "workout-sets-details" });
    details.createDiv({ cls: "workout-sets-label", text: t("sets.protocol") });
    const chips = details.createDiv({ cls: "workout-sets-chips" });
    const current = rowProtocol(row, draft);
    const catalog = new ProtocolCatalog(this.plugin.settings.customProtocols);
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
    } catch (error) {
      Object.assign(this, before);
      new Notice(t("modal.notices.genericError", { error: ErrorUtils.getErrorMessage(error) }));
    } finally {
      this.saving = undefined;
      await this.render();
    }
  }

  /** The draft of a row to fill in, kept across redraws */
  private draftOf(row: SetRow, drawn: Drawn): SetDraft {
    const index = row.number - 1 - drawn.todayCount;
    while (this.drafts.length <= index) this.drafts.push(emptyDraft());
    return this.drafts[index];
  }

  private labelOf(param: ParameterDefinition): string {
    const unit =
      fieldKey(param.key) === "weight" ? this.plugin.settings.weightUnit : param.unit;
    return unit ? `${param.label} (${unit})` : param.label;
  }

  private formatValue(param: ParameterDefinition, value: FieldValue | undefined): string {
    if (typeof value === "number") return formatFieldNumber(fieldFor(param), value);
    if (typeof value === "boolean") return value ? t("sets.yes") : t("sets.no");
    return value === undefined || value === "" ? t("sets.noValue") : value;
  }

  private async parametersOf(exercise: string): Promise<ParameterDefinition[]> {
    return this.plugin
      .getExerciseDefinitionService()
      .getParametersForExercise(exercise)
      .catch((): ParameterDefinition[] => []);
  }
}
