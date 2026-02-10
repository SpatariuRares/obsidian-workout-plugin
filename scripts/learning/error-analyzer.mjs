/**
 * Error Analyzer - E Layer (Execution)
 *
 * Analyzes error patterns from error-log.json and suggests improvements.
 * Part of the DOE Framework learning system.
 *
 * Usage:
 *   npm run doe:analyze-errors
 *   node scripts/learning/error-analyzer.mjs
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERROR_LOG_PATH = path.join(__dirname, "error-log.json");
const ANALYSIS_OUTPUT_PATH = path.join(__dirname, "error-analysis.md");

/**
 * Read error log
 */
async function readErrorLog() {
  try {
    const content = await fs.readFile(ERROR_LOG_PATH, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("Error log not found. Run: node scripts/learning/error-logger.mjs init");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Analyze error patterns
 */
function analyzePatterns(errors) {
  const analysis = {
    totalErrors: errors.length,
    resolvedErrors: errors.filter((e) => e.resolved).length,
    unresolvedErrors: errors.filter((e) => !e.resolved).length,
    errorsByType: {},
    errorsByComponent: {},
    recentErrors: [],
    patterns: [],
    recommendations: [],
  };

  // Group by type
  errors.forEach((error) => {
    if (!analysis.errorsByType[error.type]) {
      analysis.errorsByType[error.type] = {
        count: 0,
        resolved: 0,
        examples: [],
      };
    }
    analysis.errorsByType[error.type].count++;
    if (error.resolved) {
      analysis.errorsByType[error.type].resolved++;
    }
    if (analysis.errorsByType[error.type].examples.length < 3) {
      analysis.errorsByType[error.type].examples.push({
        message: error.message,
        component: error.component,
        timestamp: error.timestamp,
      });
    }
  });

  // Group by component
  errors.forEach((error) => {
    if (!analysis.errorsByComponent[error.component]) {
      analysis.errorsByComponent[error.component] = {
        count: 0,
        resolved: 0,
        types: {},
      };
    }
    analysis.errorsByComponent[error.component].count++;
    if (error.resolved) {
      analysis.errorsByComponent[error.component].resolved++;
    }
    analysis.errorsByComponent[error.component].types[error.type] =
      (analysis.errorsByComponent[error.component].types[error.type] || 0) + 1;
  });

  // Recent unresolved errors (last 10)
  analysis.recentErrors = errors
    .filter((e) => !e.resolved)
    .slice(-10)
    .reverse()
    .map((e) => ({
      id: e.id,
      type: e.type,
      component: e.component,
      message: e.message,
      timestamp: e.timestamp,
    }));

  // Detect patterns
  analysis.patterns = detectPatterns(errors);

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

/**
 * Detect error patterns
 */
function detectPatterns(errors) {
  const patterns = [];

  // Pattern 1: Repeated errors in same component
  const componentCounts = {};
  errors.forEach((error) => {
    componentCounts[error.component] = (componentCounts[error.component] || 0) + 1;
  });

  Object.entries(componentCounts).forEach(([component, count]) => {
    if (count >= 5) {
      patterns.push({
        type: "repeated_component_error",
        component,
        count,
        severity: count >= 10 ? "high" : "medium",
        description: `${component} has ${count} errors - may need refactoring or better error handling`,
      });
    }
  });

  // Pattern 2: Same error message appearing multiple times
  const messageCounts = {};
  errors.forEach((error) => {
    const key = `${error.component}:${error.message}`;
    messageCounts[key] = (messageCounts[key] || 0) + 1;
  });

  Object.entries(messageCounts).forEach(([key, count]) => {
    if (count >= 3) {
      const [component, message] = key.split(":");
      patterns.push({
        type: "repeated_error_message",
        component,
        message,
        count,
        severity: count >= 5 ? "high" : "medium",
        description: `Same error occurred ${count} times - may indicate systemic issue`,
      });
    }
  });

  // Pattern 3: Error spikes (many errors in short time)
  const errorsByDay = {};
  errors.forEach((error) => {
    const day = error.timestamp.split("T")[0];
    errorsByDay[day] = (errorsByDay[day] || 0) + 1;
  });

  Object.entries(errorsByDay).forEach(([day, count]) => {
    if (count >= 10) {
      patterns.push({
        type: "error_spike",
        date: day,
        count,
        severity: "high",
        description: `${count} errors on ${day} - investigate what changed`,
      });
    }
  });

  // Pattern 4: Unresolved errors from more than 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const oldUnresolvedErrors = errors.filter((error) => {
    return !error.resolved && new Date(error.timestamp) < sevenDaysAgo;
  });

  if (oldUnresolvedErrors.length > 0) {
    patterns.push({
      type: "stale_unresolved_errors",
      count: oldUnresolvedErrors.length,
      severity: "medium",
      description: `${oldUnresolvedErrors.length} errors unresolved for more than 7 days`,
    });
  }

  return patterns;
}

/**
 * Generate recommendations
 */
function generateRecommendations(analysis) {
  const recommendations = [];

  // Recommendation based on error types
  Object.entries(analysis.errorsByType).forEach(([type, data]) => {
    if (data.count >= 5 && data.resolved / data.count < 0.5) {
      recommendations.push({
        priority: "high",
        category: "directive_update",
        title: `Update error handling directive for ${type}`,
        description: `${data.count} ${type} errors with low resolution rate (${Math.round(
          (data.resolved / data.count) * 100
        )}%). Consider updating directives/maintenance/error-handling.md with specific patterns for this error type.`,
        action: `Review errors of type '${type}' and add edge case to directive`,
      });
    }
  });

  // Recommendation based on component errors
  Object.entries(analysis.errorsByComponent).forEach(([component, data]) => {
    if (data.count >= 10) {
      recommendations.push({
        priority: "high",
        category: "refactoring",
        title: `Refactor ${component}`,
        description: `${component} has ${data.count} errors. High error count suggests this component needs refactoring or better error handling.`,
        action: `Review ${component} code and improve error handling`,
      });
    }
  });

  // Recommendation based on patterns
  analysis.patterns.forEach((pattern) => {
    if (pattern.severity === "high") {
      recommendations.push({
        priority: "high",
        category: "investigation",
        title: `Investigate ${pattern.type}`,
        description: pattern.description,
        action: `Review error log entries for this pattern and determine root cause`,
      });
    }
  });

  // General recommendations
  if (analysis.unresolvedErrors > analysis.resolvedErrors) {
    recommendations.push({
      priority: "medium",
      category: "process",
      title: "Improve error resolution process",
      description: `More unresolved errors (${analysis.unresolvedErrors}) than resolved (${analysis.resolvedErrors}). Errors should be investigated and marked resolved.`,
      action: "Review unresolved errors and mark as resolved once fixed",
    });
  }

  if (analysis.totalErrors > 100) {
    recommendations.push({
      priority: "low",
      category: "maintenance",
      title: "Prune old resolved errors",
      description: `Error log has ${analysis.totalErrors} entries. Consider pruning old resolved errors.`,
      action: "Run: npm run doe:prune-errors",
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(analysis) {
  const lines = [];

  lines.push("# Error Analysis Report");
  lines.push("");
  lines.push(`**Generated**: ${new Date().toISOString()}`);
  lines.push("");

  // Summary
  lines.push("## Summary");
  lines.push("");
  lines.push(`- **Total Errors**: ${analysis.totalErrors}`);
  lines.push(`- **Resolved**: ${analysis.resolvedErrors} (${Math.round((analysis.resolvedErrors / analysis.totalErrors) * 100)}%)`);
  lines.push(`- **Unresolved**: ${analysis.unresolvedErrors} (${Math.round((analysis.unresolvedErrors / analysis.totalErrors) * 100)}%)`);
  lines.push("");

  // Errors by Type
  lines.push("## Errors by Type");
  lines.push("");
  lines.push("| Type | Count | Resolved | Resolution Rate |");
  lines.push("|------|-------|----------|-----------------|");
  Object.entries(analysis.errorsByType)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([type, data]) => {
      const rate = Math.round((data.resolved / data.count) * 100);
      lines.push(`| ${type} | ${data.count} | ${data.resolved} | ${rate}% |`);
    });
  lines.push("");

  // Errors by Component
  lines.push("## Errors by Component");
  lines.push("");
  lines.push("| Component | Count | Resolved | Most Common Type |");
  lines.push("|-----------|-------|----------|------------------|");
  Object.entries(analysis.errorsByComponent)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([component, data]) => {
      const mostCommonType = Object.entries(data.types).sort((a, b) => b[1] - a[1])[0][0];
      lines.push(`| ${component} | ${data.count} | ${data.resolved} | ${mostCommonType} |`);
    });
  lines.push("");

  // Patterns
  if (analysis.patterns.length > 0) {
    lines.push("## Detected Patterns");
    lines.push("");
    analysis.patterns.forEach((pattern, i) => {
      lines.push(`### ${i + 1}. ${pattern.type} (${pattern.severity} severity)`);
      lines.push("");
      lines.push(pattern.description);
      lines.push("");
      if (pattern.component) {
        lines.push(`**Component**: ${pattern.component}`);
      }
      if (pattern.count) {
        lines.push(`**Occurrences**: ${pattern.count}`);
      }
      if (pattern.date) {
        lines.push(`**Date**: ${pattern.date}`);
      }
      lines.push("");
    });
  }

  // Recommendations
  if (analysis.recommendations.length > 0) {
    lines.push("## Recommendations");
    lines.push("");

    ["high", "medium", "low"].forEach((priority) => {
      const recs = analysis.recommendations.filter((r) => r.priority === priority);
      if (recs.length > 0) {
        lines.push(`### ${priority.toUpperCase()} Priority`);
        lines.push("");
        recs.forEach((rec, i) => {
          lines.push(`#### ${i + 1}. ${rec.title}`);
          lines.push("");
          lines.push(rec.description);
          lines.push("");
          lines.push(`**Action**: ${rec.action}`);
          lines.push("");
        });
      }
    });
  }

  // Recent Unresolved Errors
  if (analysis.recentErrors.length > 0) {
    lines.push("## Recent Unresolved Errors");
    lines.push("");
    lines.push("| ID | Type | Component | Message | Timestamp |");
    lines.push("|----|------|-----------|---------|-----------|");
    analysis.recentErrors.forEach((error) => {
      const shortId = error.id.split("-")[0];
      const shortMessage = error.message.substring(0, 50) + (error.message.length > 50 ? "..." : "");
      const timestamp = new Date(error.timestamp).toLocaleString();
      lines.push(`| ${shortId} | ${error.type} | ${error.component} | ${shortMessage} | ${timestamp} |`);
    });
    lines.push("");
  }

  // Next Steps
  lines.push("## Next Steps");
  lines.push("");
  lines.push("1. Review high priority recommendations above");
  lines.push("2. Investigate recent unresolved errors");
  lines.push("3. Update directives based on error patterns");
  lines.push("4. Mark errors as resolved once fixed");
  lines.push("5. Run analysis again after changes: `npm run doe:analyze-errors`");
  lines.push("");

  return lines.join("\n");
}

/**
 * Main execution
 */
async function main() {
  console.log("Analyzing error log...\n");

  const data = await readErrorLog();
  const errors = data.errors || [];

  if (errors.length === 0) {
    console.log("No errors found in error log.");
    return;
  }

  const analysis = analyzePatterns(errors);

  // Output to console
  console.log("=== ERROR ANALYSIS ===\n");
  console.log(`Total Errors: ${analysis.totalErrors}`);
  console.log(`Resolved: ${analysis.resolvedErrors}`);
  console.log(`Unresolved: ${analysis.unresolvedErrors}`);
  console.log("");

  if (analysis.patterns.length > 0) {
    console.log("Detected Patterns:");
    analysis.patterns.forEach((pattern) => {
      console.log(`  - [${pattern.severity.toUpperCase()}] ${pattern.description}`);
    });
    console.log("");
  }

  if (analysis.recommendations.length > 0) {
    console.log("Recommendations:");
    analysis.recommendations.slice(0, 5).forEach((rec) => {
      console.log(`  - [${rec.priority.toUpperCase()}] ${rec.title}`);
    });
    console.log("");
  }

  // Generate markdown report
  const markdown = generateMarkdownReport(analysis);
  await fs.writeFile(ANALYSIS_OUTPUT_PATH, markdown, "utf-8");

  console.log(`✓ Full analysis report written to: ${ANALYSIS_OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error("Error analyzing errors:", error);
  process.exit(1);
});
