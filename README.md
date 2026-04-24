# YouTube Thumbnail Converter

Browser-based tool for creating, converting, and exporting thumbnail-ready images.

The app supports SVG to PNG export, PNG/JPG conversion, PDF to DOCX conversion, YouTube thumbnail loading, local export history, presets, theme/language switching, and a polished client-side UI. Most features work directly in the browser; the optional local server improves YouTube thumbnail download handling through a small proxy route.

## Features

- SVG to PNG export
- PNG/JPG conversion with contain, cover, and stretch modes
- PDF to DOCX conversion with text extraction
- Named output presets
  - Original
  - YouTube Thumbnail
  - YouTube HD
  - Instagram Post
  - Instagram Story
  - TikTok Cover
- YouTube thumbnail module
  - Robust URL parsing
  - `youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`
  - `watch`, `shorts`, `embed`, `live`, raw IDs
  - Playlist-only links are rejected intentionally
  - Per-resolution preview, open, and download actions
- Theme switching
- German / English UI
- Local export history via `localStorage`
- Guided tour
- Admin-only audit area with mini charts
- Drag and drop support
- Toast notifications and lightweight UI motion
- Optional transparency setting for preview and PNG export

## Project Structure

```text
index.html    Main UI
app.js        Application logic
style.css     UI styling
server.js     Optional local static server + YouTube thumbnail proxy
CHANGELOG.md  Change history
```

## Quick Start

### Option 1: Open locally

Open `index.html` in a modern browser.

This is enough for:

- SVG export
- PNG/JPG conversion
- local preview and history
- most UI features

### Option 2: Run the local server

Use the local server if you want the proxy-backed YouTube thumbnail download flow.

Typical start:

```bash
node server.js
```

Then open:

```text
http://localhost:5173
```

## Usage

### SVG

1. Select SVG files or drag them into the SVG area.
2. Choose an item from the list.
3. Export the current item or export all as PNG.
4. Use presets and resize mode to control the output.

### Raster Images

1. Select PNG/JPG files or drag them into the raster area.
2. Choose an item from the list.
3. Export as PNG or JPG.
4. Optionally load an image from a direct URL.

### PDF to DOCX

1. Select PDF files or drag them into the PDF area.
2. Choose an item from the list.
3. Export the selected PDF or all loaded PDFs as DOCX files.

### YouTube Thumbnails

1. Paste a YouTube link or video ID.
2. Click `Load`.
3. Use the generated card to:
   - preview thumbnails
   - open the original thumbnail URL
   - download single resolutions
   - download all resolutions

## Settings

The settings panel currently includes:

- checkerboard transparency preview
- named size presets
- resize mode
- JPG background color
- make image transparent
- apply preview background
- JPG quality
- batch with Web Worker toggle

### Transparency Setting

`Make image transparent` uses the selected background color as a transparency key.

This currently affects:

- preview rendering
- PNG export

It does not produce transparency in JPG output, because JPG does not support alpha transparency.

## Language Support

The interface supports:

- Deutsch
- English

Main UI elements, status texts, buttons, and most interaction labels switch dynamically.

## Storage

The app uses `localStorage` for:

- theme
- language
- settings
- export history
- audit data
- local auth/session data used by the client-side admin/auth UI

No dedicated backend database is used.

## Admin / Audit

The project contains a client-side admin panel with:

- audit list
- filters
- pagination
- mini charts

Important:

- this is client-side only
- it is useful for local/demo usage
- it is not secure enough for real multi-user production auth

## Browser Support

Works best in modern browsers:

- Chrome
- Edge
- Firefox
- Safari

Required browser capabilities include:

- canvas
- Blob/Object URLs
- `localStorage`
- modern DOM APIs

## Known Limitations

- Without the local server, some YouTube download actions fall back to opening direct image URLs in tabs.
- External image URLs may fail because of CORS restrictions.
- PDF to DOCX conversion extracts text content. Scanned/image-only PDFs need OCR first.
- The admin/auth system is client-side only and should not be treated as secure backend authentication.
- Transparency removal is color-key based, so results depend on how close the image background is to the selected color.

## Recent Improvements

- improved YouTube URL parsing
- richer YouTube thumbnail cards
- better toast/status feedback
- stronger drag-and-drop feedback
- redesigned UI
- named presets
- transparency setting in the Settings panel

## License

Provided as-is, without warranty.

- Mr_Simple
