import { Feedback } from "@app/components/atoms/Feedback";
import { CONSTANTS } from "@app/constants";
/**
 * UI component for rendering error messages.
 * Pure UI logic with no business dependencies.
 */
export class TableErrorMessage {
  /**
   * Renders an error message in a container
   * @param container - The container element
   * @param message - Error message to display
   * @param title - Title for the error section
   */
  static render(
    container: HTMLElement,
    message: string,
    title = CONSTANTS.WORKOUT.ERRORS.TYPES.GENERIC,
  ): void {
    Feedback.renderError(container, message, { title });
  }

  /**
   * Renders a simple error message without title
   * @param container - The container element
   * @param message - Error message to display
   */
  static renderSimple(container: HTMLElement, message: string): void {
    Feedback.renderError(container, message);
  }

  /**
   * Clears error messages from a container
   * @param container - The container element
   */
  static clear(container: HTMLElement): void {
    const errorDivs = container.querySelectorAll(".workout-feedback-error");
    errorDivs.forEach((div) => div.remove());
  }
}
