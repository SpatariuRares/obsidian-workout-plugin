import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DataFilter } from "@app/services/data/DataFilter";
import { LoadingSpinner } from "@app/components/molecules";
import { Feedback } from "@app/components/atoms/Feedback";
import { LogCallouts } from "@app/components/organism/LogCallouts";
import {
  CHART_TYPE,
  EmbeddedChartParams,
  EmbeddedViewParams,
} from "@app/types";
import { VIEW_TYPES } from "@app/types/ViewTypes";
/**
 * Base class for all embedded views that provides common functionality
 * and reduces code duplication across Chart, Table, and Timer views.
 */
export abstract class BaseView {
  constructor(protected plugin: WorkoutChartsPlugin) {}

  /**
   * Common debug logging method used across all views
   */
  protected logDebug(
    _className: string,
    _message: string,
    _data?: unknown,
  ): void {}

  /**
   * Common error handling pattern for all views
   */
  protected handleError(container: HTMLElement, error: Error): void {
    Feedback.renderError(container, error.message, {
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
    onRefresh?: () => void,
  ): boolean {
    if (logData.length === 0) {
      LogCallouts.renderCsvNoDataMessage(
        container,
        this.plugin,
        exerciseName,
        onRefresh,
      );
      return true;
    }
    return false;
  }

  /**
   * Common pattern for handling no filtered data
   */

  protected handleNoFilteredData(
    container: HTMLElement,
    params: EmbeddedViewParams,
    titlePrefix: string,
    viewType: VIEW_TYPES,
    onRefresh?: () => void,
  ): void {
    // Check if this is a combined exercise + workout case
    if (titlePrefix && titlePrefix.includes(" + ")) {
      const [exercise, workout] = titlePrefix.split(" + ");
      const workoutFilename =
        workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
      Feedback.renderWarning(
        container,
        `No data found for exercise ${exercise} in workout ${workoutFilename}.`,
      );
      if (exercise) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exercise,
          this.plugin,
          onRefresh,
        );
      }
      return;
    }

    const isWorkoutView =
      viewType === VIEW_TYPES.CHART
        ? (() => {
            type ViewCategory = CHART_TYPE.EXERCISE | CHART_TYPE.WORKOUT;
            const effectiveChartCategory: ViewCategory =
              "chartType" in params &&
              (params.chartType === CHART_TYPE.EXERCISE ||
                params.chartType === CHART_TYPE.WORKOUT)
                ? params.chartType
                : CHART_TYPE.EXERCISE;
            return effectiveChartCategory === CHART_TYPE.WORKOUT;
          })()
        : !(
            CONSTANTS.WORKOUT.COMMON.TYPES.EXERCISE in params && params.exercise
          );

    if (isWorkoutView) {
      Feedback.renderWarning(
        container,
        `No data found for workout ${titlePrefix}.`,
      );
    } else {
      const exerciseName =
        CONSTANTS.WORKOUT.COMMON.TYPES.EXERCISE in params
          ? params.exercise || ""
          : "";
      LogCallouts.renderNoMatchMessage(container);
      if (exerciseName) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exerciseName,
          this.plugin,
          onRefresh,
        );
      }
    }
  }

  /**
   * Common loading indicator pattern
   */
  protected showLoadingIndicator(container: HTMLElement): HTMLElement {
    return LoadingSpinner.create(container, {
      message: "Loading data...",
      icon: "⏳",
      className: "workout-feedback-info",
    });
  }

  /**
   * Common data filtering pattern
   */
  protected filterData(logData: WorkoutLogData[], params: EmbeddedViewParams) {
    return DataFilter.filterData(logData, params as EmbeddedChartParams);
  }

  /**
   * Common validation error handling pattern
   */
  protected validateAndHandleErrors(
    container: HTMLElement,
    validationErrors: string[],
  ): boolean {
    if (validationErrors.length > 0) {
      Feedback.renderError(
        container,
        `Invalid parameters:\n${validationErrors.join("\n")}`,
      );
      return false;
    }
    return true;
  }

  /**
   * Common success message pattern
   */
  protected showSuccessMessage(container: HTMLElement, message: string): void {
    Feedback.renderSuccess(container, message);
  }
}
