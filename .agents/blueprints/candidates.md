# Blueprint Rule Candidates

Proposed candidates from codebase facts. User confirmation required before adding to profile.

- **ui-no-native-checkbox** (design): Avoid raw HTML native checkbox control; use the themed primitive.
  - Evidence: `Found 5 native checkbox uses outside primitives.`
- **ui-no-native-pickers** (design): Never use native browser date, time, month, week, datetime-local or color inputs. Use the project's themed picker primitives.
  - Evidence: `Found 3 native picker uses outside primitives: src/pages/Notes.jsx:144, src/pages/Reminders.jsx:301, src/pages/Reminders.jsx:422`
- **ui-no-native-pickers** (design): Never use native browser date, time, month, week, datetime-local or color inputs. Use the project's themed picker primitives.
  - Evidence: `Found 2 native picker uses outside primitives: src/pages/Reminders.jsx:315, src/pages/Reminders.jsx:436`
- **ui-no-native-pickers** (design): Never use native browser date, time, month, week, datetime-local or color inputs. Use the project's themed picker primitives.
  - Evidence: `Found 2 native picker uses outside primitives: src/pages/Activities.jsx:227, src/pages/Activities.jsx:299`
- **ui-no-native-selects** (design): Avoid raw HTML <select>; use the design system Select primitive.
  - Evidence: `Found 4 native select uses outside primitives: src/pages/Dashboard.jsx:842, src/pages/Dashboard.jsx:860, src/pages/Dashboard.jsx:873`
- **ui-no-native-textarea** (design): Avoid raw HTML native textarea control; use the themed primitive.
  - Evidence: `Found 2 native textarea uses outside primitives.`
- **process-primitive-gap-dialog** (process): Create the primitive first, in its own commit, before using the control.
  - Evidence: `Low-level widget (Modal) exists without a themed dialog primitive.`
