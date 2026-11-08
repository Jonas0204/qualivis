// The core runs without DOM/Node libs. Only these host globals are used:
// console.* (legacy logging) and setTimeout (yielding in analyzeProjectAsync).
declare const console: {
  error(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  log(...data: unknown[]): void;
};
declare function setTimeout(handler: () => void, timeout?: number): unknown;
