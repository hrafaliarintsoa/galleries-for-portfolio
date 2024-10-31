import path from 'path';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { promises as fs, existsSync } from 'node:fs';

export type FolderConfig = {
  name: string;
  dimensions: ImageDimensions;
  watermarkPath?: string;
};

export interface Options {
  galleries: string[];
  imagesDir: string;
  imagesAssetsDir: string;
  parentGalleries: string[];
  privateGalleries: string[];
  renameFiles: boolean;
  renameOptions: {
    charsToRename: string[];
    renameBy: string;
  };
  cleanChars?: (string | { char: string; replaceBy: string })[];
  copyright?: string;
  foldersConfig: FolderConfig[];
}

export type ImagesFolder<T extends FolderConfig> = {
  [K in T['name']]: {
    path: string;
    dimensions: ImageDimensions;
  };
};

export interface ImageObject<T extends FolderConfig> {
  name: string;
  path: string;
  portrait: boolean;
  galleryId: string;
  parentId: string;
  file: string;
  alt: string;
  imagesFolder: ImagesFolder<T>;
}

export type ImageDimensions = {
  width: number | undefined;
  height: number | undefined;
  orientation?: number;
  type?: string;
};

export async function createGalleries(options: Options) {
  console.log('Optimizing images....');
  try {
    await Promise.all(
      options.galleries.map(async (gallery) => {
        const imagesDir = path.join(options.imagesDir, gallery);
        const files = await fs.readdir(imagesDir);
        const dest = path.join(imagesDir + '');

        await renameFiles(files, gallery, options);

        const newFiles = await fs.readdir(imagesDir);

        await Promise.all(
          options.foldersConfig.map(async (folderConfig) => {
            const folderDest = path.join(dest, folderConfig.name);
            await createDir(folderDest);
            await deleteAllFilesInFolder(folderDest);

            await Promise.all(
              newFiles.map(async (file) => {
                if (isImage(file)) {
                  const fileToProcess = path.join(imagesDir, file);
                  const processedFileName = renameFilesForFolders(file, options);
                  const fileDest = path.join(folderDest, getWebpName(processedFileName as string));
                  await createImageFile(fileToProcess, fileDest, folderConfig, options);
                }
              }),
            );
          }),
        );

        const imageObjects = await createImageObjects(
          renameFilesForFolders(newFiles, options),
          imagesDir,
          gallery,
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

async function createImageFile(file: string, dest: string, config: { dimensions: ImageDimensions; watermarkPath?: string }, options: Options) {
  console.log(`Creating image file for ${file}`);
  console.log(`Destination: ${dest}`);
  const position = { gravity: 'southeast' };
  const { width, height } = await getImageSize(file);
  let isPortrait = false;
  if (width && height) {
    isPortrait = height > width;
  }
  const [newWidth, newHeight] = isPortrait
    ? [config.dimensions.height, config.dimensions.width]
    : [config.dimensions.width, config.dimensions.height];
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

    if (config.watermarkPath) {
      sharpInstance.composite([
        {
          input: config.watermarkPath,
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
  console.log(`Deleting all files in ${directoryPath}`);

  const files = await fs.readdir(directoryPath);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(directoryPath, file);
      await fs.unlink(filePath);
    }),
  );
}

async function createDir(dest: string) {
  console.log(`Creating directory in ${dest}`);

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
      options.renameOptions.charsToRename.forEach((char) => {
        name = name.replace(char, options.renameOptions.renameBy);
      });
      return name;
    });
  }
  if (!isImage(files as string)) {
    return files;
  }
  let name = files as string;
  options.renameOptions.charsToRename.forEach((char) => {
    name = name.replace(char, options.renameOptions.renameBy);
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
  console.log(`Getting image size for ${path}`);

  return new Promise((resolve, reject) => {
    sizeOf(path, (err, dimensions) => {
      if (err) reject(err);
      else resolve(dimensions as ImageDimensions);
    });
  });
}

async function createImageObjects(files: any, dir: string, galleryId: string, options: Options) {
  console.log(`Creating image objects for ${galleryId}`);

  const imageObjects: ImageObject<FolderConfig>[] = [];
  for (const file of files) {
    if (isImage(file)) {
      const imageAlt = getAltText({}, galleryId);
      let isPortrait = false;
      const imagesFolder: ImagesFolder<FolderConfig> = {} as ImagesFolder<FolderConfig>;

      for (const folderConfig of options.foldersConfig) {
        const folderPath = path.join(dir, folderConfig.name, file);
        const dimensions = await getImageSize(folderPath.replace('.jpg', '.webp'));
        if (dimensions.width && dimensions.height) {
          isPortrait = dimensions.height > dimensions.width;
        }
        imagesFolder[folderConfig.name] = {
          path: path.join(options.imagesAssetsDir, galleryId, folderConfig.name, getWebpName(file)),
          dimensions: dimensions,
        };
      }

      const refGalleryId = (
        !galleryId.includes('home-')
          ? galleryId
          : getGalleryIdFromFileName(file, galleryId, options)
      ) as string;

      const imageObject: ImageObject<FolderConfig> = {
        name: file.replace('.jpg', ''),
        path: '',
        portrait: isPortrait,
        galleryId: refGalleryId,
        parentId: galleryId,
        file: file.replace('.jpg', ''),
        alt: imageAlt,
        imagesFolder: imagesFolder,
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
  const imagePaths = options.galleries.flatMap((gallery) =>
    options.foldersConfig.map((folderConfig) =>
      path.join(options.imagesDir, gallery, folderConfig.name, fileName.replace('.jpg', '.webp'))
    )
  ).filter((imagePath) => !imagePath.includes(fileFolder));

  const existingImagePath = imagePaths.find((imagePath) => existsSync(imagePath));

  if (existingImagePath) {
    const normalizedExistingImagePath = path.normalize(existingImagePath);
    const galleryId = options.galleries.find((gallery) =>
      normalizedExistingImagePath.includes(path.normalize(gallery))
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
  console.log(`Renaming files in ${gallery}`);

  const promises = files.map(async (file: string) => {
    const oldPath = path.join(options.imagesDir, gallery, file);
    let newName = file;
    options.cleanChars?.forEach((char) => {
      if (typeof char === 'string') {
        newName = newName.replace(char, '');
      } else {
        newName = newName.replace(char.char, char.replaceBy);
      }
    });

    let newPath = path.join(options.imagesDir, gallery, newName);
    if (newName !== file && existsSync(newPath)) {
      newName = newName.replace('.jpg', '2.jpg');
      newPath = path.join(options.imagesDir, gallery, newName);
      await fs.rename(oldPath, newPath);
    } else {
      await fs.rename(oldPath, newPath);
    }
  });
  return Promise.all(promises);
}

async function setGalleriesImageCover(options: Options) {
  await Promise.all(
    options.parentGalleries.map(async (gallery) => {
      const galleriesChild = options.galleries.filter((galleryItem) =>
        galleryItem.includes(gallery),
      );

      const images = await galleriesChild.reduce(async (previousPromise, gallery) => {
        const acc = await previousPromise;
        const imagesDir = path.join(options.imagesDir, gallery);
        const imagesJson = JSON.parse(
          await fs.readFile(path.join(imagesDir, 'images.json'), 'utf8'),
        );
        if (options.privateGalleries.includes(gallery)) {
          imagesJson.forEach((image: { thumbnailPath: any; path: any }) => {
            delete image.thumbnailPath;
            delete image.path;
          });
        }

        return { ...acc, [gallery]: imagesJson };
      }, Promise.resolve({} as Record<string, any[]>));

      const coverImages = Object.keys(images).reduce((acc, gallery) => {
        const coverImage = images[gallery].find((image: { portrait: any }) => !image.portrait);
        return { ...acc, [gallery]: coverImage };
      }, {});

      await fs.writeFile(
        path.join(options.imagesDir, gallery, 'cover-images.json'),
        JSON.stringify(coverImages, null, 2),
      );
    }),
  );
}