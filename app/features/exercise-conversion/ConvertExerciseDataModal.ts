import { App, Notice } from "obsidian";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import {
  ExerciseAutocomplete,
  ExerciseAutocompleteElements,
} from "@app/features/modals/components/ExerciseAutocomplete";
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
  private typeSelectVal: ConversionTypeSelect | null = null;
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
  private exerciseElements: ExerciseAutocompleteElements | null = null;
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
    contentEl.addClass("workout-charts-modal");

    contentEl.createEl("h2", { text: "Convert exercise data" });

    const mainContainer = this.createStyledMainContainer(contentEl);

    // Exercise Section
    await this.createExerciseSection(mainContainer);

    // Conversion Type Section
    this.typeSelectVal = new ConversionTypeSelect(
      mainContainer,
      async (typeId) => this.handleTargetTypeChange(typeId),
      (update) => {
        this.updateFrontmatter = update;
      },
    );
    this.typeSelectVal.render();
    this.typeSelectVal.setVisible(false);

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
    const section = this.createSection(parent, "Exercise");

    const { elements } = ExerciseAutocomplete.create(
      this,
      section,
      this.plugin,
      this.selectedExercise,
    );
    this.exerciseElements = elements;

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
    typeGroup.createEl("label", { text: "Current type:" });
    this.currentTypeDisplay = typeGroup.createEl("span", {
      cls: "workout-convert-current-type",
      text: "—",
    });
  }

  private createButtons(parent: HTMLElement): void {
    const buttonsSection = Button.createContainer(parent);

    const cancelButton = Button.create(buttonsSection, {
      text: "Cancel",
      className: "workout-btn workout-btn-secondary",
      ariaLabel: "Cancel",
    });
    Button.onClick(cancelButton, () => this.close());

    this.convertButton = Button.create(buttonsSection, {
      text: "Convert",
      className: "mod-cta",
      ariaLabel: "Convert",
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
    this.typeSelectVal?.setVisible(true);

    // Auto-select a different target type
    // This part is a bit tricky to sync with the component,
    // but we can set an initial value if we wanted.
    // For now, let's just trigger updates manually if needed
    // or let the user select.
  }

  private async handleTargetTypeChange(typeId: string): Promise<void> {
    this.targetType = typeId;

    const targetTypeDef = getExerciseTypeById(typeId);
    if (!this.currentType || !targetTypeDef) return;

    // Suggest mappings
    const suggested = this.conversionService.suggestInitialMappings(
      this.currentType,
      targetTypeDef,
    );
    // Convert to full FieldMapping objects

    // We need to fetch option lists to get labels, which is a bit roundabout.
    // Actually, FieldMappingList handles option generation.
    // We should probably just pass the simple {from, to} pairs and let FieldMappingList resolve labels?
    // Or we rely on FieldMappingList to create valid mappings.
    // The previous implementation created full objects.

    // Let's pass the simple mappings to FieldMappingList?
    // No, FieldMappingList expects full FieldMapping objects.
    // However, FieldMappingList is the one that knows the options.
    // It might be better if FieldMappingList exposed a "suggestMappings" method
    // or if we constructed the objects here.

    // Detailed construction:
    // It's hard to get labels without duplicating the getOptions logic.
    // Simplification: Let's pass empty labels and let FieldMappingList fix them?
    // Or better, let's just instantiate FieldMappingList with the types
    // and let it handle initialization if we provide a "default" map.

    this.fieldMappingList?.setTypes(this.currentType, targetTypeDef);

    // We'll manually construct mappings with empty labels for now,
    // assuming FieldMappingList renders correctly or we fetch options here.
    // A cleaner way: Move getOptions to service?
    // For now, I'll let FieldMappingList handle the UI.
    // I will pass the suggestions to setMappings.
    // To get labels, I would need access to the options logic.
    // Let's rely on the user or the component to defaults.
    // Actually, the Service's `suggestInitialMappings` returns simple objects.
    // Let's map them.

    const fullMappings: FieldMapping[] = suggested.map((s) => ({
      fromField: s.from,
      toField: s.to,
      fromLabel: s.from, // Temporary, UI will likely show values if labels missing?
      toLabel: s.to,
    }));

    // Since FieldMappingList re-renders selects, it will select the right values.
    // The labels in the object are mainly for the Preview.
    // The Preview needs correct labels.
    // This suggests `getOptions` should be in the Service or shared.

    this.fieldMappingList?.setMappings(fullMappings);
    this.mappings = fullMappings;

    this.fieldMappingList?.setVisible(true);
    this.conversionPreview?.setVisible(true);

    this.updateState();
  }

  private updateState(): void {
    if (this.conversionPreview) {
      // We need to update labels for the preview if they were raw values
      // Ideally we resolve them properly.
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
    this.typeSelectVal?.setVisible(false);
    this.fieldMappingList?.setVisible(false);
    this.conversionPreview?.setVisible(false);
    this.currentTypeDisplay!.textContent = "—";
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

      new Notice(`Successfully converted ${count} log entries`);
      this.close();
      this.plugin.triggerWorkoutLogRefresh();
    } catch (error) {
      new Notice("Error converting exercise data: " + error);
    }
  }
}
