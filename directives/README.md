# Directives (SOPs)

This directory contains Standard Operating Procedures (SOPs) for complex development tasks.

## Purpose

SOPs define repeatable workflows in natural language. They help the AI agent:

- Understand what needs to be done
- Know which tools/scripts to use
- Produce consistent outputs

## Format

Each directive should include:

```markdown
# [Task Name]

## Objective
What this SOP accomplishes.

## Inputs
- Required inputs/parameters

## Steps
1. Step one
2. Step two
3. ...

## Tools Required
- Scripts from `execution/`
- External tools

## Expected Output
What the result should look like.
```

## Examples

- `add-new-view.md` - How to add a new embedded view
- `add-new-modal.md` - How to add a new modal
- `refactor-component.md` - Safe refactoring workflow
