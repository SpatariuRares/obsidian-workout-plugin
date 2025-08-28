// Refactored InsertChartModal using reusable components
import { App } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
import { ModalBase } from "./base/ModalBase";
import { TargetSectionWithAutocomplete } from "./components/TargetSectionWithAutocomplete";
import { AdvancedOptionsSection } from "./components/AdvancedOptionsSection";
import { CodeGenerator } from "./components/CodeGenerator";
import { Notice } from "obsidian";

export class InsertChartModal extends ModalBase {
  constructor(app: App, private plugin: WorkoutChartsPlugin) {
    super(app);
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Insert workout chart" });

    // Create main container with better styling
    const mainContainer = this.createStyledMainContainer(contentEl);

    // Chart Type Section
    const chartTypeSection = this.createSection(
      mainContainer,
      "Chart type"
    );

    // Chart Type selector (exercise vs workout)
    const chartTypeContainer = this.createFormGroup(chartTypeSection);
    const chartTypeSelect = this.createSelect(
      chartTypeContainer,
      "Chart type:",
      [
        { text: "Complete workout", value: "workout" },
        { text: "Specific exercise", value: "exercise" },
      ]
    );

    // Data Type selector (volume, weight, reps)
    const dataTypeContainer = this.createFormGroup(chartTypeSection);
    const dataTypeSelect = this.createSelect(dataTypeContainer, "Data type:", [
      { text: "Volume (kg)", value: "volume" },
      { text: "Weight (kg)", value: "weight" },
      { text: "Reps", value: "reps" },
    ]);

    // Target Section using reusable component with autocomplete
    const currentFileName = this.getCurrentFileName();
    const { elements: targetElements, handlers: targetHandlers } =
      await TargetSectionWithAutocomplete.create(
        this,
        mainContainer,
        chartTypeSelect,
        currentFileName,
        this.plugin
      );

    // Ensure visibility is updated based on initial selection
    targetHandlers.updateVisibility();

    // Configuration Section
    const configSection = this.createSection(mainContainer, "Configuration");

    // Date range selector
    const dateRangeContainer = this.createFormGroup(configSection);
    const dateRangeInput = this.createNumberInput(
      dateRangeContainer,
      "Days range:",
      "180",
      1,
      365,
      "180"
    );

    // Limit selector
    const limitContainer = this.createFormGroup(configSection);
    const limitInput = this.createNumberInput(
      limitContainer,
      "Data limit:",
      "100",
      1,
      1000,
      "100"
    );

    // Display Options Section
    const displaySection = this.createSection(
      mainContainer,
      "Display options"
    );

    // Show trend line toggle
    const trendLineContainer = this.createCheckboxGroup(displaySection);
    const trendLineToggle = this.createCheckbox(
      trendLineContainer,
      "Show trend line",
      true,
      "trendLine"
    );

    // Show trend header toggle
    const trendHeaderContainer = this.createCheckboxGroup(displaySection);
    const trendHeaderToggle = this.createCheckbox(
      trendHeaderContainer,
      "Show trend header",
      true,
      "trendHeader"
    );

    // Show statistics toggle
    const statsContainer = this.createCheckboxGroup(displaySection);
    const statsToggle = this.createCheckbox(
      statsContainer,
      "Show statistics",
      true,
      "stats"
    );

    // Advanced Options Section using reusable component
    const advancedElements = AdvancedOptionsSection.create(
      this,
      mainContainer,
      {
        showTitle: true,
      }
    );

    const exactMatchToggle = advancedElements.exactMatchToggle;
    exactMatchToggle.checked = true;

    // Buttons Section
    const buttonsSection = this.createButtonsSection(mainContainer);

    // Cancel button
    const cancelBtn = buttonsSection.createEl("button", {
      text: "Cancel",
      cls: "mod-warning",
    });

    // Insert button
    const insertBtn = buttonsSection.createEl("button", {
      text: "Insert chart",
      cls: "mod-cta",
    });

    // Event listeners
    cancelBtn.addEventListener("click", () => this.close());

    insertBtn.addEventListener("click", () => {
      const chartType = chartTypeSelect.value;
      const dataType = dataTypeSelect.value;
      const target = TargetSectionWithAutocomplete.getTargetValue(
        targetElements,
        chartTypeSelect,
        currentFileName
      );
      const dateRange = parseInt(dateRangeInput.value) || 30;
      const limit = parseInt(limitInput.value) || 50;
      const showTrendLine = trendLineToggle.checked;
      const showTrend = trendHeaderToggle.checked;
      const showStats = statsToggle.checked;
      const advancedValues = AdvancedOptionsSection.getValues(advancedElements);

      const chartCode = CodeGenerator.generateChartCode({
        chartType,
        dataType,
        exercise: target.exercise || "",
        workout: target.workout || "",
        dateRange,
        limit,
        showTrendLine,
        showTrend,
        showStats,
        exactMatch: advancedValues.exactMatch,
        debug: advancedValues.debug,
        title: advancedValues.title || "",
      });

      this.insertIntoEditor(chartCode, "✅ Chart inserted successfully!");
      this.close();
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
