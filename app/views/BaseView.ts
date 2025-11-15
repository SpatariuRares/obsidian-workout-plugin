import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { DataFilter } from "@app/services/data/DataFilter";
import {
  LoadingSpinner,
  EmptyState,
  InfoBanner,
} from "@app/components/molecules";
import { ErrorMessage } from "@app/components/atoms";
import { DebugInfoPanel } from "@app/components/shared";
import { LogCallouts } from "@app/features/logs/components/LogCallouts";
import { EmbeddedViewParams } from "@app/types";

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
    _data?: unknown
  ): void {}

  /**
   * Common error handling pattern for all views
   */
  protected handleError(container: HTMLElement, error: Error): void {
    ErrorMessage.render(container, error.message, "Error");
  }

  /**
   * Common pattern for handling empty data
   */
  protected handleEmptyData(
    container: HTMLElement,
    logData: WorkoutLogData[],
    exerciseName?: string
  ): boolean {
    if (logData.length === 0) {
      LogCallouts.renderCsvNoDataMessage(container, this.plugin, exerciseName);
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
    logData: WorkoutLogData[],
    viewType: "chart" | "table" | "timer" | "dashboard"
  ): void {
    // Check if this is a combined exercise + workout case
    if (titlePrefix && titlePrefix.includes(" + ")) {
      const [exercise, workout] = titlePrefix.split(" + ");
      const workoutFilename =
        workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
      InfoBanner.render(
        container,
        `No data found for exercise ${exercise} in workout ${workoutFilename}.`,
        "warning"
      );
      if (exercise) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exercise,
          this.plugin
        );
      }
      return;
    }

    const isWorkoutView =
      viewType === "chart"
        ? ("chartType" in params
            ? params.chartType || "exercise"
            : "exercise") === "workout"
        : !("exercise" in params ? params.exercise : undefined);

    if (isWorkoutView) {
      InfoBanner.render(
        container,
        `No data found for workout ${titlePrefix}.`,
        "warning"
      );
    } else {
      const exerciseName = "exercise" in params ? params.exercise || "" : "";
      LogCallouts.renderNoMatchMessage(container);
      if (exerciseName) {
        LogCallouts.renderCreateLogButtonForExercise(
          container,
          exerciseName,
          this.plugin
        );
      }
    }
  }

  /**
   * Common loading indicator pattern
   */
  protected showLoadingIndicator(container: HTMLElement): HTMLElement {
    return LoadingSpinner.create(container, {
      message: "loading data...",
      icon: "⏳",
      className: "workout-charts-loading",
    });
  }

  /**
   * Common data filtering pattern
   */
  protected filterData(
    logData: WorkoutLogData[],
    params: EmbeddedViewParams,
    debugMode: boolean
  ) {
    return DataFilter.filterData(logData, params, debugMode);
  }

  /**
   * Common validation error handling pattern
   */
  protected validateAndHandleErrors(
    container: HTMLElement,
    validationErrors: string[]
  ): boolean {
    if (validationErrors.length > 0) {
      ErrorMessage.render(
        container,
        `Invalid parameters:\n${validationErrors.join("\n")}`,
        "Validation Error"
      );
      return false;
    }
    return true;
  }

  /**
   * Common success message pattern
   */
  protected showSuccessMessage(container: HTMLElement, message: string): void {
    InfoBanner.render(container, message, "success");
  }

  /**
   * Common debug info rendering pattern
   */
  protected renderDebugInfo(
    container: HTMLElement,
    filteredData: WorkoutLogData[],
    dataType: string,
    filterMethodUsed: string,
    debugMode: boolean
  ): void {
    if (debugMode) {
      DebugInfoPanel.render(
        container,
        filteredData,
        dataType,
        filterMethodUsed
      );
    }
  }
}
