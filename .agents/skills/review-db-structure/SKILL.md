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

### 3. `Reminder` Schema
```typescript
interface Reminder {
  id: string;                               // Unique reminder ID
  text: string;                             // Reminder description
  date: string;                             // Target date "YYYY-MM-DD"
  time: string;                             // Target time "HH:mm" (24-hour)
  completed: boolean;                       // Completion toggle
}
```

### 4. `Note` Schema (With Legacy Object & Subcollection Compatibility)
```typescript
interface Note {
  id: string;                               // Unique note ID
  title?: string;                           // Note title (for general notes or date string)
  content: string;                          // Note text content (legacy alias: note)
  type: 'daily' | 'general';                // Daily note (linked to date) or general note
  date?: string | null;                     // "YYYY-MM-DD" (required for daily notes)
  favorite?: boolean;                       // Starred/favorited flag
  isFavorite?: boolean;                     // Starred/favorited legacy alias
  createdAt?: string | number;              // Timestamp
  updatedAt?: string | number;              // Timestamp
}

// Legacy format compatibility:
// Legacy accounts may store notes as an Object map on user doc: { [dateStr]: text }
// Daily notes are also dual-written to subcollection /users/{userId}/notes/{dateStr} for backward compatibility.
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

## 4. Pre-Commit Database Checklist

Before committing any DB-related change, verify:
```text
[ ] 1. No undefined values in Firestore payloads (sanitized with null or default fallbacks).
[ ] 2. Backward compatibility preserved for existing user documents (goals name/title, notes, subactivities).
[ ] 3. All onSnapshot subscriptions return an unsubscriber in useEffect cleanup.
[ ] 4. Subcollection queries (e.g. focusSessions) use correct parent user UID paths.
[ ] 5. State updates from Firestore handle empty or newly created user accounts gracefully.
```
