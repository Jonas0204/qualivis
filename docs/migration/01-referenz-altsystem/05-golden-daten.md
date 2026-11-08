# Golden-Daten: Referenzwerte aus dem Altsystem

Golden-Daten sind JSON-Dateien, die der **alte gh-pages-Build** für ein Testprojekt erzeugt.
Die neue Implementierung muss dieselben Werte liefern. Konzept und Testebenen:
`00-grundlagen/06-teststrategie.md`. Werkzeuge: `tools/legacy/` (Server, Capture-Skript), `tools/golden/diff-json.mjs`,
Golden-Test: `anhang/A5`.

## 1. Ablage

```
testdata/
├─ fixtures/
│  ├─ mini/            eigenes Testprojekt (alle wichtigen Erkennungsfälle), siehe testdata/README.md
│  └─ realworld/       gothinkster/react-redux-realworld-example-app, Commit ee72eba (MIT), nur src/
└─ golden/
   ├─ README.md        Herkunft: Legacy-Commit, Build-Commit, Datum, Einstellungen, Browser
   ├─ mini/
   │  ├─ legacy-report.json            localStorage['report']      (escomplex-Report)
   │  ├─ legacy-filemap.json           localStorage['components']  (FileMap)
   │  ├─ legacy-appgraph.json          localStorage['graph']       (App-Graph)
   │  ├─ legacy-dom-app.json           Knoten-/Kantendaten der AV nach Darstellungsregeln
   │  ├─ legacy-panels-app.json        Code-Quality-Panel für jeden Knoten der AV
   │  ├─ legacy-dom-component-<id>.json    dasselbe je KV (jede Komponente mit Funktionen)
   │  └─ legacy-panels-component-<id>.json Panels aller Knoten dieser KV
   └─ realworld/ … (gleiche Dateien)

`<id>` = Knoten-ID der Komponente mit allen Nicht-Alphanumerischen Zeichen als `_`,
z. B. `mini_src_App_js_App`.
```

Golden-Dateien werden **nie von Hand** und **nie zum Grünmachen eines Tests** geändert. Neu
erfassen nur nach dem Verfahren in `tools/legacy/README.md` bzw. automatisiert (P09-S02) und mit Freigabe des
Nutzers.

## 2. Erfassungsprinzip (im Spike erprobt)

1. Legacy-Build (Commit `5f0155e` im Branch `gh-pages`) nach `.cache/legacy-build/` entpacken, lokal unter
   `http://127.0.0.1:4300/component-graph/` ausliefern (Server: `tools/legacy/serve-legacy.mjs`). Der Server liefert
   auch die Fixtures (`/fixtures/<name>/manifest.json` + Dateien) und nimmt Ergebnisse per
   `POST /capture/<name>/<datei>` entgegen.
2. Im Browser (DevTools-Konsole oder Claude-Browser-Fenster) das Skript `tools/legacy/capture.browser.js` ausführen.
   Es baut aus den Fixture-Dateien `File`-Objekte mit `webkitRelativePath = '/<name>/<pfad>'`
   und löst ein synthetisches `drop`-Ereignis auf dem Element `[appdroptarget]` aus. Die alte App
   analysiert das wie einen echten Drop.
3. Nach der Analyse `window.onbeforeunload()` aufrufen. Dadurch schreibt die App Report, FileMap
   und Graph in den `localStorage`. Diese drei Werte werden per POST gespeichert.
4. Die Darstellungsregeln werden aus den an die SVG-Elemente gebundenen D3-Daten gelesen
   (`g.node.__data__`, `line.__data__`): `width`, `warn`, `error`, `icons`, `cluster`, Klassen,
   Radien, Vorschaukreise. Für jede Komponente mit Funktionen wird die KV per synthetischem
   `dblclick` geöffnet, gelesen und über den Zurück-Button verlassen.
5. Das Panel wird nach einem synthetischen Klick auf `circle.circle-overlay` gelesen.
6. Die Datei-Reihenfolge ist kanonisch: Der Manifest-Endpunkt sortiert die relativen Pfade mit
   JS-Standardsortierung (`Array.prototype.sort()`), genauso sortiert `analyzeProject` (ADR-006).

Wichtig: Der Deep-Link `?id=` funktioniert im Legacy-Build unter Basis-Pfad nicht (siehe
Funktionsinventar N4). Deshalb immer per Doppelklick in die KV wechseln.

## 3. Plausibilitätswerte (zur schnellen Kontrolle nach dem Erfassen)

| Fixture | Wert | Erwartung |
|---|---|---|
| mini | App-Graph | 8 Knoten, 7 Kanten |
| mini | Knotenlabels (Reihenfolge) | App, BaseWidget, Counter, Footer, Header, TodoItem, TodoList, ConnectedTodoList |
| mini | Vererbungskante | BaseWidget → Header (`inherits: true`) |
| mini | App (Klasse) aggregate | cyclomatic 16, sloc.physical 65, sloc.jsx 10, maxJsxNesting 3, halstead.difficulty 34.286, halstead.bugs 0.373, paramCount 2 |
| mini | Breite App (AV) | 54.68… |
| mini | ConnectedTodoList | Breite 20 (kein Report, K5) |
| mini | Header | Icon `device_hub/warn` |
| mini | KV App | 11 Knoten, 9 Kanten; `computeTotal` Icons `warning/error` + `content_cut/warn`; `emptyMethod` `delete/warn`; `componentWillMount` `report/warn`; `renderTitle` `content_cut/warn` |
| mini | KV Counter | 4 Knoten (`Counter`, `handleClick`, `formatValue`, `renderBadge`), 3 Kanten |
| realworld | App-Graph | 32 Knoten, 36 Kanten |
| realworld | Knoten mit Icons | Article, Editor, Login, Register: `warning/error`; Home, Profile, SettingsForm: `warning/warn`; ProfileFavorites: `device_hub/warn` |

## 4. Vergleichsregeln

| Ebene | Vergleich |
|---|---|
| G1 Report/FileMap/App-Graph | Struktur und Ganzzahlen exakt, Halstead-Fließkommawerte ≤ 1 % relativ oder ≤ 0,01 absolut (`06-teststrategie.md` §3) – im Spike 0 Abweichungen |
| G2 Darstellungsregeln | `width` mit Toleranz `1e-9`; alles andere exakt; Icon-Texte normalisiert (HTML-Tags entfernt, Leerraum zu einem Leerzeichen, getrimmt) |
| G3 Layout (optional) | Positionen nach Abzug des Schwerpunkts, Toleranz 0.5 px; nur WebCola, gleiche Containergröße |
| G4 Panel | Texte und Klassen exakt |

Abweichungen werden mit `tools/golden/diff-json.mjs` (`anhang/A5`) pfadgenau aufgelistet.
