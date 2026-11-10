import posix from 'path-browserify';
import type { SourceFile } from '../analysis/analyzeProject';
import { isRecord, readConfigFile } from './jsonc';

/** Where `paths` targets are resolved from, and the patterns. */
export type PathMapping = { baseDir: string; paths: Readonly<Record<string, readonly string[]>> };

/** An option and the folder of the config file that sets it. */
type Setting<T> = { value: T; dir: string };

/** The options of a config chain that path aliases depend on. */
type AliasOptions = { paths?: Setting<Record<string, string[]>>; baseUrl?: Setting<string> };

type Configs = ReadonlyMap<string, SourceFile>;

const configNames = ['tsconfig.json', 'jsconfig.json'] as const;

/** The folder and all folders above it, nearest first. */
const ancestors = (dir: string): string[] => {
    const parent = posix.dirname(dir);
    return parent === dir ? [dir] : [dir, ...ancestors(parent)];
};

/** Like TypeScript: the nearest folder with a tsconfig.json or jsconfig.json, tsconfig.json first. */
const nearestConfig = (filePath: string, configs: Configs): string | undefined => {
    for (const dir of ancestors(posix.dirname(filePath))) {
        for (const name of configNames) {
            const path = posix.resolve(dir, name);
            if (configs.has(path)) {
                return path;
            }
        }
    }
    return undefined;
};

const readConfig = (path: string, configs: Configs): Record<string, unknown> | undefined => {
    const file = configs.get(path);
    return file && readConfigFile(file);
};

/** Path of the config an `extends` entry names; undefined with a warning if it is not uploaded. */
const extendedConfig = (
    specifier: string,
    fromConfig: string,
    configs: Configs
): string | undefined => {
    // Like TypeScript, anything but a path is a package in node_modules, which the upload lacks.
    if (/^(\.\.?)?\//.test(specifier)) {
        const path = posix.resolve(posix.dirname(fromConfig), specifier);
        if (configs.has(path)) {
            return path;
        }
        // TypeScript adds .json only when the path without it does not exist.
        if (!path.endsWith('.json') && configs.has(`${path}.json`)) {
            return `${path}.json`;
        }
    }
    // biome-ignore lint/suspicious/noConsole: aliases of that config are missing (ADR-019)
    console.warn('Extended config not found:', specifier, fromConfig);
    return undefined;
};

const extendsList = (value: unknown): string[] =>
    (Array.isArray(value) ? value : [value]).filter(item => typeof item === 'string');

const patterns = (paths: Record<string, unknown>): Record<string, string[]> =>
    Object.fromEntries(
        Object.entries(paths).map(([pattern, targets]) => [
            pattern,
            Array.isArray(targets) ? targets.filter(target => typeof target === 'string') : [],
        ])
    );

const ownAliasOptions = (config: Record<string, unknown>, dir: string): AliasOptions => {
    const options = isRecord(config.compilerOptions) ? config.compilerOptions : {};
    const own: AliasOptions = {};
    if (isRecord(options.paths)) {
        own.paths = { value: patterns(options.paths), dir };
    }
    if (typeof options.baseUrl === 'string') {
        own.baseUrl = { value: options.baseUrl, dir };
    }
    return own;
};

/**
 * The alias options of a config and the configs it extends. Like TypeScript, compilerOptions merge
 * flat: the config wins over its bases, a later base over an earlier one.
 */
const aliasOptions = (
    configPath: string,
    configs: Configs,
    chain: readonly string[] = []
): AliasOptions => {
    const nextChain = [...chain, configPath];
    if (chain.includes(configPath)) {
        // biome-ignore lint/suspicious/noConsole: TypeScript reports this as an error as well
        console.warn('Circular extends:', nextChain.join(' → '));
        return {};
    }
    const config = readConfig(configPath, configs);
    if (!config) {
        return {};
    }
    const bases = extendsList(config.extends)
        .map(specifier => extendedConfig(specifier, configPath, configs))
        .filter(base => base !== undefined)
        .map(base => aliasOptions(base, configs, nextChain));
    const merged: AliasOptions = {};
    for (const options of [...bases, ownAliasOptions(config, posix.dirname(configPath))]) {
        Object.assign(merged, options);
    }
    return merged;
};

const toMapping = ({ paths, baseUrl }: AliasOptions): PathMapping | undefined =>
    paths && {
        baseDir: baseUrl ? posix.resolve(baseUrl.dir, baseUrl.value) : paths.dir,
        paths: paths.value,
    };

/** Like TypeScript: a reference names a config file (.json) or a folder with a tsconfig.json. */
const referencedConfigs = (config: Record<string, unknown>, configPath: string): string[] =>
    (Array.isArray(config.references) ? config.references : []).flatMap(reference => {
        if (!isRecord(reference) || typeof reference.path !== 'string') {
            return [];
        }
        const path = posix.resolve(posix.dirname(configPath), reference.path);
        return [path.endsWith('.json') ? path : posix.resolve(path, 'tsconfig.json')];
    });

/**
 * Path aliases that apply to a file: from the nearest tsconfig.json (else jsconfig.json) above it,
 * with `extends` and JSONC, the way TypeScript applies them. Without paths in that chain, the first
 * referenced config with paths applies (Vite templates keep them in tsconfig.app.json). Paths start
 * with '/' and stay absolute; a config outside the upload simply does not exist.
 */
export const pathMappingFor = (
    filePath: string,
    configs: readonly SourceFile[]
): PathMapping | undefined => {
    const byPath: Configs = new Map(configs.map(file => [file.path, file]));
    const configPath = nearestConfig(filePath, byPath);
    if (!configPath) {
        return undefined;
    }
    // An invalid nearest config ends the search (warned once): its aliases are unknown, not absent.
    const config = readConfig(configPath, byPath);
    if (!config) {
        return undefined;
    }
    const own = toMapping(aliasOptions(configPath, byPath));
    if (own) {
        return own;
    }
    for (const reference of referencedConfigs(config, configPath)) {
        // A reference outside the upload yields no aliases and, unlike extends, no warning: it
        // does not break the chain of this config.
        const mapping = toMapping(aliasOptions(reference, byPath));
        if (mapping) {
            return mapping;
        }
    }
    return undefined;
};
