---
name: sync-skills-and-docs
description: >-
  Use this skill whenever a new feature, page, context, stylesheet, or major refactor is added to BitHab.
  Provides a systematic checklist and audit procedure to propagate changes across all agent skills (.agents/skills/),
  repository documentation (README.md), and developer guidelines (AGENTS.md) so architecture and rules remain continuously synchronized.
---

# Continuous Skill & Documentation Synchronization

This skill defines the mandatory workflow and checklist for synchronizing all workspace **skills** (`.agents/skills/`), **architecture documentation** (`README.md`), and **development rules** (`AGENTS.md`) whenever a new feature, page, context, or stylesheet is introduced to **BitHab**.

---

## 1. Core Philosophy: Living Guidelines & Zero Architectural Drift

> **The Synchronization Mandate:** A feature is not complete when only application code is written. Every new capability, UI element, context provider, and stylesheet must immediately be reflected across the repository's governing skills and architectural documentation.

Failing to synchronize skills when adding features causes:
* Subsequent agents referencing outdated directory maps or missing new page/context placements.
* Stale Firestore schemas in `review-db-structure` causing missing fields or broken backward compatibility.
* Inconsistent UI patterns where new CSS classes, body classes, or theme tokens are omitted from design guides.
* Misaligned documentation between the React client, stylesheets, and developer guides.

---

## 2. Feature-to-Skill Synchronization Matrix

Whenever a feature introduces new code, consult this matrix to identify which skills and docs must be updated:

| If Your Feature Added or Changed: | Skills to Update | Documentation to Update |
| :--- | :--- | :--- |
| **New Route Page or Layout Element** | `review-directory-structure`<br>`repo-search` | `README.md` (Feature Architecture)<br>`AGENTS.md` |
| **New Context Provider or State Hook** | `review-directory-structure`<br>`repo-search` | `README.md`<br>`AGENTS.md` |
| **New CSS Custom Property, Theme Palette, or Instant Switching** | `maintain-design-system`<br>`review-responsive-design` | `src/assets/css/themes.css`<br>`README.md` |
| **Dashboard Stretch, Baseline Alignment, or Card Spacing** | `maintain-design-system`<br>`review-responsive-design` | `src/assets/css/dashboard.css`<br>`AGENTS.md` (Rule 6) |
| **Inline Activity Logging, Reminders Status, or Firestore Model** | `review-db-structure`<br>`maintain-design-system` | `AGENTS.md` (Rule 5)<br>`README.md` |
| **New Firestore Field or Document Schema** | `review-db-structure`<br>`audit-and-planning` | `AGENTS.md` (Rule 5)<br>`README.md` |
| **New Body Class or Route Mode** | `maintain-design-system`<br>`review-responsive-design` | `AGENTS.md` (Rule 6)<br>`src/components/layout/Layout.jsx` |
| **New Tooling, Test Fixtures, or Script Command (Zero `sed` Policy)** | `targeted-module-testing`<br>`atomic-commits` | `package.json`<br>`AGENTS.md` |

---

## 3. Systematic 6-Phase Synchronization Workflow

After completing feature code and verification checks, execute this 6-phase audit:

```text
┌────────────────────────────────────────────────────────┐
│ Phase 1: Directory Structure & Architectural Trees    │
│ Update .agents/skills/review-directory-structure       │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 2: Design System & Vanilla CSS Specification    │
│ Update .agents/skills/maintain-design-system           │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 3: Responsive Design & Viewport Safety           │
│ Update .agents/skills/review-responsive-design         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 4: Canonical Firestore Architecture & Schemas    │
│ Update .agents/skills/review-db-structure              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 5: Search Scope & Pre-Implementation Checklists  │
│ Update .agents/skills/repo-search & audit-and-planning │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│ Phase 6: Guides & Agent Routine Rules                  │
│ Update README.md and AGENTS.md                         │
└────────────────────────────────────────────────────────┘
```

### Phase 1: Synchronize `review-directory-structure`
1. **Architectural Tree:** Add any newly created page in `src/pages/`, context in `src/context/`, or stylesheet in `src/assets/css/`.
2. **Directory Rules:** Verify that placement standards reflect the newly introduced module.

### Phase 2: Synchronize `maintain-design-system`
1. **Design Tokens:** If new CSS custom properties were added to `style.css` or `themes.css`, register them in the specification matrix.
2. **Theme Parity & Instant Switching:** Ensure contrast rules account for any new UI components across all 6 themes and document synchronous attribute toggles (`data-theme`, `data-mode`) for zero flicker.
3. **Card Spacing & Baseline Alignment:** Confirm card header margins (`margin-bottom: 0.25rem; padding-bottom: 0.35rem;`), centered icon button rules (`display: flex; align-items: center; justify-content: center;`), and form separator badge structures.

### Phase 3: Synchronize `review-responsive-design`
1. **Navigation & Clearance:** If new fixed buttons or bottom elements were added, verify that mobile bottom navigation clearance (`padding-bottom: 5rem` / `100px`) is preserved.
2. **Desktop Grid Stretch:** Verify desktop 3-column layout ratios (`1fr 1.5fr 1fr`), stretch height (`min-height: calc(100vh - 90px)`), and baseline bottom alignment.
3. **Touch Targets & Fonts:** Verify that new interactive elements maintain 44x44px touch targets and form inputs enforce 16px font-size to prevent iOS Safari auto-zoom.

### Phase 4: Synchronize `review-db-structure`
1. **Canonical Schema:** Register all new Firestore fields, arrays, or subcollections with types and default values.
2. **Backward Compatibility:** Confirm that legacy data shapes continue to be supported.
3. **Data Flows & Listeners:** Document real-time state synchronization (such as inline activity logs mapping to calendar dots, or active vs expired datetime comparisons).

### Phase 5: Synchronize `repo-search` & `audit-and-planning`
1. **Search Scopes:** Ensure new directories or features are included in the search scope matrix.
2. **Pre-Implementation Checklists:** Update checklist questions to guard against recurring patterns and enforce the zero `sed` command policy.

### Phase 6: Synchronize `README.md` & `AGENTS.md`
1. **README Feature Map:** Document new capabilities in the appropriate subsection of `README.md`.
2. **AGENTS Routine & Scope Rules:** If a new feature area was introduced, register its scope tag under Section 4 of `AGENTS.md`.

---

## 4. Post-Feature Synchronization Checklist

Before marking any feature as complete:
```text
[ ] 1. All newly added pages, contexts, or stylesheets are reflected in review-directory-structure.
[ ] 2. Any new CSS custom properties or theme definitions are documented in maintain-design-system.
[ ] 3. Responsive layout rules and touch target dimensions are logged in review-responsive-design.
[ ] 4. Any new Firestore fields or subcollections are documented in review-db-structure.
[ ] 5. README.md feature descriptions accurately reflect current functionality.
[ ] 6. AGENTS.md commit scopes and guardrails are updated.
[ ] 7. Linter passes with 0 errors: npm run lint.
[ ] 8. Production build compiles cleanly: npm run build.
```
