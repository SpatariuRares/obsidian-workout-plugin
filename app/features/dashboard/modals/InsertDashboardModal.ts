// Refactored InsertDashboardModal extending BaseInsertModal

import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { t } from "@app/i18n";

export class InsertDashboardModal extends BaseInsertModal {
  constructor(app: App) {
    super(app);
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertDashboard");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertDashboard");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.dashboardInserted");
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
