# P01-S04 – Installation durch den Nutzer, Checks grün

Meilenstein M0 · Abhängig von: P01-S03 · Umfang S

## Ziel
Die Werkzeuge sind installiert, `pnpm check` ist grün, das Lockfile existiert.

## Kontext
- README R4: Installationen führt der Nutzer aus (Hook `guard.js` blockiert sie für den Assistenten).
- `anhang/A6-spike-protokoll.md` F1 (keine Einzel-Ausnahmen bei `minimumReleaseAge`).

## Schritte
1. Den Nutzer bitten, im Repo-Root auszuführen:
   ```
   pnpm install
   ```
   Hinweis an den Nutzer: Falls pnpm anbietet, zu junge Versionen auszunehmen, **ablehnen** und die
   Meldung zurückgeben. Falls ein Paket mit Install-Skript gemeldet wird: Meldung zurückgeben.
2. Ausgabe auswerten: Gab es Hinweise auf `minimumReleaseAge`, `strictDepBuilds` oder
   `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS`? Dann gemäß `04-technologie-stack.md` §4 reagieren
   (Schreibweise prüfen, feste Version auf eine mindestens 3 Tage alte setzen, `allowBuilds` ergänzen
   – jeweils nach Rücksprache) und den Nutzer erneut installieren lassen.
3. `pnpm exec biome check . --verbose` → prüfen, dass `legacy/` und `testdata/` nicht geprüft werden.
4. `pnpm format` (formatiert die neuen Konfigurationsdateien), dann `pnpm check`.
5. `pnpm exec tsc --version` → `Version 7.0.2`; `pnpm exec biome --version` → `2.6.4`.
6. Auf **beiden** Plattformen prüfen (Nutzer, sobald der Branch auf dem anderen Rechner ist):
   `node --version` (24.x), `pnpm check` grün. Auf macOS zusätzlich später in P04-S01: `pnpm dev`
   lädt nach einer Dateiänderung neu (Dateiüberwachung, `fsevents`).
7. `STATUS.md`: aufgelöste Versionen (aus `pnpm-lock.yaml`) für TypeScript, Biome, Vitest eintragen.

## Akzeptanzkriterien
- [ ] `pnpm-lock.yaml` existiert; `pnpm-workspace.yaml` enthält **keinen** Schlüssel
      `minimumReleaseAgeExclude`; alle Catalog-Einträge sind feste Versionen.
- [ ] `pnpm check` endet mit Exit-Code 0; ein Test (`tools`) bestanden.
- [ ] `biome check` prüft keine Dateien unter `legacy/` oder `testdata/`.

## Prüfen
`pnpm check`

## Fallstricke
- Die Patches greifen erst, wenn escomplex installiert wird (P03-S01). Ein falsch formatierter
  Patch fällt also erst dort auf.
- Falls `pnpm` den Workspace-Root als Paket für `typecheck` mitnimmt und kein Skript findet: das ist
  durch `--if-present` abgedeckt.

## Nicht tun
- Nicht selbst installieren, auch nicht über Umwege (anderes Werkzeug, Skript). Bei Blockade:
  melden und fragen (Nutzerregel).

## Commit-Vorschlag
`build(repo): add lockfile`  (gemeinsam mit S03 möglich)
