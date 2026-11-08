# Legacy analysis helpers

Copied 1:1 from `legacy/angular/src/app/helper` (commit a071f27). Do not change behaviour.
Allowed: import paths, type annotations, casts. Behaviour is pinned by the golden test G1.
Known quirks: see `docs/migration/01-referenz-altsystem/02-analyse-kern.md` §6.
Typed under strict (noImplicitAny off); casts mark places where the legacy code relies on
AST shapes. `as any` only where a precise cast would need two nested casts
(`// legacy: untyped Babel access`).
