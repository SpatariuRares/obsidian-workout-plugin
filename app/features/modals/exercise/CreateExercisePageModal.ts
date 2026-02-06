// Refactored CreateExercisePageModal using reusable components
import { CONSTANTS } from "@app/constants";
import {
  BUILT_IN_EXERCISE_TYPES,
  EXERCISE_TYPE_IDS,
  DEFAULT_EXERCISE_TYPE_ID,
} from "@app/constants/exerciseTypes.constants";
import { App, normalizePath, Notice, TFile } from "obsidian";
import type WorkoutChartsPlugin from "main";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Button, Input } from "@app/components/atoms";
import type {
  ParameterDefinition,
  ParameterValueType,
} from "@app/types/ExerciseTypes";
import { INPUT_TYPE } from "@app/types/InputTypes";
import { DomUtils } from "@app/utils/DomUtils";

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

  constructor(
    app: App,
    private plugin: WorkoutChartsPlugin,
    exerciseName?: string,
  ) {
    super(app);
    this.exerciseName = exerciseName;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass("workout-charts-modal");

    // Add modal title
    contentEl.createEl("h2", {
      text: CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_EXERCISE_PAGE,
    });

    // Create form container
    const formContainer = contentEl.createEl("div", {
      cls: "workout-charts-form",
    });

    // Exercise autocomplete using reusable component
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      formContainer,
      this.plugin,
      this.exerciseName,
    );

    // Exercise type dropdown
    const exerciseTypeSelect = this.createSelectField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.EXERCISE_TYPE,
      [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.EXERCISE_TYPE],
    );
    // Set default to strength
    exerciseTypeSelect.value = DEFAULT_EXERCISE_TYPE_ID;

    // Custom parameters section (initially hidden)
    this.customParametersContainer = formContainer.createEl("div", {
      cls: "workout-charts-custom-parameters-section",
    });
    DomUtils.setCssProps(this.customParametersContainer, { display: "none" });

    // Custom parameters header with add button
    const customParamsHeader = this.customParametersContainer.createEl("div", {
      cls: "workout-charts-custom-params-header",
    });
    customParamsHeader.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.CUSTOM_PARAMETERS,
    });

    const addParamBtn = Button.create(customParamsHeader, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADD_PARAMETER,
      className: "workout-btn workout-btn-secondary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.ADD_PARAMETER,
    });

    // Container for parameter rows
    const paramRowsContainer = this.customParametersContainer.createEl("div", {
      cls: "workout-charts-param-rows",
    });

    // Handle exercise type change
    exerciseTypeSelect.addEventListener("change", () => {
      const isCustom = exerciseTypeSelect.value === EXERCISE_TYPE_IDS.CUSTOM;
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

    // Tags input
    const tagsInput = this.createTextField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.TAGS,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.TAGS,
    );

    // Folder path input
    const folderInput = this.createTextField(
      formContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.FOLDER_PATH,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.FOLDER_PATH,
      this.plugin.settings.exerciseFolderPath,
    );

    // Buttons container
    const buttonsContainer = Button.createContainer(formContainer);

    // Create button using Button atom
    const createBtn = Button.create(buttonsContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE_EXERCISE,
      className: "workout-btn workout-btn-primary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CREATE_EXERCISE,
    });

    // Cancel button using Button atom
    const cancelBtn = Button.create(buttonsContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      className: "workout-btn workout-btn-warning",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });

    // Event listeners using Button helper
    Button.onClick(cancelBtn, () => this.close());

    Button.onClick(createBtn, () => {
      void (async () => {
        const exerciseName = exerciseElements.exerciseInput.value.trim();
        const exerciseType = exerciseTypeSelect.value;
        const tags = tagsInput.value.trim();
        const folderPath = folderInput.value.trim();

        if (!exerciseName) {
          new Notice(
            CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_NAME_REQUIRED,
          );
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
            tags,
            folderPath,
            customParameters,
          );
          this.close();
          new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_CREATED);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          new Notice(
            `${CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_PAGE_ERROR}${errorMessage}`,
          );
        }
      })();
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
    const rowContainer = container.createEl("div", {
      cls: "workout-charts-param-row",
    });

    // Key input
    const keyGroup = rowContainer.createEl("div", {
      cls: "workout-charts-param-field",
    });
    keyGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.PARAMETER_KEY,
    });
    const keyInput = Input.create(keyGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.PARAMETER_KEY,
    });

    // Label input
    const labelGroup = rowContainer.createEl("div", {
      cls: "workout-charts-param-field",
    });
    labelGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.PARAMETER_LABEL,
    });
    const labelInput = Input.create(labelGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.PARAMETER_LABEL,
    });

    // Type select
    const typeGroup = rowContainer.createEl("div", {
      cls: "workout-charts-param-field",
    });
    typeGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.PARAMETER_TYPE,
    });
    const typeSelect = typeGroup.createEl("select");
    [...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PARAMETER_TYPE].forEach(
      (option) => {
        typeSelect.createEl("option", {
          text: option.text,
          value: option.value,
        });
      },
    );

    // Unit input
    const unitGroup = rowContainer.createEl("div", {
      cls: "workout-charts-param-field",
    });
    unitGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.PARAMETER_UNIT,
    });
    const unitInput = Input.create(unitGroup, {
      type: INPUT_TYPE.TEXT,
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.PARAMETER_UNIT,
    });

    // Required checkbox
    const requiredGroup = rowContainer.createEl("div", {
      cls: "workout-charts-param-field workout-charts-param-checkbox",
    });
    const requiredCheckbox = Input.create(requiredGroup, {
      type: INPUT_TYPE.CHECKBOX,
    });
    requiredCheckbox.checked = true;
    requiredGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.PARAMETER_REQUIRED,
    });

    // Remove button
    const removeBtn = Button.create(rowContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.REMOVE_PARAMETER,
      className: "workout-btn workout-btn-warning workout-btn-small",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.REMOVE_PARAMETER,
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
    tags: string,
    folderPath: string,
    customParameters?: ParameterDefinition[],
  ) {
    // Parse tags
    const tagList = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    // Build frontmatter
    let frontmatterContent = `nome_esercizio: ${exerciseName}
exercise_type: ${exerciseType}`;

    // Add tags if present
    if (tagList.length > 0) {
      frontmatterContent += `
tags:
${tagList.map((tag) => `  - ${tag}`).join("\n")}`;
    } else {
      frontmatterContent += `
tags: []`;
    }

    // Add custom parameters for custom type
    if (
      exerciseType === EXERCISE_TYPE_IDS.CUSTOM &&
      customParameters &&
      customParameters.length > 0
    ) {
      frontmatterContent += `
parameters:`;
      for (const param of customParameters) {
        frontmatterContent += `
  - key: ${param.key}
    label: ${param.label}
    type: ${param.type}
    required: ${param.required}`;
        if (param.unit) {
          frontmatterContent += `
    unit: ${param.unit}`;
        }
      }
    }

    const frontmatter = `---
${frontmatterContent}
---`;

    // Get exercise type display name for description
    const exerciseTypeDef = BUILT_IN_EXERCISE_TYPES.find(
      (t) => t.id === exerciseType,
    );
    const exerciseTypeName = exerciseTypeDef?.name || exerciseType;

    // Create content
    const content = `${frontmatter}

# Descrizione

Tipo: ${exerciseTypeName}

# Tecnica di Esecuzione



# Note di Sicurezza

-

# Log delle Performance

\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.TABLE}
exercise: ${exerciseName}
\`\`\`

### grafico

\`\`\`${CONSTANTS.WORKOUT.MODAL.CODE_BLOCKS.CHART}
exercise: ${exerciseName}
\`\`\`
`;

    // Create file path
    const safeExerciseName = exerciseName.replace(/[\\/:"*?<>|]/g, "_");
    const fileName = normalizePath(folderPath + "/" + safeExerciseName + ".md");
    // Create the file
    await this.app.vault.create(fileName, content);

    // Open the newly created file
    const abstractFile = this.app.vault.getAbstractFileByPath(fileName);
    if (abstractFile && abstractFile instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(abstractFile);
    }
  }
}
