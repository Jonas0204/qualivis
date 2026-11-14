# Große Graphen: Leistung, Ziehen und besserer Aufbau

Stand: 13.11.2026. Gehört zu P08-S09 (Performance). Dieses Dokument hält fest,

1. warum der Aufbau großer Graphen langsam war und was dagegen umgesetzt ist (Teil A),
2. warum der Graph beim Halten eines Knotens nach unten fiel und wie das behoben ist (Teil B),
3. warum zusammengehörige Knoten im fertigen Bild weit verstreut liegen, welche Verfahren die
   Literatur dafür kennt und welche Möglichkeiten es für Qualivis gibt (Teil C, noch **nicht**
   umgesetzt, Entscheidung offen).

Teil A und B beschreiben umgesetzten Code. Teil C ist eine Entscheidungsgrundlage.

## Inhalt

- [A. Leistung beim Aufbau](#a-leistung-beim-aufbau)
- [B. Der Graph fiel beim Halten eines Knotens](#b-der-graph-fiel-beim-halten-eines-knotens)
- [C. Besserer Aufbau: Zusammengehöriges näher zusammen](#c-besserer-aufbau-zusammengehöriges-näher-zusammen)
  - [C1. Befund am Bild](#c1-befund-am-bild)
  - [C2. Warum das heutige Layout so aussieht](#c2-warum-das-heutige-layout-so-aussieht)
  - [C3. Was die Literatur kennt](#c3-was-die-literatur-kennt)
  - [C4. Möglichkeiten für Qualivis](#c4-möglichkeiten-für-qualivis)
  - [C5. Vergleich und Empfehlung](#c5-vergleich-und-empfehlung)
  - [C6. Wie man die Güte misst](#c6-wie-man-die-güte-misst)
  - [C7. Offene Fragen](#c7-offene-fragen)
- [Literatur](#literatur)

---

## A. Leistung beim Aufbau

### A1. Ausgangslage

Graphen mit 700 bis 1.500 Knoten, die nicht nur eine Kette bilden, sondern untereinander verwoben
sind, brauchten Minuten für den Aufbau und ruckelten stark. In Ruhe (Verschieben, Zoomen) war die
Leistung gut. Die Vermutung, es liege weder an React noch an der Berechnung, hat sich bestätigt.

### A2. Messaufbau

- Testprojekte, erzeugt mit festem Startwert (linearer Kongruenzgenerator, Startwert 42), nicht im
  Repo: `N` Dateien `src/area<i mod 32>/Comp<i>.jsx`. Jede Komponente importiert und rendert 1 bis
  5 zufällige **spätere** Komponenten (im Mittel 3), mit 3 % Wahrscheinlichkeit zusätzlich eine
  frühere (Zyklus), und hat 0 bis 5 innere Funktionen. Variante „Kette“: jede importiert nur die
  nächste.
- Gemessen am gebauten Stand (`pnpm build`, `pnpm preview`) in Chromium ohne Grafikkarte
  (Software-Rasterung), Fenster 1600 × 1000, Upload über das Datei-Eingabefeld.
- Zahlen aus `qualivis.info()` (`layout.startToEnd`, `layout.tick`, `layout.frameGap`,
  `layout.frameWrite`, `longAnimationFrames.styleAndLayoutMs`) und aus Chrome-Traces
  (`UpdateLayoutTree`, `Layout`, `PrePaint`, `Paint`, `Layerize`, `RasterTask`).
- Die absoluten Zeiten hängen vom Rechner ab; mit Grafikkarte ist die Rasterung schneller. Die
  Verhältnisse sind belastbar.

### A3. Ursachen, in der Reihenfolge ihres Gewichts

**1. Globale Regel `box-sizing: inherit`.** `global.css` setzt (wie das Altsystem)
`*, *::before, *::after { box-sizing: inherit; }`. `inherit` auf einer nicht vererbten Eigenschaft
macht jedes Element vom Stil seines Elternelements abhängig. Bewegt das Layout einen Knoten
(Attribut `transform` an `g.node`), ändert sich dessen Stil, und der Browser rechnet den Stil
**aller Kinder** neu: 4.200 Elemente pro Bild bei 700 Knoten, 480 ms statt 3 ms. Die Selektoren
selbst kosten dabei nur wenige Millisekunden; die Zeit steckt im Neuberechnen. Im Stillstand
passiert das nicht, weil Verschieben und Zoomen nur die Zoom-Gruppe ändern.

**2. Ein Rechenschritt pro Bild.** Das Layout braucht 300 Schritte. Die Engine im Haupt-Thread
rechnet höchstens 6 ms pro Bild und verwirft liegengebliebene Schritte. Ab etwa 1.000 Knoten
dauert ein Schritt länger als 6 ms, also lief genau ein Schritt pro Bild: Dauer = 300 × Bildzeit.
Langsame Bilder haben das Layout damit direkt gestreckt.

**3. Tausende Einzelelemente pro Bild.** Jede Kante war ein `<line>` mit `marker-end`. Pro Bild
vier Attribute und `style.display` je Kante, dazu Layout und Paint je Linie und je Pfeilspitze
(die Marker allein etwa 15 ms Paint pro Bild bei 3.000 Kanten).

**4. Verwoben statt Kette.** Verwobene Graphen haben mehr Kanten, und die Kanten sind lang (quer
über den Bildschirm statt 100 px zum Nachbarn). Das treibt Paint und Rasterung: im Nachbau 32 ms
Paint und 90 ms Rasterung pro Bild gegen 12 ms und 2 ms bei einer Kette gleicher Knotenzahl.

Nicht ursächlich: React (während des Aufbaus rendert React nicht, `writePositions` schreibt direkt
ins DOM), die Berechnung (ein Schritt 4 bis 12 ms), Text, Schraffur, Vorschaukreise,
CSS-Transitions.

### A4. Umgesetzt

| Maßnahme | Datei | Wirkung |
|---|---|---|
| Fester `box-sizing`-Wert im Graph | `graph.css` (`.qv-graph :not(svg)`) | Style pro Bild 480 ms → 3 ms (700 Knoten) |
| Layout im Web Worker ab 300 Knoten | `layout/layoutHost.ts`, `layoutWorker.ts`, `workerLayout.ts`, `createLayout.ts` | Schritte warten nicht mehr auf Bilder; Seite bleibt bedienbar |
| Kollision mit Gitter statt Quadtree (nur im Worker) | `layout/gridCollide.ts` | Schritt bei 1.500 Knoten 15,2 → 10,9 ms |
| Kanten als wenige SVG-Pfade ab 500 Kanten | `GraphLinkBundles.tsx`, `linkPaths.ts` | 6 Elemente statt tausender Linien mit Markern |
| Unsichtbares beim Aufbau auslassen | `writePositions.ts`, `zoomMath.ts` (`drawnArea`) | weniger Schreiben, Layout und Paint pro Bild |
| Endpositionen sofort zeichnen | `useLayout.ts` | „Zoom to fit“ und Label-Messung sehen den fertigen Graph |

Die Grenzen stehen in `layout/largeGraph.ts` (`workerNodes: 300`, `bundledLinks: 500`). Kleinere
Graphen laufen und sehen aus wie bisher (eine Schleife im Haupt-Thread, eine Linie pro Kante,
d3-Kollision).

**Worker im Einzelnen.**

- `layoutHost.ts` enthält die Logik ohne Worker-API (testbar): dieselbe Simulation
  (`createForceSimulation`) und dieselben Fluss-Regeln (`createFlowRules`) wie im Haupt-Thread.
- Takt: 240 Schritte pro Sekunde nach der Uhr, in Scheiben von höchstens 8 ms, damit Nachrichten
  (Ziehen, Stoppen) drankommen. Liegt die Simulation hinter der Uhr, rechnet sie ohne Pause
  weiter; Schritte werden nicht verworfen.
- Nachrichten Seite → Worker: `start` (Knoten mit Größe und ggf. Position/Pin, Kanten als
  Indexpaare, Fläche, Fluss-Regeln, `atRest`), `drag`, `dragEnd`, `halt`, `ack`.
- Nachrichten Worker → Seite: `tick` und `end`, jeweils mit den Positionen als `Float64Array`
  (x0, y0, x1, y1, …, als Transferable) und den Dauern der Schritte (für `qualivis.info()`).
- Gegendruck: Der Worker sendet erst wieder Positionen, wenn die Seite die letzten übernommen hat
  (`ack` im nächsten `requestAnimationFrame`), also höchstens eine Nachricht pro Bild. Gerechnet
  wird währenddessen weiter.
- Die Startpositionen (d3-Spirale) setzt die Seite sofort selbst, damit der Graph gezeichnet ist,
  bevor der Worker antwortet.
- Stoppen und Ziehen sind Nachrichten; ihre Wirkung zeigt sich einen Moment später. Ohne
  `Worker` (z. B. in den Tests mit jsdom) läuft auch ein großer Graph im Haupt-Thread.
- Der Worker-Chunk ist 18 kB groß; aus `@qualivis/core` kommt nur `graphSettings` hinein.

**Gebündelte Kanten im Einzelnen.**

- Sechs Pfade in zwei Gruppen: je Gruppe durchgezogene Linien, gestrichelte Linien
  (Vererbung, `4 2`) und Pfeilspitzen. Die zweite Gruppe nimmt die Kanten auf, die beim Fading
  verblassen (Gruppen-Deckkraft 0,1 mit derselben Überblendung wie die Einzellinien). Nach dem
  Fading bleiben sie in ihrer Gruppe, damit sie zurückblenden statt zu springen.
- Die Pfeilspitze ist geometrisch der Marker: Dreieck (0, −5), (10, 0), (0, 5) in einem 10er
  Raster, 8 Linienbreiten groß, Punkt (9, 0) auf dem Linienende. Im Pixelvergleich liegen Linien
  und Spitzen deckungsgleich mit den Einzellinien.
- Die Spitzen folgen der Linienbreite, die das Zoomen setzt (Zielwert; sie blenden nicht mit dem
  100-ms-Übergang des Mausrads).
- `writePositions` findet den Schreiber der gebündelten Ebene über `linkWriters` (WeakMap am
  `g.links`-Element) und schreibt pro Bild nur die `d`-Attribute.
- **Sichtbare Abweichung:** Linien eines gemeinsamen Pfads werden an Kreuzungen nicht dunkler
  (ein Pfad wird als eine Fläche mit einer Deckkraft gezeichnet). Dichte Bereiche wirken etwas
  heller. Noch kein ADR-011-Eintrag.

**Ausschnittsfilter im Einzelnen.**

- Nur während ein Layout eines großen Graphen läuft. Gezeichnet wird der sichtbare Teil plus
  300 Graph-Einheiten Rand (für Knotenradius und Label).
- Knoten außerhalb bekommen `display: none` und werden nicht bewegt; gebündelte Kanten, deren
  beide Enden auf derselben Seite außerhalb liegen, werden ausgelassen.
- Am Ende des Layouts (auch nach Ziehen oder Stoppen) wird alles ohne Filter geschrieben. In Ruhe
  bewegen Verschieben und Zoomen weiter den ganzen gezeichneten Graph.
- Ein räumlicher Index lohnt hier nicht: Während des Layouts ändern sich alle Positionen in jedem
  Bild, ein Vergleich pro Knoten ist billiger als der Neuaufbau eines Index.

### A5. Ergebnis

Zeit vom Start des Layouts bis zur Ruhe:

| Graph | vorher | nur CSS-Korrektur | jetzt | Bildabstand jetzt |
|---|---|---|---|---|
| 700 Knoten, 2.089 Kanten | 142 s | 8,1 s | 1,4 s | 33 ms |
| 1.000 Knoten, 3.017 Kanten | nicht gemessen | nicht gemessen | 1,7 s | 33 ms |
| 1.500 Knoten, 4.517 Kanten | über 5 min (abgebrochen) | 35 s | 3,0 s | 33 ms |
| 1.500 Knoten als Kette | nicht gemessen | nicht gemessen | 1,7 s | 17 ms |

### A6. Erwogen und verworfen oder zurückgestellt

- **Eigener React-Reconciler:** bringt nichts. React ist beim Aufbau schon nicht beteiligt; ein
  Reconciler ist nur die Brücke zu einem anderen Zeichenziel.
- **Canvas während des Aufbaus, danach SVG:** voraussichtlich wenige ms pro Bild, aber Kreise,
  Kanten, Pfeile und Text müssten doppelt und pixelgleich gezeichnet werden. Im Messaufbau ohne
  Grafikkarte nicht fair messbar. Zurückgestellt; mit Bündelung und Filter derzeit nicht nötig.
- **WebGL (PixiJS, sigma.js):** reicht für Zehntausende Knoten, stellt aber gleiches Aussehen und
  DOM-basierte Tests grundsätzlich in Frage. Erst ab etwa 5.000 Knoten als Ziel sinnvoll.
- **Vereinfachung beim Herauszoomen (Details weglassen):** betrifft die Ruhe, die schnell genug
  ist; würde das Aussehen ändern. Zurückgestellt.
- **Abstoßung (Barnes-Hut) selbst schreiben:** etwa 100 Zeilen für etwa doppelte Geschwindigkeit
  des Schritts. Erst ab 2.000+ Knoten.
- **Takt im Haupt-Thread ändern:** entfällt, weil große Graphen im Worker laufen und kleine das
  Budget nicht ausschöpfen.

### A7. Offen

- Vor dem Graph steht die Seite bei 1.500 Dateien einmal etwa 20 s; vermutlich die Analyse im
  Haupt-Thread (P08-S04), nicht geprüft.
- ADR-011-Eintrag für die Abweichung der gebündelten Kanten.
- Die Layout-Positionen großer Graphen sind wegen der anderen Paar-Reihenfolge der
  Gitter-Kollision nicht ziffergleich zu d3; die Regel ist dieselbe.

---

## B. Der Graph fiel beim Halten eines Knotens

### B1. Beobachtung

Im Fluss-Layout („Vertical flow layout“, Standard) sank der ganze Graph nach unten, solange ein
Knoten zum Ziehen gehalten wurde, und kam nach dem Loslassen wieder hoch. Nachgestellt mit 700
Knoten: Schwerpunkt in Ruhe y = 468, beim Halten 531, danach wieder 468. Dasselbe passierte,
schwächer sichtbar, während des ersten Aufbaus.

### B2. Ursache

Zwei Dinge zusammen, beide nur im Fluss-Layout wirksam:

**1. Die Kanten-Kraft von d3 erhält den Impuls nicht.** `forceLink` verteilt den Zug einer Kante
nach der Zahl der Kanten ihrer Enden: `bias = Kanten(Quelle) / (Kanten(Quelle) + Kanten(Ziel))`,
das Ziel bekommt den Anteil `bias`, die Quelle `1 − bias`. Das Ende mit weniger Kanten bewegt
sich stärker; die beiden Züge heben sich nur bei `bias = 0,5` auf. Im freien Kraft-Layout zeigen
die Kanten in alle Richtungen, der Rest mittelt sich weg. Im Fluss-Layout zeigt **jede** Kante
nach unten und ist gedehnt (die Regeln erzwingen mindestens 100 Abstand, oft viel mehr), und
Ziele haben in Abhängigkeitsgraphen meist mehr Kanten als Quellen (gemeinsam genutzte
Komponenten). In Summe schieben die Kanten den ganzen Graph nach unten, umso stärker, je heißer
das Layout ist (alpha). Ohne Zentrierkraft fiel der Graph im Test mit 41 Einheiten pro Schritt
unbegrenzt; mit `forceCenter` (das die Positionen jedes Mal zurückschiebt) blieb ein Versatz in
Höhe dieser Geschwindigkeit. Beim Ziehen hält `alphaTarget = 0,3` das Layout dauerhaft heiß,
deshalb „fiel“ der Graph, solange gehalten wurde.

**2. Die Fluss-Regeln nahmen nur dem Ziel die Geschwindigkeit.** Der letzte Durchgang schob Ziele
nach unten und setzte deren `vy` auf 0. Die Quelle behielt ihre Geschwindigkeit zum Ziel hin. Auch
das ergibt in Summe Schwung nach unten (23 Einheiten pro Schritt im Test, wenn nur Punkt 1
behoben ist).

### B3. Behebung

- `forceLayout.ts`, Kraft `drift` (nur im Fluss-Layout, nach den anderen Kräften): zieht in jedem
  Schritt die gemeinsame Geschwindigkeit aller freien Knoten entlang y ab. Das freie Kraft-Layout
  bleibt unverändert.
- `flow.ts`:
  - Wo eine Regel zwei Knoten auseinanderschiebt, bewegen sich beide danach mit ihrer gemeinsamen
    Geschwindigkeit weiter (`stopClosing`), statt dass nur einer anhält; ein festgehaltener Knoten
    steht.
  - Die Regeln verschieben den Graph als Ganzes nicht mehr (`keepCentre`): Die mittlere
    Verschiebung der freien Knoten wird zurückgenommen, danach stellt ein weiterer Durchgang die
    Regeln exakt her.
  - Knoten **über** einem gehaltenen Knoten werden exakt nach oben geschoben (rückwärts durch die
    Kanten), weil ein gehaltenes Ziel nicht nach unten ausweichen kann. Vorher blieb dort ein
    Rest von 12,5 % der Verletzung.
- Ergebnis im selben Test: Schwerpunkt in Ruhe 468, beim Halten 468, danach 468. Nebenwirkung:
  Das Layout wird etwas kompakter (Höhe im Test 3.400 statt 3.900 Einheiten).

---

## C. Besserer Aufbau: Zusammengehöriges näher zusammen

### C1. Befund am Bild

An einem echten Projekt mit einigen hundert Komponenten zeigt das fertige Layout:

- einen dichten Kern, in dem sich sehr viele Kanten kreuzen,
- Gruppen weit außerhalb (oben links, oben rechts), die über wenige, sehr lange Kanten am Kern
  hängen,
- einzelne lange, fast senkrechte Ketten zwischen einer Gruppe und dem Kern,
- kleine Gruppen ohne Verbindung zum Rest weit abseits,
- insgesamt viel leere Fläche; „Zoom to fit“ zeigt deshalb alles sehr klein.

Wunsch: Was zusammenhängt, soll nah beieinander liegen. Idee: vor dem Aufbau eine Struktur
vorberechnen oder beim Aufbau Regeln ergänzen.

### C2. Warum das heutige Layout so aussieht

Das Layout ist d3-force mit den Altwerten plus Fluss-Regeln (`forceLayout.ts`, `flow.ts`):

| Baustein | Einstellung | Folge |
|---|---|---|
| Startpositionen | d3-Spirale (Phyllotaxis) in Reihenfolge der Knoten, Radius 10·√i | Start ohne Bezug zur Struktur; Nachbarn im Graph starten irgendwo |
| Kanten-Kraft | Länge 100, Stärke 1 / min(Kanten der Enden) | Kanten an viel genutzten Komponenten ziehen schwach |
| Abstoßung | −200 je Knoten (Fluss-Layout), ohne Reichweitengrenze (`distanceMax` unendlich) | ein großer Kern stößt alles weit weg, auch über große Entfernung |
| Zentrierung | `forceCenter` verschiebt nur den Schwerpunkt | **keine** Anziehung zur Mitte; lose und unverbundene Gruppen wandern nach außen |
| Kollision | Radius = halbe Breite × 1,2 | verhindert Überlappung, ordnet nicht |
| Abkühlung | 300 Schritte, alpha 1 → 0,001 | für große Graphen wenig Zeit, sich zu entwirren |
| Fluss-Regel | jede Kante außerhalb eines Zyklus zeigt mindestens 100 nach unten | harte Untergrenze, **keine** Obergrenze: Kanten können beliebig lang werden |

Daraus folgen die Beobachtungen:

1. **Weit entfernte Gruppen.** Eine Gruppe, die über zwei, drei Kanten am Kern hängt, wird von
   hunderten Kernknoten abgestoßen (jede Abstoßung fällt nur mit 1/Abstand) und nur von wenigen
   Federn gehalten. Das Gleichgewicht liegt weit draußen.
2. **Lange senkrechte Ketten.** Die Fluss-Regel stapelt: Ein Knoten liegt mindestens
   100 × (längster Weg zu ihm) unter seiner obersten Quelle. Wer tief in der Abhängigkeitskette
   steht, liegt weit unten; wer nur einen flachen Zweig hat, kann oben bleiben. Kanten, die
   mehrere Ebenen überspringen, werden entsprechend lang.
3. **Unverbundene Gruppen abseits.** Nichts zieht sie heran; die Abstoßung schiebt sie weg, bis
   die Kraft klein genug ist.
4. **Verknäuelter Kern.** Ein Kraft-Layout findet nur ein lokales Minimum. Bei zufälligem Start
   und kurzer Abkühlung bleiben Knoten auf der „falschen Seite“ hängen; das ergibt Kreuzungen und
   lange Kanten im Kern.
5. **Kein Begriff von Gruppen.** Ordner, Pakete oder dicht verbundene Mengen kommen im Layout
   nicht vor. Nähe entsteht nur über einzelne Kanten.

Das sind aus dem Code abgeleitete Erklärungen. An dem gezeigten Projekt selbst sind sie nicht
nachgemessen (siehe C6).

### C3. Was die Literatur kennt

Das Problem heißt Graphzeichnen (Graph Drawing). Für „Verbundenes soll nah liegen“ gibt es
mehrere etablierte Familien. Die Angaben stehen unter [Literatur](#literatur).

#### C3.1 Kräftebasierte Verfahren (Spring Embedder)

Knoten stoßen sich ab, Kanten ziehen zusammen; gesucht ist ein Gleichgewicht.

- **Eades (1984)**, **Fruchterman und Reingold (1991)**: die Grundform. d3-force ist eine
  Variante davon (Geschwindigkeits-Verlet, Abkühlung über alpha).
- **Barnes und Hut (1986)**: Näherung der Abstoßung über einen Quadtree in O(n log n); d3 nutzt
  sie in `forceManyBody`.
- Schwäche: lokale Minima, abhängig von Startpositionen; bei großen Graphen ohne Hilfen
  „Haarknäuel“. Genau das sieht man im Bild.

Verbesserungen innerhalb dieser Familie:

- **Schwerkraft:** eine schwache Kraft zur Mitte hält lose Teile zusammen (in ForceAtlas2
  Standard, in d3 `forceX`/`forceY`).
- **Gradabhängige Abstoßung (ForceAtlas2, Jacomy u. a. 2014):** Abstoßung proportional zum
  Produkt aus (Grad + 1) beider Knoten. Blätter bleiben nah an ihrem Nachbarn, Knoten mit vielen Kanten schaffen sich Platz.
- **LinLog-Energiemodell (Noack 2007):** Anziehung wächst nur logarithmisch mit dem Abstand.
  Dadurch treten dicht verbundene Gruppen als räumliche Gruppen hervor. Noack (2009) zeigt, dass
  das Minimieren dieser Energie dem Maximieren der Modularität (Gruppenerkennung) entspricht.
- **Begrenzte Reichweite der Abstoßung:** entfernt den Ferndruck großer Kerne und beschleunigt
  die Rechnung.

#### C3.2 Mehrstufige Verfahren (Multilevel)

Die direkte Antwort auf „vorher eine Struktur berechnen“:

1. **Vergröbern:** Knoten paarweise oder gruppenweise zusammenfassen, bis nur noch wenige
   übrig sind (Kette immer kleinerer Graphen).
2. **Gröbsten Graph layouten:** klein, daher leicht und nahezu frei von schlechten Minima.
3. **Verfeinern:** Stufe für Stufe wieder aufklappen; jeder Knoten startet beim Platz seines
   Stellvertreters, danach wenige Kraft-Schritte.

So steht die Großstruktur zuerst, und das Kraft-Layout muss nur noch lokal ordnen.

- **Walshaw (2000/2003):** mehrstufiges Kraft-Layout über paarweises Zusammenfassen.
- **GRIP (Gajer, Goodrich, Kobourov 2000/2004):** Stufen über weit auseinanderliegende
  Knotenmengen.
- **FM³ (Hachul und Jünger 2004):** „Sonnensystem“-Vergröberung plus Multipol-Näherung; gilt als
  eines der besten Verfahren für große allgemeine Graphen.
- **sfdp (Hu 2005):** mehrstufig plus Barnes-Hut, in Graphviz enthalten.
- **TopoLayout (Archambault, Munzner, Auber 2007):** zerlegt nach topologischen Merkmalen
  (Bäume, Cliquen, zweifach zusammenhängende Teile) und layoutet jedes Teil passend.

#### C3.3 Verfahren über Graph-Abstände (Stress, MDS)

Ziel: Der Abstand im Bild soll dem Abstand im Graph (Länge des kürzesten Wegs) entsprechen.
Das trifft den Wunsch „Verbundenes nah“ am direktesten und gibt die beste Gesamtstruktur.

- **Kamada und Kawai (1989):** Federn zwischen **allen** Paaren mit Ruhelänge = Graph-Abstand.
- **Stress-Majorisierung (Gansner, Koren, North 2004):** dasselbe Ziel, robustes Verfahren mit
  garantiert fallendem Fehler.
- **Stochastischer Gradientenabstieg (Zheng, Pawar, Goodman 2019):** sehr einfache Schleife über
  Knotenpaare, konvergiert schneller und verlässlicher als Majorisierung, kaum abhängig vom
  Start.
- **Sparse Stress (Ortmann, Klimenta, Brandes 2017)** und **PivotMDS (Brandes und Pich 2006)**:
  nur Abstände zu wenigen Pivot-Knoten, damit O(k·n) statt O(n²). PivotMDS und die verwandte
  **Einbettung in hohe Dimensionen (Harel und Koren 2002)** eignen sich besonders als
  **Startlayout**: in Millisekunden eine grobe, aber global richtige Anordnung.
- Kosten: alle kürzesten Wege sind O(n·m) (Breitensuche je Knoten), bei 1.500 Knoten und 4.500
  Kanten gut machbar; der volle Stress hat n² Terme (1.500² ≈ 2,2 Mio. Paare pro Durchgang).

Mit Nebenbedingungen:

- **DiG-CoLa (Dwyer und Koren 2005):** Stress-Majorisierung mit der Bedingung „Kanten zeigen
  nach unten“. Genau die Aufgabe des Fluss-Layouts.
- **IPSep-CoLa (Dwyer, Koren, Marriott 2006)** und **Dwyer (2009)**: allgemeine
  Abstandsbedingungen, Grundlage von WebCola. Das Altsystem nutzte WebCola mit `flowLayout`,
  also dieses Verfahren. Es wurde ersetzt, weil die Umsetzung für große Graphen zu langsam war
  (etwa 70 ms pro Schritt, 3 s Startzeit, selten Ruhe), nicht weil das Verfahren schlecht ordnet.

#### C3.4 Geschichtete Verfahren (Sugiyama)

Für gerichtete Graphen mit „Fluss“ das Standardverfahren (Graphviz `dot`):

1. **Zyklen brechen:** einige Kanten umdrehen (z. B. Heuristik von Eades, Lin, Smyth 1993).
2. **Ebenen zuweisen:** längster Weg (einfach, macht lange Kanten), Coffman–Graham (begrenzte
   Breite) oder **Netzwerk-Simplex (Gansner, Koutsofios, North, Vo 1993)**, das die
   **Summe der Kantenlängen minimiert**.
3. **Kreuzungen verringern:** Reihenfolge in jeder Ebene über Schwerpunkt- oder
   Median-Heuristik, mehrfach von oben nach unten und zurück.
4. **x-Koordinaten:** z. B. **Brandes und Köpf (2001)**, kompakt und mit geraden langen Kanten.
5. Lange Kanten laufen über Hilfsknoten in den Zwischenebenen.

Ursprung: **Sugiyama, Tagawa, Toda (1981)**. Überblick: Healy und Nikolov (2013).

Bezug zum heutigen Stand: Die Fluss-Regeln entsprechen Schritt 2 in der einfachsten Form
(nur Untergrenzen, wie „längster Weg“), ohne Schritt 3 und 4. Die langen senkrechten Ketten im
Bild sind die bekannte Schwäche dieser Ebenenwahl; Netzwerk-Simplex behebt genau das.

Schwächen des reinen Sugiyama-Layouts: breite Ebenen bei breiten Graphen (ungünstiges
Seitenverhältnis), keine Rücksicht auf Gruppen (außer in Erweiterungen wie ELK mit
Hierarchie), die Rechnung ist ein Stück (keine Animation des Entstehens), Ziehen eines Knotens
hat keine natürliche Antwort.

#### C3.5 Gruppen erkennen und nutzen

- **Louvain (Blondel u. a. 2008)**, **Leiden (Traag, Waltman, van Eck 2019)**: finden dicht
  verbundene Gruppen über Modularität, schnell auch bei großen Graphen. `@qualivis/core` enthält
  Louvain bereits (`jlouvain`, für die Cluster-Farben der Komponentenansicht).
- **Vorgegebene Gruppen:** Ordner, Pakete, Workspace-Pakete. In einem Code-Werkzeug sind sie die
  natürlichste Gruppierung, und der Dateibaum zeigt sie ohnehin.
- **Verbundgraphen (Compound Layout):** Gruppen als Behälter, die ihre Mitglieder zusammenhalten:
  **CoSE (Dogrusoz u. a. 2009)**, **fCoSE (Balci und Dogrusoz 2022)**.
- **Group-in-a-Box (Rodrigues u. a. 2011):** jede Gruppe bekommt ein Rechteck (Treemap), innen
  eigenes Layout.
- Als Kraft: jede Gruppe zieht ihre Mitglieder zu ihrem Schwerpunkt; oder das mehrstufige
  Verfahren nimmt die Gruppen als erste Vergröberungsstufe.

#### C3.6 Weniger zeichnen statt anders platzieren

- **Transitive Reduktion (Aho, Garey, Ullman 1972):** Kanten weglassen, die durch einen Weg
  schon gegeben sind (A → C, wenn es A → B → C gibt). Bei Abhängigkeitsgraphen fällt oft ein
  großer Teil der Kanten weg, und gerade die langen.
- **Kantenbündelung:** hierarchisch (Holten 2006) oder kräftebasiert (Holten und van Wijk 2009);
  Kanten mit ähnlichem Verlauf laufen als Strang.
- **Zusammenfassen:** Ordner als ein Knoten, aufklappbar (semantisches Zoomen). Passt zur Idee
  „bei wenig Zoom Details weglassen“.
- **Unverbundene Teile einzeln layouten und packen:** Freivalds, Dogrusoz, Kikusts (2002);
  einfacher: nach Größe sortieren und in Reihen legen.

#### C3.7 Woran man ein gutes Bild erkennt

Untersuchungen zur Lesbarkeit (Purchase 1997, 2002): Am stärksten schaden Kreuzungen; dazu
zählen kurze und gleichmäßige Kanten, keine Überlappung, Symmetrie, und bei gerichteten Graphen
ein einheitlicher Fluss. Lehrbuch: Di Battista, Eades, Tamassia, Tollis (1999); Handbuch:
Tamassia (2013), darin Kobourov zu Kräfteverfahren.

### C4. Möglichkeiten für Qualivis

Jede Möglichkeit mit: Idee, Umsetzung im heutigen Code, erwartete Wirkung, Aufwand, Risiko.
Die Wirkungen sind Einschätzungen aus Literatur und Code, **nicht gemessen**.

#### M1. Schwerkraft und begrenzte Abstoßung

- **Idee:** schwache Anziehung zur Mitte, Abstoßung nur bis zu einer Reichweite.
- **Umsetzung:** in `createForceSimulation` `forceX(width/2)` und `forceY(height/2)` mit kleiner
  Stärke (Größenordnung 0,02 bis 0,05) ergänzen; `forceManyBody().distanceMax(…)`
  (Größenordnung 600 bis 1.000).
- **Wirkung:** Außengruppen und unverbundene Teile rücken heran, weniger leere Fläche. Die
  Abstoßung wird nebenbei schneller. Ordnet den Kern nicht.
- **Aufwand:** klein (wenige Zeilen plus Tests). **Risiko:** gering; zu starke Schwerkraft
  drückt den Kern zusammen. Die Fluss-Regeln gelten weiter.

#### M2. Kanten ziehen stärker und wollen kurz sein

- **Idee:** Kanten an viel genutzten Komponenten nicht fast kraftlos lassen; lange Kanten
  stärker verkürzen.
- **Umsetzung:** `forceLink().strength(…)` mit fester oder weniger stark gedämpfter Stärke
  (z. B. 1/√min statt 1/min). Zusätzlich eine eigene Kraft nur entlang y, die jede Kante auf
  ihre Mindestlänge 100 zieht („Ebenen verdichten“).
- **Wirkung:** kürzere Kanten, weniger hohe Stapel. Zu stark ergibt Klumpen um Knoten mit vielen
  Kanten.
- **Aufwand:** klein. **Risiko:** mittel (Abstimmung nötig; d3 empfiehlt Stärken zwischen 0
  und 1, darüber wird die Simulation instabil).

#### M3. Strukturierter Start statt Spirale

- **Idee:** Das Kraft-Layout beginnt mit einer Anordnung, die die Struktur schon kennt, und
  verfeinert nur noch. Das ist die „vorberechnete Struktur“ in der einfachsten Form.
- **Varianten für den Start:**
  - **a) Ebenen:** y = Ebene × 100 (Ebene über längsten Weg; die Reihenfolge dafür liefert
    `flow.ts` schon, Tarjan nummeriert die Komponenten topologisch). x über einige
    Schwerpunkt-Durchgänge (jeder Knoten zum Mittel seiner Nachbarn der Nachbarebene).
  - **b) PivotMDS / hohe Dimension:** etwa 50 Breitensuchen, kleine Eigenwertaufgabe; grob, aber
    global richtig.
  - **c) Gruppenweise:** Gruppen (M5) als Punkte vorlayouten, Mitglieder um ihren Gruppenpunkt
    legen.
- **Umsetzung:** vor `forceSimulation` x/y setzen (d3 behält vorhandene Positionen; derselbe Weg
  wie beim Wiederherstellen einer Ansicht). Start mit kleinerem alpha (z. B. 0,3), damit die
  Vorarbeit nicht zerstört wird.
- **Wirkung:** deutlich weniger Verknäuelung, kürzerer Aufbau (weniger Schritte nötig), die
  Animation zeigt Ordnen statt Explosion.
- **Aufwand:** a) klein bis mittel, b) mittel, c) mittel. **Risiko:** gering; die Engine bleibt.

#### M4. Mehrstufiges Layout

- **Idee:** C3.2. Erst den vergröberten Graph layouten, dann verfeinern.
- **Umsetzung:** im Worker: Vergröbern über paarweises Zusammenfassen benachbarter Knoten
  (oder Gruppen aus M5 als gröbste Stufe), pro Stufe einige Dutzend Schritte derselben
  Simulation, Knoten der nächsten Stufe starten am Platz ihres Stellvertreters mit kleinem
  Versatz. Die Fluss-Regeln gelten auf jeder Stufe (Kanten zwischen Stellvertretern).
- **Wirkung:** beste Gesamtstruktur innerhalb der Kräfte-Familie; skaliert gut.
- **Aufwand:** mittel bis groß (etwa 200 bis 300 Zeilen, eigene Tests). **Risiko:** mittel;
  Vergröberung gerichteter Graphen kann Zyklen zwischen Stellvertretern erzeugen (die Regeln
  lassen Zyklen aus, das fängt es ab).

#### M5. Gruppen als Kraft

- **Idee:** Mitglieder einer Gruppe ziehen sich zusammen.
- **Gruppenquelle:** Ordner (aus der Knoten-ID ableitbar, sie beginnt mit dem Dateipfad),
  Workspace-Paket, oder Louvain auf dem App-Graph (`computeClusters` gibt es für die
  Komponentenansicht).
- **Umsetzung:** eigene Kraft: je Gruppe Schwerpunkt berechnen, jedes Mitglied mit kleiner Stärke
  dorthin ziehen. Optional Abstoßung zwischen Gruppen-Schwerpunkten. Optional die Gruppe als
  Hülle oder Farbe zeigen (das wäre eine sichtbare Neuerung).
- **Wirkung:** Zusammengehöriges liegt beieinander, auch ohne direkte Kante. Das Bild bekommt
  wiedererkennbare Bereiche.
- **Aufwand:** mittel. **Risiko:** mittel: Ordner und Abhängigkeiten können sich widersprechen;
  dann zieht die Gruppen-Kraft Kanten lang. Mit Louvain statt Ordnern passiert das seltener,
  dafür sind die Gruppen für den Nutzer weniger greifbar.

#### M6. Ebenen über Netzwerk-Simplex statt nur Untergrenzen

- **Idee:** Ebenen so wählen, dass die Summe der Kantenlängen minimal ist (C3.4, Schritt 2),
  und die Ebene als Ziel-y vorgeben.
- **Umsetzung:** Ebenen einmal vor dem Start berechnen (Netzwerk-Simplex oder die einfachere
  Näherung: längster Weg, dann Knoten mit mehr ausgehenden als eingehenden Kanten so weit wie
  möglich nach unten schieben und umgekehrt, bis nichts mehr besser wird). Dann `forceY` je
  Knoten auf `Ebene × 100` oder harte Ebenen.
- **Wirkung:** beseitigt die langen senkrechten Ketten gezielt; das Bild wird flacher.
- **Aufwand:** mittel (Netzwerk-Simplex selbst etwa 300 Zeilen; die Näherung etwa 60).
  **Risiko:** gering bis mittel; mit harten Ebenen sieht das Bild „gerastert“ aus, mit weicher
  Kraft bleibt es organisch.

#### M7. Vollständiges Schichtlayout als Alternative

- **Idee:** für die App-Ansicht ein echtes Sugiyama-Layout aus einer Bibliothek.
- **Kandidaten** (Lizenz und Pflegezustand vor einer Entscheidung prüfen):
  - **ELK** (`elkjs`, Eclipse Layout Kernel, Algorithmus „layered“): sehr vollständig,
    Hierarchie/Gruppen, läuft im Web Worker; großes Paket.
  - **dagre:** klein und verbreitet, einfacher, weniger Einstellungen.
  - **d3-dag:** Sugiyama und weitere Verfahren für azyklische Graphen.
  - **Graphviz `dot` als WebAssembly:** Referenzqualität; großes Paket.
- **Umsetzung:** neue Engine hinter `LayoutEngine` im Worker; liefert einmal Positionen
  (optional vom Start dorthin animieren). Ziehen: Knoten frei verschiebbar ohne Simulation, oder
  danach Kraft-Layout mit schwacher Bindung an die berechneten Plätze.
- **Wirkung:** klarster Fluss, wenige Kreuzungen, reproduzierbar. Bei sehr breiten Graphen
  breite Ebenen.
- **Aufwand:** mittel (Anbindung) plus neue Abhängigkeit. **Risiko:** hoch für die Parität: Das
  Bild sieht grundsätzlich anders aus als im Altsystem, und Ziehen verhält sich anders. Eher als
  wählbare zusätzliche Layout-Art.

#### M8. Stress-Layout mit Fluss-Bedingung

- **Idee:** C3.3. Abstände im Bild = Abstände im Graph, dazu „Kanten zeigen nach unten“. Das ist,
  was WebCola im Altsystem tat, nur effizient umgesetzt.
- **Umsetzung:** im Worker: kürzeste Wege (Breitensuche je Knoten oder nur von Pivots),
  stochastischer Gradientenabstieg über Knotenpaare, danach bzw. zwischendurch die vorhandenen
  Fluss-Regeln als Projektion; Kollision am Ende über die vorhandene Kraft.
- **Wirkung:** beste Abbildung von „nah im Graph = nah im Bild“, wenig abhängig vom Start.
- **Aufwand:** groß (neue Engine, eigene Abkühlung, Ziehen neu durchdenken). **Risiko:** mittel
  bis hoch; unverbundene Teile brauchen Sonderbehandlung (Abstand unendlich).

#### M9. Weniger Kanten und Zusammenfassen

- **Transitive Reduktion** als Schalter („nur direkte Abhängigkeiten“): weniger und kürzere
  Kanten; ändert, was gezeigt wird, also eine fachliche Entscheidung.
- **Ordner als Knoten**, aufklappbar: macht große Projekte überhaupt erst überschaubar; größter
  Eingriff in Bedienung und Parität.
- **Kantenbündelung:** schöner, aber teuer und für das Verfolgen einzelner Abhängigkeiten
  nachteilig.
- **Unverbundene Teile packen:** jedes Teil einzeln layouten, dann nebeneinander legen. Klein,
  behebt die abseits liegenden Inseln sicher.

### C5. Vergleich und Empfehlung

| | Wirkung auf „Verbundenes nah“ | Aufwand | Risiko Parität | Rechenzeit | Engine bleibt |
|---|---|---|---|---|---|
| M1 Schwerkraft, Reichweite | mittel (Außengruppen) | klein | gering | sinkt | ja |
| M2 Kantenstärke, y-Verdichtung | mittel | klein | gering | gleich | ja |
| M3 strukturierter Start | hoch | klein bis mittel | gering | sinkt | ja |
| M4 mehrstufig | hoch | mittel bis groß | gering | etwa gleich | ja |
| M5 Gruppen-Kraft | hoch (auch ohne Kante) | mittel | mittel | gleich | ja |
| M6 Ebenen minimaler Länge | hoch (lange Ketten) | mittel | gering bis mittel | einmalig | ja |
| M7 Schichtlayout (Bibliothek) | sehr hoch (Fluss) | mittel + Abhängigkeit | hoch | einmalig, Sekunden | nein |
| M8 Stress mit Fluss | sehr hoch | groß | mittel bis hoch | höher | nein |
| M9 Reduktion, Zusammenfassen, Packen | hoch (Übersicht) | klein bis groß | mittel bis hoch | sinkt | ja |

**Empfohlene Reihenfolge**, jeweils messen (C6) und erst dann weitergehen:

1. **M1 + Packen unverbundener Teile (aus M9).** Klein, behebt die leere Fläche und die Inseln.
2. **M3a (Start in Ebenen mit Schwerpunkt-Reihenfolge) + M6 in der Näherung.** Das ist die
   „vorberechnete Struktur“: Ebenen kurz halten, innerhalb der Ebenen nach Nachbarn ordnen, das
   Kraft-Layout verfeinert. Greift die beiden Hauptursachen an (lange Ketten, verknäuelter Kern).
3. **M5 mit Ordnern** als Schalter, falls nach 1 und 2 Zusammengehöriges ohne direkte Kante noch
   zu weit auseinander liegt.
4. **M4**, wenn Graphen mit mehreren tausend Knoten Ziel werden.
5. **M7** als zusätzliche Layout-Art, wenn ein streng geschichtetes Bild gewünscht ist.

M8 ist die „richtige“ Lösung im Sinne der Literatur für das Fluss-Layout, aber der größte Umbau;
erst sinnvoll, wenn 1 bis 3 nicht reichen.

Für alle gilt: Wie bei den Maßnahmen aus Teil A können die Änderungen auf große Graphen
(`largeGraph`) beschränkt werden, damit kleine Graphen wie im Altsystem aussehen. Ob auch kleine
Graphen profitieren sollen, ist eine Entscheidung zur Parität (ADR).

### C6. Wie man die Güte misst

Ohne Messung bleibt „besser“ Geschmack. Vorschlag für Kennzahlen, alle aus Positionen und Kanten
berechenbar:

| Kennzahl | Bedeutung | Ziel |
|---|---|---|
| mittlere und mediane Kantenlänge, 95. Perzentil | Nähe verbundener Knoten | kleiner |
| Anteil Kanten länger als das Dreifache der Solllänge | lange Ausreißer | kleiner |
| Zahl der Kantenkreuzungen | Lesbarkeit | kleiner |
| Fläche der Hülle und Seitenverhältnis | Platzbedarf, Zoom bei „fit“ | kleiner, näher am Fenster |
| Stress (Bildabstand gegen Graph-Abstand) | Gesamtstruktur | kleiner |
| Nachbarschaftstreue (Anteil der k nächsten im Bild, die auch im Graph nah sind) | lokale Struktur | größer |
| Streuung je Gruppe (Ordner) | Zusammenhalt der Gruppen | kleiner |
| Verletzungen der Fluss-Regel, Überlappungen | Pflicht | 0 |
| Schritte bis zur Ruhe, Zeit | Leistung | nicht schlechter |

Kreuzungen wurden für den Ersatz von WebCola schon einmal gezählt (README, S09); ein Werkzeug
dafür liegt nicht im Repo.

**Testgraphen.** Die erzeugten Projekte aus Teil A haben zufällige Kanten und damit **keine**
Gruppenstruktur; für die Güte des Layouts sind sie ungeeignet. Nötig sind echte Projekte.
`qualivis.info()` gibt bewusst nur Größen und Zeiten aus. Ein Zusatz, der den Graph **ohne
Namen** ausgibt (Knoten als Nummern, Kanten als Nummernpaare, je Knoten Größe und Ordner als
Nummer), würde echte Strukturen teilbar und Layouts reproduzierbar machen, ohne etwas über das
Projekt preiszugeben.

### C7. Offene Fragen

1. Gilt das neue Layout nur für große Graphen oder für alle (Parität zum Altsystem)?
2. Sollen Ordner im Graph sichtbar werden (Hülle, Farbe), oder nur die Platzierung beeinflussen?
3. Ist ein streng geschichtetes Bild (M7) als zusätzliche Layout-Art erwünscht?
4. Darf eine neue Abhängigkeit hinzukommen (M7), oder soll alles im eigenen Code bleiben?
5. Soll die Zahl der gezeigten Kanten wählbar sinken (transitive Reduktion)?
6. An welchen echten Projekten wird gemessen, und wie kommen deren Graphen anonym in die Tests?

---

## Literatur

Angaben vor dem Zitieren an der Quelle prüfen.

**Grundlagen und Überblick**

- Di Battista, G., Eades, P., Tamassia, R., Tollis, I. G. (1999). *Graph Drawing: Algorithms for
  the Visualization of Graphs.* Prentice Hall.
- Tamassia, R. (Hrsg.) (2013). *Handbook of Graph Drawing and Visualization.* CRC Press. Darin:
  Kobourov, S. G., „Force-Directed Drawing Algorithms“; Healy, P., Nikolov, N. S., „Hierarchical
  Drawing Algorithms“.
- Purchase, H. C. (1997). Which aesthetic has the greatest effect on human understanding?
  *Graph Drawing (GD ’97)*, LNCS 1353.
- Purchase, H. C. (2002). Metrics for graph drawing aesthetics. *Journal of Visual Languages and
  Computing* 13(5).

**Kräftebasierte Verfahren**

- Eades, P. (1984). A heuristic for graph drawing. *Congressus Numerantium* 42.
- Fruchterman, T. M. J., Reingold, E. M. (1991). Graph drawing by force-directed placement.
  *Software: Practice and Experience* 21(11).
- Barnes, J., Hut, P. (1986). A hierarchical O(N log N) force-calculation algorithm. *Nature* 324.
- Noack, A. (2007). Energy models for graph clustering. *Journal of Graph Algorithms and
  Applications* 11(2).
- Noack, A. (2009). Modularity clustering is force-directed layout. *Physical Review E* 79.
- Jacomy, M., Venturini, T., Heymann, S., Bastian, M. (2014). ForceAtlas2, a continuous graph
  layout algorithm for handy network visualization designed for the Gephi software. *PLoS ONE*
  9(6).

**Mehrstufige Verfahren**

- Walshaw, C. (2003). A multilevel algorithm for force-directed graph drawing. *Journal of Graph
  Algorithms and Applications* 7(3). (Zuerst GD 2000.)
- Gajer, P., Goodrich, M. T., Kobourov, S. G. (2004). A multi-dimensional approach to
  force-directed layouts of large graphs. *Computational Geometry* 29(1). (Zuerst GD 2000; GRIP.)
- Hachul, S., Jünger, M. (2004). Drawing large graphs with a potential-field-based multilevel
  algorithm. *Graph Drawing (GD 2004)*, LNCS 3383. (FM³.)
- Hu, Y. (2005). Efficient, high-quality force-directed graph drawing. *The Mathematica Journal*
  10(1). (sfdp.)
- Archambault, D., Munzner, T., Auber, D. (2007). TopoLayout: multilevel graph layout by
  topological features. *IEEE Transactions on Visualization and Computer Graphics* 13(2).

**Abstände, Stress, Einbettung**

- Kamada, T., Kawai, S. (1989). An algorithm for drawing general undirected graphs. *Information
  Processing Letters* 31(1).
- Gansner, E. R., Koren, Y., North, S. (2004). Graph drawing by stress majorization. *Graph
  Drawing (GD 2004)*, LNCS 3383.
- Harel, D., Koren, Y. (2002). Graph drawing by high-dimensional embedding. *Graph Drawing
  (GD 2002)*, LNCS 2528.
- Brandes, U., Pich, C. (2006). Eigensolver methods for progressive multidimensional scaling of
  large data. *Graph Drawing (GD 2006)*, LNCS 4372. (PivotMDS.)
- Ortmann, M., Klimenta, M., Brandes, U. (2017). A sparse stress model. *Journal of Graph
  Algorithms and Applications* 21(5).
- Zheng, J. X., Pawar, S., Goodman, D. F. M. (2019). Graph drawing by stochastic gradient
  descent. *IEEE Transactions on Visualization and Computer Graphics* 25(9).

**Layout mit Nebenbedingungen**

- Dwyer, T., Koren, Y. (2005). DiG-CoLa: directed graph layout through constrained energy
  minimization. *IEEE Symposium on Information Visualization (InfoVis 2005)*.
- Dwyer, T., Koren, Y., Marriott, K. (2006). IPSep-CoLa: an incremental procedure for separation
  constraint layout of graphs. *IEEE Transactions on Visualization and Computer Graphics* 12(5).
- Dwyer, T. (2009). Scalable, versatile and simple constrained graph layout. *Computer Graphics
  Forum* 28(3).

**Geschichtete Verfahren**

- Sugiyama, K., Tagawa, S., Toda, M. (1981). Methods for visual understanding of hierarchical
  system structures. *IEEE Transactions on Systems, Man, and Cybernetics* 11(2).
- Gansner, E. R., Koutsofios, E., North, S. C., Vo, K.-P. (1993). A technique for drawing
  directed graphs. *IEEE Transactions on Software Engineering* 19(3).
- Coffman, E. G., Graham, R. L. (1972). Optimal scheduling for two-processor systems. *Acta
  Informatica* 1.
- Eades, P., Lin, X., Smyth, W. F. (1993). A fast and effective heuristic for the feedback arc
  set problem. *Information Processing Letters* 47(6).
- Brandes, U., Köpf, B. (2001). Fast and simple horizontal coordinate assignment. *Graph Drawing
  (GD 2001)*, LNCS 2265.

**Gruppen**

- Blondel, V. D., Guillaume, J.-L., Lambiotte, R., Lefebvre, E. (2008). Fast unfolding of
  communities in large networks. *Journal of Statistical Mechanics* P10008. (Louvain.)
- Traag, V. A., Waltman, L., van Eck, N. J. (2019). From Louvain to Leiden: guaranteeing
  well-connected communities. *Scientific Reports* 9.
- Dogrusoz, U., Giral, E., Cetintas, A., Civril, A., Demir, E. (2009). A layout algorithm for
  undirected compound graphs. *Information Sciences* 179(7). (CoSE.)
- Balci, H., Dogrusoz, U. (2022). fCoSE: a fast compound graph layout algorithm with constraint
  support. *IEEE Transactions on Visualization and Computer Graphics* 28(12).
- Rodrigues, E. M., Milic-Frayling, N., Smith, M., Shneiderman, B., Hansen, D. (2011).
  Group-in-a-box layout for multi-faceted analysis of communities. *IEEE International Conference
  on Social Computing (SocialCom 2011)*.

**Kanten und Teile**

- Aho, A. V., Garey, M. R., Ullman, J. D. (1972). The transitive reduction of a directed graph.
  *SIAM Journal on Computing* 1(2).
- Holten, D. (2006). Hierarchical edge bundles: visualization of adjacency relations in
  hierarchical data. *IEEE Transactions on Visualization and Computer Graphics* 12(5).
- Holten, D., van Wijk, J. J. (2009). Force-directed edge bundling for graph visualization.
  *Computer Graphics Forum* 28(3).
- Freivalds, K., Dogrusoz, U., Kikusts, P. (2002). Disconnected graph layout and the polyomino
  packing approach. *Graph Drawing (GD 2001)*, LNCS 2265.
