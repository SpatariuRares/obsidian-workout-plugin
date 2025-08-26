# Debug Mode Guide

This guide explains how to use the enhanced debug mode to troubleshoot search functionality issues in the Workout Charts Plugin.

## Enabling Debug Mode

### Method 1: Plugin Settings
1. Go to Obsidian Settings > Plugin Options > Workout Charts
2. Enable "Debug Mode" toggle
3. Debug output will appear in the Developer Console for all plugin operations

### Method 2: Code Block Parameter
Add `debug: true` to individual code blocks:

```markdown
```workout-chart
exercise: Squat
type: volume
debug: true
```
```

```markdown
```workout-log
exercise: Bench Press
debug: true
```
```

## Reading Debug Output

When debug mode is enabled, you'll see detailed console output showing:

### DataFilter Debug Output
- **Initial Parameters**: Shows what parameters were passed to the filter
- **Data Counts**: Number of log entries at each filtering step
- **Filter Strategy**: Which filtering method is being used (exact match, fuzzy match, etc.)
- **Search Results**: How many matches were found for each search strategy

Example debug output:
```
[DataFilter] Starting filterData with params: {exercise: "Squat", exactMatch: true}
[DataFilter] Initial log data count: 150
[DataFilter] hasExercise: Squat
[DataFilter] Using exercise-only filtering
[DataFilter.filterByExercise] Starting exercise filtering
  - Input data count: 150
  - exercise param: Squat
  - exactMatch param: true
  - Processing exercise name: Squat
  - Using exact match filtering
  - Sample exercise field: squat
  - Sample exact match result: true
  - Exact match filtered count: 25
[DataFilter] Final result:
  - Filtered data count: 25
  - Filter method used: exact match on exercise field: "Squat"
  - Title prefix: Squat
```

### Utils Debug Output
- **Exercise Matching**: Shows how the plugin matches exercise names
- **Score Calculations**: Match scores for different search strategies
- **Strategy Selection**: Why a particular search strategy was chosen

Example debug output:
```
[utils.findExerciseMatches] Starting exercise matching
  - Target exercise name: Squat
  - Log data count: 150
  - Filename match: "Squat Workout" (score: 90)
  - Exercise field match: "Back Squat" (score: 80)
  - Total filename matches: 3
  - Total exercise field matches: 5

[utils.determineExerciseFilterStrategy] Determining best strategy
  - exactMatch: false
  - exerciseName: Squat
  - Best filename match score: 90 (threshold: 70)
  - Best exercise field score: 95 (threshold: 70)
  - Best exercise field: "Squat"
  - Comparing exercise field score (95) vs filename score (90)
  - Using exercise field strategy: "Squat"
  - Final strategy: exercise_field
```

## Common Debug Scenarios

### No Search Results
If you're not getting expected search results, check:

1. **Parameter Recognition**: Verify the plugin is reading your parameters correctly
2. **Data Availability**: Check if log data is being loaded
3. **Match Scores**: See if your search terms are matching with sufficient scores
4. **Strategy Selection**: Understand which search strategy is being used

### Fuzzy vs Exact Matching
- **Exact Match**: Looks for identical exercise names (case-insensitive)
- **Fuzzy Match**: Uses scoring algorithm to find similar exercise names
- **Threshold**: Fuzzy matches need a score ≥ 70 to be considered valid

### Strategy Priority
The plugin uses this priority order:
1. **Exact Exercise Field Match** (if exactMatch=true)
2. **Exact Filename Match** (if exactMatch=true)
3. **Exercise Field Fuzzy Match** (highest score)
4. **Filename Fuzzy Match** (if higher than exercise field score)

## Troubleshooting Common Issues

### Issue: "No data found"
**Debug Steps:**
1. Check if `Initial log data count` is > 0
2. If 0, verify your CSV file path and format
3. If > 0, check filtering logic for your specific parameters

### Issue: "Wrong exercise data shown"
**Debug Steps:**
1. Look at the `Filter method used` output
2. Check match scores for your exercise name
3. Verify the strategy being used matches your expectations
4. Consider using `exactMatch: true` for more precise results

### Issue: "Search is too slow"
**Debug Steps:**
1. Check the `Input data count` - large datasets take longer
2. Look for repeated processing in debug output
3. Consider reducing date ranges or using more specific filters

## Disabling Debug Mode

To reduce console noise:
1. Turn off Debug Mode in plugin settings, OR
2. Remove `debug: true` from specific code blocks

## Performance Impact

Debug mode adds console logging overhead. For production use:
- Keep plugin-level debug mode OFF
- Only enable for specific troubleshooting sessions
- Use code-block level debug for targeted debugging