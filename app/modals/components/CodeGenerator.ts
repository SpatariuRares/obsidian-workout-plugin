// Utility class for generating code blocks
import { MODAL_CODE_BLOCKS } from "@app/constants/ModalConstants";
import { TABLE_DEFAULTS } from "@app/constants/TableConstats";
import { CHART_TYPE, EmbeddedChartParams, EmbeddedTimerParams, TableCodeOptions, TableColumnType, TIMER_TYPE, TABLE_TYPE } from "@app/types";
import { TEXT_CONSTANTS, UI_LABELS } from "@app/constants";

export class CodeGenerator {
  /**
   * Generates workout chart code
   */
  static generateChartCode(params: EmbeddedChartParams): string {
    const lines: string[] = [`\`\`\`${MODAL_CODE_BLOCKS.CHART}`];

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
    const lines: string[] = [`\`\`\`${MODAL_CODE_BLOCKS.TABLE}`];

    // Add target (exercise, workout, or both)
    if (params.tableType === TABLE_TYPE.COMBINED) {
      if (params.exercise) lines.push(`exercise: ${params.exercise}`);
      if (params.workout) lines.push(`workout: ${params.workout}`);
    } else if (params.tableType === TABLE_TYPE.EXERCISE && params.exercise) {
      lines.push(`exercise: ${params.exercise}`);
    } else if (params.tableType === TABLE_TYPE.WORKOUT && params.workout) {
      lines.push(`workout: ${params.workout}`);
    }

    // Add configuration
    lines.push(`limit: ${params.limit}`);

    // Add columns configuration
    if (params.columnsType !== TableColumnType.STANDARD) {
      const columnsMap = {
        minimal: [UI_LABELS.TABLE.DATE, UI_LABELS.TABLE.EXERCISE, TEXT_CONSTANTS.CHARTS.LABELS.REPS, TEXT_CONSTANTS.COMMON.UNITS.WEIGHT_KG],
      };
      const columns = columnsMap[params.columnsType as keyof typeof columnsMap];
      if (columns) {
        lines.push(`columns: [${columns.map((c) => `"${c}"`).join(", ")}]`);
      }
    }

    // Add display options
    if (!params.showAddButton) lines.push(`showAddButton: false`);
    if (params.buttonText !== TABLE_DEFAULTS.BUTTON_TEXT) {
      lines.push(`buttonText: "${params.buttonText}"`);
    }

    // Add advanced options
    if (params.searchByName) lines.push(`searchByName: true`);
    if (params.exactMatch) lines.push(`exactMatch: true`);

    lines.push("```");

    return lines.join("\n");
  }

  /**
   * Generates workout timer code
   */
  static generateTimerCode(params: EmbeddedTimerParams): string {
    const lines: string[] = [`\`\`\`${MODAL_CODE_BLOCKS.TIMER}`];
    if (!params.type) {
      throw new Error("Timer type is required");
    }

    if (params.type === TIMER_TYPE.COUNTDOWN && params.duration) {
      lines.push(`duration: ${params.duration}`);
    } else if (
      params.type === TIMER_TYPE.INTERVAL &&
      params.intervalTime &&
      params.rounds
    ) {
      lines.push(`intervalTime: ${params.intervalTime}`);
      lines.push(`rounds: ${params.rounds}`);
    }

    lines.push(`type: ${params.type}`);
    lines.push(`title: ${params.title}`);
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
    const lines: string[] = [`\`\`\`${MODAL_CODE_BLOCKS.DASHBOARD}`];
    lines.push("```");

    return lines.join("\n");
  }
}
