# Architekturentscheidungen (ADRs)

Format je Eintrag: Kontext · Entscheidung · Folgen. Alle Einträge sind mit dem Nutzer abgestimmt.
Hier stehen nur Entscheidungen, die noch umgesetzt werden oder für kommende Schritte gelten.
Umgesetzte ADRs werden entfernt, sobald ihre Regeln in Konfiguration oder Grundlagen stehen (Git-Historie);
ihre IDs werden nicht neu vergeben. Neue Entscheidungen werden angehängt, Änderungen als neuer
Eintrag „ändert ADR-x“.

---

### ADR-004 Babel 7.29 statt Babel 8 (vorerst)
**Kontext:** Babel 8 ist seit 16.06.2026 stabil und ändert AST-Formen (dynamischer Import →
`ImportExpression`, TS-Knoten-Umbenennungen) und entfernt `pipelineOperator: minimal`. Das würde
Kernlogik und escomplex-Ergebnisse ändern. Babel 7 bekommt Sicherheitsupdates bis Juni 2027.
**Entscheidung:** `7.29.12` (fest gepinnt). Babel 8 als eigene Phase nach dem MVP (P11-S02), mit Golden-Diff.
**Folgen:** Spätestens Q2/2027 muss die Babel-8-Migration erfolgen.

### ADR-005 escomplex bekommt `path-browserify` als Pfad-Modul
**Kontext – wo und warum gebraucht:** escomplex berechnet neben den Metriken pro Datei auch
projektweite Abhängigkeiten (welches Modul importiert welches: `adjacencyList`, `visibilityList`,
`coreSize`, …). Dafür löst es Importe wie `'./components/Header'` relativ zum Dateipfad auf und
braucht dazu ein Objekt mit Nodes `path`-API (`dirname`, `resolve`, `relative`, `extname`, `sep`).
Unsere Dateipfade sind immer POSIX-artig (`/projekt/src/App.js`), weil sie aus dem Browser-Drop
kommen. Das Standardpaket `typhonjs-escomplex-project` verwendet intern Nodes `path`. In Node unter
**Windows** ist das die Windows-Variante (Backslashes, Laufwerksbuchstaben) → die Importe passen
nicht zusammen, die projektweiten Werte weichen ab (im Spike nachgewiesen). Auf macOS/Linux wäre
Nodes `path` bereits POSIX – aber im **Browser** gibt es Nodes `path` gar nicht. Die UI nutzt die
projektweiten Werte zwar nicht, der Golden-Test vergleicht aber den ganzen Report, und Tests/CLI
sollen auf Windows und macOS dasselbe liefern.
**Entscheidung:** escomplex wird als `new ESComplexProject(pathBrowserify)` erzeugt.
`path-browserify` 1.0.1 ist Nodes `path.posix`, als npm-Paket für Browser verpackt (MIT, keine
Abhängigkeiten). Dieselbe Implementierung läuft in Node (Tests, CLI) und im Browser – kein kopierter
Code im Repo. Der alte Browser-Build nutzte das vergleichbare Polyfill `path@0.12.7`.
**Folgen:** Ergebnisse sind betriebssystemunabhängig. Der Spike nutzte eine wortgleiche Portierung
von Nodes POSIX-Code; dass `path-browserify` dasselbe liefert, bestätigt G1.

### ADR-006 Kanonische Dateireihenfolge
**Kontext:** Die Knotenreihenfolge folgt der Eingabereihenfolge; die liefert der Browser beim
Drop in beliebiger Reihenfolge. Reihenfolge beeinflusst Layout und Cluster.
**Entscheidung:** `analyzeProject` sortiert die Eingabe nach Pfad mit JS-Standardsortierung
(`(a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)`, entspricht `Array.prototype.sort()`
auf Strings). Der Legacy-Capture füttert dieselbe Reihenfolge.
**Folgen:** Gleiche Eingabe → gleiches Ergebnis, unabhängig von Browser und Betriebssystem.

### ADR-011 Bewusste Abweichungen vom Altsystem (UI, nicht Kern)
| # | Altsystem | Neu | Grund |
|---|---|---|---|
| A1 | Deep-Link `?id=` geht beim Neuladen verloren (N4) | Deep-Link funktioniert | offensichtlicher Fehler |
| A2 | Demo-Daten (Les Misérables) ohne gespeicherte Analyse (N8) | Upload-Ansicht | Demo-Daten sind ein Überbleibsel |
| A3 | Icon-Texte per `innerHTML` | Text + Link als Daten, JSX | Sicherheit |
| A4 | `hasCluster` bleibt zwischen KVs stehen | pro Graph berechnet | Fehler |
| A5 | Analysefehler (z. B. Syntaxfehler) bricht still ab | Meldung an den Nutzer, App bleibt bedienbar | Robustheit |
| A6 | Speichern ohne Quota-Schutz | `try/catch`, Meldung | Robustheit |
| A7 | Drop liest pro Ordner nur einmal `readEntries` (Chromium: max. 100 Einträge) → Dateien fehlen bei großen Ordnern | `readEntries` wiederholt bis leer | Fehler beim Einlesen, nicht Teil der Berechnung |
| A8 | Bei „Node sizes based on metrics“ = aus keine Icons/Warnstufen | Icons und Warnstufen werden immer berechnet; nur die Größe ist fest 48 | Fehler (Nutzerentscheidung 07.11.2026) |
| A9 | Auswahl über den Dateibaum zeigt im Code-Quality-Panel keine Icons (Q5) | Icons wie beim Klick auf den Knoten im App-Graph | Fehler (Nutzerentscheidung 07.11.2026) |
| A10 | Fenster- und Toolbar-Titel „Component Graph“ | „Qualivis“ | Produktname (Qualivis, Nutzer 07.11.2026) |
| A11 | Größenmetrik ohne Schwelle für den Knotentyp (eine Metrik nur für Komponenten, bei Funktionsknoten; wählbar in einem Projekt mit nur einer Komponente) → Größe `NaN` | feste Größe 48, keine Warnstufe; Icons wie sonst | Fehler (Nutzerentscheidung 09.11.2026) |
| A12 | Pinch auf dem Touchpad und Strg+Mausrad (G9) überlässt d3-zoom 1.x dem Browser, der die ganze Seite samt Toolbar zoomt | Der Graph zoomt um den Zeiger wie in d3-zoom 3; Strg zählt zehnfach, ein Strg-Mausrad-Schritt der Maus zoomt vierfach | Bedienbarkeit (Nutzerentscheidung 09.11.2026) |
| A13 | Ziehen (G8): Nur das Kraft-Layout merkt sich den Drag, mit WebCola kann ein Drag ausblenden. Der Drag beginnt schon beim Drücken: Ein einfacher Klick löst im Kraft-Layout einen mit Shift fixierten Knoten, in WebCola steht ein gedrückter Knoten still. Mehrere Finger ziehen mehrere Knoten zugleich | Beide Layouts melden den Drag, beim Ziehen wird nicht ausgeblendet. Der Drag beginnt mit der ersten Bewegung, ein Klick ohne Bewegung bleibt ein Klick. Ein zweiter Finger auf einem Knoten beendet den laufenden Drag | Klick und Ziehen getrennt, gleich in beiden Layouts |
| A14 | Beim Ausblenden (G1, G6) werden indirekt verbundene Knoten hell (`#fafafa`) und bleiben es nach dem Einblenden (d3 `style('fill', false)` ändert nichts), bis zur nächsten Auswahl oder zum Neustart. Strg+Überfahren blendet auch aus, wenn Strg erst über dem Knoten gedrückt und der Zeiger dann innerhalb des Knotens bewegt wird (`mouseover` der Kind-Elemente) | Hell sind genau die indirekt verbundenen Knoten des aktuellen Fokus. Strg+Überfahren wirkt beim Betreten des Knotens | Fehler bzw. Kleinigkeit |
| A15 | Jede Messung der Labels (G18) entfernt den ersten `<title>` im Knoten. In der AV ist das oft der Tooltip eines Vorschaukreises; der Tooltip des Labels bleibt, auch wenn das Label wieder zu sehen ist | Ein Knoten hat genau dann einen Tooltip, wenn sein Label ausgeblendet ist; die Tooltips der Vorschaukreise bleiben | Fehler |
| A16 | Legende und Auswahl der Größenmetrik (G14, N11) richten sich nach der Komponenten-ID statt nach dem gezeigten Graph: In einem Projekt mit genau einer Komponente zeigt deren KV die Legende der AV und bietet die JSX-Metriken an | Beide richten sich nach der Ansicht; eine gewählte JSX-Metrik wird dort wie beim Wechsel in die KV auf „Lines of Code“ zurückgesetzt | Fehler (passt nicht zum Graph) |
| A17 | Material-Bausteine: Der Tooltip bleibt beim Klicken stehen und liegt dann über der geöffneten Liste; mat-select legt die Liste so, dass die gewählte Option über dem Wert liegt; Buttons zeigen eine Klickwelle (Ripple) | Der Tooltip verschwindet beim Klicken auf sein Element, die Liste öffnet unter dem Feld, keine Klickwelle | eigene, kleinere Bausteine |
| A18 | Der Dateifilter (U7) liest auch eine Python-Umgebung `.venv` im Projektordner. Deren Pakete enthalten `.d.ts`-Dateien (z. B. Playwright), an denen der Parser scheitert (`export const x: T;`), und die ganze Analyse bricht ab | Der Upload überspringt Pfade mit einem Ordner `.venv` und betritt ihn beim Hineinziehen nicht; der Filter im Kern bleibt unverändert | Fehler beim Einlesen, nicht Teil der Berechnung (Nutzerentscheidung 10.11.2026) |
| A19 | Der Dateifilter (U7) liest auch Testordner `__tests__` und Python-Ordner. Im Projekt eines Nutzers brachen eine Testdatei in `__tests__` und eine gebündelte Frontend-Datei in `python/<App>/app/assets/` die ganze Analyse ab (escomplex) | Der Upload überspringt Pfade mit einem Ordner `__tests__` und betritt ihn beim Hineinziehen nicht. Einen Ordner `python`, unter dem eine `.py`-Datei, eine `pyproject.toml` oder eine `uv.lock` liegt, liest er samt Inhalt nicht; der Filter im Kern bleibt unverändert | Testdateien und gebaute Dateien gehören nicht in den Graphen (Nutzerentscheidung 10.11.2026) |
| A20 | Ein Knoten ohne Report (K5, z. B. `ConnectedTodoList`) brach das Template des Code-Quality-Panels ab; es zeigte „Code Quality“ und weiter die Balken der Auswahl davor. Ein Klick auf einen Knoten außerhalb der Dateien (z. B. eine nicht hochgeladene, importierte Komponente) warf schon beim Auswählen | Das Panel zeigt dann nur „Code Quality“ und die Icon-Hinweise, keine Balken. Die Auswahl eines Knotens außerhalb der Dateien gelingt, ohne Code und Zeilen | Fehler des Altsystems, kein gewolltes Verhalten (Regel: dem Code folgen, Nutzer 09.11.2026) |
| A21 | Eine Auswahl klappte im Dateibaum Ordner nach Name und Ebene auf, bei zwei gleichnamigen Ordnern auf einer Ebene (z. B. `packages/a/src`, `packages/b/src`) also womöglich den falschen | Aufgeklappt werden die Ordner auf dem Pfad der Datei | Fehler des Altsystems, in Monorepos (P05.5) häufig |
| A22 | Jeder Wechsel der Ansicht (Doppelklick in eine KV, „Back to app graph“, Zurück im Browser) legt den Graphen neu aus, mit Zoom to fit. Bei einem großen App-Graphen blockiert schon der Start von WebCola (`start(40, 20, 20)`) die Seite für Sekunden, danach läuft die Animation von vorn | Eine Ansicht, die in derselben Analyse schon zu sehen war, kommt so zurück, wie sie verlassen wurde: gleiche Positionen und gleicher Zoom, ohne die ersten Iterationen. War das Layout zur Ruhe gekommen (oder angehalten), bleibt es stehen, bis ein Knoten gezogen wird; sonst läuft es von den Positionen aus weiter und passt am Ende ein. Neu ausgelegt wird wie bisher bei neuer Analyse, anderer Größenmetrik, anderer Einstellung „Node sizes based on metrics“ und wenn Knoten entfernt wurden (G5) | Bedienbarkeit bei großen Graphen (Nutzerentscheidung 10.11.2026) |
| A23 | Das Code-Quality-Panel zeigt zu einer Metrik nur die kurze Beschreibung als Tooltip am Namen | Ein Klick auf den Namen (mit Info-Symbol) klappt unter dem Balken eine Erklärung auf: was die Metrik misst, die Formel, was zählt und was nicht (nach typhonjs-escomplex 0.1 und der JSX-Zählung der Analyse) und die Schwellen des Knotens. Tooltip, Werte und Balken bleiben wie im Altsystem | Verständlichkeit (Nutzerentscheidung 10.11.2026) |
| A24 | Ein Layout läuft, bis es von selbst zur Ruhe kommt; bei großen Graphen kann das lange dauern. Transform, Schriftgröße und Linienbreite gleiten beim Zoomen per CSS-Übergang (0,1 s, ease-out); bei großen Graphen flackerte in Chrome dabei alles, auch die Kopfleiste | Ein Knopf „Stop layout“ links über dem Graphen ist sichtbar, solange das Layout läuft (auch nach dem Ziehen eines Knotens), und beendet es wie ein normales Ende (Zoom to fit beim ersten Ende eines Laufs, Beschriftungen neu gemessen). Den Übergang animiert `useZoomTransition` per `requestAnimationFrame`; die Linienbreite gleitet nur noch beim Zoomen mit dem Mausrad, nicht bei Zoom to fit und Zwei-Finger-Zoom | Bedienbarkeit bei großen Graphen (Nutzerentscheidung 10.11.2026) |
| A25 | Bei einer KV mit mehr als 30 Knoten und Fluss-Layout kam einmal der Tipp „Try out disabling flow layout on large graphs“ (Aktion „Change now“), weil WebCola bei großen Graphen langsam war | Kein Tipp: Das Fluss-Layout ist seit P08 eigener Code auf d3-force und schnell (Schritt 1,1 ms statt 69,5 ms, P08-README) | Der Tipp würde etwas Falsches nahelegen (Nutzerentscheidung 16.11.2026) |

Die Golden-Tests sind von A8, A9 und A11 nicht betroffen (sie nutzen Standardeinstellungen und Klicks
im Graph).

### ADR-016 CI mit GitHub Actions und GitHub Pages für die neue App
**Kontext:** Ursprünglich waren weder Deployment noch CI geplant. Am 08.11.2026 festgestellt: Das Repo ist ein öffentlicher GitHub-Fork. GitHub Pages ist aktiv und liefert aus dem
Branch `gh-pages` den alten Build aus, der dort nicht lädt (`<base href="/component-graph/">`, die
Skripte liegen aber unter `/qualivis/`). In öffentlichen Repos sind die Standard-Runner (auch Windows
und macOS) und Pages kostenlos. Der Nutzer prüft PRs oft unterwegs.
**Entscheidung (Nutzer, 08.11.2026):**
- CI (`.github/workflows/ci.yml`): `pnpm check` auf Ubuntu für PRs und Pushes nach `rewrite/react`;
  seit P04 zusätzlich `pnpm build`. Windows und macOS prüft die
  lokale Entwicklung (Nutzer, 08.11.2026: Linux reicht in der CI).
- Ab M1 veröffentlicht `.github/workflows/pages.yml` nach jedem Merge in `rewrite/react` die **neue**
  App auf GitHub Pages. Die alte Seite wird dort nicht mehr ausgeliefert.
- Der Branch `gh-pages` bleibt unverändert als Quelle der Goldens; `pnpm legacy:extract` liest fest
  den Commit `5f0155e`.
- Dependabot und Renovate vorerst nicht.
**Folgen:** Actions per Commit-SHA gepinnt, nur lesender Token, keine Secrets, kein
`pull_request_target`. Workflow-Dateien sind CI/CD-Änderungen und brauchen die Zustimmung des
Nutzers (Schritt 0 der Karten). Pages-Quelle und Environment-Freigabe stellt der Nutzer auf GitHub
ein. Wird das Repo privat (O14), sind die Actions-Minuten begrenzt und Pages braucht ein Bezahl-Abo;
dann CI und Pages neu bewerten.

