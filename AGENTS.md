# Agent Development Guidelines & Routine

This document defines the mandatory development workflows, standards, and pipeline that all AI agents and contributors must follow when working in the **BitHab** codebase.

---

## 1. Mandatory Development Principles

Every development task in this repository must strictly adhere to the following mandatory core principles:

### Rule 1: Step-by-Step Atomic Commits
* **Skill Reference:** [.agents/skills/atomic-commits/SKILL.md](file:///.agents/skills/atomic-commits/SKILL.md)
* **Rule:** Every change in a file or cohesive group of files contributing to a specific function or step must be validated and committed **before** moving on to the next function, module, or step.
* **Primacy Over User Phases:** Irrespective of any high-level phases, milestones, or batches outlined in a user request, the plan, audit, and commits must happen as per the skill only. Decompose broad phases into granular, atomic steps.
* **Prohibited:** Accumulating changes across multiple distinct contexts, pages, or stylesheets into a single batch commit.

### Rule 2: Verification, Linting & Build Health Checks
* **Skill Reference:** [.agents/skills/targeted-module-testing/SKILL.md](file:///.agents/skills/targeted-module-testing/SKILL.md)
* **Rule:**
  1. **Lint on Every Change:** Run `npm run lint` (`oxlint`). Code must produce **0 errors**. Resolve all unused variables and missing hook dependencies before committing.
  2. **Production Build Validation:** Run `npm run build` (`vite build`). Ensure the application bundles cleanly without compilation failures.
  3. **Runtime Stability:** Verify that changes introduce zero unhandled exceptions or console errors in the browser.
* **Prohibited:** Committing code that fails `npm run lint` or breaks `npm run build`.

### Rule 3: Architecture & Directory Placement
* **Skill Reference:** [.agents/skills/review-directory-structure/SKILL.md](file:///.agents/skills/review-directory-structure/SKILL.md)
* **Rule:** Every new or moved file must be positioned strictly within its designated architectural layer (`src/pages/` for route views, `src/components/layout/` for shell navigation, `src/context/` for state providers, `src/assets/css/` for stylesheets, `src/config/` for platform integrations).
* **Root Cleanliness Policy:** The root directory is strictly reserved for `.gitignore`, `AGENTS.md`, `README.md`, `package.json`, `package-lock.json`, `.oxlintrc.json`, `index.html`, `vite.config.js`, and `netlify.toml`. Loose scripts or secondary files must never reside in the root.

### Rule 4: File & Folder Naming Conventions
* **Skill Reference:** [.agents/skills/file-folder-naming/SKILL.md](file:///.agents/skills/file-folder-naming/SKILL.md)
* **Rule:** File and directory names must strictly adhere to casing standards: `PascalCase.jsx` for React pages, layout components, and context providers, `camelCase.js` for config/logic helpers, `kebab-case.css` or clean `lowercase.css` for stylesheets, and `lowercase` for source directories.

### Rule 5: Database Structure & Schema Integrity
* **Skill Reference:** [.agents/skills/review-db-structure/SKILL.md](file:///.agents/skills/review-db-structure/SKILL.md)
* **Rule:** Any reading, writing, modifying, or refactoring of Firestore collections, documents, or fields must strictly conform to canonical schemas (`/users/{userId}` and `/users/{userId}/focusSessions`), guarantee sanitized payloads (zero `undefined` values), preserve backward compatibility with legacy fields (e.g. goals `name` vs `title`), and ensure all `onSnapshot` subscriptions return cleanup functions in `useEffect`.

### Rule 6: Responsive Mobile Design & Dual-Nav Architecture
* **Skill Reference:** [.agents/skills/review-responsive-design/SKILL.md](file:///.agents/skills/review-responsive-design/SKILL.md)
* **Rule:** Every UI component, page, modal, or form must be verified for responsive safety across mobile and desktop screens:
  1. **Dual-Nav Reflow:** Desktop viewports (>= 768px) display top `Header.jsx`; mobile viewports (< 768px) display `MobileTopbar.jsx` and fixed `BottomNav.jsx`.
  2. **Focus Mode Bypassing:** Full-screen focus routes (`/focus`, `/deep-focus`, `/analytics`) must bypass default navigation and expand to 100vh via the `focus-mode` body class.
  3. **Bottom Navigation Clearance:** Mobile page containers must reserve bottom padding (`padding-bottom: 5rem`) so content is never obscured by `BottomNav.jsx`.
  4. **Ergonomic Touch Targets:** Minimum 44x44px touch targets on mobile interactive controls.
  5. **iOS Safari Auto-Zoom Prevention:** All form inputs must enforce at least `16px` font-size on mobile.
  6. **Zero Layout Shift:** Status transitions (e.g., "Copied!", "Saved") must use fixed button widths or non-displacing toast alerts.

### Rule 7: Pre-Implementation Audit, Search & Structured Planning
* **Skill Reference:** [.agents/skills/audit-and-planning/SKILL.md](file:///.agents/skills/audit-and-planning/SKILL.md) & [.agents/skills/repo-search/SKILL.md](file:///.agents/skills/repo-search/SKILL.md)
* **Rule:** Before writing or modifying any code for a bug fix, feature, or refactor, you must first perform an audit of existing code using `repo-search`, search related usages across the codebase, diagnose verified root causes (for bugs) or requirements (for features), and formulate a clear, step-by-step implementation plan composed of atomic increments.
* **Prohibited:** Writing or editing code prematurely without auditing the codebase or having an explicit step-by-step implementation plan.

### Rule 8: Vanilla CSS Design System & Theme Integrity
* **Skill Reference:** [.agents/skills/maintain-design-system/SKILL.md](file:///.agents/skills/maintain-design-system/SKILL.md)
* **Rule:** Whenever creating new components or modifying stylesheets, strictly preserve BitHab's Vanilla CSS Design System:
  1. **Zero Hardcoded Colors:** All color values must consume CSS custom properties (`var(--primary-color)`, `var(--bg-primary)`, `var(--surface-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`). Never hardcode raw hex values in JSX styles or CSS rules.
  2. **Multi-Theme Parity:** Every UI element must maintain accessible contrast across all 6 themes (`default`, `ocean`, `sunset`, `forest`, `dark`, `minimal`) and in both Light (`[data-mode="light"]`) and Dark (`[data-mode="dark"]`) modes.
  3. **Body Class Coordination:** Coordinate layout rules with standard body classes (`index-page`, `themes-page`, `focus-mode`, `auth-page`).

### Rule 9: Continuous Skill & Documentation Synchronization
* **Skill Reference:** [.agents/skills/sync-skills-and-docs/SKILL.md](file:///.agents/skills/sync-skills-and-docs/SKILL.md)
* **Rule:** Whenever introducing a new feature, page, context provider, or stylesheet, all agent skills (`.agents/skills/`), architecture documentation (`README.md`), and developer guidelines (`AGENTS.md`) must be systematically audited and synchronized before concluding the feature. Follow the 6-phase synchronization workflow and post-feature checklist.
* **Prohibited:** Concluding or merging a feature without synchronizing the directory structure, design system tokens, database schemas, and documentation.

---

## 2. Standard Development Routine & Pipeline

When fulfilling any user prompt or feature request, follow this complete, end-to-end development pipeline across two mandatory stages:

```text
══════════════════════════════════════════════════════════════════════════════
STAGE A: ATOMIC IMPLEMENTATION CYCLE (Repeat for each functional step)
══════════════════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────────────────────────┐
│ 0. Pre-Implementation Audit & Search                                       │
│    - Discover usages & dependencies via repo-search skill                  │
│    - Diagnose root causes & requirements via audit-and-planning skill      │
│    - Check Firestore data model & backward compatibility                   │
│    - Formulate atomic, step-by-step implementation plan                    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 1. Scope Functional Unit & Review Structure / Naming                       │
│    - Isolate single cohesive step or function                              │
│    - Verify architectural layer via review-directory-structure skill       │
│    - Verify casing via file-folder-naming skill (PascalCase / kebab-case)  │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 2. Implement Changes & Preserve Design System                              │
│    - Write / edit code adhering to maintain-design-system skill            │
│    - Zero hardcoded colors: consume CSS variables (var(--primary-color))   │
│    - Enforce 44px touch targets & zero-layout-shift transient feedback    │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 3. Execute Verification Checks (targeted-module-testing skill)             │
│    - Run static analysis: npm run lint (oxlint) -> Ensure 0 errors         │
│    - Run production build: npm run build (vite build) -> Ensure success    │
│    - Fix any warnings or regressions immediately                           │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 4. Atomic Git Commit (Single-Line Semantic Commit)                         │
│    - Stage only relevant files (atomic-commits skill)                      │
│    - Commit using: <type>(<scope>): <present tense subject>                │
│    - Confirm commit with git log -n 1 --oneline                            │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 5. Iterate or Transition to Synchronization Pipeline                       │
│    - If more units/steps remain: Return to Step 1                          │
│    - If all functional code is committed: Proceed to Stage B               │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
══════════════════════════════════════════════════════════════════════════════
STAGE B: FEATURE CONCLUSION & SYNCHRONIZATION PIPELINE (sync-skills-and-docs)
══════════════════════════════════════════════════════════════════════════════
┌────────────────────────────────────────────────────────────────────────────┐
│ 6. Execute Systematic 6-Phase Skill & Documentation Synchronization Audit  │
│    Phase 1: review-directory-structure (architectural trees, files)        │
│    Phase 2: maintain-design-system (CSS tokens, multi-theme parity)        │
│    Phase 3: review-responsive-design (dual-nav, safe-area, clearance)      │
│    Phase 4: review-db-structure (canonical Firestore schemas)              │
│    Phase 5: repo-search & audit-and-planning (search scopes & checklists)  │
│    Phase 6: README.md & AGENTS.md (feature descriptions & rules)           │
│    - Commit documentation updates atomically with docs(<scope>): ...       │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 7. Full Health Check & Build Verification                                  │
│    - Run linter: npm run lint (oxlint) -> 0 errors                         │
│    - Run build: npm run build (vite build) -> clean dist/ bundle           │
│    - Ensure clean git working directory: git status                        │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│ 8. Conclude Feature & Report to User                                       │
│    Feature is verified, fully tested, documented, and synchronized         │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Verification Command Reference

Always run verification commands to validate changes:

| Verification | Command | Purpose |
| :--- | :--- | :--- |
| **Unit & Integration Tests** | `npm test` | Runs `vitest run` executing 24 test suites across all context providers, layout components, and pages. |
| **Static Code Analysis** | `npm run lint` | Runs `oxlint` across all files to detect syntax errors, unused variables, and React hook bugs (must be 0 errors). |
| **Production Build** | `npm run build` | Compiles application using `vite build` to guarantee bundle integrity and import resolution. |
| **Local Dev Server** | `npm run dev` | Launches local Vite development server on `http://localhost:5173/`. |
| **Production Preview** | `npm run preview` | Previews the compiled `dist/` bundle locally. |

---

## 4. Single-Line Semantic Commit Standards

Every commit message must follow the Semantic Commit format on **one line only**:
```text
<type>(<scope>): <comprehensive subject in present tense>
```

* **Single-Line Only:** Do not include multi-line bodies or footers in commit messages.
* **Present Tense:** Write the subject in present tense (e.g. `add`, `update`, `fix`, `refactor`, `remove`, not `added`, `fixed`, `adding`).
* **Types:** `feat`, `fix`, `test`, `refactor`, `style`, `docs`, `chore`
* **BitHab Scopes:** `activities`, `schedule`, `goals`, `reminders`, `notes`, `lists`, `focus`, `deep-focus`, `analytics`, `themes`, `auth`, `dashboard`, `layout`, `styles`, `db`, `skills`, `docs`
* **Examples:**
  * `feat(activities): add subactivity color picker and edit modal`
  * `fix(goals): support legacy title and target schema compatibility`
  * `feat(dashboard): restore calendar view dots and daily note editor`
  * `style(focus): align 3-column digital clock and quote layout`
  * `feat(deep-focus): implement countdown timer and completion dialog`
  * `docs(agents): update development pipeline and commit standards`

---

## 5. Strict Guardrails

1. **Never batch unrelated work:** If Task A modifies `ActivityContext.jsx` and Task B modifies `Notes.jsx`, complete and commit Task A first before touching Task B.
2. **Never leave linter red:** Every commit must produce **0 errors** on `npm run lint`.
3. **Never break production build:** Every commit must pass `npm run build` cleanly.
4. **Never hardcode raw hex colors in JSX or CSS:** All colors must flow through CSS custom properties to guarantee multi-theme and dark/light mode switching.
5. **Never break multi-theme contrast:** Audit all text and buttons across all 6 themes and in both Light and Dark modes.
6. **Always use single-line semantic commit:** Never create multi-line commit messages or omit the `<type>(<scope>):` prefix.
7. **Never pollute root directory:** Never place secondary configs, loose scripts, or temporary debug logs in the root directory.
8. **Never start coding without prior audit and plan:** Always search existing implementations via `repo-search` and establish an atomic step-by-step plan before making edits.
9. **Never cause layout shift on transient feedback:** Status transitions must never displace containing cards or layout bars.
10. **Never break Firestore backward compatibility:** Always support legacy user document structures (e.g. `name` vs `title` in goals).
11. **Never omit onSnapshot listener cleanup in useEffect:** Every real-time Firestore subscription must return an unsubscribe cleanup function.
12. **Never pass undefined to Firestore payloads:** Always sanitize payloads with `null` or explicit fallbacks.
13. **Never obscure mobile content behind BottomNav:** Always ensure adequate bottom padding on mobile page views.
14. **Never conclude a feature without skill & documentation synchronization:** Every newly introduced component, context, or stylesheet must be audited and registered across `.agents/skills/` and `README.md`.
15. **Always reuse canonical test users:** Never register new throwaway user accounts during manual or browser testing. Always reuse the canonical test accounts (`test@bithab.com` / `Password123!`) defined in [.agents/skills/targeted-module-testing/SKILL.md](file:///.agents/skills/targeted-module-testing/SKILL.md).
