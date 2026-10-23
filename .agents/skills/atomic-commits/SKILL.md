---
name: atomic-commits
description: >-
  Use this skill to enforce atomic, function-scoped git commits during development in BitHab.
  Ensures every change to a file or cohesive group of files contributing to a specific
  function, step, or sub-module is validated and committed before moving on to the next
  function, module, or step.
---

# Atomic & Modular Git Commits

This skill provides step-by-step instructions for committing code changes in small, atomic, function-scoped increments in the **BitHab** repository.

---

## 1. Core Principle

> **Rule:** Every functional change to a file or cohesive set of files must be committed before proceeding to the next function, next step, or next module.

Never accumulate changes across multiple unrelated features or layers (e.g., modifying `GoalContext.jsx`, `Notes.jsx`, and `style.css` all in one batch). Keeping commits modular and atomic ensures easy rollbacks, clean review histories, and zero merge conflicts across the React client, contexts, stylesheets, and agent guidelines.

### Primacy of Skill-Defined Atomic Increments Over User-Provided Phases

> **Crucial Rule:** Irrespective of high-level phases or grouped deliverables provided in a user prompt, the execution plan, test verification, and git commits must ALWAYS follow the atomic standards of this skill (`atomic-commits`) and `audit-and-planning`, NOT the user's high-level phase groupings.
* When a user presents instructions organized in broad phases (e.g. "Phase 1: Update Activities & Schedule", "Phase 2: Fix Goals and Notes"), decompose each phase into granular, atomic steps.
* Each independent functional unit (context provider, page view, stylesheet adjustment, or layout element) must be developed, validated, and committed on its own before moving to the next.
* Never batch distinct functional units into a single commit merely because they were mentioned together in the prompt.

---

## 2. When to Use This Skill

Activate this skill:
* When implementing a new feature composed of multiple functions or steps.
* When fixing bugs across one or more pages or contexts.
* When refactoring a specific context, page, or stylesheet.
* When updating Firestore data handling or UI layout classes.
* After completing any cohesive unit of work and before starting work on the next component or page.

---

## 3. Workflow Steps

### Step 1: Identify the Functional Boundary
* Define the single, cohesive unit of work just completed (e.g., adding subactivity editing to `ActivityContext.jsx` and `Activities.jsx`, or aligning `deep-focus.css` timer controls).
* Identify all files that directly contributed to this functional unit.
* Ensure no unintended files (build artifacts in `dist/`, `.DS_Store`, temporary files) are included.

### Step 2: Pre-Commit Verification
Before staging files, verify that the changes are sound:
1. **Run Linter:** Execute `npm run lint` (`oxlint`). Ensure zero errors.
2. **Run Build:** Execute `npm run build` (`vite build`). Ensure the production bundle builds without errors.
3. **Review Diff:** Run `git diff` to ensure only intentional modifications are present.
4. **Check Status:** Run `git status` to see exact modified and untracked files.

### Step 3: Granular Staging
Stage **only** the files relevant to the specific functional increment:
```bash
git add <path/to/file1> <path/to/file2>
```
* Avoid blanket `git add .` unless all changed files strictly belong to that single functional unit.

### Step 4: Craft a Semantic Commit Message (Single Line Only)
Use the Semantic Commit format on **one line only**:
```text
<type>(<scope>): <comprehensive subject in present tense>
```

**Key Constraints:**
* **Single-Line Only:** Never include multi-line bodies, footers, or line breaks in commit messages.
* **Present Tense:** Write the subject in present tense (e.g. `add`, `update`, `fix`, `refactor`, `remove`, not `added`, `fixed`, `adding`).

**Allowed Types:**
* `feat`: A new feature or function
* `fix`: A bug fix
* `test`: Adding or running tests
* `refactor`: Code change that neither fixes a bug nor adds a feature
* `style`: Stylesheets, CSS variables, layout adjustments
* `docs`: Documentation only changes
* `chore`: Maintenance, dependency updates, tooling

**Standard BitHab Scopes:**
* `activities`: Activities manager, subactivity CRUD, color pickers, modals (`Activities.jsx`, `ActivityContext.jsx`)
* `schedule`: ScheduleActivities calendar, pattern scheduling, activity logs (`ScheduleActivities.jsx`, `ScheduleContext.jsx`)
* `goals`: Goal tracking, subgoals accordion, completed accordion, edit modal (`Goals.jsx`, `GoalContext.jsx`)
* `reminders`: Datetime reminders, status formatting, edit modals, past indicators (`Reminders.jsx`, `ReminderContext.jsx`)
* `notes`: Daily notes, general notes, inline editing, favorites, date picker (`Notes.jsx`, `NoteContext.jsx`)
* `lists`: Checklists, todo lists, numbered & bulleted lists, list items (`Lists.jsx`, `ListContext.jsx`)
* `focus`: 3-column focus room, live digital clock, tasks, motivational quotes (`Focus.jsx`)
* `deep-focus`: Fullscreen deep work session timer, target duration, progress bar (`DeepFocus.jsx`)
* `analytics`: Focus analytics, 7-day weekly bar chart, metrics cards (`Analytics.jsx`)
* `themes`: Theme switcher, preview cards, theme context, dark/light mode (`Themes.jsx`, `ThemeContext.jsx`)
* `auth`: Login, Register, Google OAuth, password reset, auth redirects (`Login.jsx`, `Register.jsx`, `AuthContext.jsx`)
* `dashboard`: Home dashboard, calendar view, dots, card navigators (`Dashboard.jsx`)
* `layout`: Header, BottomNav, MobileTopbar, Layout shell, body classes (`Header.jsx`, `BottomNav.jsx`, `Layout.jsx`)
* `styles`: Vanilla CSS stylesheets in `src/assets/css/`
* `db`: Firestore schema handling, payload sanitization, queries
* `skills`: Agent workflow skills (`.agents/skills/`)
* `docs`: Architecture documentation (`AGENTS.md`, `README.md`)

**Commit Examples:**
* `feat(activities): add subactivity color picker and edit modal`
* `fix(goals): support legacy title and target schema compatibility`
* `feat(dashboard): restore calendar view dots and daily note editor`
* `style(focus): align 3-column digital clock and quote layout`
* `feat(deep-focus): implement countdown timer and completion dialog`
* `docs(agents): update development pipeline and commit standards`

### Step 5: Execute Commit & Verify Clean State
1. Commit the staged changes using a single-line message:
   ```bash
   git commit -m "<type>(<scope>): <comprehensive subject in present tense>"
   ```
2. Verify that the commit was successfully recorded:
   ```bash
   git log -n 1 --oneline
   ```
3. Check working directory status:
   ```bash
   git status
   ```

### Step 6: Transition to Next Step
Only after the commit is recorded and the workspace status for this unit is clean, proceed to work on the next function, step, or module.

---

## 4. Anti-Patterns to Avoid

* ❌ **Batching Unrelated Work:** Committing Goals, Notes, and Focus mode changes in a single commit.
* ❌ **Multi-Line Commit Messages:** Creating commit messages with multi-line bodies, bullet points, or markdown.
* ❌ **Unverified Commits:** Committing code before running `npm run lint` and `npm run build`.
* ❌ **Vague Commit Messages:** Using messages like `updates`, `fix bug`, `wip`, or `changes`.
