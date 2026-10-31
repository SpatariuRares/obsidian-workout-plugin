# Unreleased

- Added a warm-up protocol. Warm-up and drop sets no longer establish personal records or count as new records. Volume and trends still include them. The `WorkoutPlannerAPI.getExerciseStats()` PR fields now follow this rule; existing CSV rows are unchanged.
- Log forms show the last set and personal record. A new weight record shows its increase after saving; an exercise's first eligible weighted set establishes the baseline without a celebration.
