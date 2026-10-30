---
name: obsidian-verify
description: Check a change live in the running Obsidian (obsidian-devtools MCP) without writing the user's notes or workout log - rebuild, reload the plugin, render views in detached containers, open modals and close them unsaved, read the console. Use after a change to confirm it works in the real app, when asked to test something in Obsidian, or to capture screenshots of the plugin's views (desktop or mobile) for the README.
---

# Verify in Obsidian, read-only

The user's vault holds real training data. A live check must leave it exactly as it was: no saved log entries, no edited notes, no created files. Everything below either reads, or renders into a container that is thrown away.

## 0. Preconditions

- Obsidian runs with `--remote-debugging-port=9222` (`open -a Obsidian --args --remote-debugging-port=9222`). Check: `curl -s --max-time 2 http://127.0.0.1:9222/json/version`. If it fails, ask the user to relaunch Obsidian that way; do not try to start or kill it yourself.
- Load the MCP tools in one ToolSearch call: `select:mcp__obsidian-devtools__list_pages,mcp__obsidian-devtools__evaluate_script,mcp__obsidian-devtools__take_screenshot,mcp__obsidian-devtools__list_console_messages`. `list_pages` gives the page id (usually 1).

## 1. Build and reload

```bash
npm run build
```

Then reload the plugin and record the log size, to prove at the end that nothing was written:

```js
async () => {
  await app.plugins.disablePlugin("workout-planner");
  await app.plugins.enablePlugin("workout-planner");
  const p = app.plugins.plugins["workout-planner"];
  return { rows: (await p.getWorkoutLogData()).length };
}
```

## 2. Check what the change touches

Pick the matching recipes from [recipes.md](recipes.md):

- **Views** (table, chart, dashboard): render into a detached `<div>` with the plugin's view (`p.embeddedTableView.createTable(el, logs, params)`, `p.embeddedChartView.createChart(el, logs, params)`), read the DOM, then `el.remove()`. Or open an existing note with `app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath(path))` and read the rendered blocks.
- **Modals and forms**: open with `app.commands.executeCommandById("workout-planner:<command>")`, fill inputs, press buttons that only compute (+/-), and press the save button **only with input that must be refused** (to test validation). Close with the modal's close button. Never confirm a valid form.
- **Services and API**: call them directly (`p.getExerciseLibrary()`, `p.getExerciseDefinitionService()`, `p.getMuscleTagService()`, `window.WorkoutPlannerAPI`).
- **Screenshots** for the README: follow "Screenshots" in [recipes.md](recipes.md), then frame them with `scripts/frame-screenshot.py`.
- **Expected values**: compute them independently from `await p.getWorkoutLogData()` in the same script and compare. A matching number is the evidence; "it renders" is not.

## 3. Things that write: do not run them

Report these as "not tested live (would write)" and point to the unit tests instead:

- saving a valid log entry (Create/Edit log), the Edit table / Edit timer modals, deleting a row
- commands: `add-missing-block-ids`, `export-workout-to-canvas`, `migrate-exercise-types`, `convert-exercise-data`, `create-csv-log`, `create-exercise-page`, `create-exercise-section`, `add-exercise-block`, the `insert-*` commands, `generate-tag-reference`, `manage-muscle-tags` changes
- any edit to a note or CSV in the vault (the project hooks block CSV writes)

If the user explicitly asks to test one of these, propose a scratch note they approve, and delete it afterwards.

## 4. Finish

- Log size unchanged: rerun `(await p.getWorkoutLogData()).length` and compare with step 1.
- No modal left open: `!!document.querySelector(".modal-container")` is false.
- Console clean: `list_console_messages` with `types: ["error", "warn"]`.

Report a table: what was checked, how (computed vs rendered), and the result; then a separate list of what was not tested live and why. A difference that comes from the user's data, not the code (e.g. a duration stored in the wrong unit), is reported as a data issue, not a bug.
