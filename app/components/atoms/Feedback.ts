export interface FeedbackOptions {
  title?: string;
  icon?: string;
  className?: string; // Allow overriding the default class
  append?: boolean; // Whether to append to container instead of emptying it
}

/**
 * Feedback Atom
 * Handles rendering of feedback states (Error, Success, Empty, Info, Warning)
 */
export class Feedback {
  /**
   * Helper to prepare container
   */
  private static prepareContainer(
    container: HTMLElement,
    options: FeedbackOptions,
  ): void {
    if (!options.append) {
      container.empty();
    }
  }

  /**
   * Render an error message
   */
  static renderError(
    container: HTMLElement,
    message: string,
    options: FeedbackOptions = {},
  ): void {
    this.prepareContainer(container, options);
    const { className = "workout-feedback-error", icon = "⚠️" } = options;

    const errorDiv = container.createEl("div", { cls: className });

    // If icon is provided, render it
    if (icon) {
      errorDiv.createEl("span", {
        cls: "workout-feedback-error-icon",
        text: icon,
      });
    }

    errorDiv.createEl("span", {
      cls: "workout-feedback-error-message",
      text: message,
    });
  }

  /**
   * Render an empty state message
   */
  static renderEmpty(
    container: HTMLElement,
    message: string,
    options: FeedbackOptions = {},
  ): void {
    this.prepareContainer(container, options);
    const { className = "workout-feedback-info" } = options;
    container.createEl("div", {
      cls: className,
      text: message,
    });
  }

  /**
   * Render an info message
   */
  static renderInfo(
    container: HTMLElement,
    message: string,
    options: FeedbackOptions = {},
  ): void {
    this.prepareContainer(container, options);
    const { className = "workout-feedback-info" } = options;
    container.createEl("div", {
      cls: className,
      text: message,
    });
  }

  /**
   * Render a success message
   */
  static renderSuccess(
    container: HTMLElement,
    message: string,
    options: FeedbackOptions = {},
  ): void {
    this.prepareContainer(container, options);
    const { className = "workout-success-message" } = options;
    container.createEl("div", {
      cls: className,
      text: message,
    });
  }

  /**
   * Render a warning/alert message
   */
  static renderWarning(
    container: HTMLElement,
    messages: string | string[],
    options: FeedbackOptions = {},
  ): void {
    this.prepareContainer(container, options);
    const { className = "workout-feedback-warning", title } = options;

    const alertEl = container.createEl("div", { cls: className });

    if (title) {
      alertEl.createEl("h5", {
        text: title,
        cls: "workout-alert-title",
      });
    }

    const msgArray = Array.isArray(messages) ? messages : [messages];

    msgArray.forEach((msg) => {
      alertEl.createEl("p", {
        text: msg,
        cls: "workout-alert-message",
      });
    });
  }
}
