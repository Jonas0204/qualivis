# Ziele, Scope und Meilensteine

## 1. Ziel

Die Angular-9-App „Component Graph“ (Tarner, van den Bongard, Beck, VISSOFT 2021) wird als
**Qualivis** auf einen wartungsarmen Stack mit wenigen Abhängigkeiten umgeschrieben. Der Name
„Component Graph“ bleibt dort, wo er passt (die Graph-Ansicht selbst).

- **React 19** nur für die Oberfläche, **kein** UI-Framework, **kein** D3-DOM-Code.
- Analyse-Kern als framework-freies TypeScript-Paket `@qualivis/core` (Node + Browser), später
  zusätzlich als CLI nutzbar (z. B. in der CI).
- **pnpm 12** mit gehärteter Lieferkette, Vite 8, Vitest 5, TypeScript 7, Biome 2.6, feste Versionen.
- Entwicklung auf **Windows und macOS** (Node 24).
- Das Repository ist **öffentlich** (GitHub-Fork), hat keine Lizenz und wird nicht als Paket
  veröffentlicht. CI für PRs und Pushes nach `rewrite/react`, die neue App ab M1 auf GitHub Pages (O2, O14,
  ADR-016).

## 2. Was gleich bleiben muss

| Bereich | Anspruch | Nachweis |
|---|---|---|
| Analyse-Ergebnis (Report, FileMap, App-Graph) | inhaltlich gleich; Ziel ist Gleichheit (im Spike 0 Abweichungen) | Golden G1 |
| Halstead-Werte (Fließkommazahlen) | kleine Abweichungen sind in Ordnung, solange sie nicht ins Gewicht fallen | G1 |
| Darstellungsregeln (Größe, Warnung, Icons, Cluster, Vorschaukreise) | gleich | Golden G2 |
| Aussehen (Farben, Formen, Texte, Legende, Panels) | gleich, sichtbar vergleichbar | Sichtvergleich durch den Nutzer |
| Interaktionen | gleich (Funktionsinventar), außer bewussten Korrekturen (ADR-011) | Komponenten- und E2E-Tests |
| Graph-Anordnung | **darf abweichen** (Wunsch des Nutzers), das Fluss-Layout bleibt aber Standard | – |

## 3. Nicht-Ziele

- Neue Analysefunktionen oder Metriken: erst beim Nutzer nachfragen (Ausnahme: Monorepo-Unterstützung,
  P05.5).
- Mobile Optimierung über das Altsystem hinaus.
- Server-Komponente, Login, Datenübertragung: Die App bleibt rein clientseitig und offline-fähig.
- Babel 8 (eigene Phase nach dem MVP, Frist Juni 2027).
- Ersatz der alten Analysebibliotheken (escomplex, jLouvain) durch Eigenbau. WebCola ist
  seit P08 durch eigene Fluss-Regeln auf d3-force ersetzt.