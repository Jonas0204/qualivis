# P03-S06 – Altcode typisieren (ohne Laufzeitänderung)

Meilenstein M1 · Abhängig von: P03-S05 · Umfang M

## Ziel
`// @ts-nocheck` ist aus allen Dateien in `src/legacy/` entfernt; der Kern kompiliert mit
`strict: true` (noch `noImplicitAny: false`). G1 bleibt nach **jeder** Datei grün.

## Kontext
- Spike: 47 Fehler unter diesen Einstellungen. Verteilung u. a. `traverse.ts`
  (≈ 12), `traverseHelper.ts` (≈ 8), `traverseClassComponent.ts`, `generateAppGraph.ts`, `findReport.ts`.
- Leitplanke der Phase (README P03).

## Erlaubte Mittel (und nur diese)
| Fehlerart | Lösung | Beispiel |
|---|---|---|
| `possibly 'null' or 'undefined'` (z. B. `loc`) | Non-null-Assertion | `path.node.loc!.start.line` |
| Eigenschaft fehlt auf Babel-Union (`declaration.id`, `callee.name`) | gezielter Cast auf den Typ, den der Code annimmt | `(path.node.declaration as t.ClassDeclaration).id` |
| Cast wäre unverhältnismäßig lang | `as any` **nur in `legacy/`** mit Kommentar `// legacy: untyped Babel access` | – |
| Array als `never[]` inferiert | Typannotation | `const dependencies: Import[] = [];` |
| Rückgabetyp passt nicht zu `return;` | Rückgabetyp erweitern | `): AstWithPath \| undefined` |
| `.map(...).filter(link => link)` liefert `(T \| undefined)[]` | Cast des Ergebnisses | `as Link[]` |
| Optionaler Typ wird als Pflicht verlangt | `!` oder Typ anpassen | `getSuperClass(...)` → `Import \| undefined` |

**Verboten:** neue `if`-Abfragen, `?.` statt `.`, `??`, Default-Werte, geänderte Bedingungen,
umgestellte Reihenfolgen – all das ändert Verhalten (z. B. würde `?.` einen Absturz in ein
`undefined` verwandeln).

## Schritte
1. Reihenfolge: `nestedStringAccess.ts`, `isComponentFile.ts`, `extractFileTree.ts`, `parser.ts`,
   `findReport.ts`, `generateAppGraph.ts`, `traverseHelper.ts`, `traverseClassComponent.ts`,
   `traverseFunctionComponent.ts`, `traverse.ts`.
2. Je Datei: `@ts-nocheck` entfernen → `pnpm --filter @qualivis/core typecheck` → Fehler mit den
   erlaubten Mitteln beheben → `pnpm test:parity` → grün? weiter. Rot? Änderung rückgängig machen
   und mit einem anderen erlaubten Mittel lösen.
3. Danach `legacy/README.md` ergänzen: „Typed under strict (noImplicitAny off) in P03-S06; casts mark
   places where the legacy code relies on AST shapes.“

## Akzeptanzkriterien
- [ ] Keine Datei in `src/legacy/` enthält `@ts-nocheck` oder `@ts-ignore`.
- [ ] `pnpm --filter @qualivis/core typecheck` grün.
- [ ] `pnpm test:parity` grün; `pnpm check` grün.
- [ ] `git diff` der Legacy-Dateien zeigt nur Typen, `!`, Casts.

## Prüfen
`pnpm check`; Review des Diffs Zeile für Zeile auf verbotene Mittel.

## Fallstricke
- `t.isXxx(node)`-Aufrufe narrowen in TS 7 teilweise schon; nicht zusätzlich casten, wenn kein
  Fehler gemeldet wird.
- `import * as t from '@babel/types'` bleibt (Laufzeit-Import, kein Typ-Import).

## Nicht tun
- Kein `noImplicitAny: true` in diesem Schritt (folgt in P08-S01).

## Commit-Vorschlag
`refactor(core): type legacy analysis helpers without behaviour change`
