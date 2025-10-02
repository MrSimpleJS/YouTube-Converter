# YouTube Thumbnail Converter

Create crisp YouTube thumbnails right in your browser. Convert SVGs and raster images (PNG/JPG), fetch thumbnails from YouTube links, and keep a local history — all on-device and privacy‑friendly.

## Live demo

- URL: [https://MrSimpleJS.github.io/YouTube-Converter/](https://you-tube-converter-zeta.vercel.app/)

## Highlights

- Works entirely in your browser (no uploads)
- Multi-language UI (Deutsch / English)
- SVG → PNG export (YouTube presets supported)
- Raster PNG/JPG conversion with contain/cover/stretch
- YouTube thumbnails loader (maxres, hq, etc.)
- Live preview canvas with dimension badge
- Export history stored locally (click to preview)
- Dark/light theme with custom scrollbars
- Accessible: reduced motion support, keyboard-friendly

## Quick start

- Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
- Choose dark/light theme and language from the top bar.
- Use the cards for SVGs, raster images, or YouTube.

No backend or install needed.

## Usage

### 1) SVG → PNG
- Click "📁 Select files" in the SVG card or drag & drop `.svg` files.
- Select an item in the list to preview it.
- Click "Download PNG" (or @2x) to export.
- "Export all" processes the whole list.

Notes:
- The preview respects the selected resize preset.
- Exports are recorded to the local history.

### 2) Raster images (PNG/JPG)
- Choose "📁 Select images" or drag & drop `.png`/`.jpg` files.
- Select an item to preview and convert.
- Export single items to PNG/JPG or export all.
- Alternatively, paste a direct image URL and press "Load from URL" to preview-only and export from the current preview.

Resize modes:
- Contain (fit fully, letterbox)
- Cover (fill and crop)
- Stretch (no aspect lock)

### 3) YouTube thumbnails
- Paste a YouTube link (watch URL or youtu.be) and click "Load".
- The app shows a preview (maxres/hq). Use the button to download all resolutions.
- If the browser blocks multiple downloads, the app opens the direct URLs so you can save them manually.

## Settings

Open the Settings card to customize:
- Preset sizes: Original, 1280×720, 1920×1080, 1080×1080, 1080×1920
- Resize mode: contain, cover, stretch
- JPG background color and quality
- Apply JPG background to the live preview
- Optional: batch via Web Worker (future compatibility)

## Export history

- The Exports card lists your most recent exports (localStorage).
- Click an entry to preview it on the canvas.
- If a history entry originated from YouTube, the YouTube URL field is auto-filled.
- For external images, the URL field is auto-filled.
- Use pagination and type filters to browse.

## Internationalization (i18n)

- Language dropdown provides Deutsch and English.
- The UI and most status texts update instantly.

## Accessibility & UX

- Smooth scrolling with a reduced-motion fallback
- Themed, minimal scrollbars (light/dark aware)
- Keyboard and screen-reader friendly labels
- Title animations only run during actions and respect reduced motion

## Privacy

- Everything runs locally in your browser. No server uploads.
- Export history is stored in `localStorage` on your device.

## Browser support

- Chromium-based: Chrome, Edge, Brave, Opera (latest)
- Firefox (latest)
- Safari (recent versions)

Modern features used: canvas, Blob URLs, `localStorage`, custom scrollbars, and optional smooth scrolling.

## Troubleshooting

- CORS errors on external images: some URLs block cross-origin use. Download the image and load it locally.
- Multiple downloads blocked: browsers may block popups. Allow popups temporarily or use the proxy-based download if available.
- Preview shows but export fails: For cross-origin sources, some canvas operations are restricted; use Download All (YouTube) or load the file locally.

## Project structure

```
convert.html   # Main UI (no build step needed)
app.js         # App logic (i18n, preview, export, history)
README.md      # This file
```

## Credits

Made by Mr_Simple

## License

This project is provided as-is, with no warranty. You are free to use and modify it for personal or educational purposes.





