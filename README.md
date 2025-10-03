# YouTube Thumbnail Converter

Create crisp YouTube thumbnails in your browser. Convert SVG and raster images (PNG/JPG), fetch thumbnails from YouTube links, keep a local history – everything on-device and privacy‑friendly.

## Live demo

- URL: [https://MrSimpleJS.github.io/YouTube-Converter/](https://you-tube-converter-zeta.vercel.app/)

## Highlights

- 100% client-side (no uploads)
- Multi-language UI (Deutsch / English)
- SVG → PNG export (YouTube presets supported)
- Raster PNG/JPG conversion with contain/cover/stretch
- YouTube thumbnails loader (maxres, hq, etc.)
- Live preview canvas with dimension badge
- Export history stored locally (click to preview)
- Dark/light theme; accessible; reduced-motion aware
- New: Guided Tour (onboarding) with focus trap, step indicator, reset
- New: Admin-only Audit Panel and mini charts (Top events, Activity 7d, Users)

## Quick start

- Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari).
- Pick theme and language from the top bar.
- Use the cards for SVG, raster images, or YouTube.

No backend or installation needed.

## Usage

### 1) SVG → PNG
- Click “📁 Select files” in the SVG card or drag & drop `.svg` files.
- Select an item to preview.
- “Download PNG” (or @2x) exports the current preview; “Export all” processes the list.

Notes:
- The preview respects the chosen preset and resize mode.
- Exports are recorded to the local history.

### 2) Raster images (PNG/JPG)
- Click “📁 Select images” or drag & drop `.png`/`.jpg` files.
- Select an item to preview and convert.
- Export single items to PNG/JPG or export all.
- Or paste a direct image URL and use “Load from URL” for preview and export.

Resize modes:
- Contain (fit fully, letterbox)
- Cover (fill and crop)
- Stretch (no aspect lock)

### 3) YouTube thumbnails
- Paste a YouTube link (watch URL or youtu.be) and click “Load”.
- The app shows a preview (maxres/hq). Use the button to download all resolutions.
- If multiple downloads are blocked, direct URLs open in tabs so you can save them manually.

## Guided Tour (onboarding)

- Starts once for new users (can be restarted via the “Help” button or Settings → “Reset tour”).
- Focus trap keeps keyboard navigation inside the tour; Escape closes.
- Step indicator shows the current position (e.g., 3/6).

## Toolbar note

- By request, the Sign‑in button and User Switcher are currently disabled (commented out). The Help button and Theme toggle remain available.

## Admin • Audit & Charts (client-only)

- Admin panel is visible only to users with role `admin` (client-side role; no server).
- Filters (user/action/date), pagination and export/clear options.
- Mini charts: Top events, last 7 days activity, and user distribution. Charts respond to filters.

Note: For real multi-user security and server-side logging, a backend would be required.

## Settings

- Presets: Original, 1280×720, 1920×1080, 1080×1080, 1080×1920
- Resize mode: contain, cover, stretch
- JPG background color and quality, and whether to apply it to the preview
- Optional: batch via Web Worker (forward compatibility)
- Reset the Guided Tour

## Export history

- Recent exports are stored in `localStorage`.
- Click an entry to preview it on the canvas.
- YouTube entries prefill the YouTube field; external URLs prefill the image URL.
- Pagination and type filters are available.

## Internationalization (i18n)

- Language dropdown: Deutsch / English
- UI and most statuses update instantly

## Accessibility & UX

- Reduced-motion aware; animated title only during actions
- Themed scrollbars; keyboard and screen-reader friendly labels

## Privacy

- Everything is local to your browser; no uploads
- Export history stays on your device (`localStorage`)

## Browser support

- Chromium-based (Chrome, Edge, Brave, Opera)
- Firefox (latest)
- Safari (recent)

Modern features: canvas, Blob URLs, `localStorage`, and smooth scrolling.

## Troubleshooting

- CORS on external images: Some URLs block cross-origin usage. Download locally and load the file.
- Multiple downloads blocked: Allow popups temporarily, or use the direct URLs opened by the app.
- Cross-origin preview export fails: Some operations are restricted; use “Download all” (YouTube) or load assets locally.

## Project structure

```
index.html   # Main UI (no build step needed)
app.js       # App logic (i18n, tour, audit, preview, export, history)
style.css    # Theme and component styles
README.md    # This file
```

## Credits

Made by Mr_Simple

## License

This project is provided as-is, with no warranty. You are free to use and modify it for personal or educational purposes.

