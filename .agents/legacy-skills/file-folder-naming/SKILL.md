---
name: file-folder-naming
description: >-
  Use this skill to determine and verify file and folder naming conventions across the BitHab codebase.
  Ensures strict consistency in casing, suffixes, extensions, and directory naming for React components,
  pages, contexts, stylesheets, configuration files, and documentation.
---

# File & Folder Naming Conventions

This skill defines the mandatory naming conventions, casing rules, and directory structures across all layers of the **BitHab** repository.

---

## 1. Quick Reference Matrix

| Entity Type | Casing | Extension | Example Location & Filename |
| :--- | :--- | :--- | :--- |
| **Route Page Components** | `PascalCase` | `.jsx` | `src/pages/Dashboard.jsx`, `src/pages/Activities.jsx`, `src/pages/Focus.jsx` |
| **Layout & Shell Components** | `PascalCase` | `.jsx` | `src/components/layout/Header.jsx`, `src/components/layout/BottomNav.jsx` |
| **React Context Providers** | `PascalCase` | `.jsx` | `src/context/GoalContext.jsx`, `src/context/ThemeContext.jsx` |
| **Custom Hooks** | `camelCase` (starts with `use`) | `.js` / `.jsx` | Exported hooks: `useAuth()`, `useActivities()`, `useTheme()` |
| **Configuration Modules** | `camelCase` | `.js` | `src/config/firebase.js` |
| **Modular Stylesheets** | `kebab-case` / `lowercase` | `.css` | `src/assets/css/style.css`, `src/assets/css/deep-focus.css` |
| **Image & Icon Assets** | `kebab-case` / `lowercase` | `.png`, `.svg` | `src/assets/images/logo.png`, `logo-transparent-light.png` |
| **Source Directories** | `lowercase` | *Directory* | `src/pages/`, `src/components/layout/`, `src/context/`, `src/assets/css/` |
| **Agent Skill Folders** | `kebab-case` | *Directory* | `.agents/skills/review-directory-structure/`, `atomic-commits/` |
| **Agent Skill Instructions** | `UPPERCASE` | `.md` | `.agents/skills/<skill-name>/SKILL.md` |
| **Architecture & Root Guides** | `UPPERCASE` | `.md` | `AGENTS.md`, `README.md` |

---

## 2. Detailed Naming Rules

### A. React Components & Pages (`src/pages/`, `src/components/`)
* Use `PascalCase` for all React component and page files.
* Always use the `.jsx` file extension for files returning JSX syntax.
* Match the primary exported component name with the filename:
  ```javascript
  export default function DeepFocus() { ... }
  ```
* Do not use kebab-case or snake_case for component files (e.g. avoid `deep-focus.jsx` or `bottom_nav.jsx`).

### B. React Context Providers (`src/context/`)
* Use `PascalCase` with the `Context.jsx` suffix for all context files:
  - `AuthContext.jsx`
  - `ThemeContext.jsx`
  - `ActivityContext.jsx`
  - `GoalContext.jsx`
  - `ReminderContext.jsx`
  - `NoteContext.jsx`
  - `ListContext.jsx`
  - `ScheduleContext.jsx`
* The custom consumption hook should be named `use<Name>` (e.g. `useGoals()`, `useTheme()`).

### C. Stylesheets (`src/assets/css/`)
* Use `kebab-case.css` or clean `lowercase.css` for modular CSS files.
* Choose names that clearly designate the page or feature domain:
  - `style.css` (base resets, design tokens, buttons)
  - `themes.css` (theme palettes and dark/light modes)
  - `dashboard.css` (calendar and dashboard card layout)
  - `focus.css` (focus room and analytics bar)
  - `deep-focus.css` (deep work session overlay)
  - `custom-dialogs.css` (modal popups and confirmations)

### D. Directories and Folders
* All source code directories must be in `lowercase`:
  - `src/`
  - `src/components/layout/`
  - `src/context/`
  - `src/pages/`
  - `src/assets/css/`
  - `src/config/`
* Agent skills must reside in `.agents/skills/<kebab-case-skill-name>/` with a root `SKILL.md`.

---

## 3. Pre-Creation Checklist

Before creating a new file or directory, check:
```text
[ ] 1. Is the filename casing appropriate for its entity type (PascalCase for JSX components/pages/contexts, kebab-case for CSS)?
[ ] 2. Does the file extension reflect its content (.jsx for components returning JSX, .js for config/logic, .css for styling)?
[ ] 3. If it is a React Context, does the file name end with Context.jsx (e.g. ScheduleContext.jsx)?
[ ] 4. If it is a stylesheet, is it placed in src/assets/css/ and named in lowercase or kebab-case?
[ ] 5. If it is an agent skill, is the folder kebab-case with a SKILL.md file inside?
```
