import type { FieldMapping } from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  Button,
  BUTTONVARIANT,
  DeleteButton,
  Feedback,
} from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { t } from "@app/i18n";
import { TableColumnResolver } from "@app/features/tables/business/TableColumnResolver";

interface FieldOption {
  text: string;
  value: string;
}

/**
 * Which field of the old sets fills which field of the new type: one row per
 * mapping (from → to, the trash at the end), then "Add field mapping".
 */
export class FieldMappingList {
  private mappings: FieldMapping[] = [];
  private sourceOptions: FieldOption[] = [];
  private targetOptions: FieldOption[] = [];

  constructor(
    private readonly modal: ModalBase,
    private readonly container: HTMLElement,
    private readonly onChange: (mappings: FieldMapping[]) => void,
  ) {}

  /**
   * The fields a mapping reads from (the exercise's, its own type or not) and
   * writes to (the target type's), with the mappings to start from
   */
  public setFields(
    source: ParameterDefinition[],
    target: ParameterDefinition[],
    mappings: Array<{ from: string; to: string }>,
  ): void {
    this.sourceOptions = fieldOptions(source);
    this.targetOptions = fieldOptions(target);
    this.mappings = mappings.map(({ from, to }) =>
      this.mapping(from, to),
    );
    this.render();
    this.onChange(this.mappings);
  }

  private render(): void {
    this.container.empty();

    const list = this.container.createDiv({
      cls: "workout-convert-mapping-list",
    });
    if (this.mappings.length === 0) {
      Feedback.renderEmpty(list, t("convert.fieldMapping.empty"), {
        append: true,
      });
    }
    this.mappings.forEach((mapping, index) =>
      this.renderRow(list, mapping, index),
    );

    const add = Button.create(this.container, {
      text: t("convert.fieldMapping.addMapping"),
      icon: ICONS.ACTIONS.ADD,
      variant: BUTTONVARIANT.SECONDARY,
      className: "workout-convert-add-mapping",
      disabled:
        this.sourceOptions.length === 0 ||
        this.targetOptions.length === 0,
    });
    Button.onClick(add, () => {
      this.mappings.push(
        this.mapping(
          this.sourceOptions[0]?.value ?? "",
          this.targetOptions[0]?.value ?? "",
        ),
      );
      this.changed();
    });
  }

  private renderRow(
    parent: HTMLElement,
    mapping: FieldMapping,
    index: number,
  ): void {
    const row = parent.createDiv({
      cls: "workout-convert-mapping-row",
    });
    const from = this.select(
      row,
      this.sourceOptions,
      mapping.fromField,
      t("convert.fieldMapping.from"),
    );
    row.createSpan({
      cls: "workout-convert-mapping-arrow",
      text: "→",
      attr: { "aria-hidden": "true" },
    });
    const to = this.select(
      row,
      this.targetOptions,
      mapping.toField,
      t("convert.fieldMapping.to"),
    );
    DeleteButton.create(row, {
      label: t("convert.fieldMapping.removeMapping"),
      onClick: () => {
        this.mappings.splice(index, 1);
        this.changed();
      },
    });

    const update = () => {
      this.mappings[index] = this.mapping(from.value, to.value);
      this.onChange(this.mappings);
    };
    from.addEventListener("change", update);
    to.addEventListener("change", update);
  }

  private changed(): void {
    this.render();
    this.onChange(this.mappings);
  }

  /** A labelled select of the form kit (ModalBase.createSelect), set to `value` */
  private select(
    row: HTMLElement,
    options: FieldOption[],
    value: string,
    label: string,
  ): HTMLSelectElement {
    const group = this.modal.createFormGroup(row);
    group.addClass("workout-convert-mapping-field");
    const select = this.modal.createSelect(group, label, options);
    select.value = value;
    return select;
  }

  private mapping(from: string, to: string): FieldMapping {
    return {
      fromField: from,
      toField: to,
      fromLabel:
        this.sourceOptions.find((o) => o.value === from)?.text ??
        from,
      toLabel:
        this.targetOptions.find((o) => o.value === to)?.text ?? to,
    };
  }
}

/** The fields as options, each key once, named as the log's columns are */
function fieldOptions(fields: ParameterDefinition[]): FieldOption[] {
  const options: FieldOption[] = [];
  for (const param of fields) {
    if (options.some((o) => o.value === param.key)) continue;
    options.push({
      text: TableColumnResolver.formatParameterHeader(param),
      value: param.key,
    });
  }
  return options;
}
