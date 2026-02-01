import type { FieldMapping } from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import { ListItem } from "@app/components/molecules";

export class ConversionPreview {
  private container: HTMLElement;
  private entryCount: number = 0;
  private mappings: FieldMapping[] = [];

  constructor(parent: HTMLElement) {
    this.container = parent.createDiv("workout-convert-preview");
  }

  public update(count: number, mappings: FieldMapping[]): void {
    this.entryCount = count;
    this.mappings = mappings;
    this.render();
  }

  public setVisible(visible: boolean): void {
    if (visible) {
      this.container.show();
    } else {
      this.container.hide();
    }
  }

  private render(): void {
    this.container.empty();

    this.container.createEl("h3", { text: "Preview" });

    if (this.entryCount > 0) {
      this.container.createEl("p", {
        text: `${this.entryCount} log ${
          this.entryCount === 1 ? "entry" : "entries"
        } will be converted`,
        cls: "workout-convert-preview-count",
      });
    } else {
      this.container.createEl("p", {
        text: "No log entries found for this exercise",
        cls: "workout-convert-preview-warning",
      });
    }

    if (this.mappings.length > 0) {
      const mappingList = ListItem.createList(this.container, {
        className: "workout-convert-preview-mappings",
      });

      for (const mapping of this.mappings) {
        ListItem.createText(mappingList, {
          text: `${mapping.fromLabel} → ${mapping.toLabel}`,
        });
      }
    }
  }
}
