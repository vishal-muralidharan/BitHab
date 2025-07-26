// Script to generate firebase-config.js from environment variables
const fs = require('fs');

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const configString = `const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)};\nfirebase.initializeApp(firebaseConfig);\nvar db = firebase.firestore();\n`;

fs.writeFileSync('firebase-config.js', configString);
console.log('firebase-config.js generated!');
