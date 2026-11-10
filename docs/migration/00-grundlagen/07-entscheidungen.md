# Architekturentscheidungen (ADRs)

Format je Eintrag: Kontext · Entscheidung · Folgen. Alle Einträge sind mit dem Nutzer abgestimmt.
Hier stehen nur Entscheidungen, die noch umgesetzt werden oder für kommende Schritte gelten.
Umgesetzte ADRs werden entfernt, sobald ihre Regeln in Konfiguration oder Grundlagen stehen (Git-Historie);
ihre IDs werden nicht neu vergeben. Neue Entscheidungen werden angehängt, Änderungen als neuer
Eintrag „ändert ADR-x“.

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
von Nodes POSIX-Code; dass `path-browserify` dasselbe liefert, bestätigt G1.

### ADR-006 Kanonische Dateireihenfolge
**Kontext:** Die Knotenreihenfolge folgt der Eingabereihenfolge; die liefert der Browser beim
Drop in beliebiger Reihenfolge. Reihenfolge beeinflusst Layout und Cluster.
**Entscheidung:** `analyzeProject` sortiert die Eingabe nach Pfad mit JS-Standardsortierung
(`(a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0)`, entspricht `Array.prototype.sort()`
auf Strings). Der Legacy-Capture füttert dieselbe Reihenfolge.
**Folgen:** Gleiche Eingabe → gleiches Ergebnis, unabhängig von Browser und Betriebssystem.

### ADR-008 Playwright nur in eigenem Paket, nur mit Systembrowser
**Kontext:** Playwright hatte eine Meldung (Browser-Download ohne Zertifikatsprüfung, behoben
1.55.1); das Risiko liegt im Browser-Download.
**Entscheidung:** `e2e/` als separates Workspace-Paket; installierter Systembrowser über `channel`
(Standard: Windows `msedge`, macOS `chrome`; überschreibbar per `QV_BROWSER_CHANNEL`);
Umgebungsvariable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`; nie `playwright install`.
**Folgen:** Kern und App sind ohne Playwright installier- und testbar.
**Status:** Standardbrowser geändert durch ADR-018 (08.11.2026); sonst gültig.

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
| A11 | Größenmetrik ohne Schwelle für den Knotentyp (eine Metrik nur für Komponenten, bei Funktionsknoten; wählbar in einem Projekt mit nur einer Komponente) → Größe `NaN` | feste Größe 48, keine Warnstufe; Icons wie sonst | Fehler (Nutzerentscheidung 09.11.2026) |
| A12 | Pinch auf dem Touchpad und Strg+Mausrad (G9) überlässt d3-zoom 1.x dem Browser, der die ganze Seite samt Toolbar zoomt | Der Graph zoomt um den Zeiger wie in d3-zoom 3; Strg zählt zehnfach, ein Strg-Mausrad-Schritt der Maus zoomt vierfach | Bedienbarkeit (Nutzerentscheidung 09.11.2026) |
| A13 | Ziehen (G8): Nur das Kraft-Layout merkt sich den Drag, mit WebCola kann ein Drag ausblenden. Der Drag beginnt schon beim Drücken: Ein einfacher Klick löst im Kraft-Layout einen mit Shift fixierten Knoten, in WebCola steht ein gedrückter Knoten still. Mehrere Finger ziehen mehrere Knoten zugleich | Beide Layouts melden den Drag, beim Ziehen wird nicht ausgeblendet. Der Drag beginnt mit der ersten Bewegung, ein Klick ohne Bewegung bleibt ein Klick. Ein zweiter Finger auf einem Knoten beendet den laufenden Drag | Klick und Ziehen getrennt, gleich in beiden Layouts |
| A14 | Beim Ausblenden (G1, G6) werden indirekt verbundene Knoten hell (`#fafafa`) und bleiben es nach dem Einblenden (d3 `style('fill', false)` ändert nichts), bis zur nächsten Auswahl oder zum Neustart. Strg+Überfahren blendet auch aus, wenn Strg erst über dem Knoten gedrückt und der Zeiger dann innerhalb des Knotens bewegt wird (`mouseover` der Kind-Elemente) | Hell sind genau die indirekt verbundenen Knoten des aktuellen Fokus. Strg+Überfahren wirkt beim Betreten des Knotens | Fehler bzw. Kleinigkeit |
| A15 | Jede Messung der Labels (G18) entfernt den ersten `<title>` im Knoten. In der AV ist das oft der Tooltip eines Vorschaukreises; der Tooltip des Labels bleibt, auch wenn das Label wieder zu sehen ist | Ein Knoten hat genau dann einen Tooltip, wenn sein Label ausgeblendet ist; die Tooltips der Vorschaukreise bleiben | Fehler |
| A16 | Legende und Auswahl der Größenmetrik (G14, N11) richten sich nach der Komponenten-ID statt nach dem gezeigten Graph: In einem Projekt mit genau einer Komponente zeigt deren KV die Legende der AV und bietet die JSX-Metriken an | Beide richten sich nach der Ansicht; eine gewählte JSX-Metrik wird dort wie beim Wechsel in die KV auf „Lines of Code“ zurückgesetzt | Fehler (passt nicht zum Graph) |
| A17 | Material-Bausteine: Der Tooltip bleibt beim Klicken stehen und liegt dann über der geöffneten Liste; mat-select legt die Liste so, dass die gewählte Option über dem Wert liegt; Buttons zeigen eine Klickwelle (Ripple) | Der Tooltip verschwindet beim Klicken auf sein Element, die Liste öffnet unter dem Feld, keine Klickwelle | eigene, kleinere Bausteine (ADR-009) |
| A18 | Der Dateifilter (U7) liest auch eine Python-Umgebung `.venv` im Projektordner. Deren Pakete enthalten `.d.ts`-Dateien (z. B. Playwright), an denen der Parser scheitert (`export const x: T;`), und die ganze Analyse bricht ab | Der Upload überspringt Pfade mit einem Ordner `.venv` und betritt ihn beim Hineinziehen nicht; der Filter im Kern bleibt unverändert | Fehler beim Einlesen, nicht Teil der Berechnung (Nutzerentscheidung 10.11.2026) |

Alles andere – auch die Eigenheiten K1–K12 und V2, V4–V7 – bleibt gleich. Weitere
Abweichungen nur mit neuer ADR und Zustimmung des Nutzers. Die Golden-Tests sind von A8, A9 und
A11 nicht betroffen (sie nutzen Standardeinstellungen und Klicks im Graph).

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

### ADR-015 Komponententests: jsdom + Testing Library + Jotai-`TestProvider`
**Kontext:** Frage des Nutzers: Macht ein Jotai-`TestProvider` (Provider + `useHydrateAtoms`) jsdom
überflüssig? Geprüft am 07.11.2026 (Spike, npm-Registry, deps.dev, GitHub Advisories, react.dev):
- Der `TestProvider` setzt nur den Zustand. Rendern, Klicken und Tippen brauchen weiter ein DOM.
  Testing Library bringt keins mit: In reinem Node meldet `render` `document is not defined`,
  `screen` und `fireEvent` scheitern genauso.
- Ohne DOM rendern nur `react-dom/server` (statisches HTML ohne Effekte und Events, in Node geprüft)
  und `react-test-renderer`. Letzteres ist seit React 19 abgekündigt, wird nicht gepflegt und kennt
  keine echten Events; Refs gehen nur mit Mocks.
- `jest-environment-jsdom` 30.5.2 ist jsdom plus Jest-Umgebung (85 statt 27 transitive Pakete) und
  braucht Jest als zweiten Runner (323 Pakete). `jest-junit` ist nur ein Reporter.
- Vitest-Browser-Modus: Tests im echten Browser, aber `@vitest/browser` hatte 5 Meldungen (4 davon
  2026, 3 kritisch) und bringt ≈ 24 Pakete mit. „Nur Node + E2E“ verzichtet auf Klick-Tests auf
  Komponentenebene.
**Entscheidung (Nutzer, 07.11.2026):** Komponententests bleiben bei Vitest + jsdom + Testing Library +
user-event. Alle Komponenten- und Hook-Tests rendern zusätzlich über den `TestProvider`
(`StateProvider` + `useHydrateAtoms`) mit eigenem Store pro Test und typsicheren Startwerten
(`initial()`), siehe `06-teststrategie.md` §2.
**Folgen:** Keine neuen Pakete, denn `useHydrateAtoms` gehört zu `jotai/utils`. Mit Jotai 3 und
TS 7 akzeptiert `useHydrateAtoms` als Schreib-Argumente nur `any[]` (jotai #2650);
`apps/web/src/test/TestProvider.tsx` kapselt das an einer Stelle, `initial()` hält die Werte
typsicher (Nutzer, 09.11.2026). Die Grenzen von jsdom bleiben (`06-teststrategie.md` §4).

### ADR-016 CI mit GitHub Actions und GitHub Pages für die neue App
**Kontext:** Ursprünglich waren weder Deployment noch CI geplant. Am 08.11.2026 festgestellt: Das Repo ist ein öffentlicher GitHub-Fork. GitHub Pages ist aktiv und liefert aus dem
Branch `gh-pages` den alten Build aus, der dort nicht lädt (`<base href="/component-graph/">`, die
Skripte liegen aber unter `/qualivis/`). In öffentlichen Repos sind die Standard-Runner (auch Windows
und macOS) und Pages kostenlos. Der Nutzer prüft PRs oft unterwegs.
**Entscheidung (Nutzer, 08.11.2026):**
- CI (`.github/workflows/ci.yml`): `pnpm check` auf Ubuntu für PRs und Pushes nach `rewrite/react`;
  seit P04 zusätzlich `pnpm build`, ab P10-S03 `pnpm quality:self`. Windows und macOS prüft die
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

### ADR-018 E2E-Browser: Microsoft Edge (ändert ADR-008)
**Kontext:** ADR-008 nannte als Standard Windows `msedge` und macOS `chrome`.
**Entscheidung (Nutzer, 08.11.2026):** Playwright nutzt im ganzen Projekt das installierte Microsoft
Edge (`channel: 'msedge'`), ohne Browser-Download. Weicht ein einzelner Rechner ab, setzt das seine
lokale Umgebung über `QV_BROWSER_CHANNEL` (z. B. `chrome`), nicht das Repo.
**Folgen:** Eine Konfiguration für alle Systeme; Edge muss installiert sein.

### ADR-019 Monorepo-Unterstützung als eingeschobene Phase P05.5
**Kontext:** Der Nutzer will aus einem Monorepo eine einzelne App analysieren, die Komponenten einer
Bibliothek aus demselben Repo nutzt. Eine Probe am Kern (09.11.2026) zeigte:
- Der alte Kern folgt nur relativen Importen und K4; Importe über Paketnamen oder tsconfig-`paths`
  ergeben keine Kanten.
- Hochgeladen werden muss alles, und dann zeigt die App-Ansicht jede Komponente jeder Datei, auch
  unbenutzte und Hilfskomponenten aus Testdateien.
- Liegt `X.styles.ts` neben `X.tsx`, fehlt die Kante zu `X` (K12).
- `memo`, `forwardRef` und `FC`-Pfeilfunktionen erkennt der Kern als Komponenten.

Ein anonymisierter Strukturbericht des Ziel-Monorepos (09.11.2026) ergab: pnpm-Workspaces; die App
importiert die Bibliothek fast nur über tiefe Unterpfade, die tsconfig-`paths` und ein Vite-Alias
auf `src` abbilden; keine Einstiegsfelder, keine Barrel-Dateien; TypeScript, ESM; Tests in
`__tests__/`; die Bibliothek hat mehrere hundert Quelldateien.

**Entscheidung (Nutzer, 09.11.2026):**
- Eingeschobene Phase **P05.5** zwischen P05 und P06, ohne Umnummerierung und ohne eigenen
  Meilenstein; sie endet mit der Abnahme am echten Monorepo. Ausnahme von Ziele §3 (keine neuen
  Analysefunktionen vor Abschluss).
- Neue Vorstufe `packages/core/src/workspace/` vor dem unveränderten Kern (R5):
  1. Pakete aus allen `package.json` und `paths` aus `tsconfig.json`/`jsconfig.json` (mit
     `extends`, JSONC) lesen.
  2. Import-Angaben auflösen: relativ, tsconfig-`paths`, Paketname mit `src/`-Rückfall.
  3. Vom gewählten App-Ordner aus die erreichbaren Dateien sammeln, ohne Tests und Typ-Importe.
  4. Auflösbare Angaben in diesen Dateien durch relative Pfade mit Endung ersetzen (gleiche Zeile).
  5. Mit dem alten Kern analysieren und den Originalcode zurück in die FileMap setzen.
- Der Upload liest zusätzlich die Konfigurationsdateien und betritt `node_modules`, `build` und
  `dist` nicht mehr.
- Hat ein Upload mindestens zwei Pakete mit Quelldateien, fragt die Upload-Ansicht nach dem
  App-Ordner. Vorausgewählt ist „Whole project“, also der bisherige Weg.
- Nicht in P05.5: Barrel-Dateien und `exports`-Tabellen (O16), optische Unterscheidung von
  Bibliotheksknoten (O17), Testdateien außerhalb von `__tests__/` mit Suffix `Test` (O18),
  gespeicherte Auswahl und Auswahl beim Drop auf den Graphen (O19), Vite-/webpack-Aliase.

**Folgen:**
- Für Uploads mit einem Paket und für „Whole project“ ändert sich nichts; G1/G2 bleiben gleich.
- Der neue Weg hat keine Goldens, denn das Altsystem kann ihn nicht. Er wird mit dem eigenen
  Testprojekt `monorepo` und von Hand hergeleiteten Erwartungen getestet.
- Im neuen Weg umgeht die Endung K12; im alten Weg bleibt K12 erhalten.
- Halstead-Werte umgeschriebener Dateien können minimal abweichen.
- Große Bibliotheken belasten den Browser (RI14); der Worker kommt in P08-S04.
