# P11 – Abschluss (Meilenstein M8)

> Kompakte Karten; vor Beginn verfeinern (S00).

## S00 – Phase verfeinern (S)

## S01 – Dokumentation (S)
- Root-`README.md` final („Qualivis“: Zweck, Screenshot, Bedienung, Entwicklung auf Windows/macOS,
  Architekturbild). Keine Klarnamen; kein Lizenzabschnitt (privat).
- `docs/architecture.md` aus `00-grundlagen/03-architektur.md` (Ist-Stand, nicht Plan).
- `CONTRIBUTING.md`: Konventionen, Golden-Regeln, Befehle.

## S02 – Babel-8-Migration (L, Frist: vor Juni 2027)
- Eigene ADR (ersetzt ADR-004). Vorgehen:
  1. Spike in eigenem Branch: Babel 8 + escomplex – welche AST-Knoten ändern sich
     (`ImportExpression`, TS `typeArguments`, …), welche Parser-Plugins entfallen
     (`pipelineOperator: minimal`)?
  2. Anpassungen im Kern (`parser.ts`, `traverseHelper.ts` React.lazy-Erkennung, ggf. escomplex-Patch
     für neue Knotentypen).
  3. G1-Diff auswerten: jede Abweichung erklären; nur akzeptierte Abweichungen (Nutzer) führen zu neuen
     Goldens – als **neue** Dateien `babel8-*.json`, die alten bleiben zum Vergleich.
- Alternative bei zu großen Abweichungen: Babel 7 bis zum Ende der Sicherheitsunterstützung, danach
  Neubewertung.

## Entfallen (Nutzerentscheidungen 07.11.2026)
- ~~Entscheidung zum Altsystem~~ – `legacy/angular/` bleibt im Repo (O5).
- ~~Deployment~~ – vorerst keins (O3). Falls später gewünscht: `pnpm build` erzeugt `apps/web/dist`
  (statisch, `base: './'`). Der Branch `gh-pages` enthält den Legacy-Build und ist Quelle der Goldens –
  nie überschreiben.
- ~~Umbenennung~~ – entschieden: „Qualivis“ (O1, ADR-012).
