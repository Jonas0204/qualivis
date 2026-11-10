import { findPackages, type WorkspacePackage } from './packages';
import type { ProjectFiles } from './projectFiles';
import { isTestFile } from './selectFiles';

const contains = (dir: string, path: string) => path.startsWith(`${dir}/`);

/**
 * Packages that can be chosen as the app, sorted by dir: they own a source file that is no test,
 * a file belonging to the deepest package folder that contains it. The workspace root, the
 * package whose folder contains all other package folders, is no candidate; "Whole project"
 * stands for it.
 */
export const findAppCandidates = (project: ProjectFiles): WorkspacePackage[] => {
    const packages = findPackages(project.configs);
    const owners = new Set<WorkspacePackage>();
    for (const { path } of project.sources) {
        if (isTestFile(path)) {
            continue;
        }
        let owner: WorkspacePackage | undefined;
        for (const pkg of packages) {
            if (contains(pkg.dir, path) && (!owner || pkg.dir.length > owner.dir.length)) {
                owner = pkg;
            }
        }
        if (owner) {
            owners.add(owner);
        }
    }
    const isRoot = (pkg: WorkspacePackage) =>
        packages.every(other => other === pkg || contains(pkg.dir, other.dir));
    // findPackages sorts by dir; filtering keeps that order.
    return packages.filter(pkg => owners.has(pkg) && !isRoot(pkg));
};
