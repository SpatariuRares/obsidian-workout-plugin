import { TFile } from "obsidian";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import {
  ExampleGeneratorService,
  type CreateExamplesResult,
  type ExamplePluginPort,
} from "@app/services/examples/ExampleGeneratorService";

/**
 * "Create example notes": adds the example files that are missing and never
 * touches an existing one. The one call the command, onboarding and the
 * empty-state link share.
 */
export function createExampleNotes(
  plugin: ExamplePluginPort,
): Promise<CreateExamplesResult> {
  return new ExampleGeneratorService(plugin).createExamples();
}

/** Whether the examples were written, i.e. the result is not "failed" */
export function examplesCreated(
  result: CreateExamplesResult,
): boolean {
  return result !== "failed";
}

/** Creates missing examples and opens the single getting-started page. */
export async function openGettingStartedGuide(
  plugin: ExamplePluginPort,
): Promise<boolean> {
  const result = await createExampleNotes(plugin);
  if (!examplesCreated(result)) return false;
  return openGuideFile(plugin.app);
}

async function openGuideFile(
  app: ExamplePluginPort["app"],
): Promise<boolean> {
  const file = app.vault.getAbstractFileByPath(
    examplePaths.gettingStartedGuide(),
  );
  if (!(file instanceof TFile)) return false;
  await app.workspace.getLeaf(false).openFile(file, {
    active: true,
    state: { mode: "preview" },
  });
  return true;
}
