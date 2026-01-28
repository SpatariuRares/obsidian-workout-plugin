/**
 * Templater User Script Functions for Obsidian Workout Plugin
 *
 * These functions can be used with the Templater plugin to generate
 * workout-related content in your notes.
 *
 * Setup:
 * 1. Copy this file to your Templater user scripts folder
 * 2. In Templater settings, set the "Script files folder location"
 * 3. Use the functions in your templates with tp.user.functionName()
 */

/**
 * Generates a formatted exercise block with an embedded workout-timer code block.
 *
 * @param {string} name - The name of the exercise (e.g., "Bench Press", "Squat")
 * @param {number} duration - Timer duration in seconds (e.g., 60 for 1 minute rest)
 * @param {string} workout - The workout name/identifier for logging purposes
 * @returns {string} A formatted markdown string with exercise header and timer code block
 *
 * @example
 * // In a Templater template:
 * <% tp.user.workoutExerciseBlock("Bench Press", 90, "Push Day") %>
 *
 * // Output:
 * // ## Bench Press
 * //
 * // ```workout-timer
 * // duration: 90
 * // exercise: Bench Press
 * // workout: Push Day
 * // showControls: true
 * // ```
 */
function workoutExerciseBlock(name, duration, workout) {
    // Validate inputs
    if (!name || typeof name !== 'string') {
        return '> [!error] Exercise name is required';
    }

    // Default duration to 60 seconds if not provided or invalid
    const timerDuration = typeof duration === 'number' && duration > 0 ? duration : 60;

    // Build the exercise block
    const lines = [
        `## ${name}`,
        '',
        '```workout-timer',
        `duration: ${timerDuration}`,
        `exercise: ${name}`,
    ];

    // Add workout field if provided
    if (workout && typeof workout === 'string') {
        lines.push(`workout: ${workout}`);
    }

    lines.push('showControls: true');
    lines.push('```');

    return lines.join('\n');
}

module.exports = workoutExerciseBlock;
