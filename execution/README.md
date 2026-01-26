# Execution Scripts

This directory contains deterministic scripts for repeatable tasks.

## Purpose

Scripts here handle:

- File operations (bulk rename, generation)
- Code generation from templates
- Data transformations
- Build/test automation beyond npm scripts

## Guidelines

1. **Atomic**: Each script does one thing well
2. **Deterministic**: Same input = same output
3. **Robust**: Handle errors gracefully
4. **Documented**: Include usage in script header

## Naming Convention

```text
[action]-[target].sh    # Shell scripts
[action]-[target].js    # Node.js scripts
[action]-[target].py    # Python scripts
```

Examples:

- `generate-component.js`
- `bulk-rename-files.sh`
- `validate-constants.js`

## Temp Files

Use `../.tmp/` for intermediate files. Never commit temp files.
