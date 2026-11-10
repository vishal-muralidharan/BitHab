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
<!-- END CUSTOM: notes -->
