import {
  EXERCISE_TYPE_IDS,
} from "@app/constants/exerciseTypes.constants";
import type { FieldMapping } from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";
import { Button } from "@app/components/atoms";

export class FieldMappingList {
  private container: HTMLElement;
  private mappings: FieldMapping[] = [];
  private sourceType: ExerciseTypeDefinition | null = null;
  private targetType: ExerciseTypeDefinition | null = null;
  private onChange: (mappings: FieldMapping[]) => void;

  constructor(
    parent: HTMLElement,
    onChange: (mappings: FieldMapping[]) => void
  ) {
    this.container = parent.createDiv("workout-convert-mappings-container");
    this.onChange = onChange;
  }

  public setTypes(
    source: ExerciseTypeDefinition,
    target: ExerciseTypeDefinition
  ): void {
    this.sourceType = source;
    this.targetType = target;
    // When types change, we might want to validate or clear mappings, 
    // but the parent controller usually handles the logic of "resetting" mappings.
    // We just re-render if needed.
    this.render();
  }

  public setMappings(mappings: FieldMapping[]): void {
    this.mappings = [...mappings];
    this.render();
  }

  public getMappings(): FieldMapping[] {
    return this.mappings;
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

    if (!this.sourceType || !this.targetType) {
      return;
    }

    this.container.createEl("h3", { text: "Field mapping" });

    const listContainer = this.container.createDiv("workout-convert-mapping-list");

    this.mappings.forEach((mapping, index) => {
      this.renderMappingRow(listContainer, mapping, index);
    });

    const addButton = Button.create(this.container, {
      text: "Add field mapping",
      variant: "secondary",
      ariaLabel: "Add field mapping",
    });
    Button.onClick(addButton, () => {
      this.addEmptyMapping();
    });
  }

  private renderMappingRow(
    parent: HTMLElement,
    mapping: FieldMapping,
    index: number
  ): void {
    const row = parent.createDiv("workout-convert-mapping-row");

    // Source Select
    const sourceSelect = row.createEl("select");
    const sourceOptions = this.getSourceFieldOptions(this.sourceType!);
    sourceOptions.forEach((opt) => {
      const option = sourceSelect.createEl("option", {
        text: opt.text,
        value: opt.value,
      });
      if (opt.value === mapping.fromField) {
        option.selected = true;
      }
    });

    row.createSpan({ text: "→" });

    // Target Select
    const targetSelect = row.createEl("select");
    const targetOptions = this.getFieldOptions(this.targetType!);
    targetOptions.forEach((opt) => {
      const option = targetSelect.createEl("option", {
        text: opt.text,
        value: opt.value,
      });
      if (opt.value === mapping.toField) {
        option.selected = true;
      }
    });

    // Remove Button
    const removeBtn = Button.create(row, {
      text: "×",
      variant: "warning",
      ariaLabel: "Remove mapping",
    });
    Button.onClick(removeBtn, () => {
      this.removeMapping(index);
    });

    // Listeners
    const updateHandler = () => {
      if (index < 0 || index >= this.mappings.length) return;
      const newMapping: FieldMapping = {
        fromField: sourceSelect.value,
        toField: targetSelect.value,
        fromLabel: sourceSelect.options[sourceSelect.selectedIndex]?.text || "",
        toLabel: targetSelect.options[targetSelect.selectedIndex]?.text || "",
      };
      this.mappings[index] = newMapping;
      this.onChange(this.mappings);
    };

    sourceSelect.addEventListener("change", updateHandler);
    targetSelect.addEventListener("change", updateHandler);
  }

  private addEmptyMapping(): void {
    if (!this.sourceType || !this.targetType) return;

    const sourceOptions = this.getSourceFieldOptions(this.sourceType);
    const targetOptions = this.getFieldOptions(this.targetType);

    const newMapping: FieldMapping = {
      fromField: sourceOptions[0]?.value || "",
      toField: targetOptions[0]?.value || "",
      fromLabel: sourceOptions[0]?.text || "",
      toLabel: targetOptions[0]?.text || "",
    };

    this.mappings.push(newMapping);
    this.render();
    this.onChange(this.mappings);
  }

  private removeMapping(index: number): void {
    this.mappings.splice(index, 1);
    this.render();
    this.onChange(this.mappings);
  }

  private getSourceFieldOptions(
    type: ExerciseTypeDefinition
  ): Array<{ text: string; value: string }> {
    const options: Array<{ text: string; value: string }> = [];

    // Standard fields usage based on type
    if (type.id === EXERCISE_TYPE_IDS.STRENGTH) {
      options.push({ text: "Reps", value: "reps" });
      options.push({ text: "Weight (kg)", value: "weight" });
    }

    for (const param of type.parameters) {
      // Avoid duplicates
      if (options.some((o) => o.value === param.key)) continue;
      const label = param.unit ? `${param.label} (${param.unit})` : param.label;
      options.push({ text: label, value: param.key });
    }
    return options;
  }

  private getFieldOptions(
    type: ExerciseTypeDefinition
  ): Array<{ text: string; value: string }> {
    return this.getSourceFieldOptions(type);
  }
}
