import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { t } from "@app/i18n";
import {
  getExerciseTypeById,
  EXERCISE_TYPE_IDS,
} from "@app/constants/exerciseTypes.constants";
import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";
import type WorkoutChartsPlugin from "main";
import {
  ExerciseConversionService,
  FieldMapping,
} from "@app/features/exercise-conversion/logic/ExerciseConversionService";
import { ConversionTypeSelect } from "@app/features/exercise-conversion/components/ConversionTypeSelect";
import { FieldMappingList } from "@app/features/exercise-conversion/components/FieldMappingList";
import { ConversionPreview } from "@app/features/exercise-conversion/components/ConversionPreview";
import { Button } from "@app/components/atoms";

export class ConvertExerciseDataModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;
  private conversionService: ExerciseConversionService;

  // Components
  private typeSelect: ConversionTypeSelect | null = null;
  private fieldMappingList: FieldMappingList | null = null;
  private conversionPreview: ConversionPreview | null = null;

  // State
  private selectedExercise: string = "";
  private currentType: ExerciseTypeDefinition | null = null;
  private targetType: string = "";
  private updateFrontmatter: boolean = true;
  private entryCount: number = 0;
  private mappings: FieldMapping[] = [];

  // UI Elements
  private currentTypeDisplay: HTMLElement | null = null;
  private convertButton: HTMLButtonElement | null = null;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
    this.conversionService = new ExerciseConversionService(plugin);
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("workout-modal");

    contentEl.createEl("h2", { text: t("convert.title") });

    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise Section
    await this.createExerciseSection(mainContainer);

    // Conversion Type Section
    this.typeSelect = new ConversionTypeSelect(
      mainContainer,
      async (typeId) => this.handleTargetTypeChange(typeId),
      (update) => {
        this.updateFrontmatter = update;
      },
    );
    this.typeSelect.render();
    this.typeSelect.setVisible(false);

    // Field Mapping Section
    this.fieldMappingList = new FieldMappingList(mainContainer, (mappings) => {
      this.mappings = mappings;
      this.updateState();
    });
    this.fieldMappingList.setVisible(false);

    // Preview Section
    this.conversionPreview = new ConversionPreview(mainContainer);
    this.conversionPreview.setVisible(false);

    // Buttons
    this.createButtons(mainContainer);
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }

  private async createExerciseSection(parent: HTMLElement): Promise<void> {
    const section = this.createSection(parent, t("convert.sectionExercise"));

    const { elements } = ExerciseAutocomplete.create(
      this,
      section,
      this.plugin,
      this.selectedExercise,
    );

    elements.exerciseInput.addEventListener("change", async () => {
      this.selectedExercise = elements.exerciseInput.value.trim();
      await this.handleExerciseChange();
    });

    elements.exerciseInput.addEventListener("blur", async () => {
      const newValue = elements.exerciseInput.value.trim();
      if (newValue && newValue !== this.selectedExercise) {
        this.selectedExercise = newValue;
        await this.handleExerciseChange();
      }
    });

    const typeGroup = this.createFormGroup(section);
    typeGroup.createEl("label", { text: t("convert.currentType") });
    this.currentTypeDisplay = typeGroup.createEl("span", {
      cls: "workout-convert-current-type",
      text: "—",
    });
  }

  private createButtons(parent: HTMLElement): void {
    const buttonsSection = Button.createContainer(parent);

    const cancelButton = Button.create(buttonsSection, {
      text: t("common.cancel"),
      variant: "secondary",
      ariaLabel: t("common.cancel"),
    });
    Button.onClick(cancelButton, () => this.close());

    this.convertButton = Button.create(buttonsSection, {
      text: t("common.convert"),
      ariaLabel: t("common.convert"),
      variant: "primary",
    });
    Button.setDisabled(this.convertButton, true);
    Button.onClick(this.convertButton, () => this.handleConvert());
  }

  private async handleExerciseChange(): Promise<void> {
    if (!this.selectedExercise) {
      this.resetUI();
      return;
    }

    const exerciseDefService = this.plugin.getExerciseDefinitionService();
    const definition = await exerciseDefService.getExerciseDefinition(
      this.selectedExercise,
    );
    const typeId = definition?.typeId || EXERCISE_TYPE_IDS.STRENGTH;
    this.currentType =
      getExerciseTypeById(typeId) ||
      getExerciseTypeById(EXERCISE_TYPE_IDS.STRENGTH)!;

    if (this.currentTypeDisplay) {
      this.currentTypeDisplay.textContent = this.currentType.name;
    }

    // Get entry count
    const logData = await this.plugin.getWorkoutLogData({
      exercise: this.selectedExercise,
      exactMatch: true,
    });
    this.entryCount = logData.length;

    // Show Type Select
    this.typeSelect?.setVisible(true);
  }

  private async handleTargetTypeChange(typeId: string): Promise<void> {
    this.targetType = typeId;

    const targetTypeDef = getExerciseTypeById(typeId);
    if (!this.currentType || !targetTypeDef) return;

    const suggested = this.conversionService.suggestInitialMappings(
      this.currentType,
      targetTypeDef,
    );

    this.fieldMappingList?.setTypes(this.currentType, targetTypeDef);

    const fullMappings: FieldMapping[] = suggested.map((s) => ({
      fromField: s.from,
      toField: s.to,
      fromLabel: s.from,
      toLabel: s.to,
    }));

    this.fieldMappingList?.setMappings(fullMappings);
    this.mappings = fullMappings;

    this.fieldMappingList?.setVisible(true);
    this.conversionPreview?.setVisible(true);

    this.updateState();
  }

  private updateState(): void {
    if (this.conversionPreview) {
      this.conversionPreview.update(this.entryCount, this.mappings);
    }

    if (this.convertButton) {
      const isValid =
        this.selectedExercise &&
        this.targetType &&
        this.currentType?.id !== this.targetType &&
        this.mappings.length > 0 &&
        this.entryCount > 0;

      this.convertButton.disabled = !isValid;
    }
  }

  private resetUI(): void {
    this.typeSelect?.setVisible(false);
    this.fieldMappingList?.setVisible(false);
    this.conversionPreview?.setVisible(false);
    if (this.currentTypeDisplay) {
      this.currentTypeDisplay.textContent = "—";
    }
    this.entryCount = 0;
    this.updateState();
  }

  private async handleConvert(): Promise<void> {
    try {
      const count = await this.conversionService.convertExerciseData(
        this.selectedExercise,
        this.targetType,
        this.mappings,
      );

      if (this.updateFrontmatter) {
        await this.conversionService.updateExerciseFrontmatter(
          this.selectedExercise,
          this.targetType,
        );
      }

      new Notice(t("convert.success", { count }));
      this.close();
      this.plugin.triggerWorkoutLogRefresh({
        exercise: this.selectedExercise,
      });
    } catch (error) {
      new Notice(t("convert.errors.convertError", { error: String(error) }));
    }
  }
}
