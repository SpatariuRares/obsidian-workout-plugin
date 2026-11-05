import { App } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { InsertChartModal } from "@app/features/charts/modals/InsertChartModal";
import { chartBlock } from "@app/features/charts/chartBlock";
import type { EmbeddedChartParams } from "@app/features/charts/types";
import type { EditTarget } from "@app/features/modals/base/components/createEditButtons";
import { t } from "@app/i18n";

/**
 * EditChartModal - the chart form opened on an existing block.
 * On submit it patches only the parameters the user changed into the code
 * block, found by its ID or, without one, by its body.
 */
export class EditChartModal extends InsertChartModal {
  /** @param where - The note the block is written in, and how to find it without an id */
  constructor(
    app: App,
    plugin: WorkoutPluginContext,
    private readonly initialParams: EmbeddedChartParams,
    private readonly where: EditTarget,
  ) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.editChart");
  }

  protected getButtonText(): string {
    return t("modal.buttons.updateChart");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.chartUpdated");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    super.createConfigurationSections(container);
    this.prefillFields();
  }

  private prefillFields(): void {
    const params = this.initialParams;
    if (
      !this.dateRangeInput ||
      !this.limitInput ||
      !this.trendLineToggle ||
      !this.trendHeaderToggle ||
      !this.statsToggle ||
      !this.advancedElements ||
      !this.targetElements
    ) {
      return;
    }

    // Only the types the form offers; others keep the form's default
    if (params.chartType) this.chartType?.select(params.chartType);
    this.targetElements.exerciseInput.value = params.exercise ?? "";
    this.targetElements.workoutInput.value = params.workout ?? "";

    // Unset means no restriction, which the form shows as 0
    this.dateRangeInput.value = String(params.dateRange ?? 0);
    this.limitInput.value = String(params.limit ?? 0);
    this.trendLineToggle.checked = params.showTrendLine ?? false;
    this.trendHeaderToggle.checked = params.showTrend ?? true;
    this.statsToggle.checked = params.showStats ?? true;
    this.advancedElements.exactMatchToggle.checked =
      params.exactMatch ?? false;
    if (this.advancedElements.titleInput) {
      this.advancedElements.titleInput.value = params.title ?? "";
    }
  }

  /**
   * The data types on offer depend on the exercise, so they are read
   * before the buttons snapshot the form.
   */
  protected createButtons(container: HTMLElement): void {
    const { type, exercise, id } = this.initialParams;
    void this.updateDataTypeOptions(exercise ?? "").then(() => {
      if (type) this.dataType?.select(type);
      this.editButtons(container, chartBlock, t("modal.notices.chartUpdateFailed"), {
        target: this.where,
        id,
        collectParams: () => this.collectParams(),
      });
    });
  }
}
