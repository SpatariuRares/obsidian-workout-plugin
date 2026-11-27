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
  plannedSets,
  plannedSupersetRounds,
  restOf,
  rowProtocol,
  rowToFormData,
  setRows,
  supersetRounds,
  supersetSlotRest,
  type SetDraft,
  type SetRow,
  type SupersetRound,
  type SupersetSlot,
} from "@app/features/tables/business/setSheet";
import { betweenRest, blockExercises, isSupersetBlock, setsBlock, slotLetter, type EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import {
  TrainingHistory,
  localDay,
} from "@app/services/history/TrainingHistory";
import { fieldFor } from "@app/services/exercise/ExerciseFields";
import {
  ProtocolCatalog,
  isStandardProtocol,
  isWarmupProtocol,
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
import { exerciseTitleLink } from "@app/features/common/ui/exerciseTitleLink";
import { ICONS, mapColumnIdentifiersToLabels } from "@app/constants";
import { DomUtils } from "@app/utils/DomUtils";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { PathUtils } from "@app/utils/PathUtils";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import type { LogEntryInput, WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { parametersOrNone } from "@app/services/exercise/ExerciseDefinitionService";
import { readNote, sectionRestOf } from "@app/features/session/business/sessionPlan";
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

type RowGroup = "warmup" | "working";
type RowKey = string;

const rowGroup = (row: Pick<SetRow, "warmup">): RowGroup =>
  row.warmup ? "warmup" : "working";

const rowKey = (row: Pick<SetRow, "warmup" | "number">, exerciseIndex?: number): RowKey =>
  exerciseIndex === undefined
    ? `${rowGroup(row)}-${row.number}`
    : `${rowGroup(row)}-${row.number}-${exerciseIndex}`;

const parseRowKey = (
  key: RowKey,
): { group: RowGroup; number: number; exerciseIndex?: number } => {
  const parts = key.split("-");
  return {
    group: parts[0] as RowGroup,
    number: Number(parts[1]),
    exerciseIndex: parts[2] !== undefined ? Number(parts[2]) : undefined,
  };
};

const setLabel = (row: Pick<SetRow, "warmup" | "number">): string =>
  row.warmup ? t("sets.warmupNumber", { set: row.number }) : String(row.number);

const slotLabel = (row: Pick<SetRow, "warmup" | "number">, exerciseIndex: number): string => {
  const slot = slotLetter(exerciseIndex);
  return row.warmup
    ? t("sets.warmupSlot", { round: row.number, slot })
    : t("sets.workingSlot", { round: row.number, slot });
};

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
  /** Today's logged warm-up sets */
  todayWarmupCount: number;
  /** Planned warm-up sets (from `warmups:`) */
  plannedWarmups: number;
  /** Today's logged working sets */
  todayWorkingCount: number;
  /** Planned working sets (from `sets:`, else last time's working sets) */
  plannedWorking: number;
}

interface SupersetDrawn {
  rounds: SupersetRound[];
  exerciseCount: number;
  protocols: ProtocolCatalog;
  sectionRest: EmbeddedTimerParams;
  roundRest?: EmbeddedTimerParams;
  idleRest?: EmbeddedTimerParams;
  todayWarmupCounts: number[];
  todayWorkingCounts: number[];
  plannedWarmups: number;
  plannedWorking: number;
  workingRounds: number;
  mostRecentWorkingSet?: WorkoutLogData;
}

/** Names of a sheet's controls, to focus them again after a redraw */
const FOCUS = {
  addSet: "add-set",
  addRound: "add-round",
  field: (key: RowKey, index: number) => `${key}-field-${index}`,
  check: (key: RowKey) => `${key}-check`,
  details: (key: RowKey) => `${key}-details`,
  protocol: (key: RowKey) => `${key}-protocol`,
};

/** A row to fill in's place among its group's drafts: they come after today's sets */
const draftIndex = (
  row: SetRow,
  drawn: Pick<Drawn, "todayWarmupCount" | "todayWorkingCount">,
): number => {
  const todayCount = row.warmup ? drawn.todayWarmupCount : drawn.todayWorkingCount;
  return row.number - 1 - todayCount;
};

/** A row's field to fill in, and how to show its error */
interface RowField {
  input: HTMLInputElement;
  setError: (message?: string) => void;
}

interface RowSpec {
  key: RowKey;
  label: string;
  row: SetRow;
  parameters: ParameterDefinition[];
  columns: string[];
  labels: string[];
  protocols: ProtocolCatalog;
}

export class SetSheet extends MarkdownRenderChild {
  private readonly workout: string;
  /** Drafts of unlogged rows, separated by group so warm-up and working drafts never collide */
  private drafts: Record<RowGroup, SetDraft[]> = { warmup: [], working: [] };
  /** Superset drafts keyed by `${group}-${exerciseIndex}` so mixed exercises stay isolated */
  private supersetDrafts: Map<string, SetDraft[]> = new Map();
  private extraRows = 0;
  private extraWarmups = 0;
  /** Row key whose protocol and notes are shown */
  private openRow?: RowKey;
  /** Row key being logged, so a second tap doesn't log it twice */
  private saving?: RowKey;
  /** Currently running rest timer params, preserved across redraws (dual-rest superset support) */
  private activeRest?: EmbeddedTimerParams;
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
    try {
      if (isSupersetBlock(this.params)) {
        await this.renderSuperset(render);
        return;
      }

      const exercise = this.params.exercise;
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
      // With an id, the block keeps its own sets: two blocks of the same
      // exercise in one workout don't show each other's
      const block = this.params.id;
      const todaysSets = history.setsOn(exercise, today, { workout: this.workout, block });
      const previous = history.previousDay(exercise, today, { block });
      const input = {
        parameters,
        today: todaysSets,
        previous: previous?.sets ?? [],
        sets: this.params.sets,
        warmups: this.params.warmups,
        protocol: this.params.protocol,
        targetReps: this.params.targetReps,
        targetWeight: this.params.targetWeight,
        extraRows: this.extraRows,
        extraWarmups: this.extraWarmups,
      };
      const rows = setRows(input);
      const todayWarmupCount = todaysSets.filter((s) => isWarmupProtocol(s.protocol)).length;
      const todayWorkingCount = todaysSets.length - todayWarmupCount;
      const plannedWorking = plannedSets(input);
      const plannedWarmups = this.params.warmups ?? 0;
      const columns = parameters.map((p) => TableColumnResolver.formatParameterHeader(p));
      const drawn: Drawn = {
        rows,
        parameters,
        columns,
        labels: mapColumnIdentifiersToLabels(columns),
        protocols: new ProtocolCatalog(this.plugin.settings.customProtocols),
        rest: restOf(this.params, note, this.blockMatch()),
        todayWarmupCount,
        plannedWarmups,
        todayWorkingCount,
        plannedWorking,
      };

      const progress = t("sets.progress", { done: todayWorkingCount, sets: plannedWorking });
      const sheet = this.renderCard({
        title: exercise,
        exerciseForLink: exercise,
        progress,
        rest: drawn.rest,
      });
      this.drawRestStrip(sheet, drawn.rest);
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
      // More fields than fit side by side on a phone: two per line, each labelled
      table.classList.toggle("is-stacked", parameters.length > 2);
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
        const nextNumber =
          Math.max(drawn.plannedWorking, drawn.todayWorkingCount) + this.extraRows;
        const nextKey = rowKey({ warmup: false, number: nextNumber });
        this.focusAfterRender = [FOCUS.field(nextKey, 0), FOCUS.check(nextKey)];
        void this.render();
      });

      this.finishRender(sheet, progress);
    } catch (error) {
      this.onError(error);
    }
  }

  private async renderSuperset(render: number): Promise<void> {
    const exercises = blockExercises(this.params);
    const [logs, parameterLists, note] = await Promise.all([
      this.plugin.getWorkoutLogData(),
      Promise.all(exercises.map((ex) => parametersOrNone(this.plugin, ex))),
      readNote(this.plugin.app.vault, this.sourcePath),
    ]);
    if (render !== this.renders) return;

    const today = localDay(new Date());
    const history = new TrainingHistory(logs);
    const block = this.params.id;
    const exerciseInputs = exercises.map((exercise, index) => ({
      exercise,
      parameters: parameterLists[index],
      today: history.setsOn(exercise, today, { workout: this.workout, block }),
      previous: history.previousDay(exercise, today, { block })?.sets ?? [],
    }));

    const rounds = supersetRounds({
      exercises: exerciseInputs,
      sets: this.params.sets,
      warmups: this.params.warmups,
      protocol: this.params.protocol,
      extraRounds: this.extraRows,
      extraWarmups: this.extraWarmups,
    });
    const todayWarmupCounts = exerciseInputs.map(
      (ex) => ex.today.filter((s) => isWarmupProtocol(s.protocol)).length,
    );
    const todayWorkingCounts = exerciseInputs.map((ex, i) => ex.today.length - todayWarmupCounts[i]);
    const plannedWorking = plannedSupersetRounds(exerciseInputs, this.params.sets);
    const plannedWarmups = this.params.warmups ?? 0;
    const workingRounds = rounds.filter((r) => !r.warmup).length;
    const doneRounds = Math.min(...todayWorkingCounts);

    const match = this.blockMatch();
    const sectionRest = note !== null && match ? sectionRestOf(note, match) : {};
    const roundRest = supersetSlotRest(this.params, sectionRest, {
      isWarmup: false,
      exerciseIndex: exercises.length - 1,
      exerciseCount: exercises.length,
      roundIndex: 0,
      totalWorkingRounds: Math.max(workingRounds, 2),
    });
    const idleRest = roundRest ?? betweenRest(this.params);

    let mostRecentWorkingSet: WorkoutLogData | undefined;
    for (const ex of exerciseInputs) {
      for (const s of ex.today) {
        if (isWarmupProtocol(s.protocol)) continue;
        if (
          !mostRecentWorkingSet ||
          (s.timestamp ?? 0) >= (mostRecentWorkingSet.timestamp ?? 0)
        ) {
          mostRecentWorkingSet = s;
        }
      }
    }

    const drawn: SupersetDrawn = {
      rounds,
      exerciseCount: exercises.length,
      protocols: new ProtocolCatalog(this.plugin.settings.customProtocols),
      sectionRest,
      roundRest,
      idleRest,
      todayWarmupCounts,
      todayWorkingCounts,
      plannedWarmups,
      plannedWorking,
      workingRounds,
      mostRecentWorkingSet,
    };

    const progress = t("sets.supersetProgress", { done: doneRounds, rounds: plannedWorking });
    const sheet = this.renderCard({
      title: exercises.join(" + "),
      progress,
      rest: roundRest,
    });
    this.drawRestStrip(sheet, idleRest);

    const container = sheet.createDiv({ cls: "workout-sets-rows is-superset" });
    for (const round of rounds) {
      this.renderSupersetRound(container, round, drawn);
    }

    const add = Button.create(BlockCard.footer(sheet), {
      text: t("sets.addRound"),
      icon: ICONS.ACTIONS.ADD,
      variant: BUTTONVARIANT.SECONDARY,
    });
    DomUtils.setFocusKey(add, FOCUS.addRound);
    Button.onClick(add, () => {
      this.extraRows++;
      const nextRound = Math.max(drawn.plannedWorking, ...drawn.todayWorkingCounts) + this.extraRows;
      const nextKey = rowKey({ warmup: false, number: nextRound }, 0);
      this.focusAfterRender = [FOCUS.field(nextKey, 0), FOCUS.check(nextKey)];
      void this.render();
    });

    this.finishRender(sheet, progress);
  }

  private drawRestStrip(sheet: HTMLElement, idleRest: EmbeddedTimerParams | undefined): void {
    const activeRunning =
      this.activeRest && this.restTimer.isRunning(this.activeRest) ? this.activeRest : undefined;
    if (!activeRunning && !this.saving) {
      this.activeRest = undefined;
    }
    const displayRest = activeRunning ?? idleRest;
    if (displayRest) {
      this.restTimer.draw(sheet.createDiv({ cls: "workout-sets-rest" }), displayRest);
    }
  }

  private finishRender(sheet: HTMLElement, progress: string): void {
    const focus = this.focusAfterRender;
    this.focusAfterRender = [];
    focus.some((key) => DomUtils.focusByKey(sheet, key));
    if (this.announceAfterRender) {
      this.announceAfterRender = false;
      this.live?.announce(progress);
    }
  }

  /**
   * The block's card, with its top row: the exercise (or superset title) and,
   * always in the top right corner, the ⋮ menu `workout-log` has.
   */
  private renderCard({
    title,
    exerciseForLink,
    progress,
    rest,
  }: {
    title?: string;
    exerciseForLink?: string;
    progress?: string;
    rest?: EmbeddedTimerParams;
  } = {}): HTMLElement {
    const { el, header } = BlockCard.create(this.body(), {
      title: title ?? t("sets.noExercise"),
      titleLink: exerciseForLink
        ? exerciseTitleLink({
            plugin: this.plugin,
            exerciseName: exerciseForLink,
            sourcePath: this.sourcePath,
          })
        : undefined,
      titleIsMessage: !title,
      meta: progress,
      className: exerciseForLink || !title ? "workout-sets" : "workout-sets workout-sets-superset",
    });
    ExerciseActionSelect.render(header, {
      exerciseName: exerciseForLink ?? "",
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
    row.createSpan({ text: t("sets.setColumn") });
    const cells = row.createDiv({ cls: "workout-sets-cells" });
    for (const label of labels) cells.createSpan({ text: label });
  }

  private renderRow(table: HTMLElement, row: SetRow, drawn: Drawn): void {
    const el = table.createDiv({ cls: "workout-sets-row" });
    if (row.warmup) el.addClass("is-warmup");
    const spec: RowSpec = {
      key: rowKey(row),
      label: setLabel(row),
      row,
      parameters: drawn.parameters,
      columns: drawn.columns,
      labels: drawn.labels,
      protocols: drawn.protocols,
    };
    if (row.logged) {
      this.renderLoggedRow(el, spec, row.logged, () => void this.unlogRow(row, row.logged!, drawn));
      return;
    }

    const draft = this.draftOf(row, drawn);
    const groupPlanned = row.warmup ? drawn.plannedWarmups : drawn.plannedWorking;
    const groupToday = row.warmup ? drawn.todayWarmupCount : drawn.todayWorkingCount;
    this.renderUnloggedRow(
      el,
      spec,
      draft,
      (fields) => void this.logRow(row, drawn, el, fields),
      row.number > Math.max(groupPlanned, groupToday)
        ? () => this.removeRow(row, drawn)
        : undefined,
    );
  }

  private renderSupersetRound(
    container: HTMLElement,
    round: SupersetRound,
    drawn: SupersetDrawn,
  ): void {
    const roundEl = container.createDiv({ cls: "workout-sets-round" });
    if (round.warmup) roundEl.addClass("is-warmup");
    const header = roundEl.createDiv({ cls: "workout-sets-round-header" });
    header.createSpan({
      cls: "workout-sets-round-title",
      text: round.warmup
        ? t("sets.warmupRound", { round: round.number })
        : t("sets.round", { round: round.number }),
    });

    const groupTodayCounts = round.warmup ? drawn.todayWarmupCounts : drawn.todayWorkingCounts;
    const groupPlanned = round.warmup ? drawn.plannedWarmups : drawn.plannedWorking;
    const groupMaxToday = Math.max(0, ...groupTodayCounts);
    if (round.number > Math.max(groupPlanned, groupMaxToday)) {
      DeleteButton.create(header, {
        label: t("sets.removeRound"),
        onClick: () => this.removeSupersetRound(round, drawn),
        className: "workout-sets-remove",
      });
    }

    for (const slot of round.slots) {
      this.renderSupersetSlot(roundEl, slot, drawn);
    }
  }

  private renderSupersetSlot(
    roundEl: HTMLElement,
    slot: SupersetSlot,
    drawn: SupersetDrawn,
  ): void {
    const el = roundEl.createDiv({ cls: "workout-sets-row workout-sets-slot" });
    if (slot.row.warmup) el.addClass("is-warmup");
    DomUtils.setCssProps(el, {
      "--workout-sets-fields": String(Math.max(slot.parameters.length, 1)),
    });
    el.classList.toggle("is-stacked", slot.parameters.length > 2);

    const slotHeader = el.createDiv({ cls: "workout-sets-slot-header" });
    const titleEl = slotHeader.createDiv({ cls: "workout-sets-slot-title" });
    const link = exerciseTitleLink({
      plugin: this.plugin,
      exerciseName: slot.exercise,
      sourcePath: this.sourcePath,
    });
    if (link) {
      BlockCard.renderTitleLink(titleEl, slot.exercise, link);
    } else {
      titleEl.setText(slot.exercise);
    }

    const columns = slot.parameters.map((p) => TableColumnResolver.formatParameterHeader(p));
    const spec: RowSpec = {
      key: rowKey(slot.row, slot.exerciseIndex),
      label: slotLabel(slot.row, slot.exerciseIndex),
      row: slot.row,
      parameters: slot.parameters,
      columns,
      labels: mapColumnIdentifiersToLabels(columns),
      protocols: drawn.protocols,
    };

    if (slot.row.logged) {
      this.renderLoggedRow(
        el,
        spec,
        slot.row.logged,
        () => void this.unlogSupersetSlot(slot, slot.row.logged!, drawn),
      );
      return;
    }

    const todayCount = slot.row.warmup
      ? drawn.todayWarmupCounts[slot.exerciseIndex]
      : drawn.todayWorkingCounts[slot.exerciseIndex];
    const draft = this.supersetDraftOf(
      rowGroup(slot.row),
      slot.exerciseIndex,
      slot.row.number,
      todayCount,
    );
    this.renderUnloggedRow(el, spec, draft, (fields) =>
      void this.logSupersetSlot(slot, drawn, el, fields),
    );
  }

  private renderUnloggedRow(
    el: HTMLElement,
    spec: RowSpec,
    draft: SetDraft,
    onLog: (fields: RowField[]) => void,
    onRemove?: () => void,
  ): void {
    const { key, label, row, parameters, labels, protocols } = spec;
    const open = this.openRow === key;
    if (open) el.addClass("is-open");
    const main = el.createDiv({ cls: "workout-sets-row-main" });
    this.renderNumber(main, label, protocols.resolve(rowProtocol(row, draft)));
    const log = () => onLog(fields);
    const cells = main.createDiv({ cls: "workout-sets-cells" });
    const fields = parameters.map((param, index) =>
      this.renderInput(
        this.renderCell(cells, labels[index]),
        key,
        label,
        row,
        draft,
        param,
        labels[index],
        index,
        log,
      ),
    );

    this.renderDetailsToggle(
      main,
      key,
      label,
      open,
      !isStandardProtocol(rowProtocol(row, draft)) || !!draft.notes.trim(),
    );
    CheckToggle.create(main, {
      done: false,
      label: t("sets.logSet", { set: label }),
      focusKey: FOCUS.check(key),
      onClick: log,
    });

    if (open) {
      this.renderDetails(el, key, protocols, rowProtocol(row, draft), draft.notes, {
        onProtocol: (protocol) => {
          draft.protocol = protocol;
          this.focusAfterRender = [`${FOCUS.protocol(key)}-${protocol}`];
          void this.render();
        },
        onNotes: (notes) => {
          draft.notes = notes;
        },
        onRemove,
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
    spec: RowSpec,
    set: WorkoutLogData,
    onUnlog: () => void,
  ): void {
    el.addClass("is-logged");
    const { key, label, columns, labels, protocols } = spec;
    const open = this.openRow === key;
    if (open) el.addClass("is-open");
    const main = el.createDiv({ cls: "workout-sets-row-main" });
    this.renderNumber(main, label, protocols.resolve(set.protocol));
    // The values as the table shows them (weight as entered, N/A…)
    const cells = main.createDiv({ cls: "workout-sets-cells" });
    TableRowProcessor.displayRow(set, columns).forEach((value, index) => {
      const cell = this.renderCell(cells, labels[index]).createDiv({
        cls: "workout-sets-value",
      });
      cell.createSpan({ text: value, attr: { "aria-hidden": "true" } });
      // The column headers are hidden from screen readers: each value says its field
      cell.createSpan({
        cls: "workout-visually-hidden",
        text: t("sets.valueOfSet", { field: labels[index], set: label, value }),
      });
    });
    this.renderDetailsToggle(
      main,
      key,
      label,
      open,
      !isStandardProtocol(set.protocol) || !!set.notes?.trim(),
    );
    CheckToggle.create(main, {
      done: true,
      label: t("sets.unlogSet", { set: label }),
      focusKey: FOCUS.check(key),
      onClick: onUnlog,
    });

    if (open) {
      const save = (change: Partial<LogEntryInput>) =>
        this.plugin
          .updateWorkoutLogEntry(set, { ...toLogEntryInput(set), ...change })
          .catch((error: unknown) => this.notifyError(error));
      this.renderDetails(el, key, protocols, protocolId(set.protocol), set.notes ?? "", {
        onProtocol: (protocol) => {
          this.focusAfterRender = [`${FOCUS.protocol(key)}-${protocol}`];
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

  /**
   * One field's place in a row, with its label: shown only when the fields
   * are stacked (the column headers are hidden then)
   */
  private renderCell(cells: HTMLElement, label: string): HTMLElement {
    const cell = cells.createDiv({ cls: "workout-sets-cell" });
    cell.createSpan({ cls: "workout-sets-cell-label", text: label, attr: { "aria-hidden": "true" } });
    return cell;
  }

  /** The chevron that shows the row's protocol and notes */
  private renderDetailsToggle(
    main: HTMLElement,
    key: RowKey,
    setText: string,
    open: boolean,
    hasDetails: boolean,
  ): void {
    const focusKey = FOCUS.details(key);
    DisclosureToggle.create(main, {
      expanded: open,
      label: t("sets.details", { set: setText }),
      marked: hasDetails,
      focusKey,
      onToggle: () => {
        this.openRow = open ? undefined : key;
        this.focusAfterRender = [focusKey];
        void this.render();
      },
    });
  }

  private renderNumber(main: HTMLElement, label: string, protocol: BadgeProtocol): void {
    ProtocolBadge.forProtocol(
      main.createDiv({ cls: "workout-sets-number", text: label }),
      protocol,
    );
  }

  /**
   * A row's field: a checkbox for a yes/no parameter, else a NumberField
   * with last time's value as its suggestion
   * @param onEnter - Enter in the field logs the row
   */
  private renderInput(
    cell: HTMLElement,
    key: RowKey,
    setText: string,
    row: SetRow,
    draft: SetDraft,
    param: ParameterDefinition,
    column: string,
    index: number,
    onEnter: () => void,
  ): RowField {
    const label = t("sets.fieldOfSet", { field: column, set: setText });
    const focusKey = FOCUS.field(key, index);
    if (param.type === "boolean") {
      const box = cell.createDiv({ cls: "workout-sets-field" }).createEl("input", {
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

    return NumberField.create(cell, {
      className: "workout-sets-field",
      label,
      value: draft.values[param.key],
      suggestion: row.placeholders[param.key],
      integer: param.type === "number" && fieldFor(param).integer,
      text: param.type === "string",
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
    key: RowKey,
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
      focusKeyPrefix: FOCUS.protocol(key),
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
    this.drafts[rowGroup(row)].splice(draftIndex(row, drawn), 1);
    this.adjustExtra(rowGroup(row), -1);
    this.openRow = undefined;
    this.focusAfterRender = [FOCUS.addSet];
    void this.render();
  }

  /** Removes an extra round added with "Add round" while preserving other rounds' drafts */
  private removeSupersetRound(round: SupersetRound, drawn: SupersetDrawn): void {
    const group: RowGroup = round.warmup ? "warmup" : "working";
    const todayCounts = round.warmup ? drawn.todayWarmupCounts : drawn.todayWorkingCounts;
    for (const slot of round.slots) {
      const idx = round.number - 1 - todayCounts[slot.exerciseIndex];
      const list = this.supersetDraftList(group, slot.exerciseIndex);
      if (idx >= 0 && idx < list.length) list.splice(idx, 1);
    }
    this.adjustExtra(group, -1);
    if (this.openRow) {
      const open = parseRowKey(this.openRow);
      if (open.group === group && open.number === round.number) {
        this.openRow = undefined;
      }
    }
    this.focusAfterRender = [FOCUS.addRound];
    void this.render();
  }

  /** Logs a slot in a superset round */
  private async logSupersetSlot(
    slot: SupersetSlot,
    drawn: SupersetDrawn,
    el: HTMLElement,
    fields: RowField[],
  ): Promise<void> {
    if (this.saving !== undefined) return;
    const { row, exercise, exerciseIndex, parameters } = slot;
    const key = rowKey(row, exerciseIndex);
    const group = rowGroup(row);
    const todayCounts = row.warmup ? drawn.todayWarmupCounts : drawn.todayWorkingCounts;
    const todayCount = todayCounts[exerciseIndex];
    const draft = this.supersetDraftOf(group, exerciseIndex, row.number, todayCount);
    const result = rowToFormData(row, draft, {
      exercise,
      workout: this.workout,
      parameters,
      block: this.params.id,
    });
    if (!this.applyFieldErrors(el, fields, parameters, result)) return;

    const restore = this.snapshot();
    const list = this.supersetDraftList(group, exerciseIndex);
    list.splice(row.number - 1 - todayCount, 1);

    const loggedAsWarmup = isWarmupProtocol(result.data.protocol);
    if (row.warmup) {
      const baseWarmups = Math.max(drawn.plannedWarmups, ...drawn.todayWarmupCounts);
      if (row.number > baseWarmups && todayCount + 1 > baseWarmups) this.adjustExtra("warmup", -1);
    } else if (loggedAsWarmup) {
      const baseWorking = Math.max(drawn.plannedWorking, ...drawn.todayWorkingCounts);
      if (row.number > baseWorking) {
        const allEmptyInRound = drawn.rounds
          .find((r) => !r.warmup && r.number === row.number)
          ?.slots.every((s) => s.exerciseIndex === exerciseIndex || !s.row.logged);
        if (allEmptyInRound) this.adjustExtra("working", -1);
      }
    } else {
      const baseWorking = Math.max(drawn.plannedWorking, ...drawn.todayWorkingCounts);
      if (row.number > baseWorking && todayCount + 1 > baseWorking) this.adjustExtra("working", -1);
    }

    this.shiftOpenRowOnLog(key, group, row.number, exerciseIndex);
    this.saving = key;
    this.focusAfterRender = this.nextSupersetFocus(drawn, row, exerciseIndex, loggedAsWarmup);
    this.announceAfterRender = true;

    try {
      await this.plugin.addWorkoutLogEntry(
        toEntry(result.data, {
          now: new Date(),
          pageLink: PathUtils.toWikiLink(this.sourcePath),
        }),
      );
      const slotRest = supersetSlotRest(this.params, drawn.sectionRest, {
        isWarmup: loggedAsWarmup,
        exerciseIndex,
        exerciseCount: drawn.exerciseCount,
        roundIndex: row.number - 1,
        totalWorkingRounds: drawn.workingRounds,
      });
      if (slotRest) {
        this.activeRest = slotRest;
        this.restTimer.restart(slotRest);
      } else if (this.activeRest) {
        this.restTimer.cancel(this.activeRest);
        this.activeRest = undefined;
      }
    } catch (error) {
      await this.rollBack(restore, error);
    } finally {
      this.saving = undefined;
    }
  }

  private nextSupersetFocus(
    drawn: SupersetDrawn,
    loggedRow: SetRow,
    exerciseIndex: number,
    loggedAsWarmup: boolean,
  ): string[] {
    if (!loggedRow.warmup && loggedAsWarmup) {
      const sameKey = rowKey(loggedRow, exerciseIndex);
      return [FOCUS.field(sameKey, 0), FOCUS.check(sameKey), FOCUS.addRound];
    }
    const candidates: string[] = [];
    let seenCurrent = false;
    for (const round of drawn.rounds) {
      for (const s of round.slots) {
        if (!seenCurrent) {
          if (!!round.warmup === !!loggedRow.warmup && round.number === loggedRow.number && s.exerciseIndex === exerciseIndex) {
            seenCurrent = true;
          }
          continue;
        }
        if (!s.row.logged) {
          const nextKey = rowKey(s.row, s.exerciseIndex);
          candidates.push(FOCUS.field(nextKey, 0), FOCUS.check(nextKey));
        }
      }
    }
    candidates.push(FOCUS.addRound);
    return candidates;
  }

  private async unlogSupersetSlot(
    slot: SupersetSlot,
    set: WorkoutLogData,
    drawn: SupersetDrawn,
  ): Promise<void> {
    if (this.saving !== undefined) return;
    const { row, exerciseIndex, parameters } = slot;
    const key = rowKey(row, exerciseIndex);
    const label = slotLabel(row, exerciseIndex);
    const group = rowGroup(row);
    const todayCounts = row.warmup ? drawn.todayWarmupCounts : drawn.todayWorkingCounts;
    const groupTodayCount = todayCounts[exerciseIndex];
    const groupPlanned = row.warmup ? drawn.plannedWarmups : drawn.plannedWorking;

    const restore = this.snapshot();
    const draft = draftFromSet(set, parameters);
    const list = this.supersetDraftList(group, exerciseIndex);

    const maxBefore = Math.max(0, ...todayCounts);
    const maxAfter = Math.max(
      0,
      ...todayCounts.map((count, i) => (i === exerciseIndex ? count - 1 : count)),
    );
    const keepsRound = Math.max(groupPlanned, maxAfter) < Math.max(groupPlanned, maxBefore);

    list.unshift(draft);
    if (keepsRound) this.adjustExtra(group, 1);
    this.shiftOpenRowOnUnlog(key, group, row.number, groupTodayCount, exerciseIndex);
    this.saving = key;
    const freedKey = rowKey({ warmup: row.warmup, number: groupTodayCount }, exerciseIndex);
    this.focusAfterRender = [FOCUS.field(freedKey, 0), FOCUS.check(freedKey)];
    this.announceAfterRender = true;

    try {
      await this.plugin.deleteWorkoutLogEntry(set);
    } catch (error) {
      await this.rollBack(restore, error);
      return;
    } finally {
      this.saving = undefined;
    }

    const cancelTarget = this.activeRest ?? drawn.roundRest;
    if (
      !row.warmup &&
      set === drawn.mostRecentWorkingSet &&
      cancelTarget &&
      this.restTimer.isRunning(cancelTarget)
    ) {
      this.restTimer.cancel(cancelTarget);
      this.activeRest = undefined;
    }

    this.offerUndo(label, set, {
      canUndo: () => list.includes(draft),
      takeBack: () => {
        list.splice(list.indexOf(draft), 1);
        if (keepsRound) this.adjustExtra(group, -1);
        this.openRow = undefined;
      },
      giveBack: () => {
        list.unshift(draft);
        if (keepsRound) this.adjustExtra(group, 1);
      },
    });
  }

  private applyFieldErrors(
    el: HTMLElement,
    fields: RowField[],
    parameters: ParameterDefinition[],
    result: ReturnType<typeof rowToFormData>,
  ): result is { data: LogFormData } {
    for (const field of fields) field.setError();
    el.querySelector(":scope > .workout-field-error")?.remove();
    if ("error" in result) {
      const field = fields[parameters.findIndex((p) => p.key === result.error.field)];
      field?.setError(result.error.message);
      if (field?.input.type !== "text") {
        el.createDiv({ cls: "workout-field-error", text: result.error.message, attr: { role: "alert" } });
      }
      field?.input.focus();
      return false;
    }
    return true;
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
    const key = rowKey(row);
    const group = rowGroup(row);
    const draft = this.draftOf(row, drawn);
    const result = rowToFormData(row, draft, {
      exercise,
      workout: this.workout,
      parameters: drawn.parameters,
      block: this.params.id,
    });
    if (!this.applyFieldErrors(el, fields, drawn.parameters, result)) return;

    // Out of the drafts before the set is added: the log:added redraw
    // already shows it as logged, and the rows after it keep their drafts
    const restore = this.snapshot();
    this.drafts[group].splice(draftIndex(row, drawn), 1);
    const loggedAsWarmup = isWarmupProtocol(result.data.protocol);
    if (row.warmup) {
      if (drawn.todayWarmupCount >= drawn.plannedWarmups) this.adjustExtra("warmup", -1);
    } else if (loggedAsWarmup) {
      if (row.number > Math.max(drawn.plannedWorking, drawn.todayWorkingCount)) {
        this.adjustExtra("working", -1);
      }
    } else if (drawn.todayWorkingCount >= drawn.plannedWorking) {
      this.adjustExtra("working", -1);
    }
    this.shiftOpenRowOnLog(key, group, row.number);
    this.saving = key;
    // After the log:added redraw: the next row to fill in, else "Add set"
    if (row.warmup) {
      const nextWarmup = rowKey({ warmup: true, number: row.number + 1 });
      const firstUnloggedWorking = rowKey({
        warmup: false,
        number: drawn.todayWorkingCount + (loggedAsWarmup ? 1 : 2),
      });
      this.focusAfterRender = [
        FOCUS.field(nextWarmup, 0),
        FOCUS.check(nextWarmup),
        FOCUS.field(firstUnloggedWorking, 0),
        FOCUS.check(firstUnloggedWorking),
        FOCUS.addSet,
      ];
    } else {
      const nextWorking = rowKey({
        warmup: false,
        number: loggedAsWarmup ? row.number : row.number + 1,
      });
      this.focusAfterRender = [FOCUS.field(nextWorking, 0), FOCUS.check(nextWorking), FOCUS.addSet];
    }
    this.announceAfterRender = true;
    try {
      await this.plugin.addWorkoutLogEntry(
        toEntry(result.data, {
          now: new Date(),
          pageLink: PathUtils.toWikiLink(this.sourcePath),
        }),
      );
      // Warm-up sets never auto-start the working rest timer; working sets rest
      // unless that was the last unlogged working row
      if (!loggedAsWarmup) {
        const workingLeft = drawn.rows.filter((r) => !r.warmup && !r.logged).length - 1;
        if (drawn.rest && workingLeft > 0) {
          this.activeRest = drawn.rest;
          this.restTimer.restart(drawn.rest);
        }
      }
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
    const key = rowKey(row);
    const label = setLabel(row);
    const group = rowGroup(row);
    const groupTodayCount = row.warmup ? drawn.todayWarmupCount : drawn.todayWorkingCount;
    const groupPlanned = row.warmup ? drawn.plannedWarmups : drawn.plannedWorking;
    const restore = this.snapshot();
    const draft = draftFromSet(set, drawn.parameters);
    const keepsRow = groupTodayCount > groupPlanned;
    this.drafts[group].unshift(draft);
    if (keepsRow) this.adjustExtra(group, 1);
    this.shiftOpenRowOnUnlog(key, group, row.number, groupTodayCount);
    this.saving = key;
    // After the log:deleted redraw: the row it went back to
    const freedKey = rowKey({ warmup: row.warmup, number: groupTodayCount });
    this.focusAfterRender = [FOCUS.field(freedKey, 0), FOCUS.check(freedKey)];
    this.announceAfterRender = true;
    try {
      await this.plugin.deleteWorkoutLogEntry(set);
    } catch (error) {
      await this.rollBack(restore, error);
      return;
    } finally {
      this.saving = undefined;
    }
    // The rest running now was started by this working set when it was the last one
    const cancelTarget = this.activeRest ?? drawn.rest;
    if (
      !row.warmup &&
      cancelTarget &&
      row.number === drawn.todayWorkingCount &&
      this.restTimer.isRunning(cancelTarget)
    ) {
      this.restTimer.cancel(cancelTarget);
      this.activeRest = undefined;
    }
    this.offerUndo(label, set, {
      // Ticked again in the meantime: the set is back already
      canUndo: () => this.drafts[group].includes(draft),
      takeBack: () => {
        this.drafts[group].splice(this.drafts[group].indexOf(draft), 1);
        if (keepsRow) this.adjustExtra(group, -1);
        this.openRow = undefined;
      },
      giveBack: () => {
        this.drafts[group].unshift(draft);
        if (keepsRow) this.adjustExtra(group, 1);
      },
    });
  }

  /**
   * "Set 2 removed · Undo". Undo puts the deleted set back as it was
   * (entered weight and unit, protocol, notes, timestamp) and takes its row's
   * draft back; if that fails the draft stays, so nothing typed is lost.
   */
  private offerUndo(
    setText: string,
    set: WorkoutLogData,
    draft: { canUndo: () => boolean; takeBack: () => void; giveBack: () => void },
  ): void {
    UndoNotice.show({
      message: t("sets.setRemoved", { set: setText }),
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

  private adjustExtra(group: RowGroup, delta: number): void {
    if (group === "warmup") this.extraWarmups = Math.max(this.extraWarmups + delta, 0);
    else this.extraRows = Math.max(this.extraRows + delta, 0);
  }

  private shiftOpenRowOnLog(
    key: RowKey,
    group: RowGroup,
    number: number,
    exerciseIndex?: number,
  ): void {
    if (this.openRow === key) {
      this.openRow = undefined;
      return;
    }
    if (!this.openRow) return;
    const open = parseRowKey(this.openRow);
    if (open.group === group && open.exerciseIndex === exerciseIndex && open.number > number) {
      this.openRow = rowKey({ warmup: group === "warmup", number: open.number - 1 }, exerciseIndex);
    }
  }

  private shiftOpenRowOnUnlog(
    key: RowKey,
    group: RowGroup,
    number: number,
    groupTodayCount: number,
    exerciseIndex?: number,
  ): void {
    if (this.openRow === key) {
      this.openRow = rowKey({ warmup: group === "warmup", number: groupTodayCount }, exerciseIndex);
      return;
    }
    if (!this.openRow) return;
    const open = parseRowKey(this.openRow);
    if (
      open.group === group &&
      open.exerciseIndex === exerciseIndex &&
      open.number > number &&
      open.number <= groupTodayCount
    ) {
      this.openRow = rowKey({ warmup: group === "warmup", number: open.number - 1 }, exerciseIndex);
    }
  }

  /**
   * The rows as they are now (drafts, added rows, open details), to put back
   * when a log change made ahead of the save fails
   */
  private snapshot(): () => void {
    const drafts = { warmup: [...this.drafts.warmup], working: [...this.drafts.working] };
    const supersetDrafts = new Map(
      Array.from(this.supersetDrafts.entries(), ([k, v]) => [k, [...v]]),
    );
    const { extraRows, extraWarmups, openRow } = this;
    return () => {
      this.drafts = drafts;
      this.supersetDrafts = supersetDrafts;
      this.extraRows = extraRows;
      this.extraWarmups = extraWarmups;
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
    const list = this.drafts[rowGroup(row)];
    const index = draftIndex(row, drawn);
    while (list.length <= index) list.push(emptyDraft());
    return list[index];
  }

  private supersetDraftList(group: RowGroup, exerciseIndex: number): SetDraft[] {
    const key = `${group}-${exerciseIndex}`;
    let list = this.supersetDrafts.get(key);
    if (!list) {
      list = [];
      this.supersetDrafts.set(key, list);
    }
    return list;
  }

  private supersetDraftOf(
    group: RowGroup,
    exerciseIndex: number,
    roundNumber: number,
    todayCount: number,
  ): SetDraft {
    const list = this.supersetDraftList(group, exerciseIndex);
    const index = roundNumber - 1 - todayCount;
    while (list.length <= index) list.push(emptyDraft());
    return list[index];
  }
}
