# Test Exercise Page Creation

This is a test file to demonstrate the new "Create Exercise Page" functionality.

## How to use:

1. Open the command palette (Ctrl/Cmd + Shift + P)
2. Search for "Create Exercise Page"
3. Fill in the exercise name, tags, and optional folder path
4. Click "Create Exercise Page"

## Example:

The modal will create a page with this template:

````yaml
---
nome_esercizio: Pullover Machine
tags:
  - spalle
  - deltoidi
  - laterali
  - isolamento
  - macchina
---

# Descrizione


# Tecnica di Esecuzione



# Note di Sicurezza

-

# Log delle Performance

```workout-log
exercise: Pullover Machine
````

### grafico

```workout-chart
exercise: Pullover Machine
```

```

## Features:

- ✅ Creates exercise pages with proper frontmatter
- ✅ Supports comma-separated tags
- ✅ Optional folder organization
- ✅ Pre-configured workout-log and workout-chart code blocks
- ✅ Automatically opens the created file
- ✅ Sanitizes file names for compatibility
```
