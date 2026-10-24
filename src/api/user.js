import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Delete current user account and all personal data via Netlify Serverless Function
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteUserAccount() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found. Please sign in again.');
  }

  // Request fresh ID token to ensure user was recently authenticated
  const idToken = await currentUser.getIdToken(true);

  const response = await fetch('/.netlify/functions/delete-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${response.status}): Failed to delete account.`);
  }

  return response.json();
}

/**
 * Export all personal user data directly from Cloud Firestore client-side
 * @returns {Promise<object>} Complete user data export object
 */
export async function exportUserData() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found. Please sign in again.');
  }

  const uid = currentUser.uid;

  // 1. Fetch Root User Document
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const rootData = userSnap.exists() ? (userSnap.data() || {}) : {};

  // 2. Fetch Daily Notes Subcollection (/users/{uid}/notes)
  const dailyNotes = [];
  try {
    const dailyNotesSnap = await getDocs(collection(db, 'users', uid, 'notes'));
    dailyNotesSnap.forEach(d => dailyNotes.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Export: daily notes subcollection query failed', err);
  }

  // 3. Fetch General Notes Subcollection (/users/{uid}/generalNotes)
  const generalNotes = [];
  try {
    const generalNotesSnap = await getDocs(collection(db, 'users', uid, 'generalNotes'));
    generalNotesSnap.forEach(d => generalNotes.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Export: general notes subcollection query failed', err);
  }

  // 4. Fetch Activity Logs Subcollection (/users/{uid}/logs)
  const logsSubcollection = [];
  try {
    const logsSnap = await getDocs(collection(db, 'users', uid, 'logs'));
    logsSnap.forEach(d => logsSubcollection.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Export: activity logs subcollection query failed', err);
  }

  // 5. Fetch Focus Sessions Subcollection (/users/{uid}/focusSessions)
  const focusSessions = [];
  try {
    const sessionsSnap = await getDocs(collection(db, 'users', uid, 'focusSessions'));
    sessionsSnap.forEach(d => focusSessions.push({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Export: focus sessions subcollection query failed', err);
  }

  // Clean internal metadata fields (e.g. lastUpdatedBy)
  const exportPayload = {
    exported_at: new Date().toISOString(),
    user_id: uid,
    profile: {
      email: currentUser.email,
      display_name: currentUser.displayName || null,
      agreed_to_terms: rootData.agreed_to_terms ?? false,
      agreed_to_terms_at: rootData.agreed_to_terms_at ?? null,
      terms_version: rootData.terms_version ?? null,
      theme: rootData.theme || 'oceanic-depths',
      isDarkMode: Boolean(rootData.isDarkMode)
    },
    activities: rootData.activities || [],
    goals: rootData.goals || [],
    reminders: rootData.reminders || [],
    schedules: rootData.schedules || {},
    logs: {
      calendar_logs: rootData.logs || {},
      daily_log_documents: logsSubcollection
    },
    notes: {
      daily_notes: dailyNotes,
      general_notes: generalNotes,
      legacy_notes: rootData.notes || []
    },
    lists: rootData.lists || [],
    focus_data: rootData.focusData || {},
    focus_sessions: focusSessions
  };

  return exportPayload;
}

/**
 * Record user affirmative consent to terms of service and privacy policies
 * @param {string} version Terms version string
 * @returns {Promise<{ success: boolean, version: string }>}
 */
export async function acceptTerms(version = '2026-10-24') {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user found. Please sign in again.');
  }

  const userRef = doc(db, 'users', currentUser.uid);
  await setDoc(userRef, {
    agreed_to_terms: true,
    agreed_to_terms_at: serverTimestamp(),
    terms_version: version
  }, { merge: true });

  return { success: true, version };
}
