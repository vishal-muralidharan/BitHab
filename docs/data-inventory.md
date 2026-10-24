# BitHab Personal Data Inventory

This document defines the exhaustive inventory of all personal and application data collected, processed, and stored by **BitHab**. It serves as the single source of truth for the Privacy Policy, Digital Personal Data Protection (DPDP) Act disclosures, and the user data export tool.

---

## 1. Data Classification & Firestore Storage Mapping

| Category | Storage Path | Field Details | Purpose | Retention |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Profile** | Firebase Auth & `/users/{userId}` | `uid`, `email`, `displayName`, `photoURL`, `providerId`<br>• `agreed_to_terms` (boolean)<br>• `agreed_to_terms_at` (timestamp)<br>• `terms_version` (string) | Account creation, authentication, session security, affirmative legal consent | Retained until user deletes account |
| **Preferences & Theme** | `/users/{userId}` & `localStorage` (`bithab_theme_prefs`) | • `theme` (string, e.g. `'oceanic-depths'`)<br>• `isDarkMode` (boolean)<br>• `lastUpdated` (number) | UI appearance, dark/light mode persistence | Retained until user deletes account |
| **Activities & Habits** | `/users/{userId}` (`activities`) | Array of activities:<br>• `id` (string)<br>• `name` (string)<br>• `subActivities` (`id`, `name`, `color` hex) | Habit catalog and custom subcategory tracking | Retained until user deletes account or item |
| **Goals & Milestones** | `/users/{userId}` (`goals`) | Array of goals:<br>• `id` (string)<br>• `name` / legacy `title` (string)<br>• `completed` (boolean)<br>• `subgoals` (`id`, `name`, `completed`) | Goal management and task breakdown | Retained until user deletes account or item |
| **Reminders** | `/users/{userId}` (`reminders`) | Array of reminders:<br>• `id` (string)<br>• `text` (string)<br>• `date` ("YYYY-MM-DD")<br>• `time` ("HH:mm")<br>• `completed` (boolean)<br>• `createdAt` (number) | In-app schedule reminders (no external push/email) | Retained until user deletes account or item |
| **Schedules & Logs** | `/users/{userId}` (`schedules`, `logs`) & `/users/{userId}/logs/{dateStr}` | • `schedules`: Record<DateStr, Array<string>><br>• `logs`: Record<DateStr, Array<string>><br>• Subcollection docs: `activityIds`, `completed`, `updatedAt` | Daily habit tracking, planned schedules, and calendar heatmaps | Retained until user deletes account |
| **Notes** | `/users/{userId}/notes/{dateStr}` & `/users/{userId}/generalNotes/{noteId}` & `/users/{userId}.notes` | • Daily notes: `content`, `date`, `isFavorite`, `updatedAt`<br>• General notes: `id`, `title`, `content`, `isFavorite`, `updatedAt` | Personal daily reflection and markdown notes | Retained until user deletes account or item |
| **Lists** | `/users/{userId}` (`lists`) | Array of lists:<br>• `id` (string)<br>• `title` (string)<br>• `type` (`checklist` \| `todo` \| `numbered` \| `bulleted`)<br>• `items` (`id`, `text`, `completed`) | Checklists, todo items, and bullet points | Retained until user deletes account or item |
| **Focus Sessions & Analytics** | `/users/{userId}` (`focusData`) & `/users/{userId}/focusSessions/{sessionId}` | • `focusData`: `subjects`, `tasks`, `completedTasks`, `targetDuration`<br>• `focusSessions`: `userId`, `startTime`, `endTime`, `duration` (min), `subject`, `goalId`, `deep`, `targetDuration`, `completed`, `date`, `createdAt` | Focus timer, deep focus sessions, productivity analytics | Retained until user deletes account |

---

## 2. In-App vs External Data Processing

- **Third-Party Data Processors:**
  1. **Google Firebase / Google Cloud:** Provides Firebase Authentication and Cloud Firestore databases.
  2. **Netlify:** Hosts web application static assets and executes serverless API functions (`delete-account`).
- **No Third-Party Analytics / Tracking:** BitHab does not use Google Analytics, cookies for marketing, tracking pixels, or third-party advertising SDKs.
- **In-App Reminders:** All reminders operate purely in-app through Firestore listeners; no external push notifications, emails, or SMS messages are dispatched.
- **Client Storage:** `localStorage` is used solely for the active visual theme (`bithab_theme_prefs`).

---

## 3. Data Export Scope & Exclusions

When executing `exportUserData(uid)`:
- **Included Collections/Documents:** User profile document, activities, goals, reminders, schedules, logs, daily notes, general notes, lists, focus data, and focus sessions.
- **Excluded Fields:** Internal metadata attributes such as `lastUpdatedBy`.
- **Format:** Sanitized JSON (`bithab-data-export-YYYY-MM-DD.json`).

---

## 4. Account Deletion Scope

When a user requests account deletion:
- Serverless function `delete-account` invokes Firebase Admin SDK to recursively delete:
  1. `/users/{userId}` root document.
  2. `/users/{userId}/notes` subcollection.
  3. `/users/{userId}/generalNotes` subcollection.
  4. `/users/{userId}/logs` subcollection.
  5. `/users/{userId}/focusSessions` subcollection.
  6. The Firebase Authentication user record (`admin.auth().deleteUser(uid)`).
