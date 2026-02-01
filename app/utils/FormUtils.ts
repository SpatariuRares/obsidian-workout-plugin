/**
 * Utility functions for form handling across modals
 * Consolidates common form patterns like toggle handlers and field population
 */

/**
 * Sets up a workout toggle that controls a workout input field
 * When checked: disables input, sets value from getFileName, applies opacity-50 style
 * When unchecked: enables input, clears value, applies opacity-100 style
 *
 * @param toggle - The checkbox input element
 * @param workoutInput - The text input element to control
 * @param getFileName - Function that returns the current file name
 */
export function setupWorkoutToggle(
  toggle: HTMLInputElement,
  workoutInput: HTMLInputElement,
  getFileName: () => string
): void {
  const applyToggleState = (checked: boolean): void => {
    if (checked) {
      workoutInput.disabled = true;
      workoutInput.value = getFileName();
      workoutInput.classList.add("workout-opacity-50");
      workoutInput.classList.remove("workout-opacity-100");
    } else {
      workoutInput.disabled = false;
      workoutInput.value = "";
      workoutInput.classList.add("workout-opacity-100");
      workoutInput.classList.remove("workout-opacity-50");
    }
  };

  // Set initial state based on toggle.checked
  applyToggleState(toggle.checked);

  // Add change event listener
  toggle.addEventListener("change", () => {
    applyToggleState(toggle.checked);
  });
}

/**
 * Fills dynamic form inputs from custom fields data
 * Handles text inputs, number inputs, and checkboxes appropriately
 *
 * @param customFields - Record of field names to values (may be undefined)
 * @param inputMap - Map of field names to their corresponding input elements
 */
export function fillDynamicInputsFromCustomFields(
  customFields: Record<string, string | number | boolean> | undefined,
  inputMap: Map<string, HTMLInputElement>
): void {
  if (!customFields) {
    return;
  }

  for (const [key, value] of Object.entries(customFields)) {
    if (value === null || value === undefined) {
      continue;
    }

    const input = inputMap.get(key);
    if (!input) {
      continue;
    }

    if (input.type === "checkbox") {
      input.checked = Boolean(value);
    } else {
      input.value = String(value);
    }
  }
}
