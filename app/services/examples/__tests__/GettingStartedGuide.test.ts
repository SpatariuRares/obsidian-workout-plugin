import { App, TFile } from "obsidian";
import {
  createExampleNotes,
  openGettingStartedGuide,
} from "@app/services/examples/GettingStartedGuide";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";

const mockCreateExamples = jest.fn();
jest.mock("@app/services/examples/ExampleGeneratorService", () => ({
  ExampleGeneratorService: jest
    .fn()
    .mockImplementation(() => ({
      createExamples: mockCreateExamples,
    })),
}));
jest.mock("@app/services/examples/ExamplePaths", () => ({
  examplePaths: {
    gettingStartedGuide: () => "base/Getting Started.md",
  },
}));

describe("getting started guide", () => {
  let plugin: ExamplePluginPort;
  let openFile: jest.Mock;
  let guide: TFile;
  let exists: boolean;

  beforeEach(() => {
    mockCreateExamples.mockReset();
    const app = new App();
    openFile = jest.fn();
    app.workspace.getLeaf = jest.fn().mockReturnValue({ openFile });
    plugin = { app } as unknown as ExamplePluginPort;
    guide = new TFile();
    exists = false;
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (path: string) =>
        exists && path === "base/Getting Started.md" ? guide : null,
    );
    mockCreateExamples.mockImplementation(async () => {
      exists = true;
      return "pointed-at-examples";
    });
  });

  it("creates the examples directly", async () => {
    await expect(createExampleNotes(plugin)).resolves.toBe(
      "pointed-at-examples",
    );
    expect(mockCreateExamples).toHaveBeenCalledTimes(1);
  });

  it("creates the examples and opens the guide without a confirmation step", async () => {
    await expect(openGettingStartedGuide(plugin)).resolves.toBe(true);
    expect(mockCreateExamples).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith(guide, {
      active: true,
      state: { mode: "preview" },
    });
  });

  it("ensures missing supporting files are created even when the guide exists", async () => {
    exists = true;
    await expect(openGettingStartedGuide(plugin)).resolves.toBe(true);
    expect(mockCreateExamples).toHaveBeenCalledTimes(1);
    expect(openFile).toHaveBeenCalledWith(guide, {
      active: true,
      state: { mode: "preview" },
    });
  });

  it("opens nothing when creating the examples fails", async () => {
    mockCreateExamples.mockResolvedValue("failed");
    await expect(openGettingStartedGuide(plugin)).resolves.toBe(
      false,
    );
    expect(openFile).not.toHaveBeenCalled();
  });
});
