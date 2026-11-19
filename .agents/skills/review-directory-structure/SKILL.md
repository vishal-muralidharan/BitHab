---
name: review-directory-structure
description: Use this skill to place new files or move files in bithab. Describes each source layer and the root cleanliness rule.
---
<!-- build-forge:generated v1 body=0bafc35ee8c036f97c1856e495107107987e06be79af9bbbc276b60210593762 -->

<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# Directory structure of bithab

| Path | Purpose |
|---|---|
| `src/pages` | Page components for routes |
| `src/components/layout` | Shared UI layout components |
| `src/components/common` | Shared common UI components |
| `src/context` | Global state contexts |
| `src/api` | API client functions |
| `src/config` | Client Firebase initialization |
| `src/assets` | Static media and icons |
| `src/assets/css` | Component and global stylesheets |

Tests: live in a tests folder.

## Root

Allowed in the repo root: `index.html`, `vite.config.js`, `netlify.toml`, `firestore.rules`, `.oxlintrc.json`. Put nothing else there.

## Before you add a file

Search first with `repo-search`. Reuse or extend an existing file when it fits.
<!-- BEGIN CUSTOM: notes -->
<!-- END CUSTOM: notes -->
