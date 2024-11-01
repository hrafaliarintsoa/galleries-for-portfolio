# Galleries for Portfolio

This library provides a simple way to create and manage galleries for your portfolio.  It supports various image formats and allows for easy customization.

## Features

- Organize images into galleries
- Handle image optimization
- Handle private galleries
- Rename exposed files

## Installation

```bash
npm install @hrafaliarintsoa/galleries-for-portfolio
```

## Usage

See the example in the `example` folder.

```javascript
import { createGalleries } from '@hrafaliarintsoa/galleries-for-portfolio';

const galleries = ['sample-gallery'];

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
```

### Input
```` arduino
images
 └── sample-gallery
     ├── image-1.jpg
     ├── image-2.jpg
     ├── image-3.jpg
     ...
````

### Output
```` arduino
images
 └── sample-gallery
     ├── optimized
     │   ├── PHOTO-1.webp
     │   ├── PHOTO-2.webp
     │   └── ...
     ├── thumbnails
     │   ├── PHOTO-1.webp
     │   ├── PHOTO-2.webp
     │   └── ...
     ├── image-1.jpg
     ├── image-2.jpg
     ├── image-3.jpg
     └── ...
     └── images.JSON
````

### Example of images.JSON
```` json
[
  {
    "name": "PHOTO-1",
    "path": "",
    "portrait": false,
    "galleryId": "sample-gallery",
    "parentId": "sample-gallery",
    "file": "PHOTO-1",
    "alt": "sample-gallery",
    "optimized": {
      "path": "images\\sample-gallery\\optimized\\PHOTO-1.webp",
      "dimensions": {
        "height": 1000,
        "width": 1500,
        "type": "webp"
      }
    },
    "thumbnails": {
      "path": "images\\sample-gallery\\thumbnails\\PHOTO-1.webp",
      "dimensions": {
        "height": 450,
        "width": 675,
        "type": "webp"
      }
    }
  },
  {
    "name": "PHOTO-10",
    "path": "",
    "portrait": false,
    "galleryId": "sample-gallery",
    "parentId": "sample-gallery",
    "file": "PHOTO-10",
    "alt": "sample-gallery",
    "optimized": {
      "path": "images\\sample-gallery\\optimized\\PHOTO-10.webp",
      "dimensions": {
        "height": 1000,
        "width": 1500,
        "type": "webp"
      }
    },
    "thumbnails": {
      "path": "images\\sample-gallery\\thumbnails\\PHOTO-10.webp",
      "dimensions": {
        "height": 450,
        "width": 675,
        "type": "webp"
      }
    }
  },
  ...
]
````

## Options

``` typescript	
interface Options {
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
```

### Remains to be done

- [ ] cjs support

## Real-world example

This website uses this library to generate galleries: [hrafaliarintsoa.com](https://hrafaliarintsoa.com)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
