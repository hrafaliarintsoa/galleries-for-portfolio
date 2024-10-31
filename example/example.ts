import path from 'path';
import { createGalleries } from '../src';

const galleries = ['sample-gallery', 'with-sub-folder/sub-gallery'];

const imagesModifiedFiles = process.argv.slice(2);
const modifiedGalleries = galleries.filter((gallery) =>
  imagesModifiedFiles.find((modifiedGallery) => modifiedGallery.includes(gallery)),
);

const galleriesToProcess = modifiedGalleries.length > 0 ? modifiedGalleries : galleries;

createGalleries({
  galleries: galleriesToProcess,
  imagesDir: 'example/images',
  imagesAssetsDir: 'images',
  parentGalleries: ['with-sub-folder'],
  privateGalleries: [],
  foldersConfig: [
    {
      name: 'optimized',
      dimensions: { width: 1500, height: 1000 },
    },
    {
      name: 'thumbnails',
      dimensions: { width: 675, height: 450 },
    },
  ],
  renameFiles: true,
  renameOptions: {
    charsToRename: ['image'],
    renameBy: 'PHOTO',
  },
  cleanChars: [],
  copyright: '2024',
});
