import {
  ExampleGeneratorService,
  type ExamplePluginPort,
} from "@app/services/examples/ExampleGeneratorService";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { parseLog } from "@app/services/data/WorkoutLogCodec";
import { tableBlock } from "@app/features/tables/tableBlock";
import { chartBlock } from "@app/features/charts/chartBlock";
import { gettingStartedPages } from "@app/services/examples/GettingStartedPages";
import { durationBlock } from "@app/features/duration/durationBlock";

it("creates linked feature pages with matching recent data and no long index", async () => {
  jest
    .useFakeTimers()
    .setSystemTime(new Date("2026-10-31T12:00:00Z"));
  try {
    const vault = new FakeVault();
    const plugin = {
      app: vault.app,
      settings: { ...DEFAULT_SETTINGS },
      saveSettings: jest.fn(),
      triggerMuscleTagRefresh: jest.fn(),
      eventBus: { emit: jest.fn() },
    } as unknown as ExamplePluginPort;
    await new ExampleGeneratorService(plugin).createExamples();
    const index = vault.content(examplePaths.gettingStartedGuide());
    expect(readWorkoutNote(index).blocks).toHaveLength(0);
    const pages = gettingStartedPages();
    const blocks = pages.flatMap((page, i) => {
      const content = vault.content(page.path);
      expect(index).toContain(page.path.replace(/\.md$/, ""));
      if (i + 1 < pages.length)
        expect(content).toContain(
          pages[i + 1].path.replace(/\.md$/, ""),
        );
      if (i > 0)
        expect(content).toContain(
          pages[i - 1].path.replace(/\.md$/, ""),
        );
      const parsed = readWorkoutNote(content).blocks;
      expect(parsed).toHaveLength(1);
      return parsed;
    });
    expect(new Set(blocks.map((block) => block.type))).toEqual(
      new Set([
        "workout-log",
        "workout-chart",
        "workout-dashboard",
        "workout-timer",
        "workout-duration",
      ]),
    );
    const entries = parseLog(
      vault.content(plugin.settings.csvLogFilePath),
    ).entries;
    for (const block of blocks) {
      if (
        block.type === "workout-log" ||
        block.type === "workout-chart"
      ) {
        const schema =
          block.type === "workout-log" ? tableBlock : chartBlock;
        const { params, errors } = schema.parse(block.body);
        expect(errors).toEqual([]);
        const matching = entries.filter(
          (entry) => entry.exercise === params.exercise,
        );
        expect(matching.length).toBeGreaterThan(1);
        expect(
          matching.some(
            (entry) =>
              Date.now() - new Date(entry.date).getTime() <
              7 * 86400000,
          ),
        ).toBe(true);
      }
      if (block.type === "workout-duration") {
        const { params } = durationBlock.parse(block.body);
        expect(params.workout).toBeDefined();
        const workout = vault.content(params.workout!);
        expect(
          readWorkoutNote(workout).blocks.filter(
            (b) => b.type === "workout-log",
          ).length,
        ).toBeGreaterThan(1);
      }
    }
  } finally {
    jest.useRealTimers();
  }
});
