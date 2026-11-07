# Architekturentscheidungen (ADRs)

Format je Eintrag: Kontext · Entscheidung · Folgen. Status: *angenommen* (mit dem Nutzer
abgestimmt am 07.11.2026), sofern nicht anders angegeben. Neue Entscheidungen werden hier
angehängt (ADR-013 …), nie bestehende umgeschrieben; Änderungen als neuer Eintrag „ersetzt ADR-x“.

---

### ADR-001 React 19 nur für die Oberfläche
**Kontext:** Angular 9 ist veraltet, zwei Major-Versionen pro Jahr und 24 Sicherheitsmeldungen
2026 (core/common/compiler). Gesucht: wenige Abhängigkeiten, kaum Sicherheitsmeldungen, stabil,
gut von leichteren Modellen umsetzbar. Vergleich (Stand 11/2026): React 1 Zusatzpaket, keine
Client-Meldung seit 2018; Preact 0 Pakete, 1 Meldung 2026; Lit 5 Pakete, 0 Meldungen; Vue 22
Pakete; Svelte 18 Pakete + 30 Meldungen (inkl. devalue); Solid 3 Pakete + 13 Meldungen (seroval),
2.0 mit Breaking Changes.
**Entscheidung:** React 19 + react-dom, nur clientseitig (keine Server Components). Analyse und
Darstellungsregeln liegen framework-frei in `@qualivis/core`.
**Folgen:** Ein Framework-Wechsel später betrifft nur `apps/web`. Das Tool kann seinen eigenen
React-Code analysieren (G6).

### ADR-002 Alte Analysebibliotheken als Pakete weiterverwenden (kein Vendoring)
**Kontext:** escomplex (0.1.0, 2018), WebCola (3.4.0, 2019), jLouvain (2.0.0, 2016) sind nicht mehr
gepflegt. Alternativen ändern Ergebnisse. Die App läuft lokal mit eigenen Projekten; die
Bibliotheken haben keine bekannten ausnutzbaren Sicherheitsmeldungen.
**Entscheidung:** Neueste verfügbare Versionen als normale Abhängigkeiten, mit den zwei
bestehenden Patches als pnpm-Patches. Kein Kopieren des Quelltexts ins Repo.
**Folgen:** escomplex zieht `babel-runtime@6`, `core-js@2`, `regenerator-runtime@0.11`,
`backbone-esnext-events` nach (13 Pakete). Neubewertung, falls eine ausnutzbare Meldung bekannt
wird (dann Vendoring als eigene ADR).

### ADR-003 D3-DOM-Code durch React ersetzen, nur d3-force behalten
**Kontext:** Das Altsystem nutzt d3 v5 komplett (37 Pakete) und WebCola bringt d3 v1 mit.
**Entscheidung:** SVG rendert React; Zoom/Pan, Drag, Übergänge (CSS) und Farbumrechnung sind
eigener Code. `d3-force` (+3 kleine d3-Pakete) bleibt für das Kraft-Layout. WebCola wird nur über
`webcola/dist/src/layout` (ohne d3-Adapter) benutzt.
**Folgen:** Layout-Positionen dürfen vom Altsystem abweichen (vom Nutzer akzeptiert); die
Darstellungsregeln bleiben gleich (G2). WebCola installiert seine d3-v1-Abhängigkeiten trotzdem
(nicht im Bundle, da nicht importiert).

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
von Nodes POSIX-Code; dass `path-browserify` dasselbe liefert, bestätigt G1 in P03-S03.

### ADR-006 Kanonische Dateireihenfolge
**Kontext:** Die Knotenreihenfolge folgt der Eingabereihenfolge; die liefert der Browser beim
Drop in beliebiger Reihenfolge. Reihenfolge beeinflusst Layout und Cluster.
**Entscheidung:** `analyzeProject` sortiert die Eingabe nach Pfad mit JS-Standardsortierung
(`(a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)`, entspricht `Array.prototype.sort()`
auf Strings). Der Legacy-Capture füttert dieselbe Reihenfolge.
**Folgen:** Gleiche Eingabe → gleiches Ergebnis, unabhängig von Browser und Betriebssystem.

### ADR-007 Biome statt ESLint + Prettier
**Kontext:** ESLint + typescript-eslint ≈ 100 Pakete; typescript-eslint unterstützt TypeScript 7
nicht (nur < 6.1).
**Entscheidung:** Biome 2.6 (ein Binärprogramm, keine npm-Abhängigkeiten, 767 Regeln u. a. aus
ESLint, typescript-eslint, jsx-a11y, react, react-hooks; Formatierer ≈ 97 % Prettier-kompatibel).
**Folgen:** Weniger typbasierte Regeln → `tsc --strict` deckt das ab.

### ADR-008 Playwright nur in eigenem Paket, nur mit Systembrowser
**Kontext:** Playwright hatte eine Meldung (Browser-Download ohne Zertifikatsprüfung, behoben
1.55.1); das Risiko liegt im Browser-Download.
**Entscheidung:** `e2e/` als separates Workspace-Paket; installierter Systembrowser über `channel`
(Standard: Windows `msedge`, macOS `chrome`; überschreibbar per `QV_BROWSER_CHANNEL`);
Umgebungsvariable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`; nie `playwright install`.
**Folgen:** Kern und App sind ohne Playwright installier- und testbar.

### ADR-009 Keine UI-Bibliothek, Schriften lokal
**Kontext:** Das Aussehen von Angular Material soll erhalten bleiben; MUI bringt 31 Pakete + Emotion.
**Entscheidung:** Die wenigen benötigten Bausteine (Button, Icon-Button, Schalter, Dialog,
Snackbar, Select, Tooltip, Fortschrittsbalken, Split, Baum) werden selbst gebaut, mit Material-
Werten aus der Stil-Referenz. Roboto und Material Icons über `@fontsource/*` lokal.
**Folgen:** Mehr eigener UI-Code (klein, getestet); keine Abhängigkeit vom Google-CDN; offline-fähig.

### ADR-010 `localStorage` statt Cookies
**Kontext:** Das Altsystem merkt sich gezeigte Hinweise in Cookies (10 Jahre).
**Entscheidung:** `localStorage` mit Präfix `qualivis.` für Einstellungen, Analyse und Hinweise.
**Folgen:** Keine Cookies, kein Versand an Server. Alte Einstellungen werden nicht übernommen
(andere Schlüssel; die alte App läuft unter einem anderen Ursprung).

### ADR-011 Bewusste Abweichungen vom Altsystem (UI, nicht Kern)
| # | Altsystem | Neu | Grund |
|---|---|---|---|
| A1 | Deep-Link `?id=` geht beim Neuladen verloren (N4) | Deep-Link funktioniert | offensichtlicher Fehler |
| A2 | Demo-Daten (Les Misérables) ohne gespeicherte Analyse (N8) | Upload-Ansicht | Demo-Daten sind ein Überbleibsel |
| A3 | Icon-Texte per `innerHTML` | Text + Link als Daten, JSX | Sicherheit |
| A4 | `hasCluster` bleibt zwischen KVs stehen (V3) | pro Graph berechnet | Fehler |
| A5 | Analysefehler (z. B. Syntaxfehler) bricht still ab | Meldung an den Nutzer, App bleibt bedienbar | Robustheit |
| A6 | Speichern ohne Quota-Schutz | `try/catch`, Meldung | Robustheit |
| A7 | Drop liest pro Ordner nur einmal `readEntries` (Chromium: max. 100 Einträge) → Dateien fehlen bei großen Ordnern | `readEntries` wiederholt bis leer | Fehler beim Einlesen, nicht Teil der Berechnung |
| A8 | Bei „Node sizes based on metrics“ = aus keine Icons/Warnstufen (V1) | Icons und Warnstufen werden immer berechnet; nur die Größe ist fest 48 | Fehler (Nutzerentscheidung 07.11.2026) |
| A9 | Auswahl über den Dateibaum zeigt im Code-Quality-Panel keine Icons (Q5) | Icons wie beim Klick auf den Knoten im App-Graph | Fehler (Nutzerentscheidung 07.11.2026) |
| A10 | Fenster- und Toolbar-Titel „Component Graph“ | „Qualivis“ (ADR-012) | Produktname |

Alles andere – auch die Eigenheiten K1–K11 und V2, V4–V7 – bleibt gleich. Weitere
Abweichungen nur mit neuer ADR und Zustimmung des Nutzers. Die Golden-Tests sind von A8/A9 nicht
betroffen (sie nutzen Standardeinstellungen und Klicks im Graph).

### ADR-012 Produktname
**Kontext:** Das Repository heißt `qualivis`, die alte App „Component Graph“.
**Entscheidung (Nutzer, 07.11.2026):** Das Produkt heißt **Qualivis** (Fenstertitel, Toolbar,
Paketnamen `@qualivis/*`). „Component Graph“ wird dort verwendet, wo es fachlich passt – für die
Graph-Ansicht selbst (z. B. `aria-label="Component graph"` des SVG, Hilfetexte).
**Folgen:** Abweichung A10 vom Altsystem; Sichtvergleich berücksichtigt den anderen Titel.

### ADR-013 Jotai für geteilten Zustand
**Kontext:** Die App braucht geteilten Zustand (Analyse, Ansicht, Auswahl, Einstellungen,
Meldungen), teils persistiert und teils abgeleitet. Alternativen: eigener Mini-Store auf
`useSyncExternalStore` (≈ 40 Zeilen, selbst zu pflegen, Falle bei Selektoren, die neue Objekte
liefern) oder nur React Context (mehr Re-Renders, mehr Boilerplate für Persistenz).
**Entscheidung (Nutzer, 07.11.2026):** `jotai` 3.0.1 (MIT, keine Abhängigkeiten, keine bekannten
Sicherheitsmeldungen; v3 ist laut Release-Notes für App-Code weitgehend kompatibel zu v2).
Atome je Thema in `apps/web/src/state/`, `atomWithStorage` für Einstellungen.
**Folgen:** +1 Paket; weniger eigener Code; Tests mit eigenem Jotai-`store` pro Test. Bei Fragen zur
API gilt die Dokumentation der **installierten** Version (v3).

### ADR-014 Feste Versionen, 3 Tage Mindestalter
**Kontext:** Reproduzierbare Builds und kontrollierte Updates (später z. B. Renovate);
Schutz vor frisch kompromittierten Paketen.
**Entscheidung (Nutzer, 07.11.2026):** Alle Versionen im Catalog fest (`1.2.3`), `saveExact: true`;
`minimumReleaseAge: 4320` (3 Tage); keine `minimumReleaseAgeExclude`-Einträge.
**Folgen:** Updates sind bewusste Änderungen an `pnpm-workspace.yaml`; neue Versionen erst ab 3 Tagen
nach Veröffentlichung.
