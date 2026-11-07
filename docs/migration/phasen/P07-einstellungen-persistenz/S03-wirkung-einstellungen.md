# P07-S03 – Wirkung aller Einstellungen

Meilenstein M4 · Abhängig von: P07-S02 · Umfang M

## Ziel
Jede Einstellung wirkt genau wie im Altsystem; Speichern startet den Graph neu (außer reiner
Vollbild-Wechsel → nur „Zoom to fit“).

## Kontext
- Altcode `graph.component.ts:82-96` (Reaktion auf Einstellungen), §2, §6, §7, §9, §12, §13

## Wirkungstabelle (Abnahmegrundlage)

| Einstellung | Wirkung | Prüfbar durch |
|---|---|---|
| `colaLayout` | WebCola (an) / Kraft-Layout (aus) | Komponententest mit Engine-Spion |
| `hideOverlappingLabels` | Label-Kollision an/aus | Test `useLabelCollision` |
| `fade` | Ausblenden bei Klick/Strg+Hover an/aus | Test aus P05-S09 |
| `highlightIndirectNodes` | Indirekte Knoten bleiben sichtbar + `#fafafa`-Füllung | Test |
| `currentSizeMetricErrorHighlighting` | Klassen `warn`/`error` an Overlay/innerem Kreis | Test |
| `autoZoom` | Einpassen nach erstem Layout-Ende | Test (Fake-Engine) |
| `nodeSizesBasedOnMetrics` | bei aus: Größe fest 48; Icons und Warnstufen bleiben (Korrektur A8, Altsystem V1 zeigte keine) | Test |
| `fullScreen` | Seitenspalten aus, danach Einpassen, **kein** Neustart | Test |
| `text` | (nicht im Dialog) Labels anzeigen | – |

## Schritte
1. `GraphView` liest `settingsAtom`. Änderung **nur** von `fullScreen` → `zoomToFit()` nach
   dem nächsten Frame; jede andere Änderung → Graph neu aufbauen und Layout neu starten
   (`firstSimulation` zurücksetzen → `autoZoom` greift erneut).
2. Fehlende Wirkungen nachziehen (falls in P05 nur mit Konstanten gearbeitet wurde).
3. Je Zeile der Tabelle ein Verhaltenstest (jsdom, Fake-Engine).

## Akzeptanzkriterien
- [ ] Alle Zeilen der Tabelle getestet und im Browser nachvollzogen.
- [ ] `pnpm check` grün.

## Commit-Vorschlag
`feat(web): apply all settings like the legacy app`
