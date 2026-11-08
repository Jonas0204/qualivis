# Qualitätskriterien

Grundlage: eine Bachelorarbeit zur Wartbarkeit von Web-Frontends. Übernommen wird nur, was sich
**mit den vorhandenen Werkzeugen**
(TypeScript, Biome, Vitest und ab M7 die eigene CLI) automatisch prüfen lässt – kein SonarQube,
keine Zusatzwerkzeuge.

Kernaussagen der Arbeit, die hier gelten:
- Wartbarkeit nach **ISO/IEC 25010**: Modularität, Wiederverwendbarkeit, Analysierbarkeit,
  Modifizierbarkeit, Testbarkeit.
- Klassische Metriken sind brauchbar, aber **allein nicht ausreichend** → kombinieren mit
  React-spezifischen Regeln und Linter-Ergebnissen.
- Einzelwerte statt Gesamtindex; Schwellenwerte für Frontends sind kaum belegt → unsere Grenzen
  sind **Projektregeln** (änderbar per ADR).

## 1. Automatisch geprüfte Grenzen (neuer Code)

| Größe | Grenze | Werkzeug | Ab |
|---|---|---|---|
| Typfehler | 0 (`strict: true`) | `tsc` | P01 |
| Linter-Meldungen | 0 Fehler, 0 Warnungen | `biome ci` / `pnpm lint` | P01 |
| Kognitive Komplexität pro Funktion | ≤ 15 | Biome `noExcessiveCognitiveComplexity` | P01 |
| `any` | verboten | Biome `noExplicitAny` | P01 |
| Typdefinitionen | `type` statt `interface` | Biome `useConsistentTypeDefinitions` | P01 |
| Tests | alle grün, inkl. Golden-Tests | Vitest | P01 |
| Zyklomatische Komplexität, Zeilen, Parameter, JSX-Tiefe je Komponente/Funktion | Schwellenwerte des Tools selbst (`qualityMetrics`) – kein Fehler-Icon erlaubt | eigene CLI (`pnpm quality:self`) | M7 |

**Ausnahme:** Übernommener Altcode in `packages/core/src/legacy/` hält diese Grenzen nicht ein und
wird per Biome-Override ausgenommen (Leitplanke „Kern unverändert“).

## 2. React-Regeln (Konvention, im Review geprüft)

Aus dem React-Smell-Katalog der Arbeit nur das, was für modernes React mit Funktionskomponenten und
Hooks noch relevant ist:

| Regel | Warum |
|---|---|
| Komponenten klein halten (≈ ≤ 120 Zeilen), sonst aufteilen | Large Component |
| ≤ 6 Props, sonst Objekt-Prop oder Aufteilung | Too Many Props |
| Geteilter Zustand über Jotai-Atome statt Durchreichen über > 2 Ebenen | Prop Drilling |
| DOM-Zugriffe nur in klar abgegrenzten Hooks (Zoom, Messen, CodeMirror) | Direct DOM Manipulation |
| Kein `dangerouslySetInnerHTML` | Sicherheit |
| Keine Funktionen, die JSX liefern, außer Komponenten | gleiche Regel, die das Tool selbst prüft |
| `useEffect` nur zur Synchronisation mit Externem, nicht für abgeleitete Werte | heutige React-Empfehlung |

Ab M7 prüft `pnpm quality:self` den eigenen Code mit dem eigenen Kern; die Icons des Tools
(Schwellenwerte, „Funktion liefert JSX“) decken einen Teil dieser Regeln automatisch ab.

## 3. Testbarkeit

- Logik (Kern-Regeln, Atome, Hilfsfunktionen) ist ohne DOM testbar und wird mit Verhaltenstests
  abgedeckt; jede interaktive Komponente hat mindestens einen Verhaltenstest.
- Keine Abdeckungs-Prozentziele (würden ein zusätzliches Werkzeug erfordern). Stattdessen:
  Definition of Done verlangt Tests für neue Logik (`01-ziele-und-scope.md` §5).
