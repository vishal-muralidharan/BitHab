# BitHab

BitHab is a personal habit and productivity tracking web application with habit analytics, scheduling, and customizable focus sessions.

## Features

- Dashboard: 3-column desktop layout with an interactive calendar, daily notes quick editor, and active goals and reminders.
- Activities and Scheduling: Hierarchical activities and subactivities with custom color palettes and a monthly schedule planner.
- Goals Tracking: Main goals and subgoals with progress percentage calculations.
- Reminders: Time-based reminders with date selection, status tracking, and editing modals.
- Daily Notes: Markdown-friendly note taking with a favorites filter and search.
- Flexible Lists: Checklists, task lists, numbered lists, and bulleted lists.
- Focus and Deep Focus: Digital clock, countdown session timers, fullscreen focus mode, and session analytics.
- Multi-Theme System: 6 visual themes with support for light and dark modes.
- Responsive Navigation: Dual navigation with a desktop header and a mobile bottom navigation bar.
- Settings and Data Rights: Profile settings, DPDP Act 2023 compliant JSON data export, and permanent account deletion.

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Firebase Authentication and Cloud Firestore
- Netlify Functions and Firebase Admin SDK
- Vanilla CSS with CSS custom properties
- Vitest and React Testing Library
- Oxlint

## Getting Started

### Prerequisites

- Node.js version 20 or later
- npm

### Install

Install dependencies with npm:

```bash
npm install
```

Or run:

```bash
npm ci
```

### Environment Variables

Configure these environment variables in your environment or local configuration:

- `FIREBASE_API_KEY`
- `FIREBASE_APP_ID`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_SERVICE_ACCOUNT`
- `FIREBASE_SERVICE_ACCOUNT_KEY`
- `FIREBASE_STORAGE_BUCKET`

Do not commit secret values or environment files to version control.

### Run

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

## Scripts

Every command matches a script in `package.json` or a command on the project card:

- `npm run dev`: starts the Vite development server.
- `npm run build`: generates the Firebase configuration and builds the production bundle with Vite.
- `npm run lint`: runs static code analysis with Oxlint.
- `npm run test`: runs the Vitest test suite.
- `npm run preview`: previews the production build locally.

## Tests

The project uses Vitest with React Testing Library and JSDOM. It includes 28 test files and 87 test cases covering components, context providers, and page flows.

Run the test suite:

```bash
npm run test
```

Or run:

```bash
npm test
```

Run the linter:

```bash
npm run lint
```

## Project Structure

```text
BitHab/
├── config/             # Build-time Firebase configuration generator
├── docs/               # Architecture and data documentation
├── netlify/
│   └── functions/      # Serverless functions for account deletion
├── public/             # Static web assets and redirect rules
├── src/
│   ├── api/            # API client helpers
│   ├── assets/         # CSS design tokens, global styles, and images
│   ├── components/     # Reusable UI and layout components
│   ├── config/         # Firebase client initialization
│   ├── context/        # React context providers for app state
│   ├── pages/          # Application route views
│   ├── App.jsx         # Root router component
│   └── main.jsx        # Application entry point
├── tests/              # Vitest test suites and setup files
├── firestore.rules     # Firestore security rules
├── index.html          # HTML entry point
├── netlify.toml        # Netlify deployment configuration
├── package.json        # Project dependencies and scripts
└── vite.config.js      # Vite and Vitest configuration
```

## Deployment

The application deploys to Netlify.

- Build command: `node config/generate-firebase-config.js`
- Publish directory: `dist`
- Serverless functions directory: `netlify/functions`
- Client side routing: configured via `netlify.toml` with redirect rules pointing `/*` to `/index.html` with status 200.
