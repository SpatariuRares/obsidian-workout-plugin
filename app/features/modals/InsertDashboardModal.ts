// Refactored InsertDashboardModal extending BaseInsertModal
import { CONSTANTS } from "@app/constants/Constants";
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";

export class InsertDashboardModal extends BaseInsertModal {
  constructor(app: App) {
    super(app);
  }

  protected getModalTitle(): string {
    return CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_DASHBOARD;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_DASHBOARD;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.DASHBOARD_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Dashboard has no configuration options yet
    // In the future, we could add options like:
    // - Which widgets to show (stats, volume analytics, muscle heat map, etc.)
    // - Time range for data
    // - Custom styling options

    const infoSection = container.createDiv({ cls: "workout-modal-section" });
    infoSection.createEl("p", {
      text: "This will insert a comprehensive workout dashboard with statistics, charts, and quick actions.",
      cls: "setting-item-description",
    });
  }

  protected generateCode(): string {
    return CodeGenerator.generateDashboardCode();
  }
}
