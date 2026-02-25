import type { FieldMapping } from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import { ListItem } from "@app/components/molecules";
import { t } from "@app/i18n";

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

    this.container.createEl("h3", { text: t("convert.preview.title") });

    if (this.entryCount > 0) {
      this.container.createEl("p", {
        text:
          this.entryCount === 1
            ? t("convert.preview.willConvertOne")
            : t("convert.preview.willConvertMany", { count: this.entryCount }),
        cls: "workout-convert-preview-count",
      });
    } else {
      this.container.createEl("p", {
        text: t("convert.preview.noEntries"),
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
