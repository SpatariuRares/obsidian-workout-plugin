import { WorkoutLogData } from "../types/WorkoutLogData";
import type WorkoutChartsPlugin from "../../main";
import { UIComponents, DataFilter } from "../components";

/**
 * Base class for all embedded views that provides common functionality
 * and reduces code duplication across Chart, Table, and Timer views.
 */
export abstract class BaseView {
  constructor(protected plugin: WorkoutChartsPlugin) {}

  /**
   * Common debug logging method used across all views
   */
  protected logDebug(className: string, message: string, data?: any): void {
    if (this.plugin.settings.debugMode) {
      console.log(`${className}: ${message}`, data);
    }
  }

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
      UIComponents.renderNoDataMessage(container);
      return true;
    }
    return false;
  }

  /**
   * Common pattern for handling no filtered data
   */
  protected handleNoFilteredData(
    container: HTMLElement,
    params: any,
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
        `Nessun dato trovato per l'esercizio <strong>${exercise}</strong> nell'allenamento <strong>${workoutFilename}</strong>.`,
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
        ? (params.chartType || "exercise") === "workout"
        : !params.exercise;

    if (isWorkoutView) {
      UIComponents.renderInfoMessage(
        container,
        `Nessun dato trovato per l'allenamento <strong>${titlePrefix}</strong>.`,
        "warning"
      );
    } else {
      UIComponents.renderNoMatchMessage(
        container,
        params.exercise || "",
        logData
      );
      if (params.exercise) {
        UIComponents.createCreateLogButtonForMissingExercise(
          container,
          params.exercise,
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
    params: any,
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
        `Parametri non validi:\n${validationErrors.join("\n")}`
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
