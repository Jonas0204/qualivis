# P03-S00 – CI für Pull Requests (GitHub Actions)

Meilenstein M1 · Abhängig von: M0 · Umfang S

## Ziel
Jeder Pull Request nach `rewrite/react` und jeder Push auf `rewrite/react` führt `pnpm check` auf
Ubuntu, Windows und macOS aus. Der Nutzer sieht das Ergebnis direkt im PR, auch unterwegs.

## Kontext
- ADR-016 (CI und Pages)
- `package.json` (Skripte, `packageManager`), `.node-version`
- Das Repo ist öffentlich: GitHub-gehostete Standard-Runner sind dort kostenlos, auch Windows und
  macOS.

## Dateien
`.github/workflows/ci.yml` (neu)

## Schritte
0. **Vorher nachfragen:** Die Karte ändert CI/CD (globale Regel des Nutzers). Erst nach seiner
   Zustimmung beginnen.
1. Für `actions/checkout`, `pnpm/action-setup` und `actions/setup-node` die neueste Version mit
   Datum ermitteln und den Commit-SHA dazu holen. Die Version muss mindestens 3 Tage alt sein, wie
   bei `minimumReleaseAge`.
   ```bash
   gh api repos/actions/checkout/releases/latest --jq '.tag_name + " " + .published_at'
   gh api repos/actions/checkout/commits/<tag> --jq .sha
   ```
2. `.github/workflows/ci.yml` anlegen, SHAs (40 Zeichen) einsetzen, Version als Kommentar:
   ```yaml
   name: CI

   on:
     pull_request:
       branches: [rewrite/react]
     push:
       branches: [rewrite/react]
     workflow_dispatch:

   permissions:
     contents: read

   concurrency:
     group: ci-${{ github.ref }}
     cancel-in-progress: true

   jobs:
     check:
       name: check (${{ matrix.os }})
       strategy:
         fail-fast: false
         matrix:
           os: [ubuntu-latest, windows-latest, macos-latest]
       runs-on: ${{ matrix.os }}
       timeout-minutes: 20
       steps:
         - uses: actions/checkout@<sha> # <version>
           with:
             persist-credentials: false
         # Reads the pnpm version from "packageManager" in package.json.
         - uses: pnpm/action-setup@<sha> # <version>
         - uses: actions/setup-node@<sha> # <version>
           with:
             node-version-file: .node-version
             cache: pnpm
         - run: pnpm install --frozen-lockfile
         - run: pnpm check
   ```
3. `pnpm format` (Biome formatiert auch YAML), dann `pnpm check`.
4. Dem Nutzer vorschlagen (stellt er selbst auf GitHub ein, optional): Settings → Branches →
   Regel für `rewrite/react` mit den drei Checks `check (…)` als Pflicht.

## Akzeptanzkriterien
- [ ] Der PR der Phase P03 zeigt drei grüne Checks: `check (ubuntu-latest)`,
      `check (windows-latest)`, `check (macos-latest)`.
- [ ] Alle Actions sind per vollständigem Commit-SHA gepinnt, mit Version als Kommentar.
- [ ] `permissions: contents: read`, keine Secrets, kein `pull_request_target`.
- [ ] `pnpm check` lokal grün.

## Prüfen
`pnpm check`. Nach dem Push (nur nach Nachfrage) einmal `gh pr checks <nummer>` und den Stand nennen,
nicht wiederholt abfragen.

## Fallstricke
- `pnpm/action-setup` ohne `version:` aufrufen. Steht zusätzlich `packageManager` in
  `package.json`, bricht die Action bei abweichenden Angaben ab.
- Ein Workflow für `pull_request` läuft schon in dem PR, der ihn hinzufügt (GitHub nutzt den
  Merge-Stand). Ein extra PR nur für die CI ist nicht nötig.
- Scheitern auf Windows nur Golden- oder Fixture-Tests: zuerst Zeilenenden prüfen
  (`git ls-files --eol testdata | head`); `.gitattributes` setzt `testdata/** -text`.
- `fsevents` wird außerhalb von macOS nicht installiert; `allowBuilds` steht schon auf `false`.

## Nicht tun
- Kein `pull_request_target`, keine Schreibrechte, keine Secrets, kein eigener Token.
- Kein Auto-Merge, keine Branch-Regeln per API setzen (macht der Nutzer).
- Keine Actions mit Tag (`@v4`) statt SHA.

## Commit-Vorschlag
`build(repo): add CI workflow for pull requests`
