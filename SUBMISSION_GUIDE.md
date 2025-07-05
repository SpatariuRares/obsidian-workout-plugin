# Plugin Submission Guide

## Step-by-Step Instructions for Submitting to Obsidian Community Plugins

### 1. Prepare Your Repository

Before submitting, ensure your repository has:

- ✅ Proper README.md with installation and usage instructions
- ✅ LICENSE file (MIT License)
- ✅ manifest.json with correct plugin information
- ✅ package.json with proper metadata
- ✅ Screenshots of your plugin in action
- ✅ Proper versioning (1.0.0)

### 2. Fork the Obsidian Releases Repository

1. Go to https://github.com/obsidianmd/obsidian-releases
2. Click "Fork" to create your own copy
3. Clone your forked repository locally

### 3. Add Your Plugin

1. In your forked repository, navigate to the `community-plugins.json` file
2. Add your plugin entry following this format:

```json
{
  "id": "workout-planner",
  "name": "Workout Planner",
  "author": "Rares Spatariu",
  "description": "A comprehensive plugin for Obsidian that visualizes workout data with interactive charts, tables, and timers.",
  "repo": "SpatariuRares/obsidian-workout-plugin",
  "branch": "main"
}
```

### 4. Create a Pull Request

1. Commit your changes to your forked repository
2. Go to your forked repository on GitHub
3. Click "Compare & pull request"
4. Use the template from `PULL_REQUEST_TEMPLATE.md` in this repository

### 5. Required Information for PR

When creating the pull request, include:

- **Plugin Name**: Workout Planner
- **Plugin ID**: workout-planner
- **Plugin Description**: [Use the description from your README]
- **Plugin Author**: Rares Spatariu
- **Plugin Repository**: https://github.com/SpatariuRares/obsidian-workout-plugin
- **Plugin License**: MIT
- **Plugin Version**: 1.0.0
- **Minimum Obsidian Version**: 0.15.0
- **Desktop Only**: No
- **Features**: [List all features from your README]
- **Installation Instructions**: [From your README]
- **Usage Instructions**: [From your README]
- **Screenshots**: [Add screenshots of your plugin in action]

### 6. Screenshots

You need to add screenshots showing:

- Plugin settings page
- Chart visualization
- Table view
- Timer functionality
- Code block examples

### 7. Testing Checklist

Before submitting, ensure:

- [x] Plugin works on desktop
- [x] Plugin works on mobile
- [x] Plugin follows Obsidian's design guidelines
- [x] Plugin doesn't interfere with other plugins
- [x] Plugin handles errors gracefully
- [x] Plugin has proper error messages
- [x] Plugin has proper documentation

### 8. Common Issues to Avoid

- ❌ Don't use the same plugin ID as an existing plugin
- ❌ Don't submit without proper documentation
- ❌ Don't submit without screenshots
- ❌ Don't submit without testing on both desktop and mobile
- ❌ Don't submit without proper error handling

### 9. After Submission

1. Wait for review from Obsidian team
2. Respond to any feedback or requests for changes
3. Make necessary updates if requested
4. Once approved, your plugin will be available in the community plugins list

### 10. Repository Structure

Your repository should have this structure:

```
obsidian-workout-plugin/
├── README.md
├── LICENSE
├── manifest.json
├── package.json
├── main.ts
├── styles.css
├── app/
├── PULL_REQUEST_TEMPLATE.md
└── SUBMISSION_GUIDE.md
```

### 11. Version Management

- Use semantic versioning (1.0.0, 1.0.1, etc.)
- Update both `manifest.json` and `package.json` when releasing new versions
- Create GitHub releases for each version
- Tag releases with version numbers

### 12. Maintenance

After your plugin is accepted:

- Monitor issues and pull requests
- Respond to user feedback
- Keep the plugin updated with Obsidian releases
- Maintain compatibility with new Obsidian versions
