# Qualivis

Visual analysis of the structure and code quality of component-based web applications (React),
based on *Visually Analyzing the Structure and Code Quality of Component-based Web Applications*
(Tarner, van den Bongard, Beck, VISSOFT 2021). Qualivis is the React rewrite of the original
Angular app "Component Graph".

Live: https://jonas0204.github.io/qualivis/ (state of `rewrite/react`)

> Work in progress. The plan and its status live in [docs/migration](docs/migration/README.md).
> The original Angular app is kept for reference in [legacy/angular](legacy/angular/LEGACY.md).
> AI agents start with [AGENTS.md](AGENTS.md).

## Requirements

- Node.js 24 (`.node-version`)
- pnpm 12 (pinned via `packageManager`; npm and yarn are not used)
- Windows or macOS

## Commands

| Command | Purpose |
|---|---|
| `pnpm install` | install dependencies (exact versions, 3-day minimum release age) |
| `pnpm check` | lint (Biome), type check (TypeScript), tests (Vitest) |
| `pnpm format` | format and fix with Biome |
| `pnpm dev` | start the app (from P04 on) |
| `pnpm legacy:extract` | extract the legacy production build (commit `5f0155e` on branch `gh-pages`) to `.cache/` |
| `pnpm legacy:serve` | serve the legacy build locally for golden captures ([tools/legacy](tools/legacy/README.md)) |

## Repository layout

| Path | Content |
|---|---|
| `docs/migration/` | migration plan, decisions (ADRs), status |
| `AGENTS.md`, `.claude/skills/` | entry point and workflows for AI agents (Claude Code, GitHub Copilot) |
| `legacy/angular/` | original Angular app, read-only reference |
| `testdata/` | fixtures and golden reference data ([testdata/README.md](testdata/README.md)) |
| `tools/` | development tools (legacy server, golden capture, JSON diff) |
| `patches/` | pnpm patches for the legacy analysis libraries |
