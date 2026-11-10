---
name: review-directory-structure
description: Use this skill to place new files or move files in bithab. Describes each source layer and the root cleanliness rule.
---
<!-- build-forge:generated v1 body=ddde98223d005f6820ef23a272e3b187419a33a01dbf8b42b9b7995425be2c01 -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# Directory structure of bithab

| Path | Purpose |
|---|---|
| `src/pages` | Page components for routes |
| `src/components/layout` | Shared UI layout components |
| `src/context` | Global state contexts |
| `src/api` | API client functions |

Tests: live in a tests folder.

## Root

Allowed in the repo root: `index.html`, `vite.config.js`, `netlify.toml`, `firestore.rules`, `.oxlintrc.json`. Put nothing else there.

## Before you add a file

Search first with `repo-search`. Reuse or extend an existing file when it fits.
<!-- BEGIN CUSTOM: notes -->
<!-- END CUSTOM: notes -->
