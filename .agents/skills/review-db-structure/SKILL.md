---
name: review-db-structure
description: >-
  Use this skill whenever reading, writing, modifying, or refactoring database models,
  documents, fields, or Firestore queries in BitHab. Ensures strict alignment with the canonical
  schemas in /users/{userId} and focusSessions, prevents undefined field errors, guarantees
  backward compatibility, and enforces clean onSnapshot listener detachment.
---

# Review Database Structure & Firestore Schema Integrity

This skill defines the canonical database architecture, document schemas, payload sanitization rules, and modification checklist for the **BitHab** repository. Use it whenever implementing or updating any feature that touches Firestore.

---

## 1. Canonical Database Architecture

BitHab uses Google Cloud Firestore in native mode. Application data is organized under the authenticated user's document and a dedicated focus session history subcollection:

```text
Firestore Root
└── /users/{userId}                         # Main user document (keyed by Auth UID)
    ├── activities: Array<Activity>         # Activities and subactivities catalog
    ├── goals: Array<Goal>                  # Goals, subgoals, and completion states
    ├── reminders: Array<Reminder>          # Datetime reminders catalog
    ├── notes: Array<Note>                  # Daily notes (linked by date) and general notes
    ├── lists: Array<List>                  # Multi-type checklists, todos, and bulleted lists
    ├── schedules: Record<DateStr, Array>   # Planned activity/subactivity IDs per date
    ├── logs: Record<DateStr, Array>        # Completed activity/subactivity IDs per date
    ├── focusData: FocusData                # Focus room subjects, tasks, and target duration
    ├── theme: string                       # Active theme ('default', 'ocean', etc.)
    ├── isDarkMode: boolean                 # Dark mode toggle preference
    │
    ├── /notes/{dateStr}                    # Daily notes subcollection (legacy & dual-write compatibility)
    │   ├── content / note: string          # Note text
    │   ├── date: string                    # Date string "YYYY-MM-DD"
    │   ├── favorite / isFavorite: boolean  # Favorite flag
    │   └── updatedAt: ISOString
    │
    ├── /generalNotes/{noteId}              # General notes subcollection (legacy & dual-write compatibility)
    │   ├── id: string                      # Unique note ID
    │   ├── title: string                   # Note title
    │   ├── content / note: string          # Note text
    │   ├── favorite / isFavorite: boolean  # Favorite flag
    │   └── updatedAt: ISOString
    │
    ├── /logs/{dateStr}                     # Activity daily log subcollection (legacy/subcollection compatibility)
    │   ├── activityIds: Array<string>      # Completed activity/subactivity IDs
    │   └── completed: boolean              # Daily completion flag
    │
    └── /focusSessions/{sessionId}          # Focus session log documents (subcollection)
        ├── userId: string
        ├── startTime: ISOString
        ├── endTime: ISOString
        ├── duration: number                # Session duration in minutes
        ├── subject: string | null          # Primary subject studied
        ├── goalId: string | null           # Primary task worked on
        ├── deep: boolean                   # True if recorded from Deep Focus mode
        ├── targetDuration: number          # Target duration in minutes
        ├── completed: boolean              # True if reached target duration
        ├── date: string                    # Date string "YYYY-MM-DD"
        └── createdAt: ISOString
```

---

## 2. Document Schemas & Field Shapes

### 1. `Activity` Schema
```typescript
interface Activity {
  id: string;                               // Unique activity ID (timestamp or string)
  name: string;                             // Activity name (e.g. "Work", "Exercise")
  subActivities?: Array<{
    id: string;                             // Unique subactivity ID
    name: string;                           // Subactivity name (e.g. "Cardio", "Weights")
    color: string;                          // Hex color string for calendar dots and tags
  }>;
}
```

### 2. `Goal` Schema (With Backward Compatibility)
```typescript
interface Goal {
  id: string;                               // Unique goal ID
  name: string;                             // Goal title / name
  title?: string;                           // Legacy alias for name (must be supported)
  completed: boolean;                       // Completion flag
  subgoals?: Array<{
    id: string;                             // Subgoal ID
    name: string;                           // Subgoal title
    completed: boolean;                     // Subgoal completion flag
  }>;
  // Legacy fields (gracefully supported)
  current?: number;
  target?: number;
}
```

### 3. `Reminder` Schema & Datetime State Evaluation
```typescript
interface Reminder {
  id: string;                               // Unique reminder ID
  text: string;                             // Reminder description
  date: string;                             // Target date "YYYY-MM-DD"
  time: string;                             // Target time "HH:mm" (24-hour)
  completed: boolean;                       // Completion toggle
}

// Datetime State Calculation:
// const isReminderActive = (dateStr, timeStr) => {
//   const reminderDateTime = new Date(`${dateStr}T${timeStr}`);
//   return !isNaN(reminderDateTime.getTime()) && reminderDateTime > new Date();
// };
// Quick Selectors: "Today" (offset 0), "Tomorrow" (offset +1), "Next Week" (offset +7).
```

### 4. `Note` Schema & Multi-Source Synchronization (Subcollections & Root Doc)
```typescript
interface Note {
  id: string;                               // Unique note ID (date string "YYYY-MM-DD" for daily, uuid for general)
  title?: string;                           // Note title (for general notes or date string)
  content: string;                          // Note text content (legacy alias: note)
  type: 'daily' | 'general';                // Daily note (linked to date) or general note
  date?: string | null;                     // "YYYY-MM-DD" (required for daily notes)
  favorite?: boolean;                       // Starred/favorited flag
  isFavorite?: boolean;                     // Starred/favorited legacy alias
  createdAt?: string | number;              // Timestamp
  updatedAt?: string | number;              // Timestamp
}

// Multi-Source Note Loading & Sync Pipeline:
// 1. Initial Load: NoteContext concurrently reads root user document (docSnap.data().notes,
//    dailyNotes, generalNotes) and subcollections (/users/{userId}/notes and /users/{userId}/generalNotes).
// 2. Normalization: Subcollection docs with date IDs (e.g. "2026-10-24") or date fields are normalized
//    to type 'daily' with date set. General notes are normalized to type 'general'.
// 3. Merging: Root notes and subcollection notes are merged and deduplicated.
// 4. Persistence: Subcollection notes are auto-synced back to doc(db, 'users', uid).notes, and
//    saveNote dual-writes daily notes to /users/{userId}/notes/{date} and general notes to /users/{userId}/generalNotes/{id}.
```

### 5. `List` Schema
```typescript
interface List {
  id: string;                               // Unique list ID
  title: string;                            // List title
  type: 'checklist' | 'todo' | 'numbered' | 'bulleted'; // List presentation type
  items: Array<{
    id: string;                             // Unique item ID
    text: string;                           // Item text
    completed: boolean;                     // Item completion toggle
  }>;
}
```

### 6. `FocusData` Schema
```typescript
interface FocusData {
  subjects: Array<string>;                  // Subjects entered in Focus mode
  tasks: Array<string>;                     // Tasks entered in Focus mode
  completedTasks: Record<string, boolean>;  // Map of task name -> completed state
  targetDuration: number;                   // Target session duration in minutes (default 25)
  lastUpdated?: number;                     // Timestamp
}
```

### 7. Activity Daily Log Schema & Inline Logging Mechanism
```typescript
// On root user doc:
// logs: Record<DateStr, Array<string>>    // Map of "YYYY-MM-DD" to list of logged activity/subactivity IDs

// In subcollection /users/{userId}/logs/{dateStr}:
interface ActivityDailyLogDoc {
  activityIds: Array<string>;               // Logged activity or subactivity IDs
  completed?: boolean;                      // True if day marked completed
  updatedAt?: string;                       // ISOString
}

// Inline Activity Logging Data Flow:
// 1. Dashboard displays inline activity pills for selectedDateStr without redirecting to a modal.
// 2. toggleActivityLog(subActivityId, selectedDateStr):
//    - Toggles existence of subActivityId in logs[selectedDateStr].
//    - Immediately writes updated logs map to doc(db, 'users', uid).
// 3. Calendar Day Cell Sync:
//    - Calendar extracts logged IDs for each visible day cell.
//    - Matches IDs against subactivity color catalog to render real-time color dots.
```

### 8. Calendar Activity Dot Filtering & Subactivity Scoping
```typescript
// Selected Activity Filter Architecture:
// When an activity is selected in Dashboard (via #activity-select in picker modal or clicking activity item):
// visibleActivityIds: Array<string> | null = selectedActivityId
//   ? [selectedActivityId, ...(selectedActivity?.subActivities?.map(s => s.id) || [])]
//   : null;

// Calendar Dot Rendering Filter:
// const dayLogs = (logs[dateStr] || []).filter(id => !visibleActivityIds || visibleActivityIds.includes(id));

// Dot Matching Logic:
// 1. Find matching subactivity across activities catalog:
//    const sub = allSubactivities.find(s => s.id === logId);
// 2. Render dot with subactivity color (or primary color fallback):
//    style={{ backgroundColor: sub?.color || 'var(--primary-color)' }}
// 3. When filtered, users can isolate and inspect month-by-month habit streaks for a single activity.
```

### 9. Multi-Source Notes Synchronization Pipeline
```typescript
// Dual-Storage Synchronization Model in NoteContext.jsx:
// BitHab supports both modern subcollections and legacy root document notes:
// 1. Primary Sources:
//    - Daily Notes: /users/{userId}/notes/{dateStr} (keyed by date string YYYY-MM-DD)
//    - General Notes: /users/{userId}/generalNotes/{noteId} (auto-ID or timestamp ID)
// 2. Legacy Fallback Source:
//    - Root Document Field: /users/{userId}.notes (Array<NoteItem>)
// 3. Bi-directional Synchronization:
//    - On user sign-in, NoteContext attaches real-time onSnapshot listeners to subcollections.
//    - Concurrently reads legacy root doc notes and merges non-conflicting items.
//    - Prevents data loss during migration while maintaining backward compatibility.
```

---

## 3. Strict Firestore Guardrails

### 1. Never Pass `undefined` to Firestore
Firestore throws an immediate unhandled exception (`Unsupported field value: undefined`) when any property in an object passed to `setDoc`, `updateDoc`, or `addDoc` is `undefined`. Always sanitize payload objects with `null` or explicit fallbacks:
```javascript
const sanitizeNotePayload = (note) => ({
  id: note.id || String(Date.now()),
  title: note.title ? String(note.title).trim() : '',
  content: note.content ? String(note.content).trim() : '',
  type: note.type === 'daily' ? 'daily' : 'general',
  date: note.date || null,
  isFavorite: Boolean(note.isFavorite),
  createdAt: note.createdAt || new Date().toISOString()
});
```

### 2. Backward Compatibility Is Mandatory
* Never drop support for legacy fields present in existing user accounts.
* When reading goals: always support `goal.name || goal.title`.
* When reading subactivities: handle cases where `subActivities` is `undefined` or null by defaulting to `[]`.
* When reading notes: support both `isFavorite` and `favorite`.

### 3. Subscription Detachment & Unmount Safety
Every Firestore `onSnapshot` listener attached in a React context or component must return an explicit unsubscribe cleanup function:
```javascript
useEffect(() => {
  if (!currentUser) return;
  const userRef = doc(db, 'users', currentUser.uid);
  const unsubscribe = onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      // update state
    }
  }, (err) => {
    console.error('Firestore listener error:', err);
  });

  return () => unsubscribe(); // Mandatory cleanup
}, [currentUser]);
```

---

## 4. Canonical Reusable Test User Firestore Schemas

To avoid creating extraneous user documents in Firestore, all testing, seed operations, and local verification MUST bind to the canonical test user accounts:

| User Account | UID Pattern | Associated Collections & Seeded State |
| :--- | :--- | :--- |
| **`test@bithab.com`** | Primary Firebase Auth UID | Seeded with complete `/users/{userId}` structure: active activities catalog, multi-stage goals, daily notes, and `/focusSessions` subcollection. Always reuse this account for live development checks. |
| **`testuser999@example.com`** | Secondary Firebase Auth UID | Fallback user document for multi-account concurrency and edge case validation. |
| **`test@bithab.local`** | `test-user-123` | Canonical mock user ID used across Vitest unit tests in [tests/setup.js](file:///Users/VM/Projects%20-%20Curr/BitHab/tests/setup.js). |

**Rule:** When seeding mock data, testing real-time listeners, or inspecting database models, bind documents to these persistent test accounts rather than generating new account roots on every test run.

---

## 5. Pre-Commit Database Checklist

Before committing any DB-related change, verify:
```text
[ ] 1. No undefined values in Firestore payloads (sanitized with null or default fallbacks).
[ ] 2. Backward compatibility preserved for existing user documents (goals name/title, notes, subactivities).
[ ] 3. All onSnapshot subscriptions return an unsubscriber in useEffect cleanup.
[ ] 4. Subcollection queries (e.g. focusSessions) use correct parent user UID paths.
[ ] 5. State updates from Firestore handle empty or newly created user accounts gracefully.
[ ] 6. Canonical test users (test@bithab.com, test-user-123) preserved for testing and validation.
[ ] 7. Calendar activity dot filtering respects visibleActivityIds for parent activity and child subactivities.
[ ] 8. Dual-source note sync guarantees data integrity across subcollections and legacy root doc notes.
```

