declare module 'path-browserify' {
    type PosixPath = {
        sep: '/';
        dirname(path: string): string;
        extname(path: string): string;
        relative(from: string, to: string): string;
        resolve(...paths: string[]): string;
    };
    const path: PosixPath;
    export default path;
}
