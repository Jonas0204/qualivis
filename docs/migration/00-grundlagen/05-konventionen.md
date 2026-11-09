# Konventionen

## 1. Sprache

- Code, Bezeichner, Kommentare, Commit-Messages, Testnamen: **Englisch**.
- Plan-Dokumente, ADRs, Nutzer-Kommunikation: Deutsch.
- UI-Texte: **exakt** wie im Altsystem (Englisch), siehe Funktionsinventar. Ausnahme: Produktname
  „Qualivis“ in Fenstertitel und Toolbar (ADR-012).
- Keine Klarnamen von Personen in Repo-Dateien (Ausnahme: Autoren des Papers bei der Quellenangabe).

## 2. Formatierung und Lint (Biome)

- 2 Leerzeichen, Zeilenlänge 100, einfache Anführungszeichen, Semikolons, Trailing Commas `es5`,
  Arrow-Parameter ohne Klammern wenn möglich (`arrowParentheses: "asNeeded"`) – entspricht der
  alten `.prettierrc` (`singleQuote`, `printWidth 100`).
- Vor jeder Übergabe: `pnpm format` dann `pnpm check`.
- `// biome-ignore` nur mit Begründung im selben Kommentar und nur, wenn die Regel im Einzelfall
  falsch liegt. Nie für Sicherheitsregeln.

## 3. TypeScript

- `strict: true` überall; neuer Code zusätzlich `noUncheckedIndexedAccess: true`,
  `exactOptionalPropertyTypes: false` (zu laut für Babel-Typen), `noImplicitOverride: true`.
- Ausnahme bis P08-S01: `packages/core` mit `noImplicitAny: false` (übernommener Altcode).
- Kein `any` in neuem Code; für unbekannte Daten `unknown` + Typprüfung.
- `import type` für reine Typimporte (Biome `useImportType`).
- Öffentliche Funktionen in `core` haben JSDoc (ein Satz Zweck + Besonderheiten).
- **`type` statt `interface`** für alle Typdefinitionen (`type GraphNodeProps = { … }`; Erweiterung
  mit `&`). Erzwungen durch Biome `useConsistentTypeDefinitions` (Option `style: "type"`, automatisch
  behebbar). Ausnahme: übernommener Altcode in `packages/core/src/legacy/` und Fixtures.
- **Arrow-Funktionen statt Funktionsdeklarationen**, auch für React-Komponenten:
  `export const sortFiles = (files: readonly SourceFile[]): SourceFile[] => { … };`. Erzwungen durch
  Biome `nursery/useConsistentFunctionStyle` und `nursery/useReactFunctionComponentDefinition`
  (`arrowFunction`). Snippets mit `function` in Karten und Anhängen sinngemäß umsetzen. Ausnahmen:
  Altcode in `packages/core/src/legacy/`, Generatoren (`function*`), TS-Überladungen. In `.tsx`
  braucht ein generischer Arrow ein Komma: `<T,>(…) =>`. (Nutzer, 08.11.2026)
- Keine Enums; String-Unions (`type View = 'app' | 'component'`).
- Keine Default-Exports in neuem Code (Ausnahme: Konfigurationsdateien, die es verlangen).
- Versionen in `pnpm-workspace.yaml` (Catalog) immer **fest** (`1.2.3`, kein `^`/`~`).

## 4. Namensgebung und Dateien

| Art | Schema | Beispiel |
|---|---|---|
| React-Komponente | `PascalCase.tsx`, eine Komponente pro Datei | `GraphNode.tsx` |
| Hook | `useXxx.ts` | `usePanZoom.ts` |
| Modul/Funktion | `camelCase.ts` | `nodeVisuals.ts` |
| CSS Module | `Komponente.module.css` | `Toolbar.module.css` |
| Test | neben der Datei, `*.test.ts(x)` | `nodeVisuals.test.ts` |
| Golden-Test | `packages/core/test/golden/*.golden.test.ts` | `analysis.golden.test.ts` |
| Konstanten | `camelCase` Objekte, keine `SCREAMING_CASE` (wie Altsystem) | `graphSettings.nodeGap` |

Ordner der Altcode-Kopie (`packages/core/src/legacy/`) behalten die **alten Dateinamen**
(`traverseHelper.ts` usw.), damit Vergleiche mit `legacy/angular/` leichtfallen.

## 5. React-Regeln

- Nur Funktionskomponenten und Hooks. Keine Klassen (Ausnahme: Error-Boundary, die React nur als
  Klasse anbietet – eine einzige, in `app/ErrorBoundary.tsx`).
- Props typisiert als `type XxxProps = { … }`; ≤ 6 Props.
- Zustand: lokal mit `useState`/`useReducer`; geteilt über Jotai-Atome (`state/`). Kein Prop-Drilling
  über mehr als zwei Ebenen. Abgeleitete Werte als abgeleitete Atome oder `useMemo`, nicht per
  `useEffect` + `setState`.
- Atome immer auf Modulebene definieren, nie in der Render-Funktion: `useAtomValue(atom(get => …))`
  erzeugt bei jedem Render ein neues Atom. Code arbeitet immer innerhalb des `StateProvider`, nie mit
  dem globalen Jotai-Default-Store.
- Effekte (`useEffect`) nur für Synchronisation mit Externem (Layout-Engine, CodeMirror, Events);
  jede Effekt-Funktion räumt auf.
- Keine Berechnung von Fachwerten in Komponenten – dafür `@qualivis/core` oder Hilfsfunktionen.
- Kein `dangerouslySetInnerHTML`. Links in Texten als Daten (`{ text, link }`) und JSX.
- Barrierefreiheit: Buttons sind `<button>`; Icon-Buttons haben `aria-label`; Schalter
  `role="switch"` mit `aria-checked`; Dialog = natives `<dialog>`.

## 6. CSS

- Tokens aus `styles/tokens.css` verwenden (`var(--qv-primary)`), keine harten Farbwerte in
  Komponenten (Ausnahme: `graph.css`, das die exakten Altwerte über Tokens bezieht).
- CSS Modules für alles außer dem Graph; `graph.css` global unter `.qv-graph`.
- Keine CSS-in-JS-Bibliothek, kein Präprozessor (Vite kann CSS-Nesting nativ verarbeiten).

## 7. Kommentare

- Kommentieren **warum**, nicht was. Jede übernommene Eigenheit (K1–K11, V1–V7) bekommt an der
  Stelle einen Kommentar `// Legacy quirk K3: ... (see docs/migration/01-referenz-altsystem/...)`.
- Keine auskommentierten Codeblöcke (Altcode-Kommentare in `legacy/` bleiben, wie sie sind).

## 8. Commits (nur auf Anweisung des Nutzers)

- Format: `<type>(<scope>): <summary>` – `type` ∈ `feat, fix, refactor, test, docs, chore, build`,
  `scope` ∈ `core, web, cli, e2e, tools, repo, docs`. Beispiel: `feat(core): add analyzeProject`.
- Body: was und warum, Bezug auf den Schritt (`Plan: P03-S04`).
- **Keine** `Co-Authored-By`-Zeilen, keine Hinweise auf Claude, keine Session-Links.
- Autor/Committer und Push-Regeln stehen in der **lokalen** `CLAUDE.md` im Repo-Root (nicht
  versioniert, siehe `.gitignore`). Ist sie nicht vorhanden: vor dem Commit den Nutzer fragen.
- Ein Schritt = ein Commit (Ausnahme: sehr große Schritte nach Absprache). Vor dem Commit prüft
  der Nutzer die uncommitteten Änderungen in seiner IDE (README R3).
- Branches: ein Branch pro Phase (`rewrite/pNN-<name>`) mit Abzweig von `rewrite/react`; am Ende der
  Phase ein Pull Request nach `rewrite/react`, den der Nutzer per Merge-Commit übernimmt (Details:
  README, „Branches und Pull Requests“). Review-Korrekturen als neue Commits, nie `--amend` oder
  Force-Push.
- PR-Titel `Pnn: <Phasentitel>`; Beschreibung mit erledigten Schritten, Prüfergebnissen,
  Abweichungen und offenen Punkten; ohne Claude-/KI-Hinweise.

## 9. Schritt-Karten (Aufbau)

Jede Datei in `phasen/Pxx-*/Sxx-*.md` hat diese Abschnitte:

```
# Pxx-Syy – Titel
Meilenstein · Abhängig von · Umfang (S ≤ 1 h, M ≤ 3 h, L ≤ 1 Tag)
## Ziel                       ein bis drei Sätze
## Kontext                    Verweise auf Referenzdokumente und Altcode (Pfad:Zeile)
## Dateien                    anzulegen / zu ändern
## Schritte                   nummeriert, konkret
## Akzeptanzkriterien         prüfbar, Checkboxen
## Prüfen                     Befehle
## Fallstricke                bekannte Probleme
## Nicht tun                  Abgrenzung
## Commit-Vorschlag
```
