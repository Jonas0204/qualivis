/**
 * A file could not be read (moved, deleted or not readable). The legacy app stopped silently;
 * here the error is logged and the upload view stays usable.
 */
export const logReadError = (error: unknown) => {
  // biome-ignore lint/suspicious/noConsole: read errors are logged, not shown (user decision)
  console.error('Reading files failed:', error);
};
