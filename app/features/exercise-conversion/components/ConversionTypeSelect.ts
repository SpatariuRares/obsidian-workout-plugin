import { BUILT_IN_EXERCISE_TYPES } from "@app/constants/exerciseTypes.constants";
import { Setting } from "obsidian";

export class ConversionTypeSelect {
  private container: HTMLElement;
  private onTypeChange: (typeId: string) => void;
  private onUpdateFrontmatterChange: (update: boolean) => void;

  constructor(
    parent: HTMLElement,
    onTypeChange: (typeId: string) => void,
    onUpdateFrontmatterChange: (update: boolean) => void
  ) {
    this.container = parent.createDiv("workout-conversion-type-select");
    this.onTypeChange = onTypeChange;
    this.onUpdateFrontmatterChange = onUpdateFrontmatterChange;
  }

  public render(initialType?: string): void {
    this.container.empty();

    const options: Record<string, string> = {};
    BUILT_IN_EXERCISE_TYPES.forEach((type) => {
      options[type.id] = type.name;
    });

    new Setting(this.container)
      .setName("Convert to:")
      .addDropdown((dropdown) => {
        dropdown.addOptions(options);
        if (initialType) {
          dropdown.setValue(initialType);
        }
        dropdown.onChange((value) => {
          this.onTypeChange(value);
        });
      });

    new Setting(this.container)
      .setName("Update exercise file type")
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

  public setValue(typeId: string): void {
    // We'd need to keep a ref to the dropdown to set it programmatically if needed
    // For now, re-render is simple enough or we could improve this class
    this.render(typeId);
  }
}
