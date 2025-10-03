# Changelog

All notable changes to this project will be documented in this file.

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