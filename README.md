# BitHab

BitHab is a modern, responsive personal habit and productivity tracking web application built with React, Vite, Firebase Firestore/Auth, and a Vanilla CSS multi-theme design system.

---

## Features

- **Dashboard:** Fixed viewport 3-column layout on desktop, interactive calendar with activity name header, centered weekday columns, clickable date header opening the year/month/activity picker modal, outside-click date dismissal, inline activity logging with date-filtered pills, daily notes quick-editor, and goals/reminders tracking.
- **Activities & Scheduling:** Hierarchical activities and sub-activities with customizable color palettes and monthly scheduling calendar.
- **Goals Tracking:** Main goals with subgoals, completion percentage tracking, and legacy schema normalization.
- **Reminders:** Scheduled time-based reminders with quick date selectors, datetime picker modal, active status detection, and modal editing.
- **Notes System:** Daily notes and general thought capture with inline markdown-friendly text editor, favorites filter, and multi-source synchronization across legacy subcollections (`/notes`, `/generalNotes`) and root document.
- **Flexible Lists:** Checklists, todo lists, numbered lists, and bulleted lists.
- **Focus & Deep Focus:** Digital clock with motivational quotes, task management, countdown session timer, and focus analytics.
- **Multi-Theme Gallery:** 6 themes (`oceanic-depths`, `evergreen-forest`, `cyberpunk-neon`, `monochrome-minimalist`, `sunrise-coral`, `cherry-blossom`) with seamless Dark and Light mode toggling.
- **Dual-Navigation Shell:** Top header on desktop (>= 768px), mobile topbar with fixed bottom navigation on mobile (< 768px), and full-screen focus routes.
- **Settings & Account Management:** Comprehensive user settings (`/settings`) with profile credentials, theme gallery shortcuts, Dark/Light mode toggle, legal document links, support contact, and an authenticated Danger Zone for permanent account deletion.
- **DPDP Data Rights & Export:** Dedicated Manage My Data page (`/dpdp`) complying with India's Digital Personal Data Protection (DPDP) Act, 2023, featuring plain-language data processing breakdowns, statutory rights explanations, automated JSON data exports (`bithab-data-export-YYYY-MM-DD.json`), and Grievance Redressal information.
- **Public Legal Pages:** Dedicated legal documents with public navigation (`PublicLegalLayout` and `LegalFooter`), including Terms of Service (`/terms`), Privacy Policy (`/privacy`), and Terms & Conditions (`/terms-and-conditions`).
- **Serverless Account Deletion:** Secure Netlify serverless function (`delete-account.js`) utilizing Firebase Admin SDK for recursive Firestore cleanup and permanent Firebase Auth record deletion.
- **Terms Consent Gate:** Mandatory signup terms agreement and modal dialog (`TermsAgreementModal`) prompting existing unconsented accounts to accept updated terms and privacy policies.

---

## Technology Stack

- **Framework:** React 19 + Vite 8
- **Routing:** React Router v7
- **Authentication & Database:** Firebase Auth & Cloud Firestore
- **Serverless Backend:** Netlify Functions + Firebase Admin SDK
- **Styling:** Vanilla CSS with CSS Custom Properties and zero hardcoded hex values
- **Testing:** Vitest, `@testing-library/react`, `@testing-library/jest-dom`, JSDOM
- **Linter:** Oxlint

---

## Scripts & Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on `http://localhost:5173/` |
| `npm test` | Runs complete unit and integration test suite via Vitest (28 test suites, 87 tests) |
| `npm run lint` | Runs static code analysis via `oxlint` (0 errors) |
| `npm run build` | Generates Firebase credentials and compiles production bundle into `dist/` |
| `npm run preview` | Previews production compiled bundle locally |

---

## Architecture & Directory Layout

```text
BitHab/
├── .agents/skills/            # Agent development guidelines and workflow skills
├── config/                    # Build-time Firebase configuration & Netlify bundler
├── docs/                      # Data inventory and architectural maps
├── netlify/functions/         # Netlify serverless functions (Firebase Admin delete-account)
├── public/                    # Static assets (images, icons, _redirects)
├── src/
│   ├── api/                   # API helpers (account deletion, data export, terms consent)
│   ├── assets/css/            # Vanilla CSS design tokens and theme stylesheets
│   ├── components/            # UI components (ConfirmModal, LegalFooter, TermsAgreementModal)
│   ├── components/layout/     # Shell navigation (Header, MobileTopbar, BottomNav, Layout)
│   ├── config/                # Platform integrations (Firebase Auth & Firestore)
│   ├── context/               # React Context state providers (8 contexts)
│   ├── pages/                 # Route page components (18 pages)
│   ├── App.jsx                # App router and providers tree
│   └── main.jsx               # React DOM root entry
├── tests/
│   ├── components/            # Layout and shell navigation unit tests
│   ├── context/               # Context provider lifecycle unit tests
│   ├── pages/                 # Full page integration tests
│   ├── setup.js               # Global JSDOM and Firebase test stubs
│   └── utils/test-utils.jsx   # Testing library utilities and test provider wrappers
├── firestore.rules            # Firestore security rules enforcing owner-only access
├── package.json
└── vite.config.js
```
