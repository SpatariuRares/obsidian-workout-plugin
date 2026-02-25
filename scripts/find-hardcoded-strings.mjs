#!/usr/bin/env node

/**
 * find-hardcoded-strings.mjs
 *
 * Finds hardcoded user-facing strings in UI code that should use t().
 * Smarter than the ESLint i18next/no-literal-string rule — uses both
 * string-level and line-context heuristics to filter false positives.
 *
 * Usage:
 *   node scripts/find-hardcoded-strings.mjs              # text report
 *   node scripts/find-hardcoded-strings.mjs --json       # JSON output
 *   node scripts/find-hardcoded-strings.mjs --verbose    # show filtered items too
 *   node scripts/find-hardcoded-strings.mjs --fix-hints  # show t() key suggestions
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────────────────

const SCAN_DIRS = ["app/features", "app/components"];
const EXTENSIONS = [".ts", ".tsx"];

const SKIP_PATTERNS = [
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /\.d\.ts$/,
  /index\.ts$/,
  /types\.ts$/,
  /SVGBuilder\.ts$/,       // SVG path data, no user-facing strings
  /BodyViewSvg\.ts$/,      // SVG body template markup
];

// ── Line-level filters (skip entire line) ───────────────────────────────────
// Lines matching these patterns are never scanned for strings.

const SKIP_LINE_PATTERNS = [
  /^\s*(\/\/|\/\*|\*)/,               // comments
  /^\s*import\s/,                      // import statements
  /^\s*export\s+(type|interface)\s/,   // type exports
  /^\s*\*\s/,                          // jsdoc continuation
  /\bt\(\s*["'`]/,                     // lines already using t()
  /console\.(log|warn|error|info|debug)\s*\(/, // console calls
  /PerformanceMonitor\./,             // perf instrumentation
  /throw\s+new\s/,                     // throw statements (developer errors)
  /catch\s*\(/,                        // catch blocks
  /\.log\s*\(/,                        // logger calls
  /typeof\s+\w+\s*[!=]==?\s*/,        // typeof comparisons
  /\w+\s+instanceof\s+/,              // instanceof checks
];

// ── Call-site filters ───────────────────────────────────────────────────────
// If the string is an argument to one of these call patterns, skip it.
// We check the text preceding the string on the same line.

const CALL_SITE_EXCLUDE = [
  /createEl\s*\(\s*$/,                // createEl("div") — the tag argument
  /createDiv\s*\(\s*$/,
  /createSpan\s*\(\s*$/,
  /addClass\s*\(\s*$/,
  /removeClass\s*\(\s*$/,
  /toggleClass\s*\(\s*$/,
  /hasClass\s*\(\s*$/,
  /classList\.(add|remove|toggle|contains)\s*\(\s*$/,
  /querySelector(All)?\s*\(\s*$/,
  /getElementById\s*\(\s*$/,
  /setIcon\s*\(\s*$/,
  /addEventListener\s*\(\s*$/,
  /removeEventListener\s*\(\s*$/,
  /on\s*\(\s*$/,
  /trigger\s*\(\s*$/,
  /\.register(Event|Interval|DomEvent)?\s*\(\s*$/,
  /setAttribute\s*\(\s*$/,
  /getAttribute\s*\(\s*$/,
  /\.style\.\w+\s*=\s*$/,
  /\.includes\s*\(\s*$/,
  /\.indexOf\s*\(\s*$/,
  /\.startsWith\s*\(\s*$/,
  /\.endsWith\s*\(\s*$/,
  /\.split\s*\(\s*$/,
  /\.replace\s*\(\s*$/,
  /\.match\s*\(\s*$/,
  /\.join\s*\(\s*$/,
  /normalizePath\s*\(\s*$/,
  /getAbstractFileByPath\s*\(\s*$/,
  /getFileByPath\s*\(\s*$/,
  /getFolderByPath\s*\(\s*$/,
  /new Error\s*\(\s*$/,
  /new TypeError\s*\(\s*$/,
  /new RangeError\s*\(\s*$/,
  /\.setCssProps\s*\(\s*$/,
  /\.getPropertyValue\s*\(\s*$/,
  /registerMarkdownCodeBlockProcessor\s*\(\s*$/,
  /new Event\s*\(\s*$/,
  /\.dispatchEvent\s*\(\s*$/,
  /PerformanceMonitor\.\w+\s*\(\s*$/,
];

// ── String-value filters ────────────────────────────────────────────────────
// Strings matching these are always technical, never user-facing.

const STRING_FILTERS = [
  // Import paths / module specifiers
  (s) => /^@app\//.test(s) || /^\.\.?\//.test(s),

  // CSS selectors (start with . or #)
  (s) => /^[.#][\w-]/.test(s),

  // CSS variable references
  (s) => /^var\(--/.test(s) || /^--[\w-]/.test(s),

  // CSS colors
  (s) =>
    /^(white|black|red|green|blue|yellow|orange|purple|gray|grey|transparent|inherit|currentColor|none|unset|initial)$/i.test(s) ||
    /^#[0-9a-fA-F]{3,8}$/.test(s) ||
    /^rgba?\(/.test(s) ||
    /^hsla?\(/.test(s),

  // CSS layout/position/display single-word values
  (s) =>
    /^(top|bottom|left|right|center|middle|start|end|flex|grid|block|inline|none|auto|hidden|visible|absolute|relative|fixed|sticky|row|column|wrap|nowrap|stretch|baseline|space-between|space-around|space-evenly|vertical|horizontal)$/.test(s),

  // CSS units
  (s) => /^\d+(\.\d+)?(px|em|rem|%|vh|vw|pt|ch)$/.test(s),

  // Pure numbers, punctuation, symbols, single chars, empty strings
  (s) =>
    s.length <= 2 ||
    /^[0-9.,\-+*/=<>!?@#$%^&()[\]{};:'"\\|`~\s]+$/.test(s) ||
    /^[A-Z][A-Z0-9_]+$/.test(s),

  // File extensions and file paths
  (s) =>
    /^\.[a-z]{1,5}$/.test(s) ||
    /\.(csv|json|md|txt|yaml|yml|xml|html|css|js|ts|tsx|py|sh|canvas|png|jpg|svg|mp3|wav|ogg)$/i.test(s),

  // HTML element tags (single word)
  (s) =>
    /^(div|span|p|a|h[1-6]|ul|ol|li|table|thead|tbody|tfoot|tr|td|th|input|button|select|option|textarea|label|form|img|canvas|svg|path|circle|rect|line|text|g|defs|strong|em|b|i|small|br|hr|pre|code|section|article|header|footer|main|nav|aside|details|summary|figure|figcaption)$/.test(s),

  // HTML/DOM attribute names and values
  (s) =>
    /^(type|class|id|name|value|href|src|alt|title|role|scope|for|action|method|target|rel|disabled|readonly|checked|selected|required|placeholder|maxlength|minlength|pattern|autocomplete|autofocus|tabindex|colspan|rowspan|aria-\w+|data-\w+|accept|multiple|min|max|step|width|height|style|download|loading|crossorigin|integrity|referrerpolicy)$/.test(s),

  // DOM event names
  (s) =>
    /^(click|change|input|submit|focus|blur|keydown|keyup|keypress|mousedown|mouseup|mousemove|mouseenter|mouseleave|touchstart|touchend|scroll|resize|load|error|abort|pointerdown|pointerup|contextmenu|wheel|dragstart|dragend|drag|drop|dragover|dragenter|dragleave|paste|copy|cut)$/.test(s),

  // Keyboard key names
  (s) =>
    /^(Enter|Escape|Tab|Backspace|Delete|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|PageUp|PageDown|Space|Shift|Control|Alt|Meta|CapsLock|F[1-9]|F1[0-2])$/.test(s),

  // JavaScript typeof values
  (s) => /^(string|number|boolean|undefined|object|function|symbol|bigint)$/.test(s),

  // String boolean/null/undefined values
  (s) => /^(true|false|null|undefined|NaN|Infinity)$/.test(s),

  // UI component variant/size props (used as enum values, not displayed)
  (s) =>
    /^(primary|secondary|tertiary|ghost|outline|link|destructive|big|giant|small|medium|large|xs|sm|md|lg|xl|xxl|compact|full|mini|tiny)$/.test(s),

  // CSS font/style values
  (s) =>
    /^(bold|italic|normal|underline|uppercase|lowercase|capitalize|nowrap|pre|pre-wrap|pre-line|serif|sans-serif|monospace|cursive|fantasy)$/.test(s),

  // Scroll / intersection / animation behavior values
  (s) =>
    /^(smooth|instant|nearest|contain|cover|fill|scale-down|ease|ease-in|ease-out|ease-in-out|linear)$/.test(s),

  // Web Audio API values
  (s) => /^(sine|square|sawtooth|triangle|lowpass|highpass|bandpass)$/.test(s),

  // Multi-word CSS class strings (space-separated, all tokens are kebab-case or known classes)
  (s) => {
    if (!/\s/.test(s)) return false;
    const tokens = s.trim().split(/\s+/);
    return tokens.every((t) => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(t));
  },

  // Technical single-word identifiers: camelCase config/data property names
  (s) =>
    /^[a-z][a-zA-Z0-9]*$/.test(s) &&
    s.length < 25 &&
    /^(volume|weight|reps|duration|distance|pace|heartRate|heartrate|heart_rate|calories|strength|cardio|flexibility|custom|exercise|workout|date|timestamp|notes|protocol|origine|actions|asc|desc|normal|warning|danger|success|info|error|complete|high|low|pending|active|default|both|merge|single|compact|manual|auto|replace|container|icon|dropdown|tag|group|showAddButton|searchByName|exactMatch|showControls|dateRange|targetWeight|targetReps|targetDistance|targetDuration|targetPace|targetHeartRate|musclegroup|muscle_group|sound|showTimer|timerSound|showLog|currentWorkout|sortBy|sortOrder|number|string)$/.test(s),

  // kebab-case identifiers (CSS classes or config keys)
  (s) => /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(s),

  // Obsidian CSS scope classes
  (s) => /^(is-|has-|mod-|nav-|view-|workspace-|cm-|markdown-|setting-|clickable|tree-item)/.test(s),

  // Performance monitor keys (category:action)
  (s) => /^[a-z]+:[a-zA-Z]+$/.test(s),

  // Data type/protocol identifiers with underscores
  (s) =>
    /^(drop_set|super_set|superset|pyramid|rest_pause|giant_set|cluster|myo_reps|myoreps|emom|amrap|tabata)$/.test(s),

  // YAML/config syntax fragments (backslash-n, colons, brackets)
  (s) => /^\\n/.test(s) || /^(tags|parameters|type|name|id):\s/.test(s),

  // Strings that are entirely template expressions with no English words
  (s) => {
    if (!/\$\{/.test(s)) return false;
    const textOnly = s.replace(/\$\{[^}]*\}/g, "").trim();
    return !/[a-zA-Z]{3,}/.test(textOnly);
  },

  // SVG/Canvas API values
  (s) =>
    /^(round|butt|square|miter|bevel|evenodd|nonzero|fill|stroke|ellipse|circle|rect|line|path|polygon|polyline|radialGradient|linearGradient|stop|clipPath|mask|marker|pattern|defs|use|symbol|image|foreignObject|animate|animateTransform|set|desc|metadata|title|switch|a|tspan|textPath)$/.test(s),

  // SVG namespace URLs
  (s) => /^https?:\/\/www\.w3\.org\//.test(s),

  // Chart.js chart type / config values
  (s) => /^(pie|doughnut|bar|line|radar|polarArea|scatter|bubble|horizontal)$/.test(s),

  // Canvas 2D context values
  (s) => /^(pointer|crosshair|move|grab|grabbing|text|wait|not-allowed|no-drop|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize)$/.test(s),

  // Muscle group / body part identifiers (used as data keys, not displayed)
  (s) =>
    /^(chest|back|shoulders|biceps|triceps|forearms|abs|core|quads|hamstrings|glutes|calves|traps|lats|rear_delts|front_delts|side_delts|obliques|lower_back|hip_flexors|adductors|abductors|neck|pectorals|rhomboids|rotator_cuff|serratus)$/.test(s),

  // Date format patterns
  (s) => /^[DMYHhms/\-:.\s]+$/.test(s),

  // Time period identifiers
  (s) => /^(week|month|year|day|hour|minute|second|quarter|semester)$/.test(s),

  // Search / algorithm mode identifiers
  (s) => /^(semantic|fuzzy|exact|partial|prefix|suffix|contains|regex)$/.test(s),

  // Canvas export / layout identifiers
  (s) => /^(file|arrow|warmup|cooldown|stretching|routine|introduction|overview|instructions|grouped|stable|sequential|parallel)$/.test(s),

  // Unit abbreviations (3 chars or less, no spaces)
  (s) => /^(sec|min|hrs|bpm|rpm|cal|lbs|kgs?|reps?|sets?|km|mi)$/.test(s),

  // Pluralization pairs (entry/entries pattern)
  (s) => /^(entry|entries|item|items|set|sets|rep|reps|round|rounds)$/.test(s),

  // Common developer-facing error prefix patterns
  (s, ctx) => /^\w+ is required for \w+$/.test(s),

  // Obsidian wikilink syntax
  (s) => /^\[\[/.test(s),

  // Input type values
  (s) => /^(checkbox|radio|text|password|email|tel|url|search|date|time|datetime-local|month|week|number|range|color|file|hidden|image|reset|submit)$/.test(s),

  // SVG path data (long strings with path commands)
  (s) => s.length > 50 && /^[Mm]\d/.test(s),

  // Inline CSS style fragments (property: value)
  (s) => /^(color|fill|stroke|opacity|background|font|display|visibility|transform|transition|animation|cursor|overflow|z-index|position|margin|padding|border|outline|box-shadow|text-align|text-decoration|vertical-align|line-height|letter-spacing|word-spacing|white-space|word-break|word-wrap|text-overflow|text-transform|text-indent|text-shadow|list-style|content|float|clear|direction|unicode-bidi|writing-mode)\s*:/.test(s),

  // SVG body-part identifiers (used as group IDs or class names in SVG templates)
  (s) =>
    /^(hands|feet|body|lowerback|gastrocnemius|soleus|infraspinatus|supraspinatus|teres|rhomboid|trapezius|deltoid|pectoralis|latissimus|serratus|rectus|oblique|erector|gluteus|quadricep|hamstring|tibialis|fibularis|iliopsoas|adductor|sartorius|gracilis|tensor|piriformis)$/.test(s),

  // Font family strings
  (s) => /^['"]?[\w\s-]+['"]?,\s*(-apple-system|sans-serif|serif|monospace|system-ui)/.test(s),

  // Trend direction / comparison result identifiers
  (s) => /^(up|down|neutral|stable|improving|declining|flat|positive|negative)$/.test(s),

  // Chart/data index mode identifiers
  (s) => /^(index|dataset|point|nearest|average|single|label|x|y|xy)$/.test(s),

  // Generic short technical identifiers not yet covered (3-5 chars, all lowercase, no spaces)
  (s) =>
    /^[a-z]{3,5}$/.test(s) &&
    /^(other|timed|mixed|pause|start|reset|total|count|empty|blank|draft|final|ready|valid|dirty|clean|fresh|stale|async|await|super|class|const|yield|debug|trace|batch|queue|stack|fetch|parse|build|model|index|cache|local|state|props|event|store|slots|hooks|mount|apply|merge|clone|patch|flush|setup|watch|proxy)$/.test(s),
];

// ── User-facing context patterns ────────────────────────────────────────────
// If the string appears on a line matching these, it IS user-facing and must
// pass through even if a string filter would exclude it.

const USER_FACING_CONTEXT = [
  /\.setText\s*\(/,
  /\.textContent\s*=/,
  /\.innerText\s*=/,
  /\.setName\s*\(/,
  /\.setDesc\s*\(/,
  /\.setTooltip\s*\(/,
  /setPlaceholder\s*\(/,
  /new Notice\s*\(/,
];

// More specific: "text:" property inside createEl options — but we need to
// distinguish between createEl("div", { cls: ... }) and { text: "..." }
const TEXT_PROP_RE = /\btext:\s*$/;

// ── Scanning ────────────────────────────────────────────────────────────────

function isCallSiteExcluded(line, matchIndex) {
  const before = line.substring(0, matchIndex).trimEnd();
  return CALL_SITE_EXCLUDE.some((re) => re.test(before));
}

function isInTextProperty(line, matchIndex) {
  const before = line.substring(0, matchIndex).trimEnd();
  return TEXT_PROP_RE.test(before);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const results = [];
  const skipped = [];

  const hasI18nImport =
    /import\s+\{[^}]*\bt\b[^}]*\}\s+from\s+["']@app\/i18n["']/.test(content);

  // Track block comments
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Block comment tracking
    if (inBlockComment) {
      if (/\*\//.test(line)) inBlockComment = false;
      continue;
    }
    if (/\/\*/.test(line) && !/\*\//.test(line)) {
      inBlockComment = true;
      continue;
    }

    // Skip entire line
    if (SKIP_LINE_PATTERNS.some((re) => re.test(line))) continue;

    // Is this line in a user-facing context?
    const lineIsUserFacing = USER_FACING_CONTEXT.some((re) => re.test(line));

    // Find quoted strings
    const stringRegex = /(["'])(?:(?!\1|\\).|\\.)*\1/g;
    let match;

    while ((match = stringRegex.exec(line)) !== null) {
      const raw = match[0];
      const s = raw.slice(1, -1);

      if (s.trim().length < 2) continue;
      if (!/[a-zA-Z]{2,}/.test(s)) continue;

      // Determine if this specific occurrence is user-facing
      const inTextProp = isInTextProperty(line, match.index);
      const isUserFacing = lineIsUserFacing || inTextProp;

      // If it's in an excluded call-site and NOT in a text: property, skip
      if (!isUserFacing && isCallSiteExcluded(line, match.index)) {
        skipped.push({ file: filePath, line: lineNum, string: s, filter: "call-site" });
        continue;
      }

      // Apply string-value filters (only if not user-facing)
      if (!isUserFacing) {
        let filtered = false;
        for (const fn of STRING_FILTERS) {
          if (fn(s)) {
            filtered = true;
            break;
          }
        }
        if (filtered) {
          skipped.push({ file: filePath, line: lineNum, string: s, filter: "string-value" });
          continue;
        }
      }

      results.push({
        file: filePath,
        line: lineNum,
        col: match.index + 1,
        string: s,
        context: line.trim(),
        hasI18nImport,
        isUserFacing,
      });
    }

    // Template literals
    const tmplRegex = /`((?:[^`\\]|\\.)*)` /g;
    let tmpl;

    while ((tmpl = tmplRegex.exec(line)) !== null) {
      const s = tmpl[1];
      const textOnly = s.replace(/\$\{[^}]*\}/g, "").trim();
      if (!/[a-zA-Z]{3,}/.test(textOnly)) continue;

      // Skip if preceded by t(
      const before = line.substring(0, tmpl.index);
      if (/\bt\(\s*$/.test(before)) continue;

      const inTextProp = isInTextProperty(line, tmpl.index);
      const isUserFacing = lineIsUserFacing || inTextProp;

      if (!isUserFacing && isCallSiteExcluded(line, tmpl.index)) {
        skipped.push({ file: filePath, line: lineNum, string: s, filter: "call-site" });
        continue;
      }

      if (!isUserFacing) {
        let filtered = false;
        for (const fn of STRING_FILTERS) {
          if (fn(s)) { filtered = true; break; }
        }
        if (filtered) {
          skipped.push({ file: filePath, line: lineNum, string: s, filter: "string-value" });
          continue;
        }
      }

      results.push({
        file: filePath,
        line: lineNum,
        col: tmpl.index + 1,
        string: s,
        context: line.trim(),
        hasI18nImport,
        isUserFacing,
        isTemplate: true,
      });
    }
  }

  return { results, skipped };
}

function collectFiles(dirs) {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
        !SKIP_PATTERNS.some((re) => re.test(full))
      ) {
        files.push(full);
      }
    }
  }

  for (const d of dirs) walk(path.resolve(ROOT, d));
  return files;
}

// ── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const verbose = args.includes("--verbose");
const fixHints = args.includes("--fix-hints");

const files = collectFiles(SCAN_DIRS);
let allResults = [];
let allSkipped = [];

for (const file of files) {
  const { results, skipped } = scanFile(file);
  allResults.push(...results);
  allSkipped.push(...skipped);
}

// ── Output ──────────────────────────────────────────────────────────────────

if (jsonOutput) {
  console.log(JSON.stringify({
    summary: {
      filesScanned: files.length,
      hardcodedStrings: allResults.length,
      filteredFalsePositives: allSkipped.length,
    },
    results: allResults.map((r) => ({
      file: path.relative(ROOT, r.file),
      line: r.line,
      col: r.col,
      string: r.string,
      isUserFacing: r.isUserFacing,
      isTemplate: r.isTemplate || false,
    })),
  }, null, 2));
  process.exit(allResults.some((r) => r.isUserFacing) ? 1 : 0);
}

// Text output
const byFile = {};
for (const r of allResults) {
  const rel = path.relative(ROOT, r.file);
  if (!byFile[rel]) byFile[rel] = [];
  byFile[rel].push(r);
}

const confirmed = allResults.filter((r) => r.isUserFacing);
const likely = allResults.filter((r) => !r.isUserFacing);

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║           Hardcoded String Finder (i18n)                ║");
console.log("╚══════════════════════════════════════════════════════════╝\n");
console.log(`  Files scanned:            ${files.length}`);
console.log(`  False positives filtered: ${allSkipped.length}`);
console.log(`  Confirmed user-facing:    ${confirmed.length}`);
console.log(`  Likely hardcoded:         ${likely.length}`);
console.log(`  Total to review:          ${allResults.length}`);
console.log("");

if (allResults.length === 0) {
  console.log("  All clean! No hardcoded user-facing strings found.\n");
  process.exit(0);
}

if (confirmed.length > 0) {
  console.log(`  CONFIRMED user-facing (setText/textContent/Notice/text:/etc.): ${confirmed.length}`);
  console.log("  " + "─".repeat(60));

  for (const r of confirmed) {
    const rel = path.relative(ROOT, r.file);
    console.log(`\n  ${rel}:${r.line}:${r.col}`);
    console.log(`    ${JSON.stringify(r.string)}`);
    console.log(`    ${r.context}`);
    if (fixHints) {
      console.log(`    -> t("${suggestI18nKey(r.string, rel)}")`);
    }
  }
  console.log("");
}

if (likely.length > 0) {
  console.log(`  LIKELY hardcoded (review manually): ${likely.length}`);
  console.log("  " + "─".repeat(60));

  for (const fileName of Object.keys(byFile).sort()) {
    const items = byFile[fileName].filter((r) => !r.isUserFacing);
    if (items.length === 0) continue;

    console.log(`\n  ${fileName} (${items.length})`);
    for (const r of items) {
      console.log(`    L${r.line}  ${JSON.stringify(r.string)}`);
      if (fixHints) {
        console.log(`         -> t("${suggestI18nKey(r.string, fileName)}")`);
      }
    }
  }
  console.log("");
}

if (verbose && allSkipped.length > 0) {
  const byFilter = {};
  for (const s of allSkipped) {
    if (!byFilter[s.filter]) byFilter[s.filter] = [];
    byFilter[s.filter].push(s);
  }

  console.log(`  Filtered items: ${allSkipped.length}`);
  console.log("  " + "─".repeat(60));
  for (const [name, items] of Object.entries(byFilter)) {
    console.log(`\n  [${name}] ${items.length}`);
    for (const item of items.slice(0, 5)) {
      console.log(`    ${path.relative(ROOT, item.file)}:${item.line}  ${JSON.stringify(item.string)}`);
    }
    if (items.length > 5) console.log(`    ... +${items.length - 5} more`);
  }
  console.log("");
}

process.exit(confirmed.length > 0 ? 1 : 0);

// ── Helpers ─────────────────────────────────────────────────────────────────

function suggestI18nKey(str, filePath) {
  const feature = filePath.match(/features\/([^/]+)/)?.[1] || "common";
  const cleaned = str
    .replace(/\$\{[^}]+\}/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .map((w, i) =>
      i === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join("");

  return `${feature}.${cleaned || "label"}`;
}
