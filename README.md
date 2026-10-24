# BitHab

BitHab is a modern, responsive personal habit and productivity tracking web application built with React, Vite, Firebase Firestore/Auth, and a Vanilla CSS multi-theme design system.

---

## Features

- **Dashboard:** Interactive calendar matrix, inline activity logging with date-filtered pills, daily notes quick-editor, and goals/reminders tracking.
- **Activities & Scheduling:** Hierarchical activities and sub-activities with customizable color palettes and monthly scheduling calendar.
- **Goals Tracking:** Main goals with subgoals, completion percentage tracking, and legacy schema normalization.
- **Reminders:** Scheduled time-based reminders with quick date selectors, datetime picker modal, active status detection, and modal editing.
- **Notes System:** Daily notes and general thought capture with inline markdown-friendly text editor and favorites filter.
- **Flexible Lists:** Checklists, todo lists, numbered lists, and bulleted lists.
- **Focus & Deep Focus:** Digital clock with motivational quotes, task management, countdown session timer, and focus analytics.
- **Multi-Theme Gallery:** 6 themes (`oceanic-depths`, `evergreen-forest`, `cyberpunk-neon`, `monochrome-minimalist`, `sunrise-coral`, `cherry-blossom`) with seamless Dark and Light mode toggling.
- **Dual-Navigation Shell:** Top header on desktop (>= 768px), mobile topbar with fixed bottom navigation on mobile (< 768px), and full-screen focus routes.

---

## Technology Stack

- **Framework:** React 19 + Vite 8
- **Routing:** React Router v7
- **Authentication & Database:** Firebase Auth & Cloud Firestore
- **Styling:** Vanilla CSS with CSS Custom Properties and zero hardcoded hex values
- **Testing:** Vitest, `@testing-library/react`, `@testing-library/jest-dom`, JSDOM
- **Linter:** Oxlint

---

## Scripts & Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on `http://localhost:5173/` |
| `npm test` | Runs complete unit and integration test suite via Vitest (24 test suites) |
| `npm run lint` | Runs static code analysis via `oxlint` (0 errors) |
| `npm run build` | Generates Firebase credentials and compiles production bundle into `dist/` |
| `npm run preview` | Previews production compiled bundle locally |

---

## Architecture & Directory Layout

```text
BitHab/
├── .agents/skills/            # Agent development guidelines and workflow skills
├── config/                    # Build-time Firebase configuration & Netlify bundler
├── public/                    # Static assets (images, icons, _redirects)
├── src/
│   ├── assets/css/            # Vanilla CSS design tokens and theme stylesheets
│   ├── components/layout/     # Shell navigation (Header, MobileTopbar, BottomNav, Layout)
│   ├── config/                # Platform integrations (Firebase Auth & Firestore)
│   ├── context/               # React Context state providers (8 contexts)
│   ├── pages/                 # Route page components (13 pages)
│   ├── App.jsx                # App router and providers tree
│   └── main.jsx               # React DOM root entry
├── tests/
│   ├── components/            # Layout and shell navigation unit tests
│   ├── context/               # Context provider lifecycle unit tests
│   ├── pages/                 # Full page integration tests
│   ├── setup.js               # Global JSDOM and Firebase test stubs
│   └── utils/test-utils.jsx   # Testing library utilities and test provider wrappers
├── package.json
└── vite.config.js
```
