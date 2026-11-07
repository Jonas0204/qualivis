# P04-S02 – Zustand mit Jotai: erste Atome und Provider

Meilenstein M1 · Abhängig von: P04-S01 · Umfang S

## Ziel
Geteilter Zustand liegt in Jotai-Atomen; ein `StateProvider` stellt einen eigenen Jotai-Store bereit.
Die Testhilfen `TestProvider` und `renderWithState` geben jedem Test einen eigenen Store mit
festen Startwerten (`useHydrateAtoms`). Erste Atome: Analyse und Ansicht.

## Kontext
- `00-grundlagen/03-architektur.md` §5; `00-grundlagen/06-teststrategie.md` §2 („Zustand im Test“);
  ADR-013, ADR-015; **Vorlage `anhang/A7-test-provider.md`**
- Jotai 3.0.1 (bei API-Fragen die Doku der installierten Version; v3 ist für App-Code weitgehend
  kompatibel zu v2). Genutzte API: `atom`, `useAtom`, `useAtomValue`, `useSetAtom`, `createStore`,
  `Provider`, `useHydrateAtoms` (aus `jotai/utils`, nur in Tests); später `atomWithStorage`.

## Dateien
`apps/web/src/state/analysisAtoms.ts` (+ Test), `viewAtoms.ts` (+ Test), `StateProvider.tsx`,
`apps/web/src/test/TestProvider.tsx` (+ Test), `apps/web/src/test/renderWithState.tsx`.

## Schritte
1. `analysisAtoms.ts`:
   ```ts
   import type { AnalysisResult } from '@qualivis/core';
   import { atom } from 'jotai';

   export type AnalysisStatus = 'idle' | 'running' | 'done' | 'error';
   export type AnalysisState = {
     status: AnalysisStatus;
     progress: number | undefined;   // undefined = no progress bar (legacy semantics)
     result: AnalysisResult | undefined;
     error: string | undefined;
   };
   export const initialAnalysisState: AnalysisState = { status: 'idle', progress: undefined, result: undefined, error: undefined };
   export const analysisAtom = atom<AnalysisState>(initialAnalysisState);
   /** Derived: only the progress value (components re-render only when it changes). */
   export const analysisProgressAtom = atom(get => get(analysisAtom).progress);
   ```
2. `viewAtoms.ts`:
   ```ts
   import { atom } from 'jotai';

   export type ViewMode = 'upload' | 'graph';
   export const viewModeAtom = atom<ViewMode>('upload');
   export const componentIdAtom = atom<string | undefined>(undefined);
   ```
3. `StateProvider.tsx` wörtlich aus `anhang/A7` (mit exportiertem Typ `StateStore`).
   `main.tsx` umschließt `<App />` mit `<StateProvider>`.
4. Testhilfen wörtlich aus `anhang/A7`:
   - `test/TestProvider.tsx`: `TestProvider` (= `StateProvider` + `useHydrateAtoms`), `initial(atom, value)`,
     Typ `InitialAtomValue`.
   - `test/renderWithState.tsx`: `renderWithState(ui, { store, initialValues })` →
     `{ store, user, …render }` und `renderHookWithState(hook, { store, initialValues })` →
     `{ store, …renderHook }`.
5. Tests:
   - `analysisAtom` (ohne React, `createStore()`): Startwert; `store.set` + `store.get`; abgeleitetes
     `analysisProgressAtom` folgt.
   - `test/TestProvider.test.tsx` wörtlich aus `anhang/A7`: Startwert gilt schon beim ersten Rendern;
     jeder Aufruf hat einen eigenen Store; Hook mit abgeleitetem Atom; falscher Werttyp bei `initial()`
     ist ein Typfehler (`// @ts-expect-error`).

## Akzeptanzkriterien
- [ ] Tests grün, `pnpm check` grün (inklusive `tsc`: das `@ts-expect-error` muss greifen); keine
  eigene Store-Implementierung im Code.
- [ ] Die Vorlage A7 ist erstmals ausgeführt; Ergebnis in `STATUS.md` notiert (und in A7 den Hinweis
  „nicht ausgeführt“ durch „geprüft in P04-S02“ ersetzen).

## Prüfen
`pnpm exec vitest run --project web`

## Fallstricke
- Abgeleitete Atome statt Objekt-Selektoren in Komponenten (`useAtomValue(atom(get => ({…})))`
  innerhalb der Render-Funktion erzeugt bei jedem Render ein neues Atom – Atome immer auf Modulebene
  definieren).
- Ohne `StateProvider` nutzt Jotai einen globalen Default-Store – im Code immer innerhalb des Providers
  arbeiten, in Tests immer `renderWithState`/`renderHookWithState`.
- `useHydrateAtoms` setzt einen Wert pro Store nur **einmal** – Startwerte also nicht durch erneutes
  Rendern ändern wollen, sondern einen neuen Store nehmen (Standard von `renderWithState`).
- Die Vorlage A7 wurde noch nie ausgeführt. Lehnen `tsc` oder Biome sie ab (z. B. bei
  `useHydrateAtoms(new Map(initialValues))` oder `initial()`): **nicht** mit `any`, Cast oder
  `biome-ignore` lösen, sondern stoppen und melden (R9); Ausweichlösung steht in A7.

## Nicht tun
- Kein Persistieren hier (kommt mit `settingsAtom` in P07).

## Commit-Vorschlag
`feat(web): add Jotai state, atoms and test provider`
