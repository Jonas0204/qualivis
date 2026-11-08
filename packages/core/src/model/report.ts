/** Subset of a typhonjs-escomplex method/class/module report used by the app. */
export type MetricReport = {
  cyclomatic: number;
  paramCount: number;
  sloc: { physical: number; logical: number; jsx?: number };
  halstead: { difficulty: number; bugs: number; [key: string]: unknown };
  maxJsxNesting?: number;
  lineStart?: number;
  lineEnd?: number;
  name?: string;
  aggregate?: MetricReport;
  [key: string]: unknown;
};

/** Full escomplex project report (only `modules` is used by the app). */
export type EscomplexReport = {
  modules: Array<{
    srcPath: string;
    methods: MetricReport[];
    classes: Array<MetricReport & { name: string; methods: MetricReport[] }>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};
