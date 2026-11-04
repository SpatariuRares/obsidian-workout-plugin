import { MarkdownRenderChild } from "obsidian";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { DataFilter } from "@app/services/data/DataFilter";
import { LoadingSpinner } from "@app/components/molecules";
import { Feedback } from "@app/components/atoms/Feedback";
import { LogCallouts } from "@app/features/modals/log/LogCallouts";
import { CHART_TYPE } from "@app/types/WorkoutConfigTypes";
import { EmbeddedViewParams } from "@app/types/PluginTypes";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { t } from "@app/i18n";
import { CONSTANTS, ICONS } from "@app/constants";
/**
 * Base class for all embedded views that provides common functionality
 * and reduces code duplication across Chart, Table, and Timer views.
 */
export abstract class BaseView {
  /** Render children this view made (see track), unloaded by cleanup */
  private tracked = new Set<MarkdownRenderChild>();

  constructor(protected plugin: WorkoutPluginContext) {}

  /** Keeps a render child until it unloads, so cleanup can unload it with the plugin */
  protected track<C extends MarkdownRenderChild>(child: C): C {
    this.tracked.add(child);
    child.register(() => this.tracked.delete(child));
    return child;
  }

  /** Called on plugin unload; views with more to release override it */
  cleanup(): void {
    for (const child of [...this.tracked]) child.unload();
    this.tracked.clear();
  }

  /**
   * Common error handling pattern for all views
   */
  protected handleError(container: HTMLElement, error: unknown): void {
    Feedback.renderError(container, ErrorUtils.getErrorMessage(error), {
      title: CONSTANTS.WORKOUT.ERRORS.TYPES.GENERIC,
    });
  }

  /**
   * Common pattern for handling empty data
   */
  protected handleEmptyData(
    container: HTMLElement,
    logData: WorkoutLogData[],
    exerciseName?: string,
    sourcePath?: string,
    editAction?: BlockMenuAction,
  ): boolean {
    if (logData.length === 0) {
      LogCallouts.renderCsvNoDataMessage(
        container,
        this.plugin,
        exerciseName,
        sourcePath,
        editAction,
      );
      return true;
    }
    return false;
  }

  /**
   * The rows a block shows, filtered by its parameters; null once it has
   * drawn why there are none: an empty log (with the button to log a first
   * set) or no row matching the filters.
   * @param title - Names the rows in the no-match message (the filter's own by default)
   */
  protected filteredOrExplain(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: EmbeddedViewParams,
    viewType: VIEW_TYPES,
    { sourcePath, title }: { sourcePath?: string; title?: string } = {},
  ): WorkoutLogData[] | null {
    if (this.handleEmptyData(container, logData, undefined, sourcePath)) return null;
    const result = this.filterData(logData, params);
    if (result.filteredData.length > 0) return result.filteredData;
    this.handleNoFilteredData(container, params, title ?? result.titlePrefix, viewType);
    return null;
  }

  /** Explains a block whose filters match no row */
  protected handleNoFilteredData(
    container: HTMLElement,
    params: EmbeddedViewParams,
    titlePrefix: string,
    viewType: VIEW_TYPES,
  ): void {
    // Check if this is a combined exercise + workout case
    if (titlePrefix && titlePrefix.includes(" + ")) {
      const [exercise, workout] = titlePrefix.split(" + ");
      const workoutFilename =
        workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
      Feedback.renderWarning(
        container,
        t("codeBlocks.noDataForExerciseInWorkout", {
          exercise,
          workout: workoutFilename,
        }),
      );
      if (exercise) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exercise,
          this.plugin,
        );
      }
      return;
    }

    const isWorkoutView =
      viewType === VIEW_TYPES.CHART
        ? "chartType" in params && params.chartType === CHART_TYPE.WORKOUT
        : !("exercise" in params && params.exercise);

    if (isWorkoutView) {
      Feedback.renderWarning(
        container,
        t("codeBlocks.noDataForWorkout", { workout: titlePrefix }),
      );
    } else {
      const exerciseName =
        "exercise" in params
          ? (params as { exercise?: string }).exercise || ""
          : "";
      LogCallouts.renderNoMatchMessage(container);
      if (exerciseName) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exerciseName,
          this.plugin,
        );
      }
    }
  }

  /**
   * Common loading indicator pattern
   */
  protected showLoadingIndicator(
    container: HTMLElement,
  ): HTMLElement {
    return LoadingSpinner.create(container, {
      message: t("codeBlocks.loading"),
      icon: ICONS.STATUS.LOADING,
      className: "workout-feedback-info",
    });
  }

  /**
   * Common data filtering pattern
   */
  protected filterData(
    logData: WorkoutLogData[],
    params: EmbeddedViewParams,
  ) {
    return DataFilter.filterData(logData, params);
  }
}

/** Show why a code block's parameters can't be used, one line per problem */
export function renderInvalidParams(
  container: HTMLElement,
  errors: string[],
): void {
  Feedback.renderError(
    container,
    `${t("codeBlocks.validation.title")}\n${errors.join("\n")}`,
  );
}
