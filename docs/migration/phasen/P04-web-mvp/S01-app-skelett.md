# P04-S01 – App-Skelett, Design-Tokens, Schriften

Meilenstein M1 · Abhängig von: P03 abgeschlossen · Umfang M

## Ziel
`apps/web` ist ein lauffähiges Vite-8/React-19-Projekt mit Design-Tokens, lokalen Schriften,
Icon-Komponente und Test-Setup. `pnpm dev` zeigt eine leere Seite mit Hintergrund `#fafafa`.

## Kontext
- `00-grundlagen/03-architektur.md` §2, §9; `04-technologie-stack.md`; `05-konventionen.md` §6
- `01-referenz-altsystem/04-stil-referenz.md` (alle Tokens)
- `anhang/A4` (Vite-Alias `path` → `path-browserify`)
- Altsystem: `legacy/angular/src/index.html`, `src/styles.scss`, `src/assets/favicon.png`

## Dateien
```
apps/web/package.json  tsconfig.json  vite.config.ts  vitest.config.ts  index.html
apps/web/public/favicon.png          (Kopie von legacy/angular/src/assets/favicon.png)
apps/web/src/main.tsx  src/app/App.tsx
apps/web/src/styles/tokens.css  global.css  fonts.css
apps/web/src/ui/Icon.tsx  Icon.module.css  Icon.test.tsx
apps/web/src/test/setup.ts
```

## Schritte
1. `package.json`:
   ```json
   {
     "name": "@qualivis/web",
     "version": "0.0.0",
     "private": true,
     "type": "module",
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview",
       "typecheck": "tsc -p tsconfig.json",
       "test": "vitest run"
     },
     "dependencies": {
       "@fontsource/material-icons": "catalog:",
       "@fontsource/roboto": "catalog:",
       "@qualivis/core": "workspace:*",
       "d3-force": "catalog:",
       "jotai": "catalog:",
       "path-browserify": "catalog:",
       "react": "catalog:",
       "react-dom": "catalog:"
     },
     "devDependencies": {
       "@testing-library/dom": "catalog:",
       "@testing-library/react": "catalog:",
       "@testing-library/user-event": "catalog:",
       "@types/d3-force": "catalog:",
       "@types/node": "catalog:",
       "@types/react": "catalog:",
       "@types/react-dom": "catalog:",
       "@vitejs/plugin-react": "catalog:",
       "jsdom": "catalog:",
       "typescript": "catalog:",
       "vite": "catalog:",
       "vitest": "catalog:"
     }
   }
   ```
2. `tsconfig.json`: `extends ../../tsconfig.base.json`, `lib: ["es2023", "dom", "dom.iterable"]`,
   `types: ["vite/client"]`, `include: ["src", "vite.config.ts", "vitest.config.ts"]`.
   Für `vite.config.ts` werden Node-Typen gebraucht (`node:url`): `types: ["vite/client", "node"]`
   und `@types/node` als devDependency ergänzen (Catalog).
3. `vite.config.ts`:
   ```ts
   import { fileURLToPath } from 'node:url';
   import react from '@vitejs/plugin-react';
   import { defineConfig } from 'vite';

   export default defineConfig({
     base: './',
     plugins: [react()],
     resolve: {
       // Patched legacy deps still require('path'); give them the same POSIX module (ADR-005, A4).
       alias: { path: fileURLToPath(import.meta.resolve('path-browserify')) },
     },
     server: { host: '127.0.0.1', port: 5173, strictPort: true },
     preview: { host: '127.0.0.1', port: 4173, strictPort: true },
     build: { target: 'es2023', sourcemap: true },
   });
   ```
4. `vitest.config.ts`:
   ```ts
   import react from '@vitejs/plugin-react';
   import { defineProject } from 'vitest/config';

   export default defineProject({
     plugins: [react()],
     test: {
       name: 'web',
       environment: 'jsdom',
       include: ['src/**/*.test.{ts,tsx}'],
       setupFiles: ['./src/test/setup.ts'],
     },
   });
   ```
   `src/test/setup.ts`: `afterEach(() => cleanup())` (aus `@testing-library/react`, `vitest`).
   Im Root-`vitest.config.ts` `'apps/web'` zu `projects` hinzufügen.
5. (Kein Shim nötig: Der Alias zeigt auf `path-browserify`, das deshalb auch in `apps/web` steht.)
6. `index.html`: `lang="en"`, `<meta charset="utf-8">`, Viewport-Meta, `<title>Qualivis</title>`,
   `<link rel="icon" type="image/png" href="./favicon.png" sizes="196x196">`, `<div id="root"></div>`,
   `<script type="module" src="/src/main.tsx"></script>`. **Keine** externen Links (Google-CDN entfällt).
7. Styles:
   - `fonts.css`: `@import '@fontsource/roboto/300.css'; @import '@fontsource/roboto/400.css';
     @import '@fontsource/roboto/500.css'; @import '@fontsource/material-icons';`
   - `tokens.css`: `:root { … }` mit **allen** Tokens aus der Stil-Referenz §1 (Namen dort), plus
     Schriftfamilien `--qv-font: Roboto, "Helvetica Neue", sans-serif` und
     `--qv-font-icons: 'Material Icons'`.
   - `global.css`: wie `legacy/angular/src/styles.scss` (html/body 100 % Höhe, `margin 0`,
     `box-sizing` vererbt, Schrift) + `body { background: var(--qv-background); color: var(--qv-text); }`
     + `#root { height: 100%; }`.
   - `main.tsx` importiert `fonts.css`, `tokens.css`, `global.css` in dieser Reihenfolge und rendert
     `<App />` in `StrictMode`.
8. `ui/Icon.tsx`: `export function Icon({ name, className, size }: IconProps)` → `<span
   className={…} aria-hidden="true" style={{ fontSize: size }}>{name}</span>`; CSS wie die
   Material-Icons-Klasse (`font-family: var(--qv-font-icons)`, `font-size 24px`, `line-height 1`,
   `font-feature-settings: 'liga'`, `white-space nowrap`, `display inline-block`, `direction ltr`).
   Test: rendert den Ligatur-Namen als Text, ist `aria-hidden`.
9. `App.tsx`: vorerst `<div className={styles.app} />` (leer).
10. Nutzer bitten: `pnpm install`.

## Akzeptanzkriterien
- [ ] `pnpm dev` → `http://127.0.0.1:5173` zeigt eine Seite mit Hintergrund `#fafafa`, keine
      Konsolenfehler, im Netzwerk-Tab keine Anfragen an fremde Hosts.
- [ ] `pnpm build` erfolgreich; Warnung „Module "path" has been externalized“ erscheint **nicht**.
- [ ] Icon-Test grün; `pnpm check` grün.
- [ ] Auf macOS (Nutzer): `pnpm dev` läuft und lädt nach einer Dateiänderung neu.

## Prüfen
`pnpm check`, `pnpm build`, `pnpm dev` (Browser)

## Fallstricke
- `@fontsource/material-icons` exportiert die Schrift unter dem Namen „Material Icons“ – prüfen
  (DevTools → Computed → font-family des Icons).
- Typecheck von `apps/web` prüft auch den Kern (Workspace-Quelltext, `anhang/A6` F4). Fehler im
  Kern zuerst dort beheben.
- `import.meta.resolve('path-browserify')` in `vite.config.ts` braucht Node ≥ 20.6 (erfüllt). Löst der
  Alias nicht auf: prüfen, dass `path-browserify` in `apps/web/package.json` steht.

## Nicht tun
- Kein Router, keine UI-Bibliothek, kein CSS-Präprozessor.

## Commit-Vorschlag
`feat(web): add Vite + React app skeleton with design tokens and local fonts`
