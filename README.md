# Obsidian My Hotfixes

Personal utility plugin for small Obsidian quality-of-life fixes.

## Features

- **Hotfix section: Bases frozen first column**
  - Adds a custom Bases view named **Frozen Table** with a sticky first column (so horizontal scrolling keeps the first column fixed).
  - Optional fine-tuning for selector, background, offset, z-index, and divider.

## Settings

All settings are in the plugin settings panel and are arranged as foldable sections, one per hotfix.

- **Enable custom frozen table view**: master switch for this hotfix.
- **Background**: background for the sticky first column.
- **First-column width** settings: min/max width and z-index.
- **Show divider**: adds a divider between the first and second columns.

## Usage

1. Open any Base with `table` data and click the view selector in the toolbar.
2. Switch to **Frozen Table**.
3. Enable the hotfix in plugin settings if it is not already on.

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
