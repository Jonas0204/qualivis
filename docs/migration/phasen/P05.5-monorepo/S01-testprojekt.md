# P05.5-S01 – Testprojekt `monorepo`

Ohne Meilenstein (P05.5) · Abhängig von: M2 · Umfang S

## Ziel
Ein kleines, selbst geschriebenes Monorepo unter `testdata/fixtures/monorepo/` bildet die Muster
des Ziel-Monorepos nach. Die erwarteten Knoten und Kanten stehen von Hand hergeleitet daneben. Alle
weiteren Schritte testen dagegen.

## Kontext
- ADR-019; Phasen-README (Struktur des Ziel-Monorepos)
- `testdata/README.md` (Regeln für Fixtures), Teststrategie §1–§2
- K12 (Präfix-Auflösung) in `01-referenz-altsystem/02-analyse-kern.md` §6

## Dateien
`testdata/fixtures/monorepo/**` (neu), `testdata/fixtures/monorepo.NOTES.md` (neu),
`testdata/README.md` (Tabelle „Fixtures“).

## Schritte
1. Diese Struktur anlegen (Namen neutral, keine Ähnlichkeit zu echten Projekten). `@demo` ist der
   Paket-Scope:
   ```
   monorepo/
   ├─ package.json               {"name": "demo-root", "private": true}
   ├─ pnpm-workspace.yaml        packages: apps/web-a, apps/web-b, shared/ui, shared/tokens
   ├─ tsconfig.base.json         mit Kommentar und nachgestelltem Komma (JSONC);
   │                             compilerOptions.paths: {"@data/*": ["dev-data/*"]}
   ├─ dev-data/sample.ts         Daten, keine Komponente
   ├─ apps/web-a/                die App
   │  ├─ package.json            {"name": "web-a", "dependencies": {"@demo/ui": "workspace:*"}}
   │  ├─ tsconfig.json           extends "../../tsconfig.base.json"; paths:
   │  │                          {"@demo/ui/*": ["../../shared/ui/src/*"], "@data/*": ["../../dev-data/*"]}
   │  ├─ src/main.tsx            Komponente Root rendert <Page/> (relativer Import ../components/page/Page)
   │  ├─ src/routes.ts           importiert @data/sample, keine Komponente
   │  └─ components/
   │     ├─ page/Page.tsx        memo(function Page …); rendert <Header/> (./Header) und
   │     │                       <Card/> (@demo/ui/components/card/Card); import type aus @demo/ui/types
   │     ├─ page/Header.tsx      rendert <Button/> (@demo/ui/components/button/Button)
   │     ├─ page/Header.styles.ts   Nachbardatei mit gleichem Namensanfang (K12)
   │     └─ __tests__/PageTest.tsx   Hilfskomponente Wrapper (rendert nur children); der Test
   │                                 rendert <Page/> in einer Testfunktion
   ├─ apps/web-b/
   │  ├─ package.json            {"name": "web-b", "dependencies": {"@demo/tokens": "workspace:*"}}
   │  └─ components/Other.tsx    rendert <Swatch/> (@demo/tokens/src/Swatch, ohne tsconfig-Alias)
   └─ shared/
      ├─ ui/
      │  ├─ package.json         {"name": "@demo/ui"} ohne main/module/exports
      │  ├─ tsconfig.json        extends "../../tsconfig.base.json"
      │  └─ src/
      │     ├─ types.ts          enum Size, ein Objekt mit satisfies
      │     ├─ hooks/useToggle.ts
      │     └─ components/
      │        ├─ button/Button.tsx         function Button; rendert <Icon/> (../icon/Icon); nutzt
      │        │                            useToggle (../../hooks/useToggle) und ./Button.styles
      │        ├─ button/Button.styles.ts   Nachbardatei mit gleichem Namensanfang (K12)
      │        ├─ icon/Icon.tsx             export const Icon = memo(() => …)
      │        ├─ card/Card.tsx             export const Card = forwardRef(…); rendert <Icon/>
      │        ├─ unused/Unused.tsx         wird nirgends importiert
      │        └─ __tests__/ButtonTest.tsx  Hilfskomponente Wrapper (rendert nur children)
      └─ tokens/
         ├─ package.json         {"name": "@demo/tokens"}
         └─ src/Swatch.tsx       Komponente Swatch
   ```
2. `monorepo.NOTES.md` daneben: Zweck, Muster pro Datei und die erwarteten Ergebnisse:
   - **App `web-a`:** Knoten Root, Page, Header, Card, Button, Icon. Kanten Root → Page,
     Page → Header, Page → Card, Header → Button, Button → Icon, Card → Icon. Nicht dabei: Unused,
     Swatch, Other, beide Wrapper.
   - **App `web-b`:** Knoten Other, Swatch; Kante Other → Swatch (Paketname mit `src/` im Pfad).
   - **„Whole project“ (alter Weg):** alle Komponenten aller Dateien, auch Unused, Swatch, Other und
     beide Wrapper; Kanten nur aus relativen Importen ohne K12-Konflikt (Root → Page, Button → Icon,
     Card → Icon). Page → Header fehlt (K12: `Header.styles.ts`), alles über Paketnamen fehlt.
   - **Auflösung im neuen Weg:** `@demo/ui/components/button/Button` ergibt `Button.tsx`, nicht
     `Button.styles.ts`; `./Header` ergibt `Header.tsx`.
   Vor dem Eintragen jede Erwartung von Hand gegen die Dateien prüfen.
3. `testdata/README.md`: Zeile `monorepo` in „Fixtures“ (eigenes Testprojekt, Monorepo-Muster,
   keine Goldens: das Altsystem kann keine Monorepos).

## Akzeptanzkriterien
- [ ] Struktur und Inhalte wie oben; jede Komponente hat einen eindeutigen Namen.
- [ ] Erwartungen in `monorepo.NOTES.md` stimmen mit den Dateien überein.
- [ ] `pnpm check` grün; die Golden-Tests bleiben bei `mini` und `realworld`.

## Prüfen
`pnpm check`

## Fallstricke
- Biome, TypeScript und Vitest ignorieren `testdata/` (`testdata/README.md`). Die `package.json`-
  und `tsconfig.json`-Dateien der Fixture dürfen nicht in den Workspace des Repos geraten: Die
  Globs in der `pnpm-workspace.yaml` des Repos gelten nur für `apps/*` und `packages/*` im Root.
  Nach dem Anlegen `pnpm -r ls --depth -1` prüfen: Es dürfen keine `@demo`-Pakete erscheinen.
- Kein `pnpm install` in der Fixture. `node_modules/` kommt in der Fixture nicht vor; das
  Überspringen testet S02 mit Daten im Speicher.
- Dateien bleiben byte-genau (Zeilennummern fließen in die Metriken).

## Nicht tun
- Keine Goldens erzeugen oder ändern.
- Keine Barrel-Dateien (`index.ts` mit Re-Exporten): Das Ziel-Monorepo hat keine, ihre Auflösung
  ist offen (O16).

## Commit-Vorschlag
`test(testdata): add monorepo fixture`
