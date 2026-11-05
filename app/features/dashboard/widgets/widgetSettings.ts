/** A choice offered by an enum or list setting */
export interface WidgetSettingOption {
  value: string;
  label(): string;
}

/** One option picked out of a few, shown as chips */
export interface ChoiceSetting {
  kind: "choice";
  key:
    | "heatMapTimeFrame"
    | "heatMapMetric"
    | "heatMapView"
    | "protocolChartType"
    | "protocolSortBy";
  label(): string;
  options: WidgetSettingOption[];
}

/**
 * A block parameter that only one widget reads, edited from its own menu.
 * A number, a choice and a toggle start on their schema default
 * (`dashboardBlock.defaults`) when unset; a number without one is a limit
 * that may stay unset, and a multi setting starts as "every option".
 */
export type WidgetSetting =
  | {
      kind: "number";
      key:
        | "recentWorkoutsLimit"
        | "volumeTrendDays"
        | "volumeTopLimit"
        | "calendarWeeks"
        | "protocolDays"
        | "protocolMinEntries"
        | "durationRecentCount"
        | "durationRestSeconds"
        | "fileErrorsMaxItems"
        | "fileErrorsMaxTags";
      label(): string;
      /**
       * What the form accepts. `min` is the schema's; `max` only keeps the
       * form sensible, so a block already holding more still reads
       */
      min: number;
      max: number;
      /** What − and + add or take away */
      step: number;
      /** Shown at the end of the field ("days") */
      unit?(): string;
    }
  | ChoiceSetting
  | {
      kind: "multi";
      key:
        | "quickStatsPeriods"
        | "quickStatsMetrics"
        | "summaryMetrics"
        | "quickActionsShown";
      label(): string;
      options: WidgetSettingOption[];
    }
  | {
      kind: "toggle";
      key:
        | "volumeShowBreakdown"
        | "calendarShowStats"
        | "heatMapShowImbalance"
        | "durationShowTrend"
        | "fileErrorsCheckSharedNames"
        | "muscleTagsGroupByMuscle";
      label(): string;
    };
