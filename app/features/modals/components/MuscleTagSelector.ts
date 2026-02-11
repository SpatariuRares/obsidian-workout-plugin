/**
 * Muscle Tag Selector Component
 * Provides a searchable, multi-select interface for muscle tags
 * Shows available tags from MuscleTagService with muscle group labels
 */

import { CONSTANTS } from "@app/constants";
import { Input, Chip } from "@app/components/atoms";
import { INPUT_TYPE } from "@app/types/InputTypes";
import type WorkoutChartsPlugin from "main";

export interface MuscleTagSelectorElements {
  container: HTMLElement;
  searchInput: HTMLInputElement;
  tagListContainer: HTMLElement;
  selectedTagsContainer: HTMLElement;
}

/**
 * Creates a muscle tag selector component with search and multi-select
 */
export class MuscleTagSelector {
  private selectedTags: Set<string> = new Set();
  private allTags: Map<string, string> = new Map();
  private onSelectionChange?: (tags: string[]) => void;

  /**
   * Creates the muscle tag selector component
   */
  static create(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    initialTags?: string[],
    onSelectionChange?: (tags: string[]) => void,
  ): {
    elements: MuscleTagSelectorElements;
    getSelectedTags: () => string[];
    setSelectedTags: (tags: string[]) => void;
  } {
    const instance = new MuscleTagSelector();
    instance.onSelectionChange = onSelectionChange;

    // Load all available muscle tags
    instance.allTags = plugin.getMuscleTagService().getTagMap();

    // Create main container
    const selectorContainer = container.createEl("div", {
      cls: "workout-muscle-tag-selector",
    });

    // Label
    selectorContainer.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.TAGS_SELECTOR,
      cls: "workout-form-label",
    });

    // Search input
    const searchInput = Input.create(selectorContainer, {
      type: INPUT_TYPE.TEXT,
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.SEARCH_MUSCLE_TAGS,
    });
    searchInput.addClass("workout-muscle-tag-search");

    // Selected tags display
    const selectedTagsContainer = selectorContainer.createEl("div", {
      cls: "workout-selected-tags-container",
    });

    // Tag list container
    const tagListContainer = selectorContainer.createEl("div", {
      cls: "workout-muscle-tag-list",
    });

    const elements: MuscleTagSelectorElements = {
      container: selectorContainer,
      searchInput,
      tagListContainer,
      selectedTagsContainer,
    };

    // Initialize selected tags if provided
    if (initialTags && initialTags.length > 0) {
      initialTags.forEach((tag) => instance.selectedTags.add(tag));
    }

    // Render initial state
    instance.renderTagList(tagListContainer, "");
    instance.renderSelectedTags(selectedTagsContainer);

    // Search input event listener
    searchInput.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value;
      instance.renderTagList(tagListContainer, query);
    });

    return {
      elements,
      getSelectedTags: () => Array.from(instance.selectedTags),
      setSelectedTags: (tags: string[]) => {
        instance.selectedTags.clear();
        tags.forEach((tag) => instance.selectedTags.add(tag));
        instance.renderSelectedTags(selectedTagsContainer);
        instance.renderTagList(tagListContainer, searchInput.value);
      },
    };
  }

  /**
   * Renders available tags as chips based on search query
   */
  private renderTagList(container: HTMLElement, query: string): void {
    container.empty();

    const normalizedQuery = query.toLowerCase().trim();

    // Filter tags based on query
    const filteredTags = Array.from(this.allTags.entries())
      .filter(([tag, muscleGroup]) => {
        if (!normalizedQuery) return true;
        return (
          tag.toLowerCase().includes(normalizedQuery) ||
          muscleGroup.toLowerCase().includes(normalizedQuery)
        );
      })
      .sort(([a], [b]) => a.localeCompare(b));

    if (filteredTags.length === 0) {
      container.createEl("div", {
        cls: "workout-muscle-tag-list-empty",
        text: CONSTANTS.WORKOUT.MODAL.LABELS.NO_TAGS_FOUND,
      });
      return;
    }

    // Create tag chips using Chip atom
    filteredTags.forEach(([tag]) => {
      const isSelected = this.selectedTags.has(tag);

      Chip.create(container, {
        text: this.formatTagName(tag),
        selected: isSelected,
        onClick: () => {
          if (this.selectedTags.has(tag)) {
            this.selectedTags.delete(tag);
          } else {
            this.selectedTags.add(tag);
          }

          // Re-render both sections
          this.renderSelectedTags(
            container.closest(".workout-muscle-tag-selector")!.querySelector(
              ".workout-selected-tags-container",
            ) as HTMLElement,
          );
          this.renderTagList(
            container,
            (container
              .closest(".workout-muscle-tag-selector")!
              .querySelector(".workout-muscle-tag-search") as HTMLInputElement)!.value,
          );

          // Trigger callback
          if (this.onSelectionChange) {
            this.onSelectionChange(Array.from(this.selectedTags));
          }
        },
      });
    });
  }

  /**
   * Renders the selected tags as removable chips (click to remove)
   */
  private renderSelectedTags(container: HTMLElement): void {
    container.empty();

    if (this.selectedTags.size === 0) {
      container.createEl("div", {
        cls: "workout-selected-tags-empty",
        text: CONSTANTS.WORKOUT.MODAL.LABELS.NO_TAGS_SELECTED,
      });
      return;
    }

    const selectedArray = Array.from(this.selectedTags).sort((a, b) =>
      a.localeCompare(b),
    );

    selectedArray.forEach((tag) => {
      Chip.create(container, {
        text: this.formatTagName(tag),
        selected: true,
        className: "workout-selected-tag-chip",
        onClick: () => {
          // Click entire chip to remove
          this.selectedTags.delete(tag);
          this.renderSelectedTags(container);

          // Re-render tag list to update selection state
          const selectorContainer = container.closest(
            ".workout-muscle-tag-selector",
          );
          if (selectorContainer) {
            const tagListContainer = selectorContainer.querySelector(
              ".workout-muscle-tag-list",
            ) as HTMLElement;
            const searchInput = selectorContainer.querySelector(
              ".workout-muscle-tag-search",
            ) as HTMLInputElement;
            if (tagListContainer && searchInput) {
              this.renderTagList(tagListContainer, searchInput.value);
            }
          }

          // Trigger callback
          if (this.onSelectionChange) {
            this.onSelectionChange(Array.from(this.selectedTags));
          }
        },
      });
    });
  }

  /**
   * Format tag name for display (capitalize words, replace underscores)
   */
  private formatTagName(tag: string): string {
    return tag
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Format muscle group for display (capitalize words, replace underscores)
   */
  private formatMuscleGroup(group: string): string {
    return group
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}
