import posix from 'path-browserify';
import { findPackages, type WorkspacePackage } from './packages';
import type { ProjectFiles } from './projectFiles';
import { type PathMapping, pathMappingFor } from './tsconfig';

/** The uploaded source file an import specifier names (exact path), undefined for anything else. */
export type ImportResolver = (specifier: string, fromPath: string) => string | undefined;

type NamedPackage = WorkspacePackage & { name: string };

const fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.d.ts'];
const indexExtensions = ['.ts', '.tsx', '.js', '.jsx'];
const entryFields = ['source', 'module', 'main'] as const;

const isRelative = (specifier: string) =>
    specifier === '.' ||
    specifier === '..' ||
    specifier.startsWith('./') ||
    specifier.startsWith('../');

/**
 * The text a pattern's '*' stands for ('' for a pattern without one), undefined if the specifier
 * does not match. Like TypeScript, a pattern with more than one '*' matches nothing.
 */
const matchPattern = (pattern: string, specifier: string): string | undefined => {
    const star = pattern.indexOf('*');
    if (star === -1) {
        return pattern === specifier ? '' : undefined;
    }
    const prefix = pattern.slice(0, star);
    const suffix = pattern.slice(star + 1);
    const fits =
        !suffix.includes('*') &&
        specifier.length >= prefix.length + suffix.length &&
        specifier.startsWith(prefix) &&
        specifier.endsWith(suffix);
    return fits ? specifier.slice(prefix.length, specifier.length - suffix.length) : undefined;
};

/** Like TypeScript: an exact pattern first, else the one with the longest prefix, else the first. */
const bestPattern = (
    paths: PathMapping['paths'],
    specifier: string
): { targets: readonly string[]; match: string } | undefined => {
    let best: { targets: readonly string[]; match: string; rank: number } | undefined;
    for (const [pattern, targets] of Object.entries(paths)) {
        const match = matchPattern(pattern, specifier);
        if (match === undefined) {
            continue;
        }
        const star = pattern.indexOf('*');
        const rank = star === -1 ? Number.POSITIVE_INFINITY : star;
        if (!best || rank > best.rank) {
            best = { targets, match, rank };
        }
    }
    return best;
};

/**
 * Resolves import specifiers to uploaded source files (exact path), undefined for anything else.
 * Order: relative to the importing file; tsconfig `paths`; workspace package name (with a
 * subpath `<dir>/<sub>`, then `<dir>/src/<sub>`; without one the entry fields, then
 * `<dir>/src/index`, then `<dir>/index`). A step that finds no file hands over to the next. Files
 * match exactly, with one of the known endings added, never by prefix (unlike K12). No barrels
 * (O16), no `exports` tables.
 */
export const createImportResolver = (project: ProjectFiles): ImportResolver => {
    const sources = new Set(project.sources.map(file => file.path));
    const packages = findPackages(project.configs)
        .filter((pkg): pkg is NamedPackage => pkg.name !== undefined)
        // Longest name first; the stable sort keeps the dir order for equal lengths.
        .sort((a, b) => b.name.length - a.name.length);
    // The mapping only depends on the folder of the importing file.
    const mappings = new Map<string, PathMapping | undefined>();

    const findFile = (path: string): string | undefined =>
        [
            path,
            ...fileExtensions.map(extension => `${path}${extension}`),
            ...indexExtensions.map(extension => `${path}/index${extension}`),
        ].find(candidate => sources.has(candidate));

    const mappingFor = (fromPath: string): PathMapping | undefined => {
        const dir = posix.dirname(fromPath);
        if (!mappings.has(dir)) {
            mappings.set(dir, pathMappingFor(fromPath, project.configs));
        }
        return mappings.get(dir);
    };

    const viaPaths = (specifier: string, fromPath: string): string | undefined => {
        const mapping = mappingFor(fromPath);
        const best = mapping && bestPattern(mapping.paths, specifier);
        if (!(mapping && best)) {
            return undefined;
        }
        for (const target of best.targets) {
            // A target may point to a folder outside the upload; then the next one is tried.
            const file = findFile(
                posix.resolve(
                    mapping.baseDir,
                    target.replace('*', () => best.match)
                )
            );
            if (file) {
                return file;
            }
        }
        return undefined;
    };

    const viaPackageName = (specifier: string): string | undefined => {
        const pkg = packages.find(
            ({ name }) => specifier === name || specifier.startsWith(`${name}/`)
        );
        if (!pkg) {
            return undefined;
        }
        const sub = specifier.slice(pkg.name.length + 1);
        if (sub) {
            return (
                findFile(posix.resolve(pkg.dir, sub)) ??
                findFile(posix.resolve(pkg.dir, 'src', sub))
            );
        }
        for (const field of entryFields) {
            const entry = pkg.entries[field];
            const file = entry === undefined ? undefined : findFile(posix.resolve(pkg.dir, entry));
            if (file) {
                return file;
            }
        }
        return (
            findFile(posix.resolve(pkg.dir, 'src/index')) ??
            findFile(posix.resolve(pkg.dir, 'index'))
        );
    };

    return (specifier, fromPath) => {
        if (isRelative(specifier)) {
            // Like TypeScript, paths and package names never apply to a relative specifier.
            return findFile(posix.resolve(posix.dirname(fromPath), specifier));
        }
        return viaPaths(specifier, fromPath) ?? viaPackageName(specifier);
    };
};
