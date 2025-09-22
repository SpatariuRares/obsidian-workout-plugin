import { TableData } from "./types";

export class TableFooter {
  /**
   * Render table footer with statistics
   */
  static render(container: HTMLElement, tableData: TableData): void {
    const { totalRows, filterResult, params } = tableData;

    const footerDiv = container.createEl("div", {
      cls: "table-footer",
    });

    let footerText = `📊 Found ${totalRows} logs`;

    if (params.exercise && params.workout) {
      const workoutFilename = this.extractWorkoutFilename(params.workout);
      footerText += ` for "${params.exercise}" in workout "${workoutFilename}"`;
    } else if (params.exercise) {
      footerText += ` for "${params.exercise}"`;
    } else if (params.workout) {
      const workoutFilename = this.extractWorkoutFilename(params.workout);
      footerText += ` in workout "${workoutFilename}"`;
    } else {
      footerText += ` total`;
    }

    footerText += `. (Method: ${
      filterResult.filterMethodUsed
    }). Showing max ${params.limit || 50}. [CSV Mode]`;

    footerDiv.textContent = footerText;
  }

  /**
   * Extract workout filename from full path
   */
  private static extractWorkoutFilename(workout: string): string {
    return workout.split("/").pop()?.replace(/\.md$/i, "") || workout;
  }
}