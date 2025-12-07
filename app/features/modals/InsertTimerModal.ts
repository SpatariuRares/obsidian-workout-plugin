// Refactored InsertTimerModal extending BaseInsertModal
import { CONSTANTS } from "@app/constants/Constants";
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TimerConfigurationSection,
  TimerConfigurationElements,
} from "@app/features/modals/components/TimerConfigurationSection";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TIMER_TYPE } from "@app/types";

export class InsertTimerModal extends BaseInsertModal {
  private timerElements?: TimerConfigurationElements;

  constructor(app: App) {
    super(app);
  }

  protected getModalTitle(): string {
    return CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_TIMER;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_TIMER;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.TIMER_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    // Timer Configuration Section using reusable component
    const { elements: timerElements } = TimerConfigurationSection.create(
      this,
      container
    );
    this.timerElements = timerElements;
  }

  protected generateCode(): string {
    if (!this.timerElements) {
      throw new Error(CONSTANTS.WORKOUT.MODAL.NOTICES.TIMER_ELEMENTS_NOT_INITIALIZED);
    }

    const timerValues = TimerConfigurationSection.getValues(this.timerElements);

    return CodeGenerator.generateTimerCode({
      type: timerValues.type as TIMER_TYPE,
      duration: timerValues.duration,
      intervalTime: timerValues.intervalTime,
      rounds: timerValues.rounds,
      title: timerValues.title,
      showControls: timerValues.showControls,
      autoStart: timerValues.autoStart,
      sound: timerValues.sound,
    });
  }
}
