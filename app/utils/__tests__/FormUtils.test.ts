/** @jest-environment jsdom */
import { setupWorkoutToggle, fillDynamicInputsFromCustomFields } from "@app/utils/FormUtils";

describe("FormUtils", () => {
  describe("setupWorkoutToggle", () => {
    let toggle: HTMLInputElement;
    let workoutInput: HTMLInputElement;
    let getFileName: jest.Mock<string>;

    beforeEach(() => {
      // Create mock DOM elements
      toggle = document.createElement("input");
      toggle.type = "checkbox";

      workoutInput = document.createElement("input");
      workoutInput.type = "text";

      getFileName = jest.fn(() => "test-workout-file.md");
    });

    describe("initial state when toggle is checked", () => {
      it("should disable input when toggle is checked", () => {
        toggle.checked = true;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.disabled).toBe(true);
      });

      it("should set input value to filename when toggle is checked", () => {
        toggle.checked = true;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.value).toBe("test-workout-file.md");
        expect(getFileName).toHaveBeenCalled();
      });

      it("should apply workout-opacity-50 class when toggle is checked", () => {
        toggle.checked = true;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(false);
      });
    });

    describe("initial state when toggle is unchecked", () => {
      it("should enable input when toggle is unchecked", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.disabled).toBe(false);
      });

      it("should clear input value when toggle is unchecked", () => {
        toggle.checked = false;
        workoutInput.value = "some-previous-value";
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.value).toBe("");
      });

      it("should apply workout-opacity-100 class when toggle is unchecked", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(false);
      });
    });

    describe("change event handling", () => {
      it("should disable input and set value when toggled to checked", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        // Simulate toggle to checked
        toggle.checked = true;
        toggle.dispatchEvent(new Event("change"));

        expect(workoutInput.disabled).toBe(true);
        expect(workoutInput.value).toBe("test-workout-file.md");
        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(false);
      });

      it("should enable input and clear value when toggled to unchecked", () => {
        toggle.checked = true;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        // Simulate toggle to unchecked
        toggle.checked = false;
        toggle.dispatchEvent(new Event("change"));

        expect(workoutInput.disabled).toBe(false);
        expect(workoutInput.value).toBe("");
        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(false);
      });

      it("should call getFileName on each toggle to checked", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);
        getFileName.mockClear();

        toggle.checked = true;
        toggle.dispatchEvent(new Event("change"));

        expect(getFileName).toHaveBeenCalledTimes(1);
      });

      it("should use updated filename when toggled multiple times", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        // First toggle on
        getFileName.mockReturnValue("first-file.md");
        toggle.checked = true;
        toggle.dispatchEvent(new Event("change"));
        expect(workoutInput.value).toBe("first-file.md");

        // Toggle off
        toggle.checked = false;
        toggle.dispatchEvent(new Event("change"));
        expect(workoutInput.value).toBe("");

        // Toggle on again with different filename
        getFileName.mockReturnValue("second-file.md");
        toggle.checked = true;
        toggle.dispatchEvent(new Event("change"));
        expect(workoutInput.value).toBe("second-file.md");
      });
    });

    describe("CSS class toggling", () => {
      it("should remove workout-opacity-100 and add workout-opacity-50 when checked", () => {
        toggle.checked = false;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(true);

        toggle.checked = true;
        toggle.dispatchEvent(new Event("change"));

        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(false);
      });

      it("should remove workout-opacity-50 and add workout-opacity-100 when unchecked", () => {
        toggle.checked = true;
        setupWorkoutToggle(toggle, workoutInput, getFileName);

        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(true);

        toggle.checked = false;
        toggle.dispatchEvent(new Event("change"));

        expect(workoutInput.classList.contains("workout-opacity-100")).toBe(true);
        expect(workoutInput.classList.contains("workout-opacity-50")).toBe(false);
      });
    });
  });

  describe("fillDynamicInputsFromCustomFields", () => {
    let inputMap: Map<string, HTMLInputElement>;

    beforeEach(() => {
      inputMap = new Map();
    });

    function createTextInput(name: string): HTMLInputElement {
      const input = document.createElement("input");
      input.type = "text";
      input.name = name;
      inputMap.set(name, input);
      return input;
    }

    function createNumberInput(name: string): HTMLInputElement {
      const input = document.createElement("input");
      input.type = "number";
      input.name = name;
      inputMap.set(name, input);
      return input;
    }

    function createCheckboxInput(name: string): HTMLInputElement {
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      inputMap.set(name, input);
      return input;
    }

    describe("text input filling", () => {
      it("should fill text input with string value", () => {
        const nameInput = createTextInput("name");
        const customFields = { name: "John Doe" };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(nameInput.value).toBe("John Doe");
      });

      it("should fill text input with number value converted to string", () => {
        const countInput = createTextInput("count");
        const customFields = { count: 42 };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(countInput.value).toBe("42");
      });

      it("should fill text input with boolean value converted to string", () => {
        const statusInput = createTextInput("status");
        const customFields = { status: true };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(statusInput.value).toBe("true");
      });
    });

    describe("number input filling", () => {
      it("should fill number input with number value", () => {
        const weightInput = createNumberInput("weight");
        const customFields = { weight: 75.5 };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(weightInput.value).toBe("75.5");
      });

      it("should fill number input with string number value", () => {
        const repsInput = createNumberInput("reps");
        const customFields = { reps: "10" };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(repsInput.value).toBe("10");
      });
    });

    describe("checkbox input filling", () => {
      it("should check checkbox when value is true", () => {
        const completeInput = createCheckboxInput("complete");
        const customFields = { complete: true };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(completeInput.checked).toBe(true);
      });

      it("should uncheck checkbox when value is false", () => {
        const completeInput = createCheckboxInput("complete");
        completeInput.checked = true; // Pre-set to true
        const customFields = { complete: false };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(completeInput.checked).toBe(false);
      });

      it("should check checkbox when truthy string value", () => {
        const activeInput = createCheckboxInput("active");
        const customFields = { active: "yes" };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(activeInput.checked).toBe(true);
      });

      it("should check checkbox when truthy number value", () => {
        const enabledInput = createCheckboxInput("enabled");
        const customFields = { enabled: 1 };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(enabledInput.checked).toBe(true);
      });

      it("should uncheck checkbox when falsy number value", () => {
        const enabledInput = createCheckboxInput("enabled");
        enabledInput.checked = true;
        const customFields = { enabled: 0 };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(enabledInput.checked).toBe(false);
      });

      it("should uncheck checkbox when empty string", () => {
        const enabledInput = createCheckboxInput("enabled");
        enabledInput.checked = true;
        const customFields = { enabled: "" };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(enabledInput.checked).toBe(false);
      });
    });

    describe("null/undefined value handling", () => {
      it("should skip null values", () => {
        const nameInput = createTextInput("name");
        nameInput.value = "original";
        const customFields = { name: null as unknown as string };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(nameInput.value).toBe("original");
      });

      it("should skip undefined values", () => {
        const nameInput = createTextInput("name");
        nameInput.value = "original";
        const customFields = { name: undefined as unknown as string };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(nameInput.value).toBe("original");
      });

      it("should handle undefined customFields parameter gracefully", () => {
        createTextInput("name");

        // Should not throw
        expect(() => {
          fillDynamicInputsFromCustomFields(undefined, inputMap);
        }).not.toThrow();
      });

      it("should handle mixed valid and null/undefined values", () => {
        const nameInput = createTextInput("name");
        const ageInput = createTextInput("age");
        const cityInput = createTextInput("city");
        ageInput.value = "original-age";

        const customFields = {
          name: "John",
          age: null as unknown as string,
          city: "New York",
        };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(nameInput.value).toBe("John");
        expect(ageInput.value).toBe("original-age"); // Unchanged
        expect(cityInput.value).toBe("New York");
      });
    });

    describe("missing input key handling", () => {
      it("should gracefully skip keys not in inputMap", () => {
        const nameInput = createTextInput("name");
        const customFields = {
          name: "John",
          unknownField: "should be skipped",
        };

        // Should not throw
        expect(() => {
          fillDynamicInputsFromCustomFields(customFields, inputMap);
        }).not.toThrow();

        expect(nameInput.value).toBe("John");
      });

      it("should handle empty inputMap", () => {
        const emptyMap = new Map<string, HTMLInputElement>();
        const customFields = { name: "John", age: 30 };

        // Should not throw
        expect(() => {
          fillDynamicInputsFromCustomFields(customFields, emptyMap);
        }).not.toThrow();
      });

      it("should handle empty customFields object", () => {
        createTextInput("name");
        const customFields = {};

        // Should not throw
        expect(() => {
          fillDynamicInputsFromCustomFields(customFields, inputMap);
        }).not.toThrow();
      });
    });

    describe("multiple fields", () => {
      it("should fill multiple fields of different types", () => {
        const nameInput = createTextInput("name");
        const weightInput = createNumberInput("weight");
        const activeInput = createCheckboxInput("active");

        const customFields = {
          name: "Workout A",
          weight: 100,
          active: true,
        };

        fillDynamicInputsFromCustomFields(customFields, inputMap);

        expect(nameInput.value).toBe("Workout A");
        expect(weightInput.value).toBe("100");
        expect(activeInput.checked).toBe(true);
      });
    });
  });
});
