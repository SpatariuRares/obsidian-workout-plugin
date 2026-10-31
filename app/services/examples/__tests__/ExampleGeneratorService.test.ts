import { App, TFile, TFolder } from "obsidian";
import { ExampleGeneratorService } from "@app/services/examples/ExampleGeneratorService";
import { t } from "@app/i18n";

describe("ExampleGeneratorService.exampleFolderExists", () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  it("looks up the localized base folder name", () => {
    const service = new ExampleGeneratorService(app);

    service.exampleFolderExists();

    expect(app.vault.getAbstractFileByPath).toHaveBeenCalledWith(
      t("examples.folderNames.base"),
    );
  });

  it("returns true when the folder exists", () => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(
      new TFolder(),
    );

    expect(new ExampleGeneratorService(app).exampleFolderExists()).toBe(
      true,
    );
  });

  it("returns false when the folder is missing", () => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockReturnValue(null);

    expect(new ExampleGeneratorService(app).exampleFolderExists()).toBe(
      false,
    );
  });
});

describe("ExampleGeneratorService.generateExampleFolder", () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  /** Folders exist; every note path resolves to `note`. */
  const vaultWith = (note: TFile | TFolder | null): void => {
    (app.vault.getAbstractFileByPath as jest.Mock).mockImplementation(
      (path: string) => (path.endsWith(".md") ? note : new TFolder()),
    );
  };

  it("overwrites existing notes when asked", async () => {
    const existing = new TFile();
    vaultWith(existing);

    await new ExampleGeneratorService(app).generateExampleFolder(true);

    expect(app.vault.modify).toHaveBeenCalledWith(existing, expect.any(String));
    expect(app.vault.create).not.toHaveBeenCalledWith(
      expect.stringMatching(/\.md$/),
      expect.any(String),
    );
  });

  it("keeps existing notes when not overwriting", async () => {
    vaultWith(new TFile());

    await new ExampleGeneratorService(app).generateExampleFolder(false);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });

  it("never writes over a folder that sits where a note should go", async () => {
    vaultWith(new TFolder());

    await new ExampleGeneratorService(app).generateExampleFolder(true);

    expect(app.vault.modify).not.toHaveBeenCalled();
  });
});
