import { TFile } from "obsidian";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { t } from "@app/i18n";
import {
  ExampleGeneratorService,
  gettingStartedGuidePath,
  type CreateExamplesResult,
  type ExamplePluginPort,
} from "@app/services/examples/ExampleGeneratorService";

/** Shows a confirm modal; true when accepted, false when declined or closed */
function ask(app: ExamplePluginPort["app"], message: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    new ConfirmModal(
      app,
      message,
      () => resolve(true),
      () => resolve(false),
    ).open();
  });
}

/**
 * "Create example notes" with its overwrite confirmation. The one call the
 * settings button, the command, the welcome modal and the empty-state link
 * share.
 */
export function createExampleNotes(
  plugin: ExamplePluginPort,
): Promise<CreateExamplesResult> {
  return new ExampleGeneratorService(plugin).createExamples(() =>
    ask(plugin.app, t("settings.messages.confirmOverwriteExamples")),
  );
}

/**
 * Opens the "Getting started" note. When it does not exist, offers to create
 * the examples first. Returns whether the note was opened.
 */
export async function openGettingStartedGuide(
  plugin: ExamplePluginPort,
): Promise<boolean> {
  const { app } = plugin;
  if (await openGuideFile(app)) return true;
  if (!(await ask(app, t("examples.createToOpenGuide")))) return false;
  const result = await createExampleNotes(plugin);
  if (result === "cancelled" || result === "failed") return false;
  return openGuideFile(app);
}

async function openGuideFile(app: ExamplePluginPort["app"]): Promise<boolean> {
  const file = app.vault.getAbstractFileByPath(gettingStartedGuidePath());
  if (!(file instanceof TFile)) return false;
  await app.workspace.getLeaf(false).openFile(file);
  return true;
}
