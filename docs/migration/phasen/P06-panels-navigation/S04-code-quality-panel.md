# P06-S04 – Code-Quality-Panel und Golden G4

Meilenstein M3 · Abhängig von: P06-S02 · Umfang M

## Ziel
Rechts oben zeigt das Panel Name, Metrik-Balken (Farbe nach Schwellenwert) und Icon-Hinweise des
ausgewählten Elements – textgleich zum Altsystem (Golden G4).

## Kontext
- Funktionsinventar Q1–Q5; Stil-Referenz §1 (Balkenfarben), §2, §3
- Altcode: `components/code-quality/*`, `quality-metric/*`, `icon-description/*`
- Goldens: `legacy-panels-app.json`, `legacy-panels-component-*.json` (Format `anhang/A2`)

## Dateien
`packages/core/src/rules/metricRows.ts` (+ Test), `apps/web/src/features/code-quality/CodeQualityPanel.tsx`,
`QualityMetricBar.tsx`, `IconDescription.tsx` (+ `*.module.css`, + Tests),
`apps/web/src/features/code-quality/panel.golden.test.tsx`.

## Schritte
1. Kern `metricRows(selection)` → Zeilen `{ id, name, description, value, threshold, ratio, level:
   'ok' | 'warn' | 'error' }` – nur Metriken mit truthy Schwellenwert (Altsystem: `*ngIf="threshold"`),
   Reihenfolge `qualityMetrics`, `report = report.aggregate ?? report`, Schwellenwert über
   `resolveThreshold`, Level: `value >= t` → error, `value >= t * 0.8` → warn. Test mit Zahlen.
2. `QualityMetricBar`: Zeile 24 px; Name links (13 px, `title` = Beschreibung), Wert rechts (13 px, 500,
   `title` = `Wert/Schwelle`); Balken absolut dahinter, Rand 1 px `#bdbdbd`, Puffer weiß, Füllung
   `min(ratio, 1) * 100 %` in `--qv-success-muted` / `--qv-warn-muted` / `--qv-error-muted`
   (`role="meter"`, `aria-valuenow`, `aria-valuemax`).
   Wertanzeige: Zahl unverändert als Text (`String(value)`, Altsystem zeigt z. B. `34.286`).
3. `IconDescription({ icon })`: Icon 20 px in Warn-/Fehlerfarbe, Text 14 px; Link als `<a href
   target="_blank" rel="noopener noreferrer">`, Darstellung `text (see <a>href</a>)`.
4. `CodeQualityPanel`: Überschrift „Code Quality“ (500 16px/28px) + Name (`label || id`) + bei
   `report.aggregate` „ (aggregate)“; Metrikzeilen (Abstand 8 px); Icon-Hinweise (Abstand 16 px).
   Zeigt die **erste** Auswahl. Ohne Auswahl nur die Überschrift.
5. G4-Test (`panel.golden.test.tsx`): Für jedes Fixture und jede Ansicht: Auswahlobjekte wie in S02
   erzeugen (Icons aus `buildViewModel`), Panel rendern, vergleichen mit `legacy-panels-*.json`:
   - `header` (normalisierter Text), je Zeile `name`, `description`, `value`, `valueTitle`,
     Farbe (`barClass` des Altsystems enthält `warn`/`error` oder nichts → `level`).
   - Icons: Icon-Name und normalisierter Text.
6. Korrektur A9 (Dateiauswahl zeigt Icons) als eigener Test; die Goldens (Klicks im Graph) sind davon
   nicht betroffen.

## Akzeptanzkriterien
- [ ] G4 grün für alle erfassten Panels (AV + KVs beider Fixtures).
- [ ] Optik wie Altsystem.
- [ ] Tests grün; `pnpm check` grün.

## Fallstricke
- Legacy-Header-Text enthält Zeilenumbrüche/Leerraum aus dem Template → normalisieren.
- `innerHTML` wird nicht verwendet (ADR-011 A3).

## Commit-Vorschlag
`feat(web): add code quality panel with golden test G4`
