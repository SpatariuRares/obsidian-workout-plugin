import { Keymap, type HoverParent, type PaneType } from "obsidian";
import type { BlockCardTitleLink } from "@app/components/molecules/BlockCard";
import { openExercisePage } from "@app/features/modals/exercise/openExercisePage";
import type { ExercisePage } from "@app/services/exercise/ExerciseLibrary";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

export interface ExerciseTitleLinkOptions {
  plugin: WorkoutPluginContext;
  exerciseName?: string;
  sourcePath?: string;
  signal?: AbortSignal;
}

function findPage(plugin: WorkoutPluginContext, exerciseName: string): ExercisePage | undefined {
  if (typeof plugin.getExerciseLibrary !== "function") return undefined;
  return plugin.getExerciseLibrary().find(exerciseName);
}

/**
 * Builds native Obsidian link behavior for an exercise block title:
 * - Click opens the exercise page (or create-page modal when missing)
 * - Cmd/Ctrl+click or middle-click opens it in a new leaf
 * - Hover triggers Obsidian's native Page Preview when the page exists
 */
export function exerciseTitleLink({
  plugin,
  exerciseName,
  sourcePath = "",
  signal,
}: ExerciseTitleLinkOptions): BlockCardTitleLink | undefined {
  const trimmed = exerciseName?.trim();
  if (!trimmed) return undefined;

  const initialPage = findPage(plugin, trimmed);
  const hoverParent: HoverParent = { hoverPopover: null };

  return {
    href: initialPage?.file.path ?? trimmed,
    unresolved: !initialPage,
    signal,
    onOpen: (event: MouseEvent) => {
      const newLeaf: PaneType | boolean =
        event.type === "auxclick" && event.button === 1
          ? "tab"
          : Keymap.isModEvent(event);
      openExercisePage(plugin, trimmed, newLeaf);
    },
    onHover: (event: MouseEvent, targetEl: HTMLElement) => {
      const page = findPage(plugin, trimmed);
      if (!page) return;
      plugin.app?.workspace?.trigger?.("hover-link", {
        event,
        source: "preview",
        hoverParent,
        targetEl,
        linktext: page.file.path,
        sourcePath,
      });
    },
  };
}
