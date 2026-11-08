# A7 – Testhilfen für Jotai: `TestProvider`, `initial`, `renderWithState`

Zweck: Jeder Komponenten- und Hook-Test startet mit einem **eigenen** Jotai-Store und **bekannten**
Startwerten, ohne den globalen Jotai-Standard-Store. Muster: Jotai-Testanleitung
(`Provider` + `useHydrateAtoms`) und Jotai-Diskussion
[#2650](https://github.com/pmndrs/jotai/discussions/2650), dort ging es um die Typisierung von
`initialValues`. Warum jsdom trotzdem bleibt: ADR-015.

> **Stand der Verifikation:** Diese Vorlage ist nur **geschrieben, nicht ausgeführt** (Nutzerentscheidung
> 07.11.2026: ohne Spike weiter). Sie wird in **P04-S02** zum ersten Mal ausgeführt (Tests, `tsc`,
> Biome). Bereits geprüft: `useHydrateAtoms` ist in `jotai@3.0.1` unter `jotai/utils` exportiert.
> Außerdem sind React 19.3, Testing Library 16.3 und user-event 14.6 in jsdom 30.1.3 im Spike gelaufen
> (A6, V15).

## Dateien

| Datei | Inhalt | Eingeführt |
|---|---|---|
| `apps/web/src/state/StateProvider.tsx` | `StateProvider`, Typ `StateStore` (auch von der App benutzt) | P04-S02 |
| `apps/web/src/test/TestProvider.tsx` | `TestProvider`, `initial`, Typ `InitialAtomValue` | P04-S02 |
| `apps/web/src/test/renderWithState.tsx` | `renderWithState`, `renderHookWithState` | P04-S02 |
| `apps/web/src/test/TestProvider.test.tsx` | Tests der Testhilfen | P04-S02 |

## `state/StateProvider.tsx`

```tsx
import { createStore, Provider } from 'jotai';
import { type ReactNode, useState } from 'react';

export type StateStore = ReturnType<typeof createStore>;

type StateProviderProps = { store?: StateStore; children: ReactNode };

/** Provides an isolated Jotai store (tests pass their own). */
export function StateProvider({ store, children }: StateProviderProps) {
  const [value] = useState(() => store ?? createStore());
  return <Provider store={value}>{children}</Provider>;
}
```

## `test/TestProvider.tsx`

```tsx
import type { WritableAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import type { ReactNode } from 'react';
import { StateProvider, type StateStore } from '../state/StateProvider';

/** Any writable atom: `never[]` accepts every write signature (jotai discussion #2650). */
type AnyWritableAtom = WritableAtom<unknown, never[], unknown>;

/** One entry of `initialValues`; create it with `initial()` so the value is type-checked. */
export type InitialAtomValue = readonly [AnyWritableAtom, unknown];

/** Type-safe `[atom, value]` pair: the value must fit the atom. */
export function initial<Value>(
  atom: WritableAtom<Value, [Value], unknown>,
  value: NoInfer<Value>
): InitialAtomValue {
  return [atom, value];
}

type HydrateAtomsProps = { initialValues: readonly InitialAtomValue[]; children: ReactNode };

function HydrateAtoms({ initialValues, children }: HydrateAtomsProps) {
  useHydrateAtoms(new Map(initialValues));
  return children;
}

type TestProviderProps = {
  store?: StateStore;
  initialValues?: readonly InitialAtomValue[];
  children: ReactNode;
};

/** Isolated store plus initial atom values for component and hook tests. */
export function TestProvider({ store, initialValues = [], children }: TestProviderProps) {
  return (
    <StateProvider store={store}>
      <HydrateAtoms initialValues={initialValues}>{children}</HydrateAtoms>
    </StateProvider>
  );
}
```

## `test/renderWithState.tsx`

```tsx
import { render, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createStore } from 'jotai';
import type { ReactElement, ReactNode } from 'react';
import type { StateStore } from '../state/StateProvider';
import { type InitialAtomValue, TestProvider } from './TestProvider';

export type StateOptions = { store?: StateStore; initialValues?: readonly InitialAtomValue[] };

function createWrapper(store: StateStore, initialValues: readonly InitialAtomValue[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProvider store={store} initialValues={initialValues}>
        {children}
      </TestProvider>
    );
  };
}

/** Renders `ui` with its own store; returns the store (for assertions) and a userEvent instance. */
export function renderWithState(
  ui: ReactElement,
  { store = createStore(), initialValues = [] }: StateOptions = {}
) {
  const user = userEvent.setup();
  return { store, user, ...render(ui, { wrapper: createWrapper(store, initialValues) }) };
}

/** Like `renderWithState`, for hooks. */
export function renderHookWithState<Result>(
  hook: () => Result,
  { store = createStore(), initialValues = [] }: StateOptions = {}
) {
  return { store, ...renderHook(hook, { wrapper: createWrapper(store, initialValues) }) };
}
```

## `test/TestProvider.test.tsx` (nutzt die Atome aus P04-S02)

```tsx
import { act } from '@testing-library/react';
import { useAtomValue, useSetAtom } from 'jotai';
import { describe, expect, it } from 'vitest';
import { analysisAtom, analysisProgressAtom, initialAnalysisState } from '../state/analysisAtoms';
import { viewModeAtom } from '../state/viewAtoms';
import { renderHookWithState, renderWithState } from './renderWithState';
import { initial } from './TestProvider';

function ViewModeProbe() {
  const mode = useAtomValue(viewModeAtom);
  const setMode = useSetAtom(viewModeAtom);
  return (
    <button type="button" onClick={() => setMode('upload')}>
      {mode}
    </button>
  );
}

describe('TestProvider', () => {
  it('applies initial values before the first render', async () => {
    const { store, user, getByRole } = renderWithState(<ViewModeProbe />, {
      initialValues: [initial(viewModeAtom, 'graph')],
    });
    const button = getByRole('button', { name: 'graph' });
    await user.click(button);
    expect(button.textContent).toBe('upload');
    expect(store.get(viewModeAtom)).toBe('upload');
  });

  it('gives every render its own store', () => {
    const first = renderWithState(<ViewModeProbe />, {
      initialValues: [initial(viewModeAtom, 'graph')],
    });
    const second = renderWithState(<ViewModeProbe />);
    expect(first.store.get(viewModeAtom)).toBe('graph');
    expect(second.store.get(viewModeAtom)).toBe('upload');
  });

  it('works with hooks and derived atoms', () => {
    const running = { ...initialAnalysisState, status: 'running' as const, progress: 50 };
    const { result, store } = renderHookWithState(() => useAtomValue(analysisProgressAtom), {
      initialValues: [initial(analysisAtom, running)],
    });
    expect(result.current).toBe(50);
    act(() => store.set(analysisAtom, initialAnalysisState));
    expect(result.current).toBeUndefined();
  });

  it('type-checks initial values', () => {
    // @ts-expect-error viewModeAtom only accepts 'upload' | 'graph'
    const pair = initial(viewModeAtom, 'table');
    expect(pair).toHaveLength(2);
  });
});
```

## Erklärungen

- **`useHydrateAtoms`** setzt die Startwerte im Store, **bevor** die Kinder zum ersten Mal rendern.
  Pro Store und Atom passiert das nur **einmal**, deshalb bekommt jeder Test einen neuen Store
  (Standardwert von `renderWithState`).
- **`never[]` in `AnyWritableAtom`:** Wer `never` als Argumenttyp erwartet, nimmt jede
  Schreibfunktion an. So passen primitive Atome, `atomWithStorage` und Schreib-Atome in dieselbe
  Liste. Die Werte selbst sind dort `unknown`. Typsicher werden sie erst durch **`initial()`**: Dort
  bestimmt `NoInfer` den Werttyp **nur** aus dem Atom, ein falscher Wert ist also ein Typfehler
  (letzter Test).
- **`new Map(initialValues)`** statt des Arrays: Diese Variante aus #2650 kommt ohne Cast und ohne
  `any` aus.
- **`store` im Ergebnis:** Damit lässt sich der gespeicherte Zustand prüfen (`store.get(…)`). Mit
  `act(() => store.set(…))` lässt sich eine Änderung von außen simulieren, die **während** des Tests
  passiert.
- **Reine Atom-Logik** (abgeleitete Atome, Schreib-Atome, `runAnalysis(files, store)`) braucht weder
  React noch diese Hilfen: `const store = createStore(); store.set(…); expect(store.get(…))…`.
- **`atomWithStorage`** (ab P07-S01) schreibt auch beim Hydrieren in `localStorage`. Deshalb leert
  `src/test/setup.ts` ab P07-S01 nach jedem Test auch `localStorage`.

## Wenn `tsc` oder Biome die Vorlage ablehnt

Nicht mit `any`, `as` oder `biome-ignore` „reparieren“, sondern stoppen und melden (README R9).
Bekannte Ausweichlösung aus #2650 (dort die akzeptierte Antwort):
`WritableAtom<unknown, any[], unknown>` mit dem Array direkt an `useHydrateAtoms`. Sie braucht wegen
`noExplicitAny` ein `biome-ignore` und darf nur mit Zustimmung des Nutzers eingesetzt werden.
