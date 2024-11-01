import path from 'path';
import { createGalleries } from '../src';

const galleries = ['sample-gallery', 'with-sub-folder/sub-gallery'];

const imagesModifiedFiles = process.argv.slice(2);
const modifiedGalleries = galleries.filter((gallery) =>
  imagesModifiedFiles.find((modifiedGallery) => modifiedGallery.includes(gallery)),
);

const galleriesToProcess = modifiedGalleries.length > 0 ? modifiedGalleries : galleries;

createGalleries({
  galleryNames: galleriesToProcess,
  sourceImagesDir: 'example/images',
  outputImagesDir: 'images',
  parentGalleryNames: ['with-sub-folder'],
  privateGalleryNames: [],
  imageProcessingConfigs: [
    {
      folderName: 'optimized',
      imageDimensions: { width: 1500, height: 1000 },
    },
    {
      folderName: 'thumbnails',
      imageDimensions: { width: 675, height: 450 },
    },
  ],
  shouldRenameFiles: true,
  fileRenameOptions: {
    charsToRename: ['image'],
    renameBy: 'PHOTO',
  },
  charactersToClean: [],
  copyright: '2024',
  noWatermarkFolders: ['with-sub-folder'],
});
