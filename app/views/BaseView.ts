import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import { UIComponents, DataFilter } from "@app/components";
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
    className: string,
    message: string,
    data?: unknown
  ): void {}

  /**
   * Common error handling pattern for all views
   */
  protected handleError(
    container: HTMLElement,
    error: Error,
    context: string
  ): void {
    console.error(`Error in ${context}:`, error);
    UIComponents.renderErrorMessage(container, error.message);
  }

  /**
   * Common pattern for handling empty data
   */
  protected handleEmptyData(
    container: HTMLElement,
    logData: WorkoutLogData[]
  ): boolean {
    if (logData.length === 0) {
      UIComponents.renderCSVNoDataMessage(
        container,
        this.plugin.settings.csvLogFilePath,
        this.plugin
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
    logData: WorkoutLogData[],
    viewType: "chart" | "table" | "timer"
  ): void {
    // Check if this is a combined exercise + workout case
    if (titlePrefix && titlePrefix.includes(" + ")) {
      const [exercise, workout] = titlePrefix.split(" + ");
      const workoutFilename =
        workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
      UIComponents.renderInfoMessage(
        container,
        `No data found for exercise <strong>${exercise}</strong> in workout <strong>${workoutFilename}</strong>.`,
        "warning"
      );
      if (exercise) {
        UIComponents.createCreateLogButtonForMissingExercise(
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
      UIComponents.renderInfoMessage(
        container,
        `No data found for workout <strong>${titlePrefix}</strong>.`,
        "warning"
      );
    } else {
      const exerciseName = "exercise" in params ? params.exercise || "" : "";
      UIComponents.renderNoMatchMessage(container, exerciseName, logData);
      if (exerciseName) {
        UIComponents.createCreateLogButtonForMissingExercise(
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
    return UIComponents.renderLoadingIndicator(container);
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
      UIComponents.renderErrorMessage(
        container,
        `Invalid parameters:\n${validationErrors.join("\n")}`
      );
      return false;
    }
    return true;
  }

  /**
   * Common success message pattern
   */
  protected showSuccessMessage(container: HTMLElement, message: string): void {
    UIComponents.renderInfoMessage(container, message, "success");
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
      UIComponents.renderDebugInfo(
        container,
        filteredData,
        dataType,
        filterMethodUsed
      );
    }
  }
}
