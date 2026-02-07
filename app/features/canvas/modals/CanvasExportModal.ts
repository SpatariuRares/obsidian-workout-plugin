/**
 * CanvasExportModal - Modal for configuring canvas export options
 *
 * Provides UI for selecting layout style, whether to include durations/stats,
 * and other canvas export options before generating the canvas file.
 */
import { App, TFile } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CONSTANTS } from "@app/constants";
import type WorkoutChartsPlugin from "main";

import { Button } from "@app/components/atoms";
import type {
  CanvasExportOptions,
  CanvasLayoutType,
} from "@app/features/canvas/types";

/**
 * Modal for configuring canvas export options
 */
export class CanvasExportModal extends ModalBase {
  private workoutFile: TFile;
  private plugin: WorkoutChartsPlugin;
  private onSubmit: (options: CanvasExportOptions) => void;

  // Form elements
  private layoutSelect!: HTMLSelectElement;
  private includeDurationsCheckbox!: HTMLInputElement;
  private includeStatsCheckbox!: HTMLInputElement;
  private connectSupersetsCheckbox!: HTMLInputElement;

  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    workoutFile: TFile,
    onSubmit: (options: CanvasExportOptions) => void,
  ) {
    super(app);
    this.plugin = plugin;
    this.workoutFile = workoutFile;
    this.onSubmit = onSubmit;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    // Title
    contentEl.createEl("h2", {
      text: CONSTANTS.WORKOUT.MODAL.TITLES.CANVAS_EXPORT,
    });

    // Main container
    const mainContainer = this.createStyledMainContainer(contentEl);

    // File info
    this.createCurrentFileInfo(mainContainer, this.workoutFile.basename);

    // Layout section
    const layoutSection = this.createSection(
      mainContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.CANVAS_LAYOUT,
    );
    this.createLayoutOptions(layoutSection);

    // Options section
    const optionsSection = this.createSection(
      mainContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.CANVAS_OPTIONS,
    );
    this.createOptionCheckboxes(optionsSection);

    // Buttons
    this.createButtons(mainContainer);
  }

  /**
   * Create layout type dropdown
   */
  private createLayoutOptions(container: HTMLElement): void {
    const formGroup = this.createFormGroup(container);

    this.layoutSelect = this.createSelect(
      formGroup,
      CONSTANTS.WORKOUT.MODAL.LABELS.LAYOUT_TYPE,
      [
        {
          text: CONSTANTS.WORKOUT.MODAL.LABELS.LAYOUT_HORIZONTAL,
          value: "horizontal",
        },
        {
          text: CONSTANTS.WORKOUT.MODAL.LABELS.LAYOUT_VERTICAL,
          value: "vertical",
        },
        {
          text: CONSTANTS.WORKOUT.MODAL.LABELS.LAYOUT_GROUPED,
          value: "grouped",
        },
      ],
    );
  }

  /**
   * Create option checkboxes
   */
  private createOptionCheckboxes(container: HTMLElement): void {
    // Include durations checkbox
    this.includeDurationsCheckbox = this.createCheckboxField(
      container,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.INCLUDE_DURATIONS,
      false,
      "include-durations",
    );

    // Include stats checkbox
    this.includeStatsCheckbox = this.createCheckboxField(
      container,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.INCLUDE_STATS,
      false,
      "include-stats",
    );

    // Connect supersets checkbox
    this.connectSupersetsCheckbox = this.createCheckboxField(
      container,
      CONSTANTS.WORKOUT.MODAL.CHECKBOXES.CONNECT_SUPERSETS,
      true,
      "connect-supersets",
    );
  }

  /**
   * Create action buttons
   */
  private createButtons(container: HTMLElement): void {
    const buttonsSection = Button.createContainer(container);

    // Cancel button
    const cancelButton = Button.create(buttonsSection, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      className: "workout-charts-button",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });
    Button.onClick(cancelButton, () => this.close());

    // Export button
    const exportButton = Button.create(buttonsSection, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.EXPORT,
      className: "workout-charts-button mod-cta",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.EXPORT,
    });
    Button.onClick(exportButton, () => this.handleExport());
  }

  /**
   * Handle export button click
   */
  private handleExport(): void {
    const options: CanvasExportOptions = {
      layout: this.layoutSelect.value as CanvasLayoutType,
      includeDurations: this.includeDurationsCheckbox.checked,
      includeStats: this.includeStatsCheckbox.checked,
      connectSupersets: this.connectSupersetsCheckbox.checked,
    };

    this.onSubmit(options);
    this.close();
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
