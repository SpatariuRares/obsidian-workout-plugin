# Workout Planner Plugin

A comprehensive plugin for Obsidian that visualizes workout data with interactive charts, tables, and timers. This plugin converts your workout log files into beautiful visualizations and provides tools to track your fitness progress over time.

## Features

- **Interactive Charts**: View your workout data in various chart types (Volume, Weight, Reps) using Chart.js
- **Data Tables**: Display workout logs in organized, sortable tables
- **Workout Timers**: Built-in timers for tracking rest periods and workout sessions
- **Advanced Search**: Intelligent exercise matching with multiple search strategies
- **Data Parsing**: Automatically reads workout log files from your specified folder
- **Real-time Updates**: Refresh charts and tables to see your latest workout data
- **Customizable Settings**: Configure chart types, date ranges, and display options
- **Log Creation**: Create new workout logs directly from the plugin
- **Exercise Management**: Create exercise pages and sections for better organization
- **Trend Lines**: Visualize progress trends with automatic trend line calculation
- **Debug Mode**: Detailed logging for troubleshooting and optimization
- **Responsive Design**: Works on desktop and mobile devices
- **Code Block Integration**: Embed charts, tables, and timers directly in your notes

## How it Works

The plugin reads workout log files from your vault that follow this format:

```markdown
---
Rep: 10
Weight: 80
Volume: 800
---

Exercise:: [[Squat]]
Source:: [[Workout A]]
DateTime:: 2025-01-17T10:30:00
```

## Installation

1. Download the latest release
2. Extract the files to your `.obsidian/plugins/workout-planner/` folder
3. Enable the plugin in Obsidian settings
4. Configure the log folder path in plugin settings

## Usage

### Available Commands

The plugin provides several commands accessible through the Command Palette (Ctrl/Cmd + P):

- **Create Workout Log**: Create a new workout log entry
- **Create Log Folder**: Create the default log folder if it doesn't exist
- **Insert Workout Chart**: Insert a chart code block into your current note
- **Insert Workout Table**: Insert a table code block into your current note
- **Insert Workout Timer**: Insert a timer code block into your current note
- **Create Exercise Page**: Create a new page for an exercise
- **Create Exercise Section**: Create a new section for an exercise

### Creating Workout Logs

1. Use the command palette: "Create Workout Log"
2. Fill in the exercise name, reps, weight, and other details
3. The plugin will create a new log file in your specified folder

### Using Code Blocks

The plugin supports three types of code blocks that you can embed directly in your notes:

#### Workout Charts

````markdown
```workout-chart
exercise: Squat
chartType: Volume
dateRange: 30
showTrendLine: true
```
````

````

#### Workout Tables

```markdown
```workout-log
exercise: Bench Press
exactMatch: false
dateRange: 14
````

````

#### Workout Timers

```markdown
```workout-timer
duration: 90
label: Rest Period
autoStart: false
````

````

### Code Block Parameters

#### Chart Parameters
- `exercise`: Exercise name to filter (optional)
- `chartType`: Type of chart (Volume, Weight, Reps)
- `dateRange`: Number of days to include (default: 30)
- `showTrendLine`: Enable trend line (true/false)
- `height`: Chart height in pixels

#### Table Parameters
- `exercise`: Exercise name to filter (optional)
- `exactMatch`: Use exact matching for exercise names (true/false)
- `dateRange`: Number of days to include
- `sortBy`: Sort field (Date, Exercise, Weight, Reps, Volume)
- `sortOrder`: Sort order (asc, desc)

#### Timer Parameters
- `duration`: Timer duration in seconds
- `label`: Timer label
- `autoStart`: Start timer automatically (true/false)
- `sound`: Enable sound notifications (true/false)

### Advanced Search Features

The plugin includes an intelligent search system that can find exercises even with variations in naming:

- **Multiple Search Strategies**:
  - Filename matching
  - Exercise field matching
  - Automatic strategy selection based on match scores
- **Fuzzy Matching**: Finds exercises with similar names
- **Score-based Filtering**: Uses confidence scores to determine best matches
- **Debug Information**: Shows which search strategy was used

## Settings

- **Log Folder Path**: Path to your workout log files (default: "Log/Data")
- **Default Exercise**: Default exercise to show in charts
- **Chart Type**: Default chart type (Volume/Weight/Reps)
- **Date Range**: Number of days to include in charts (default: 30)
- **Show Trend Line**: Enable trend line visualization
- **Chart Height**: Height of charts in pixels (default: 400)
- **Debug Mode**: Enable debug logging for troubleshooting

## Data Format

Your workout log files should be in Markdown format with frontmatter containing:

- `Rep`: Number of repetitions
- `Weight`: Weight used (in kg)
- `Volume`: Calculated volume (Reps × Weight)
- `Exercise`: Exercise name (can be a link)
- `Source`: Workout source (can be a link)
- `DateTime`: Date and time in ISO format

### Example Log File

```markdown
---
Rep: 8
Weight: 100
Volume: 800
---

Exercise:: [[Bench Press]]
Source:: [[Push Day]]
DateTime:: 2025-01-17T10:30:00
````

## API Documentation

See https://github.com/obsidianmd/obsidian-api
