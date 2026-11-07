# P01 – Fundament (Meilenstein M0)

**Ziel:** Das Repository ist umgebaut: Altcode liegt unter `legacy/angular/`, im Root steht ein
leerer, aber vollständig konfigurierter pnpm-Workspace (TypeScript 7, Biome, Vitest), und
`pnpm check` ist grün.

| Schritt | Titel | Umfang |
|---|---|---|
| [S01](S01-arbeitsstand-sichern.md) | Arbeitsstand sichern, Branch anlegen | S |
| [S02](S02-angular-nach-legacy.md) | Angular-Projekt nach `legacy/angular/` verschieben | S |
| [S03](S03-workspace-grundgeruest.md) | Workspace-Grundgerüst (pnpm, TypeScript, Biome, Vitest) | M |
| [S04](S04-installation-und-checks.md) | Installation durch den Nutzer, Checks grün | S |

**Definition of Done der Phase:** `pnpm check` läuft ohne Fehler (noch ohne Tests mit Inhalt außer
einem Platzhaltertest), `legacy/angular/` enthält das unveränderte Altprojekt, der Nutzer hat die
Phase committet.
