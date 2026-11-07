# P04-S02 – Zustand mit Jotai: erste Atome und Provider

Meilenstein M1 · Abhängig von: P04-S01 · Umfang S

## Ziel
Geteilter Zustand liegt in Jotai-Atomen; ein `StateProvider` stellt einen eigenen Jotai-Store bereit,
damit Tests isoliert laufen. Erste Atome: Analyse und Ansicht.

## Kontext
- `00-grundlagen/03-architektur.md` §5; ADR-013
- Jotai 3.0.1 (bei API-Fragen die Doku der installierten Version; v3 ist für App-Code weitgehend
  kompatibel zu v2). Genutzte API: `atom`, `useAtom`, `useAtomValue`, `useSetAtom`, `createStore`,
  `Provider`; später `atomWithStorage` aus `jotai/utils`.

## Dateien
`apps/web/src/state/analysisAtoms.ts` (+ Test), `viewAtoms.ts` (+ Test), `StateProvider.tsx`
(+ Test), `apps/web/src/test/renderWithState.tsx`.

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
   export type ViewMode = 'upload' | 'graph';
   export const viewModeAtom = atom<ViewMode>('upload');
   export const componentIdAtom = atom<string | undefined>(undefined);
   ```
3. `StateProvider.tsx`:
   ```tsx
   import { createStore, Provider } from 'jotai';
   import { type ReactNode, useState } from 'react';

   type StateProviderProps = { store?: ReturnType<typeof createStore>; children: ReactNode };

   /** Provides an isolated Jotai store (tests pass their own). */
   export function StateProvider({ store, children }: StateProviderProps) {
     const [value] = useState(() => store ?? createStore());
     return <Provider store={value}>{children}</Provider>;
   }
   ```
   `main.tsx` umschließt `<App />` mit `<StateProvider>`.
4. Testhilfe `test/renderWithState.tsx`: `renderWithState(ui, { store = createStore() } = {})` →
   `{ store, ...render(<StateProvider store={store}>{ui}</StateProvider>) }`.
5. Tests:
   - `analysisAtom`: Startwert; `store.set` + `store.get`; abgeleitetes `analysisProgressAtom` folgt.
   - Komponente mit `useAtomValue(viewModeAtom)` zeigt Wert; nach `act(() => store.set(viewModeAtom, 'graph'))`
     neuer Wert.
   - Zwei Provider mit eigenen Stores beeinflussen sich nicht.

## Akzeptanzkriterien
- [ ] Tests grün, `pnpm check` grün; keine eigene Store-Implementierung im Code.

## Prüfen
`pnpm exec vitest run --project web`

## Fallstricke
- Abgeleitete Atome statt Objekt-Selektoren in Komponenten (`useAtomValue(atom(get => ({…})))`
  innerhalb der Render-Funktion erzeugt bei jedem Render ein neues Atom – Atome immer auf Modulebene
  definieren).
- Ohne `StateProvider` nutzt Jotai einen globalen Default-Store – im Code immer innerhalb des Providers
  arbeiten, in Tests immer `renderWithState`.

## Nicht tun
- Kein Persistieren hier (kommt mit `settingsAtom` in P07).

## Commit-Vorschlag
`feat(web): add Jotai state provider with analysis and view atoms`
