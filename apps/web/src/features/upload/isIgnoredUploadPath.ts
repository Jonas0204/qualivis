/**
 * True for a file or folder path inside a Python virtual environment (`.venv`). Its packages ship
 * `.d.ts` files (e.g. Playwright) that the legacy parser rejects, which failed the whole analysis;
 * the upload skips them instead (ADR-011 A18).
 */
export const isIgnoredUploadPath = (path: string): boolean => path.split('/').includes('.venv');
