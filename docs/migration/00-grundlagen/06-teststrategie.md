# Teststrategie und Golden-Konzept („God-Test“)

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
            │ Komponenten (jsdom)   │  jede interaktive Komponente, Rollen/Labels
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
| E2E | Playwright (Systembrowser) | `e2e/tests/` | nein, eigener Befehl `pnpm e2e` |
| Sichtvergleich G5 | Playwright-Screenshots + HTML-Bericht | `e2e/visual/` | nein, manuell |

### Vitest und jsdom – wer macht was?

**Vitest ist der einzige Testrunner** für Unit-, Golden- und Komponententests. Vitest läuft in
Node. Node kennt aber kein `document`, kein `window` und keine DOM-Elemente – React kann dort also
nichts rendern. **jsdom ist kein zweites Testwerkzeug, sondern die „Browser-Umgebung“, die Vitest
für Komponententests lädt** (`environment: 'jsdom'` im Web-Projekt): eine in JavaScript
nachgebaute DOM-Implementierung. Der Kern braucht kein DOM und testet in der normalen
Node-Umgebung (`environment: 'node'`, schneller).

**Geht es ohne jsdom?** Am 07.11.2026 geprüft (ADR-015): nein, jedenfalls nicht für Klick-Tests.
- Testing Library stellt selbst kein DOM bereit, sondern arbeitet auf einem vorhandenen. In
  reinem Node scheitert `render` mit `document is not defined`, und `screen` und `fireEvent`
  scheitern genauso (im Spike nachgestellt).
- Ein Jotai-`TestProvider` (unten) setzt nur den **Zustand**, kein DOM.
- Ohne DOM rendern nur `react-dom/server` (statisches HTML ohne Effekte und Events, in Node
  geprüft) und `react-test-renderer`. Letzteres ist seit React 19 abgekündigt und ungepflegt und
  kennt keine echten Events.
- `jest-environment-jsdom` ist jsdom plus Jest-Umgebung (85 statt 27 Pakete). `jest-junit` ist
  nur ein Reporter; Vitest hat `--reporter=junit` eingebaut.
- Vitest-Browser-Modus: echter Browser, aber 5 Sicherheitsmeldungen, davon 4 im Jahr 2026 und
  3 kritisch. happy-dom: 8 Meldungen, davon 3 kritisch.

Echte Browser-Prüfungen erledigt später Playwright in E2E-Tests (P09), getrennt installierbar.

### Zustand im Test: `TestProvider` (Jotai)

Komponenten lesen geteilten Zustand aus Jotai-Atomen. Damit jeder Test mit einem bekannten,
isolierten Zustand startet, laufen alle Komponenten- und Hook-Tests über die Testhilfen aus
`apps/web/src/test/`. Sie werden in P04-S02 eingeführt; die Vorlage steht in
`anhang/A7-test-provider.md`.

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
   **während** des Tests zu simulieren.
3. Geprüft wird, was der Nutzer sieht (Rollen, Texte, Attribute), und mit `store.get(…)` der
   gespeicherte Zustand, nicht interne Funktionsaufrufe.
4. Reine Atom-Logik (abgeleitete Atome, Schreib-Atome, `runAnalysis(files, store)`) braucht kein
   React: `const store = createStore(); store.set(…); expect(store.get(…))…`.
5. `atomWithStorage` schreibt beim Hydrieren in `localStorage`. Deshalb leert `src/test/setup.ts` ab
   P07-S01 nach jedem Test auch `localStorage`.

## 3. Das Golden-Konzept

Das Altsystem ist das **Orakel**. Für feste Testprojekte (Fixtures) erzeugt der alte Build
Referenzdaten (Goldens), die neue Implementierung muss sie reproduzieren. Zusammen bilden G1–G6
den „God-Test“: ein Befehl `pnpm test:parity` (ab P05), der alle automatischen Ebenen gegen das
Altsystem prüft.

| Ebene | Prüft | Quelle (Altsystem) | Vergleich | Ab |
|---|---|---|---|---|
| **G1 Analyse** | escomplex-Report, FileMap (Komponenten, Graphen, Reports je Knoten), App-Graph inkl. Reihenfolge | `localStorage` nach `onbeforeunload()` | Struktur und Ganzzahlen exakt; Halstead-Fließkommazahlen mit Toleranz (siehe unten) | P03 |
| **G2 Darstellungsregeln** | je Knoten: `width`, `warn`, `error`, `icons`, `cluster`, Vorschaukreise (Klasse, sichtbar, `cx/cy`), „...“, Kantenliste (`inherits`) – für AV und jede KV | D3-Daten am SVG (`__data__`) | `width/cx/cy` ±1e-9, Rest exakt, Icon-Texte normalisiert (HTML-Tags entfernt, Leerraum zu einem Leerzeichen, getrimmt) | P05 |
| **G3 Layout** (optional) | WebCola-Positionen relativ zum Schwerpunkt | `__data__.x/y` + `container` | ±0,5 px nach Abzug des Schwerpunkts, nur WebCola, gleiche Containergröße | P05 |
| **G4 Panels** | Code-Quality-Panel je Knoten: Überschrift, Metrikzeilen (Name, Beschreibung, Wert, `Wert/Schwelle`, Farbe), Icon-Hinweise | DOM des Panels | Texte exakt, Farbe als `ok/warn/error` | P06 |
| **G5 Sichtvergleich** | Gesamteindruck (Farben, Abstände, Schrift) | Screenshots Alt/Neu nebeneinander | Mensch (Nutzer) | P09 |
| **G6 Eigenprüfung** | Neuer Code hält die Qualitätsgrenzen; Altsystem und neuer Kern analysieren den **neuen** Quelltext identisch | eigene CLI + Legacy-Capture des neuen Codes | exakt / Grenzwerte | P10 |

Ablage, Dateiformat und Herkunft der Goldens: `testdata/golden/README.md`; Erfassung:
`tools/legacy/README.md`.

Wichtig zu G6: Der alte Babel 7.7/7.8 kennt eventuell neuere TypeScript-Syntax nicht
(z. B. `satisfies`, `accessor`). Scheitert der Legacy-Capture am neuen Code, wird G6 auf den
Grenzwert-Teil beschränkt (kein Fehler des neuen Systems).

### Toleranz bei G1

Im Spike war das Ergebnis vollständig identisch. Weil kleine Abweichungen bei Halstead-Werten nicht
dramatisch sind (Nutzerentscheidung), gilt:

- **Exakt** müssen sein: alle Strukturen (Dateien, Komponenten, Knoten, Kanten, Reihenfolge, IDs,
  Zeilen) und alle Ganzzahl-Metriken (`sloc.*`, `cyclomatic`, `paramCount`, `maxJsxNesting`,
  Operator-/Operandenzahlen).
- **Mit Toleranz** verglichen werden Fließkommawerte unter `halstead.*` (und daraus abgeleitete wie
  `maintainability`, `cyclomaticDensity`): Abweichung ≤ 1 % relativ **oder** ≤ 0,01 absolut.
- Größere Abweichungen: Ursache klären (Diff-Werkzeug). Ändert sich dadurch eine Warn-/Fehlerstufe
  oder ein Icon, ist das immer zu klären.
- Umsetzung: Vergleichsfunktion `expectGoldenEqual(actual, expected)` in
  `packages/core/test/golden/compare.ts`, die beim rekursiven Vergleich Pfade mit `halstead`
  tolerant behandelt und sonst `toEqual`-Semantik hat. Jede genutzte Toleranz wird im Testlauf
  als Hinweis ausgegeben (Pfad, alt, neu), damit sie sichtbar bleibt.

### Regeln für Goldens

1. Goldens liegen versioniert in `testdata/golden/` und werden **nie** von Hand bearbeitet.
2. Ein Test, der gegen ein Golden fehlschlägt, wird **nie** durch Anpassen des Goldens grün
   gemacht. Stattdessen: Diff ansehen (`tools/golden/diff-json.mjs`), Ursache finden, Code
   korrigieren. Ist die Abweichung gewollt (ADR), werden Goldens nach dem Verfahren in `tools/legacy/README.md` neu erfasst und
   der Nutzer stimmt zu.
3. Neue Fixtures: zuerst Legacy-Capture, dann Test. Fixtures enthalten nur Quelltext (keine
   `package.json`-Abhängigkeiten installieren, nichts ausführen).
4. Die Eingabereihenfolge ist kanonisch sortiert (ADR-006) – in Capture **und** Test.

## 4. Komponenten-Tests in jsdom – Grenzen

- jsdom berechnet kein Layout: `getBBox`, `getBoundingClientRect` liefern 0 bzw. fehlen.
  Funktionen, die Maße brauchen (`zoomToFit`, Label-Kollision), bekommen die Messfunktion als
  Parameter und werden in Unit-Tests mit festen Werten geprüft.
- CodeMirror 6 läuft in jsdom nur eingeschränkt (Messungen). `SourceCodeView` wird mit einer
  dünnen Abstraktion getestet (wird die richtige Zeile ausgewählt?) und im E2E-Test real geprüft.
- Kein `@testing-library/jest-dom`: Assertions mit Standard-Matchern
  (`expect(button.getAttribute('aria-pressed')).toBe('true')`, `expect(screen.queryByText(..)).toBeNull()`).
- Animationen: Layout-Engine im Test durch eine Fake-Engine ersetzen (Schnittstelle
  `LayoutEngine`), die sofort Positionen setzt und `end` meldet.

## 5. Snapshots – wann ja, wann nein

Ja: kleine, reine Anzeige-Bausteine mit festem Markup (Legende, Metrik-Balken, Icon-Beschreibung,
SVG-Knoten für einen festen Eingabeknoten). Inline-Snapshots bevorzugen (im Review sichtbar).
Nein: ganze Seiten, Komponenten mit Zufall/Zeit, große Graphen. Snapshot-Änderungen werden im
Review begründet, nie blind aktualisiert (`-u` nur nach Prüfung).

## 6. Testdaten

- `testdata/fixtures/mini` (eigene Fälle, `testdata/README.md`), `testdata/fixtures/realworld` (MIT,
  echtes Projekt aus dem Paper).
- Ab P08-S03: `testdata/fixtures/features/` mit je einer Datei pro Erkennungsfall (z. B.
  `react-lazy-identifier.js`, `export-default-call.js`), jeweils mit Legacy-Capture.
- Ab P08-S09: generiertes Großprojekt (`tools/golden/generate-large-fixture.mjs`, deterministisch,
  300+ Komponenten) nur für Performance, ohne Golden.

## 7. Befehle

| Befehl | Inhalt |
|---|---|
| `pnpm test` | alle Vitest-Projekte (Unit, Golden, Komponenten) |
| `pnpm test:parity` | nur Golden-Tests (`vitest run --project core test/golden`) |
| `pnpm exec vitest --project web` | nur Web-Tests (Entwicklung, Watch-Modus) |
| `pnpm e2e` | Playwright-Tests (ab P09; braucht laufenden `pnpm preview`) |

Die Golden-Tests schreiben die Ist-Werte bei jedem Lauf nach `.cache/golden-actual/<fixture>/`
(nicht versioniert). Bei einer Abweichung direkt vergleichen, z. B.
`node tools/golden/diff-json.mjs testdata/golden/mini/legacy-report.json .cache/golden-actual/mini/report.json`
(gleicher Befehl auf Windows und macOS).
