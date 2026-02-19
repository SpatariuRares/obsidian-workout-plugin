import type { EventRef } from "obsidian";

export interface WorkoutDataChangedEvent {
  exercise?: string;
  workout?: string;
}

/**
 * Event fired when muscle tag mappings change (add/edit/delete/import/reset).
 * Always global — no filtering needed since muscle tags affect all views.
 */
export interface MuscleTagsChangedEvent {}

// Augment Obsidian's Workspace to type our custom event
declare module "obsidian" {
  interface Workspace {
    on(
      name: "workout-planner:data-changed",
      callback: (evt: WorkoutDataChangedEvent) => void,
    ): EventRef;
    trigger(
      name: "workout-planner:data-changed",
      evt: WorkoutDataChangedEvent,
    ): void;
    on(
      name: "workout-planner:muscle-tags-changed",
      callback: (evt: MuscleTagsChangedEvent) => void,
    ): EventRef;
    trigger(
      name: "workout-planner:muscle-tags-changed",
      evt: MuscleTagsChangedEvent,
    ): void;
    on(
      name: "workout-planner:log-added",
      callback: (evt: WorkoutDataChangedEvent) => void,
    ): EventRef;
    trigger(
      name: "workout-planner:log-added",
      evt: WorkoutDataChangedEvent,
    ): void;
  }
}
