# Obsidian My Hotfixes

Personal utility plugin for small Obsidian quality-of-life fixes.

## Features

- **Hotfix section: Bases first-column freeze**
  - Adds a sticky/fixed first column for Bases table views.
  - Optional fine-tuning for selector, background, offset, z-index, and divider.

## Settings

All settings are in the plugin settings panel and are arranged as foldable sections, one per hotfix.

- **Enable first-column freeze**: master switch for the Bases fix.
- **Target selector**: CSS selector that identifies the Bases table container.
- **Left offset (px)**: optional horizontal offset for the frozen column.
- **Background**: color for the frozen column.
- **z-index**: CSS stack order.
- **Show divider**: draws a divider at the edge of the frozen column.

## BRAT setup

1. In Obsidian install and enable BRAT.
2. In BRAT, add this repository URL (for example `https://github.com/<your-org>/<repo>`).
3. Ensure each GitHub release includes at least these assets:
   - `manifest.json`
   - `main.js`
   - (optional but recommended) `styles.css`
   - `versions.json` is optional for BRAT plugin detection.
4. Publish a release for the version in `manifest.json` and `versions.json`, then refresh BRAT.

## Development

```bash
npm install
npm run build
```

The plugin entry is `main.ts`; run build to regenerate `main.js` for releases.
