# Galleries for Portfolio

This library provides a simple way to create and manage galleries for your portfolio.  It supports various image formats and allows for easy customization.

## Installation

```bash
npm install @hrafaliarintsoa/galleries-for-portfolio
```

## Usage

```javascript
import { createGalleries } from '@hrafaliarintsoa/galleries-for-portfolio';

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
    "path": "images/sample-gallery/optimized/PHOTO-1.webp",
    "thumbnailPath": "images/sample-gallery/thumbnails/PHOTO-1.webp",
    "thumbnailDimensions": {
      "height": 439,
      "width": 675,
      "type": "webp"
    },
    "optimizedDimensions": {
      "height": 1000,
      "width": 1500,
      "type": "webp"
    },
    "portrait": false,
    "galleryId": "sample-gallery",
    "file": "PHOTO-1",
    "alt": "Hajaniaina Rafaliarintsoa sample-gallery",
    "parentId": "sample-gallery"
  },
  {
    "name": "PHOTO-2",
    "path": "images/sample-gallery/optimized/PHOTO-2.webp",
    "thumbnailPath": "images/sample-gallery/thumbnails/PHOTO-2.webp",
    "thumbnailDimensions": {
      "height": 450,
      "width": 675,
      "type": "webp"
    },
    "optimizedDimensions": {
      "height": 1000,
      "width": 1500,
      "type": "webp"
    },
    "portrait": false,
    "galleryId": "sample-gallery",
    "file": "PHOTO-2",
    "alt": "Hajaniaina Rafaliarintsoa sample-gallery",
    "parentId": "sample-gallery"
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
```


## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT
