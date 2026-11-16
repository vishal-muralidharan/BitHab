---
name: maintain-design-system
description: Use this skill when you add or change tokens, global styles or shared UI primitives in bithab. Defines the palette, type scale, spacing, radius and motion tokens.
---
<!-- build-forge:generated v1 body=f5c20227b30436b583da7c2d30e4904ba7c15a886c515147caafffb071967270 -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# bithab design system

All tokens live in `src/assets/css/style.css`.

## Blueprint

Query codebase design tokens on demand:
`python3 .agents/skills/project-blueprints/scripts/blueprint.py show --area tokens --paths <files>`

## Token rules

- No token rules recorded. Add them to the profile.

## Changing a token

1. Edit `src/assets/css/style.css` for every theme or mode.
2. Check contrast in each mode.
3. Update `README.md` if it lists tokens.
4. Run `npm run lint && npm run test`.
<!-- BEGIN CUSTOM: notes -->
## Reference Blueprint
For complete design tokens, color variables, and theme definitions, see `src/assets/css/style.css` and `src/assets/css/themes.css`.

## Operational Guidelines
- **Zero Hardcoded Colors:** All color values must consume CSS custom properties (`var(--primary-color)`, `var(--bg-primary)`, `var(--surface-color)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`). Never hardcode raw hex values in JSX styles or CSS rules.
- **The 6 Curated BitHab Themes:**
  1. `oceanic-depths`: Cyan and deep blue focus tones.
  2. `evergreen-forest`: Mint, sage, and emerald greens.
  3. `cyberpunk-neon`: Vivid violet and neon accents.
  4. `monochrome-minimalist`: Distraction-free neutral grayscale.
  5. `sunrise-coral`: Warm coral, peach, and amber hues.
  6. `cherry-blossom`: Rose, blossom pink, and magenta accents.
- **Multi-Theme Parity:** Every UI element must maintain accessible contrast across all 6 themes and in both Light (`[data-mode="light"]`) and Dark (`[data-mode="dark"]`) modes.
- **Instant Zero-Flicker Switching:** Theme and mode toggles apply synchronous DOM attribute updates (`data-theme`, `data-mode`) and `localStorage` writes before background Firestore synchronization.
- **Body Class Coordination:** Layout rules coordinate with standard body classes (`index-page`, `themes-page`, `focus-mode`, `auth-page`) managed by `src/components/layout/Layout.jsx`.
- **Deep Focus Ergonomic Controls:** Timer controls use green (`#10b981`) for start, yellow (`#f59e0b`) for pause, and red (`#ef4444`) for stop; compulsory fullscreen modal with auto-pause on exit.
<!-- END CUSTOM: notes -->
