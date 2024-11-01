import sizeOf from 'image-size';
import { existsSync, promises as fs } from 'node:fs';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';
import {
  createDir,
  createImageObjects,
  deleteAllFilesInFolder,
  getAltText,
  getGalleryIdFromFileName,
  getImageSize,
  getWebpName,
  isImage,
  renameFiles,
  renameFilesForFolders,
  setGalleriesImageCover,
} from './index';

vi.mock('sharp');
vi.mock('node:fs', () => ({
  promises: {
    readdir: vi.fn(),
    writeFile: vi.fn(),
    unlink: vi.fn(),
    mkdir: vi.fn(),
    rename: vi.fn(),
    readFile: vi.fn(),
  },
  existsSync: vi.fn(),
}));
vi.mock('image-size');

const globalOptions = {
  galleryNames: ['gallery1'],
  sourceImagesDir: 'source',
  outputImagesDir: 'output',
  parentGalleryNames: [],
  privateGalleryNames: [],
  shouldRenameFiles: false,
  fileRenameOptions: {
    charsToRename: [],
    renameBy: '',
  },
  imageProcessingConfigs: [
    {
      folderName: 'folder1',
      imageDimensions: { width: 800, height: 600 },
    },
  ],
};

describe('deleteAllFilesInFolder', () => {
  it('should delete all files in the folder', async () => {
    const directoryPath = 'testDir';
    vi.spyOn(fs, 'readdir').mockResolvedValue(
        // @ts-ignore
      ['file1.txt', 'file2.txt'],
    );
    vi.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    await deleteAllFilesInFolder(directoryPath);

    expect(fs.readdir).toHaveBeenCalledWith(directoryPath);
    expect(fs.unlink).toHaveBeenCalledWith(path.join(directoryPath, 'file1.txt'));
    expect(fs.unlink).toHaveBeenCalledWith(path.join(directoryPath, 'file2.txt'));
  });
});

describe('createDir', () => {
  it('should create a directory', async () => {
    const dest = 'testDir';
    vi.spyOn(fs, 'mkdir').mockResolvedValue(undefined);

    await createDir(dest);

    expect(fs.mkdir).toHaveBeenCalledWith(dest, { recursive: true });
  });
});

describe('renameFilesForFolders', () => {
  it('should rename files for folders', () => {
    const files = ['image1.jpg', 'image2.jpg'];
    const options = {
      fileRenameOptions: {
        charsToRename: ['1'],
        renameBy: 'one',
      },
    };

    const result = renameFilesForFolders(files, { ...globalOptions, ...options });

    expect(result).toEqual(['imageone.jpg', 'image2.jpg']);
  });
});

describe('isImage', () => {
  it('should return true for image files', () => {
    expect(isImage('image.jpg')).toBe(true);
    expect(isImage('image.png')).toBe(true);
  });

  it('should return false for non-image files', () => {
    expect(isImage('document.pdf')).toBe(false);
  });
});

describe('getWebpName', () => {
  it('should return the webp name of the file', () => {
    expect(getWebpName('image.jpg')).toBe('image.webp');
  });
});

describe('getImageSize', () => {
  it('should return the size of the image', async () => {
    const dimensions = { width: 800, height: 600 };
    (sizeOf as any).mockImplementation((path: string, callback: any) => {
      console.log('path', path);
      callback(null, dimensions);
    });

    const result = await getImageSize('image.jpg');

    expect(result).toEqual(dimensions);
  });
});

describe('createImageObjects', () => {
  it('should create image objects', async () => {
    const files = ['image1.jpg'];
    const dir = 'testDir';
    const galleryId = 'gallery1';
    const options = {
      imageProcessingConfigs: [
        {
          folderName: 'folder1',
          imageDimensions: { width: 800, height: 600 },
        },
      ],
      outputImagesDir: 'output',
    };

    vi.spyOn(fs, 'readdir').mockResolvedValue([]);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));
    (sizeOf as any).mockImplementation((path: string, callback: any) => {
      console.log('path', path);
      
      callback(null, { width: 800, height: 600 });
    });

    const result = await createImageObjects(files, dir, galleryId, {
      ...globalOptions,
      ...options,
    });

    expect(result).toEqual([
      {
        folder1: {
          path: 'output/gallery1/folder1/image1.webp',
          dimensions: { width: 800, height: 600 },
        },
        name: 'image1',
        path: '',
        portrait: false,
        galleryId: 'gallery1',
        parentId: 'gallery1',
        file: 'image1',
        alt: 'gallery1',
      },
    ]);
  });
});

describe('getGalleryIdFromFileName', () => {
  it('should return the gallery ID from the file name', () => {
    const fileName = 'image1.jpg';
    const galleryId = 'gallery1';

    (existsSync as any).mockReturnValue(true);

    const result = getGalleryIdFromFileName(fileName, galleryId, globalOptions);

    expect(result).toBe(null);
  });
});

describe('getAltText', () => {
  it('should return the alt text', () => {
    const exif = { DigitalCreationDate: '2023-01-01' };
    const galleryId = 'gallery1';

    const result = getAltText(exif, galleryId);

    expect(result).toBe('gallery1 2023-01-01');
  });
});

describe('renameFiles', () => {
  it('should rename files', async () => {
    const files = ['image1.jpg'];
    const gallery = 'gallery1';
    const options = {
      sourceImagesDir: 'source',
      charactersToClean: ['1'],
    };

    vi.spyOn(fs, 'rename').mockResolvedValue(undefined);
    (existsSync as any).mockReturnValue(false);

    await renameFiles(files, gallery, { ...globalOptions, ...options });

    expect(fs.rename).toHaveBeenCalledWith(
      path.join('source', 'gallery1', 'image1.jpg'),
      path.join('source', 'gallery1', 'image.jpg'),
    );
  });
});

describe('setGalleriesImageCover', () => {
  it('should set galleries image cover', async () => {
    const options = {
      parentGalleryNames: ['parentGallery'],
      galleryNames: ['parentGallery', 'childGallery'],
      sourceImagesDir: 'source',
      privateGalleryNames: [],
    };

    vi.spyOn(fs, 'readdir').mockResolvedValue([]);
    vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    vi.spyOn(fs, 'readFile').mockResolvedValue(JSON.stringify([]));

    await setGalleriesImageCover({ ...globalOptions, ...options });

    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join('source', 'parentGallery', 'cover-images.json'),
      expect.any(String),
    );
  });
});
