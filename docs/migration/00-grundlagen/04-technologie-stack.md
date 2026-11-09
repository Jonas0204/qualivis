# Technologie-Stack

Die **einzige** Stelle mit Versionsnummern ist der Catalog in
[`pnpm-workspace.yaml`](../../../pnpm-workspace.yaml); Node und pnpm stehen in `.node-version` und
`packageManager`. Alle Versionen sind fest gepinnt, Updates sind bewusste Änderungen dort. Entwickelt
wird auf **Windows und macOS**; alle Befehle sind auf beiden gleich.

## 1. Werkzeuge

| Werkzeug | Hinweis |
|---|---|
| Node.js 24 (LTS) | `.node-version` = `24`, `engines.node` = `>=24` |
| pnpm 12 | per `packageManager` gepinnt; npm und yarn werden nicht benutzt |
| TypeScript 7 (nativer Compiler) | nur `tsc --noEmit` zur Prüfung; Vite transpiliert selbst |
| Vite 8 (Rolldown) | Dev-Server nur auf `127.0.0.1` (Sicherheitsmeldungen betreffen den Dev-Server) |
| Vitest 5 | Testrunner; Umgebungen `node` (core) und `jsdom` (web), siehe `06-teststrategie.md` §2 |
| Biome 2.6 | ersetzt ESLint und Prettier; `linter.rules.preset: "recommended"`; prüft kein Markdown |
| Playwright (nur `e2e/`, ab P09) | installiertes Microsoft Edge (`msedge`), **kein** Browser-Download (ADR-008, ADR-018) |

## 2. Pakete und ihr Zweck

| Paket | Workspace | Zweck |
|---|---|---|
| `@babel/parser`, `@babel/traverse`, `@babel/types` | core | AST lesen und durchlaufen (Babel 7, ADR-004) |
| `typhonjs-escomplex-project` | core | Metriken (+ 2 pnpm-Patches, §4) |
| `jlouvain` | core | Louvain-Cluster |
| `path-browserify` | core, web | Nodes `path.posix` als Paket, für escomplex in Node **und** Browser (ADR-005) |
| `webcola` | web | geschichtetes Layout (nur `dist/src/layout`) |
| `d3-force` | web | Kraft-Layout |
| `react`, `react-dom` | web | UI |
| `jotai` | web | Zustandsverwaltung (ADR-013) |
| `@codemirror/state`, `/view`, `/language`, `/lang-javascript`, `/search` | web | Quelltext-Anzeige mit Suche (Strg/Cmd+F) |
| `@fontsource/roboto`, `@fontsource/material-icons` | web | Schrift und Icons lokal (ADR-009) |

Die Entwicklungs-Abhängigkeiten (TypeScript, Biome, Vite, Vitest, jsdom, Testing Library, Typen,
Playwright) stehen ebenfalls im Catalog.

**Bewusst nicht verwendet:** UI-Bibliotheken (MUI: 31 Pakete + Emotion), d3-zoom/-drag/-selection/
-transition/-color (durch eigenen Code ersetzt, ADR-003), Router-Pakete, `@testing-library/jest-dom`
(normale Assertions genügen), happy-dom (8 Sicherheitsmeldungen, 3 kritisch), Vitest-Browser-Modus
(5 Meldungen, 3 kritisch), `react-test-renderer` (seit React 19 abgekündigt), Jest mit
`jest-environment-jsdom`/`jest-junit` (zweiter Testrunner, 323 Pakete; Vitest hat einen
JUnit-Reporter eingebaut), ESLint/Prettier (≈ 100 Pakete), Coverage-Werkzeuge (kein Zusatzpaket).
Begründung zu den Testwerkzeugen: ADR-015.

## 3. Regeln für Abhängigkeiten

- **Catalog:** Die `package.json` der Pakete schreiben nur `"react": "catalog:"`. Ein Update ändert
  nur `pnpm-workspace.yaml`.
- **Mindestalter:** Neue Versionen müssen mindestens 3 Tage alt sein (`minimumReleaseAge: 4320`).
  Bietet pnpm an, eine zu junge Version auszunehmen (`minimumReleaseAgeExclude`): **ablehnen** und
  eine ältere Version des Hauptpakets wählen. Ausnahmen mischen Versionen (im Spike: zwei
  parse5-Versionen, kaputtes jsdom).
- **Install-Skripte:** `strictDepBuilds` bricht ab, wenn ein Paket ein Install-Skript hat, das nicht
  in `allowBuilds` steht. Dann stoppen, dem Nutzer Paket und Skript nennen, Entscheidung abwarten.
- **Tippfehler:** Bei unbekannten Schlüsseln in `pnpm-workspace.yaml` bricht pnpm mit
  `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` ab.
- **Erster Install:** `@codemirror/search` und `@playwright/test` waren im Spike nicht installiert;
  beim ersten Install auf die Auflösung achten.

## 4. Patches

Zwei alte escomplex-Pakete haben Fehler, die das Altsystem mit patch-package korrigiert hat. pnpm
wendet dieselben Korrekturen selbst an: Die Dateien liegen in `patches/`, `patchedDependencies` in
`pnpm-workspace.yaml` ordnet sie den Paketen zu, der Hash steht im Lockfile. Passt ein Patch nach
einem Versionswechsel nicht mehr, bricht die Installation ab.

| Paket | Problem | Korrektur |
|---|---|---|
| `typhonjs-escomplex-commons@0.1.1` (`utils/ast/astSyntax.js`) | Bei Zuweisungen mit einem AST-Knotentyp, den escomplex nicht kennt (neuere Syntax), wird eine nicht existierende Funktion aufgerufen → Absturz | Zwei Abfragen `if (typeof this[node.right.type] === 'function')` |
| `typhonjs-plugin-manager@0.2.0` (`dist/PluginManager.js`) | Lädt Plugins per dynamischem `require(pfad)`; das bricht Bundler im Browser | Vier `require(...)`-Aufrufe auskommentiert (werden nicht gebraucht) |

Einen Patch ändern: `pnpm patch <paket>@<version>` (öffnet eine Kopie zum Bearbeiten), danach
`pnpm patch-commit <pfad>`. Beides nur nach Nachfrage (README R4).
