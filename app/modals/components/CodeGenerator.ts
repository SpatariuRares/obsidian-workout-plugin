// Utility class for generating code blocks
export class CodeGenerator {
  /**
   * Generates workout chart code
   */
  static generateChartCode(params: {
    chartType: string;
    dataType: string;
    exercise: string;
    workout: string;
    dateRange: number;
    limit: number;
    showTrendLine: boolean;
    showTrend: boolean;
    showStats: boolean;
    exactMatch: boolean;
    debug: boolean;
    title: string;
  }): string {
    const lines: string[] = ["```workout-chart"];

    // Add chart type
    lines.push(`chartType: ${params.chartType}`);

    // Add data type
    lines.push(`type: ${params.dataType}`);

    // Add target (exercise, workout, or both)
    if (params.chartType === "combined") {
      if (params.exercise) lines.push(`exercise: ${params.exercise}`);
      if (params.workout) lines.push(`workout: ${params.workout}`);
    } else if (params.chartType === "exercise" && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.chartType === "workout" && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`dateRange: ${params.dateRange}`);
    lines.push(`limit: ${params.limit}`);

    // Add display options
    lines.push(`showTrendLine: ${params.showTrendLine}`);
    lines.push(`showTrend: ${params.showTrend}`);
    lines.push(`showStats: ${params.showStats}`);

    // Add advanced options
    if (params.exactMatch) lines.push(`exactMatch: true`);
    if (params.debug) lines.push(`debug: true`);
    if (params.title) lines.push(`title: ${params.title}`);

    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates workout table code
   */
  static generateTableCode(params: {
    tableType: string;
    exercise: string;
    workout: string;
    limit: number;
    columnsType: string;
    showAddButton: boolean;
    buttonText: string;
    searchByName: boolean;
    exactMatch: boolean;
    debug: boolean;
  }): string {
    const lines: string[] = ["```workout-log"];

    // Add target (exercise, workout, or both)
    if (params.tableType === "combined") {
      if (params.exercise) lines.push(`exercise: ${params.exercise}`);
      if (params.workout) lines.push(`workout: ${params.workout}`);
    } else if (params.tableType === "exercise" && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.tableType === "workout" && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`limit: ${params.limit}`);

    // Add columns configuration
    if (params.columnsType !== "standard") {
      const columnsMap = {
        minimal: ["Date", "Exercise", "Reps", "Weight (kg)"],
      };
      const columns = columnsMap[params.columnsType as keyof typeof columnsMap];
      if (columns) {
        lines.push(`columns: [${columns.map((c) => `"${c}"`).join(", ")}]`);
      }
    }

    // Add display options
    if (!params.showAddButton) lines.push(`showAddButton: false`);
    if (params.buttonText !== "➕ Add Log") {
      lines.push(`buttonText: "${params.buttonText}"`);
    }

    // Add advanced options
    if (params.searchByName) lines.push(`searchByName: true`);
    if (params.exactMatch) lines.push(`exactMatch: true`);
    if (params.debug) lines.push(`debug: true`);

    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates workout timer code
   */
  static generateTimerCode(params: {
    timerType: string;
    duration?: number;
    intervalTime?: number;
    rounds?: number;
    title: string;
    showControls: boolean;
    autoStart: boolean;
    sound: boolean;
  }): string {
    const lines: string[] = ["```workout-timer"];

    if (params.timerType === "countdown" && params.duration) {
      lines.push(`duration: ${params.duration}`);
    } else if (
      params.timerType === "interval" &&
      params.intervalTime &&
      params.rounds
    ) {
      lines.push(`intervalTime: ${params.intervalTime}`);
      lines.push(`rounds: ${params.rounds}`);
    }

    lines.push(`type: ${params.timerType}`);
    lines.push(`title: ${params.title}`);
    lines.push(`showControls: ${params.showControls}`);
    lines.push(`autoStart: ${params.autoStart}`);
    lines.push(`sound: ${params.sound}`);
    lines.push("```");

    return lines.join("\n");
  }
}
