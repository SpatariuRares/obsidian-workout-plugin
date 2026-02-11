# i18n Constants Migration Script

Part of the **DOE Framework** - Execution Layer (E)

## Overview

This script automatically migrates hardcoded strings in `ui.constants.ts` to internationalized getters using the LocalizationService.

## What It Does

1. **Reads** `app/constants/ui.constants.ts`
2. **Identifies** hardcoded strings in constant objects
3. **Transforms** strings to getters with `t()` calls
4. **Preserves** functions, icons, and non-translatable content
5. **Creates** backup of original file
6. **Generates** detailed migration report

## Example Transformation

**BEFORE:**
```typescript
export const MODAL_UI = {
  BUTTONS: {
    CREATE: "Create log",
    UPDATE: "Update log",
  }
}
```

**AFTER:**
```typescript
export const MODAL_UI = {
  BUTTONS: {
    get CREATE() {
      return t("modal.buttons.create");
    },
    get UPDATE() {
      return t("modal.buttons.update");
    },
  }
}
```

## Usage

### Option 1: Using npm script (recommended)
```bash
npm run migrate:i18n
```

### Option 2: Direct execution
```bash
node scripts/migrate-i18n-constants.mjs
```

## What Gets Migrated

✅ **Migrated:**
- `MODAL_UI.TITLES` → `modal.titles.*`
- `MODAL_UI.BUTTONS` → `modal.buttons.*`
- `MODAL_UI.LABELS` → `modal.labels.*`
- `MODAL_UI.PLACEHOLDERS` → `modal.placeholders.*`
- `MODAL_UI.NOTICES` → `modal.notices.*`
- `SETTINGS_UI.LABELS` → `settings.labels.*`
- `SETTINGS_UI.DESCRIPTIONS` → `settings.descriptions.*`
- `TABLE_UI.COLUMNS` → `table.columns.*`
- `TABLE_UI.LABELS` → `table.labels.*`
- `DASHBOARD_UI.*` → `dashboard.*`
- `CHARTS_UI.LABELS` → `charts.labels.*`
- `GENERAL_UI.*` → `general.*`
- `MESSAGES_UI.*` → `messages.*`

❌ **Preserved (not migrated):**
- `ICONS` - Icon/emoji constants (not translatable)
- `EMOJI` - Emoji constants (not translatable)
- `CODE_BLOCKS` - Technical identifiers (not translatable)
- `DEFAULTS` - Numeric/configuration values
- Existing getter functions with dynamic content
- Arrow functions with parameters

## Safety Features

1. **Automatic Backup**: Creates `ui.constants.ts.backup` before making changes
2. **Dry Run Mode**: Review transformations before applying (check report)
3. **Detailed Report**: Generates `migration-report.json` with all changes
4. **Rollback**: Simply restore from backup if needed

## Output Files

- **Backup**: `app/constants/ui.constants.ts.backup`
- **Report**: `migration-report.json`

## Migration Report

The report includes:
- Total strings found and migrated
- Success rate percentage
- List of warnings (skipped sections)
- Sample transformations
- Timestamp of migration

Example:
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "statistics": {
    "totalStrings": 250,
    "migratedStrings": 235,
    "skippedStrings": 15,
    "successRate": "94.00%"
  },
  "warnings": ["Skipped section: ICONS"],
  "transformations": [...]
}
```

## Rollback Instructions

If something goes wrong:

```bash
# Restore from backup
cp app/constants/ui.constants.ts.backup app/constants/ui.constants.ts

# Or on Windows
copy app\constants\ui.constants.ts.backup app\constants\ui.constants.ts
```

## After Migration

1. **Review Changes**: Check the generated file for correctness
2. **Run Build**: `npm run build` to verify no syntax errors
3. **Run Tests**: `npm test` to ensure nothing broke
4. **Test Plugin**: Load in Obsidian and verify UI strings display correctly

## Troubleshooting

### "Module not found" error
Make sure you're running from the project root:
```bash
cd path/to/obsidian-workout-plugin
npm run migrate:i18n
```

### "Permission denied" error
The script needs write access to `app/constants/`:
```bash
chmod +w app/constants/ui.constants.ts
```

### JSON keys missing
After migration, ensure corresponding keys exist in:
- `app/i18n/locales/en.json`
- `app/i18n/locales/it.json`

Use the migration report to identify which keys were created.

## Integration with DOE Framework

- **D (Directive)**: Transformation rules defined in script
- **O (Orchestration)**: Claude Code executes migration
- **E (Execution)**: Deterministic Node.js script

This script becomes part of your development toolchain and can be reused for:
- Adding new languages
- Updating translations
- Migrating other constant files
- Generating translation keys automatically

## Next Steps

After successful migration:

1. ✅ Update JSON locale files with new keys
2. ✅ Test plugin in Obsidian (English & Italian)
3. ✅ Add more languages (create `ro.json`, `es.json`, etc.)
4. ✅ Update CLAUDE.md with i18n documentation
5. ✅ Commit changes with meaningful message

## Support

For issues or questions:
- Check `migration-report.json` for detailed transformation log
- Review backup file to compare before/after
- Run TypeScript compiler to catch type errors: `npm run build`
