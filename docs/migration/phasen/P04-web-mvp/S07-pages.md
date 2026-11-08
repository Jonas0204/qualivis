# P04-S07 – Neue App auf GitHub Pages (nach jedem Merge)

Meilenstein M1 · Abhängig von: P04-S06 (M1 bestätigt) · Umfang S

## Ziel
Nach jedem Merge in `rewrite/react` baut GitHub Actions die neue App und veröffentlicht sie unter
`https://jonas0204.github.io/qualivis/`. Die alte Seite aus dem Branch `gh-pages` wird dort nicht
mehr ausgeliefert. Der Branch selbst bleibt unverändert, denn er ist die Quelle der Goldens.

## Kontext
- ADR-016
- Architektur §7: `base: './'`, Deep-Link `?id=` per `history.pushState` ohne Router. Der Pfad
  ändert sich nie, deshalb braucht Pages keinen 404-Fallback.
- `tools/legacy/extract-legacy-build.mjs` liest den alten Build fest aus Commit `5f0155e`, nicht aus
  dem Branch-Kopf.
- Die App läuft nur im Browser; analysierte Dateien verlassen den Rechner nicht.

## Dateien
`.github/workflows/pages.yml` (neu), `README.md` (Root: Link zur Seite)

## Schritte
0. **Vorher nachfragen:** Die Karte ändert CI/CD und veröffentlicht die App. Erst nach Zustimmung
   des Nutzers beginnen.
1. Für `actions/upload-pages-artifact` und `actions/deploy-pages` die neueste Version mit Datum
   ermitteln und den Commit-SHA dazu holen; die Version muss mindestens 3 Tage alt sein, wie bei
   `minimumReleaseAge`. Die drei Actions aus `ci.yml` mit denselben SHAs übernehmen.
   ```bash
   gh api repos/actions/deploy-pages/releases/latest --jq '.tag_name + " " + .published_at'
   gh api repos/actions/deploy-pages/commits/<tag> --jq .sha
   ```
2. `.github/workflows/pages.yml`:
   ```yaml
   name: Pages

   on:
     push:
       branches: [rewrite/react]
     workflow_dispatch:

   permissions:
     contents: read

   concurrency:
     group: pages
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       timeout-minutes: 20
       steps:
         - uses: actions/checkout@<sha> # <version>
           with:
             persist-credentials: false
         - uses: pnpm/action-setup@<sha> # <version>
         - uses: actions/setup-node@<sha> # <version>
           with:
             node-version-file: .node-version
             cache: pnpm
         - run: pnpm install --frozen-lockfile
         - run: pnpm build
         - uses: actions/upload-pages-artifact@<sha> # <version>
           with:
             path: apps/web/dist

     deploy:
       needs: build
       runs-on: ubuntu-latest
       permissions:
         pages: write
         id-token: write
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - id: deployment
           uses: actions/deploy-pages@<sha> # <version>
   ```
3. Dem Nutzer diese Einstellungen nennen (macht er selbst auf GitHub, vor dem Merge):
   - Settings → Pages → Build and deployment → Source: **GitHub Actions** (statt „Deploy from a
     branch“).
   - Settings → Environments → `github-pages` → Deployment branches: `rewrite/react` erlauben,
     falls dort nur der Standard-Branch `master` steht.
4. Root-`README.md`: Zeile „Live: https://jonas0204.github.io/qualivis/ (state of `rewrite/react`)“.
5. `pnpm format`, `pnpm check`, `pnpm build`.

## Akzeptanzkriterien
- [ ] Nach dem Merge des P04-PR zeigt die URL die neue App. Im Netzwerk-Tab gibt es keine 404 und
      keine Anfragen an fremde Hosts.
- [ ] Drop von `testdata/fixtures/mini` → 8 Knoten, 7 Pfeile (wie in der M1-Abnahme).
- [ ] `git rev-parse origin/gh-pages` ist weiter `5f0155e…`, `pnpm legacy:extract` funktioniert.
- [ ] Alle Actions per SHA gepinnt. Nur der Job `deploy` hat `pages: write` und `id-token: write`.

## Prüfen
Vor dem Merge: `pnpm check`, `pnpm build`, `pnpm preview` (relativer Basis-Pfad). Nach dem Merge
(Nutzer): `gh run list --workflow pages.yml --limit 1`, Seite öffnen, `mini` hineinziehen.

## Fallstricke
- Steht die Pages-Quelle noch auf „Deploy from a branch“, scheitert `deploy-pages` oder es wird
  weiter der alte Build ausgeliefert.
- Erlaubt das Environment `rewrite/react` nicht, bricht `deploy` mit „Branch … is not allowed to
  deploy to github-pages“ ab.
- `base` bleibt `'./'`; keinen absoluten Basis-Pfad einbauen, sonst läuft `pnpm preview` lokal nicht.
- Wird das Repo später privat (O14), braucht Pages ein kostenpflichtiges Abo, und die Seite bleibt
  trotzdem öffentlich. Dann die Karte neu bewerten.

## Nicht tun
- Nie auf den Branch `gh-pages` pushen und ihn nie löschen (Quelle der Goldens).
- Keine Secrets, kein eigener Token, keine eigene Domain.

## Commit-Vorschlag
`build(repo): deploy the web app to GitHub Pages`
