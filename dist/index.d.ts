export interface Options {
    galleries: string[];
    imagesDir: string;
    imagesAssetsDir: string;
    parentGalleries: string[];
    privateGalleries: string[];
    watermarkPath?: string;
    thumbnailSize?: ImageDimensions;
    optimizedSize?: ImageDimensions;
    renameFiles: boolean;
    renameOptions: {
        charsToRename: string[];
        renameBy: string;
    };
    cleanChars?: (string | {
        char: string;
        replaceBy: string;
    })[];
    copyright?: string;
}
export interface ImageObject {
    name: string;
    path: string;
    thumbnailPath: string;
    thumbnailDimensions: ImageDimensions;
    optimizedDimensions: ImageDimensions;
    portrait: boolean;
    galleryId: string;
    file: string;
    alt: string;
    parentId: string;
}
export type ImageDimensions = {
    width: number | undefined;
    height: number | undefined;
    orientation?: number;
    type?: string;
};
export declare function createGalleries(options: Options): Promise<void>;
