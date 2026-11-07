# A6 – Spike-Protokoll (07.11.2026)

Ziel: die riskantesten Annahmen des Plans **vor** der Umsetzung am echten Stack prüfen. Der Spike
lief im Scratchpad außerhalb des Repos und wurde nicht übernommen. Die Installation hat der
Nutzer selbst ausgeführt, weil ein Hook (`guard.js`) `pnpm install` für den Assistenten blockiert.
Das gilt auch für die Umsetzung (siehe `README.md`, Regel R4).

## Ergebnisse

| # | Annahme | Ergebnis |
|---|---|---|
| V1 | Alter Build lässt sich ohne alte Abhängigkeiten starten | ✅ `git archive origin/gh-pages` + Node-Server (A1) unter `/component-graph/` |
| V2 | Referenzdaten lassen sich automatisch aus dem alten Build gewinnen | ✅ synthetischer Drop + `onbeforeunload()` + `__data__` (A2), komplettes Skript verifiziert |
| V3 | escomplex 0.1 + Babel **7.29.12** liefern dieselben Zahlen wie Babel 7.7/7.8 | ✅ **0 Abweichungen** (Report, FileMap, App-Graph) für `mini` (8 Dateien) und `realworld` (38 Dateien) |
| V4 | Die beiden patch-package-Patches funktionieren als pnpm-Patches | ✅ Pfade `a/node_modules/<pkg>/` → `a/` umgeschrieben, `patchedDependencies` greift (Hash im Lockfile) |
| V5 | Kern läuft im Vite-8-Browser-Bundle | ✅ nach `cjsDefault()` für `@babel/traverse` und `ESComplexProject`; Browser-Ergebnis = Legacy (0 Abweichungen) |
| V6 | Node-`path` vs. Browser | ⚠️ Windows-`path` verfälscht projektweite Metriken → `posixPath` (A4) |
| V7 | Dateireihenfolge | ⚠️ App-Graph-Reihenfolge folgt der Eingabe → kanonisch sortieren (ADR-006) |
| V8 | WebCola ohne d3-Adapter | ✅ `import { Layout } from 'webcola/dist/src/layout'`; synchroner Start; Positionen = Legacy bis auf Verschiebung (Seed-deterministisch) |
| V9 | jLouvain | ✅ läuft im Bundle, kein Zufall im Code |
| V10 | d3-force 3 | ✅ (aufgelöst 3.0.0 wegen `minimumReleaseAge`) |
| V11 | CodeMirror 6 | ✅ read-only, Zeilennummern, `javascript({ jsx: true, typescript: true })` |
| V12 | TypeScript **7.0.2** | ✅ Web-Code 0 eigene Fehler; übernommener Kern: 47 Fehler bei `strict` + `noImplicitAny: false`, 116 bei vollem `strict`, 10 bei `strict: false` |
| V13 | Biome **2.6.4** | ✅ läuft; Konfig verlangt `"linter.rules.preset": "recommended"` (statt `"recommended": true`); Altcode: 20 Fehler, 38 Warnungen (u. a. 15× `useImportType`, 12× kognitive Komplexität > 15) |
| V14 | Vitest **5.0.5** mit `test.projects` | ✅ Kern-Projekt (node) und Web-Projekt (jsdom) gemeinsam |
| V15 | jsdom + React 19.3 + Testing Library 16.3 + user-event 14.6 | ✅ mit **jsdom 30.1.3**; ❌ jsdom 31.0.0 (siehe Fallstrick F1) |
| V16 | Bundle-Größe | 1,72 MB (468 KB gzip) in einem Chunk → Code-Splitting in P08-S04 |
| V17 | Analysezeit `mini` im Browser | 49 ms |
| V18 | `Buffer`-Hack aus alter `index.html` | nicht nötig (`jsesc` prüft `typeof Buffer`) |
| V19 | Formeln in `03-visuelle-regeln.md` (§2 Größe, §3 Icons, §5 Vorschau-Geometrie) | ✅ unabhängige Nachrechnung gegen die Legacy-Captures von `mini`: **100/100** Prüfungen exakt (AV + 4 KVs, Breiten ±1e-9, Icon-Reihenfolge, `cx/cy`, `hidden`) |
| V20 | Biome-Konfiguration aus P01-S03 inkl. Overrides | ✅ gültig; `!legacy`/`!testdata` schließen die Root-Ordner aus, `packages/core/src/legacy` wird mit Override geprüft (nur noch 15× `useImportType`, automatisch behebbar) |
| V21 | Vitest: Inline-Projekt (`tools`) + Pfad-Projekte, Filter `--project core test/golden` | ✅ 9 Tests (3 Projekte) bzw. 6 Golden-Tests |
| V22 | Übernommener POSIX-Pfad aus Node | ⚠️ verletzt Komplexitätsgrenze (41/21/32) → **ersetzt** durch das Paket `path-browserify` (Nutzerentscheidung, ADR-005); keine kopierte Datei mehr |
| V23 | pnpm-12-Schlüssel `saveExact`, `minimumReleaseAge: 4320` | ✅ erkannt; unbekannter Schlüssel → Abbruch `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` (wegen `packageManager`-Pin) |
| V24 | Biome `useConsistentTypeDefinitions` mit `style: "type"` | ✅ meldet `interface`, automatisch behebbar |

Nachträgliche Entscheidungen (nach dem Spike, nicht mehr am Spike geprüft): Jotai statt eigenem
Store, `path-browserify` statt Portierung, feste Versionen, Node 24 statt 26, `@playwright/test`
1.64.1. Diese Punkte prüft der jeweils erste Umsetzungsschritt (P01-S04, P03-S03, P04-S02).

## Aufgelöste Versionen (mit `minimumReleaseAge: 10080`)

`@babel/parser 7.29.12`, `@babel/traverse 7.29.12`, `@babel/types 7.29.11`,
`typhonjs-escomplex-project 0.1.0`, `webcola 3.4.0`, `jlouvain 2.0.0`, `d3-force 3.0.0`,
`react/react-dom 19.3.1`, `@types/react(-dom) 19.3.0`, `@codemirror/view 6.43.15`,
`@codemirror/state 6.7.6`, `@codemirror/language 6.13.1`, `@codemirror/lang-javascript 6.2.5`,
`vite 8.3.5`, `@vitejs/plugin-react 6.1.2`, `vitest 5.0.5`, `jsdom 30.1.3`,
`@testing-library/react 16.3.3`, `@testing-library/dom 10.4.2`, `@testing-library/user-event 14.6.8`,
`@biomejs/biome 2.6.4`, `typescript 7.0.2`. Lockfile: 361 Einträge (inkl. Plattform-Binärpakete).

## Fallstricke (in den Plan übernommen)

- **F1 – Ausnahmen von `minimumReleaseAge` mischen Versionen.** pnpm bot beim ersten Install an,
  zu junge Versionen einzeln auszunehmen (`minimumReleaseAgeExclude`). Ergebnis: `jsdom@31.0.0`
  bekam `parse5@8.1.0`, `parse5-parser-stream@8.1.0` aber `parse5@8.0.1` → Laufzeitfehler
  `this.parser.tokenizer.flushCharacters is not a function`. **Regel:** keine Einzelausnahmen;
  stattdessen ältere Linie des Hauptpakets wählen (`~`-Bereich im Catalog).
- **F2 – `strictDepBuilds`** bricht ab, wenn ein Paket ein Install-Skript hat und nicht in
  `allowBuilds` steht. Betroffen: `core-js@2.6.12` (postinstall-Werbung, über escomplex) und
  `fsevents` (nur macOS). Beide auf `false`.
- **F3 – `toHaveAttribute` & Co.** gibt es nur mit `@testing-library/jest-dom` (zusätzliche
  Abhängigkeiten). Plan: nicht installieren, normale Assertions verwenden
  (`expect(el.getAttribute('aria-checked')).toBe('true')`).
- **F4 – Typecheck der Web-App prüft den Kern mit.** Workspace-Importe zeigen auf
  `packages/core/src/*.ts`; Typfehler im Kern erscheinen auch in `apps/web`. Kern zuerst fehlerfrei
  machen (P03-S02).
- **F5 – `utils.test.js` im Fixture.** Vitest würde Dateien in `testdata/` als Tests einsammeln →
  `testdata/**` in jeder Vitest-Konfiguration ausschließen; Biome und TypeScript ebenso.
- **F6 – Legacy speichert beim Verlassen.** Vor `localStorage.clear()` `window.onbeforeunload = null`.
