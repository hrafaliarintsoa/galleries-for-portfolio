import path from 'path';
import { createGalleries } from '../src';

const galleries = ['sample-gallery'];

const imagesModifiedFiles = process.argv.slice(2);
const modifiedGalleries = galleries.filter((gallery) =>
  imagesModifiedFiles.find((modifiedGallery) => modifiedGallery.includes(gallery)),
);

const galleriesToProcess = modifiedGalleries.length > 0 ? modifiedGalleries : galleries;

createGalleries({
  galleries: galleriesToProcess,
  imagesDir: 'example/images',
  imagesAssetsDir: 'images',
  parentGalleries: [],
  privateGalleries: [],
  watermarkPath: '',
  thumbnailSize: { width: 675, height: 450 },
  optimizedSize: { width: 1500, height: 1000 },
  renameFiles: true,
  renameOptions: {
    charsToRename: ['image'],
    renameBy: 'PHOTO',
  },
  cleanChars: [],
  copyright: '2024',
});
