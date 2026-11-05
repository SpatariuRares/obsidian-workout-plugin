---
name: new-component
description: Scaffold a new UI piece in this plugin: a shared atom/molecule component, a dashboard widget, or a feature-specific ui/ component. Use when adding any new reusable UI element or dashboard widget so it follows the atomic-design layout, i18n, styling and test conventions.
---

# New component

Argument: `<Name> [atom|molecule|widget|feature-ui:<feature>]`. If the kind is missing, decide using the rules in CLAUDE.md → "Component Architecture":
- **atom**: no dependency on other UI components
- **molecule**: composed of atoms, reusable across features
- **widget**: a dashboard card
- **feature-ui**: domain-specific UI that stays in `app/features/<feature>/ui/`

## 1. Scaffold

**atom / molecule**: copy the shape of an existing one, e.g. `app/components/atoms/CheckToggle.ts` and its test:
- `app/components/<type>s/<Name>.ts`: a class with `static create(parent, props)` that builds its DOM under `parent` and returns the element; export the props type next to it
- `app/components/<type>s/__tests__/<Name>.test.ts`: `/** @jest-environment jsdom */` as the first line, `createObsidianContainer()` from `@app/components/__tests__/obsidianDomMocks`
- Add `export { <Name>, type <Name>Props } from "@app/components/<type>s/<Name>";` to that folder's `index.ts`
- If it is a kit piece (DESIGN.md), document it there and in `.impeccable/design.json`

**widget**: follow CLAUDE.md → "Adding New Dashboard Widgets" and copy the shape of an existing widget (e.g. `app/features/dashboard/widgets/quick-stats/`):
- `app/features/dashboard/widgets/<kebab-name>/<Name>.ts`: draws inside a `WidgetContainer` (`app/features/dashboard/ui/`) and builds its content from the kit
- `.../<kebab-name>/business/`: pure calculations with no DOM, unit-tested
- Add its id to `DASHBOARD_WIDGET_IDS` (`dashboard/types.ts`) and an entry to `DASHBOARD_WIDGETS` (`widgets/dashboardWidgets.ts`); the view and the modals read that registry

**feature-ui**: create `app/features/<feature>/ui/<Name>.ts`. Do not add it to the shared barrels.

## 2. Conventions checklist

- [ ] Imports use `@app/*`, never relative `../`. Services and utils are imported directly, not through a barrel.
- [ ] DOM is built only with `createEl`/`createDiv`/`createSpan`. No `innerHTML`. Clear with `el.empty()`.
- [ ] Every user-facing string uses `t("key")` from `@app/i18n`. Add the key to `app/i18n/locales/en.json` **only**: CI translates the other locales on release.
- [ ] Sentence case in UI text.
- [ ] Buttons use the shared variant/size constants exported from `@app/components/atoms`, not string literals.
- [ ] CSS class prefix is `workout-`. Styles go in a partial under `app/styles/` (components → `app/styles/components/`, dashboard → `app/styles/dashboard/`) and are `@use`d from that folder's `index`. Use Obsidian CSS variables only, with no hardcoded colors.
- [ ] Event listeners are registered so they are cleaned up, and any Chart.js instance is destroyed on cleanup.

## 3. Verify

```bash
npm test -- <path to new test>
npm run typecheck
node build-css.mjs        # only if styles were added
npm run doe:validate      # import-convention check
```

All of them must pass before reporting done.
