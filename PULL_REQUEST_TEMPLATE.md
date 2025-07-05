# Plugin Submission

## Plugin Name

Workout Planner

## Plugin ID

workout-planner

## Plugin Description

A comprehensive plugin for Obsidian that visualizes workout data with interactive charts, tables, and timers. This plugin converts your workout log files into beautiful visualizations and provides tools to track your fitness progress over time.

## Plugin Author

Rares Spatariu

## Plugin Author URL

https://github.com/SpatariuRares

## Plugin Repository

https://github.com/SpatariuRares/obsidian-workout-plugin

## Plugin License

MIT

## Plugin Version

1.0.0

## Minimum Obsidian Version

0.15.0

## Desktop Only

No

## Features

- Interactive Charts: View your workout data in various chart types (Volume, Weight, Reps) using Chart.js
- Data Tables: Display workout logs in organized, sortable tables
- Workout Timers: Built-in timers for tracking rest periods and workout sessions
- Advanced Search: Intelligent exercise matching with multiple search strategies
- Data Parsing: Automatically reads workout log files from your specified folder
- Real-time Updates: Refresh charts and tables to see your latest workout data
- Customizable Settings: Configure chart types, date ranges, and display options
- Log Creation: Create new workout logs directly from the plugin
- Exercise Management: Create exercise pages and sections for better organization
- Trend Lines: Visualize progress trends with automatic trend line calculation
- Debug Mode: Detailed logging for troubleshooting and optimization
- Responsive Design: Works on desktop and mobile devices
- Code Block Integration: Embed charts, tables, and timers directly in your notes

## Installation Instructions

1. Download the latest release
2. Extract the files to your `.obsidian/plugins/workout-planner/` folder
3. Enable the plugin in Obsidian settings
4. Configure the log folder path in plugin settings

## Usage Instructions

The plugin provides several commands accessible through the Command Palette (Ctrl/Cmd + P):

- Create Workout Log: Create a new workout log entry
- Create Log Folder: Create the default log folder if it doesn't exist
- Insert Workout Chart: Insert a chart code block into your current note
- Insert Workout Table: Insert a table code block into your current note
- Insert Workout Timer: Insert a timer code block into your current note
- Create Exercise Page: Create a new page for an exercise
- Create Exercise Section: Create a new section for an exercise

## Data Format

Your workout log files should be in Markdown format with frontmatter containing:

- Rep: Number of repetitions
- Weight: Weight used (in kg)
- Volume: Calculated volume (Reps × Weight)
- Exercise: Exercise name (can be a link)
- Source: Workout source (can be a link)
- DateTime: Date and time in ISO format

## Third-Party Libraries

- Chart.js (v4.4.0) - For interactive chart rendering
  - License: MIT
  - Repository: https://github.com/chartjs/Chart.js

## Screenshots

[Add screenshots of your plugin in action]

## Testing

- [x] Plugin works on desktop
- [x] Plugin works on mobile
- [x] Plugin follows Obsidian's design guidelines
- [x] Plugin doesn't interfere with other plugins
- [x] Plugin handles errors gracefully
- [x] Plugin has proper error messages
- [x] Plugin has proper documentation

## Additional Notes

This plugin provides comprehensive workout tracking capabilities with beautiful visualizations. It supports multiple data formats and provides intelligent search capabilities for finding exercises even with variations in naming.
