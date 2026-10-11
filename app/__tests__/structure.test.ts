import { readdirSync, statSync } from "fs";
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
});
