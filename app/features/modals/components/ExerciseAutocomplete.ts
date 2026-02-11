// Reusable exercise autocomplete component
import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import type WorkoutChartsPlugin from "main";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { ExercisePathResolver } from "@app/utils/exercise/ExercisePathResolver";
import { StringUtils } from "@app/utils/StringUtils";

import { Button } from "@app/components/atoms";

export interface ExerciseAutocompleteElements {
  exerciseInput: HTMLInputElement;
  autocompleteContainer: HTMLElement;
  exerciseStatusText: HTMLElement;
  createExercisePageBtn: HTMLButtonElement;
}

export interface ExerciseAutocompleteHandlers {
  showAutocomplete: (_query: string) => void;
  hideAutocomplete: () => void;
}

interface ExerciseMatch {
  name: string;
  score: number;
  matchType: "semantic" | "fuzzy";
}

export class ExerciseAutocomplete {
  private availableExercises: string[] = [];
  private exerciseExists: boolean = false;
  private selectedIndex: number = -1;

  /**
   * Renders the exercise name into a parent element with highlighted matches.
   * Uses safe DOM methods instead of innerHTML to prevent XSS.
   * @param parent - The parent element to render into
   * @param text - The exercise name
   * @param query - The search query
   */
  private static renderHighlightedMatch(
    parent: HTMLElement,
    text: string,
    query: string,
  ): void {
    if (!query || query.length === 0) {
      parent.textContent = text;
      return;
    }

    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create regex to match query (case-insensitive, global)
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    // Split text by matches and render each segment safely
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parent.appendText(text.slice(lastIndex, match.index));
      }
      // Add highlighted match
      parent.createEl("mark", {
        text: match[1],
        cls: "workout-autocomplete-highlight",
      });
      lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < text.length) {
      parent.appendText(text.slice(lastIndex));
    }
  }

  /**
   * Creates a badge element to show match type
   * @param matchType - Type of match (semantic or fuzzy)
   * @param score - Match score
   * @returns Badge element
   */
  private static createMatchBadge(
    parent: HTMLElement,
    matchType: "semantic" | "fuzzy",
    score: number,
  ): HTMLElement {
    const badge = parent.createEl("span", {
      cls: `workout-autocomplete-badge workout-autocomplete-badge-${matchType}`,
    });

    const autocomplete = CONSTANTS.WORKOUT.MODAL.AUTOCOMPLETE;
    if (matchType === "fuzzy") {
      badge.textContent = autocomplete.FUZZY_BADGE;
      badge.title = autocomplete.FUZZY_TOOLTIP(score);
    } else {
      // Show score indicator for semantic matches
      if (score >= 90) {
        badge.textContent = autocomplete.EXACT_BADGE;
        badge.title = autocomplete.EXACT_TOOLTIP(score);
      } else if (score >= 70) {
        badge.textContent = autocomplete.WORD_BADGE;
        badge.title = autocomplete.WORD_TOOLTIP(score);
      } else {
        badge.textContent = autocomplete.PARTIAL_BADGE;
        badge.title = autocomplete.PARTIAL_TOOLTIP(score);
      }
    }

    return badge;
  }

  /**
   * Creates the exercise autocomplete component
   */
  static create(
    modal: ModalBase,
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    options?: { showCreateButton?: boolean },
  ): {
    elements: ExerciseAutocompleteElements;
    handlers: ExerciseAutocompleteHandlers;
    exerciseExists: boolean;
  } {
    const instance = new ExerciseAutocomplete();
    instance.loadAvailableExercises(plugin);
    const showCreateButton = options?.showCreateButton ?? true;

    // Exercise input with autocomplete
    const exerciseContainer = modal.createFormGroup(container);
    const exerciseInput = modal.createTextInput(
      exerciseContainer,
      CONSTANTS.WORKOUT.MODAL.LABELS.EXERCISE,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.EXERCISE_AUTOCOMPLETE,
      exerciseName || "",
    );

    // Autocomplete container
    const autocompleteContainer = exerciseContainer.createEl("div", {
      cls: "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden",
    });

    // Exercise status indicator and create page button
    const exerciseStatusContainer = exerciseContainer.createEl("div", {
      cls: "workout-exercise-autocomplete-hidden",
    });

    const exerciseStatusText = exerciseStatusContainer.createEl("span", {
      cls: "workout-exercise-status-text",
    });

    // Create exercise page button using Button atom
    const createExercisePageBtn = Button.create(exerciseStatusContainer, {
      text: CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.CREATE_PAGE,
      className: "workout-create-exercise-page-btn workout-display-none",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.CREATE_PAGE,
      variant: "secondary",
    });

    const elements: ExerciseAutocompleteElements = {
      exerciseInput,
      autocompleteContainer,
      exerciseStatusText,
      createExercisePageBtn,
    };

    // Create handlers
    const showAutocomplete = (query: string) => {
      if (!query.trim() || query.length < 1) {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
        createExercisePageBtn.className =
          "workout-create-exercise-page-btn workout-display-none";
        return;
      }

      // Smart ranking: Use semantic matching with scoring
      const semanticMatches: ExerciseMatch[] = instance.availableExercises
        .map((exercise) => ({
          name: exercise,
          score: StringUtils.getMatchScore(exercise, query),
          matchType: "semantic" as const,
        }))
        .filter((match) => match.score > 0); // Only include matches

      // Fuzzy matching: Handle typos using Levenshtein distance
      // Max distance of 3 allows for reasonable typos (e.g., "squatt" -> "squat")
      const fuzzyMatches: ExerciseMatch[] = StringUtils.findSimilarStrings(
        query,
        instance.availableExercises,
        3,
      )
        .filter((name) => {
          // Exclude if already found in semantic matches
          return !semanticMatches.some((sm) => sm.name === name);
        })
        .map((name) => ({
          name,
          score: 40, // Lower score than semantic matches
          matchType: "fuzzy" as const,
        }));

      // Combine and sort by score (highest first)
      const allMatches = [...semanticMatches, ...fuzzyMatches].sort(
        (a, b) => b.score - a.score,
      );

      const matchingExercises = allMatches.map((match) => match.name);

      if (matchingExercises.length > 0) {
        autocompleteContainer.empty();
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-visible";

        // Reset selected index when results change
        instance.selectedIndex = -1;

        allMatches.slice(0, 8).forEach((match, index) => {
          const suggestion = autocompleteContainer.createEl("div", {
            cls: "workout-exercise-autocomplete-suggestion",
          });

          // Add data attribute for keyboard navigation
          suggestion.setAttribute("data-index", index.toString());

          // Create badge for match type
          ExerciseAutocomplete.createMatchBadge(
            suggestion,
            match.matchType,
            match.score,
          );

          // Add highlighted text
          const textSpan = suggestion.createEl("span", {
            cls: "workout-autocomplete-text",
          });
          ExerciseAutocomplete.renderHighlightedMatch(
            textSpan,
            match.name,
            query,
          );

          // Click handler
          suggestion.addEventListener("click", () => {
            exerciseInput.value = match.name;
            exerciseInput.dispatchEvent(new Event("change"));
            autocompleteContainer.className =
              "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
            createExercisePageBtn.className =
              "workout-create-exercise-page-btn workout-display-none";
            instance.exerciseExists = true;
          });

          // Mouse hover handlers
          suggestion.addEventListener("mouseenter", () => {
            // Remove selected class from all suggestions
            autocompleteContainer
              .querySelectorAll(".workout-exercise-autocomplete-suggestion")
              .forEach((s) =>
                s.classList.remove(
                  "workout-exercise-autocomplete-suggestion-selected",
                ),
              );

            // Add hover class
            suggestion.classList.add(
              "workout-exercise-autocomplete-suggestion-hover",
            );

            // Update selected index
            instance.selectedIndex = index;
          });

          suggestion.addEventListener("mouseleave", () => {
            suggestion.classList.remove(
              "workout-exercise-autocomplete-suggestion-hover",
            );
          });
        });
        exerciseStatusContainer.className =
          "workout-exercise-autocomplete-hidden";
        createExercisePageBtn.className =
          "workout-create-exercise-page-btn workout-display-none";
        instance.exerciseExists = true;
      } else {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
        exerciseStatusContainer.className =
          "workout-exercise-status-container workout-exercise-autocomplete-no-found";
        exerciseStatusText.textContent =
          CONSTANTS.WORKOUT.MODAL.EXERCISE_STATUS.NOT_FOUND;
        exerciseStatusText.className =
          "workout-exercise-status-text workout-exercise-status-warning";

        // Only show the create button if allowed
        if (showCreateButton) {
          createExercisePageBtn.className =
            "workout-create-exercise-page-btn workout-display-inline-block";
        } else {
          createExercisePageBtn.className =
            "workout-create-exercise-page-btn workout-display-none";
        }

        instance.exerciseExists = false;
      }
    };

    const hideAutocomplete = () => {
      setTimeout(() => {
        autocompleteContainer.className =
          "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
        instance.selectedIndex = -1;
      }, 200);
    };

    /**
     * Updates the visual selection state of autocomplete suggestions
     * @param index - Index of the suggestion to select (-1 for none)
     */
    const updateSelection = (index: number) => {
      const suggestions = autocompleteContainer.querySelectorAll(
        ".workout-exercise-autocomplete-suggestion",
      );

      suggestions.forEach((suggestion, i) => {
        if (i === index) {
          suggestion.classList.add(
            "workout-exercise-autocomplete-suggestion-selected",
          );
          // Scroll into view if needed
          suggestion.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else {
          suggestion.classList.remove(
            "workout-exercise-autocomplete-suggestion-selected",
          );
        }
      });

      instance.selectedIndex = index;
    };

    /**
     * Selects the currently highlighted suggestion
     */
    const selectCurrentSuggestion = () => {
      if (instance.selectedIndex >= 0) {
        const suggestions = autocompleteContainer.querySelectorAll(
          ".workout-exercise-autocomplete-suggestion",
        );

        if (suggestions[instance.selectedIndex]) {
          (suggestions[instance.selectedIndex] as HTMLElement).click();
        }
      }
    };

    const handlers: ExerciseAutocompleteHandlers = {
      showAutocomplete,
      hideAutocomplete,
    };

    // Setup event listeners
    exerciseInput.addEventListener("input", (e) => {
      const exerciseName = (e.target as HTMLInputElement).value;
      showAutocomplete(exerciseName);
    });

    // Keyboard navigation for autocomplete
    exerciseInput.addEventListener("keydown", (e) => {
      const suggestions = autocompleteContainer.querySelectorAll(
        ".workout-exercise-autocomplete-suggestion",
      );

      // Only handle keyboard if autocomplete is visible
      const isVisible = autocompleteContainer.classList.contains(
        "workout-exercise-autocomplete-visible",
      );

      if (!isVisible || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          // Move selection down
          if (instance.selectedIndex < suggestions.length - 1) {
            updateSelection(instance.selectedIndex + 1);
          } else {
            // Wrap to top
            updateSelection(0);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          // Move selection up
          if (instance.selectedIndex > 0) {
            updateSelection(instance.selectedIndex - 1);
          } else {
            // Wrap to bottom
            updateSelection(suggestions.length - 1);
          }
          break;

        case "Enter":
          // Select current suggestion if one is highlighted
          if (instance.selectedIndex >= 0) {
            e.preventDefault();
            selectCurrentSuggestion();
          }
          // If no selection, let the form submit naturally
          break;

        case "Escape":
          e.preventDefault();
          // Hide autocomplete
          autocompleteContainer.className =
            "workout-exercise-autocomplete-container workout-exercise-autocomplete-hidden";
          instance.selectedIndex = -1;
          break;

        case "Tab":
          // Tab selects current suggestion if highlighted
          if (instance.selectedIndex >= 0) {
            e.preventDefault();
            selectCurrentSuggestion();
          }
          break;
      }
    });

    exerciseInput.addEventListener("blur", hideAutocomplete);

    // Create exercise page button event listener using Button helper
    Button.onClick(createExercisePageBtn, () => {
      const exerciseName = exerciseInput.value.trim();
      if (exerciseName) {
        new CreateExercisePageModal(modal.app, plugin, exerciseName).open();
      }
    });

    return {
      elements,
      handlers,
      exerciseExists: instance.exerciseExists,
    };
  }

  /**
   * Loads available exercises from the exercise folder
   */
  private loadAvailableExercises(plugin: WorkoutChartsPlugin) {
    try {
      // Use ExercisePathResolver to get exercise names
      this.availableExercises = ExercisePathResolver.getExerciseNames(plugin);
    } catch {
      this.availableExercises = [];
    }
  }
}
