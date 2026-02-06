/** @jest-environment jsdom */

import { ActionButtons } from "@app/features/tables/ui/ActionButtons";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { ActionButtonGroup } from "@app/components/molecules";

jest.mock("@app/components/molecules", () => ({
  ActionButtonGroup: {
    create: jest.fn(),
  },
}));

describe("ActionButtons", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates action buttons using ActionButtonGroup molecule", () => {
    const container = createObsidianContainer();
    const mockEditBtn = document.createElement("button");
    const mockDeleteBtn = document.createElement("button");
    const mockContainer = document.createElement("div");

    (ActionButtonGroup.create as jest.Mock).mockReturnValue({
      container: mockContainer,
      editBtn: mockEditBtn,
      deleteBtn: mockDeleteBtn,
    });

    const result = ActionButtons.createActionButtonsContainer(container);

    expect(ActionButtonGroup.create).toHaveBeenCalledWith(
      container,
      expect.objectContaining({
        className: "workout-table-actions",
      }),
    );
    expect(result.container).toBe(mockContainer);
    expect(result.editBtn).toBe(mockEditBtn);
    expect(result.deleteBtn).toBe(mockDeleteBtn);
  });
});
