# P05.5-S04 – Kern: Import-Angaben auflösen

Ohne Meilenstein (P05.5) · Abhängig von: P05.5-S03 · Umfang M

## Ziel
Ein Resolver liefert für eine Import-Angabe (`'./Header'`, `'@demo/ui/components/button/Button'`,
`'@data/sample'`) die hochgeladene Quelldatei mit genauem Pfad, oder `undefined` für Fremdpakete
wie `react`.

## Kontext
- ADR-019; K4 und K12 (`01-referenz-altsystem/02-analyse-kern.md` §6)
- So löst der alte Kern auf (nicht ändern, nur verstehen):
  `packages/core/src/legacy/traverseHelper.ts:115-137` (relativ oder K4),
  `traverseHelper.ts:541-565` (Präfixsuche), `generateAppGraph.ts:129-145`
- S03 (`findPackages`, `pathMappingFor`), Testprojekt `monorepo`

## Dateien
`packages/core/src/workspace/resolveImport.ts` (+ Test), `packages/core/src/index.ts`.

## Schritte
1. API:
   ```ts
   export type ImportResolver = (specifier: string, fromPath: string) => string | undefined;
   /** Resolves import specifiers to uploaded source files (exact path), undefined for anything else. */
   export function createImportResolver(project: ProjectFiles): ImportResolver
   ```
   Pakete, tsconfig-Zuordnungen und die Menge der Quellpfade einmal vorbereiten bzw. pro Ordner
   zwischenspeichern.
2. Reihenfolge:
   1. **Relativ** (`.`, `..`, `./…`, `../…`): vom Ordner der Datei aus.
   2. **tsconfig-`paths`** (`pathMappingFor(fromPath)`): Muster ohne `*` nur genau, mit einem `*`
      Präfix und Suffix; bei mehreren Treffern gewinnt das Muster mit dem längsten Präfix. Ziele
      in Reihenfolge, `*` ersetzt, relativ zu `baseDir`.
   3. **Paketname:** das Paket, dessen `name` gleich der Angabe ist oder ihr mit `/` vorangeht
      (längster Name gewinnt). Mit Unterpfad: `<dir>/<sub>`, dann `<dir>/src/<sub>`. Ohne
      Unterpfad: `entries.source`, `entries.module`, `entries.main`, sofern die Datei im Upload liegt,
      sonst `<dir>/src/index`, dann `<dir>/index`.
   Findet ein Schritt keine Datei, geht es mit dem nächsten weiter.
3. Dateisuche für einen Kandidatenpfad `p` (nur echte Quelldateien aus `project.sources`):
   `p` selbst; `p` + `.ts`, `.tsx`, `.js`, `.jsx`, `.d.ts`; `p/index` + `.ts`, `.tsx`, `.js`, `.jsx`.
   Genauer Vergleich, **keine** Präfixsuche: `Button` findet `Button.tsx`, nie `Button.styles.ts`
   (K12).
4. Exporte in `index.ts`.
5. Tests mit `monorepo`: `./Header` aus `Page.tsx` → `Header.tsx`;
   `@demo/ui/components/button/Button` → `Button.tsx`; `@data/sample` → `dev-data/sample.ts`;
   `@demo/tokens/src/Swatch` aus `web-b` → `Swatch.tsx` (Paketname, kein Alias); `react`,
   `@emotion/react` → `undefined`; Ordner mit `index.ts`; zwei getrennt hineingezogene Ordner (`/web-a/…`
   und `/ui/…`, Daten im Speicher): der tsconfig-Pfad trifft nicht, der Paketname mit `src/` schon.

## Akzeptanzkriterien
- [ ] Alle Fälle oben getestet und grün.
- [ ] `pnpm check` grün.

## Prüfen
`pnpm check`

## Fallstricke
- Ordnernamen dürfen Punkte enthalten; Endungen nur anhängen, nie „ist schon eine Endung“ raten.
- Groß- und Kleinschreibung genau vergleichen (wie Linux und die CI).
- Ein `paths`-Ziel kann ins Leere zeigen (Ordner nicht hochgeladen); dann weiter mit dem Paketnamen.

## Nicht tun
- Keine Barrel-Auflösung (O16) und keine `exports`-Tabellen der `package.json`.
- Keine dynamischen `import()`-Aufrufe und kein `require()`; das Ziel-Monorepo hat keine.

## Commit-Vorschlag
`feat(core): resolve import specifiers across workspace packages`
