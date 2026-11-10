---
name: repo-search
description: >-
  Use this skill to perform read-only discovery and auditing of any feature, component, context, utility,
  or symbol across the entire BitHab repository (including src/pages/, src/components/, src/context/,
  src/assets/css/, src/config/, and .agents/skills/). Reports whether the component is present,
  its exact declaration and usage sites, architectural tier, and presents findings without making any code edits.
---

# Repository Search & Component Discovery

This skill provides a systematic, **read-only** search and audit procedure across the entire **BitHab** codebase. Given any feature name, React component, context provider, Firestore field, CSS class, or styling token, this skill determines whether it exists in the repository, scans declaration and usage sites across all architectural layers, assesses theme and layout compliance, and presents structured findings.

---

## 1. Core Directive: Search Only (No Edits or Additions)

> **Mandatory Rule:** This skill is strictly **READ-ONLY**.
> - **Do NOT make any code edits, additions, deletions, or refactors.**
> - **Do NOT create new application files, tests, or stylesheets.**
> - Execute a comprehensive search and report verified findings in chat or in a Markdown document.

---

## 2. Universal Search Scope Matrix

When given a component, symbol, or feature query, search across all five architectural surfaces in BitHab:

| Surface / Layer | Search Locations | Target Entity Types |
| :--- | :--- | :--- |
| **1. Route Page Views** | `src/pages/` | Top-level route pages (`Dashboard.jsx`, `Activities.jsx`, `Goals.jsx`, `Focus.jsx`, `DeepFocus.jsx`, etc.) |
| **2. Layout & Shell Components** | `src/components/layout/` | Shell wrappers and navigation (`Header.jsx`, `BottomNav.jsx`, `MobileTopbar.jsx`, `Layout.jsx`) |
| **3. Global State Contexts** | `src/context/` | State providers (`AuthContext.jsx`, `ActivityContext.jsx`, `GoalContext.jsx`, `ThemeContext.jsx`, etc.) |
| **4. Vanilla CSS Stylesheets** | `src/assets/css/` | CSS rules, classes, and variables (`style.css`, `themes.css`, `dashboard.css`, `focus.css`, `deep-focus.css`, etc.) |
| **5. Config & Integrations** | `src/config/firebase.js` | Firebase SDK initialization, auth and firestore instances |
| **6. Agent Skills & Guidelines** | `.agents/skills/**/SKILL.md`<br>`AGENTS.md`<br>`README.md` | Workflows, coding rules, commit standards, and architectural specifications |

---

## 3. Systematic Search Procedure

```text
┌────────────────────────────────────────────────────────┐
│ Step 1: Identifier & Variation Discovery               │
│ Search exact names, PascalCase, camelCase & CSS classes│
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 2: Separate Declarations from Usage Call Sites    │
│ Pinpoint primary file definition vs consuming imports  │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 3: Layer Analysis & Context Data Flow             │
│ Check state ownership in src/context/ vs page state    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 4: Scan Stylesheets & Theme Compatibility         │
│ Check CSS classes in src/assets/css/ and theme vars    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Step 5: Format & Deliver Structured Findings           │
│ Deliver structured discovery summary to the user       │
└────────────────────────────────────────────────────────┘
```

### Step 1: Identifier & Variation Discovery
Search for the target component or concept using common naming variations:
* **PascalCase:** `DeepFocus`, `ScheduleActivities`, `GoalContext`, `MobileTopbar`
* **camelCase:** `useActivities`, `useGoals`, `subActivities`, `toggleActivityLog`
* **CSS Selectors:** `.calendar-view`, `.deep-work-mode`, `.analytics-bar`, `.subactivity-card`
* **CSS Custom Properties:** `--primary-color`, `--bg-primary`, `--surface-color`, `--text-primary`

Use `grep_search` across `src/`, `public/`, and `.agents/skills/`.

### Step 2: Separate Declarations from Usages
* **Declaration:** Where the component, context, or style rule is originally defined.
* **Call Sites:** Where the symbol is imported and mounted, or where the CSS class is applied in JSX.

### Step 3: Layer Analysis & Context Data Flow
Analyze architectural tier and state flow:
1. Is it managed in a dedicated context provider (`src/context/`) or as isolated local component state?
2. Does it persist data to Firestore (`setDoc`, `updateDoc`, `addDoc`)?
3. Does it consume `useTheme()` or respect dynamic body classes?
4. Does it handle loading and empty states cleanly?

---

## 4. Standard Output Template for Findings

```markdown
### Repository Discovery Report: `<Query Symbol or Feature>`

#### 1. Presence & Status
* **Status:** Present / Not Present / Partially Implemented
* **Primary Declaration:** `[<Filename>](file:///path/to/file#L<line>)`
* **Architectural Layer:** Page View (`src/pages/`) / Context Provider (`src/context/`) / Layout (`src/components/layout/`) / Stylesheet (`src/assets/css/`)

#### 2. Declaration Summary
* **Export Type:** Default export / Named export
* **Props / Signature:** `({ ... })`
* **Key Dependencies:** Contexts, hooks, and stylesheets consumed

#### 3. Call Sites & Usage Locations
* `[<ConsumerFile1>](file:///path/to/file#L<line>)`: Mounted or consumed here

#### 4. Stylesheet & Theme Compliance
* **CSS File:** `[<stylesheet.css>](file:///path/to/file)`
* **CSS Custom Properties:** Consumes `var(--primary-color)`, `var(--bg-primary)`, etc.
* **Theme Support:** Verified across all 6 themes and dark/light modes

#### 5. Firestore Data Model
* **Fields Touched:** e.g. `activities`, `subActivities`, `focusSessions`
* **Payload Safety:** Sanitized against `undefined` values

#### 6. Governing Agent Skills
* `review-directory-structure`, `maintain-design-system`, `review-db-structure`
```

---

## 5. Anti-Patterns to Avoid

* ❌ **Premature Editing:** Never edit code while executing this skill. It is strictly read-only.
* ❌ **Single-Directory Blindness:** Searching only `src/pages/` while forgetting stylesheets in `src/assets/css/` or context state in `src/context/`.
* ❌ **Assuming Absences:** Concluding a component doesn't exist before checking common variations (e.g., `ScheduleActivities` vs `ScheduleContext`, `deep-timer` vs `DeepFocus`).
