import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK using Netlify environment credentials
 */
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountRaw) {
    try {
      const serviceAccount = typeof serviceAccountRaw === 'string'
        ? JSON.parse(serviceAccountRaw)
        : serviceAccountRaw;

      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', err);
    }
  }

  // Fallback to default application credentials if configured in environment
  return admin.initializeApp();
}

/**
 * Netlify Serverless Function: delete-account
 * Deletes user's Firestore data and Auth record using Firebase Admin SDK
 */
export const handler = async (event) => {
  // 1. Accept POST requests only
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      },
      body: JSON.stringify({ error: 'Method Not Allowed. Only POST requests are accepted.' })
    };
  }

  // 2. Extract and verify Bearer token
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized: Missing or invalid Bearer token.' })
    };
  }

  const idToken = authHeader.split('Bearer ')[1].trim();

  let uid;
  try {
    getFirebaseAdmin();
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    uid = decodedToken.uid;
  } catch (err) {
    console.error('Token verification error:', err);
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized: Failed to verify authentication token.' })
    };
  }

  // 3. Delete all Firestore data for user (root profile and subcollections)
  // A failure here is logged but non-fatal
  try {
    const firestore = admin.firestore();
    const userDocRef = firestore.doc(`users/${uid}`);

    if (typeof firestore.recursiveDelete === 'function') {
      await firestore.recursiveDelete(userDocRef);
    } else {
      await userDocRef.delete();
    }
    console.log(`Successfully deleted Firestore data for user: ${uid}`);
  } catch (err) {
    console.warn(`Non-fatal warning: Error deleting Firestore documents for user ${uid}:`, err);
  }

  // 4. Delete Auth user record
  // This step is fatal: return 500 if it fails
  try {
    await admin.auth().deleteUser(uid);
    console.log(`Successfully deleted Auth user record for: ${uid}`);
  } catch (err) {
    console.error(`Fatal error: Failed to delete Auth user ${uid}:`, err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to delete user authentication record. Please try again or contact support.' })
    };
  }

  // 5. Return success
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      success: true,
      message: 'Account and associated personal data deleted successfully.'
    })
  };
};
