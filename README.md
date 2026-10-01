# PixelShrink

A small browser-based tool for resizing and compressing images.

## Features

- Resize one or many images
- Keep the original aspect ratio
- Use common size presets
- Export as WebP, JPG or PNG
- Adjust image quality
- See the resulting file size
- Download files individually or as a ZIP
- Dark and light themes
- No image upload server

## How it works

PixelShrink uses the browser Canvas API to resize and export images. Files are handled locally in the browser and are not sent to a backend.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

This project is configured for:

https://mhazeemshafi.github.io/PixelShrink/

Push to the `main` branch and the GitHub Actions workflow in `.github/workflows/deploy.yml` will build and publish the site.

## Stack

- Vite
- JavaScript
- CSS
- Canvas API
- JSZip

## License

MIT
