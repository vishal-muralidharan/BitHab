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
│ Focus Routes: Unified vs Immersive                               │
│                                                                  │
│ Standard Focus (/focus):                                         │
│ - Renders standard dual-nav architecture: Header.jsx (90px) on   │
│   desktop and MobileTopbar.jsx (72px) + BottomNav.jsx on mobile  │
│ - Complete center navigation (Activities, Goals, Notes,          │
│   Reminders, Focus [active], More), Theme toggle, and Logout     │
│ - Header actions seamlessly integrate Focus controls (Analytics  │
│   and Deep Focus buttons)                                        │
│                                                                  │
│ Deep Focus & Analytics (/deep-focus, /analytics):                │
│ - Full distraction-free immersion bypassing standard navigation  │
│ - Dedicated controls and fullscreen enforcement                  │
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

## 3. Comprehensive Cross-Device Screen Tier Matrix

BitHab interfaces must be designed, styled, and tested to provide ergonomic, pixel-perfect experiences across all device screen tiers:

| Device Tier | Viewport Width | Shell & Navigation | Content Layout & Adaptations |
| :--- | :--- | :--- | :--- |
| **Compact Mobile** | `< 375px` (e.g. iPhone SE, 320–360px) | `MobileTopbar` + fixed `BottomNav` | 1-column layout, full-width cards; **Adaptive Action Buttons** collapse text and render icon-only (`+` instead of "New List" / "New Note"); strict text wrapping (`overflow-wrap: anywhere; word-break: break-word;`); `padding-bottom: 90px`. |
| **Standard Mobile** | `375px – 599px` (e.g. iPhone 15/Pro Max, Galaxy S/Ultra) | `MobileTopbar` + fixed `BottomNav` | 1-column layout, full-width inputs (enforcing `font-size: 16px` to prevent iOS Safari auto-zoom), 44×44px touch targets; `padding-bottom: calc(5rem + env(safe-area-inset-bottom, 20px))`. |
| **Foldables & Small Tablets** | `600px – 767px` (e.g. Fold unfolded, 7" tablets) | `MobileTopbar` + fixed `BottomNav` | Adaptive 1 to 2 column reflow; compact card padding (`1.25rem`); centered content container with balanced margins. |
| **Portrait Tablets** | `768px – 1023px` (e.g. iPad 10.2", iPad Air portrait) | Desktop `Header` (90px) | 2-column balanced grid (`grid-template-columns: repeat(2, 1fr)`); inline action controls; no bottom navigation clearance needed. |
| **Laptops & Desktops** | `>= 1024px` (e.g. 13"–16" Laptops, 1080p, 1440p) | Desktop `Header` (90px) | 3-column balanced grid (`grid-template-columns: repeat(3, 1fr)` or `repeat(auto-fill, minmax(360px, 1fr))`); dashboard baseline parity; container capped at `max-width: 1400px` (or `1200px`). |

### Adaptive Action Buttons (Phone Icon-Only Adaptability)
On compact/mobile viewports (`< 768px` and specifically `< 480px`), top action buttons (such as `+ New List`, `+ New Note`, `+ New Activity`) must not overcrowd page titles or force awkward multi-line wrapping:
* **Desktop & Tablet:** Button displays icon + text (e.g. `<i class="fas fa-plus"></i> <span>New List</span>`).
* **Phone Screens (`< 480px` or `< 768px`):** The text label collapses (`span { display: none; }` or responsive utility) so the button renders as a sleek, square or circular icon-only button with a clean `+` glyph while maintaining a minimum **44×44px** touch target.

### Strict Content Text Wrapping
To prevent long URLs, unbroken strings, or task descriptions from blowing out card widths on narrow mobile screens (320px–375px):
```css
.list-item-text,
.item-content,
.note-content,
.activity-name {
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 0;
  line-height: 1.5;
}
```

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

### Deep Focus Responsive Reflow
* **Desktop (`> 1024px`):** Subjects (`top: 85px; left: 32px; width: 230px`) and Tasks (`top: 85px; right: 32px; width: 230px`) are fixed frosted side cards anchored in the upper viewport, completely clear of the central countdown clock and control buttons.
* **Tablets (`<= 1024px`):** Side panels reflow into a centered 2-column grid (`grid-template-columns: 1fr 1fr; max-width: 600px`) beneath the target duration block.
* **Mobile (`<= 768px`):** Side panels stack into a single column (`grid-template-columns: 1fr`) with full container width.

### Deep Focus Compulsory Fullscreen Enforcement
* **Automatic Fullscreen Entry:** Clicking the Deep Focus button (`#deep-work-toggle`) in `Focus.jsx` directly requests HTML5 Fullscreen (`document.documentElement.requestFullscreen()`) on the user gesture before navigating to `/deep-focus`.
* **Compulsory Fullscreen Modal (`#fullscreen-prompt`):** If `/deep-focus` is loaded windowed (or direct URL navigation), an enforcement backdrop (`.fullscreen-enforcement-backdrop`, `z-index: 10000`) renders, requiring the user to click "Enter Fullscreen" (`#enter-fullscreen-btn`) or "Return to Focus" (`#skip-fullscreen-btn`).
* **Active Session Focus Enforcement:** If the user exits fullscreen (e.g. presses `Esc`) while a session is running, the `fullscreenchange` listener immediately auto-pauses the timer to preserve focus integrity and presents the enforcement prompt.
* **Header Controls:** Deep Focus header provides both a dedicated fullscreen toggle button (`#fullscreen-toggle-btn`) and exit button (`#exit-deep-work`) which safely cleans up fullscreen (`document.exitFullscreen()`) before routing back to `/focus`.

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
[ ] 1. Compact Mobile (< 375px): Page renders cleanly without horizontal scrollbar; text wraps properly with word-break: break-word.
[ ] 2. Adaptive Action Buttons: Action buttons collapse text to icon-only (+) on phone viewports (< 480px / < 768px).
[ ] 3. Standard Mobile (375–599px): Dual-Nav displays MobileTopbar + BottomNav; cards stack in 1 column.
[ ] 4. Bottom Clearance: Mobile page content has adequate bottom clearance (padding-bottom: calc(5rem + env(safe-area-inset-bottom, 20px))) so elements are never hidden behind BottomNav.
[ ] 5. Touch Targets: Interactive buttons, icon arrows, checkboxes, and calendar cells meet minimum 44x44px hit dimensions.
[ ] 6. iOS 16px Font Rule: All form inputs use at least 16px font-size to prevent auto-zooming.
[ ] 7. Portrait Tablet (768–1023px): Header displays desktop navigation cleanly; cards reflow into 2 balanced columns.
[ ] 8. Desktop (>= 1024px): 3-column grid aligns baseline cards and caps content container width.
[ ] 9. Focus Route Bypassing: /focus, /deep-focus, and /analytics correctly apply focus-mode and expand cleanly with zero logo jump.
[ ] 10. Modals Bounded: Modals and overlays enforce max-height: 90vh and internal scrolling without clipping.
```
