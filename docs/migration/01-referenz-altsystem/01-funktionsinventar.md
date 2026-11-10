# Funktionsinventar des Altsystems (Angular-App „Component Graph“)

Dieses Dokument beschreibt **jedes für Nutzer sichtbare Verhalten** der alten App. Es ist die
Abnahmegrundlage für die Meilensteine M1–M4. Maßstab ist immer das **Verhalten des
gh-pages-Builds** (Stand Commit `a071f27`, Build-Commit `5f0155e`), nicht das Paper.

> Pfadangaben: Der alte Code liegt seit M0 unter `legacy/angular/` (z. B.
> `legacy/angular/src/app/...`).

Abkürzungen: **AV** = App-Ansicht (Graph aller Komponenten), **KV** = Komponenten-Ansicht
(Drill-down, Graph der inneren Funktionen einer Komponente).

---

## 1. Ansichten und Navigation

| # | Verhalten | Quelle |
|---|---|---|
| N1 | Zwei Ansichten: Upload (`/`) und Graph (`/graph`). | `app-routing.module.ts` |
| N2 | Beim Start werden Einstellungen aus `localStorage['settings']` geladen. | `app.component.ts:22` |
| N3 | Ist `localStorage['graph']` vorhanden und der Pfad ≠ `/graph`, wird auf `/graph` navigiert. | `app.component.ts:24-26` |
| N4 | **Eigenheit:** Mit Basis-Pfad (`/component-graph/`) ist der Pfad nie `/graph`; dadurch wird bei jedem Neuladen auf `/graph` **ohne** Query-Parameter umgeleitet → Deep-Links `?id=` gehen verloren. (Neue App: Deep-Links funktionieren, siehe ADR-011.) | ebd. |
| N5 | Graph-Ansicht: Query-Parameter `id=<Dateipfad>#<Komponente>` öffnet die KV dieser Komponente. | `graph.component.ts:98-135` |
| N6 | Query-Parameter `upload=1` (nach Upload): `id` wird zurückgesetzt, AV aktiv, Parameter entfernt, das nächste Parameter-Ereignis wird übersprungen (Analyse läuft noch). | `graph.component.ts:99-113` |
| N7 | Erste Parameter-Auswertung der Graph-Ansicht ruft `restoreFromLocalStorage()` auf. | `graph.component.ts:114-117` |
| N8 | Ohne gespeicherten Graph zeigt `restoreFromLocalStorage()` **Demo-Daten** (Les-Misérables-Graph aus `constants/data.ts`). (Neue App: nicht übernommen, ADR-011.) | `data.service.ts:171-188` |
| N9 | Graphauswahl: gültige `id` → Graph dieser Komponente; sonst bei genau **einer Datei mit genau einer Komponente** → deren Graph; sonst App-Graph. | `data.service.ts:93-115, 190-196` |
| N10 | In der KV wird beim Öffnen die Datei der Komponente ausgewählt (`selectFile`, per `setTimeout`). | `graph.component.ts:123-130` |
| N11 | In der KV werden „nur Komponente“-Metriken (`componentOnly`) aus der Größenauswahl entfernt; war eine davon gewählt, wird auf `sloc.physical` zurückgesetzt. (Neue App: nach der Ansicht, auch in der KV eines Projekts mit nur einer Komponente, ADR-011 A16.) | `graph.component.ts:124-134` |
| N12 | Toolbar-Titel „Component Graph“ ist ein Link zur Upload-Ansicht (`routerLink=""`). (Neue App: Titel „Qualivis“, ADR-011 A10.) | `app.component.html` |
| N13 | Zurück-Button (nur KV): setzt `id=null` (zurück zur AV). | `graph.component.ts:1122-1128` |

## 2. Projekt laden

| # | Verhalten | Quelle |
|---|---|---|
| U1 | Upload-Karte: gestrichelter Rahmen, Icon `note_add` (104 px), Text „Drag and drop / or / browse a folder“ (drei Zeilen). | `upload-view.component.html` |
| U2 | Klick öffnet Ordnerauswahl (`<input type=file webkitdirectory mozdirectory>`, versteckt). Pfad = `'/' + file.webkitRelativePath`. | `upload-view.component.ts:16-29` |
| U3 | Drag & Drop auf die Karte (und auf die ganze Graph-Ansicht): Ordner werden rekursiv gelesen (`webkitGetAsEntry`), Pfad = `entry.fullPath` (beginnt mit `/`). Fallback ohne `webkitGetAsEntry`: `getAsFile()` mit `webkitRelativePath`. | `helper/getFilesAsync.ts`, `directives/drop-target.directive.ts` |
| U4 | Während Drag über Zielbereich: CSS-Klasse `is-dragging-over`; Upload-Karte skaliert auf 1.05 (nicht bei ≤ 599 px Breite); Graph-Ansicht zeigt Overlay „Drop files here“ (schwarz 55 % Deckkraft, 32 px weiße Schrift). | `drop-target.directive.ts`, `graph-view.component.scss` |
| U5 | Nach Auswahl/Drop: Analyse startet, Navigation zu `/graph?upload=1`. | `upload-view.component.ts:28`, `graph-view.component.ts:44-47` |
| U6 | Fortschrittsbalken oben (Material, Primärfarbe) während der Analyse: 50 % für Parsen, 50 % für Traversieren, gleichmäßige Schritte pro Datei; danach ausgeblendet. | `data.service.ts:35-56, 222-229` |
| U7 | Dateifilter: nur Endungen `tsx, jsx, ts, js`; Pfade mit `/node_modules/`, `/build/`, `/dist/` ausgeschlossen; Dateien `*.test.<ext>` ausgeschlossen (nur exakt vorletzter Namensteil `test`; `*.spec.*` wird **nicht** ausgeschlossen). (Neue App: Der Upload überspringt zusätzlich Ordner `.venv`, ADR-011 A18.) | `helper/isComponentFile.ts`, `constants/files.ts` |
| U8 | Ergebnis enthält nur Dateien mit ≥ 1 Komponente oder mit Default-Export, der ein Import (Pfad beginnt mit `/`) ist. | `data.service.ts:58-66` |

## 3. Graph-Ansicht (Mitte)

### 3.1 Darstellung
Details siehe `03-visuelle-regeln.md`. Kurzfassung:
- Knoten = Kreise. Klassenkomponente: schraffierte Füllung (Muster `diagonalHatch`). Funktionskomponente: flächig.
- Farben nach Typ: Komponente grün, React-Spezialfunktion (Lifecycle/`render`) hellblau, sonstige Funktion lila.
- Funktionen, die JSX zurückgeben: zusätzlicher innerer Kreis (doppelter Rand).
- AV: um jeden Komponentenknoten kleine Vorschaukreise (eine pro innerer Funktion), bei Platzmangel „...“.
- Knotengröße: Fläche proportional zur gewählten Metrik relativ zum Schwellenwert.
- Unter dem Label: Material-Icons (Warnung/Fehler, Löschen, Schere, Vererbung, veraltet).
- Kanten mit Pfeilspitze; Vererbung gestrichelt (`4 2`).
- Legende unten rechts (zwei Varianten AV/KV; neue App: nach der Ansicht, ADR-011 A16).

### 3.2 Interaktionen

| # | Eingabe | Wirkung | Quelle |
|---|---|---|---|
| G1 | Klick auf den Knotenkreis | Knoten auswählen (Panels rechts füllen sich); bei Einstellung „fade“: nicht verbundene Knoten/Kanten auf 10 % Deckkraft. Das Label ist nicht klickbar (`pointer-events: none`); ein Klick darauf trifft den Kreis darunter oder den Hintergrund. (Neue App: helle Füllung nur beim aktuellen Fokus, ADR-011 A14.) | `graph.component.ts:717-720, 1030-1048`, `graph.component.scss:152-153` |
| G2 | Erster Klick auf Komponente mit inneren Funktionen | Einmaliger Hinweis (Snackbar 8 s): „Tip: You can double click a component that has inner functions to open it!“ (pro Browser nur einmal). | `graph.component.ts:1036-1046` |
| G3 | Doppelklick auf Komponentenknoten (AV) mit ≥ 1 innerer Funktion | KV öffnen (`?id=`). | `graph.component.ts:693-701` |
| G4 | Klick auf Vorschaukreis (AV) | Diese innere Funktion auswählen (Code-Panel springt zur Funktion). | `graph.component.ts:825-827` |
| G5 | Strg + Klick auf Knoten | Knoten samt Kanten aus der aktuellen Darstellung entfernen und Layout neu starten (nicht persistent). | `graph.component.ts:1031-1035, 1050-1056` |
| G6 | Strg + Maus über Knoten / Strg + Maus verlassen | Ausblenden wie bei Klick / wieder einblenden. (Neue App: wie G1; Strg wirkt beim Betreten des Knotens, ADR-011 A14.) | `graph.component.ts:721-731` |
| G7 | Klick auf leeren Hintergrund | Alles einblenden, Auswahl aufheben. | `graph.component.ts:1172-1177` |
| G8 | Ziehen eines Knotens | Knoten verschieben, Layout reagiert. Kraft-Layout: Shift beim Loslassen fixiert den Knoten. WebCola: Knoten wird beim Ziehen fixiert und danach freigegeben. (Neue App: Der Drag beginnt mit der ersten Bewegung und blendet in beiden Layouts nicht aus, ADR-011 A13.) | `graph.component.ts:703-708, 1091-1120` |
| G9 | Mausrad | Zoom (mit 0,1 s Übergang); Doppelklick-Zoom deaktiviert. (Neue App: Pinch und Strg+Mausrad zoomen den Graph, ADR-011 A12.) | `graph.component.ts:472-510` |
| G10 | Ziehen auf Hintergrund | Verschieben (Pan). | ebd. |
| G11 | Button „{Zoom}%“ (Tooltip „Zoom to 100%“) | Auf 100 % zoomen, zentriert. (Neue App: Tooltips verschwinden beim Klicken, ADR-011 A17.) | `graph.component.html:199-206` |
| G12 | Button `all_out` (Tooltip „Zoom to fit“) | Alles einpassen (95 % Rand, max. Faktor 3). | `graph.component.ts:1058-1089` |
| G13 | Button `fullscreen`/`fullscreen_exit` (Tooltip „Enter fullscreen“/„Exit fullscreen“) | Seitenpanels aus-/einblenden; danach „Zoom to fit“. | `graph.component.html:210-217`, `graph.component.ts:90-93` |
| G14 | Auswahl „Node size metric“ (Material-Select, ohne Label) | Größenmetrik wechseln, Layout neu starten. Optionen = Namen der Metriken (AV alle 7, KV ohne `componentOnly`). (Neue App: Optionen nach der Ansicht, ADR-011 A16; die Liste öffnet unter dem Feld, A17.) | `graph.component.html:186-198` |
| G15 | Button „Toggle cluster“ (nur KV und nur wenn Cluster gefunden) | Färbung nach Louvain-Cluster an/aus; aktiv: Hintergrund `#e6e6e6`. | `graph.component.html:177-185` |
| G16 | KV mit > 30 Knoten und WebCola aktiv | Einmaliger Hinweis „Tip: Try out disabling flow layout on large graphs“ mit Aktion „Change now“ (8 s) → schaltet WebCola aus und zeigt „Disabled flow layout (can be changed via settings)“ mit Aktion „Undo“ (8 s). | `graph.component.ts:145-164` |
| G17 | Nach erstem Layout-Ende (bei „Auto zoom“) | Automatisch einpassen. | `graph.component.ts:643-649` |
| G18 | Nach Layout-Ende und nach Zoomänderung | Überlappende Labels ausblenden (250 ms entprellt), ausgeblendete bekommen Tooltip. (Neue App: Tooltip genau bei ausgeblendetem Label, ADR-011 A15.) | `graph.component.ts:486-491, 650-652, 952-982` |

## 4. Dateibaum (links)

| # | Verhalten | Quelle |
|---|---|---|
| F1 | Baum aus allen Ergebnisdateien; Ordner zuerst, dann Dateien, jeweils alphabetisch ohne Groß-/Kleinschreibung. | `helper/extractFileTree.ts` |
| F2 | Beim Laden: Ebenen 0 und 1 aufgeklappt. | `file-tree.component.ts:46-48` |
| F3 | Icons: Ordner `folder`, Datei `code`; Einrückung 28 px pro Ebene; Zeilenhöhe 32 px; Schrift 13 px. | `file-tree.component.html/.scss` |
| F4 | Klick auf Ordner: auf-/zuklappen. | ebd. |
| F5 | Klick auf Datei: Datei auswählen (alle Komponenten der Datei, nur erste wird im Panel gezeigt), **nach 500 ms** Navigation zur AV (`id` entfernt). | `file-tree.component.ts:99-113` |
| F6 | Doppelklick auf Datei: Timer abbrechen; hat die Datei genau **eine** Komponente → KV dieser Komponente. | `file-tree.component.ts:115-120, 86-95` |
| F7 | Bei Auswahl (auch aus dem Graph) werden die Ordner der ausgewählten Datei aufgeklappt; Datei wird hinterlegt (`rgba(0,0,0,.08)`, Hover `.12`). | `file-tree.component.ts:52-79` |

## 5. Code-Quality-Panel (rechts oben)

| # | Verhalten | Quelle |
|---|---|---|
| Q1 | Überschrift „Code Quality“ + Name des ausgewählten Elements (`label` oder `id`); bei Klassen-Report mit `aggregate`: Zusatz „(aggregate)“. | `code-quality.component.html` |
| Q2 | Für jede Metrik mit Schwellenwert für den Knotentyp eine Balkenzeile: Name (Tooltip = Beschreibung), Wert (Tooltip `Wert/Schwellenwert`), Balken `Wert/Schwellenwert*100 %` (max. 100 %). Farben: grün; ab 80 % gelb; ab 100 % rot. | `quality-metric.component.*` |
| Q3 | Schwellenwert: zuerst `thresholds["<typ>.<label oder id>"]`, sonst `thresholds["<typ>"]`. | `code-quality.component.html:31-40` |
| Q4 | Darunter Hinweise (Icon + Text) zu den Icons des Knotens; Texte mit Links (öffnen in neuem Tab). | `icon-description.component.*` |
| Q5 | **Eigenheit:** Auswahl über den Dateibaum liefert keine Icons (leere Liste, „TODO“ im Code). Auswahl über Vorschaukreise ebenfalls keine Icons. (Neue App: Dateibaum-Auswahl zeigt die Icons des Knotens, ADR-011 A9; Vorschaukreise bleiben wie im Altsystem.) | `data.service.ts:150`, `graph.component.ts:815-827` |

## 6. Quelltext-Panel (rechts unten)

| # | Verhalten | Quelle |
|---|---|---|
| S1 | Nur sichtbar, wenn genau **ein** Element ausgewählt ist. | `graph-view.component.html:24-28` |
| S2 | Zeigt den gesamten Dateiinhalt, schreibgeschützt, mit Zeilennummern, JSX-Syntaxhervorhebung (auch für TS), Theme „neo“. | `source-code.component.ts` |
| S3 | Markiert die Zeilen `lineStart` bis `lineEnd` des ausgewählten Elements (CodeMirror-Selektion von Zeile `lineStart-1` bis Anfang Zeile `lineEnd`, 0-basiert) und scrollt so, dass eine Zeile über dem Start sichtbar ist. | `source-code.component.ts:61-87` |
| S4 | Suche (Strg+F) und Sprung zu Zeile (Alt+G) über CodeMirror-Addons. | `source-code.component.ts:11-15` |

## 7. Einstellungen (Dialog über Zahnrad in der Toolbar)

Dialog „Settings“, 480 px breit. Schalter (Label links, Schalter rechts), in dieser Reihenfolge:

| Label (exakt) | Schlüssel | Standard |
|---|---|---|
| Vertical flow layout | `colaLayout` | `true` |
| Hide overlapping labels | `hideOverlappingLabels` | `true` |
| Fade out disconnected nodes on selection | `fade` | `true` |
| Show indirect connected nodes (eingerückt 16 px) | `highlightIndirectNodes` | `true` |
| Highlight nodes with errors/warnings based on the currently selected size metric (Tooltip identisch) | `currentSizeMetricErrorHighlighting` | `false` |
| Auto zoom to fit | `autoZoom` | `true` |
| Node sizes based on metrics | `nodeSizesBasedOnMetrics` | `true` |

Nicht im Dialog: `text` (Standard `true`, Labels anzeigen) und `fullScreen` (Standard `false`,
über Graph-Button). Buttons: „Cancel“ (verwirft) und „Save“ (primär, Startfokus) → Einstellungen
zusammenführen, als JSON in `localStorage['settings']` speichern, Graph neu starten.
Quelle: `settings-modal.component.*`, `services/settings.service.ts`.

## 8. Persistenz

| # | Verhalten | Quelle |
|---|---|---|
| P1 | Beim Verlassen der Seite (`beforeunload`, nur Graph-Ansicht): `localStorage['graph']` (App-Graph), `['components']` (FileMap inkl. Code und Reports), `['report']` (escomplex-Report). Kein Schutz gegen Speicherlimit. | `data.service.ts:162-169`, `graph-view.component.ts:30` |
| P2 | Hinweis-Toasts werden über Cookies `toastDisableFlowLayout` und `toastDoubleClickComponent` (10 Jahre) nur einmal gezeigt. (Neue App: `localStorage`, ADR-010.) | `helper/cookie.ts` |

## 9. Layout der Seite

- Toolbar oben (64 px, Primärfarbe `#673ab7`, Titel links, Zahnrad rechts).
- Darunter drei Spalten (in Pixel, verschiebbar, Trenner 8 px `#eee`): Dateibaum 275 px | Graph (Rest) | rechte Spalte 575 px.
- Rechte Spalte vertikal geteilt: Code-Quality 363 px | Quelltext (Rest).
- Vollbild blendet linke und rechte Spalte aus.
- Hintergrund Panels weiß, Graph `#fafafa`.

## 10. Barrierefreiheit (vorhanden im Altsystem)

`aria-label` an Buttons: „Settings“, „Back to app graph“, „Node size metric“, „Zoom to 100%“,
„Zoom to fit“, „Toggle fullscreen“; Dateibaumeinträge `aria-label="toggle <name>"`.
Diese Labels werden mindestens übernommen.
