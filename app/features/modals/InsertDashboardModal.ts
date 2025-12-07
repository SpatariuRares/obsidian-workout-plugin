// Refactored InsertDashboardModal extending BaseInsertModal
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_NOTICES,
} from "@app/constants/ModalConstants";

export class InsertDashboardModal extends BaseInsertModal {
  constructor(app: App) {
    super(app);
  }

  protected getModalTitle(): string {
    return MODAL_TITLES.INSERT_DASHBOARD;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.INSERT_DASHBOARD;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.DASHBOARD_INSERTED;
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
