# Risiken und Entscheidungen des Nutzers

## 1. Entscheidungen des Nutzers (07.11.2026)

| ID | Frage | Entscheidung | Folgen im Plan |
|---|---|---|---|
| O1 | Name der App | **Qualivis**; „Component Graph“ nur dort, wo es fachlich passt (Graph-Ansicht) | ADR-012, ADR-011 A10 |
| O2 | Lizenz / Veröffentlichung | **keine Lizenz, bleibt privat**; keine npm-Veröffentlichung | alle Pakete `"private": true`; Veröffentlichungs-Schritt in P10 entfällt |
| O3 | Deployment | **vorerst keins** | Deployment-Schritt in P11 entfällt (nur Hinweis, wie man später bauen würde) |
| O4 | CI | **vorerst keine** | CI-Schritt in P10 entfällt; `pnpm quality:self` läuft lokal |
| O5 | `legacy/angular/` | **bleibt im Repo** | Altsystem-Schritt in P11 entfällt |
| O6 | UI-Eigenheiten V1 (keine Icons, wenn Größen nicht nach Metrik) und Q5 (keine Icons bei Auswahl über den Dateibaum) | **korrigieren** | ADR-011 A8, A9 |
| O7 | Zustandsverwaltung | **Jotai** 3.0.1 | ADR-013 |
| O8 | Pfad-Modul für escomplex | **`path-browserify`** in Node und Browser (statt kopiertem Code) | ADR-005 |
| O9 | Versionen | **fest gepinnt**, `minimumReleaseAge` **3 Tage** | ADR-014 |
| O10 | Plattformen | **Windows und macOS**, Node **24** | `04-technologie-stack.md`, alle Befehle plattformneutral |

Neue offene Fragen werden hier mit nächster freier ID ergänzt.

## 2. Risiken

| ID | Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|---|
| R1 | Babel 7 läuft im Juni 2027 aus | sicher | mittel | P11-S02 rechtzeitig angehen; Goldens zeigen jede Abweichung |
| R2 | Ausnutzbare Sicherheitsmeldung in escomplex/WebCola/jLouvain oder deren Abhängigkeiten | gering | mittel | `pnpm audit --prod` je Phase; dann Neubewertung (neue ADR) |
| R3 | Feste Versionen + Mindestalter verzögern Sicherheitsupdates | mittel | gering | Version gezielt anheben (≥ 3 Tage alt), Nutzer fragen; später Renovate |
| R4 | React-Rendering pro Tick zu langsam bei großen Graphen | mittel | mittel | P08-S09 misst; Fallback: Positionen per Ref |
| R5 | Material-Optik ohne Material-Bibliothek weicht sichtbar ab | mittel | gering | Stil-Referenz mit Messwerten, Sichtvergleich G5 |
| R6 | jsdom-Grenzen (Layout, CodeMirror) verleiten zu schwachen Tests | mittel | mittel | Messfunktionen injizieren; E2E für Echtes (`06-teststrategie.md` §4) |
| R7 | Leichtere Modelle „verbessern“ Altcode und brechen G1 | mittel | hoch | Regel R5 im README; G1 in `pnpm check` |
| R8 | TypeScript 7 / Werkzeuge haben Kinderkrankheiten | gering | mittel | im Spike verifiziert; bei Problemen TS 6.0 als Rückfall (ADR) |
| R9 | `localStorage`-Limit (≈ 5 MB) bei großen Projekten | mittel | gering | `try/catch`, Meldung; später IndexedDB (eigene ADR) |
| R10 | Hook blockiert Installationen für den Assistenten | sicher | gering | Nutzer führt `pnpm install` aus (README R4) |
| R11 | Unterschiede Windows/macOS (Pfade, Dateiüberwachung, Browser-Kanal) | mittel | gering | `path-browserify`, `.gitattributes eol=lf`, plattformneutrale Befehle; P01-S04 prüft `pnpm dev` auf dem Mac |
| R12 | Jotai 3 ist neu (09/2026); Beispiele im Netz meist v2 | mittel | gering | nur Grund-API nutzen (`atom`, `useAtom*`, `atomWithStorage`, `createStore`, `Provider`); Doku der installierten Version |
