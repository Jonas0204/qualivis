# P01-S02 – Angular-Projekt nach `legacy/angular/` verschieben

Meilenstein M0 · Abhängig von: P01-S01 · Umfang S

## Ziel
Alle Dateien des Angular-Projekts liegen unverändert unter `legacy/angular/` (mit Git-Historie per
`git mv`), damit der Root frei für den neuen Workspace ist. Der alte Code dient nur noch als
Referenz und wird nicht mehr gebaut.

## Kontext
- Vom Nutzer entschieden (07.11.2026): „Angular nach legacy/, neu im Root“.
- Nutzerregel: Vor Massenänderungen Umfang nennen und bestätigen lassen.

## Dateien (zu verschieben)
`angular.json`, `browserslist`, `karma.conf.js`, `package.json`, `yarn.lock`, `tsconfig.json`,
`tsconfig.app.json`, `tsconfig.spec.json`, `tslint.json`, `.prettierrc`, `README.md`, `e2e/`,
`src/`, `patches/`.
**Nicht** verschieben: `.git/`, `.gitignore`, `.editorconfig`, `docs/`.

## Schritte
1. Dem Nutzer die Liste oben zeigen und um Bestätigung bitten (Massenänderung).
2. Nach Zustimmung: `mkdir legacy` und für jeden Eintrag `git mv <eintrag> legacy/angular/<eintrag>`
   (`.prettierrc` explizit, da Punktdatei). Zuerst `git mv src legacy/angular/src` usw.
3. `legacy/angular/LEGACY.md` anlegen:
   ```md
   # Legacy Angular app (reference only)
   This is the original "Component Graph" (Angular 9) as of commit a071f27 (2020-05-18).
   It is kept read-only as the behavioural reference for the React rewrite
   (see docs/migration). It is not built or installed. The production build used for
   golden tests lives on branch `gh-pages` (see tools/legacy).
   ```
4. Root-`.gitignore` ersetzen durch (die Zeile `CLAUDE.md` muss erhalten bleiben – die lokale
   Anweisungsdatei wird nie committet):
   ```gitignore
   # Local instructions for Claude (identity, push rules) – never commit
   CLAUDE.md
   node_modules/
   dist/
   coverage/
   .cache/
   *.log
   .DS_Store
   Thumbs.db
   .idea/
   .vscode/*
   !.vscode/extensions.json
   test-results/
   playwright-report/
   ```
5. `.gitattributes` im Root anlegen:
   ```gitattributes
   * text=auto eol=lf
   *.png binary
   # Fixtures and golden data must stay byte-identical (line numbers feed into metrics)
   testdata/** -text
   ```
6. `git status` zeigen (nur Umbenennungen + 3 neue/geänderte Dateien).

## Akzeptanzkriterien
- [ ] `git status` zeigt die Verschiebungen als `renamed`.
- [ ] Root enthält nur noch `.git/`, `.gitignore`, `.gitattributes`, `.editorconfig`, `docs/`, `legacy/`.
- [ ] `legacy/angular/src/app/helper/traverse.ts` existiert, Inhalt unverändert (`git diff -M --stat` zeigt 0 Änderungen in verschobenen Dateien).

## Prüfen
`git status`, `git diff --cached -M --stat` (nach Staging durch den Nutzer)

## Fallstricke
- `git mv` mit Leerzeichen im Pfad (`D:\Claude Code Projects\...`) in Anführungszeichen setzen.
- `.editorconfig` bleibt im Root (gilt auch für neuen Code).
- `.gitattributes` mit `eol=lf` kann beim nächsten Checkout Zeilenenden normalisieren; das ist
  gewollt. Für `testdata/**` ist es per `-text` ausgeschaltet.

## Nicht tun
- Keine Inhalte im Altcode ändern. Kein `git rm`.

## Commit-Vorschlag
`chore(repo): move Angular app to legacy/angular`
