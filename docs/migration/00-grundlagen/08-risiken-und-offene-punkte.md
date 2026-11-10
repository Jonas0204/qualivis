# Risiken und Entscheidungen des Nutzers

## 1. Entscheidungen des Nutzers ohne eigene ADR

Alle anderen Entscheidungen stehen als ADR in `07-entscheidungen.md`. IDs werden nicht neu vergeben.

| ID | Frage | Entscheidung | Folgen im Plan |
|---|---|---|---|
| O2 | Lizenz / Veröffentlichung | **keine Lizenz**, keine npm-Veröffentlichung. Das Repo selbst ist öffentlich (GitHub-Fork, O14) | alle Pakete `"private": true`; Veröffentlichungs-Schritt in P10 entfällt; keine personenbezogenen Daten im Repo (RI13) |
| O5 | `legacy/angular/` | **bleibt im Repo** | Altsystem-Schritt in P11 entfällt |
| O14 | Repo privat machen? | **offen.** Das Repo ist ein Fork und lässt sich so nicht privat stellen. Möglich: Settings → Danger Zone → „Leave fork network“, danach als eigenständiges Repo privat stellen (Issues, PRs und Kommentare gehen dabei verloren, die Commits bleiben). Folgen von privat: begrenzte Actions-Minuten (Windows und macOS zählen mehrfach), Pages nur mit Bezahl-Abo und trotzdem öffentlich | bis zur Entscheidung: als öffentlich behandeln (RI13) |
| O16 | Barrel-Dateien (`index.ts` mit `export … from`) und `exports`-Tabellen der `package.json` auflösen? | **offen.** Das Ziel-Monorepo braucht es nicht (ADR-019) | bei Bedarf eigener Schritt nach P05.5; die Vorstufe `workspace/` ist die Stelle dafür |
| O17 | Bibliothekskomponenten im Graphen anders darstellen als App-Komponenten? | **offen**, nach der Abnahme von P05.5 entscheiden | neue Darstellung, also Abweichung von der Stil-Referenz (ADR nötig) |
| O18 | Testdateien mit Suffix `Test` außerhalb von `__tests__/` erkennen? | **offen.** Ein Suffix-Muster träfe auch Komponenten wie `Contest.tsx` | bis dahin nur `__tests__/`, `__mocks__/`, `.test.`, `.spec.`, `.stories.` (`isTestFile`) |
| O19 | App-Auswahl speichern und beim Drop auf den Graphen erneut fragen? | **offen**, in P07-S05 klären | P07-S05 (Hinweis in der Karte) |

Neue offene Fragen bekommen die nächste freie ID (O20 …).

## 2. Risiken

| ID | Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|---|
| RI1 | Babel 7 läuft im Juni 2027 aus | sicher | mittel | P11-S02 rechtzeitig angehen; Goldens zeigen jede Abweichung |
| RI2 | Ausnutzbare Sicherheitsmeldung in escomplex/WebCola/jLouvain oder deren Abhängigkeiten | gering | mittel | `pnpm audit --prod` je Phase; dann Neubewertung (neue ADR) |
| RI3 | Feste Versionen + Mindestalter verzögern Sicherheitsupdates | mittel | gering | Version gezielt anheben (≥ 3 Tage alt), Nutzer fragen; später Renovate |
| RI4 | React-Rendering pro Tick zu langsam bei großen Graphen | mittel | mittel | Positionen pro Frame direkt im DOM, `React.memo` für Knoten und Kanten (umgesetzt); WebCola selbst bleibt langsam, Worker in P08-S09 |
| RI5 | Material-Optik ohne Material-Bibliothek weicht sichtbar ab | mittel | gering | Stil-Referenz mit Messwerten, Sichtvergleich G5 |
| RI6 | jsdom-Grenzen (Layout, CodeMirror) verleiten zu schwachen Tests | mittel | mittel | Messfunktionen injizieren; E2E für Echtes (`06-teststrategie.md` §4) |
| RI7 | Leichtere Modelle „verbessern“ Altcode und brechen G1 | mittel | hoch | Regel R5 im README; G1 in `pnpm check` |
| RI8 | TypeScript 7 / Werkzeuge haben Kinderkrankheiten | gering | mittel | im Spike verifiziert; bei Problemen TS 6.0 als Rückfall (ADR) |
| RI9 | `localStorage`-Limit (≈ 5 MB) bei großen Projekten | mittel | gering | `try/catch`, Meldung; später IndexedDB (eigene ADR) |
| RI10 | Installationen ohne Rückfrage | gering | mittel | Installationen nur nach Nachfrage mit Befehl, Paketen und Zweck (README R4); Hook des Nutzers prüft zusätzlich |
| RI11 | Unterschiede Windows/macOS (Pfade, Dateiüberwachung, Browser-Kanal) | mittel | gering | `path-browserify`, `.gitattributes eol=lf`, plattformneutrale Befehle, `tar` mit relativen Pfaden (M0); `pnpm dev` auf dem Mac prüft der Nutzer (offen) |
| RI12 | Jotai 3 ist neu (09/2026); Beispiele im Netz meist v2 | mittel | gering | nur Grund-API nutzen (`atom`, `useAtom*`, `atomWithStorage`, `createStore`, `Provider`); Doku der installierten Version |
| RI13 | Öffentliches Repo: personenbezogene Daten oder Secrets gelangen in Dateien, Commits oder PRs | mittel | hoch | Regel in `AGENTS.md` und README R2; Commits mit noreply-Adresse; vor jedem Commit den Diff auf Klarnamen, private E-Mail-Adressen und lokale Pfade mit Benutzernamen prüfen. Was einmal gepusht ist, bleibt in der Historie (keine History-Umschreibung) |
| RI14 | Große Bibliotheken (mehrere hundert Dateien) machen Auswahl und Analyse im Browser langsam | mittel | mittel | nur erreichbare Dateien analysieren; Import-Scan nur mit Parse, ohne `traverse` (`scanImports`); Zeit in der Abnahme messen (P05.5-S08); Worker in P08-S04 |
| RI15 | Die Dateiauswahl des Browsers zählt bei einem Monorepo-Ordner auch `node_modules` auf (langsam, viel Speicher) | hoch | mittel | Ordner hineinziehen: Dabei werden ausgeschlossene Ordner übersprungen (`isExcludedFolder`); so in der Abnahme anleiten |
| RI16 | tsconfig-Regeln (`extends`, `baseUrl`, `paths` ersetzt statt mischt, `references`) falsch nachgebaut → fehlende Kanten | mittel | mittel | Regeln nach der TypeScript-Doku einzeln getestet (`pathMappingFor`, `createImportResolver`); Unauflösbares melden statt raten |
| RI17 | escomplex bricht bei neuerer Syntax ab, und mit ihm die ganze Analyse (wie im Altsystem). Sein Code-Generator, den es nur für Schleifenköpfe, Parameter, berechnete Schlüssel und `extends` aufruft, kennt viele Babel- und TS-Knoten nicht. Beispiele: `for (const m of s.matchAll(/x/g))`, `function f(p = { ...d })`, JSX, `as` oder `?.` im Schleifenkopf | mittel | hoch | A19 umgeht es nur für Test- und Python-Ordner. Vorschlag: den Patch für `typhonjs-escomplex-commons` (Technologie-Stack §4) erweitern; Fehlerbehandlung in P08-S05 |
