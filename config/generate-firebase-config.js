import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAQRnqdskwVceXQvkmJEHfy_pqBxZErojE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "bithab-12345.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "bithab-12345",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "bithab-12345.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "796242878993",
  appId: process.env.FIREBASE_APP_ID || "1:796242878993:web:0d3e4c80569d79175e07b0"
};

// 1. Generate/update src/config/firebase.js
const srcConfigDir = path.join(rootDir, 'src', 'config');
if (!fs.existsSync(srcConfigDir)) {
  fs.mkdirSync(srcConfigDir, { recursive: true });
}

const srcFirebaseContent = `import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
`;

fs.writeFileSync(path.join(srcConfigDir, 'firebase.js'), srcFirebaseContent);
console.log('src/config/firebase.js generated successfully.');

// 2. Generate legacy config/firebase-config.js for backward compatibility
const legacyConfigContent = `// Legacy Firebase config compatibility
const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};
if (typeof firebase !== 'undefined' && firebase.initializeApp) {
  firebase.initializeApp(firebaseConfig);
  const _db = firebase.firestore();
}
`;

fs.writeFileSync(path.join(__dirname, 'firebase-config.js'), legacyConfigContent);
console.log('config/firebase-config.js generated successfully.');

// 3. Trigger Vite build unless explicitly disabled
if (!process.argv.includes('--config-only')) {
  console.log('Building Vite application bundle...');
  execSync('npx vite build', { stdio: 'inherit', cwd: rootDir });
  console.log('Build completed successfully.');
}
