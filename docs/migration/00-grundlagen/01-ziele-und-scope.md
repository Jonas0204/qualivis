# Ziele, Scope und Meilensteine

## 1. Ziel

Die Angular-9-App „Component Graph“ (Tarner, van den Bongard, Beck, VISSOFT 2021) wird als
**Qualivis** auf einen wartungsarmen Stack mit wenigen Abhängigkeiten umgeschrieben. Der Name
„Component Graph“ bleibt dort, wo er passt (die Graph-Ansicht selbst), siehe ADR-012.

- **React 19** nur für die Oberfläche, **kein** UI-Framework, **kein** D3-DOM-Code.
- Analyse-Kern als framework-freies TypeScript-Paket `@qualivis/core` (Node + Browser), später
  zusätzlich als CLI nutzbar (z. B. in der CI).
- **pnpm 12** mit gehärteter Lieferkette, Vite 8, Vitest 5, TypeScript 7, Biome 2.6, feste Versionen.
- Entwicklung auf **Windows und macOS** (Node 24).
- Das Repository ist **öffentlich** (GitHub-Fork), hat keine Lizenz und wird nicht als Paket
  veröffentlicht. CI ab P03-S00, die neue App ab M1 auf GitHub Pages (O2–O4, O14, ADR-016).

## 2. Was gleich bleiben muss

| Bereich | Anspruch | Nachweis |
|---|---|---|
| Analyse-Ergebnis (Report, FileMap, App-Graph) | inhaltlich gleich; Ziel ist Gleichheit (im Spike 0 Abweichungen) | Golden G1 |
| Halstead-Werte (Fließkommazahlen) | kleine Abweichungen sind in Ordnung, solange sie nicht ins Gewicht fallen (Toleranz siehe `06-teststrategie.md` §3) | G1 |
| Darstellungsregeln (Größe, Warnung, Icons, Cluster, Vorschaukreise) | gleich | Golden G2 |
| Aussehen (Farben, Formen, Texte, Legende, Panels) | gleich, sichtbar vergleichbar | Stil-Referenz + Sichtvergleich (G5) |
| Interaktionen | gleich (Funktionsinventar), außer bewussten Korrekturen (ADR-011) | Komponenten- und E2E-Tests |
| Graph-Anordnung | **darf abweichen** (Wunsch des Nutzers), WebCola bleibt aber Standard | – |

## 3. Nicht-Ziele

- Neue Analysefunktionen oder Metriken (erst nach Abschluss, als eigene Vorhaben).
- Mobile Optimierung über das Altsystem hinaus.
- Server-Komponente, Login, Datenübertragung: Die App bleibt rein clientseitig und offline-fähig.
- Babel 8 (eigene Phase nach dem MVP, Frist Juni 2027).
- Ersatz der alten Analysebibliotheken (escomplex, WebCola, jLouvain) durch Eigenbau (ADR-002).

## 4. MVP-Prinzip und Meilensteine

Jeder Meilenstein endet mit einer **lauffähigen App**, die man starten und ansehen kann. Später
kommende Teile werden nicht vorab „vorbereitet“, sondern dann gebaut, wenn sie dran sind (YAGNI).
Qualität (Tests, Typen, Lint) gilt **ab dem ersten Schritt**, nicht erst in der Härtungsphase.

| Meilenstein | Inhalt | Phasen | Sichtbar für den Nutzer |
|---|---|---|---|
| **M0 Fundament** | Repo umgebaut, Workspace, Tooling grün, Goldens erfasst | P01, P02 | `pnpm check` grün; Altsystem lokal startbar |
| **M1 Erstes Produkt** | Ordner hineinziehen → App-Graph sichtbar (Kreise, Labels, Pfeile, Kraft-Layout); Kern = Altsystem (G1) | P03, P04 | `pnpm dev` zeigt Graph von `mini`/`realworld` |
| **M2 Graph-Parität** | Größen, Icons, Vorschaukreise, Schraffur, Legende, WebCola, Zoom, Drag, Ausblenden, Labels | P05 | Graph sieht aus wie im Altsystem |
| **M3 Analyse-UI** | Panels (Dateibaum, Code-Quality, Quelltext), Auswahl, Drill-down, URL | P06 | volle Analyse-Oberfläche |
| **M4 Funktionsparität** | Einstellungen, Persistenz, Hinweise, Drop auf Graph | P07 | Altsystem vollständig ersetzt |
| **M5 Härtung** | strikte Typen, Worker, Fehlerbehandlung, A11y, Sicherheit, Performance | P08 | spürbar robuster, schneller |
| **M6 Parität E2E** | automatisierte Paritätstests gegen Altsystem | P09 | Vergleichsbericht |
| **M7 Kern als Paket + CLI** | `@qualivis/core` als Paket baubar (privat), `qualivis analyze` auf der Kommandozeile, Eigenprüfung | P10 | CLI-Ausgabe, `pnpm quality:self` |
| **M8 Abschluss** | Doku, Babel-8-Migration | P11 | – |

Reihenfolge ist verbindlich bis M4. Ab M5 können Phasen nach Absprache umsortiert werden.

## 5. Globale Definition of Done (gilt für jeden Schritt)

1. Alle Akzeptanzkriterien der Schritt-Karte erfüllt.
2. `pnpm check` grün (Biome, TypeScript, alle Tests inkl. Golden G1).
3. Neue Logik hat Tests, die **Verhalten** prüfen (siehe `06-teststrategie.md`).
4. Keine neuen Abhängigkeiten außerhalb des Catalogs ohne Zustimmung des Nutzers.
5. `STATUS.md` aktualisiert (Status, Datum, Kurznotiz, Abweichungen).
6. Commit-Vorschlag formuliert, nur auf Anweisung committet (Regel R3 im `README.md`).
