# P04-S03 – Dateien einlesen, Upload-Ansicht, App-Rahmen

Meilenstein M1 · Abhängig von: P04-S02 · Umfang M

## Ziel
Die App zeigt Toolbar und Upload-Karte wie das Altsystem. Ordnerauswahl und Drag & Drop liefern
`SourceFile[]` (`{ path, code }`) mit denselben Pfaden wie im Altsystem.

## Kontext
- Funktionsinventar U1–U5, N12; Stil-Referenz §3 (Upload-Karte, Toolbar)
- Altcode: `helper/getFilesAsync.ts`, `directives/drop-target.directive.ts`,
  `components/upload-view/*`, `app.component.*`

## Dateien
```
apps/web/src/features/upload/readDroppedFiles.ts  readDroppedFiles.test.ts
apps/web/src/features/upload/readInputFiles.ts    readInputFiles.test.ts
apps/web/src/features/upload/useFileDrop.ts       useFileDrop.test.tsx
apps/web/src/features/upload/UploadView.tsx       UploadView.module.css  UploadView.test.tsx
apps/web/src/app/AppShell.tsx  AppShell.module.css  Toolbar.tsx  Toolbar.module.css  Toolbar.test.tsx
apps/web/src/app/App.tsx (erweitern)
```

## Schritte
1. `readInputFiles(files: FileList | File[]): Promise<SourceFile[]>` – Pfad
   `'/' + file.webkitRelativePath` (wie `upload-view.component.ts:21`), Inhalt `await file.text()`.
2. `readDroppedFiles(dataTransfer: DataTransfer): Promise<SourceFile[]>` – Port von
   `getFilesAsync`:
   - Für jedes `item` mit `kind === 'file'`: wenn `webkitGetAsEntry` existiert → Eintrag rekursiv
     lesen (Pfad = `entry.fullPath`); sonst `getAsFile()` mit Pfad `file.webkitRelativePath`.
   - **Korrektur (ADR-011 A7, neu):** `FileSystemDirectoryReader.readEntries` liefert in Chromium
     höchstens 100 Einträge pro Aufruf. Das Altsystem ruft es nur einmal auf und verliert bei großen
     Ordnern Dateien. Neu: so lange aufrufen, bis ein leeres Array kommt.
   - Implementierung mit `async/await` und Promise-Wrappern um die Callback-APIs, keine
     Zähler-Logik wie im Altcode.
   - Rückgabe in der Reihenfolge des Einsammelns (die Sortierung macht der Kern).
3. Tests mit Fake-Objekten (jsdom kennt `webkitGetAsEntry` nicht):
   - Ordner mit Unterordner → alle Dateien mit `fullPath`, Inhalt gelesen.
   - Ordner mit 250 Einträgen, Fake-Reader liefert in 100er-Blöcken → 250 Dateien.
   - Item ohne `webkitGetAsEntry` → Fallback-Pfad.
   - Items mit `kind !== 'file'` werden ignoriert.
4. `useFileDrop(onFiles)` – Hook für ein Element: `dragenter` → `isDraggingOver = true`,
   `dragover` → `preventDefault`, `dragleave` nur wenn `event.target === element` → false, `drop` →
   `preventDefault`, false, bei `items.length > 0` `readDroppedFiles` → `onFiles`. Gibt
   `{ isDraggingOver, handlers }` zurück (Handler für `onDragEnter` usw.).
5. `UploadView`: Karte (`<label htmlFor="file-upload">`) mit `Icon note_add` (104 px) und Text
   „Drag and drop“ / „or“ / „browse a folder“ (drei Zeilen, `<br />`), verstecktes
   `<input id="file-upload" type="file" webkitdirectory="" multiple>` (Attribut per Spread, da React
   `webkitdirectory` nicht typisiert: `{...{ webkitdirectory: '' }}`). Klasse für Drag-Zustand →
   Skalierung 1.05. Prop `onFiles(files: SourceFile[])`. Maße/Farben aus Stil-Referenz §3.
6. `Toolbar`: `<header>` 64 px, Primärfarbe; links Button-Link „Qualivis“ (ADR-012; setzt
   `viewModeAtom = 'upload'`; Analyse bleibt im Speicher). Rechts bleibt vorerst leer (Zahnrad in P07).
7. `AppShell`: Spalten-Layout wie `app.component.scss` (Toolbar sticky, Inhalt `flex: 1;
   position: relative; overflow: hidden`). `App.tsx` (innerhalb von `StateProvider`) rendert `AppShell` →
   je nach `view` `UploadView` (Graph-Ansicht folgt in S05).
8. Komponententests:
   - `UploadView`: Text und Icon sichtbar; Auswahl über `userEvent.upload(input, files)` ruft
     `onFiles` mit Pfaden `'/' + webkitRelativePath` auf (in jsdom `webkitRelativePath` per
     `Object.defineProperty` setzen).
   - Drag-Klasse erscheint bei `dragenter`, verschwindet bei `drop`.
   - `Toolbar`: zeigt „Qualivis“; Klick auf Titel setzt `viewModeAtom` auf `upload`.

## Akzeptanzkriterien
- [ ] Optik von Toolbar und Upload-Karte entspricht dem Altsystem (Sichtvergleich mit
      `pnpm legacy:serve`, gleiche Fenstergröße).
- [ ] Ordnerauswahl und Drop liefern dieselben Pfade wie das Altsystem (Test).
- [ ] Tests grün; `pnpm check` grün.

## Prüfen
`pnpm check`, `pnpm dev` + `pnpm legacy:serve` nebeneinander.

## Fallstricke
- `dragleave` feuert auch beim Betreten von Kindelementen – deshalb der `target`-Vergleich
  (Altcode: `drop-target.directive.ts:37-43`) plus `pointer-events: none` auf Kindern während des
  Ziehens (global `.is-dragging-over > * { pointer-events: none }` wie `styles.scss`).
- `file.text()` existiert in jsdom 30 – sonst `FileReader` im Test mocken.

## Nicht tun
- Keine Analyse in diesem Schritt (S04).

## Commit-Vorschlag
`feat(web): add upload view, file reading and app shell`
