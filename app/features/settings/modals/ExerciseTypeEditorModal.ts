import { Setting, App } from "obsidian";
import { t } from "@app/i18n";
import { Button, DeleteButton } from "@app/components/atoms";
import { BUTTONSIZE, BUTTONVARIANT } from "@app/components/atoms/Button";
import { ChipGroup } from "@app/components/molecules";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { CONSTANTS } from "@app/constants";
import type { CustomExerciseType } from "@app/types/WorkoutLogData";
import type { ParameterDefinition, ParameterValueType } from "@app/types/ExerciseTypes";
import {
  builtInFields,
  exerciseTypeIdFromName,
  fieldKeyFromLabel,
} from "@app/services/exercise/ExerciseTypeCatalog";

/**
 * Form to make or edit an exercise type: its name and the fields its
 * exercises log, built-in ones (reps, weight…) or new ones. A field's key
 * (its log column) comes from its name when it is made and never changes.
 */
export class ExerciseTypeEditorModal extends ModalBase {
  /** Keys of the fields the type had when the form opened */
  private readonly savedKeys: Set<string>;
  private fieldsEl?: HTMLElement;

  constructor(
    app: App,
    private formState: CustomExerciseType,
    /** The type being edited, null when making one */
    private original: CustomExerciseType | null,
    /** Returns false to keep the form open (validation failed) */
    private save: () => Promise<boolean>,
  ) {
    super(app);
    // The draft is a shallow copy: its fields must not be the saved ones
    formState.parameters = formState.parameters.map((field) => ({ ...field }));
    this.savedKeys = new Set((original?.parameters ?? []).map((field) => field.key));
  }

  onOpen(): void {
    const { contentEl, formState } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal", "workout-exercise-type-editor");
    this.titleEl.setText(
      this.original ? t("settings.exerciseTypes.edit") : t("settings.exerciseTypes.add"),
    );

    new Setting(contentEl).setName(t("settings.exerciseTypes.name")).addText((text) =>
      text
        .setValue(formState.name)
        .setPlaceholder(t("settings.exerciseTypes.namePlaceholder"))
        .onChange((value) => {
          formState.name = value;
          // The id is written in exercise pages: fixed once the type exists
          if (!this.original) formState.id = exerciseTypeIdFromName(value);
        }),
    );

    new Setting(contentEl)
      .setName(t("settings.exerciseTypes.fields"))
      .setDesc(t("settings.exerciseTypes.fieldsHelp"))
      .setHeading();
    this.fieldsEl = contentEl.createDiv({ cls: "workout-exercise-type-fields" });
    this.renderFields();

    Button.createModalActions(contentEl, {
      primary: {
        text: t("settings.exerciseTypes.save"),
        onClick: async () => {
          if (await this.save()) this.close();
        },
      },
      onCancel: () => this.close(),
    });
  }

  onClose(): void {
    this.contentEl.empty();
  }

  /** The fields, the warning for removed ones, and the buttons that add one */
  private renderFields(): void {
    const el = this.fieldsEl;
    if (!el) return;
    el.empty();
    const { parameters } = this.formState;
    parameters.forEach((field, index) => this.renderField(el, field, index));

    const removed = (this.original?.parameters ?? []).filter(
      (field) => !parameters.some((p) => p.key === field.key),
    );
    if (removed.length > 0) {
      el.createDiv({
        cls: "workout-exercise-type-removed workout-text-warning",
        text: t("settings.exerciseTypes.removedWarning", {
          fields: removed.map((field) => field.label).join(", "),
        }),
      });
    }

    const add = el.createDiv({ cls: "workout-exercise-type-add" });
    add.createDiv({ cls: "workout-chip-group-label", text: t("settings.exerciseTypes.addField") });
    const buttons = add.createDiv({ cls: "workout-exercise-type-add-buttons" });
    for (const field of builtInFields()) {
      if (parameters.some((p) => p.key === field.key)) continue;
      this.addButton(buttons, field.label, () => ({ ...field }));
    }
    this.addButton(buttons, t("settings.exerciseTypes.newField"), () => ({
      key: fieldKeyFromLabel("", this.keys()),
      label: "",
      type: "number",
      required: false,
    }));
  }

  private addButton(parent: HTMLElement, text: string, make: () => ParameterDefinition): void {
    const button = Button.create(parent, {
      text,
      icon: "plus",
      variant: BUTTONVARIANT.SECONDARY,
      size: BUTTONSIZE.SMALL,
    });
    Button.onClick(button, () => {
      this.formState.parameters.push(make());
      this.renderFields();
      // The new field's name, ready to type
      const inputs = this.fieldsEl?.querySelectorAll<HTMLInputElement>(
        ".workout-exercise-type-field-name",
      );
      inputs?.[inputs.length - 1]?.focus();
    });
  }

  private renderField(parent: HTMLElement, field: ParameterDefinition, index: number): void {
    const row = parent.createDiv({ cls: "workout-exercise-type-field" });
    const builtIn = builtInFields().some((f) => f.key === field.key);
    // A field made now takes its key from its name; a saved one keeps it
    const keyFollowsName = !builtIn && !this.savedKeys.has(field.key);

    const top = row.createDiv({ cls: "workout-exercise-type-field-top" });
    const name = top.createEl("input", {
      cls: "workout-exercise-type-field-name",
      attr: {
        type: "text",
        "aria-label": t("settings.exerciseTypes.fieldName"),
        placeholder: t("settings.exerciseTypes.fieldNamePlaceholder"),
      },
    });
    name.value = field.label;
    name.addEventListener("input", () => {
      field.label = name.value;
      if (keyFollowsName) {
        field.key = fieldKeyFromLabel(
          name.value,
          this.keys().filter((_, i) => i !== index),
        );
      }
    });
    DeleteButton.create(top, {
      label: t("settings.exerciseTypes.removeField", { field: field.label || t("settings.exerciseTypes.newField") }),
      onClick: () => {
        this.formState.parameters.splice(index, 1);
        this.renderFields();
      },
    });

    const options = row.createDiv({ cls: "workout-exercise-type-field-options" });
    // A built-in field's type is what charts, volume and PRs read
    if (!builtIn) {
      ChipGroup.create<ParameterValueType>(options, {
        label: t("settings.exerciseTypes.fieldType"),
        options: CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PARAMETER_TYPE.map((option) => ({
          id: option.value,
          label: option.text,
        })),
        selected: field.type,
        onPick: (type) => {
          field.type = type;
          if (type !== "number") delete field.unit;
          this.renderFields();
        },
      });
    }
    if (field.type === "number") {
      const unitLabel = options.createEl("label", { cls: "workout-exercise-type-field-unit-label" });
      unitLabel.appendText(t("settings.exerciseTypes.unit"));
      const unit = unitLabel.createEl("input", {
        cls: "workout-exercise-type-field-unit",
        attr: {
          type: "text",
          placeholder: t("settings.exerciseTypes.unitPlaceholder"),
        },
      });
      unit.value = field.unit ?? "";
      unit.addEventListener("input", () => {
        const value = unit.value.trim();
        if (value) field.unit = value;
        else delete field.unit;
      });
    }
    const required = options.createEl("label", { cls: "workout-exercise-type-field-required" });
    const box = required.createEl("input", { attr: { type: "checkbox" } });
    box.checked = field.required;
    box.addEventListener("change", () => {
      field.required = box.checked;
    });
    required.appendText(t("settings.exerciseTypes.required"));
  }

  private keys(): string[] {
    return this.formState.parameters.map((field) => field.key);
  }
}
