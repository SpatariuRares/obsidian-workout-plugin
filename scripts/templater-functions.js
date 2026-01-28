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
 *
 * Note: Some functions require access to 'tp' (Templater object) to interact
 * with the Obsidian API. These are marked as async and need tp passed as first arg.
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

/**
 * Gets exercise names from the configured exercises folder.
 * Optionally filters exercises by frontmatter tag.
 *
 * This function requires access to the Templater 'tp' object to read files
 * from the vault. It reads the plugin settings to find the exercises folder.
 *
 * @param {object} tp - The Templater object (passed automatically when called via tp.user)
 * @param {object} [filter] - Optional filter object
 * @param {string} [filter.tag] - Filter exercises by tag (matches frontmatter tags array)
 * @returns {Promise<string[]>} Array of exercise names (file basenames without extension)
 *
 * @example
 * // Get all exercises
 * <% tp.user.workoutExercises(tp) %>
 *
 * // Filter by tag
 * <% tp.user.workoutExercises(tp, {tag: "glutes"}) %>
 *
 * // Use in a Templater loop
 * <%*
 * const exercises = await tp.user.workoutExercises(tp, {tag: "chest"});
 * for (const exercise of exercises) {
 *   tR += `- ${exercise}\n`;
 * }
 * %>
 */
async function workoutExercises(tp, filter) {
    // Validate tp object
    if (!tp || !tp.app) {
        console.error('workoutExercises: tp object with app property is required');
        return [];
    }

    const app = tp.app;

    // Get plugin settings to find exercises folder
    // The plugin stores settings in localStorage with key 'obsidian-workout-charts'
    // or we can read from the plugin's data.json
    let exerciseFolderPath = 'Esercizi'; // Default fallback

    try {
        // Try to get the plugin instance for settings
        const plugin = app.plugins?.plugins?.['obsidian-workout-plugin'];
        if (plugin && plugin.settings && plugin.settings.exerciseFolderPath) {
            exerciseFolderPath = plugin.settings.exerciseFolderPath;
        }
    } catch (e) {
        // Use default folder path
    }

    // Get the exercises folder
    const folder = app.vault.getAbstractFileByPath(exerciseFolderPath);
    if (!folder || folder.children === undefined) {
        console.warn(`workoutExercises: Exercises folder not found: ${exerciseFolderPath}`);
        return [];
    }

    // Get all markdown files in the folder
    const exerciseFiles = folder.children.filter(
        file => file.extension === 'md'
    );

    // If no filter, return all exercise names
    if (!filter || !filter.tag) {
        return exerciseFiles.map(file => file.basename).sort();
    }

    // Filter by tag - need to read each file's frontmatter
    const tagFilter = filter.tag.toLowerCase();
    const filteredExercises = [];

    for (const file of exerciseFiles) {
        try {
            const content = await app.vault.read(file);
            const tags = parseFrontmatterTags(content);

            // Check if any tag matches (case-insensitive)
            const hasMatchingTag = tags.some(
                tag => tag.toLowerCase() === tagFilter
            );

            if (hasMatchingTag) {
                filteredExercises.push(file.basename);
            }
        } catch (e) {
            // Skip files that can't be read
            console.warn(`workoutExercises: Could not read file: ${file.path}`);
        }
    }

    return filteredExercises.sort();
}

/**
 * Helper function to parse tags from frontmatter
 * @param {string} content - File content
 * @returns {string[]} Array of tags
 */
function parseFrontmatterTags(content) {
    // Extract frontmatter between --- markers
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
        return [];
    }

    const frontmatter = frontmatterMatch[1];

    // Parse YAML tags - supports both array and inline formats
    // Format 1: tags: [tag1, tag2]
    // Format 2: tags:\n  - tag1\n  - tag2
    // Format 3: tags: tag1 (single tag)

    // Try array format: tags: [tag1, tag2]
    const arrayMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m);
    if (arrayMatch) {
        return arrayMatch[1]
            .split(',')
            .map(tag => tag.trim().replace(/^['"]|['"]$/g, ''))
            .filter(tag => tag.length > 0);
    }

    // Try YAML list format: tags:\n  - tag1\n  - tag2
    const listMatch = frontmatter.match(/^tags:\s*\n((?:\s+-\s+.+\n?)+)/m);
    if (listMatch) {
        return listMatch[1]
            .split('\n')
            .map(line => line.replace(/^\s+-\s+/, '').trim())
            .filter(tag => tag.length > 0);
    }

    // Try single tag format: tags: tag1
    const singleMatch = frontmatter.match(/^tags:\s+(\S+)/m);
    if (singleMatch) {
        return [singleMatch[1].trim()];
    }

    return [];
}

module.exports = {
    workoutExerciseBlock,
    workoutExercises
};
