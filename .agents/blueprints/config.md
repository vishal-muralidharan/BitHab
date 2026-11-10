# Config Blueprint

Extracted environment variables, project scripts, and route mappings.

## Environment variables

- `FIREBASE_API_KEY` (referenced: `config/generate-firebase-config.js:11`)
- `FIREBASE_APP_ID` (referenced: `config/generate-firebase-config.js:16`)
- `FIREBASE_AUTH_DOMAIN` (referenced: `config/generate-firebase-config.js:12`)
- `FIREBASE_MESSAGING_SENDER_ID` (referenced: `config/generate-firebase-config.js:15`)
- `FIREBASE_PROJECT_ID` (referenced: `config/generate-firebase-config.js:13`)
- `FIREBASE_SERVICE_ACCOUNT` (referenced: `netlify/functions/delete-account.js:11`)
- `FIREBASE_SERVICE_ACCOUNT_KEY` (referenced: `netlify/functions/delete-account.js:11`)
- `FIREBASE_STORAGE_BUCKET` (referenced: `config/generate-firebase-config.js:14`)

## Package scripts

- `build`: `node config/generate-firebase-config.js` (`package.json:1`)
- `dev`: `vite` (`package.json:1`)
- `lint`: `oxlint` (`package.json:1`)
- `preview`: `vite preview` (`package.json:1`)
- `test`: `vitest run` (`package.json:1`)

## Routes

- No explicit server routes detected.

<!-- BEGIN CUSTOM: contracts -->
<!-- END CUSTOM: contracts -->
