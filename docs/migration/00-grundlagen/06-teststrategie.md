# Teststrategie

## 1. Grundsatz

Tests prüfen **Verhalten**, nicht Implementierungsdetails. Ein guter Test beantwortet: „Was
beobachtet ein Nutzer bzw. ein Aufrufer, wenn …?“ Schlechte Tests prüfen, ob eine interne
Funktion aufgerufen wurde, oder spiegeln den Code nur wider.

| Gut | Schlecht |
|---|---|
| „Knoten mit `sloc.physical = 170` (Schwelle 200) bekommt `warn = true` und Icon `warning/warn`“ | „`getNodeIcons` wurde einmal aufgerufen“ |
| „Klick auf ‚Save‘ speichert `colaLayout: false` in `localStorage['qualivis.settings']`“ | „`setState` wurde mit X aufgerufen“ |
| „Nach Doppelklick auf ‚App‘ zeigt der Graph 11 Knoten und die URL enthält `?id=`“ | Snapshot der ganzen Seite |

## 2. Testebenen

```
                 ┌──────────────┐
                 │  E2E (P09)   │  wenige: Hauptflüsse + Parität DOM-Semantik
                 └──────────────┘
            ┌───────────────────────┐
            │ Komponenten (jsdom)   │  Rollen und Labels
            └───────────────────────┘
      ┌─────────────────────────────────┐
      │ Golden G1/G2 (Kern gegen Altsystem)│  „God-Test“: Gleichheit mit dem Original
      └─────────────────────────────────┘
 ┌───────────────────────────────────────────┐
 │ Unit (reine Funktionen in core, lib, state) │  schnell, viele, Grenzfälle
 └───────────────────────────────────────────┘
```

| Ebene | Werkzeug | Ort | Läuft in `pnpm check` |
|---|---|---|---|
| Unit | Vitest (node) | `packages/core/src/**/*.test.ts`, `apps/web/src/{lib,state}/**/*.test.ts` | ja |
| Golden G1/G2 | Vitest (node) | `packages/core/test/golden/` | ja |
| Komponenten | Vitest (jsdom) + Testing Library + user-event + `TestProvider` (Jotai) | `apps/web/src/**/*.test.tsx` | ja |
| Snapshot | Vitest `toMatchInlineSnapshot`/`toMatchSnapshot` | bei reinen Anzeige-Bausteinen | ja |

### Zustand im Test: `TestProvider` (Jotai)

Komponenten lesen geteilten Zustand aus Jotai-Atomen. Damit jeder Test mit einem bekannten,
isolierten Zustand startet, laufen alle Komponenten- und Hook-Tests über die Testhilfen aus
`apps/web/src/test/`.

- `TestProvider` = `StateProvider` (eigener Jotai-Store) + `useHydrateAtoms`, das die Startwerte vor dem
  ersten Rendern setzt (Muster aus der Jotai-Testanleitung).
- `initial(atom, value)` erzeugt einen Startwert; TypeScript prüft, dass der Wert zum Atom passt.
- `renderWithState(ui, { initialValues, store })` → `{ store, user, …render }`;
  `renderHookWithState(hook, { initialValues, store })` → `{ store, …renderHook }`.

```tsx
const { store, user, getByRole } = renderWithState(<SomeComponent />, {
  initialValues: [initial(someAtom, someValue)],
});
await user.click(getByRole('button', { name: 'Save' }));
expect(store.get(someAtom)).toEqual(expectedValue);
```

Regeln:
1. Jeder Test hat seinen eigenen Store (Standard von `renderWithState`). Nie den globalen
   Jotai-Default-Store benutzen und nie Atome zwischen Tests „aufräumen“.
2. Startwerte gehören in `initialValues`, nicht in ein `store.set` nach dem Rendern, sonst rendert
   die Komponente zuerst mit dem Standardwert. `act(() => store.set(…))` nur, um eine Änderung
   **während** des Tests zu simulieren. `useHydrateAtoms` setzt jeden Wert pro Store nur einmal;
   andere Startwerte brauchen einen neuen Store, kein erneutes Rendern.
3. Geprüft wird, was der Nutzer sieht (Rollen, Texte, Attribute), und mit `store.get(…)` der
   gespeicherte Zustand, nicht interne Funktionsaufrufe.
4. Reine Atom-Logik (abgeleitete Atome, Schreib-Atome, `runAnalysis(files, store)`) braucht kein
   React: `const store = createStore(); store.set(…); expect(store.get(…))…`.
5. `atomWithStorage` schreibt beim Hydrieren in `localStorage`. Deshalb leert `src/test/setup.ts` ab
   P07-S01 nach jedem Test auch `localStorage`.

## 4. Snapshots – wann ja, wann nein

Ja: kleine, reine Anzeige-Bausteine mit festem Markup (Legende, Metrik-Balken, Icon-Beschreibung,
SVG-Knoten für einen festen Eingabeknoten). Inline-Snapshots bevorzugen (im Review sichtbar).
Nein: ganze Seiten, Komponenten mit Zufall/Zeit, große Graphen. Snapshot-Änderungen werden im
Review begründet, nie blind aktualisiert (`-u` nur nach Prüfung).

## 6. Befehle

| Befehl | Inhalt |
|---|---|
| `pnpm test` | alle Vitest-Projekte (Unit, Golden, Komponenten) |
| `pnpm test:parity` | nur Golden-Tests von Kern und Web (`vitest run --project core --project web golden`) |
| `pnpm exec vitest --project web` | nur Web-Tests (Entwicklung, Watch-Modus) |