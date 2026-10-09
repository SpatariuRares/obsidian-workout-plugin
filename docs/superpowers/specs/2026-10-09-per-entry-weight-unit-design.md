# Per-entry weight unit

Issue: [#16](https://github.com/SpatariuRares/obsidian-workout-plugin/issues/16) — "Allow changing weight units per log".

## Problem

The weight unit is one global setting (`settings.weightUnit`) and only changes labels. The CSV stores bare numbers.

1. Someone training with both kg and lb plates can't log what they actually lifted. They have to convert in their head before logging.
2. Changing the setting relabels every existing log: 100 kg becomes "100 lb".

A first attempt converted input to the settings unit on save. That fixes totals but breaks the main use case: a user who loaded 220 lb of plates later sees "99.79 kg" and has to convert back to know which plates to load.

## Goals

- A log shows exactly what was entered: "220 lb" in the table and in the edit modal.
- Charts, volume, dashboards, targets and stats keep working in one unit, the settings unit, converting the rows that use the other one.
- Changing the setting never relabels existing logs.
- The public API (`window.WorkoutPlannerAPI`) keeps its contract.

## Non-goals

- Mixing units inside one entry (a set with both kg and lb plates).
- A table option to show every row converted to the settings unit.
- Converting `weightIncrement` / `quickWeightIncrement` or `targetWeight` in code blocks.

## Design

### 1. CSV format

- New column `weightUnit`, with value `kg`, `lb` or empty. It is added at the end of the header through `CSVColumnService.ensureColumnExists("weightUnit")` and read **by header name**. Standard columns are positional (`weight` is index 3), and custom columns such as `distance` already follow `protocol`, so a positional slot isn't available.
- `parseCSVLogFile` reads the column into `CSVWorkoutLogEntry.weightUnit?: WeightUnit` and leaves it out of `customFields`. `entriesToCSVContent` writes it back.
- `weight` and `volume` in a row are in that row's unit, exactly as entered.
- An empty `weightUnit` marks a legacy row. It is read in the current settings unit, which matches today's behaviour.

### 2. Read path (single conversion point)

In `CSVCacheService.loadCSVData` each `WorkoutLogData` gets:

- `weight` / `volume` converted to `settings.weightUnit` with `convertWeight` (2 decimals). When the stored volume equals reps × weight, volume is recomputed from the converted weight to avoid rounding drift; otherwise it is converted on its own.
- `enteredWeight?: number` and `enteredUnit?: WeightUnit`, holding the raw value and its unit. For legacy rows `enteredUnit` is the settings unit.

Every consumer that does maths (24 files: charts, dashboard widgets, `TargetCalculator`, `DataAggregation`, `TableRowProcessor` volume, the API, …) keeps reading `weight` / `volume` and gets settings-unit numbers with no change.

The cache is cleared on `settings:changed` with `key: "weightUnit"`, because the converted numbers depend on the setting.

`WorkoutPlannerAPI.getWorkoutLogs` keeps `weight` / `volume` in the settings unit. `enteredWeight` / `enteredUnit` are new optional fields, so the change is additive.

### 3. Write path

- The kg/lb select next to the weight field (`DynamicFieldsRenderer`) starts at the settings unit. Switching it converts the value already in the field, as it does now.
- `LogSubmissionHandler` no longer converts. It saves `weight` as typed, `weightUnit` = the selected unit, and `volume = reps × weight` in that unit.
- `WorkoutLogRepository.addWorkoutLogEntry` / `updateWorkoutLogEntry` always write `weightUnit`. An entry without one (for example from `ExerciseConversionService`, which passes settings-unit numbers from `WorkoutLogData`) is stamped with the settings unit, which is correct for those numbers.
- The fallback matching in `updateWorkoutLogEntry` / `deleteWorkoutLogEntry` (date + exercise + reps + weight, used when the timestamp doesn't match) compares the CSV value with `enteredWeight ?? weight`.
- Prefill:
  - The edit modal sets the field to `enteredWeight` and the select to `enteredUnit`.
  - The "last entry" autofill in `LogFormRenderer` does the same.

### 4. `workout-log` table

- The weight cell shows `enteredWeight`. When `enteredUnit` differs from the settings unit the value gets a suffix ("220 lb"). Rows in the settings unit look as they do today.
- Volume stays in the settings unit, consistent with totals and charts.

### 5. Changing the unit in settings

- The setting now means "unit for charts and totals, and default for new logs".
- On change, before saving the new value, legacy rows (empty `weightUnit`) are stamped with the **previous** unit, so they keep their meaning. No numbers change, so there is no prompt. The CSV is backed up first.
- Removed from the first attempt: `WeightUnitChangeModal`, `convertWeightUnit` (repository, `DataService`, `WorkoutDataPort`, `main.ts`) and the `convert-unit` bulk operation. Replaced by `stampMissingWeightUnits(unit): Promise<number>` with a `migrate-unit` bulk operation.

### 6. Maintenance

"Run all maintenance" also runs `stampMissingWeightUnits(settings.weightUnit)`:

- It is idempotent: once rows are stamped, a later run touches 0 rows and writes nothing (no backup either).
- Before writing it makes a backup next to the CSV (`<name>.backup-<ISO timestamp>.csv`) and keeps the 3 most recent. Older backups go to the trash through `fileManager.trashFile`.
- It shows a notice with the number of rows updated.

### Kept from the first attempt

- `app/utils/WeightUnitUtils.ts` (`convertWeight`, `isWeightUnit`, `WEIGHT_UNITS`, 2-decimal rounding, because 1.25 kg / 1.25 lb plates need the hundredths).
- The kg/lb select in the log form and its styles. In the 2-column layout the grid is bottom-aligned, so the inputs line up while the select keeps its 44px touch target.
- The CSV backup helper and its limit of 3.
- i18n: `modal.weightUnitToggle`. The `settings.weightUnitChange.*` keys are replaced by maintenance and notice strings.

## Error handling

- If the backup fails, the CSV is not written and the setting change is aborted. A notice explains why.
- An unknown `weightUnit` value in the CSV (e.g. "lbs") is treated as legacy (settings unit) and left untouched.

## Testing

- Parser/writer round trip with `weightUnit`, including files with custom columns and files without the column.
- Cache normalisation: kg row and lb row with settings in kg and in lb, legacy row, volume recompute vs independent conversion, cache cleared on unit change.
- `LogSubmissionHandler` saves the typed value plus the selected unit, with no conversion.
- Edit modal and last-entry prefill use `enteredWeight` / `enteredUnit`.
- Repository: `weightUnit` stamped when missing; fallback matching on the entered weight.
- `stampMissingWeightUnits`: stamps only empty rows, is idempotent, backs up first, keeps 3 backups.
- Settings change stamps legacy rows with the previous unit before saving.
- Table weight cell suffix only when the unit differs.
- Live check in Obsidian (mobile and desktop, light and dark) against a copy of the real CSV: a kg→lb→kg setting round trip leaves the file's numbers unchanged.
