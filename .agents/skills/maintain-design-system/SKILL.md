---
name: maintain-design-system
description: >-
  Use this skill whenever creating new UI components or modifying stylesheets in BitHab.
  Ensures strict preservation of the Vanilla CSS Design System and theme language, including
  CSS custom properties in style.css and themes.css, zero hardcoded hex colors, seamless multi-theme
  and dark/light mode switching, body class management, and ergonomic touch targets.
---

# Maintain Vanilla CSS Design System & Theme Integrity

This skill defines the mandatory design principles, styling standards, and component conventions required to preserve BitHab's signature **Vanilla CSS Design System** across all pages, layout components, modals, and stylesheets.

---

## 1. Design Philosophy: Clean, Focused & Ambient Productivity

BitHab is designed as an elegant, distraction-free productivity and habit tracking sanctuary. The visual identity emphasizes:

* **Sleek Multi-Theme Aesthetic:** 6 curated themes (`oceanic-depths`, `evergreen-forest`, `cyberpunk-neon`, `monochrome-minimalist`, `sunrise-coral`, `cherry-blossom`) with instant dark/light mode switching.
* **Pure Vanilla CSS Architecture:** Zero reliance on heavy CSS utility frameworks like Tailwind. Total control through clean, modular stylesheets in `src/assets/css/`.
* **Token Discipline via CSS Custom Properties:** Every color, background, text shade, and border flows through CSS variables defined on `:root` and theme selectors.
* **Ergonomic Surfaces & Micro-Interactions:** Smooth hover transitions, active button states, card elevators, and calendar dot indicators.

> **The Golden Rule:** Never hardcode raw hex values (e.g. `#6366f1`, `#1e293b`) directly into JSX styles or page-specific stylesheets. All colors must consume canonical CSS custom properties (`var(--primary-color)`, `var(--bg-primary)`, `var(--surface-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`).

---

## 2. Design System Specification Matrix

| CSS Token | Description | Light Mode Example | Dark Mode Example |
| :--- | :--- | :--- | :--- |
| `--primary-color` | Primary accent / brand color | `#0969DA` (Theme dependent) | `#58A6FF` (Theme dependent) |
| `--primary-hover` | Interactive hover accent | Darker primary shade | Brighter primary shade |
| `--primary-color-alpha` | Transparent primary accent tint | `rgba(9, 105, 218, 0.1)` | `rgba(88, 166, 255, 0.15)` |
| `--bg-primary` | Main page canvas background | `#F0F6FC` / `#ffffff` | `#0A0E14` / `#090d16` |
| `--bg-secondary` | Section or panel background | `#f1f5f9` | `#1e293b` |
| `--surface-color` | Card, modal & sheet container | `#E6F0FA` / `#ffffff` | `#131920` / `#161e2e` |
| `--text-primary` | Main readable headings & body | `#0D3A5F` / `#0f172a` | `#B8D4F1` / `#f8fafc` |
| `--text-secondary` | Muted labels, subtitles & dates | `#4E7BA3` / `#64748b` | `#7A99B8` / `#94a3b8` |
| `--border-color` | Borders, dividers & card outlines | `#C5D9ED` / `#e2e8f0` | `#2D3845` / `rgba(255, 255, 255, 0.1)` |

### The 6 Curated BitHab Themes (`src/context/ThemeContext.jsx` & `src/assets/css/themes.css`)
1. **Oceanic Depths (`oceanic-depths`):** Calming Cyan & Deep Blue tones for focus.
2. **Evergreen Forest (`evergreen-forest`):** Restful Mint, Sage, and Emerald organic greens.
3. **Cyberpunk Neon (`cyberpunk-neon`):** Vivid Violet, Purple, and Neon accents.
4. **Monochrome (`monochrome-minimalist`):** Subtle, distraction-free neutral grayscale.
5. **Sunrise Coral (`sunrise-coral`):** Warm Coral, Peach, and Amber twilight hues.
6. **Cherry Blossom (`cherry-blossom`):** Vibrant Rose, Blossom Pink, and Magenta accents.

---

## 3. Mandatory Design System Rules

### Rule 1: Zero Hardcoded Colors
* All colors must flow through CSS custom properties declared in `style.css` and `themes.css`.
* Never write inline styles like `style={{ color: '#6366f1' }}` unless dynamically injecting a user-chosen subactivity color dot.
* Always consume canonical tokens:
  ```css
  background-color: var(--surface-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  ```

### Rule 2: Multi-Theme Contrast & Parity
* Every UI element, card, modal, and button must maintain accessible contrast across **all 6 themes** and in **both** `[data-mode="light"]` and `[data-mode="dark"]`.
* Action buttons must have distinct primary and secondary visual weights:
  - **Primary Buttons:** `background-color: var(--primary-color); color: #ffffff;`
  - **Secondary Buttons:** `background: transparent; border: 1px solid var(--border-color); color: var(--text-primary);`

### Rule 3: Body Class Architecture
BitHab relies on explicit body classes for responsive reflows and full-screen modes:
* `index-page`: Applied on `/` for dashboard calendar reflow and sidebar positioning.
* `themes-page`: Applied on `/themes` for grid responsiveness and theme card previews.
* `focus-mode`: Applied on `/focus`, `/deep-focus`, and `/analytics` to hide standard top/bottom navigation and expand to 100vh.
* `auth-page`: Applied on `/login` and `/register` for centered authentication card layouts.

> All body classes are managed automatically by `src/components/layout/Layout.jsx`.

### Rule 4: Action Button Hierarchy & States
* All buttons must provide clear hover (`:hover`), active (`:active`), and disabled (`:disabled`) states.
* Interactive buttons must meet minimum **44x44px** touch target dimensions on mobile screens.

### Rule 5: Zero-Layout-Shift Feedback
* Transient feedback (e.g., "Copied!", "Saved") or loading states must never displace adjacent cards or layout bars.
* Reserve minimum widths or use fixed toast alerts.

### Rule 6: Instant Zero-Flicker Theme Switching
* When switching themes or toggling dark mode in `ThemeContext.jsx`:
  - **Synchronous Attribute Update:** Immediately apply `document.documentElement.setAttribute('data-theme', theme)` and `document.documentElement.setAttribute('data-mode', isDarkMode ? 'dark' : 'light')`.
  - **Synchronous Storage:** Write to `localStorage` immediately so the user perceives 0ms instant transition with zero screen flicker or layout repaints.
  - **Asynchronous Remote Sync:** Persist preference to Firestore in the background (`/users/{userId}`) without blocking client UI execution.

### Rule 7: Dashboard Stretch & Column Baseline Alignment
* On the home dashboard (`src/assets/css/dashboard.css`), desktop viewports must stretch to utilize bottom space and align column baselines:
  - `.main-layout` specifies `min-height: calc(100vh - 90px); align-items: stretch; display: grid; grid-template-columns: 1fr 1.5fr 1fr;`.
  - `.left-column`, `.center-column`, and `.right-column` specify `height: 100%; min-height: 0; display: flex; flex-direction: column;`.
  - Card components (`.activities-component`, `.notes-component`, `.calendar-view`, `.goals-component`, `.reminders-component`) specify `flex: 1 1 0; min-height: 0; max-height: none;`.
  - **Baseline Rule:** The bottom of Left Column (Notes card), Center Column (Calendar card), and Right Column (Reminders card) must end at the **exact same pixel baseline** (`y` position) with zero bottom dead space.

### Rule 8: Card Header-to-Content Compact Spacing
* Excessive whitespace between card headers and their first list item diminishes scannability.
* All dashboard cards must maintain tight vertical proportions:
  - `.section-header` must enforce `margin-bottom: 0.25rem; padding-bottom: 0.35rem;`.
  - List containers and textareas must zero out excessive top margins: `margin: 0.25rem 0 0; padding: 0;`.
  - Never allow cumulative gaps (> 30px) between card headers and first items.

### Rule 9: Centered Navigation Arrows & Icon Buttons
* All standalone icon and arrow buttons (`.calendar-nav-btn`, `.show-all-btn`, modal close buttons, carousel controls) must enforce:
  ```css
  display: flex;
  align-items: center;
  justify-content: center;
  ```
* Never rely on default inline button line-heights or asymmetric padding which leaves glyphs (e.g., `‹`, `›`, `✕`, SVG icons) visually off-center.

### Rule 10: Form Divider Badges (Zero Line Collisions)
* When implementing "OR" or section dividers in auth cards or modals:
  - Parent `.separator` has `position: relative; text-align: center; margin: 1rem 0;`.
  - The horizontal rule `::before` pseudo-element has `position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: var(--border-color);`.
  - The badge (`<span>OR</span>`): `position: relative; z-index: 1; background: var(--bg-primary); padding: 0 0.5rem; color: var(--text-secondary); font-size: 0.75rem;`.
  - Ensures the horizontal rule never cuts or bleeds through the label text.

### Rule 11: Date & Typography Formatting (No All-Caps)
* Top-level headers and dashboard date displays must present human-friendly, properly capitalized dates (e.g., "Saturday, October 24, 2026" or "October 24, 2026, Saturday").
* Avoid shouty all-caps text like "TODAY" or `text-transform: uppercase` on main headings unless explicitly styling tiny metadata badges.

### Rule 12: Inline Activity & Reminder Status Aesthetics
* **Inline Activity Logging:** Subactivity selection pills on the dashboard (`.subactivity-pills .subactivity-pill`) must show distinct inactive vs logged states with real-time colored dot indicators and instant calendar dot synchronization.
* **Reminder State Styling:**
  - Active reminders: Clean card surface with subtle accent left border (`border-left: 3px solid var(--primary-color)` or `#10b981`).
  - Expired reminders: Muted red left border (`border-left: 3px solid #ef4444`), dimmed opacity (`0.75`), and an "Expired" status badge.

### Rule 13: Calendar Date Selection & Outside Click Dismissal
* **Default State On Load:** On initial load, today's date is selected by default (`selectedDateStr = todayStr`), today's calendar cell is highlighted, the Notes card displays notes for today, and the Activities card displays the inline logging interface with pills for today. The Activities card header displays the canonical chevron button (`.show-all-btn`).
* **Date Selection:** Clicking any calendar day selects that date (`selectedDateStr`), renders a selection ring on that day cell, updates the header to show the selected date, switches the Activities card to the inline logging interface (showing pills for that specific date), and displays that date's note in the Notes card.
* **Outside Click Dismissal:** Clicking outside the calendar view (`calendarRef`) on the document (except when clicking active logging pills or typing inside the notes editor) automatically unselects the date, closes the inline logging interface, and restores all activities in the Activities card.
* **Show-All Header Button:** Clicking the Activities card header button (`#activities-show-all`) while in logging mode unselects the date and restores all activities, or toggles expansion when already viewing all activities.

### Rule 14: Focus & Deep Focus High-Contrast Aesthetics
* **Focus Mode (`/focus`):**
  - Built on a fixed ambient light blue gradient background.
  - Transparent setting for cards (`rgba(255, 255, 255, 0.25)` frosted glass with `backdrop-filter: blur(20px)`), with zero dark backgrounds.
  - The date display (Saturday) is completely transparent with no dark background or box.
  - All text (digital clock, date, section titles, inputs, list items, quotes, icons) is enforced in full black (`#000000`).
  - Top header always renders the light theme logo (`logo-transparent-light.png`).
* **Deep Focus Mode (`/deep-focus`):**
  - Minimalist pure black canvas (`#000000`) with predominantly black-and-white elements (countdown clock `#ffffff`, white progress track and fill, white percentage text).
  - Absolutely zero orange or clashing theme colors (`var(--primary-color)`).
  - Timer control buttons adhere to universal ergonomic color conventions:
    - **Green (`#10b981`) for START / RESUME**
    - **Yellow (`#f59e0b`) for PAUSE** (with high-contrast black text)
    - **Red (`#ef4444`) for STOP** (with white text)
    - **Neutral translucent outline for RESET**
  - **Subjects & Tasks Side Panels Layout:**
    - On desktop (`> 1024px`), Subjects (upper left, `top: 85px; left: 32px`) and Tasks (upper right, `top: 85px; right: 32px`) are anchored as fixed frosted cards (`width: 230px; max-width: 260px`) completely clear of the central countdown timer and buttons.
    - Both cards enforce vertical stacking (`display: flex; flex-direction: column; align-items: stretch;`) with full-width headers (`h4` with bottom border), font-awesome icons (`fa-book-open`, `fa-list-check`), and left accent borders (`border-left: 3px solid rgba(255, 255, 255, 0.4)`).
    - Empty states use centered dashed notices (`.empty-notice`).
    - On tablets (`<= 1024px`), panels switch to an aligned 2-column grid (`grid-template-columns: 1fr 1fr; max-width: 600px;`) positioned cleanly below the target duration block.
    - On mobile (`<= 768px`), panels stack vertically with full width.
  - **Compulsory Fullscreen Modal (`#fullscreen-prompt`):**
    - Frosted dark backdrop (`rgba(0, 0, 0, 0.88)` with `backdrop-filter: blur(16px)` and `z-index: 10000`).
    - Centered card (`#0d0d0d`, border `1px solid rgba(255, 255, 255, 0.15)`, radius `16px`).
    - Glowing emerald icon badge (`rgba(16, 185, 129, 0.1)` background, `#10b981` icon).
    - High-contrast green primary button (`#10b981`, `#ffffff` text) to "Enter Fullscreen".
    - Clean translucent secondary button to "Return to Focus".

---

## 4. Pre-Commit Design System Checklist

Before committing any UI or styling changes, verify:
```text
[ ] 1. No hardcoded hex values in JSX or page stylesheets without CSS custom property bindings.
[ ] 2. Component verified across both Light mode and Dark mode.
[ ] 3. Component verified across multiple themes (e.g. oceanic-depths, evergreen-forest, cyberpunk-neon).
[ ] 4. Layout coordinates with standard body classes (index-page, themes-page, focus-mode).
[ ] 5. Touch targets meet minimum 44x44px ergonomic dimensions on mobile.
[ ] 6. Form inputs and buttons use appropriate typography and hover transitions.
[ ] 7. Icon buttons and arrow controls enforce display: flex; align-items: center; justify-content: center;.
[ ] 8. Dashboard column cards end on the exact same bottom baseline with zero dead space.
[ ] 9. Card headers maintain compact spacing (margin-bottom: 0.25rem; padding-bottom: 0.35rem;).
[ ] 10. Form dividers use z-index badge layering to avoid line bleed-through.
```
