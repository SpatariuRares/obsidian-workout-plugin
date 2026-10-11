import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";

/** The `workout-duration` code block */
export const durationBlock = defineCodeBlock("workout-duration", {
  /** Workout file to analyze (relative or absolute); unset = this note */
  workout: { kind: "string" },
});
