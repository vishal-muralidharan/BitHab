---
name: review-directory-structure
description: >-
  Use this skill to review, navigate, and validate the project directory structure in BitHab.
  Ensures new files, modules, features, components, contexts, and stylesheets are placed
  in their correct architectural locations according to the BitHab repository standards.
---

# Review Directory Structure & Architectural Placement

This skill defines the architectural map and directory organization rules for the **BitHab** repository. Use it whenever creating, moving, refactoring, or reviewing files and folders.

---

## 1. Architectural Overview

The BitHab repository is organized into distinct layers separating client-side React code, global context providers, layout components, Vanilla CSS stylesheets, public assets, and agent customizations:

```text
/
├── .agents/                          # Agent workspace configurations and skills
│   └── skills/                       # Reusable workflow and guideline skills
│       ├── atomic-commits/           # Step-by-step atomic commit standards
│       ├── audit-and-planning/       # Pre-implementation audit and planning
│       ├── file-folder-naming/       # Casing and file naming conventions
│       ├── maintain-design-system/   # Vanilla CSS design tokens & theme integrity
│       ├── repo-search/              # Read-only symbol and component discovery
│       ├── review-db-structure/      # Canonical Firestore schema & payload safety
│       ├── review-directory-structure/ # Architectural map and placement rules
│       ├── review-responsive-design/ # Mobile-first dvh, layout, and touch targets
│       ├── sync-skills-and-docs/     # Continuous guideline & documentation sync
│       └── targeted-module-testing/  # Verification, linting & build health checks
├── public/                           # Static assets served as-is (favicons, manifests)
├── src/                              # Client-side React 19 application
│   ├── assets/                       # Static media, icons, and stylesheets
│   │   ├── css/                      # Modular Vanilla CSS stylesheets
│   │   │   ├── style.css             # Base styles, resets, CSS variables, buttons
│   │   │   ├── themes.css            # Multi-theme palettes and mode definitions
│   │   │   ├── dashboard.css         # Calendar grid, dots, and dashboard cards
│   │   │   ├── focus.css             # 3-column focus mode, clock, and analytics bar
│   │   │   ├── deep-focus.css        # Fullscreen deep work session overlay
│   │   │   ├── notes.css             # Notes cards, toolbar, and date filter styles
│   │   │   ├── lists.css             # Lists grid, cards, and checklist styles
│   │   │   ├── management.css        # Activity & goal management layouts
│   │   │   ├── schedule.css          # Activity scheduling calendar & stats
│   │   │   ├── auth.css              # Authentication card and input layouts
│   │   │   ├── custom-dialogs.css    # Custom confirm & prompt modal dialogs
│   │   │   └── clock.css             # Digital clock styles
│   │   └── images/                   # App logos and image assets
│   ├── components/                   # Reusable React components
│   │   └── layout/                   # Global shell layouts and navigation
│   │       ├── Header.jsx            # Desktop top navigation header
│   │       ├── BottomNav.jsx         # Mobile bottom navigation bar
│   │       ├── MobileTopbar.jsx      # Mobile header with logo and theme toggle
│   │       └── Layout.jsx            # Dynamic body-class manager & route shell
│   ├── context/                      # Global React Context state providers
│   │   ├── AuthContext.jsx           # Firebase Authentication & current user state
│   │   ├── ThemeContext.jsx          # Multi-theme and dark/light mode state
│   │   ├── ActivityContext.jsx       # Activities and subactivities CRUD
│   │   ├── GoalContext.jsx           # Goals and subgoals tracking
│   │   ├── ReminderContext.jsx       # Datetime reminders management
│   │   ├── NoteContext.jsx           # Daily & general notes management
│   │   ├── ListContext.jsx           # Multi-type lists management
│   │   └── ScheduleContext.jsx       # Calendar schedules and activity logs
│   ├── config/                       # Third-party integrations and configs
│   │   └── firebase.js               # Firebase Client SDK initialization & db export
│   ├── pages/                        # Top-level route views
│   │   ├── Dashboard.jsx             # Home dashboard with calendar & summary cards
│   │   ├── Activities.jsx            # Activity & subactivity manager
│   │   ├── ScheduleActivities.jsx    # Calendar activity scheduling & progress
│   │   ├── Goals.jsx                 # Goal & subgoal tracker with completion accordion
│   │   ├── Reminders.jsx             # Datetime reminders with past/expired tags
│   │   ├── Notes.jsx                 # Inline daily & general notes manager
│   │   ├── Lists.jsx                 # Checklists, todos, and bulleted lists
│   │   ├── Focus.jsx                 # 3-column focus room with digital clock
│   │   ├── DeepFocus.jsx             # Fullscreen deep work session timer
│   │   ├── Analytics.jsx             # 7-day focus chart & productivity metrics
│   │   ├── Themes.jsx                # Multi-theme preview and selector
│   │   ├── Login.jsx                 # Email/password & Google OAuth login
│   │   └── Register.jsx              # New user registration & onboarding
│   ├── App.jsx                       # React Router configuration & provider nesting
│   └── main.jsx                      # Application entry point & stylesheet imports
├── .gitignore                        # Git ignore patterns
├── .oxlintrc.json                    # Oxlint static analysis configuration
├── AGENTS.md                         # Agent development guidelines and pipeline rules
├── index.html                        # Application HTML entry point
├── package.json                      # Project dependencies and script definitions
├── package-lock.json                 # Locked dependency tree
├── README.md                         # Project documentation and feature map
└── vite.config.js                    # Vite dev server and production bundler config
```

---

## 2. Root Directory Cleanliness Policy

The root directory must remain strictly curated. Only the following essential platform anchors, package definitions, and guidelines are permitted in the root:

1. **Directives & Version Control:** `.gitignore`, `AGENTS.md`, `README.md`
2. **Package & Tooling:** `package.json`, `package-lock.json`, `.oxlintrc.json`
3. **Application Entry & Bundler:** `index.html`, `vite.config.js`

**Strict Prohibitions:**
* Never create loose scratch scripts or temporary files directly in the root directory.
* Never commit build outputs (`dist/`) or cache directories (`.vite/`, `node_modules/`).
* Never place stylesheets or JSX components loose in the root; always use `src/assets/css/` or `src/pages/`.

---

## 3. Directory Placement Rules

### `src/pages/` (Top-Level Route Views)
* **Purpose:** Route-level page components mounted by React Router in `src/App.jsx`.
* **Rules:**
  - One page per distinct application URL path.
  - Page components orchestrate contexts, manage local form/modal states, and structure the layout.
  - Must use `PascalCase.jsx` naming.

### `src/components/layout/` (Shell Layouts & Navigation)
* **Purpose:** Persistent navigation elements and app shell wrappers.
* **Contents:**
  - `Header.jsx`: Desktop top navigation bar with active NavLinks and theme toggle.
  - `BottomNav.jsx`: Mobile navigation bar with active indicators and more dropdown.
  - `MobileTopbar.jsx`: Compact mobile top header.
  - `Layout.jsx`: Route shell that coordinates body classes (`index-page`, `themes-page`, `focus-mode`) and bypasses standard navigation on full-screen focus routes.

### `src/context/` (Global React Contexts)
* **Purpose:** Centralized state management syncing with Firebase Firestore.
* **Rules:**
  - Each domain entity has a dedicated context provider (`AuthContext`, `ActivityContext`, `GoalContext`, etc.).
  - Providers expose state arrays, loading flags, and async CRUD operations.
  - Always clean up subscriptions or timers on unmount.

### `src/assets/css/` (Vanilla CSS Design System)
* **Purpose:** Modular styling sheets organized by page or feature domain.
* **Rules:**
  - All shared variables and base styles belong in `style.css`.
  - Multi-theme definitions belong in `themes.css`.
  - Page-specific styling belongs in dedicated stylesheets (`dashboard.css`, `focus.css`, `deep-focus.css`, `notes.css`, `lists.css`).
  - No ad-hoc styling libraries; use pure Vanilla CSS.

---

## 4. Directory Structure Review Checklist

Before creating a new file or directory, verify:
```text
[ ] 1. Root Cleanliness: Does this file belong in root? (Only platform anchors, package files, and AGENTS.md/README.md are allowed).
[ ] 2. Architectural Layer: Is it a page (src/pages/), a layout element (src/components/layout/), a state provider (src/context/), or a stylesheet (src/assets/css/)?
[ ] 3. Stylesheet Placement: Modular CSS files must be placed in src/assets/css/ and imported in src/main.jsx.
[ ] 4. Context Isolation: Shared Firestore logic belongs in a dedicated context in src/context/, not duplicated across pages.
[ ] 5. No Loose Folders: Do not create arbitrary root directories without architectural justification.
```
