---
name: audit-and-planning
description: >-
  Use this skill before starting any feature implementation, bug fix, or refactor in BitHab.
  Provides a systematic framework for conducting codebase search via repo-search, auditing existing
  architecture, Vanilla CSS design tokens, Firestore data models, and mobile responsiveness,
  diagnosing root causes, and formulating a clear, atomic, step-by-step implementation plan before touching code.
---

# Pre-Implementation Audit, Search & Structured Planning

This skill defines the mandatory pre-implementation workflow for the **BitHab** repository. Every development task—whether a bug fix, new feature, styling alignment, or architectural refactor—must begin with a comprehensive codebase audit, symbol search, root cause diagnosis, and a structured implementation plan before modifying code.

---

## 1. Core Philosophy: Measure Twice, Cut Once

> **The Golden Rule:** Never edit code based on assumptions. Always search, inspect, diagnose, and plan before touching a single line of application logic or styling.

Premature coding without prior audit frequently causes:
* Duplicate state logic when contexts in `src/context/` already manage the domain data.
* Regressions in Firestore data models (e.g. breaking legacy `goals` or `notes` saved by other versions).
* Theme regressions across the 6 themes (`oceanic-depths`, `evergreen-forest`, `cyberpunk-neon`, `monochrome-minimalist`, `sunrise-coral`, `cherry-blossom`) or dark/light modes.
* Broken responsive layouts on mobile devices when body classes or media queries are overlooked.
* Monolithic, tangled commits that violate atomic development standards.
* Platform inconsistencies or file corruption from using ad-hoc shell commands like `sed`.

> **Zero `sed` Mandate:** Never use `sed` commands for code edits, build variable replacements, or test hacks. All edits must use dedicated IDE editing tools (`replace_file_content` / `multi_replace_file_content`), environment variables must rely on native Vite (`import.meta.env`) or Node.js (`fs`), and builds must compile via `npm run build`.

---

## 2. The 4-Phase Pre-Implementation Cycle

Before writing or editing code for any prompt or task, execute these four phases in order:

```text
┌────────────────────────────────────────────────────────┐
│ Phase 1: Codebase Search & Discovery                   │
│ - Discover usages via repo-search skill                │
│ - Search exact symbols, class names, or data fields    │
│ - Check existing contexts in src/context/              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Root Cause & Architecture Audit               │
│ - For Bugs: Trace exact failure mechanism              │
│ - For Features: Map to context state and CSS classes   │
│ - Check Firestore payload safety and theme parity      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Formulate Atomic Step-by-Step Plan            │
│ - Break into single-function, testable atomic steps    │
│ - Map each step to: Target -> Verification -> Commit   │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Execute & Validate Increment by Increment     │
│ - Complete Step N, run npm run lint & npm run build    │
│ - Commit atomically, only then proceed to Step N+1     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Codebase Search & Discovery

Before planning any change, locate all relevant code, configurations, and usages across the workspace using the `repo-search` skill.

### 1. Symbol & Call Site Discovery
Use `grep_search` to find everywhere the target identifier appears:
* **Context or Hook:** Search for hook usages (`useActivities()`, `useGoals()`, `useSchedule()`) across `src/pages/`.
* **CSS Classes & Selectors:** Search `src/assets/css/` to find existing classes before creating new ones.
* **Firestore Fields:** Search for document property accesses (`activities`, `subActivities`, `focusSessions`, `schedules`, `logs`).

### 2. Search for Existing Context State First
Before creating local state or manual fetch logic in a page, check whether a context provider already handles it:
* `ActivityContext.jsx` (activities, subactivities)
* `GoalContext.jsx` (goals, subgoals, completion states)
* `ReminderContext.jsx` (reminders, dates, times)
* `NoteContext.jsx` (daily notes, general notes, favorites)
* `ListContext.jsx` (lists, list items, list types)
* `ScheduleContext.jsx` (schedules, logs, toggleActivityLog)
* `ThemeContext.jsx` (active theme, light/dark mode)

---

## 4. Phase 2: Root Cause Diagnosis & Quality Audit

### For Bug Fixes & Regressions:
1. **Trace the Exact Origin:** Identify the exact component, context, or stylesheet rule causing the discrepancy.
2. **Differentiate Symptom from Root Cause:**
   * *Example:* A missing visual style on `/themes` might not be a broken CSS class—it often means `themes-page` body class was missing from `document.body`.
3. **Verify Data State:** Inspect Firestore payload models to see if fields are missing, `undefined`, or structured differently than expected.
4. **Auth & Test User Reuse:** When auditing UI behavior in the browser, always reuse canonical test accounts (`test@bithab.com` / `Password123!`) documented in [targeted-module-testing](file:///Users/VM/Projects%20-%20Curr/BitHab/.agents/skills/targeted-module-testing/SKILL.md). Never create random throwaway user accounts.

### For New Features & UI Additions:
1. **Directory Placement (Rule 3):** Determine whether code belongs in `src/pages/`, `src/components/layout/`, `src/context/`, or `src/assets/css/`.
2. **Vanilla CSS Discipline (Rule 6):** Ensure all colors consume CSS custom properties (`var(--primary-color)`, `var(--bg-primary)`, `var(--surface-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`).
3. **Multi-Theme Parity:** Verify contrast and visibility across all 6 themes and dark/light modes.
4. **Mobile Ergonomics:** Ensure touch targets are at least 44x44px and bottom navigation is accessible.
5. **Dashboard Viewport & Modal Safety:** Ensure desktop home views lock height to `calc(100vh - 90px)` with `overflow: hidden` unless `.expanded-active` is engaged; ensure modals provide full responsive reflow (horizontal flex row on desktop vs vertical column on mobile `< 480px`).
6. **Data Filtering & Scoping:** When features require activity filtering (e.g. calendar dots), ensure parent activity and child subactivities are scoped with `visibleActivityIds`.

---

## 5. Phase 3: Formulating the Step-by-Step Implementation Plan

Once the audit is complete, synthesize findings into an explicit, modular implementation plan.

### Standard Implementation Plan Template:
```markdown
### Implementation Plan: <Feature Name or Bug Summary>

#### 1. Audit Summary & Findings
- **Context:** <Current state and how existing code behaves>
- **Root Cause / Key Gap:** <Verified root cause or architectural requirement>
- **Affected Files:** <List of components, contexts, and stylesheets affected>

#### 2. Phased Step-by-Step Execution Plan

* **Step 1: <Context / State Update>**
  - Target: `src/context/...`
  - Changes: <Exact modification or addition>
  - Verification: `npm run lint`
  - Commit: `<type>(<scope>): <present tense description>`

* **Step 2: <Page / Component Implementation>**
  - Target: `src/pages/...`
  - Changes: <Exact modification or addition>
  - Verification: `npm run build`
  - Commit: `<type>(<scope>): <present tense description>`

* **Step 3: <Full Verification & Build Check>**
  - Run static analysis: `npm run lint`
  - Run production build: `npm run build`
```

---

## 6. Pre-Implementation Checklist

Before editing any code, verify:
```text
[ ] 1. Searched the codebase for existing usages, props, and call sites using repo-search.
[ ] 2. Checked if state/CRUD operations already exist in a src/context/ provider.
[ ] 3. Verified Firestore data model compatibility and ensured payload sanitization (no undefined).
[ ] 4. Verified multi-theme compatibility across all 6 themes and dark/light modes.
[ ] 5. Verified mobile viewport boundaries, body classes, and bottom navigation clearance.
[ ] 6. Formulated an atomic, step-by-step plan with verification checks and commit messages.
[ ] 7. Reused canonical test user accounts (test@bithab.com) for any browser testing or session audits.
[ ] 8. Verified zero sed commands in the execution plan—all file modifications planned with dedicated editing tools.
[ ] 9. Verified desktop dashboard fixed viewport lock (calc(100vh - 90px)) and modal responsive stacking rules.
```
