// CommonJS interop: bundlers (rolldown/Vite 8) may hand us `module.exports` for a default
// import of a Babel-compiled CJS module (exports.default + __esModule), Node/Vitest hand us
// `exports.default`. This returns the real default export in both cases.
export const cjsDefault = <T>(mod: T): T => {
  if (typeof mod === 'function') return mod;
  const inner = (mod as { default?: T } | null)?.default;
  return inner ?? mod;
};
