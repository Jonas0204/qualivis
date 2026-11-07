# P05 – Graph-Parität (Meilenstein M2)

**Ziel:** Der Graph sieht aus und verhält sich wie im Altsystem: Größen nach Metrik, Warn-/Fehlerränder,
Icons, Vorschaukreise mit „...“, Schraffur für Klassen, innerer Kreis für JSX, Pfeile/Vererbung,
WebCola als Standard-Layout, Zoom/Pan, Ziehen, Ausblenden, überlappende Labels, Legende und
Aktionsleiste. Alle Rechenregeln liegen in `@qualivis/core/rules` und sind durch Golden G2 belegt.

| Schritt | Titel | Umfang |
|---|---|---|
| [S01](S01-regeln-knoten.md) | Regeln: Größe, Warnung, Icons | M |
| [S02](S02-regeln-geometrie-farbe.md) | Regeln: Vorschau-Geometrie, Kanten, Clusterfarben | M |
| [S03](S03-regeln-cluster-constraints.md) | Regeln: Louvain-Cluster, React-Constraints | S |
| [S04](S04-golden-g2.md) | Golden G2 (Regeln gegen Altsystem) | M |
| [S05](S05-knoten-kanten-rendering.md) | Knoten- und Kanten-Rendering, Graph-CSS | M |
| [S06](S06-layout-engines.md) | WebCola-Adapter und Engine-Wahl | M |
| [S07](S07-pan-zoom.md) | Zoom und Pan | M |
| [S08](S08-knoten-ziehen.md) | Knoten ziehen | S |
| [S09](S09-auswahl-ausblenden.md) | Auswahl, Ausblenden, Entfernen | M |
| [S10](S10-label-kollision.md) | Überlappende Labels ausblenden | S |
| [S11](S11-legende-aktionen.md) | Legende, Aktionsleiste, UI-Bausteine | M |
| [S12](S12-m2-abnahme.md) | M2-Abnahme (Sichtvergleich) | S |

Referenz für alle Schritte: `01-referenz-altsystem/03-visuelle-regeln.md` (Abschnittsnummern §x).
Einstellungen gibt es noch nicht (P07): bis dahin `defaultSettings` aus `@qualivis/core` verwenden
und die Größenmetrik als lokalen State in `GraphView` halten.
