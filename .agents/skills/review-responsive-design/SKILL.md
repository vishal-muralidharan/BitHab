---
name: review-responsive-design
description: >-
  Use this skill whenever building, modifying, or auditing UI components, pages, modals,
  and navigation bars in BitHab. Ensures interfaces are fully responsive across mobile, tablet, and desktop
  viewports, handles dynamic full-screen focus modes, manages bottom navigation clearance,
  applies safe area insets, prevents iOS Safari auto-zoom, and maintains 44px touch targets.
---

# Review Responsive Design & Mobile Viewport Safety

This skill defines the mandatory responsive design architecture, viewport standards, and cross-device ergonomics for the **BitHab** repository. Prioritize and execute these checks whenever creating or updating any page, modal, navigation bar, or form.

---

## 1. Core Principles

1. **Mobile-First Foundation:** Ensure all layouts render cleanly on mobile viewports (< 768px) with stacked columns, accessible touch targets, and proper bottom navigation clearance.
2. **Dual-Nav Architecture:**
   - **Desktop (>= 768px):** Desktop `Header.jsx` with horizontal nav items, "More" dropdown, theme switcher, and logout.
   - **Mobile (< 768px):** `MobileTopbar.jsx` at the top and fixed `BottomNav.jsx` at the bottom.
3. **Focus Mode Full-Screen Bypassing:** When entering `/focus`, `/deep-focus`, or `/analytics`, the `.focus-mode` body class hides `BottomNav` and `MobileTopbar`, providing 100vh of immersive deep work space.
4. **Ergonomic Touch Targets:** All interactive buttons, calendar day cells, checkboxes, and tabs must provide a minimum hit area of **44x44 CSS pixels**.
5. **Mobile Form Stability:** Inputs on iOS Safari trigger aggressive auto-zoom when font-size is below 16px. Always enforce `font-size: 16px` (or `1rem`) on mobile inputs.
6. **Zero Layout Shift:** Status updates (e.g. "Activity scheduled", "Copied", "Saved") must use fixed toasts or reserved button dimensions to prevent layout displacement.

---

## 2. Navigation & Viewport Architecture

### Responsive Navigation Switching
In BitHab, navigation elements adapt based on screen width and route:

```text
┌──────────────────────────────────────────────────────────────────┐
│ Standard Routes (/, /activities, /goals, /reminders, /notes, ...) │
│                                                                  │
│ [>= 768px Desktop]                                               │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Header.jsx (Logo | Nav Links | More Dropdown | Theme | Logout│ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ [< 768px Mobile]                                                 │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ MobileTopbar.jsx (Logo | Theme Toggle)                       │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ Page Content (with pb-20 for bottom navigation clearance)    │ │
│ ├──────────────────────────────────────────────────────────────┤ │
│ │ BottomNav.jsx (Home | Activities | Goals | Reminders | More) │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ Focus Routes (/focus, /deep-focus, /analytics)                   │
│                                                                  │
│ Body class: .focus-mode                                          │
│ - Bypasses Header, BottomNav, and MobileTopbar                   │
│ - Dedicated top focus header (.focus-header) with Back/Analytics │
│ - Header height (90px desktop, 72px mobile) and padding          │
│   (0.75rem 1.5rem) match standard Header.jsx to guarantee zero   │
│   logo displacement or jumping across page transitions           │
│ - Expands layout to 100vh with no extraneous scroll              │
└──────────────────────────────────────────────────────────────────┘
```

### Bottom Navigation Clearance
Because `BottomNav.jsx` is fixed to the bottom of the viewport on mobile devices:
* Main page containers must apply bottom padding (`padding-bottom: 5rem` or `pb-20` / `80px`) to prevent bottom buttons, lists, or input forms from being obscured behind the bottom bar.
* Safe-area padding must be respected:
  ```css
  padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  ```

---

## 3. Responsive Breakpoint Standards

BitHab stylesheets enforce responsive reflow across three main device tiers:

| Breakpoint | Viewport Width | Navigation & Shell | Content Layout |
| :--- | :--- | :--- | :--- |
| **Mobile** | `< 768px` | `MobileTopbar` + `BottomNav` | Single-column cards, full-width inputs, stacked calendar navigation, `padding-bottom: 100px` for bottom bar clearance |
| **Tablet** | `768px - 1024px` | Desktop `Header` | 2-column dashboard grids, inline schedule controls |
| **Desktop** | `> 1024px` | Desktop `Header` | 3-column dashboard grid (`1fr 1.5fr 1fr`), 3-column focus room (`Subjects` \| `Clock` \| `Tasks`) |

### Desktop Dashboard Layout & Bottom Baseline Parity
* On desktop viewports (`>= 1024px`), the dashboard (`.main-layout`) utilizes a 3-column CSS grid:
  ```css
  grid-template-columns: 1fr 1.5fr 1fr;
  min-height: calc(100vh - 90px);
  align-items: stretch;
  ```
* All three column containers (`.left-column`, `.center-column`, `.right-column`) enforce `height: 100%; min-height: 0; display: flex; flex-direction: column;`.
* Contained cards (`.activities-component`, `.notes-component`, `.calendar-view`, `.goals-component`, `.reminders-component`) specify `flex: 1 1 0; min-height: 0; max-height: none;`.
* **Zero Dead Space Rule:** The bottom of Left Column (Notes card), Center Column (Calendar view card), and Right Column (Reminders card) must terminate on the exact same horizontal baseline, completely utilizing bottom viewport real estate without awkward dead voids.

---

## 4. Mobile Form Ergonomics & iOS Safari Rules

### The 16px Font Rule (Preventing iOS Safari Auto-Zoom)
On iOS Safari, focusing any input (`<input>`, `<select>`, `<textarea>`) with `font-size < 16px` triggers an automatic browser zoom that displaces the viewport and breaks fixed navigation.

**Rule:** Always declare input font sizes with at least `16px` on mobile:
```css
input, select, textarea {
  font-size: 16px;
  min-height: 44px;
}
```

### Touch Target Dimensions (Minimum 44x44px)
* All calendar date cells, add icons, checkboxes, and toolbar buttons must provide at least **44x44px** of tappable area.
* Calendar day cells must use adequate padding (`padding: 10px 5px`) and centering so fingers can reliably select dates.

---

## 5. Modal & Overlay Viewport Safety

When rendering modal dialogs (`custom-dialogs.css`, `pattern-modal`, `date-modal`, or edit dialogs):
1. **Dynamic Viewport Height:** Enforce `max-height: 90vh` (or `max-height: 90dvh`) with `overflow-y: auto`.
2. **Safe-Area Insets:** Ensure modals don't clip under device camera notches or home bars:
   ```css
   padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
   ```
3. **Centered Overlay:** Use backdrop blur and centered positioning:
   ```css
   position: fixed;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   max-width: 90vw;
   ```

---

## 6. Pre-Commit Responsive Design Checklist

Before committing any UI code, verify:
```text
[ ] 1. Mobile-First Layout: Page renders cleanly on mobile (< 768px) without horizontal scrollbar.
[ ] 2. Dual-Nav Verification: Header renders on desktop (90px height), MobileTopbar + BottomNav render on mobile.
[ ] 3. Focus Route Bypassing: /focus, /deep-focus, and /analytics correctly apply focus-mode and expand cleanly with zero logo jump.
[ ] 4. Bottom Clearance: Mobile page content has adequate bottom clearance (padding-bottom: 5rem / 100px) so elements aren't hidden behind BottomNav.
[ ] 5. Desktop Grid Stretch: Dashboard 3-column layout stretches to min-height: calc(100vh - 90px) and aligns bottom card baselines.
[ ] 6. Touch Targets: Interactive buttons, icon arrows, and calendar cells meet minimum 44x44px hit dimensions.
[ ] 7. iOS 16px Font Rule: All form inputs use at least 16px font-size to prevent auto-zooming.
[ ] 8. Modals Bounded: Modals and overlays enforce max-height and internal scrolling.
```
