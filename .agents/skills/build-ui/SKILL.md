---
name: build-ui
description: 'Use this skill whenever you build or change any UI in bithab: screens, components, sheets, charts, copy. Covers shared components, tokens, required states, motion and accessibility.'
---
<!-- build-forge:generated v1 body=580aa1cb555421adb0ed0b97856eec0cb42a79f35dcf5bdfe249a3fcae1d1312 -->

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

- Use semantic HTML elements instead of generic divs with click handlers. `[a11y-semantic-html]`
- Interactive elements must display high-contrast visible focus indicators. `[a11y-visible-focus]`
- Text and interactive controls must meet WCAG AA contrast standards. `[a11y-aa-contrast]`
- Icon-only controls must provide an accessible text label. `[a11y-icon-button-labels]`
- Image tags must include an alt attribute on the same tag line. (enforced by test) `[a11y-img-has-alt]`
- Loading views must use skeleton blocks matching content shape with no layout shift. `[ui-state-loading-skeleton]`
- Empty states must display an icon, 1 or 2 descriptive words, and an action. `[ui-state-empty-action]`
- Error views must display a short message with an icon and role="alert". `[ui-state-error-alert]`

## Finish

Run `npm run lint && npm run test`.
<!-- BEGIN CUSTOM: notes -->
<!-- END CUSTOM: notes -->
