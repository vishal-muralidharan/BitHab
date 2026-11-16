---
name: review-responsive-design
description: Use this skill when you build or audit layout in bithab. Covers breakpoints, navigation by size, touch targets, safe areas and zoom.
---
<!-- build-forge:generated v1 body=bd6d16ab8be7d36e221a2b4e8bcd9f03543131b051d4842777402b95e71a2a82 -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# Responsive review for bithab

Support 320px to 2560px. Touch targets are at least 44px on coarse pointers.

## Blueprint

Query codebase layout and breakpoint facts on demand:
`python3 .agents/skills/project-blueprints/scripts/blueprint.py show --area layout --paths <files>`

## Breakpoints

| From (px) | Layout |
|---|---|
| 320 | MobileTopbar, fixed BottomNav, single column, 5rem bottom padding |
| 768 | top Header (90px height), desktop navigation |
| 1024 | 3-column dashboard baseline stretch, viewport height lock |

## Rules

- Mobile page containers must reserve bottom padding (5rem) for fixed BottomNav. `[mobile-bottom-nav-clearance]`
- Form inputs must enforce at least 16px font-size on mobile to prevent iOS Safari auto-zoom. `[mobile-ios-input-16px]`
- Desktop dashboard locks height to calc(100vh - 90px) with column baseline stretch. `[desktop-dashboard-viewport-lock]`

## Verify

Open the app at 320, 768, 1024, 2560 px. For each screen check: no horizontal scroll, no hidden content, no layout shift.
<!-- BEGIN CUSTOM: notes -->
## Operational Guidelines
- **Dual-Nav Reflow:**
  - Desktop viewports (>= 768px) display top `Header.jsx` (90px height).
  - Mobile viewports (< 768px) display `MobileTopbar.jsx` at the top and fixed `BottomNav.jsx` at the bottom.
- **Focus Mode Bypassing:** Full-screen focus routes (`/focus`, `/deep-focus`, `/analytics`) bypass default navigation and expand to 100vh via the `focus-mode` body class.
- **Bottom Navigation Clearance:** Mobile page containers must reserve bottom padding (`padding-bottom: 5rem`) so content is never obscured by `BottomNav.jsx`. Insets: `padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));`.
- **Ergonomic Touch Targets:** Minimum 44x44px touch targets on mobile interactive controls.
- **iOS Safari Auto-Zoom Prevention:** All form inputs must enforce at least `16px` font-size on mobile.
- **Zero Layout Shift:** Status transitions (e.g., "Copied!", "Saved") must use fixed button widths or non-displacing toast alerts.
- **Desktop Column Baseline Stretch & Viewport Height Lock:** Dashboard 3-column layout stretches to utilize bottom space (`min-height: calc(100vh - 90px)`) with all column cards terminating on the exact same bottom baseline. Desktop dashboard (`>= 1024px`) locks `height: calc(100vh - 90px); overflow: hidden;` to eliminate scroll to dead space unless `.expanded-active` is engaged during user interaction.
- **Adaptive Action Buttons:** Action buttons on phone viewports (< 480px / < 768px) collapse text and render icon-only (`+`) with 44px touch targets to prevent header overcrowding.
<!-- END CUSTOM: notes -->
