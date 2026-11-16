---
name: review-db-structure
description: Use this skill whenever you read, write or change data models, schemas, storage keys or payloads in bithab. Lists the invariants and the items that need approval to change.
---
<!-- build-forge:generated v1 body=c47e2a22f22f9f32f96f5a1f105583c8245d005f6ad8da1d1251e448a4942bed -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# Data rules for bithab

## Blueprint

Query codebase data models and storage facts on demand:
`python3 .agents/skills/project-blueprints/scripts/blueprint.py show --area data --paths <files>`

Storage: Google Cloud Firestore in native mode.
Schema source: `firestore.rules`. Read it before you change any data shape.

## Invariants

- User data is strictly keyed under /users/{userId}.
- Payloads must never contain undefined values (sanitize before write).
- All onSnapshot subscriptions must return a cleanup function in useEffect.
- Focus session logs are recorded in /users/{userId}/focusSessions.

## Ask before changing

- Firestore collection structure
- User root document fields
- Focus session schema

## Rules

- Never write undefined to Firestore; sanitize payloads before writing. `[firestore-no-undefined]`
- All onSnapshot subscriptions must return cleanup functions on unmount. `[firestore-cleanup-listeners]`
<!-- BEGIN CUSTOM: notes -->
## Canonical Database Architecture

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
    ├── agreed_to_terms: boolean            # User consent flag for terms & privacy policies
    ├── agreed_to_terms_at: Timestamp       # Server timestamp of consent acceptance
    ├── terms_version: string               # Version string of accepted terms (e.g. '2026-10-24')
    │
    ├── /notes/{dateStr}                    # Daily notes subcollection (legacy & dual-write compatibility)
    ├── /generalNotes/{noteId}              # General notes subcollection (legacy & dual-write compatibility)
    ├── /logs/{dateStr}                     # Activity daily log subcollection (legacy/subcollection compatibility)
    │
    └── /focusSessions/{sessionId}          # Focus session log documents (subcollection)
        ├── userId: string
        ├── startTime: ISOString
        ├── endTime: ISOString
        ├── duration: number                # Session duration in minutes
        ├── subject: string | null          # Primary subject studied
        ├── goalId: string | null           # Primary task worked on
        └── completed: boolean              # Completed status
```

## Operational Guidelines
- **Payload Sanitization:** Firestore throws errors on `undefined` fields. Always delete `undefined` keys or convert them to `null` or default values before dispatching writes.
- **Listener Cleanup:** Every `onSnapshot` subscription in a React hook or `useEffect` must return its unsubscribe function:
  ```javascript
  useEffect(() => {
    if (!currentUser) return;
    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      // update state
    });
    return () => unsubscribe();
  }, [currentUser]);
  ```
- **Backward Compatibility:** Maintain compatibility across schema evolutions (e.g., support both `name` and `title` on Goal models, and both `content` and `note` on Note models).
<!-- END CUSTOM: notes -->
