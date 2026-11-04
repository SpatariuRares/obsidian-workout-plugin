import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";

/**
 * The `workout-session` code block. It has no parameters: the plan is the
 * note's `workout-log` and `workout-sets` blocks (see readSessionPlan).
 */
export const sessionBlock = defineCodeBlock("workout-session", {});
