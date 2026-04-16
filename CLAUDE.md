# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CHRONOS Ponto Corporativo** — A high-fidelity React UI prototype for a Brazilian corporate HR/attendance management system. The entire application lives in a single file: `chronos-ponto-system.jsx`.

There is no package.json, build tooling, or bundler. The component is designed to be dropped directly into an existing React application.

## Architecture

### Single-file structure (`chronos-ponto-system.jsx`)

| Lines | Content |
|-------|---------|
| 1–32 | SVG icon components (Clock, Users, Shield, BarChart, etc.) |
| 35–67 | Static mock data arrays: `employees`, `auditEvents`, `approvalRequests` |
| 68–193 | Mini chart components (`MiniBarChart`, `DonutChart`) + design tokens object `s` |
| 194+ | Root component `ChronosPontoSystem` (default export) |

### Navigation sections (controlled by `activeSection` state)
`dashboard` · `employee-panel` · `clock` · `employees` · `schedules` · `approvals` · `reports` · `audit` · `biometrics`

### State
All state is managed with `useState` hooks inside the root `ChronosPontoSystem` component — no external state library. ~18 state variables cover authentication, active section, clock registration flow, search/filter, and sidebar toggle.

### Styling
All styles are inline. A central `s` object (around line 175) holds the dark-theme design tokens:
- Background: `#0a0f1a` → `#111827`
- Primary: `#2563eb` (blue), Accent: `#06b6d4` (cyan)
- Success/Warning/Danger: `#10b981` / `#f59e0b` / `#ef4444`
- Fonts: "DM Sans" (UI), "JetBrains Mono" (monospace)

All UI text is in **Brazilian Portuguese** with `pt-BR` locale for date/time formatting.

### Demo credentials (hardcoded)
| Email | Role |
|-------|------|
| `admin@slowmancy.com` | Admin |
| `rh@slowmancy.com` | HR |
| `gestor@slowmancy.com` | Manager |
| `colab@slowmancy.com` | Employee |

Password for all: `123456`

## GitHub Repository

**Repo:** https://github.com/KaynamSantiago-Tech/chronos-ponto-corporativo
**Branch:** master

### Auto-sync
A `PostToolUse` hook in `.claude/settings.local.json` automatically commits and pushes to GitHub after every `Edit` or `Write` operation. No manual `git push` needed — every file change is synced automatically.

To push manually:
```bash
cd "c:/Users/Usuario/Desktop/Projetos Claude Code"
git add -A && git commit -m "mensagem" && git push origin master
```
