# Workout Charts Plugin

A plugin for Obsidian that visualizes workout data with interactive charts and graphs. This plugin converts your workout log files into beautiful visualizations to track your fitness progress over time.

## Features

- **Interactive Charts**: View your workout data in various chart types (Volume, Weight, Reps) using Chart.js
- **Advanced Search**: Intelligent exercise matching with multiple search strategies
- **Data Parsing**: Automatically reads workout log files from your specified folder
- **Real-time Updates**: Refresh charts to see your latest workout data
- **Customizable Settings**: Configure chart types, date ranges, and display options
- **Log Creation**: Create new workout logs directly from the plugin
- **Trend Lines**: Visualize progress trends with automatic trend line calculation
- **Debug Mode**: Detailed logging for troubleshooting and optimization
- **Responsive Design**: Works on desktop and mobile devices

## How it Works

The plugin reads workout log files from your vault that follow this format:

```markdown
---
Rep: 10
Weight: 80
Volume: 800
---

Esercizio:: [[Squat]]
Origine:: [[Workout A]]
DataOra:: 2025-01-17T10:30:00
```

## Installation

1. Download the latest release
2. Extract the files to your `.obsidian/plugins/workout-charts/` folder
3. Enable the plugin in Obsidian settings
4. Configure the log folder path in plugin settings

## Usage

### Opening the Charts View

- Click the bar chart icon in the left ribbon
- Use the command palette: "Open Workout Charts"
- The charts view will open in a new pane

### Creating Workout Logs

- Use the command palette: "Create Workout Log"
- Fill in the exercise name, reps, and weight
- The plugin will create a new log file in your specified folder

### Customizing Charts

- **Chart Type**: Choose between Volume, Weight, or Reps
- **Date Range**: Set how many days of data to display
- **Exercise Filter**: Filter data by specific exercises with intelligent matching
- **Exact Match**: Enable strict matching for exercise names
- **Trend Lines**: Enable/disable trend line visualization
- **Debug Mode**: Enable detailed logging for troubleshooting

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

- **Log Folder Path**: Path to your workout log files
- **Default Exercise**: Default exercise to show in charts
- **Chart Type**: Default chart type (Volume/Weight/Reps)
- **Date Range**: Number of days to include in charts
- **Show Trend Line**: Enable trend line visualization
- **Chart Height**: Height of charts in pixels
- **Debug Mode**: Enable debug logging

## Data Format

Your workout log files should be in Markdown format with frontmatter containing:

- `Rep`: Number of repetitions
- `Weight`: Weight used (in kg)
- `Volume`: Calculated volume (Reps × Weight)
- `Esercizio`: Exercise name (can be a link)
- `Origine`: Workout source (can be a link)
- `DataOra`: Date and time in ISO format

## Development

This plugin is built with TypeScript and uses the Obsidian Plugin API.

## First time developing plugins?

Quick starting guide for new plugin devs:

- Check if [someone already developed a plugin for what you want](https://obsidian.md/plugins)! There might be an existing plugin similar enough that you can partner up with.
- Make a copy of this repo as a template with the "Use this template" button (login to GitHub if you don't see it).
- Clone your repo to a local development folder. For convenience, you can place this folder in your `.obsidian/plugins/your-plugin-name` folder.
- Install NodeJS, then run `npm i` in the command line under your repo folder.
- Run `npm run dev` to compile your plugin from `main.ts` to `main.js`.
- Make changes to `main.ts` (or create new `.ts` files). Those changes should be automatically compiled into `main.js`.
- Reload Obsidian to load the new version of your plugin.
- Enable plugin in settings window.
- For updates to the Obsidian API run `npm update` in the command line under your repo folder.

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Improve code quality with eslint (optional)

- [ESLint](https://eslint.org/) is a tool that analyzes your code to quickly find problems. You can run ESLint against your plugin to find common bugs and ways to improve your code.
- To use eslint with this project, make sure to install eslint from terminal:
  - `npm install -g eslint`
- To use eslint to analyze this project use this command:
  - `eslint main.ts`
  - eslint will then create a report with suggestions for code improvement by file and line number.
- If your source code is in a folder, such as `src`, you can use eslint with this command to analyze all files in that folder:
  - `eslint .\src\`

## Funding URL

You can include funding URLs where people who use your plugin can financially support it.

The simple way is to set the `fundingUrl` field to your link in your `manifest.json` file:

```json
{
  "fundingUrl": "https://buymeacoffee.com"
}
```

If you have multiple URLs, you can also do:

```json
{
  "fundingUrl": {
    "Buy Me a Coffee": "https://buymeacoffee.com",
    "GitHub Sponsor": "https://github.com/sponsors",
    "Patreon": "https://www.patreon.com/"
  }
}
```

## API Documentation

See https://github.com/obsidianmd/obsidian-api
