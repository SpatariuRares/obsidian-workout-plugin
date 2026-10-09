import { App, TFolder } from "obsidian";
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
