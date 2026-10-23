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

* **Sleek Multi-Theme Aesthetic:** 6 curated themes (`default`, `ocean`, `sunset`, `forest`, `dark`, `minimal`) with instant dark/light mode switching.
* **Pure Vanilla CSS Architecture:** Zero reliance on heavy CSS utility frameworks like Tailwind. Total control through clean, modular stylesheets in `src/assets/css/`.
* **Token Discipline via CSS Custom Properties:** Every color, background, text shade, and border flows through CSS variables defined on `:root` and theme selectors.
* **Ergonomic Surfaces & Micro-Interactions:** Smooth hover transitions, active button states, card elevators, and calendar dot indicators.

> **The Golden Rule:** Never hardcode raw hex values (e.g. `#6366f1`, `#1e293b`) directly into JSX styles or page-specific stylesheets. All colors must consume canonical CSS custom properties (`var(--primary-color)`, `var(--bg-primary)`, `var(--surface-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`).

---

## 2. Design System Specification Matrix

| CSS Token | Description | Light Mode Example | Dark Mode Example |
| :--- | :--- | :--- | :--- |
| `--primary-color` | Primary accent / brand color | `#4f46e5` (Theme dependent) | `#6366f1` / `#818cf8` |
| `--primary-hover` | Interactive hover accent | Darker primary shade | Brighter primary shade |
| `--primary-color-alpha` | Transparent primary accent tint | `rgba(79, 70, 229, 0.1)` | `rgba(99, 102, 241, 0.15)` |
| `--bg-primary` | Main page canvas background | `#f8fafc` / `#ffffff` | `#0f172a` / `#090d16` |
| `--bg-secondary` | Section or panel background | `#f1f5f9` | `#1e293b` |
| `--surface-color` | Card, modal & sheet container | `#ffffff` | `#1e293b` / `#161e2e` |
| `--text-primary` | Main readable headings & body | `#0f172a` | `#f8fafc` |
| `--text-secondary` | Muted labels, subtitles & dates | `#64748b` | `#94a3b8` |
| `--border-color` | Borders, dividers & card outlines | `#e2e8f0` | `rgba(255, 255, 255, 0.1)` |

### The 6 Curated BitHab Themes (`src/assets/css/themes.css`)
1. **Default:** Balanced Indigo & Slate palette for general productivity.
2. **Ocean:** Calming Cyan & Deep Blue gradient tones for deep work.
3. **Sunset:** Warm Coral, Peach, and Amber twilight hues.
4. **Forest:** Restful Mint, Sage, and Emerald organic greens.
5. **Dark:** High-contrast Midnight Charcoal with Gold & Emerald highlights.
6. **Minimal:** Subtle, distraction-free neutral monochrome.

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

---

## 4. Pre-Commit Design System Checklist

Before committing any UI or styling changes, verify:
```text
[ ] 1. No hardcoded hex values in JSX or page stylesheets without CSS custom property bindings.
[ ] 2. Component verified across both Light mode and Dark mode.
[ ] 3. Component verified across multiple themes (e.g. Default, Ocean, Dark).
[ ] 4. Layout coordinates with standard body classes (index-page, themes-page, focus-mode).
[ ] 5. Touch targets meet minimum 44x44px ergonomic dimensions on mobile.
[ ] 6. Form inputs and buttons use appropriate typography and hover transitions.
```
