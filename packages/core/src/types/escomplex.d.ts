declare module 'typhonjs-escomplex-project/dist/ESComplexProject' {
    export default class ESComplexProject {
        constructor(pathModule: object, options?: object);
        analyze(modules: Array<{ ast: unknown; srcPath: string }>, options?: object): unknown;
    }
}
