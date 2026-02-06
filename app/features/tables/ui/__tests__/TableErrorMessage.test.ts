/** @jest-environment jsdom */

import { TableErrorMessage } from "@app/features/tables/ui/TableErrorMessage";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { Feedback } from "@app/components/atoms/Feedback";

jest.mock("@app/components/atoms/Feedback", () => ({
  Feedback: {
    renderError: jest.fn(),
  },
}));

describe("TableErrorMessage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("render", () => {
    it("calls Feedback.renderError with title", () => {
      const container = createObsidianContainer();

      TableErrorMessage.render(container, "Something went wrong", "Error");

      expect(Feedback.renderError).toHaveBeenCalledWith(
        container,
        "Something went wrong",
        { title: "Error" },
      );
    });

    it("uses default title when not provided", () => {
      const container = createObsidianContainer();

      TableErrorMessage.render(container, "Something went wrong");

      expect(Feedback.renderError).toHaveBeenCalledWith(
        container,
        "Something went wrong",
        expect.objectContaining({ title: expect.any(String) }),
      );
    });
  });

  describe("renderSimple", () => {
    it("calls Feedback.renderError without title", () => {
      const container = createObsidianContainer();

      TableErrorMessage.renderSimple(container, "Error message");

      expect(Feedback.renderError).toHaveBeenCalledWith(
        container,
        "Error message",
      );
    });
  });

  describe("clear", () => {
    it("removes error divs from container", () => {
      const container = document.createElement("div");
      const errorDiv1 = document.createElement("div");
      errorDiv1.className = "workout-feedback-error";
      const errorDiv2 = document.createElement("div");
      errorDiv2.className = "workout-feedback-error";
      const normalDiv = document.createElement("div");
      normalDiv.className = "other-class";

      container.appendChild(errorDiv1);
      container.appendChild(errorDiv2);
      container.appendChild(normalDiv);

      TableErrorMessage.clear(container);

      expect(container.querySelectorAll(".workout-feedback-error").length).toBe(
        0,
      );
      expect(container.querySelectorAll(".other-class").length).toBe(1);
    });

    it("does nothing when no error divs exist", () => {
      const container = document.createElement("div");
      container.appendChild(document.createElement("p"));

      expect(() => TableErrorMessage.clear(container)).not.toThrow();
    });
  });
});
