# P04-S04 – Analyse-Fluss mit Fortschrittsbalken

Meilenstein M1 · Abhängig von: P04-S03 · Umfang S

## Ziel
Nach Auswahl/Drop wird analysiert; der Fortschrittsbalken (oben, Primärfarbe) zeigt den Stand; am
Ende wechselt die App in die Graph-Ansicht. Fehler werden angezeigt statt die App zu blockieren.

## Kontext
- Funktionsinventar U5, U6; ADR-011 A5 (Fehlermeldung)
- Altcode: `data.service.ts:28-91`, `graph-view.component.html:2-3`

## Dateien
`apps/web/src/features/analysis/runAnalysis.ts`, `runAnalysis.test.ts`,
`apps/web/src/ui/ProgressBar.tsx`, `ProgressBar.module.css`, `ProgressBar.test.tsx`,
`apps/web/src/app/App.tsx` (erweitern).

## Schritte
1. `runAnalysis(files: SourceFile[], store: JotaiStore, analyze = analyzeProjectAsync)` (`type JotaiStore = ReturnType<typeof createStore>`; in Komponenten über `useStore()` aus `jotai` geholt)
   (Analysefunktion injizierbar für Tests):
   1. `store.set(analysisAtom, { status: 'running', progress: 0, result: undefined, error: undefined })`;
      `store.set(viewModeAtom, 'graph')`, `store.set(componentIdAtom, undefined)` (Altsystem navigiert sofort zu `/graph`).
   2. `result = await analyze(files, { onProgress: p => store.set(analysisAtom, s => ({ ...s, progress: p })) })`.
   3. Erfolg: `store.set(analysisAtom, { status: 'done', progress: undefined, result, error: undefined })`.
   4. Fehler: `store.set(analysisAtom, { status: 'error', progress: undefined, result: undefined, error: message })`,
      `store.set(viewModeAtom, 'upload')`. Meldung: `Analysis failed: <Fehlertext>`.
2. `ProgressBar({ value })` (0–100, `role="progressbar"`, `aria-valuenow`, `aria-valuemin=0`,
   `aria-valuemax=100`): Höhe 4 px, Puffer `--qv-primary-light`, Füllung `--qv-primary`, Breite
   `value%` mit `transition: width 250ms` (Material). Absolut oben, volle Breite, `z-index 3`.
3. `App.tsx`: Upload-`onFiles` → `runAnalysis`. Während `status === 'running'` Balken anzeigen.
   Bei `status === 'error'` in der Upload-Ansicht eine Textzeile mit `role="alert"` unter der Karte
   (Snackbar folgt in P07).
4. Tests:
   - Erfolgsfall mit Fake-`analyze`, das zweimal Fortschritt meldet: Werte von `analysisAtom` in Reihenfolge
     `running(0)` → `running(50)` → `running(100)` → `done`, `viewModeAtom === 'graph'`.
   - Fehlerfall: `status === 'error'`, `error` enthält Meldung, `viewModeAtom === 'upload'`.
   - `ProgressBar`: `aria-valuenow` entspricht `value`; Breite der Füllung `value%`.
   - Integration (ohne Fake): `runAnalysis` mit den `mini`-Dateien (über `loadFixture` aus
     `packages/core/test/golden/loadFixture.ts` – dafür im Web-Test relativ importieren oder eine
     kleine Kopie in `apps/web/src/test/fixtures.ts`) → `result.appGraph.nodes.length === 8`.

## Akzeptanzkriterien
- [ ] Laden von `testdata/fixtures/realworld` im Browser zeigt kurz den Balken, danach Wechsel in die
      (noch leere) Graph-Ansicht; keine Konsolenfehler.
- [ ] Tests grün; `pnpm check` grün.

## Prüfen
`pnpm check`, `pnpm dev`

## Fallstricke
- Jedes `store.set(analysisAtom, …)` erzeugt ein neues Objekt – Komponenten lesen einzelne Felder über
  abgeleitete Atome (`useAtomValue(analysisProgressAtom)`), siehe S02.

## Nicht tun
- Kein Web Worker (P08-S04).

## Commit-Vorschlag
`feat(web): run analysis with progress bar and error state`
