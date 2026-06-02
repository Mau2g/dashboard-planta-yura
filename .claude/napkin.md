# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-06-02] Build emits Svelte warnings but still succeeds**
   Do instead: treat `non_reactive_update` and `a11y_label_has_associated_control` as warnings, not errors — `npm run build` completes cleanly.

2. **[2026-06-02] `src/app.css` is the canonical CSS entry point**
   Do instead: import tokens and Tailwind here; do NOT edit `src/routes/layout.css` (will be removed later).

## Shell & Command Reliability
1. **[2026-06-02] npm commands must run from project root**
   Do instead: always `cd "C:\Users\hsg_g\OneDrive\Escritorio\Dashboard PP Nato"` before any npm/git call.

## Domain Behavior Guardrails
1. **[2026-06-02] Design tokens use CSS custom properties with `--c-*` prefix**
   Do instead: reference tokens via `var(--c-primary)` etc.; Tailwind aliases map `--color-primary` → `var(--c-primary)`.

2. **[2026-06-02] Theme switching uses `data-theme` on `<html>`, not a class**
   Do instead: use `[data-theme='dark']` selectors; anti-flash script sets `document.documentElement.dataset.theme`.

## User Directives
1. **[2026-06-02] Task list is tracked via TaskCreate/TaskUpdate tools**
   Do instead: mark tasks `in_progress` when starting, `completed` when done.
