// Refactored InsertTimerModal extending BaseInsertModal
import { App } from "obsidian";
import { BaseInsertModal } from "@app/modals/base/BaseInsertModal";
import {
  TimerConfigurationSection,
  TimerConfigurationElements,
} from "@app/modals/components/TimerConfigurationSection";
import { CodeGenerator } from "@app/modals/components/CodeGenerator";
import {
  MODAL_TITLES,
  MODAL_BUTTONS,
  MODAL_NOTICES,
} from "@app/constants/ModalConstants";
import { TimerType } from "@app/types";

export class InsertTimerModal extends BaseInsertModal {
  private timerElements?: TimerConfigurationElements;

  constructor(app: App) {
    super(app);
  }

  protected getModalTitle(): string {
    return MODAL_TITLES.INSERT_TIMER;
  }

  protected getButtonText(): string {
    return MODAL_BUTTONS.INSERT_TIMER;
  }

  protected getSuccessMessage(): string {
    return MODAL_NOTICES.TIMER_INSERTED;
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
      throw new Error(MODAL_NOTICES.TIMER_ELEMENTS_NOT_INITIALIZED);
    }

    const timerValues = TimerConfigurationSection.getValues(this.timerElements);

    return CodeGenerator.generateTimerCode({
      type: timerValues.type as TimerType,
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
