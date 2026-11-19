# BitHab

Personal habit and productivity tracking web application with interactive calendar scheduling, hierarchical goals, and customizable focus sessions.

![BitHab Dashboard](src/assets/hero.png)

## Features

- 📅 **3-column dashboard** combines a multi-calendar scheduler, daily notes editor, and active goals in one unified view.
- 🎯 **Hierarchical goal tracking** breaks ambitions into subgoals with visual progress bars and milestone indicators.
- ⏰ **Timely reminders** notify you of scheduled events with custom dates, recurring intervals, and instant editing modals.
- 📝 **Markdown daily notes** provide fast note taking with search and instant tagging for quick retrieval.
- ⏱️ **Deep focus sessions** offer customizable countdown timers, fullscreen mode, and detailed productivity logs.
- 🎨 **6 adaptive themes** support light and dark modes with customizable color palettes.
- 🔒 **DPDP-compliant data rights** guarantee complete data ownership with single-click JSON export and permanent account deletion.

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

## Author and License

Created by Vishal Muralidharan.

Distributed under the MIT License. Copyright (c) 2025 Vishal Muralidharan.
