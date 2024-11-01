import path from 'path';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { promises as fs, existsSync } from 'node:fs';

export type FolderConfig = {
  folderName: string;
  imageDimensions: ImageDimensions;
  watermarkImagePath?: string;
};

export interface Options {
  galleryNames: string[];
  sourceImagesDir: string;
  outputImagesDir: string;
  parentGalleryNames: string[];
  privateGalleryNames: string[];
  shouldRenameFiles: boolean;
  fileRenameOptions: {
    charsToRename: string[];
    renameBy: string;
  };
  charactersToClean?: (string | { char: string; replaceBy: string })[];
  copyright?: string;
  imageProcessingConfigs: FolderConfig[];
  noWatermarkFolders?: string[];
  referenceIdRequiredGalleries?: string[];
}

export type ImagesFolder<FolderConfig> = {
  [Key in Exclude<keyof FolderConfig, 'folderName'>]: {
    imagePath: string;
    imageDimensions: ImageDimensions;
  };
};

export type ImageDimensions = {
  width: number | undefined;
  height: number | undefined;
  orientation?: number;
  type?: string;
};

export interface ImageObject extends ImagesFolder<FolderConfig> {
  name: string;
  path: string;
  portrait: boolean;
  galleryId: string;
  parentId: string;
  file: string;
  alt: string;
}

export async function createGalleries(options: Options) {
  showLog('Optimizing images....');
  try {
    await Promise.all(
      options.galleryNames.map(async (galleryName) => {
        const imagesDir = path.join(options.sourceImagesDir, galleryName);
        const files = await fs.readdir(imagesDir);
        const dest = path.join(imagesDir + '');

        await renameFiles(files, galleryName, options);

        const newFiles = await fs.readdir(imagesDir);

        await Promise.all(
          options.imageProcessingConfigs.map(async (imageProcessingConfig) => {
            const folderDest = path.join(dest, imageProcessingConfig.folderName);
            await createDir(folderDest);
            await deleteAllFilesInFolder(folderDest);

            await Promise.all(
              newFiles.map(async (file) => {
                if (isImage(file)) {
                  const fileToProcess = path.join(imagesDir, file);
                  const processedFileName = renameFilesForFolders(file, options);
                  const fileDest = path.join(folderDest, getWebpName(processedFileName as string));
                  await createImageFile(galleryName, fileToProcess, fileDest, imageProcessingConfig, options);
                }
              }),
            );
          }),
        );

        const imageObjects = await createImageObjects(
          renameFilesForFolders(newFiles, options),
          imagesDir,
          galleryName,
          options,
        );
        const json = JSON.stringify(imageObjects, null, 2);

        await fs.writeFile(path.join(imagesDir, 'images.json'), json);
      }),
    );

    await setGalleriesImageCover(options);
  } catch (error) {
    console.error('Error optimizing images:', error);
  }
}

async function createImageFile(galleryName: string, file: string, dest: string, config: FolderConfig, options: Options) {
  showLog(`Creating image file for ${file}`);
  showLog(`Destination: ${dest}`);
  const position = { gravity: 'southeast' };
  const { width, height } = await getImageSize(file);
  let isPortrait = false;
  if (width && height) {
    isPortrait = height > width;
  }
  const [newWidth, newHeight] = isPortrait
    ? [config.imageDimensions.height, config.imageDimensions.width]
    : [config.imageDimensions.width, config.imageDimensions.height];
  try {
    const sharpInstance = sharp(file)
      .withMetadata({
        exif: {
          IFD0: {
            Copyright: options.copyright || new Date().getFullYear().toString(),
          },
        },
      })
      .resize(newWidth, newHeight, {
        fit: sharp.fit.cover,
        kernel: sharp.kernel.lanczos3,
      });

    if (config.watermarkImagePath && !options.noWatermarkFolders?.includes(galleryName)) {
      sharpInstance.composite([
        {
          input: config.watermarkImagePath,
          ...position,
        },
      ]);
    }

    await sharpInstance.toFile(dest);
  } catch (err) {
    console.error(`Failed to create image file for ${file}: ${err}`);
  }
}

async function deleteAllFilesInFolder(directoryPath: string) {
  showLog(`Deleting all files in ${directoryPath}`);

  const files = await fs.readdir(directoryPath);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      await fs.unlink(filePath);
    }),
  );
}

async function createDir(dest: string) {
  showLog(`Creating directory in ${dest}`);

  try {
    await fs.mkdir(dest, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dest}: ${err}`);
      throw err;
    }
  }
}

function renameFilesForFolders(
  files: string | string[],
  options: Options,
): string | string[] {
  if (Array.isArray(files) && files.length) {
    return files.map((file) => {
      if (!isImage(file)) {
        return file;
      }
      let name = file;
      options.fileRenameOptions.charsToRename.forEach((char) => {
        name = name.replace(char, options.fileRenameOptions.renameBy);
      });
      return name;
    });
  }
  if (!isImage(files as string)) {
    return files;
  }
  let name = files as string;
  options.fileRenameOptions.charsToRename.forEach((char) => {
    name = name.replace(char, options.fileRenameOptions.renameBy);
  });
  return name;
}

function isImage(file: string) {
  const ext = path.extname(file);
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
}

function getWebpName(file: string) {
  return file.replace(path.extname(file), '.webp');
}

async function getImageSize(path: string): Promise<ImageDimensions> {
  showLog(`Getting image size for ${path}`);

  return new Promise((resolve, reject) => {
    sizeOf(path, (err, dimensions) => {
      if (err) reject(err);
      else resolve(dimensions as ImageDimensions);
    });
  });
}

async function createImageObjects(files: any, dir: string, galleryId: string, options: Options) {
  showLog(`Creating image objects for ${galleryId}`);

  const imageObjects: ImageObject[] = [];
  for (const file of files) {
    if (isImage(file)) {
      const imageAlt = getAltText({}, galleryId);
      let isPortrait = false;
      // const imagesFolder: ImagesFolder<FolderConfig> = {} as ImagesFolder<FolderConfig>;
      const folders: any = {} as any;

      for (const imageProcessingConfig of options.imageProcessingConfigs) {
        const folderPath = path.join(dir, imageProcessingConfig.folderName, file);
        const dimensions = await getImageSize(folderPath.replace('.jpg', '.webp'));
        if (dimensions.width && dimensions.height) {
          isPortrait = dimensions.height > dimensions.width;
        }
        folders[imageProcessingConfig.folderName] = ({
          path: path.join(options.outputImagesDir, galleryId, imageProcessingConfig.folderName, getWebpName(file)),
          dimensions: dimensions,
        });
      }

      const refGalleryId = (
        options.referenceIdRequiredGalleries?.includes(galleryId)
          ? getGalleryIdFromFileName(file, galleryId, options)
          : galleryId
      ) as string;

      const imageObject: ImageObject = {
        ...folders,
        name: file.replace('.jpg', ''),
        path: '',
        portrait: isPortrait,
        galleryId: refGalleryId,
        parentId: galleryId,
        file: file.replace('.jpg', ''),
        alt: imageAlt,
      };

      imageObjects.push(imageObject);
    }
  }
  return imageObjects;
}

function getGalleryIdFromFileName(
  fileName: string,
  fileFolder: string,
  options: Options,
): string | null {
  const imagePaths = options.galleryNames.flatMap((galleryName) =>
    options.imageProcessingConfigs.map((imageProcessingConfig) =>
      path.join(options.sourceImagesDir, galleryName, imageProcessingConfig.folderName, fileName.replace('.jpg', '.webp'))
    )
  ).filter((imagePath) => !imagePath.includes(fileFolder));

  const existingImagePath = imagePaths.find((imagePath) => existsSync(imagePath));

  if (existingImagePath) {
    const normalizedExistingImagePath = path.normalize(existingImagePath);
    const galleryId = options.galleryNames.find((galleryName) =>
      normalizedExistingImagePath.includes(path.normalize(galleryName))
    );
    return galleryId || null;
  }
  return null;
}

function getAltText(exif: { DigitalCreationDate?: any }, galleryId: any) {
  let alt = `${galleryId}`;
  if (exif.DigitalCreationDate) {
    alt += ` ${exif.DigitalCreationDate}`;
  }
  return alt;
}

async function renameFiles(files: any[], gallery: string, options: Options) {
  showLog(`Renaming files in ${gallery}`);

  const promises = files.map(async (file: string) => {
    const oldPath = path.join(options.sourceImagesDir, gallery, file);
    let newName = file;
    options.charactersToClean?.forEach((char) => {
      if (typeof char === 'string') {
        newName = newName.replace(char, '');
      } else {
        newName = newName.replace(char.char, char.replaceBy);
      }
    });

    let newPath = path.join(options.sourceImagesDir, gallery, newName);
    if (newName !== file && existsSync(newPath)) {
      newName = newName.replace('.jpg', '2.jpg');
      newPath = path.join(options.sourceImagesDir, gallery, newName);
      await fs.rename(oldPath, newPath);
    } else {
      await fs.rename(oldPath, newPath);
    }
  });
  return Promise.all(promises);
}

async function setGalleriesImageCover(options: Options) {
  await Promise.all(
    options.parentGalleryNames.map(async (parentGalleryName) => {
      const galleriesChild = options.galleryNames.filter((galleryName) =>
        galleryName.includes(parentGalleryName),
      );

      const galleryImages = await galleriesChild.reduce(async (previousPromise, galleryChild) => {
        const acc = await previousPromise;
        const imagesDir = path.join(options.sourceImagesDir, galleryChild);
        const imagesJson = JSON.parse(
          await fs.readFile(path.join(imagesDir, 'images.json'), 'utf8'),
        );
        if (options.privateGalleryNames.includes(galleryChild)) {
          imagesJson.forEach((image: { thumbnailPath: any; path: any }) => {
            delete image.thumbnailPath;
            delete image.path;
          });
        }

        return { ...acc, [galleryChild]: imagesJson };
      }, Promise.resolve({} as Record<string, any[]>));

      const coverImages = Object.keys(galleryImages).reduce((acc, galleryName) => {
        const coverImage = galleryImages[galleryName].find((image: { portrait: any }) => !image.portrait);
        return { ...acc, [galleryName]: coverImage };
      }, {});

      await fs.writeFile(
        path.join(options.sourceImagesDir, parentGalleryName, 'cover-images.json'),
        JSON.stringify(coverImages, null, 2),
      );
    }),
  );
}

function showLog(...args: any[]) {
  console.log(...args);
}