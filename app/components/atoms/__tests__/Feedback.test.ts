/** @jest-environment jsdom */

import { Feedback } from "@app/components/atoms/Feedback";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";

describe("Feedback atom", () => {
  describe("renderError", () => {
    it("renders error message with default icon and class", () => {
      const container = createObsidianContainer();

      Feedback.renderError(container, "Something went wrong");

      const errorDiv = container.querySelector(".workout-feedback-error");
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.querySelector(".workout-feedback-error-icon")?.textContent).toBe("⚠️");
      expect(errorDiv?.querySelector(".workout-feedback-error-message")?.textContent).toBe("Something went wrong");
    });

    it("renders error message with custom class and icon", () => {
      const container = createObsidianContainer();

      Feedback.renderError(container, "Custom error", {
        className: "custom-error-class",
        icon: "❌",
      });

      const errorDiv = container.querySelector(".custom-error-class");
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.querySelector(".workout-feedback-error-icon")?.textContent).toBe("❌");
    });

    it("renders error message without icon when icon is empty", () => {
      const container = createObsidianContainer();

      Feedback.renderError(container, "No icon error", {
        icon: "",
      });

      const errorDiv = container.querySelector(".workout-feedback-error");
      expect(errorDiv).toBeTruthy();
      expect(errorDiv?.querySelector(".workout-feedback-error-icon")).toBeNull();
    });

    it("empties container by default before rendering", () => {
      const container = createObsidianContainer();
      container.createEl("p", { text: "Existing content" });

      Feedback.renderError(container, "Error message");

      expect(container.querySelector("p")).toBeNull();
      expect(container.querySelector(".workout-feedback-error")).toBeTruthy();
    });

    it("appends to container when append option is true", () => {
      const container = createObsidianContainer();
      container.createEl("p", { text: "Existing content" });

      Feedback.renderError(container, "Error message", { append: true });

      expect(container.querySelector("p")?.textContent).toBe("Existing content");
      expect(container.querySelector(".workout-feedback-error")).toBeTruthy();
    });
  });

  describe("renderEmpty", () => {
    it("renders empty state with default class", () => {
      const container = createObsidianContainer();

      Feedback.renderEmpty(container, "No data available");

      const emptyDiv = container.querySelector(".workout-feedback-info");
      expect(emptyDiv).toBeTruthy();
      expect(emptyDiv?.textContent).toBe("No data available");
    });

    it("renders empty state with custom class", () => {
      const container = createObsidianContainer();

      Feedback.renderEmpty(container, "Empty message", {
        className: "custom-empty-class",
      });

      const emptyDiv = container.querySelector(".custom-empty-class");
      expect(emptyDiv).toBeTruthy();
      expect(emptyDiv?.textContent).toBe("Empty message");
    });

    it("empties container by default", () => {
      const container = createObsidianContainer();
      container.createEl("span", { text: "Old content" });

      Feedback.renderEmpty(container, "New content");

      expect(container.querySelector("span")).toBeNull();
    });
  });

  describe("renderInfo", () => {
    it("renders info message with default class", () => {
      const container = createObsidianContainer();

      Feedback.renderInfo(container, "Information message");

      const infoDiv = container.querySelector(".workout-feedback-info");
      expect(infoDiv).toBeTruthy();
      expect(infoDiv?.textContent).toBe("Information message");
    });

    it("renders info message with custom class", () => {
      const container = createObsidianContainer();

      Feedback.renderInfo(container, "Custom info", {
        className: "custom-info-class",
      });

      const infoDiv = container.querySelector(".custom-info-class");
      expect(infoDiv).toBeTruthy();
    });

    it("appends when append option is true", () => {
      const container = createObsidianContainer();
      container.createEl("div", { cls: "existing" });

      Feedback.renderInfo(container, "Info", { append: true });

      expect(container.querySelector(".existing")).toBeTruthy();
      expect(container.querySelector(".workout-feedback-info")).toBeTruthy();
    });
  });

  describe("renderSuccess", () => {
    it("renders success message with default class", () => {
      const container = createObsidianContainer();

      Feedback.renderSuccess(container, "Operation successful!");

      const successDiv = container.querySelector(".workout-success-message");
      expect(successDiv).toBeTruthy();
      expect(successDiv?.textContent).toBe("Operation successful!");
    });

    it("renders success message with custom class", () => {
      const container = createObsidianContainer();

      Feedback.renderSuccess(container, "Success!", {
        className: "custom-success-class",
      });

      const successDiv = container.querySelector(".custom-success-class");
      expect(successDiv).toBeTruthy();
    });
  });

  describe("renderWarning", () => {
    it("renders warning with single message and default class", () => {
      const container = createObsidianContainer();

      Feedback.renderWarning(container, "Warning message");

      const warningDiv = container.querySelector(".workout-feedback-warning");
      expect(warningDiv).toBeTruthy();
      expect(warningDiv?.querySelector(".workout-alert-message")?.textContent).toBe("Warning message");
    });

    it("renders warning with title", () => {
      const container = createObsidianContainer();

      Feedback.renderWarning(container, "Warning details", {
        title: "Warning Title",
      });

      const warningDiv = container.querySelector(".workout-feedback-warning");
      expect(warningDiv?.querySelector(".workout-alert-title")?.textContent).toBe("Warning Title");
    });

    it("renders warning with multiple messages", () => {
      const container = createObsidianContainer();

      Feedback.renderWarning(container, ["First warning", "Second warning", "Third warning"]);

      const warningDiv = container.querySelector(".workout-feedback-warning");
      const messages = warningDiv?.querySelectorAll(".workout-alert-message");
      expect(messages?.length).toBe(3);
      expect(messages?.[0]?.textContent).toBe("First warning");
      expect(messages?.[1]?.textContent).toBe("Second warning");
      expect(messages?.[2]?.textContent).toBe("Third warning");
    });

    it("renders warning with custom class", () => {
      const container = createObsidianContainer();

      Feedback.renderWarning(container, "Custom warning", {
        className: "custom-warning-class",
      });

      expect(container.querySelector(".custom-warning-class")).toBeTruthy();
    });

    it("renders warning without title when not provided", () => {
      const container = createObsidianContainer();

      Feedback.renderWarning(container, "No title warning");

      const warningDiv = container.querySelector(".workout-feedback-warning");
      expect(warningDiv?.querySelector(".workout-alert-title")).toBeNull();
    });
  });
});
