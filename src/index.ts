import path from 'path';
import sizeOf from 'image-size';
import sharp from 'sharp';
import { promises as fs, existsSync } from 'node:fs';

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
  cleanChars?: (string | { char: string; replaceBy: string })[];
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

        await createOptimizedDir(dest);
        await createThumbnailsDir(dest);
        await deleteAllFilesInFolder(path.join(dest, '/optimized'));
        await deleteAllFilesInFolder(path.join(dest, '/thumbnails'));

        await Promise.all(
          newFiles.map(async (file) => {
            if (isImage(file)) {
              const fileToOptimize = path.join(imagesDir, file);
              const optThumbFileName = renameFilesForOptimizedAndThumbnails(file, options);
              const fileDest = path.join(
                imagesDir + '/optimized',
                getWebpName(optThumbFileName as string),
              );
              const thumbnailDest = path.join(
                imagesDir + '/thumbnails',
                getWebpName(optThumbFileName as string),
              );
              await createOptimizedFile(fileToOptimize, fileDest, options);
              await createThumbnailFile(fileToOptimize, thumbnailDest, options);
            }
          }),
        );

        const imageObjects = await createImageObjects(
          renameFilesForOptimizedAndThumbnails(newFiles, options),
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

function renameFilesForOptimizedAndThumbnails(
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

  const imageObjects: ImageObject[] = [];
  for (const file of files) {
    if (isImage(file)) {
      const imageThumbnailPath = path.join(dir, 'thumbnails', file);
      const imageOptimizedPath = path.join(dir, 'optimized', file);
      const imageAlt = getAltText({}, galleryId);
      const optimizedDimensions = await getImageSize(imageOptimizedPath.replace('.jpg', '.webp'));
      const thumbnailDimensions = await getImageSize(imageThumbnailPath.replace('.jpg', '.webp'));
      let isPortrait = false;
      if (thumbnailDimensions.width && thumbnailDimensions.height) {
        isPortrait = thumbnailDimensions.height > thumbnailDimensions.width;
      }
      const refGalleryId = (
        !galleryId.includes('home-')
          ? galleryId
          : getGalleryIdFromFileName(file, galleryId, options)
      ) as string;
      imageObjects.push({
        name: file.replace('.jpg', ''),
        path: path.join(options.imagesAssetsDir, galleryId, 'optimized', getWebpName(file)),
        thumbnailPath: path.join(
          options.imagesAssetsDir,
          galleryId,
          'thumbnails',
          getWebpName(file),
        ),
        thumbnailDimensions: thumbnailDimensions,
        optimizedDimensions: optimizedDimensions,
        portrait: isPortrait,
        galleryId: refGalleryId,
        file: file.replace('.jpg', ''),
        alt: imageAlt,
        parentId: galleryId,
      });
    }
  }
  return imageObjects;
}

function getGalleryIdFromFileName(
  fileName: string,
  fileFolder: string,
  options: Options,
): string | null {
  const imagePaths = options.galleries
    .map((gallery) =>
      path.join(options.imagesDir, gallery, 'optimized', fileName.replace('.jpg', '.webp')),
    )
    .filter((imagePath) => !imagePath.includes(fileFolder));
  const existingImagePath = imagePaths.find((imagePath) => existsSync(imagePath));

  if (existingImagePath) {
    const normalizedExistingImagePath = path.normalize(existingImagePath);
    const galleryId = options.galleries.find((gallery) =>
      normalizedExistingImagePath.includes(path.normalize(gallery)),
    );
    return galleryId || null;
  }
  return null;
}

function getAltText(exif: { DigitalCreationDate?: any }, galleryId: any) {
  let alt = `Hajaniaina Rafaliarintsoa ${galleryId}`;
  if (exif.DigitalCreationDate) {
    alt += ` ${exif.DigitalCreationDate}`;
  }
  return alt;
}

async function createOptimizedFile(file: string, dest: string, options: Options) {
  console.log(`Reducing image size of ${file}`);
  console.log(`Destination: ${dest}`);
  const position = { gravity: 'southeast' };
  const { width, height } = await getImageSize(file);
  let isPortrait = false;
  if (width && height) {
    isPortrait = height > width;
  }
  const [newWidth, newHeight] = isPortrait
    ? [options.optimizedSize?.height, options.optimizedSize?.width]
    : [options.optimizedSize?.width, options.optimizedSize?.height];
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

    if (!dest.includes('home-') && options.watermarkPath) {
      sharpInstance.composite([
        {
          input: options.watermarkPath,
          ...position,
        },
      ]);
    }

    await sharpInstance.toFile(dest);
  } catch (err) {
    console.error(`Failed to reduce image size of ${file}: ${err}`);
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

async function createOptimizedDir(dest: string) {
  console.log(`Creating optimized directory in ${dest}`);

  try {
    await fs.mkdir(path.join(dest, 'optimized'), { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dest}: ${err}`);
      throw err;
    }
  }
}

async function createThumbnailsDir(dest: string) {
  console.log(`Creating thumbnails directory in ${dest}`);

  try {
    await fs.mkdir(path.join(dest, 'thumbnails'), { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') {
      console.error(`Failed to create directory ${dest}: ${err}`);
      throw err;
    }
  }
}

async function createThumbnailFile(imagePath: string, thumbnailPath: string, options: Options) {
  console.log(`Creating thumbnail for ${imagePath}`);
  const { width, height } = await getImageSize(imagePath);
  let isPortrait = false;
  if (width && height) {
    isPortrait = height > width;
  }
  const [newWidth, newHeight] = isPortrait
    ? [null, options.thumbnailSize?.height]
    : [options.thumbnailSize?.width, null];
  return sharp(imagePath)
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: sharp.fit.cover,
    })
    .webp({
      quality: 100,
    })
    .toFile(thumbnailPath);
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
