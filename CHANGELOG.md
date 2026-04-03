# Changelog

All notable changes to this project will be documented in this file.

## 2026-04-03

- Bug fixes
  - Fixed `server.js` fallback route to serve `index.html` instead of missing `convert.html`
  - Fixed YouTube URL parsing for common `www.youtube.com` and `m.youtube.com` links
  - Improved YouTube parsing for `shorts`, `embed`, `live`, raw IDs, and playlist-only rejection
  - Removed duplicate settings event handlers for preset and JPG quality updates
  - Fixed hero header overflow so the language dropdown menu is fully visible
  - Fixed clipped buttons in the YouTube resolution cards by switching to a more flexible actions layout

- YouTube module
  - Added richer video details card with detected video ID and per-resolution actions
  - Added per-resolution preview, direct open, and single download buttons
  - Added clearer status and toast feedback for load, preview, and download actions

- Settings
  - Added named preset profiles for YouTube, Instagram Post, Instagram Story, and TikTok Cover
  - Added compatibility mapping for legacy stored preset values
  - Added new setting to make images transparent using the selected background color as the transparency key
  - Transparency now applies to preview rendering and PNG exports

- UI / UX
  - Redesigned the overall interface with a new hero header, stronger card hierarchy, refined buttons, and improved preview framing
  - Improved Settings panel styling with clearer labels, better spacing, and cleaner field presentation
  - Enhanced drag-and-drop states with large active overlays and clearer visual feedback
  - Added toast notifications for success, info, and error states
  - Added lightweight motion for preview refreshes and list item appearance
  - Refined YouTube card layout for better button alignment and more compact metadata

- Docs
  - Clarified README quick start to distinguish local `index.html` usage from optional Node server usage for `/yt-thumb`

## 2025-10-03

- Guided Tour (onboarding)
  - Overlay + highlight, keyboard focus trap, Escape to close
  - Step indicator (e.g., 1/6), i18n for controls (DE/EN)
  - Help button to start; Settings → Reset tour
- Audit mini‑charts in Admin panel
  - Top events, activity over last 7 days, user distribution
  - Charts react to current audit filters
- Admin panel improvements
  - Strict role‑based visibility (admin only)
  - Pagination, export to JSON/CSV, and clear audit
- Internationalization
  - Completed English labels for tour controls and settings
  - Language switch updates tour controls dynamically
- Authentication UI
  - Sign‑in button and User Switcher commented out per request (logic remains)
  - Session TTL (remember me), throttling, and security Q&A for recovery in code
- UX & Accessibility
  - Password visibility toggle styled and keyboard‑friendly
  - Reduced‑motion respected for animations
- Bug fixes
  - Resolved TDZ error: “Cannot access 't' before initialization” by deferring UI setup

- Global Toolbar Stats
  - New pill in toolbar showing “Images” and “Downloads” counters
  - Counts derived from localStorage history and audit log; updates on exports/downloads
  - Fully localized (DE/EN)
- YouTube Row Localization
  - “Preview” and “Download all” buttons, plus meta text (“Video”, “Thumbnails”), now localized
  - Language switch updates existing list items dynamically
- Theme Toggle Localization
  - Button label switches between “Light/Dark” or “Hell/Dunkel” based on language and current theme
  - Updated aria-label for accessibility
- Docs
  - README updated to describe Guided Tour, Audit Charts, toolbar stats, and current toolbar state

- Settings footer polish & i18n
  - Moved “Reset tour” under a divider into the Settings footer; privacy preference chip + compact button aligned to bottom-right
  - Localized “Changes are saved.” and “Saved.” status hint (DE/EN)

## Earlier

- Client‑side image conversion (SVG → PNG, PNG/JPG)
- YouTube thumbnails loader and batch downloads
- Export history with localStorage persistence
- Dark/light theme and i18n (DE/EN)
