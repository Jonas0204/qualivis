# P06-S05 – Quelltext-Ansicht mit CodeMirror 6

Meilenstein M3 · Abhängig von: P06-S02 · Umfang M

## Ziel
Rechts unten zeigt eine schreibgeschützte CodeMirror-6-Ansicht die Datei des ausgewählten Elements
mit Zeilennummern, JSX/TS-Hervorhebung im „neo“-Stil, markiert den Zeilenbereich und scrollt hin.
Suche mit Strg+F.

## Kontext
- Funktionsinventar S1–S4; Stil-Referenz §4 (Theme)
- Altcode: `components/source-code/source-code.component.ts`, `src/assets/neo.css`

## Dateien
`apps/web/src/features/source-code/SourceCodeView.tsx`, `neoTheme.ts`, `selectionRange.ts`
(+ Test), `SourceCodeView.test.tsx`, `apps/web/package.json` (CodeMirror-Pakete).

## Schritte
1. Abhängigkeiten `@codemirror/state`, `@codemirror/view`, `@codemirror/language`,
   `@codemirror/lang-javascript`, `@codemirror/search` (Catalog) eintragen; Nutzer installiert.
2. `selectionRange(doc, lineStart, lineEnd)` (rein): Anker = Anfang Zeile `lineEnd + 1` (0-basiert
   `lineEnd`, also Beginn der Zeile **nach** dem Ende; bei letzter Zeile Dokumentende), Kopf = Anfang
   Zeile `lineStart` (1-basiert) – entspricht `setSelection({line: lineEnd, ch: 0}, {line: lineStart - 1, ch: 0})`
   in CodeMirror 5. Scrollziel = Anfang Zeile `max(1, lineStart - 1)` oben.
   Tests mit einem 10-Zeilen-Dokument.
3. `neoTheme.ts`: `EditorView.theme({...})` (Hintergrund weiß, Text `#2e383c`, Zeilenhöhe 1.4375,
   Gutter transparent ohne Rand mit 10 px Abstand, Zeilennummern `#e0e2e5`, Cursor `#676767`,
   Auswahl wie CodeMirror-Standard) + `syntaxHighlighting(HighlightStyle.define([...]))` mit den
   Farben aus Stil-Referenz §4 (`tags.comment`, `tags.keyword`, `tags.propertyName`, `tags.atom`,
   `tags.number`, `tags.tagName`, `tags.string`, `tags.variableName`, …).
4. `SourceCodeView({ code, lineStart, lineEnd })`: `EditorView` einmal erzeugen (Effekt mit
   Aufräumen); bei Code-Wechsel Dokument ersetzen und danach Auswahl setzen; bei reiner
   Zeilenänderung nur Auswahl + Scroll (`EditorView.scrollIntoView(pos, { y: 'start' })`).
   Erweiterungen: `lineNumbers()`, `javascript({ jsx: true, typescript: true })`,
   `EditorState.readOnly.of(true)`, `EditorView.editable.of(false)`? (Nein – nicht editierbar würde
   Auswahl/Suche behindern; nur `readOnly`.) `keymap.of(searchKeymap)`, `search()`, `highlightSelectionMatches()`
   optional. Höhe 100 % des Panels.
   Nur rendern, wenn genau **ein** Element ausgewählt ist (S1).
5. Tests: `selectionRange`-Unit-Tests; Komponente rendert ohne Fehler in jsdom (falls CodeMirror in
   jsdom Messfehler wirft: Komponente über eine kleine `createEditor`-Funktion injizierbar machen und im
   Test einen Fake verwenden, der Dokument/Auswahl protokolliert).

## Akzeptanzkriterien
- [ ] Klick auf `render` (KV `App`) markiert dessen Zeilen und scrollt hin – wie im Altsystem.
- [ ] Strg+F öffnet die Suche.
- [ ] Optik entspricht „neo“ (Sichtvergleich).
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- CodeMirror 6 hat keinen `jsx`-Modus wie CM5; `javascript({ jsx: true, typescript: true })` für alle
  Dateien verwenden (Altsystem: immer JSX-Modus).
- `@codemirror/search` war nicht im Spike – Auflösung beim Install beachten.

## Commit-Vorschlag
`feat(web): add read-only source code view with CodeMirror 6`
