import { BUILT_IN_EXERCISE_TYPES } from "@app/constants/exerciseTypes.constants";
import { Setting } from "obsidian";
import { t } from "@app/i18n";

export class ConversionTypeSelect {
  private container: HTMLElement;
  private onTypeChange: (typeId: string) => void;
  private onUpdateFrontmatterChange: (update: boolean) => void;

  constructor(
    parent: HTMLElement,
    onTypeChange: (typeId: string) => void,
    onUpdateFrontmatterChange: (update: boolean) => void,
  ) {
    this.container = parent.createDiv("workout-conversion-type-select");
    this.onTypeChange = onTypeChange;
    this.onUpdateFrontmatterChange = onUpdateFrontmatterChange;
  }

  public render(): void {
    this.container.empty();

    const options: Record<string, string> = {};
    BUILT_IN_EXERCISE_TYPES.forEach((type) => {
      options[type.id] = type.name;
    });

    new Setting(this.container)
      .setName(t("convert.typeSelect.convertTo"))
      .addDropdown((dropdown) => {
        dropdown.addOptions(options);
        dropdown.onChange((value) => {
          this.onTypeChange(value);
        });
      });

    new Setting(this.container)
      .setName(t("convert.typeSelect.updateFileType"))
      .addToggle((toggle) => {
        toggle.setValue(true);
        toggle.onChange((value) => {
          this.onUpdateFrontmatterChange(value);
        });
      });
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.container.show();
    } else {
      this.container.hide();
    }
  }
}
