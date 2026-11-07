# P03-S03 – escomplex-Adapter mit `path-browserify`

Meilenstein M1 · Abhängig von: P03-S02 · Umfang S

## Ziel
escomplex läuft betriebssystemunabhängig genau wie im alten Browser-Build: über
`new ESComplexProject(pathBrowserify)`. Kein kopierter Node-Code im Repo.

## Kontext
- ADR-005 (warum ein POSIX-Pfad-Modul nötig ist und wo es gebraucht wird)
- `anhang/A4-posix-path-und-interop.md` (Code: Typdeklaration, Test, Adapter)
- `anhang/A6` V6 (Windows-`path` verfälscht projektweite Metriken)

## Dateien
`packages/core/src/types/path-browserify.d.ts` (aus S01), `packages/core/src/analysis/pathModule.test.ts`,
`packages/core/src/analysis/escomplex.ts`, `packages/core/src/analysis/escomplex.test.ts`.

## Schritte
1. Sicherstellen, dass `path-browserify` (Catalog `1.0.1`) in `packages/core/package.json` steht
   (S01) und installiert ist.
2. `pathModule.test.ts` aus A4: `path-browserify` liefert für unsere Pfadformen dieselben Ergebnisse
   wie `node:path` (`posix`).
3. `escomplex.ts` aus A4 (`analyzeModules(modules)` mit `pathBrowserify`).
4. `escomplex.test.ts` (Verhalten): Zwei kleine Module über den Legacy-Parser parsen
   (`parse(code, '/p/src/a.js')`), `analyzeModules` aufrufen:
   - `report.modules` hat Länge 2, `srcPath` unverändert.
   - Für `function f(a, b) { if (a) { return b; } return 0; }`: Methode `f` mit `cyclomatic 2`,
     `paramCount 2`.
   - Wenn `a.js` `import x from './b'` enthält, erscheint die Abhängigkeit in
     `report.adjacencyList` (beweist, dass die POSIX-Pfadauflösung funktioniert – unter Windows mit
     Node-`path` würde sie fehlen).

## Akzeptanzkriterien
- [ ] Pfad-Test und escomplex-Tests grün, auf Windows **und** macOS.
- [ ] Keine Datei mit kopiertem Node-Code im Repo.
- [ ] `pnpm check` grün.

## Prüfen
`pnpm --filter @qualivis/core test`

## Fallstricke
- **Nicht** `import escomplexProject from 'typhonjs-escomplex-project'` verwenden (Default-Instanz
  mit Node-`path`).
- Deep-Import `typhonjs-escomplex-project/dist/ESComplexProject` funktioniert, weil das Paket kein
  `exports`-Feld hat.
- Der Spike nutzte eine wortgleiche Portierung von Nodes POSIX-Code. Sollte G1 (S05) wider Erwarten
  nur in den projektweiten Feldern (`adjacencyList` …) abweichen: Ursache ist das Pfad-Modul →
  stoppen und den Nutzer informieren.

## Nicht tun
- Keine escomplex-Optionen setzen (Standard wie im Altsystem).

## Commit-Vorschlag
`feat(core): run escomplex with path-browserify as POSIX path module`
