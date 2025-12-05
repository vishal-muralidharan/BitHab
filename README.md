# BitHab

BitHab is a habit-tracking dashboard that brings together activities, goals, reminders, notes, focus sessions, and themes in a single progressive workspace. The project is built as a lightweight web app that can be hosted statically while persisting data through Firebase.

## ✨ Features

- **One home base** that shows today’s activities, notes, goals, reminders, and calendar in a single glance.
- **Notes that remember** with instant save, date shortcuts, and buttons that stay visible even when the text is long.
- **Activity streaks** that track main tasks and sub tasks while colouring the calendar so progress is easy to spot.
- **Goals at a glance** with simple status colours for what’s pending, in motion, or done.
- **Reminders that nudge** highlighting what’s coming up next and what needs your attention right now.
- **Focus timer** for distraction-free sessions that adapts to the theme you choose.
- **Themes for every mood** including dark/light switches that update the whole app smoothly.
- **Built for phones and laptops** with responsive layouts and quick access buttons wherever you are.

## 📖 Usage Guide

Follow this path to get comfortable with the app’s flow:

### 🗺️ Dashboard (`index.html`)
- Start here each day to see today’s notes, goals, reminders, and activity summary in one grid.
- Tap the **Show All** buttons to open a section without leaving the page.
- Click any calendar date to open the logging drawer and add updates.
- Switch months with the picker above the calendar; coloured dots show where you logged progress.
- The layout intelligently adapts from a multi-column view on desktops to a single, scrollable feed on mobile.

### 📝 Notes (`pages/notes.html`)
- Switch between **Daily** and **General** notes using the buttons at the top of the page.
- Daily notes stay linked to the calendar and offer Today/Yesterday/Tomorrow shortcuts.
- General notes add a title field and quick filters for all or recent entries.
- Your notes are saved automatically as you type, so you never lose an idea.

### 🏃 Activities (`pages/activities.html`)
- Add activities, group smaller tasks under them, and choose a color for quick identification.
- Log progress from the page or the dashboard; streak counters update right away.
- Expand an activity to review its history or adjust its sub-tasks.

### 🎯 Goals (`pages/goals.html`)
- Create goals with due dates and descriptions, then set their status when things change.
- Status colors and progress bars shift automatically so you can see progress at a glance.
- Filter to focus on what is pending, in progress, or already done.

### ⏰ Reminders (`pages/reminders.html`)
- Schedule reminders with date and time pickers and optional follow-up notes.
- Overdue reminders turn red so you know what needs attention.
- Snooze a reminder for a few minutes or a full day with a single click.

### 🧘 Focus Mode (`pages/focus.html`)
- Choose a focus session length, press start, and watch the timer and streak count on one screen.
- The minimal UI fades away distractions, helping you concentrate on the task at hand.
- Mobile layouts use larger controls so everything is easy to tap.

### 🎨 Themes (`pages/themes.html`)
- Browse theme cards to see how each preset looks before you choose.
- Apply a theme or toggle dark mode to update the whole app instantly.
- Your selections are saved in local storage, so the app remembers your look.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js 16+** (for running quick local servers or helper scripts)
- **Firebase project** with Authentication and Firestore enabled
- **VS Code** (recommended) with Live Server extension *or* any static web server

### Installation & Setup

1. **Clone the repository**
   ```powershell
   git clone <your-fork-url> bithab
   cd bithab
   ```

2. **Install optional helpers** (only required if you plan to run the Firebase config generator or serve locally with `http-server`):
   ```powershell
   npm install --global http-server
   ```

3. **Configure Firebase**
   - Create a Firebase web app and copy the SDK configuration from the console.
   - Duplicate `config/firebase-config.js.sample` (if provided) or run the helper script:
     ```powershell
     node config/generate-firebase-config.js
     ```
   - Paste your Firebase credentials when prompted, or update `firebase-config.js` manually to export the `firebaseConfig` object.

4. **Serve locally**
   - With VS Code Live Server: open `index.html`, right-click, and choose *Open with Live Server*.
   - With `http-server`:
     ```powershell
     http-server . -p 8080
     ```
   - With `npx serve` (no global install required):
     ```powershell
     npx serve .
     ```

5. **Sign in**
   - The app expects Firebase Authentication (email/password by default). Create a user in the Firebase console or enable additional providers.

## 🏗️ Architectural Overview

1. **Bootstrap** – `index.html` loads shared styles (`style.css`, `dashboard.css`) and the dashboard script (`assets/js/script.js`). The script sets up Firebase, fetches user data, and initializes theme preferences before showing the main layout.
2. **Data layer** – `database-service.js` and `data-sync.js` wrap Firestore calls. `database-migration.js` keeps older data compatible so the UI can use a single shape everywhere.
3. **Feature modules** – Dedicated scripts (`activities.js`, `notes.js`, `goals.js`, `reminders.js`, `focus.js`) manage their own logic but share a central state object and rendering helpers.
4. **Theme system** – `unified-theme-system.js` and `themes.css` expose CSS variables and helper functions so every page responds to theme or dark-mode changes instantly.
5. **Navigation model** – Core pages live under `pages/`, yet key actions (logging, note edits, reminders) are mirrored on the dashboard by reusing the same rendering utilities.

## 💻 Technology Stack

| Layer        | Details |
|--------------|---------|
| Frontend     | HTML5, CSS3, Vanilla JavaScript (ES6) |
| UI Toolkit   | Font Awesome icons, Geist and Inter web fonts |
| Backend      | Firebase Authentication and Cloud Firestore |
| Tooling      | Optional helpers such as VS Code Live Server or any static HTTP server |

## 📂 Project Structure

```
.
├── assets/
│   ├── css/
│   │   ├── auth.css
│   │   ├── clock.css
│   │   ├── dashboard.css
│   │   ├── deep-focus.css
│   │   ├── focus.css
│   │   ├── management.css
│   │   ├── notes.css
│   │   ├── style.css
│   │   └── themes.css
│   ├── images/
│   │   └── (logos, favicons, illustration assets)
│   └── js/
│       ├── activities.js
│       ├── auth-manager.js
│       ├── clock.js
│       ├── data-sync.js
│       ├── database-migration.js
│       ├── database-service.js
│       ├── error-handler.js
│       ├── focus.js
│       ├── goals.js
│       ├── mobile-nav.js
│       ├── notes.js
│       ├── reminders.js
│       ├── script.js              # Dashboard bootstrap + shared state
│       ├── theme-preload-inline.js
│       └── unified-theme-system.js
├── config/
│   ├── firebase-config.js          # Inject your Firebase credentials here
│   └── generate-firebase-config.js # CLI helper to scaffold the config file
├── index.html                      # Dashboard landing page
├── pages/
│   ├── activities.html
│   ├── analytics.html
│   ├── deep-focus.html
│   ├── focus.html
│   ├── goals.html
│   ├── login.html
│   ├── notes.html
│   ├── register.html
│   ├── reminders.html
│   └── themes.html
└── README.md
```

## 🔥 Firebase Integration

- **Authentication**: Uses Firebase Auth for session handling; update `auth-manager.js` if you add providers beyond email/password.
- **Firestore**: Collections include user logs, goals, reminders, activities, and notes. The `database-service.js` and `database-migration.js` modules centralize CRUD and compatibility logic.
- **Security Rules**: Ensure Firestore rules restrict reads/writes to authenticated users and enforce document ownership.

## ☁️ Deployment

Since BitHab is 100% client-side, deployment is straightforward:
1. Build/compile assets if you add tooling (not required for the current setup).
2. Upload the repository contents to any static host (Firebase Hosting, Netlify, Vercel, GitHub Pages, etc.).
3. Set the correct Firebase credentials in production and verify domain authorization in Firebase Auth.

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit with descriptive messages following conventional style where possible.
4. Submit a pull request and describe the change, screenshots welcome.


## 🙏 Acknowledgements

- Built atop Firebase for rapid backend services.
- UI enhanced with Font Awesome, Geist, and Inter fonts.
- Inspired by productivity dashboards and habit-tracking best practices.
