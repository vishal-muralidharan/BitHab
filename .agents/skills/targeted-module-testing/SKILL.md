---
name: targeted-module-testing
description: >-
  Use this skill whenever any code change is made to a page, component, context, or stylesheet in BitHab.
  Ensures that static analysis with oxlint, production builds with vite build, and live browser tests
  are executed to guarantee zero regressions, zero unhandled exceptions, and clean bundle generation.
---

# Targeted Module Testing & Verification Workflows

This skill defines the testing, static analysis, build verification, and browser testing procedures for the **BitHab** repository.

---

## 1. Core Principles

1. **Verify on Every Change:** Even a single-line fix, minor refactor, or styling adjustment must be validated with static analysis (`oxlint`) and production build checks (`vite build`) before moving forward.
2. **Zero Errors Mandate:** Commits are only permitted when `npm run lint` reports **0 errors** and `npm run build` compiles completely.
3. **Live Browser Verification:** For user-facing features, route transitions, and interactive controls, use browser testing to verify DOM states, theme toggles, and console stability.
4. **Clean Workspace Policy:** Never commit ephemeral build artifacts in `dist/` or transient screenshots.

---

## 2. When to Use This Skill

Activate this skill:
* Immediately after making any modification to source code (in `src/pages/`, `src/components/`, `src/context/`, `src/assets/css/`, or `src/config/`).
* When introducing a new page, context provider, modal, or stylesheet.
* When updating Firestore payload schemas or data listeners.
* Before staging and committing any changes under the `atomic-commits` skill.

---

## 3. BitHab Verification Command Reference

Execute these commands in the terminal for rapid, reliable feedback:

| Verification Type | Command | Scope & Purpose |
| :--- | :--- | :--- |
| **Static Code Analysis** | `npm run lint` | Runs `oxlint` across all files to detect syntax errors, unused variables, React hook dependency bugs, and impure render functions. |
| **Production Build** | `npm run build` | Compiles client application using `vite build` to guarantee bundle integrity and import resolution. |
| **Local Dev Server** | `npm run dev` | Launches local Vite development server on `http://localhost:5173/`. |
| **Production Preview** | `npm run preview` | Previews the compiled `dist/` bundle locally to test production asset loading. |

---

## 4. Verification Workflow Steps

### Step 1: Execute Static Analysis (`oxlint`)
Run the linter to verify code health:
```bash
npm run lint
```
* **Success Criteria:** Must report `0 errors`.
* If warnings appear (e.g. unused variables, missing hook dependencies, or impure render calls like `Date.now()` inside component bodies):
  1. Remove unused imports or variables.
  2. Wrap event handlers in `useCallback` where appropriate.
  3. Re-run `npm run lint` until clean.

### Step 2: Execute Production Build (`vite build`)
Run the build command to ensure the bundling pipeline succeeds:
```bash
npm run build
```
* **Success Criteria:** Must complete cleanly (e.g. `✓ built in <X>ms`) and output bundles in `dist/`.
* If any import path is broken or any JSX element has invalid syntax, Vite will halt with a clear error trace. Resolve the issue immediately.

### Step 3: Interactive Browser Validation
For user-facing UI and interactive controls:
1. Ensure the dev server is active on `http://localhost:5173/`.
2. Inspect the modified page:
   - Verify layout and styling in both Light mode and Dark mode.
   - Verify theme toggle functionality in `Header.jsx`.
   - Verify responsive behavior on desktop and mobile viewports.
   - Check the browser console to confirm **0 unhandled runtime exceptions**.

---

## 5. Testing Quality Checklist

Before considering module verification complete:
```text
[ ] 1. npm run lint executed and passed with 0 errors.
[ ] 2. npm run build executed and compiled cleanly without bundling failures.
[ ] 3. No stray console.error statements or unhandled promise rejections in browser.
[ ] 4. Clean workspace state verified via git status.
[ ] 5. Ready for atomic commit via atomic-commits skill.
```
