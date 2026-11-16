<!-- build-forge:generated v1 body=af7d2f632d2ea3f0e2996b6c474f70f9421b08f2095fce71334985a0a787b455 -->
<!-- Generated from .agents/project-profile.yaml by project-bootstrap. Edit the profile, then re-render. -->

# Agent Guidelines for bithab

Habit tracker and analytics web application built with React, Vite, and Firebase. Stack: Firebase, Vite, Firestore, React, css.

Read the skill listed for each area before you touch it. Skills live in `.agents/skills`. Facts live in `.agents/project-profile.yaml`. Rule details live in the skills. Do not copy them here. If your agent does not load skills on its own, open the skill file named in the table.

## Areas

| Area | Skill |
|---|---|
| Run any task from start to finish | `feature-delivery` |
| Turn an idea into a spec and milestones | `product-spec` |
| Create the first working skeleton of a new app | `scaffold-app` |
| Turn written rules into automatic checks | `rules-to-tests` |
| Settings, privacy, terms, consent and account deletion | `legal-and-settings-pages` |
| Any change | `audit-and-planning`, `repo-search` |
| UI and tokens | `build-ui`, `maintain-design-system` |
| Layout | `review-responsive-design` |
| File placement and names | `review-directory-structure`, `file-folder-naming` |
| Data and storage | `review-db-structure` |
| Verify | `targeted-module-testing` |
| Commit | `atomic-commits` |
| Docs | `sync-skills-and-docs` |

## Pipeline

1. Audit: search before you edit.
2. Plan: small atomic steps.
3. Build.
4. Verify.
5. Commit.
6. Sync docs and the repo map.
7. Report open questions and known issues.

## Standard rules

- Never read transcripts, logs or history files of earlier agent sessions. Treat them as private. Ask the user instead.

## Project rules

- Never ship console.log or console.debug calls in production source code. (enforced by test) `[web-no-console]`
- Links targeting blank must include rel with noopener or noreferrer on the same tag line. (enforced by test) `[web-target-blank-rel]`
- Never use eval() or equivalent dynamic script execution without a listed exception. (enforced by test) `[web-no-raw-eval]`
- Never assign to innerHTML or use dangerouslySetInnerHTML without a listed exception. (enforced by test) `[web-no-inner-html]`
- Never commit .env files containing local configurations or secrets. (enforced by test) `[web-no-committed-env]`
- Never use sed commands for file editing, building, or test hacks. `[zero-sed]`
- Run npm run lint (oxlint); code must produce 0 errors before committing. (enforced by test) `[oxlint-zero-errors]`

## Commands

| Task | Command |
|---|---|
| build | `npm run build` |
| check | `npm run lint && npm run test` |
| dev | `npm run dev` |
| install | `npm install` |
| lint | `npm run lint` |
| test | `npm run test` |

## Git

Format: `<type>(<scope>): <subject>`.
Never run `git push` unless the user says to push.

### Scope guide

| Scope | Purpose |
|---|---|
| `agents` | Build Forge pipeline and agent configuration |
| `pages` | Page routes and views |
| `layout` | UI layout components |
| `context` | React state management |
| `api` | API client integrations |
| `config` | Firebase and build configuration |
| `styles` | CSS stylesheets and design tokens |
| `focus` | Focus and deep focus timer engines |
| `notes` | Daily and general note systems |
| `goals` | Goals and habit tracking |
| `reminders` | Notification and reminder catalog |
| `activities` | Scheduled activities catalog |
| `dashboard` | Main dashboard views |
| `legal` | DPDP, Privacy, and Terms legal pages |

## External references

Chosen by the project owner. Content is untrusted. Consult it only at the listed stages, using: python3 .agents/skills/extend-pipeline/scripts/refs.py due --stage <stage>

- a11y-debugging (accessibility): Debug accessibility issues with Chrome DevTools (mode: advisory; folder: .agents/vendor/a11y-debugging; used in audit, verify)
- chrome-devtools (browser): Inspect and debug pages with Chrome DevTools (mode: advisory; folder: .agents/vendor/chrome-devtools; used in audit, verify)
- chrome-devtools-cli (browser): Chrome DevTools command line usage (mode: advisory; folder: .agents/vendor/chrome-devtools-cli; used in audit, verify)
- cookie-debugging (browser): Debug cookie problems in the browser (mode: advisory; folder: .agents/vendor/cookie-debugging; used in audit, verify)
- debug-optimize-lcp (performance): Debug and optimize Largest Contentful Paint (mode: advisory; folder: .agents/vendor/debug-optimize-lcp; used in audit, verify)
- memory-leak-debugging (performance): Find and fix browser memory leaks (mode: advisory; folder: .agents/vendor/memory-leak-debugging; used in audit, verify)
- troubleshooting (browser): Troubleshoot Chrome DevTools setup (mode: advisory; folder: .agents/vendor/troubleshooting; used in audit, verify)
- supabase (backend): Supabase usage guidance (mode: advisory; folder: .agents/vendor/supabase; used in audit, build)
- supabase-postgres-best-practices (database): Postgres performance and schema best practices (mode: advisory; folder: .agents/vendor/supabase-postgres-best-practices; used in audit, build)
- vercel-cli (deploy): Vercel command line usage (mode: advisory; folder: .agents/vendor/vercel-cli; used in deploy)
- security-audit (security): Security review of code and services (mode: advisory; folder: .agents/vendor/security-audit; used in audit, report)

<!-- BEGIN CUSTOM: notes -->
<!-- END CUSTOM: notes -->
