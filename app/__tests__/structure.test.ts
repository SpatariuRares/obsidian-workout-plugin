import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

/** Every file under `dir`, as paths relative to the repo root */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

describe("project structure", () => {
  it("should have no barrel files in feature folders: import the file itself", () => {
    const barrels = files(join(__dirname, "..", "features"))
      .filter((path) => /[\\/]index\.ts$/.test(path))
      .map((path) => path.slice(path.indexOf("features")));

    expect(barrels).toEqual([]);
  });

  it("should build every modal's action row with Button.createModalActions (one order, one Cancel)", () => {
    const root = join(__dirname, "..");
    const handBuilt = files(root)
      .filter((path) => path.endsWith(".ts") && !/__tests__/.test(path))
      .filter((path) => !path.endsWith(join("components", "atoms", "Button.ts")))
      .filter((path) => {
        const source = readFileSync(path, "utf8");
        return (
          source.includes('t("modal.buttons.cancel")') ||
          source.includes('"workout-modal-actions"')
        );
      })
      .map((path) => path.slice(root.length + 1));

    expect(handBuilt).toEqual([]);
  });
});
