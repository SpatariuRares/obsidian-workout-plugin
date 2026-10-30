# Recipes (paste into `evaluate_script`)

All of them read or render into detached elements. `p` is `app.plugins.plugins["workout-planner"]`.

## Table for one exercise, detached

```js
async () => {
  const p = app.plugins.plugins["workout-planner"];
  const logs = await p.getWorkoutLogData();
  const el = document.createElement("div");
  document.body.appendChild(el);
  await p.embeddedTableView.createTable(el, logs.filter(l => l.exercise === "Squat"), { exercise: "Squat", limit: 6 });
  const out = {
    head: [...el.querySelectorAll("thead th")].map(th => th.innerText),
    spacer: el.querySelector(".workout-table-spacer-summary-cell")?.innerText.replace(/\s+/g, " "),
    firstRow: [...(el.querySelector("tbody tr.workout-same-day-log")?.querySelectorAll("td") ?? [])].map(td => td.innerText),
    mobileLabels: [...(el.querySelector("tbody tr.workout-same-day-log")?.querySelectorAll("td") ?? [])].map(td => td.dataset.label),
  };
  el.remove();
  return out;
}
```

## Chart, detached (trend header and data)

```js
async () => {
  const p = app.plugins.plugins["workout-planner"];
  const logs = await p.getWorkoutLogData();
  const el = document.createElement("div");
  el.style.width = "800px";
  document.body.appendChild(el);
  await p.embeddedChartView.createChart(el, logs, { exercise: "Squat", type: "weight", dateRange: 3650 });
  await new Promise(r => setTimeout(r, 300));
  const out = {
    header: el.querySelector(".workout-charts-trend-header")?.innerText.replace(/\s+/g, " "),
    arrow: el.querySelector(".workout-charts-trend-variation")?.className,
    rows: [...el.querySelectorAll("table tbody tr")].slice(0, 3).map(tr => tr.innerText.replace(/\s+/g, " ")),
  };
  el.remove();
  return out;
}
```

## Dashboard text, from the open note

```js
async () => {
  await app.workspace.getLeaf(false).openFile(app.vault.getAbstractFileByPath("The gym examples/Dashboard.md"));
  await new Promise(r => setTimeout(r, 3500));
  const leaf = document.querySelector(".workspace-leaf.mod-active");
  return leaf.querySelector(".workout-dashboard")?.innerText.replace(/\s+/g, " ");
}
```

## Expected values from the raw log (same definitions as CONTEXT.md)

```js
async () => {
  const logs = await app.plugins.plugins["workout-planner"].getWorkoutLogData();
  const day = d => new Date(d).toLocaleDateString("sv-SE"); // local training day
  const norm = s => (s ?? "").trim().replace(/^["']+|["']+$/g, "").trim().replace(/\s+/g, " ").toLowerCase();
  const sessions = new Map();
  for (const l of logs) {
    const k = day(l.date) + "|" + norm(l.workout);
    if (!sessions.has(k)) sessions.set(k, []);
    sessions.get(k).push(l);
  }
  return { sessions: sessions.size, volume: Math.round(logs.reduce((s, l) => s + (l.volume || 0), 0)) };
}
```

## Log form: validation without saving

```js
async () => {
  const p = app.plugins.plugins["workout-planner"];
  const before = (await p.getWorkoutLogData()).length;
  app.commands.executeCommandById("workout-planner:create-workout-log");
  await new Promise(r => setTimeout(r, 1500));
  const m = document.querySelector(".modal-container .modal");
  const ex = m.querySelector("input[type=text]");
  ex.value = "QA Incline Press";
  for (const e of ["input", "change", "blur"]) ex.dispatchEvent(new Event(e, { bubbles: true }));
  await new Promise(r => setTimeout(r, 1500));
  const field = label => [...m.querySelectorAll(".workout-field-with-adjust")]
    .find(f => f.querySelector(".workout-field-label")?.innerText.startsWith(label));
  field("Reps").querySelector("input").value = "8.5"; // must be refused
  document.querySelectorAll(".notice").forEach(n => n.remove());
  [...m.querySelectorAll("button")].find(b => b.innerText === "Create log").click();
  await new Promise(r => setTimeout(r, 1200));
  const notices = [...document.querySelectorAll(".notice")].map(n => n.innerText);
  m.closest(".modal-container").querySelector(".modal-close-button")?.click();
  await new Promise(r => setTimeout(r, 400));
  return { notices, rowsUnchanged: (await p.getWorkoutLogData()).length === before, closed: !document.querySelector(".modal-container") };
}
```

If the close button does not close it, dispatch `mousedown`, `mouseup` and `click` on `.modal-close-button` (or `.modal-bg`).

## "Go to exercise" without a page (opens the create form, close it)

```js
async () => {
  const p = app.plugins.plugins["workout-planner"];
  const el = document.createElement("div");
  document.body.appendChild(el);
  const fake = [{ date: new Date().toISOString(), exercise: "Nonexistent Lift", reps: 5, weight: 50, volume: 250, timestamp: Date.now() }];
  await p.embeddedTableView.createTable(el, fake, { exercise: "Nonexistent Lift" });
  el.querySelector(".workout-icon-dropdown-item[data-value=goto]")?.click();
  await new Promise(r => setTimeout(r, 800));
  el.remove();
  const m = document.querySelector(".modal-container .modal");
  return { title: m?.querySelector("h2")?.innerText, name: [...(m?.querySelectorAll("input") ?? [])].map(i => i.value).find(v => v) };
}
```

Then close the create form unsaved (close button, as in the log form recipe) and check that no `.modal-container` is left.

## Screenshots

For README images. The procedure renders a view with the parameters you choose into a throwaway box at the top of the open note, screenshots it, and frames it. It writes nothing to the vault.

1. **Viewport.** Desktop: `emulate` with `viewport: "1000x1600x2"` (use `1500x2400x1.5` plus the wide-sizer CSS below for the dashboard's multi-column grid). Phone: `viewport: "390x844x3,mobile,touch"`, then `app.emulateMobile(true)`.
2. **Reload gotcha.** `app.emulateMobile(true|false)` reloads the app: everything injected (helper, CSS, frozen date) is gone. Toggle it first, wait for `app.plugins.plugins["workout-planner"]`, then inject.
3. **Inject** the helper below. It finds the *visible* preview with `elementFromPoint` (the `.workspace-leaf.mod-active` selector often returns a hidden leaf with a 0×0 rect), hides Obsidian's chrome, and can freeze "today" so stale example data still shows a streak and a full week.
4. **Render and capture.** `await __view("log" | "chart" | "dashboard", params, waitMs)` returns the box rect in CSS pixels. Wait at least 4000 ms for charts: Chart.js animates, and an early capture shows the line flattened at the bottom. Save with `take_screenshot` `filePath` under `<repo>/.shots/` (gitignored; the MCP refuses paths outside the workspace, the scratchpad included). Crop with the rect × device pixel ratio.
5. **Frame** with `python3 scripts/frame-screenshot.py` (`phone`, `card` or `pair`; `--help`), output into `assets/`.
6. **Check** with `scripts/preview-readme.sh` (renders the README like GitHub) and `npm run lint` (fails on a missing or unused asset and on a broken `#anchor`).
7. **Clean up**: `__cleanup()`, `emulate` with no arguments, `app.emulateMobile(false)` if you turned it on, `rm -rf .shots`.

```js
async () => {
  const p = app.plugins.plugins["workout-planner"];
  const css = document.getElementById("shot-css") ?? document.head.appendChild(Object.assign(document.createElement("style"), { id: "shot-css" }));
  css.textContent = ".workspace-ribbon,.mod-left-split,.mod-right-split,.status-bar,.titlebar,.workspace-tab-header-container,.view-header,.mobile-navbar{display:none!important} ::-webkit-scrollbar{display:none!important}";
  // Dashboard grid on desktop: css.textContent += " .markdown-preview-sizer{max-width:none!important}";
  // Freeze "today" (example data is dated when it was generated). Remove the block if the data is fresh.
  if (!window.__RealDate) {
    const R = Date, FIX = new R(2026, 2, 28, 19, 0, 0).getTime();
    window.__RealDate = R;
    window.Date = class extends R { constructor(...a) { a.length ? super(...a) : super(FIX); } static now() { return FIX; } };
  }
  window.__view = async (kind, params, wait = 2500) => {
    document.querySelectorAll("#shot-box").forEach(e => e.remove());
    const sc = document.elementFromPoint(innerWidth / 2, innerHeight / 3).closest(".markdown-preview-view");
    sc.scrollTop = 0;
    const box = document.createElement("div");
    box.id = "shot-box";
    box.style.cssText = "position:relative;z-index:5;background:var(--background-primary);padding:20px 0";
    sc.querySelector(".markdown-preview-sizer").prepend(box);
    const el = box.createDiv({ cls: "block-language-workout-" + kind });
    const logs = await p.getWorkoutLogData();
    if (kind === "log") await p.embeddedTableView.createTable(el, logs, params);
    if (kind === "chart") await p.embeddedChartView.createChart(el, logs, params);
    if (kind === "dashboard") await p.embeddedDashboardView.createDashboard(el, logs, params);
    await new Promise(r => setTimeout(r, wait));
    sc.scrollTop = 0;
    const r = box.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, dpr: devicePixelRatio };
  };
  window.__cleanup = () => {
    document.querySelectorAll("#shot-box,#shot-css").forEach(e => e.remove());
    if (window.__RealDate) { window.Date = window.__RealDate; delete window.__RealDate; }
  };
  return !!p;
}
```

The open note must be in reading view (`openFile(file, { state: { mode: "preview" } })`). Inside the dashboard box, switch the heat map with its buttons (`[...box.querySelectorAll("button")].find(b => b.textContent.trim() === "Year").click()`). The log form is a real modal: open it with the table's **+** button, screenshot, and close it with **Cancel**.
