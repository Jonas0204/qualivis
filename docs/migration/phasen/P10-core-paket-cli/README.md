# P10 – Kern als Paket und CLI (Meilenstein M7)

**Ziel:** `@qualivis/core` ist als Paket baubar (keine npm-Veröffentlichung – O2), und
`@qualivis/cli` analysiert einen Ordner auf der Kommandozeile – mit denselben Ergebnissen wie die
App, mit Text- oder JSON-Ausgabe und Exit-Codes (auch für die CI). Das Projekt
prüft sich selbst damit (G6).

> Kompakte Karten; vor Beginn zu Einzeldateien verfeinern (S00). Erster Unterschritt jeder Karte ist
> ein kurzer Machbarkeitstest (Build-Werkzeug), weil diese Teile im Spike nicht geprüft wurden.

## S00 – Phase verfeinern (S)

## S01 – Build des Kerns als Paket (M)
- Problem: Der Quelltext nutzt Importe ohne Endung (`moduleResolution: bundler`); Node kann das
  ungebündelt nicht laden. Lösung: Vite-Library-Build (Rolldown) des Kerns zu `dist/index.js` (ESM,
  `target: 'node24'`, alle `dependencies` extern) + `tsc --emitDeclarationOnly` für `dist/*.d.ts`.
  Machbarkeit zuerst prüfen (CJS-Abhängigkeiten escomplex/Babel extern lassen; `cjsDefault` deckt
  Node-ESM-Interop ab).
- `package.json`: `exports` (Quelle für den Workspace) + `publishConfig.exports` (→ `dist`),
  `files: ["dist", "README.md"]`, `engines`, `sideEffects: false`, **`"private": true` bleibt**.
- Test: Die CLI (S02) importiert den gebauten Kern aus `dist/` und läuft auf Windows und macOS.

## S02 – CLI `qualivis analyze` (M)
- `packages/cli` (`@qualivis/cli`, privat, `bin: { qualivis: dist/cli.js }`), nur Node-Bordmittel
  (`node:util` `parseArgs`, `node:fs/promises`, `node:path`).
- `qualivis analyze <ordner> [--format text|json] [--fail-on error|warn|none] [--out <datei>]`
  - Dateien rekursiv lesen, Pfade wie beim Browser-Drop: `/<ordnername>/<relativer/pfad>` (POSIX,
    auch auf Windows).
  - `analyzeProject` + Regeln: für jede Komponente (AV-Sicht) und jede innere Funktion (KV-Sicht)
    Metriken, Schwellenwerte, Level und Icons (`describeIconText`).
  - JSON-Schema (versioniert): `{ version: 1, project, summary: { files, components, functions, warnings, errors }, items: [{ id, file, name, type, kind, lineStart, lineEnd, metrics: { <id>: { value, threshold, level } }, icons: [{ icon, level, text }] }] }`.
  - Text: Tabelle je Datei, Warnungen/Fehler hervorgehoben (ohne Farbbibliothek; ANSI nur bei TTY).
  - Exit-Codes: `0` ok, `1` Grenzwerte gemäß `--fail-on` verletzt, `2` Bedienfehler/IO-Fehler.
- Tests: CLI gegen `testdata/fixtures/mini` (Snapshot der JSON-Ausgabe; Zahlen müssen zu den Goldens
  passen), Exit-Codes, Fehlermeldungen.

## S03 – Eigenprüfung G6 („Dogfooding“) (S)
- Root-Skript `quality:self`: `qualivis analyze apps/web/src --fail-on error` (+ `packages/*/src` ohne
  `legacy/`). Kein Knoten darf `warning/error` haben (Qualitätskriterien §1). Läuft lokal und in der
  CI: in `.github/workflows/ci.yml` die Zeile `- run: pnpm quality:self` ergänzen (ADR-016, vorher
  nachfragen).
- Optional: Legacy-Capture des neuen Web-Quelltexts (G6-Teil 2); scheitert der alte Parser an neuer
  Syntax, dokumentieren und weglassen.

## Entfallen (Nutzerentscheidungen 07.11.2026)
- ~~CI-Vorschlag~~ – die CI kommt schon mit P03-S00 (ADR-016).
- ~~Veröffentlichung~~ – keine Lizenz, keine npm-Veröffentlichung (O2).
