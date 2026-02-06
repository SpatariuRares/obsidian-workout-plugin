// Utility class for generating code blocks
import { CONSTANTS } from "@app/constants";
import { CHART_TYPE, EmbeddedChartParams } from "@app/features/charts/types";
import { EmbeddedTimerParams, TIMER_TYPE } from "@app/features/timer/types";
import { TableCodeOptions, TABLE_TYPE } from "@app/features/tables/types";

export class CodeGenerator {
  /**
   * Generates workout chart code
   */
  static generateChartCode(params: EmbeddedChartParams): string {
    const lines: string[] = [
      `\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART}`,
    ];

    // Add chart type
    lines.push(`chartType: ${params.chartType}`);

    // Add data type
    lines.push(`type: ${params.type}`);

    // Add target (exercise, workout, or both)
    if (params.chartType === CHART_TYPE.COMBINED) {
      if (params.exercise) lines.push(`exercise: ${params.exercise}`);
      if (params.workout) lines.push(`workout: ${params.workout}`);
    } else if (params.chartType === CHART_TYPE.EXERCISE && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.chartType === CHART_TYPE.WORKOUT && params.workout) {
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
    if (params.title) lines.push(`title: ${params.title}`);

    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates workout table code
   */
  static generateTableCode(params: TableCodeOptions): string {
    const lines: string[] = [
      `\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE}`,
    ];

    // Add target (exercise, workout, or both)
    if (params.tableType === TABLE_TYPE.ALL) {
      // No target specific fields needed for ALL type
    } else if (params.tableType === TABLE_TYPE.COMBINED) {
      if (params.exercise) lines.push(`exercise: ${params.exercise}`);
      if (params.workout) lines.push(`workout: ${params.workout}`);
    } else if (params.tableType === TABLE_TYPE.EXERCISE && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.tableType === TABLE_TYPE.WORKOUT && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`limit: ${params.limit}`);
    if (params.dateRange) lines.push(`dateRange: ${params.dateRange}`);

    // Add display options
    if (!params.showAddButton) lines.push(`showAddButton: false`);
    if (params.buttonText !== CONSTANTS.WORKOUT.TABLE.DEFAULTS.BUTTON_TEXT) {
      lines.push(`buttonText: "${params.buttonText}"`);
    }

    // Add advanced options
    if (params.searchByName) lines.push(`searchByName: true`);
    if (params.exactMatch) lines.push(`exactMatch: true`);

    // Add progressive overload targets
    if (params.targetWeight) lines.push(`targetWeight: ${params.targetWeight}`);
    if (params.targetReps) lines.push(`targetReps: ${params.targetReps}`);

    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates workout timer code
   */
  static generateTimerCode(params: EmbeddedTimerParams): string {
    const lines: string[] = [
      `\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TIMER}`,
    ];

    // If only preset is specified, generate minimal code
    if (params.preset && !params.type) {
      lines.push(`preset: ${params.preset}`);
      lines.push("```");
      return lines.join("\n");
    }

    if (!params.type) {
      throw new Error("Timer type is required");
    }

    // Add preset reference if specified (allows overriding preset values)
    if (params.preset) {
      lines.push(`preset: ${params.preset}`);
    }

    // Duration is used for all timer types
    if (params.duration) {
      lines.push(`duration: ${params.duration}`);
    }
    // Rounds only applies to interval timer
    if (params.type === TIMER_TYPE.INTERVAL && params.rounds) {
      lines.push(`rounds: ${params.rounds}`);
    }

    lines.push(`type: ${params.type}`);
    if (params.title) lines.push(`title: ${params.title}`);
    lines.push(`showControls: ${params.showControls}`);
    lines.push(`autoStart: ${params.autoStart}`);
    lines.push(`sound: ${params.sound}`);
    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates Dashboard code
   */
  static generateDashboardCode(): string {
    const lines: string[] = [
      `\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DASHBOARD}`,
    ];
    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates Duration code
   */
  static generateDurationCode(): string {
    const lines: string[] = [
      `\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.DURATION}`,
    ];
    lines.push("```");

    return lines.join("\n");
  }
}
