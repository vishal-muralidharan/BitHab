---
name: build-ui
description: 'Use this skill whenever you build or change any UI in bithab: screens, components, sheets, charts, copy. Covers shared components, tokens, required states, motion and accessibility.'
---
<!-- build-forge:generated v1 body=c1e0018e272addbfeae47a08f83f3e33fbdf065771bed92131c34a245eef15dc -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# How to build UI in bithab

## Before you start

1. Look in `src/components/layout` for an existing primitive. Use it. Extend it if a variant is missing. Do not create one off copies.
2. Read the tokens in `src/assets/css/style.css`. Use only those.

## Blueprint

Query codebase UI facts on demand:
`python3 .agents/skills/project-blueprints/scripts/blueprint.py show --area ui --paths <files>`

## Form controls

1. Use the themed primitive.
2. If none exists, build it first in `src/components/layout`, reusing existing low level widgets, as its own commit with loading, empty and error states where they apply, then use it.
3. Never use a native browser control that a themed primitive covers.
4. Read the Form controls table with the blueprint show command for the ui area before choosing a control.

## Rules

- No UI rules recorded. Add them to the profile.

## Finish

Run `npm run lint && npm run test`.
<!-- BEGIN CUSTOM: notes -->
<!-- END CUSTOM: notes -->
