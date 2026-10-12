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
