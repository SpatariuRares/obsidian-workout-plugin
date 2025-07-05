# Example Workout Data

This file contains example workout log entries that demonstrate the plugin's functionality.

## Sample Log 1

---

Rep: 10
Weight: 80
Volume: 800

---

Esercizio:: [[Squat]]
Origine:: [[Workout A]]
DataOra:: 2025-01-17T10:30:00

## Sample Log 2

---

Rep: 8
Weight: 100
Volume: 800

---

Esercizio:: [[Bench Press]]
Origine:: [[Workout B]]
DataOra:: 2025-01-18T14:15:00

## Sample Log 3

---

Rep: 12
Weight: 60
Volume: 720

---

Esercizio:: [[Deadlift]]
Origine:: [[Workout A]]
DataOra:: 2025-01-19T09:45:00

## Sample Log 4

---

Rep: 10
Weight: 85
Volume: 850

---

Esercizio:: [[Squat]]
Origine:: [[Workout B]]
DataOra:: 2025-01-20T16:20:00

## Sample Log 5

---

Rep: 6
Weight: 110
Volume: 660

---

Esercizio:: [[Bench Press]]
Origine:: [[Workout A]]
DataOra:: 2025-01-21T11:30:00

## Usage Instructions

1. Create a folder structure like: `theGYM/Log/Data/`
2. Create individual markdown files for each workout session
3. Use the frontmatter format shown above
4. Enable the plugin in Obsidian settings
5. Open the Workout Charts view to see your data visualized

## Plugin Features Demonstrated

- **Volume Tracking**: Automatic calculation of volume (reps × weight)
- **Exercise Filtering**: Filter by specific exercises
- **Date Range**: View data from the last X days
- **Chart Types**: Switch between Volume, Weight, and Reps views
- **Trend Analysis**: See progress over time with trend lines
