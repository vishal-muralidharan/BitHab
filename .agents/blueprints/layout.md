# Layout Blueprint

Extracted responsive breakpoints, navigation shells, and mobile viewport constraints.

## Breakpoints

- `Breakpoint: 768px`: evidence `src/assets/css/clock.css:261`
- `Breakpoint: 480px`: evidence `src/assets/css/clock.css:297`
- `Breakpoint: 768px`: evidence `src/assets/css/clock.css:370`
- `Breakpoint: 640px`: evidence `src/assets/css/custom-dialogs.css:138`
- `Breakpoint: 1200px`: evidence `src/assets/css/dashboard.css:1217`
- `Breakpoint: 1024px`: evidence `src/assets/css/dashboard.css:1240`
- `Breakpoint: 768px`: evidence `src/assets/css/dashboard.css:1262`
- `Breakpoint: 1201px`: evidence `src/assets/css/dashboard.css:1678`
- `Breakpoint: 1200px`: evidence `src/assets/css/dashboard.css:1695`
- `Breakpoint: 1200px`: evidence `src/assets/css/dashboard.css:1778`
- `Breakpoint: 768px`: evidence `src/assets/css/dashboard.css:1793`
- `Breakpoint: 1024px`: evidence `src/assets/css/dashboard.css:1845`
- `Breakpoint: 768px`: evidence `src/assets/css/dashboard.css:1926`
- `Breakpoint: 768px`: evidence `src/assets/css/dashboard.css:2057`
- `Breakpoint: 375px`: evidence `src/assets/css/dashboard.css:2153`
- `Breakpoint: 1024px`: evidence `src/assets/css/dashboard.css:2369`
- `Breakpoint: 450px`: evidence `src/assets/css/dashboard.css:2376`
- `Breakpoint: 1024px`: evidence `src/assets/css/dashboard.css:26`
- `Breakpoint: 1100px`: evidence `src/assets/css/dashboard.css:401`
- `Breakpoint: 768px`: evidence `src/assets/css/dashboard.css:411`
- `Breakpoint: 768px`: evidence `src/assets/css/deep-focus.css:368`
- `Breakpoint: 540px`: evidence `src/assets/css/deep-focus.css:457`
- `Breakpoint: 1024px`: evidence `src/assets/css/deep-focus.css:640`
- `Breakpoint: 768px`: evidence `src/assets/css/deep-focus.css:689`
- `Breakpoint: 480px`: evidence `src/assets/css/deep-focus.css:824`
- `Breakpoint: 1024px`: evidence `src/assets/css/focus.css:1322`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:1341`
- `Breakpoint: 640px`: evidence `src/assets/css/focus.css:1412`
- `Breakpoint: 480px`: evidence `src/assets/css/focus.css:1431`
- `Breakpoint: 1024px`: evidence `src/assets/css/focus.css:1525`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:1547`
- `Breakpoint: 1024px`: evidence `src/assets/css/focus.css:1564`
- `Breakpoint: 480px`: evidence `src/assets/css/focus.css:1610`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:1615`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:1892`
- `Breakpoint: 1024px`: evidence `src/assets/css/focus.css:2024`
- `Breakpoint: 480px`: evidence `src/assets/css/focus.css:2059`
- `Breakpoint: 1200px`: evidence `src/assets/css/focus.css:2231`
- `Breakpoint: 1024px`: evidence `src/assets/css/focus.css:2265`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:2301`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:2457`
- `Breakpoint: 768px`: evidence `src/assets/css/focus.css:2514`
- `Breakpoint: 768px`: evidence `src/assets/css/legal.css:180`
- `Breakpoint: 768px`: evidence `src/assets/css/lists.css:675`
- `Breakpoint: 769px`: evidence `src/assets/css/management.css:192`
- `Breakpoint: 768px`: evidence `src/assets/css/management.css:200`
- `Breakpoint: 768px`: evidence `src/assets/css/management.css:834`
- `Breakpoint: 1024px`: evidence `src/assets/css/notes.css:158`
- `Breakpoint: 640px`: evidence `src/assets/css/notes.css:164`
- `Breakpoint: 768px`: evidence `src/assets/css/notes.css:408`
- `Breakpoint: 480px`: evidence `src/assets/css/notes.css:448`
- `Breakpoint: 1024px`: evidence `src/assets/css/schedule.css:1075`
- `Breakpoint: 768px`: evidence `src/assets/css/schedule.css:1081`
- `Breakpoint: 480px`: evidence `src/assets/css/schedule.css:1142`
- `Breakpoint: 480px`: evidence `src/assets/css/style.css:1043`
- `Breakpoint: 1025px`: evidence `src/assets/css/style.css:1172`
- `Breakpoint: 1024px`: evidence `src/assets/css/style.css:1183`
- `Breakpoint: 768px`: evidence `src/assets/css/style.css:1216`
- `Breakpoint: 375px`: evidence `src/assets/css/style.css:1267`
- `Breakpoint: 769px`: evidence `src/assets/css/style.css:263`
- `Breakpoint: 768px`: evidence `src/assets/css/style.css:367`
- `Breakpoint: 768px`: evidence `src/assets/css/style.css:676`
- `Breakpoint: 480px`: evidence `src/assets/css/style.css:702`
- `Breakpoint: 768px`: evidence `src/assets/css/style.css:864`
- `Breakpoint: 480px`: evidence `src/assets/css/style.css:936`
- `Breakpoint: 1024px`: evidence `src/assets/css/themes.css:433`
- `Breakpoint: 768px`: evidence `src/assets/css/themes.css:440`

## Navigation shells

- `Navigation Shell: BottomNav` (`src/components/layout/BottomNav.jsx:1`)
- `Navigation Shell: Header` (`src/components/layout/Header.jsx:1`)
- `Navigation Shell: MobileTopbar` (`src/components/layout/MobileTopbar.jsx:1`)
- `Navigation Shell: BottomNav.test` (`tests/components/BottomNav.test.jsx:1`)
- `Navigation Shell: Header.test` (`tests/components/Header.test.jsx:1`)
- `Navigation Shell: MobileTopbar.test` (`tests/components/MobileTopbar.test.jsx:1`)

## Mobile and viewport constraints

- Viewport meta tag: `index.html:7` (`<meta name="viewport" content="width=device-width, initial-scale=1.0" />`)
- Safe area insets constraint: `src/assets/css/deep-focus.css:13` (`padding-top: env(safe-area-inset-top, 0px);`)
- Safe area insets constraint: `src/assets/css/deep-focus.css:14` (`padding-bottom: env(safe-area-inset-bottom, 0px);`)
- Safe area insets constraint: `src/assets/css/deep-focus.css:374` (`padding: 0 env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 80px) env`)
- Safe area insets constraint: `src/assets/css/style.css:1127` (`padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));`)
- Safe area insets constraint: `src/assets/css/style.css:1211` (`padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px)`)
- Safe area insets constraint: `src/assets/css/style.css:1212` (`min-height: calc(100vh - 72px - (var(--bottom-nav-height) + env(safe-area-inset-`)
- Safe area insets constraint: `src/assets/css/style.css:1250` (`padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px)`)
- Safe area insets constraint: `src/assets/css/style.css:1251` (`min-height: calc(100vh - 72px - (var(--bottom-nav-height) + env(safe-area-inset-`)
- Safe area insets constraint: `src/assets/css/style.css:1270` (`padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px)`)

<!-- BEGIN CUSTOM: contracts -->
<!-- END CUSTOM: contracts -->
