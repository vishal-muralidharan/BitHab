# Design Tokens Blueprint

Extracted CSS custom properties, role mappings, and theme palettes.

## Token roles and theme values

| Token | Role | Light Value | Dark Value | Evidence |
|---|---|---|---|---|
| `--accent-color` | action | `#58A6FF` | `unknown` | `src/assets/css/style.css:8` |
| `--accent-primary` | action | `var(--accent-color)` | `unknown` | `src/assets/css/style.css:23` |
| `--accent-primary-rgb` | action | `88, 166, 255` | `unknown` | `src/assets/css/style.css:9` |
| `--accent-secondary` | action | `var(--secondary-color)` | `unknown` | `src/assets/css/style.css:24` |
| `--primary-color` | action | `#58A6FF` | `unknown` | `src/assets/css/style.css:4` |
| `--secondary-color` | action | `#1F6FEB` | `unknown` | `src/assets/css/style.css:5` |
| `--border-color` | border | `#2D3845` | `unknown` | `src/assets/css/style.css:12` |
| `--transition` | motion | `0.3s cubic-bezier(.4,0,.2,1)` | `unknown` | `src/assets/css/style.css:29` |
| `--bottom-nav-height` | other | `4.75rem` | `unknown` | `src/assets/css/style.css:1218` |
| `--danger-color` | other | `var(--error-color)` | `unknown` | `src/assets/css/style.css:27` |
| `--dashboard-calendar-base` | other | `calc(var(--dashboard-card-collapsed) * 2 - 44px)` | `unknown` | `src/assets/css/dashboard.css:407` |
| `--dashboard-card-collapsed` | other | `clamp(200px, 42vh, 260px)` | `unknown` | `src/assets/css/dashboard.css:403` |
| `--dashboard-card-expanded` | other | `clamp(380px, 62vh, 500px)` | `unknown` | `src/assets/css/dashboard.css:404` |
| `--dashboard-list-collapsed` | other | `clamp(160px, 36vh, 220px)` | `unknown` | `src/assets/css/dashboard.css:405` |
| `--dashboard-list-expanded` | other | `clamp(360px, 62vh, 480px)` | `unknown` | `src/assets/css/dashboard.css:406` |
| `--error-color` | other | `#F85149` | `unknown` | `src/assets/css/style.css:17` |
| `--shadow` | other | `0 4px 6px rgba(0, 0, 0, 0.3)` | `unknown` | `src/assets/css/style.css:18` |
| `--success-color` | other | `#3FB950` | `unknown` | `src/assets/css/style.css:15` |
| `--warning-color` | other | `#D29922` | `unknown` | `src/assets/css/style.css:16` |
| `--radius` | radius | `12px` | `unknown` | `src/assets/css/style.css:28` |
| `--background-color` | surface | `#0A0E14` | `unknown` | `src/assets/css/style.css:6` |
| `--bg-hover` | surface | `rgba(255, 255, 255, 0.05)` | `unknown` | `src/assets/css/style.css:26` |
| `--bg-primary` | surface | `var(--background-color)` | `unknown` | `src/assets/css/style.css:21` |
| `--bg-secondary` | surface | `var(--surface-color)` | `unknown` | `src/assets/css/style.css:22` |
| `--header-bg` | surface | `var(--surface-color)` | `unknown` | `src/assets/css/style.css:25` |
| `--surface-color` | surface | `#131920` | `unknown` | `src/assets/css/style.css:7` |
| `--text-primary` | text | `#B8D4F1` | `unknown` | `src/assets/css/style.css:10` |
| `--text-secondary` | text | `#7A99B8` | `unknown` | `src/assets/css/style.css:11` |

## Motion tokens

- `--transition`: `0.3s cubic-bezier(.4,0,.2,1)` (`src/assets/css/style.css:29`)

<!-- BEGIN CUSTOM: contracts -->
<!-- END CUSTOM: contracts -->
