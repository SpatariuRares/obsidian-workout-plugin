import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";

/** The `workout-duration` code block */
export const durationBlock = defineCodeBlock("workout-duration", {
  /** Workout note to analyze: vault path, path relative to this note, or note name; unset = this note */
  workout: { kind: "string" },
});
