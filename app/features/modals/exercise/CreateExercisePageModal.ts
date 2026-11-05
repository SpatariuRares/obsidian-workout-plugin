// Refactored CreateExercisePageModal using reusable components

import {
  EXERCISE_TYPE_IDS,
  DEFAULT_EXERCISE_TYPE_ID,
} from "@app/constants/exerciseTypes.constants";
import { App, normalizePath, Notice } from "obsidian";
import type {
  WorkoutPluginContext,
  TemplateGeneratorPort,
} from "@app/types/PluginPorts";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { MuscleTagSelector } from "@app/features/modals/components/MuscleTagSelector";
import { Button, Input } from "@app/components/atoms";
import type {
  ParameterDefinition,
  ParameterValueType,
} from "@app/types/ExerciseTypes";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { DomUtils } from "@app/utils/DomUtils";
import { t } from "@app/i18n";
import { fillExercisePageTemplate } from "@app/services/exercise/ExercisePageContent";
import { CONSTANTS } from "@app/constants";
import {
  BUTTONSIZE,
  BUTTONVARIANT,
} from "@app/components/atoms/Button";

interface CustomParameterRow {
  container: HTMLElement;
  keyInput: HTMLInputElement;
  labelInput: HTMLInputElement;
  typeSelect: HTMLSelectElement;
  unitInput: HTMLInputElement;
  requiredCheckbox: HTMLInputElement;
}

export class CreateExercisePageModal extends ModalBase {
  private exerciseName?: string;
  private customParameterRows: CustomParameterRow[] = [];
  private customParametersContainer?: HTMLElement;
  private getSelectedTags?: () => string[];

  constructor(
    app: App,
    private plugin: WorkoutPluginContext & TemplateGeneratorPort,
    exerciseName?: string,
  ) {
    super(app);
    this.exerciseName = exerciseName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-modal");

    // Add modal title
    contentEl.createEl("h2", {
      text: t("modal.titles.createExercisePage"),
    });

    // Create form container
    const formContainer = contentEl.createDiv({
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } =
      ExerciseAutocomplete.create(
        this,
        formContainer,
        this.plugin,
        this.exerciseName,
        { showCreateButton: false },
      );

    // Exercise type dropdown
    const exerciseTypeSelect = this.createSelectField(
      formContainer,
      t("modal.exerciseType"),
      [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.EXERCISE_TYPE],
    );
    // Set default to strength
    exerciseTypeSelect.value = DEFAULT_EXERCISE_TYPE_ID;

    // Custom parameters section (initially hidden)
    this.customParametersContainer = formContainer.createDiv({
      cls: "workout-charts-custom-parameters-section",
    });
    DomUtils.setCssProps(this.customParametersContainer, {
      display: "none",
    });

    // Custom parameters header with add button
    const customParamsHeader =
      this.customParametersContainer.createDiv({
        cls: "workout-charts-custom-params-header",
      });
    customParamsHeader.createEl("label", {
      text: t("modal.customParameters"),
    });

    const addParamBtn = Button.create(customParamsHeader, {
      text: t("modal.buttons.addParameter"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("modal.buttons.addParameter"),
    });

    // Container for parameter rows
    const paramRowsContainer =
      this.customParametersContainer.createDiv({
        cls: "workout-charts-param-rows",
      });

    // Handle exercise type change
    exerciseTypeSelect.addEventListener("change", () => {
      const isCustom =
        exerciseTypeSelect.value === EXERCISE_TYPE_IDS.CUSTOM;
      if (this.customParametersContainer) {
        DomUtils.setCssProps(this.customParametersContainer, {
          display: isCustom ? "block" : "none",
        });
      }
    });

    // Handle add parameter button
    Button.onClick(addParamBtn, () => {
      this.addParameterRow(paramRowsContainer);
    });

    // Muscle tag selector (replaces plain text input)
    const tagSelector = MuscleTagSelector.create(
      formContainer,
      this.plugin,
    );
    this.getSelectedTags = tagSelector.getSelectedTags;

    // Folder path input
    const folderInput = this.createTextField(
      formContainer,
      t("modal.folderPath"),
      t("modal.placeholders.folderPath"),
      this.plugin.settings.exerciseFolderPath,
    );

    Button.createModalActions(formContainer, {
      primary: {
        text: t("modal.buttons.createExercise"),
        onClick: async () => {
          const exerciseName =
            exerciseElements.exerciseInput.value.trim();
          const exerciseType = exerciseTypeSelect.value;
          const selectedTags = this.getSelectedTags
            ? this.getSelectedTags()
            : [];
          const folderPath = folderInput.value.trim();

          if (!exerciseName) {
            new Notice(t("modal.notices.exercisePageNameRequired"));
            return;
          }

          // Collect custom parameters if custom type is selected
          let customParameters: ParameterDefinition[] | undefined;
          if (exerciseType === EXERCISE_TYPE_IDS.CUSTOM) {
            customParameters = this.collectCustomParameters();
          }

          try {
            await this.createExercisePage(
              exerciseName,
              exerciseType,
              selectedTags,
              folderPath,
              customParameters,
            );
            this.close();
            new Notice(t("modal.notices.exercisePageCreated"));
          } catch (error) {
            const errorMessage = ErrorUtils.getErrorMessage(error);
            new Notice(
              t("modal.notices.exercisePageError", {
                error: errorMessage,
              }),
            );
          }
        },
      },
      onCancel: () => this.close(),
    });

    // Focus on exercise input
    exerciseElements.exerciseInput.focus();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    this.customParameterRows = [];
  }

  private addParameterRow(container: HTMLElement): void {
    const rowContainer = container.createDiv({
      cls: "workout-charts-param-row",
    });

    // Key input
    const keyGroup = rowContainer.createDiv({
      cls: "workout-charts-param-field",
    });
    keyGroup.createEl("label", {
      text: t("modal.parameterKey"),
    });
    const keyInput = Input.create(keyGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: t("modal.placeholders.parameterKey"),
    });

    // Label input
    const labelGroup = rowContainer.createDiv({
      cls: "workout-charts-param-field",
    });
    labelGroup.createEl("label", {
      text: t("modal.parameterLabel"),
    });
    const labelInput = Input.create(labelGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: t("modal.placeholders.parameterLabel"),
    });

    // Type select
    const typeGroup = rowContainer.createDiv({
      cls: "workout-charts-param-field",
    });
    typeGroup.createEl("label", {
      text: t("modal.parameterType"),
    });
    const typeSelect = typeGroup.createEl("select");
    [
      ...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PARAMETER_TYPE,
    ].forEach((option) => {
      typeSelect.createEl("option", {
        text: option.text,
        value: option.value,
      });
    });

    // Unit input
    const unitGroup = rowContainer.createDiv({
      cls: "workout-charts-param-field",
    });
    unitGroup.createEl("label", {
      text: t("modal.parameterUnit"),
    });
    const unitInput = Input.create(unitGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: t("modal.placeholders.parameterUnit"),
    });

    // Required checkbox
    const requiredGroup = rowContainer.createDiv({
      cls: "workout-charts-param-field workout-charts-param-checkbox",
    });
    const requiredCheckbox = Input.create(requiredGroup, {
      type: INPUT_TYPE.CHECKBOX,
    });
    requiredCheckbox.checked = true;
    requiredGroup.createEl("label", {
      text: t("modal.parameterRequired"),
    });

    // Remove button
    const removeBtn = Button.create(rowContainer, {
      text: t("modal.buttons.removeParameter"),
      ariaLabel: t("modal.buttons.removeParameter"),
      variant: BUTTONVARIANT.WARNING,
      size: BUTTONSIZE.SMALL,
    });

    const row: CustomParameterRow = {
      container: rowContainer,
      keyInput,
      labelInput,
      typeSelect,
      unitInput,
      requiredCheckbox,
    };

    this.customParameterRows.push(row);

    Button.onClick(removeBtn, () => {
      rowContainer.remove();
      const index = this.customParameterRows.indexOf(row);
      if (index > -1) {
        this.customParameterRows.splice(index, 1);
      }
    });
  }

  private collectCustomParameters(): ParameterDefinition[] {
    const parameters: ParameterDefinition[] = [];

    for (const row of this.customParameterRows) {
      const key = row.keyInput.value.trim();
      const label = row.labelInput.value.trim();
      const type = row.typeSelect.value as ParameterValueType;
      const unit = row.unitInput.value.trim();
      const required = row.requiredCheckbox.checked;

      // Skip empty rows
      if (!key || !label) {
        continue;
      }

      const param: ParameterDefinition = {
        key,
        label,
        type,
        required,
      };

      if (unit) {
        param.unit = unit;
      }

      parameters.push(param);
    }

    return parameters;
  }

  private async createExercisePage(
    exerciseName: string,
    exerciseType: string,
    tags: string[],
    folderPath: string,
    customParameters?: ParameterDefinition[],
  ) {
    const template =
      await this.plugin.templateGeneratorService.getExercisePageTemplate();

    const content = fillExercisePageTemplate(template, {
      name: exerciseName,
      typeId: exerciseType,
      muscleGroups: tags,
      customParameters:
        exerciseType === EXERCISE_TYPE_IDS.CUSTOM
          ? customParameters
          : undefined,
    });

    const safeExerciseName = exerciseName.replace(
      /[\\/:"*?<>|]/g,
      "_",
    );
    const fileName = normalizePath(
      folderPath + "/" + safeExerciseName + ".md",
    );
    await this.app.vault.create(fileName, content);
  }
}
