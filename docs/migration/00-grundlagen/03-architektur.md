# Zielarchitektur

## 1. Überblick

```
┌──────────────────────────── apps/web (@qualivis/web) ────────────────────────────┐
│ React 19 · Vite 8                                                                 │
│  features/upload ─┐                                                               │
│  features/graph ──┼─► state/ (Jotai-Atome)                   ◄── lib/ (storage, …) │
│  features/code-quality, settings                                                  │
│  Bausteine aus common-components/ (Button, Select, Tooltip, Icon, Progress, …)    │
└──────────────────────────────────┬────────────────────────────────────────────────┘
                                   │ importiert nur die öffentliche API
┌──────────────────────── packages/core (@qualivis/core) ──────────────────────────┐
│ TypeScript, kein DOM, kein React · läuft in Node und Browser                      │
│  analysis/  analyzeProject(), escomplex-Adapter (path-browserify), interop        │
│  legacy/    1:1 übernommene Analysehelfer (traverse*, findReport, …)              │
│  rules/     Darstellungsregeln als reine Funktionen (Größe, Icons, Cluster, …)    │
│  model/     Typen und Konstanten (Metriken, Schwellenwerte, Farben)               │
└──────────────────────────────────┬────────────────────────────────────────────────┘
                                   │ (ab M7)
┌──────────────────────── packages/cli (@qualivis/cli) ────────────────────────────┐
│ Node · liest Ordner von der Platte, ruft core auf, gibt Text/JSON aus, Exit-Codes │
└───────────────────────────────────────────────────────────────────────────────────┘
e2e/ (@qualivis/e2e, Playwright, separat installierbar) · tools/ (Node-Skripte ohne Abhängigkeiten)
```

## 2. Abhängigkeitsregeln

1. `packages/core` importiert **nie** aus `apps/*`, nie React, nie DOM-APIs (`window`,
   `document`, `localStorage`). Die TS-Konfiguration von `core` hat `lib: ["es2023"]` **ohne** `dom`
   → Verstöße sind Typfehler. (Ausnahme: `File`-Typ wird nicht gebraucht; Eingabe ist
   `{ path: string; code: string }`.)
2. `apps/web` importiert aus `core` **nur** über `@qualivis/core` (Paket-Einstieg), nie über
   tiefe Pfade wie `@qualivis/core/src/legacy/...`.
3. Innerhalb von `apps/web`: `ui/` kennt keine Fachbegriffe (keine Imports aus `features/` oder
   `state/`), damit die Bausteine wiederverwendbar bleiben. Features dürfen andere Features nutzen,
   wenn ein größeres Feature ein kleineres braucht (wie eine Komponente eine andere) – aber **ohne
   Zyklen** (A importiert B und B importiert A ist verboten). Was mehrere Features ohne fachliche
   Zuordnung brauchen, gehört nach `lib/` oder `ui/`. (Die Bachelorarbeit fordert keine strengere
   Trennung; Ziel ist Modularität ohne Übertreibung.)
4. Regel 1 und 2 erzwingen TypeScript und pnpm: `core` hat `lib` ohne `dom` und kein React als
   Abhängigkeit (pnpm legt nur deklarierte Pakete in `node_modules`), und `exports` in
   `packages/core/package.json` gibt nur den Paket-Einstieg frei – tiefe Importe lösen nicht auf.

## 3. Zustand (State) mit Jotai

- Geteilter Zustand liegt in **Jotai-Atomen** (`jotai` 3.0.1, keine Abhängigkeiten). Ein Atom ist
  ein kleiner, typisierter Zustandsbaustein; Komponenten lesen/schreiben ihn mit `useAtomValue` /
  `useSetAtom` / `useAtom`. Abgeleiteter Zustand ist ein Atom mit `get`-Funktion – das hält
  Berechnungen aus den Komponenten heraus.
- `StateProvider` stellt einen Jotai-`Provider` mit eigenem `store` bereit. Komponenten- und
  Hook-Tests rendern über den `TestProvider` (eigener Store, Startwerte per `useHydrateAtoms`,
  `06-teststrategie.md` §2); reine Atom-Tests nutzen `createStore()` + `store.set(...)`
  → keine globalen Singletons im Test.
- Aktionen mit mehreren Schritten (z. B. Analyse starten) sind normale Funktionen, die den `store`
  bekommen (`runAnalysis(files, store)`), oder Schreib-Atome – beides testbar ohne React.

## 4. Persistenz

Schlüssel mit Präfix `qualivis.`: `settings` (über Jotai `atomWithStorage` mit validierendem
Storage), `analysis` (FileMap + App-Graph + Report, explizit gespeichert über `lib/storage.ts`),
`once.<hinweis>`. `lib/storage.ts` kapselt `localStorage` mit `try/catch` (Quota, Privatmodus).
Die Analyse wird nach jeder Analyse und beim Verlassen (`pagehide`) gespeichert; Fehler beim
Speichern werden einmal als Snackbar gemeldet, nie als Absturz.

## 5. Styling

- Basis-Tokens (Farben, Schrift, Radien) aus `common-components/theme.css`, Hell- und Dunkelmodus
  nach Systemeinstellung. App-eigene Farben (Graph, Metrik-Stufen) in `styles/tokens.css`, jeweils
  als `light-dark(hell, dunkel)`.
- UI-Bausteine und Panels: **CSS Modules** (`*.module.css`, in Vite eingebaut) → keine globalen
  Kollisionen.
- Graph: eine globale Datei `features/graph/graph.css`, alle Regeln unter `.qv-graph` geschachtelt,
  Klassennamen wie im Altsystem.
- Text in der Systemschrift von `theme.css`.
