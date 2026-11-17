# Common components

Base UI components of Qualivis (buttons, fields, choices, dialogs, menus, tooltips and the like),
with light and dark mode and a showcase page.

The folder is **not** a workspace package and has no dependencies of its own: only React, native
HTML elements and plain CSS. The layout follows the shadcn/ui idea (the source lives in the repo and
is yours to change), but without Tailwind or Radix.

## Use

```tsx
import '../../common-components/theme.css'; // once, globally
import { Button, Dialog, Field, Input } from '../../common-components';

<Field label="App folder">{props => <Input {...props} />}</Field>
```

- Each component imports its own CSS file, so the host needs a bundler that loads CSS (Vite does).
- The host page loads the Material Icons font (the web app does in `apps/web/src/styles/fonts.css`).
- `Icon` takes a name. Own SVG icons come from an `IconProvider` above it (`icons` maps a name to
  `{ viewBox, content }`) and take precedence over Material; give them a prefix so they do not
  cover a Material name (the graph uses `graph_…`).
- Light or dark mode follows the operating system. `data-color-scheme="light"` or `"dark"` on
  `<html>` or on any element fixes the mode for everything inside.
- React comes from the web app's install (this folder has no `node_modules`): see `tsconfig.json`
  and `vite.config.ts`.

## Showcase

```bash
pnpm showcase
```

Opens http://127.0.0.1:5174 with every component and a switch for light and dark mode
(`?mode=dark` in the URL selects one directly).

## Tokens and dark mode (`theme.css`)

The file sets only base values: fonts, colours (`--colorPrimary`, `--colorBackground`,
`--colorSurface`, `--colorText`, …), radii, control height and shadows. Hover shades, soft backgrounds and overlays are
derived from them with `color-mix()`, so changing for example `--colorPrimary` recolours every
component.

Token names are camelCase and written out in full (`--colorTextMuted`, `--radiusSmall`), without a
prefix. The look is technical and flat: petrol accent from the graph palette, monospace labels,
small radii, system font. Every colour is written once as
`light-dark(light value, dark value)`, so dark mode changes only colours and shadows.

## How a component is built

- One folder per component in `components/` (`Button/Button.tsx`, `Button/Button.css`, later
  `Button/__tests__/`), exported again from `index.ts`.
- Its CSS sits in a file of the same name in the same folder (`Button.tsx` imports `./Button.css`), so the
  editor checks and completes it. CSS that several components share lives in `lib/` (e.g.
  `choice.css`).
- Class names start with `cc-`, variants are data attributes (`data-variant="outline"`), colours and
  sizes come only from the tokens in `theme.css`. Variables private to a component start with `--_`.
- Behaviour comes from native elements: `<dialog>` for Dialog and Sheet, the popover API for
  Popover, DropdownMenu and Tooltip (top layer, light dismiss, Escape), `<select>`, `<details>`,
  `<input type="checkbox|radio|range">`. Keyboard handling follows the WAI-ARIA patterns where the
  browser does not do it (tabs, menu).

## Components

Accordion, Alert, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Card, Checkbox, Dialog (also as
alert dialog), DropdownMenu, Field, Icon, Input, Kbd, Label, Meter, Popover, Progress, RadioGroup, Select,
Separator, Sheet, Skeleton, Slider, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle,
ToggleGroup, Tooltip.

Not here yet (add them in the same way when they are needed): calendar/date picker, combobox with
search (command), carousel, charts, context menu, hover card, menubar, navigation menu, pagination,
resizable panels, OTP input, drawer, form validation helpers.
