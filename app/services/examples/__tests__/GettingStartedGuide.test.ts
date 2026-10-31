import { App, TFile } from "obsidian";
import { t } from "@app/i18n";
import {
  createExampleNotes,
  openGettingStartedGuide,
} from "@app/services/examples/GettingStartedGuide";
import type { ExamplePluginPort } from "@app/services/examples/ExampleGeneratorService";

const mockCreateExamples = jest.fn();
jest.mock("@app/services/examples/ExampleGeneratorService", () => ({
  ExampleGeneratorService: jest
    .fn()
    .mockImplementation(() => ({ createExamples: mockCreateExamples })),
}));
jest.mock("@app/services/examples/ExamplePaths", () => ({
  examplePaths: { gettingStartedGuide: () => "base/Getting Started.md" },
}));

/** Every ConfirmModal opened: the message it shows, and a way to answer it */
const modals: {
  message: string;
  accept: () => void;
  decline: () => void;
}[] = [];
jest.mock("@app/features/modals/common/ConfirmModal", () => ({
  ConfirmModal: jest
    .fn()
    .mockImplementation(
      (
        _app: unknown,
        message: string,
        onConfirm: () => void,
        onCancel: () => void,
      ) => ({
        open: () =>
          modals.push({ message, accept: onConfirm, decline: onCancel }),
      }),
    ),
}));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("getting started guide", () => {
  let app: App;
  let plugin: ExamplePluginPort;
  let openFile: jest.Mock;
  let guide: TFile;

  beforeEach(() => {
    modals.length = 0;
    mockCreateExamples.mockReset();
    app = new App();
    openFile = jest.fn();
    (app.workspace as unknown as Record<string, unknown>).getLeaf = jest
      .fn()
      .mockReturnValue({ openFile });
    plugin = { app } as unknown as ExamplePluginPort;
    guide = new TFile();
  });

  const guideExists = (exists: boolean) =>
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (path: string) =>
        exists && path === "base/Getting Started.md" ? guide : null,
    );

  describe("createExampleNotes", () => {
    it("creates the examples without asking anything", async () => {
      mockCreateExamples.mockResolvedValue("separate-file");

      await expect(createExampleNotes(plugin)).resolves.toBe("separate-file");

      expect(mockCreateExamples).toHaveBeenCalledWith();
      expect(modals).toHaveLength(0);
    });
  });

  describe("openGettingStartedGuide", () => {
    it("opens the note when it exists", async () => {
      guideExists(true);

      await expect(openGettingStartedGuide(plugin)).resolves.toBe(true);

      expect(openFile).toHaveBeenCalledWith(guide);
      expect(modals).toHaveLength(0);
      expect(mockCreateExamples).not.toHaveBeenCalled();
    });

    it("offers to create the examples when the note is missing, then opens it", async () => {
      guideExists(false);
      mockCreateExamples.mockImplementation(async () => {
        guideExists(true);
        return "pointed-at-examples";
      });

      const result = openGettingStartedGuide(plugin);
      await flush();
      expect(modals[0].message).toBe(t("examples.createToOpenGuide"));
      modals[0].accept();

      await expect(result).resolves.toBe(true);
      expect(mockCreateExamples).toHaveBeenCalledTimes(1);
      expect(openFile).toHaveBeenCalledWith(guide);
    });

    it("does nothing when the offer is declined", async () => {
      guideExists(false);

      const result = openGettingStartedGuide(plugin);
      await flush();
      modals[0].decline();

      await expect(result).resolves.toBe(false);
      expect(mockCreateExamples).not.toHaveBeenCalled();
      expect(openFile).not.toHaveBeenCalled();
    });

    it("opens nothing when creating the examples fails", async () => {
      guideExists(false);
      mockCreateExamples.mockResolvedValue("failed");

      const result = openGettingStartedGuide(plugin);
      await flush();
      modals[0].accept();

      await expect(result).resolves.toBe(false);
      expect(openFile).not.toHaveBeenCalled();
    });
  });
});
