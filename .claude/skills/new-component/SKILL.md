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

**atom / molecule**: use the existing generator:

```bash
npm run doe:generate-component -- --name=<Name> --type=<atom|molecule>
```

It creates `app/components/<type>s/<Name>.ts`, `__tests__/<Name>.test.ts`, and appends the barrel export to `index.ts`. Then fix two things in its output:
- It renders a hardcoded placeholder (`element.textContent = "<Name> component"`). Replace it with real rendering, and send any user-facing text through `t()`.
- Its test uses `document.createElement("div")`. Switch to `createObsidianContainer()` from `@app/components/__tests__/obsidianDomMocks` and add `/** @jest-environment jsdom */` as the first line. `ActionButtonGroup.test.ts` shows the pattern.

**widget**: copy the shape of an existing widget (e.g. `app/features/dashboard/widgets/quick-stats/`):
- `app/features/dashboard/widgets/<kebab-name>/<Name>.ts`: renders inside `DashboardCard` from `app/features/dashboard/ui/`
- `.../<kebab-name>/business/`: pure calculations with no DOM, unit-tested
- Export it from `app/features/dashboard/widgets/index.ts`, then register it in `EmbeddedDashboardView.render()`

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
