"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianHotfixesPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";
var FROZEN_TABLE_VIEW_TYPE = "obsidian-hotfixes-frozen-table";
var DEFAULT_COLUMN_WIDTH_PX = 180;
var MIN_RESIZABLE_COLUMN_WIDTH_PX = 60;
var DRAGGABLE_ORDER_CONFIG_KEY = "obsidian-hotfixes:column-order";
var COLUMN_WIDTHS_CONFIG_KEY = "obsidian-hotfixes:column-widths";
var FROZEN_TABLE_RESIZE_FEATURE_KEY = "obsidian-hotfixes:view-feature-resize";
var FROZEN_TABLE_REORDER_FEATURE_KEY = "obsidian-hotfixes:view-feature-reorder";
var FROZEN_TABLE_LINKS_FEATURE_KEY = "obsidian-hotfixes:view-feature-preserve-links";
var FROZEN_TABLE_EDIT_FEATURE_KEY = "obsidian-hotfixes:view-feature-edit-notes";
var FROZEN_TABLE_WRAP_MODE_FEATURE_KEY = "obsidian-hotfixes:view-feature-wrap-mode";
var FROZEN_TABLE_TRUNCATE_FEATURE_KEY = "obsidian-hotfixes:view-feature-truncate";
var FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY = "obsidian-hotfixes:view-feature-cell-height";
var BASE_VIEW_SWITCHER_SELECTOR = ".obsidian-hotfixes-base-view-switcher";
var DEFAULT_CELL_HEIGHT_PX = 34;
var DEFAULT_FROZEN_TABLE_FEATURES = {
  enableResize: false,
  enableReorder: false,
  preserveLinks: true,
  editableNotes: false,
  wrapMode: "narrow",
  cellHeightPx: DEFAULT_CELL_HEIGHT_PX
};
function getBooleanFeatureValue(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function getStringFeatureValue(value, allowed, fallback) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
}
function getNumberFeatureValue(value, fallback) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "object" && value !== null && "value" in value && typeof value.value === "number") {
    const nestedValue = value.value;
    return Number.isFinite(nestedValue) ? nestedValue : fallback;
  }
  if (typeof value === "object" && value !== null && "value" in value && typeof value.value === "string") {
    const nestedParsed = Number.parseFloat(
      value.value
    );
    return Number.isFinite(nestedParsed) ? nestedParsed : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
function getFrozenTableViewFeatures(config) {
  const legacyWrapMode = getStringFeatureValue(
    config.get(FROZEN_TABLE_WRAP_MODE_FEATURE_KEY),
    ["narrow", "wide"],
    DEFAULT_FROZEN_TABLE_FEATURES.wrapMode
  );
  const truncateByToggle = getBooleanFeatureValue(
    config.get(FROZEN_TABLE_TRUNCATE_FEATURE_KEY),
    legacyWrapMode === "narrow"
  );
  return {
    enableResize: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_RESIZE_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.enableResize
    ),
    enableReorder: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_REORDER_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.enableReorder
    ),
    preserveLinks: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_LINKS_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.preserveLinks
    ),
    editableNotes: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_EDIT_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.editableNotes
    ),
    wrapMode: truncateByToggle ? "narrow" : "wide",
    cellHeightPx: getNumberFeatureValue(
      config.get(FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.cellHeightPx
    )
  };
}
var DEFAULT_SETTINGS = {
  freezeFirstColumn: {
    enabled: false,
    firstColumnMinWidthPx: 220,
    firstColumnMaxWidthPx: 320,
    backgroundColor: "var(--background-primary)",
    zIndex: 4,
    showDivider: true
  },
  baseViewSwitcher: {
    enabled: false,
    showInBaseFiles: true,
    showInEmbeds: true
  }
};
var ObsidianHotfixesPlugin = class extends import_obsidian.Plugin {
  settings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn },
    baseViewSwitcher: { ...DEFAULT_SETTINGS.baseViewSwitcher }
  };
  styleElement = null;
  baseViewSwitcherObserver = null;
  baseViewSwitcherRefreshFrame = null;
  baseViewSwitcherRefreshToken = 0;
  async onload() {
    await this.loadSettings();
    this.applyStyles();
    this.registerSettingTab();
    const registered = this.registerBasesView(FROZEN_TABLE_VIEW_TYPE, {
      name: "Frozen Table",
      icon: "lucide-layout-grid",
      factory: (controller, containerEl) => new FrozenTableBasesView(controller, containerEl, this),
      options: (config) => {
        const featureSettings = getFrozenTableViewFeatures(config);
        return [
          {
            type: "group",
            displayName: "Frozen table options",
            items: [
              {
                type: "toggle",
                key: FROZEN_TABLE_RESIZE_FEATURE_KEY,
                displayName: "Enable column resizing",
                default: featureSettings.enableResize
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_REORDER_FEATURE_KEY,
                displayName: "Enable column reordering",
                default: featureSettings.enableReorder
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_LINKS_FEATURE_KEY,
                displayName: "Preserve inline link rendering",
                default: featureSettings.preserveLinks
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_EDIT_FEATURE_KEY,
                displayName: "Enable note-cell editing",
                default: featureSettings.editableNotes
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_TRUNCATE_FEATURE_KEY,
                displayName: "Truncate long text",
                default: featureSettings.wrapMode === "narrow"
              },
              {
                type: "slider",
                key: FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY,
                displayName: "Cell height (px)",
                default: featureSettings.cellHeightPx,
                instant: true,
                min: 1,
                max: 100,
                step: 1,
                displayFormat: (value) => `${value}px`
              }
            ]
          }
        ];
      }
    });
    if (!registered) {
      console.warn(
        "[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."
      );
    }
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.applyStyles();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.refreshOpenFrozenViews();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.refreshOpenFrozenViews();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof import_obsidian.TFile && file.extension === "base") {
          this.scheduleBaseViewSwitcherRefresh();
        }
      })
    );
    this.registerDomEvent(window, "resize", () => this.refreshOpenFrozenViews());
    this.configureBaseViewSwitcher();
  }
  onunload() {
    this.stopBaseViewSwitcher();
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
  }
  registerSettingTab() {
    this.addSettingTab(new HotfixesSettingTab(this.app, this));
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
      freezeFirstColumn: {
        ...DEFAULT_SETTINGS.freezeFirstColumn,
        ...loaded?.freezeFirstColumn ?? {}
      },
      baseViewSwitcher: {
        ...DEFAULT_SETTINGS.baseViewSwitcher,
        ...loaded?.baseViewSwitcher ?? {}
      }
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.applyStyles();
    this.refreshOpenFrozenViews();
    this.configureBaseViewSwitcher();
  }
  applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = STYLE_ELEMENT_ID;
      document.head.appendChild(this.styleElement);
    }
    const config = this.settings.freezeFirstColumn;
    const minWidth = Math.max(80, config.firstColumnMinWidthPx);
    const maxWidth = Math.max(minWidth, config.firstColumnMaxWidthPx);
    const divider = config.showDivider ? "1px solid var(--background-modifier-border)" : "none";
    this.styleElement.textContent = `
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
  --obsidian-hotfixes-cell-height: ${DEFAULT_CELL_HEIGHT_PX}px;
  --obsidian-hotfixes-first-column-bg: ${config.backgroundColor};
  --obsidian-hotfixes-first-column-z: ${config.zIndex};
}

.obsidian-hotfixes-frozen-bases-root {
  overflow-x: auto;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-view {
  min-width: max-content;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table {
  width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-ui-smaller);
  table-layout: fixed;
  max-width: none;
  min-width: max-content;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table thead th {
  font-weight: 600;
  background: var(--background-secondary);
  position: sticky;
  top: 0;
  z-index: calc(var(--obsidian-hotfixes-first-column-z, 4) + 1);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--background-modifier-border);
  border-right: 1px solid var(--background-modifier-border);
  vertical-align: top;
  box-sizing: border-box;
  min-height: var(--obsidian-hotfixes-cell-height);
}

.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table th,
.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table td {
  height: var(--obsidian-hotfixes-cell-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.obsidian-hotfixes-wrap-wide .obsidian-hotfixes-table th,
.obsidian-hotfixes-wrap-wide .obsidian-hotfixes-table td {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  min-width: var(--obsidian-hotfixes-first-column-min-width);
  width: var(--obsidian-hotfixes-first-column-width, var(--obsidian-hotfixes-first-column-min-width));
  max-width: var(--obsidian-hotfixes-first-column-max-width);
  background: var(--obsidian-hotfixes-first-column-bg);
  z-index: var(--obsidian-hotfixes-first-column-z);
  border-right: ${divider};
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th {
  position: relative;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 10px;
  cursor: col-resize;
  user-select: none;
  z-index: 2;
  touch-action: none;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle::after {
  content: "";
  display: block;
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: var(--background-modifier-border);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-reorder-handle {
  cursor: grab;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th[data-drag-target="true"] {
  outline: 1px solid var(--interactive-accent);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child {
  z-index: calc(var(--obsidian-hotfixes-first-column-z, 4) + 1);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table thead th:first-child {
  left: 0;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table thead tr:first-of-type th:last-child {
  border-right: none;
}

.obsidian-hotfixes-group-row td {
  background: var(--background-secondary);
  color: var(--text-muted);
  font-weight: 600;
  border-top: 1px solid var(--background-modifier-border);
}

.obsidian-hotfixes-table tbody tr.obsidian-hotfixes-data-row:hover td {
  background: var(--background-modifier-hover);
}

.obsidian-hotfixes-note-cell {
  cursor: text;
}

.obsidian-hotfixes-note-cell textarea,
.obsidian-hotfixes-note-cell input {
  width: 100%;
  border: none;
  padding: 0;
  font: inherit;
  background: transparent;
  color: inherit;
  resize: none;
}

.obsidian-hotfixes-frozen-bases-empty {
  color: var(--text-muted);
  padding: 0.75rem 0.5rem;
}

.obsidian-hotfixes-base-view-switcher {
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  pointer-events: auto;
  padding: 6px 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
}

.obsidian-hotfixes-base-view-switcher-button {
  pointer-events: auto;
  height: 26px;
  max-width: 220px;
  padding: 0 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-ui-smaller);
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obsidian-hotfixes-base-view-switcher-button:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.obsidian-hotfixes-base-view-switcher-button[aria-current="true"] {
  border-color: var(--interactive-accent);
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.obsidian-hotfixes-base-view-switcher-button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}

.obsidian-hotfixes-setting-section {
  border: 1px solid var(--background-modifier-border);
  border-radius: 8px;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
}

.obsidian-hotfixes-setting-section summary {
  cursor: pointer;
  font-weight: 600;
  user-select: none;
}

.obsidian-hotfixes-setting-section-content {
  display: grid;
  gap: 0.75rem;
  margin-top: 0.75rem;
}
`.trim();
  }
  refreshOpenFrozenViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (view instanceof FrozenTableBasesView) {
        view.onDataUpdated();
      }
    });
  }
  async updateFreezeFirstColumn(updates) {
    this.settings.freezeFirstColumn = {
      ...this.settings.freezeFirstColumn,
      ...updates
    };
    await this.saveSettings();
  }
  async updateBaseViewSwitcher(updates) {
    this.settings.baseViewSwitcher = {
      ...this.settings.baseViewSwitcher,
      ...updates
    };
    await this.saveSettings();
  }
  configureBaseViewSwitcher() {
    if (this.settings.baseViewSwitcher.enabled) {
      this.startBaseViewSwitcher();
      return;
    }
    this.stopBaseViewSwitcher();
  }
  startBaseViewSwitcher() {
    if (!this.baseViewSwitcherObserver) {
      this.baseViewSwitcherObserver = new MutationObserver(() => {
        this.scheduleBaseViewSwitcherRefresh();
      });
      this.baseViewSwitcherObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
    this.scheduleBaseViewSwitcherRefresh();
  }
  stopBaseViewSwitcher() {
    if (this.baseViewSwitcherRefreshFrame !== null) {
      window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame);
      this.baseViewSwitcherRefreshFrame = null;
    }
    this.baseViewSwitcherRefreshToken++;
    if (this.baseViewSwitcherObserver) {
      this.baseViewSwitcherObserver.disconnect();
      this.baseViewSwitcherObserver = null;
    }
    document.querySelectorAll(BASE_VIEW_SWITCHER_SELECTOR).forEach((row) => row.remove());
  }
  scheduleBaseViewSwitcherRefresh() {
    if (!this.settings.baseViewSwitcher.enabled) {
      return;
    }
    if (this.baseViewSwitcherRefreshFrame !== null) {
      return;
    }
    this.baseViewSwitcherRefreshFrame = window.requestAnimationFrame(() => {
      this.baseViewSwitcherRefreshFrame = null;
      void this.refreshBaseViewSwitchers();
    });
  }
  async refreshBaseViewSwitchers() {
    const token = ++this.baseViewSwitcherRefreshToken;
    if (!this.settings.baseViewSwitcher.enabled) {
      return;
    }
    this.removeOrphanedBaseViewSwitchers();
    const targets = this.findBaseViewSwitcherTargets();
    for (const target of targets) {
      if (token !== this.baseViewSwitcherRefreshToken) {
        return;
      }
      await this.renderBaseViewSwitcher(target);
    }
  }
  removeOrphanedBaseViewSwitchers() {
    document.querySelectorAll(BASE_VIEW_SWITCHER_SELECTOR).forEach((row) => {
      if (!row.nextElementSibling?.matches(".bases-header")) {
        row.remove();
      }
    });
  }
  findBaseViewSwitcherTargets() {
    const settings = this.settings.baseViewSwitcher;
    const targets = [];
    const seenHeaders = /* @__PURE__ */ new Set();
    const headers = document.querySelectorAll(".bases-header");
    headers.forEach((headerEl) => {
      if (seenHeaders.has(headerEl)) {
        return;
      }
      seenHeaders.add(headerEl);
      const embedEl = headerEl.closest(".bases-embed");
      const owner = this.getOwningFileView(headerEl);
      const sourcePath = owner?.file?.path ?? "";
      const isEmbeddedBase = embedEl !== null;
      if (isEmbeddedBase && !settings.showInEmbeds) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }
      if (!isEmbeddedBase && !settings.showInBaseFiles) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }
      const baseFile = embedEl ? this.resolveEmbeddedBaseFile(embedEl, sourcePath) : owner?.file instanceof import_obsidian.TFile && owner.file.extension === "base" ? owner.file : null;
      if (!baseFile) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }
      targets.push({
        headerEl,
        baseFile
      });
    });
    return targets;
  }
  getOwningFileView(element) {
    let owner = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (owner) {
        return;
      }
      const view = leaf.view;
      if (view.containerEl?.contains(element)) {
        owner = {
          containerEl: view.containerEl,
          file: view.file instanceof import_obsidian.TFile ? view.file : null,
          view: leaf.view
        };
      }
    });
    return owner;
  }
  resolveEmbeddedBaseFile(embedEl, sourcePath) {
    const candidateElements = [
      embedEl,
      embedEl.closest(".internal-embed")
    ].filter((element) => element !== null);
    const candidates = [];
    for (const element of candidateElements) {
      candidates.push(
        element.getAttribute("src") ?? "",
        element.getAttribute("data-src") ?? "",
        element.getAttribute("data-path") ?? "",
        element.getAttribute("alt") ?? ""
      );
    }
    for (const candidate of candidates) {
      const linkpath = this.normalizeBaseLinkCandidate(candidate);
      if (!linkpath) {
        continue;
      }
      const directFile = this.app.vault.getFileByPath(linkpath);
      if (directFile?.extension === "base") {
        return directFile;
      }
      const resolved = this.app.metadataCache.getFirstLinkpathDest(
        linkpath,
        sourcePath
      );
      if (resolved instanceof import_obsidian.TFile && resolved.extension === "base") {
        return resolved;
      }
    }
    return null;
  }
  normalizeBaseLinkCandidate(value) {
    let candidate = value.trim();
    if (!candidate) {
      return null;
    }
    try {
      candidate = decodeURIComponent(candidate);
    } catch {
    }
    candidate = candidate.replace(/^!\[\[/, "").replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].split("#")[0].trim();
    if (!candidate) {
      return null;
    }
    return candidate;
  }
  findNativeBaseViewButton(headerEl, viewNames = []) {
    const preferredSelectors = [
      ".bases-toolbar-item.bases-toolbar-views-menu .text-icon-button",
      ".bases-toolbar-views-menu .text-icon-button",
      ".bases-toolbar-item.bases-toolbar-views-menu",
      ".bases-toolbar-views-menu",
      ".bases-toolbar-view-menu",
      ".bases-toolbar-item.mod-view",
      ".bases-toolbar-item.mod-view-menu"
    ];
    for (const selector of preferredSelectors) {
      const found = headerEl.querySelector(selector);
      if (found) {
        return found;
      }
    }
    const normalizedViewNames = new Set(
      viewNames.map((viewName) => this.normalizeText(viewName))
    );
    const candidates = Array.from(
      headerEl.querySelectorAll(
        ".bases-toolbar-item, button, [role='button']"
      )
    ).filter((candidate) => this.isVisibleElement(candidate));
    const matchingText = candidates.find((candidate) => {
      const candidateText = this.normalizeText(
        candidate.innerText || candidate.textContent || ""
      );
      if (!candidateText) {
        return false;
      }
      for (const viewName of normalizedViewNames) {
        if (candidateText === viewName || candidateText.includes(viewName)) {
          return true;
        }
      }
      return false;
    });
    if (matchingText) {
      return matchingText;
    }
    const ariaViewButton = candidates.find(
      (candidate) => this.normalizeText(
        candidate.getAttribute("aria-label") || candidate.getAttribute("title") || ""
      ).toLowerCase().includes("view")
    );
    if (ariaViewButton) {
      return ariaViewButton;
    }
    return candidates[0] ?? null;
  }
  async renderBaseViewSwitcher(target) {
    if (!target.headerEl.isConnected) {
      return;
    }
    const views = await this.readBaseViewDefinitions(target.baseFile);
    if (!target.headerEl.isConnected) {
      return;
    }
    if (views.length < 2) {
      this.removeBaseViewSwitcherBefore(target.headerEl);
      return;
    }
    const parent = target.headerEl.parentElement;
    if (!parent) {
      return;
    }
    let row = this.getBaseViewSwitcherBefore(target.headerEl);
    if (!row) {
      row = document.createElement("div");
      row.className = "obsidian-hotfixes-base-view-switcher";
      parent.insertBefore(row, target.headerEl);
    }
    const nativeViewButton = this.findNativeBaseViewButton(
      target.headerEl,
      views.map((view) => view.name)
    );
    const controller = this.getBaseControllerForHeader(target.headerEl);
    const activeViewName = this.findActiveBaseViewName(
      typeof controller?.viewName === "string" ? controller.viewName : nativeViewButton ? this.normalizeText(
        nativeViewButton.innerText || nativeViewButton.textContent || ""
      ) : null,
      views
    );
    row.empty();
    row.dataset.basePath = target.baseFile.path;
    row.setAttribute("role", "toolbar");
    row.setAttribute("aria-label", "Base views");
    for (const view of views) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "obsidian-hotfixes-base-view-switcher-button";
      button.textContent = view.name;
      button.title = `${target.baseFile.basename}: ${view.name}`;
      button.dataset.viewName = view.name;
      if (view.name === activeViewName) {
        button.setAttribute("aria-current", "true");
      }
      button.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
      });
      button.addEventListener("mousedown", (event) => {
        event.stopPropagation();
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.getAttribute("aria-current") === "true") {
          return;
        }
        void this.switchBaseToView(target.headerEl, view.name);
      });
      row.appendChild(button);
    }
  }
  async readBaseViewDefinitions(baseFile) {
    try {
      const content = await this.app.vault.cachedRead(baseFile);
      const config = (0, import_obsidian.parseYaml)(content);
      if (!config || !Array.isArray(config.views)) {
        return [];
      }
      return config.views.map((view) => ({
        name: typeof view?.name === "string" ? view.name.trim() : ""
      })).filter((view) => view.name.length > 0);
    } catch (error) {
      console.warn(
        "[Obsidian Hotfixes] Failed to read Base views.",
        baseFile.path,
        error
      );
      return [];
    }
  }
  getBaseViewSwitcherBefore(headerEl) {
    const previous = headerEl.previousElementSibling;
    if (previous instanceof HTMLElement && previous.matches(BASE_VIEW_SWITCHER_SELECTOR)) {
      return previous;
    }
    return null;
  }
  removeBaseViewSwitcherBefore(headerEl) {
    this.getBaseViewSwitcherBefore(headerEl)?.remove();
  }
  findActiveBaseViewName(label, views) {
    if (!label) {
      return null;
    }
    const normalizedLabel = this.normalizeText(label);
    const exact = views.find(
      (view) => this.normalizeText(view.name) === normalizedLabel
    );
    if (exact) {
      return exact.name;
    }
    const contained = views.find(
      (view) => normalizedLabel.includes(this.normalizeText(view.name))
    );
    return contained?.name ?? null;
  }
  async switchBaseToView(headerEl, viewName) {
    const row = this.getBaseViewSwitcherBefore(headerEl);
    const viewNames = row ? Array.from(
      row.querySelectorAll(
        ".obsidian-hotfixes-base-view-switcher-button"
      )
    ).map((button) => button.dataset.viewName ?? button.textContent ?? "") : [];
    const controller = this.getBaseControllerForHeader(headerEl);
    if (controller?.selectView && controller.getQueryViewNames?.().includes(viewName)) {
      controller.selectView(viewName);
      window.setTimeout(() => this.scheduleBaseViewSwitcherRefresh(), 80);
      return;
    }
    const nativeViewButton = this.findNativeBaseViewButton(headerEl, viewNames);
    if (!nativeViewButton) {
      console.warn(
        "[Obsidian Hotfixes] Could not find native Bases view menu button."
      );
      return;
    }
    const menuItemsBefore = new Set(
      Array.from(
        document.querySelectorAll(
          ".bases-toolbar-menu-item, .menu-item, [role='menuitem']"
        )
      )
    );
    this.activateElement(nativeViewButton);
    const newMenuItems = await this.waitForNewMenuItems(menuItemsBefore);
    const candidates = newMenuItems.length > 0 ? newMenuItems : Array.from(
      document.querySelectorAll(
        ".bases-toolbar-menu-item, .menu-item, [role='menuitem']"
      )
    );
    const targetItem = this.findMenuItemForView(candidates, viewName);
    if (!targetItem) {
      console.warn(
        "[Obsidian Hotfixes] Could not find Bases view menu item.",
        viewName
      );
      return;
    }
    this.activateElement(targetItem);
    window.setTimeout(() => this.scheduleBaseViewSwitcherRefresh(), 80);
  }
  findMenuItemForView(menuItems, viewName) {
    const normalizedViewName = this.normalizeText(viewName);
    const viewMenuItems = menuItems.filter(
      (item) => item.closest('[data-group="views"]') !== null
    );
    const candidates = viewMenuItems.length > 0 ? viewMenuItems : menuItems;
    const exact = candidates.find(
      (item) => this.normalizeMenuItemText(item) === normalizedViewName
    );
    if (exact) {
      return exact;
    }
    return candidates.find((item) => {
      const rawText = this.normalizeMenuItemText(item);
      const firstLine = rawText.split(/\r?\n/u)[0] ?? "";
      return this.normalizeText(firstLine) === normalizedViewName;
    }) ?? null;
  }
  normalizeText(value) {
    return value.replace(/\s+/g, " ").trim();
  }
  normalizeMenuItemText(item) {
    const nameEl = item.querySelector(".bases-toolbar-menu-item-name");
    return this.normalizeText(
      nameEl?.innerText || nameEl?.textContent || item.innerText || item.textContent || ""
    );
  }
  getBaseControllerForHeader(headerEl) {
    const owner = this.getOwningFileView(headerEl);
    const view = owner?.view;
    const controller = view?.controller;
    if (controller && typeof controller.selectView === "function" && typeof controller.getQueryViewNames === "function") {
      return controller;
    }
    return null;
  }
  isVisibleElement(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  }
  activateElement(element) {
    element.focus();
    const downEventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      button: 0,
      buttons: 1
    };
    const upEventInit = {
      ...downEventInit,
      buttons: 0
    };
    const pointerDownEventInit = {
      ...downEventInit,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    };
    const pointerUpEventInit = {
      ...upEventInit,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true
    };
    try {
      element.dispatchEvent(new PointerEvent("pointerdown", pointerDownEventInit));
      element.dispatchEvent(new MouseEvent("mousedown", downEventInit));
      element.dispatchEvent(new PointerEvent("pointerup", pointerUpEventInit));
      element.dispatchEvent(new MouseEvent("mouseup", upEventInit));
    } catch {
      element.dispatchEvent(new MouseEvent("mousedown", downEventInit));
      element.dispatchEvent(new MouseEvent("mouseup", upEventInit));
    }
    element.dispatchEvent(new MouseEvent("click", upEventInit));
  }
  async waitForNewMenuItems(existingMenuItems, timeoutMs = 600) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await this.nextAnimationFrame();
      const menuItems = Array.from(
        document.querySelectorAll(
          ".bases-toolbar-menu-item, .menu-item, [role='menuitem']"
        )
      ).filter(
        (item) => item.isConnected && !existingMenuItems.has(item) && this.isVisibleElement(item)
      );
      if (menuItems.length > 0) {
        return menuItems;
      }
    }
    return [];
  }
  nextAnimationFrame() {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
};
var FrozenTableBasesView = class extends import_obsidian.BasesView {
  constructor(controller, containerEl, plugin) {
    super(controller);
    this.plugin = plugin;
    this.root = containerEl.createDiv("obsidian-hotfixes-frozen-bases-root");
  }
  hoverPopover = null;
  root;
  activeView = null;
  activeEditor = null;
  currentPropertyOrder = [];
  columnElements = /* @__PURE__ */ new Map();
  headerElements = /* @__PURE__ */ new Map();
  activeColumnWidths = /* @__PURE__ */ new Map();
  activeResizeColumn = null;
  activeResizeColumnIndex = null;
  resizeStartX = 0;
  resizedColumnStartWidth = 0;
  activeResizeWidth = 0;
  activeResizeElement = null;
  activeResizePointerId = null;
  draggingColumn = null;
  activeDragTarget = null;
  onResizePointerMove = (event) => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }
    if (!this.activeResizeColumn || this.activeResizeColumnIndex === null) {
      return;
    }
    event.preventDefault();
    const delta = event.clientX - this.resizeStartX;
    const width = this.clampColumnWidth(
      this.resizedColumnStartWidth + delta,
      this.activeResizeColumnIndex === 0
    );
    this.activeResizeWidth = width;
    this.activeColumnWidths.set(this.activeResizeColumn, width);
    this.applyColumnWidth(this.activeResizeColumn, width);
  };
  onResizePointerUp = () => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }
    if (!this.activeResizeColumn || this.activeResizeColumnIndex === null) {
      return;
    }
    this.activeResizeWidth = this.clampColumnWidth(
      this.activeResizeWidth,
      this.activeResizeColumnIndex === 0
    );
    this.activeColumnWidths.set(this.activeResizeColumn, this.activeResizeWidth);
    this.applyColumnWidth(this.activeResizeColumn, this.activeResizeWidth);
    this.persistColumnWidths();
    this.stopColumnResize();
  };
  startColumnResize = (event, propertyId, index) => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.activeResizeElement = event.currentTarget;
    this.activeResizePointerId = event.pointerId;
    if (this.activeResizeElement && this.activeResizePointerId !== null) {
      try {
        this.activeResizeElement.setPointerCapture(this.activeResizePointerId);
        this.activeResizeElement.style.userSelect = "none";
      } catch {
      }
    }
    this.activeResizeColumn = propertyId;
    this.activeResizeColumnIndex = index;
    this.resizeStartX = event.clientX;
    this.resizedColumnStartWidth = this.getColumnWidth(propertyId, index);
    this.activeResizeWidth = this.resizedColumnStartWidth;
    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", this.onResizePointerMove);
    document.addEventListener("pointerup", this.onResizePointerUp);
  };
  stopColumnResize() {
    if (this.activeResizeElement && this.activeResizePointerId !== null) {
      try {
        this.activeResizeElement.releasePointerCapture(this.activeResizePointerId);
      } catch {
      }
    }
    if (!this.activeResizeColumn) {
      this.activeResizePointerId = null;
      if (this.activeResizeElement) {
        this.activeResizeElement.style.userSelect = "";
      }
      this.activeResizeElement = null;
      return;
    }
    document.removeEventListener("pointermove", this.onResizePointerMove);
    document.removeEventListener("pointerup", this.onResizePointerUp);
    if (this.activeResizeElement) {
      this.activeResizeElement.style.userSelect = "";
    }
    this.activeResizeColumn = null;
    this.activeResizeColumnIndex = null;
    this.activeResizeWidth = 0;
    this.resizeStartX = 0;
    this.resizedColumnStartWidth = 0;
    this.activeResizePointerId = null;
    this.activeResizeElement = null;
    document.body.style.cursor = "";
  }
  type = FROZEN_TABLE_VIEW_TYPE;
  onDataUpdated() {
    this.render();
  }
  render() {
    this.root.empty();
    if (this.activeEditor) {
      this.activeEditor = null;
    }
    const features = getFrozenTableViewFeatures(this.config);
    const cellHeight = Math.max(
      1,
      Math.min(100, Math.round(features.cellHeightPx))
    );
    this.root.className = `obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${features.wrapMode}`;
    this.root.style.setProperty(
      "--obsidian-hotfixes-cell-height",
      `${cellHeight}px`
    );
    this.currentPropertyOrder = [];
    this.columnElements.clear();
    this.headerElements.clear();
    this.activeColumnWidths.clear();
    this.stopColumnResize();
    this.clearDragTargetStyles();
    this.syncColumnWidths();
    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-frozen-bases-empty",
        text: "Frozen table view is disabled. Turn it on in plugin settings."
      });
      return;
    }
    const propertyOrder = this.getPropertyOrder();
    if (!propertyOrder.length) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-frozen-bases-empty",
        text: "No properties available for this Base."
      });
      return;
    }
    propertyOrder.forEach((propertyId, index) => {
      const key = this.getPropertyId(propertyId);
      const width = this.getColumnWidth(key, index);
      this.currentPropertyOrder[index] = key;
      this.activeColumnWidths.set(key, width);
    });
    const view = this.root.createDiv("obsidian-hotfixes-frozen-bases-view");
    this.activeView = view;
    const firstPropertyId = propertyOrder.length > 0 ? this.getPropertyId(propertyOrder[0]) : null;
    if (firstPropertyId) {
      const width = this.getColumnWidth(firstPropertyId, 0);
      view.style.setProperty("--obsidian-hotfixes-first-column-width", `${width}px`);
    }
    const table = view.createEl("table", { cls: "obsidian-hotfixes-table" });
    const colgroup = table.createEl("colgroup");
    const thead = table.createTHead();
    const headerRow = thead.createEl("tr");
    propertyOrder.forEach((propertyId, index) => {
      const propertyKey = this.getPropertyId(propertyId);
      const width = this.getColumnWidth(propertyKey, index);
      const col = colgroup.createEl("col");
      col.style.width = `${width}px`;
      col.style.minWidth = `${width}px`;
      col.style.maxWidth = `${width}px`;
      col.dataset.propertyId = propertyKey;
      this.columnElements.set(propertyKey, col);
      const name = this.config.getDisplayName(propertyId);
      const header = headerRow.createEl("th", { text: name });
      header.dataset.propertyId = propertyKey;
      header.style.width = `${width}px`;
      header.style.minWidth = `${width}px`;
      header.style.maxWidth = `${width}px`;
      if (features.enableReorder) {
        header.addClass("obsidian-hotfixes-frozen-bases-reorder-handle");
        header.draggable = true;
        header.addEventListener(
          "dragstart",
          (event) => this.onColumnDragStart(event, propertyKey)
        );
        header.addEventListener(
          "dragover",
          (event) => this.onColumnDragOver(event, propertyKey)
        );
        header.addEventListener(
          "drop",
          (event) => this.onColumnDrop(event, propertyKey)
        );
        header.addEventListener("dragleave", () => this.clearDragTargetStyles());
        header.addEventListener("dragend", this.onColumnDragEnd);
      }
      this.headerElements.set(propertyKey, header);
      if (features.enableResize) {
        const handle = header.createSpan({
          cls: "obsidian-hotfixes-frozen-bases-resize-handle"
        });
        handle.setAttr("draggable", "false");
        handle.addEventListener(
          "pointerdown",
          (event) => this.startColumnResize(event, propertyKey, index)
        );
      }
    });
    const tbody = table.createTBody();
    const hasVisibleGrouping = this.data.groupedData.length > 1;
    for (const group of this.data.groupedData) {
      const entries = group.entries;
      if (!entries.length) {
        continue;
      }
      if (hasVisibleGrouping) {
        const groupRow = tbody.createEl("tr", { cls: "obsidian-hotfixes-group-row" });
        const keyValue = group.key?.toString() ?? "Ungrouped";
        const groupCell = groupRow.createEl("td", {
          text: keyValue
        });
        groupCell.colSpan = propertyOrder.length;
      }
      for (const entry of entries) {
        const row = tbody.createEl("tr", { cls: "obsidian-hotfixes-data-row" });
        for (let index = 0; index < propertyOrder.length; index++) {
          const propertyId = propertyOrder[index];
          const propertyKey = this.getPropertyId(propertyId);
          const width = this.getColumnWidth(propertyKey, index);
          const cell = row.createEl("td");
          cell.dataset.propertyId = propertyKey;
          cell.style.width = `${width}px`;
          cell.style.minWidth = `${width}px`;
          cell.style.maxWidth = `${width}px`;
          this.renderCellValue(cell, entry, propertyId, features);
        }
      }
    }
  }
  getPropertyId(propertyId) {
    return String(propertyId);
  }
  getDefaultFirstColumnWidth() {
    return Math.max(
      MIN_RESIZABLE_COLUMN_WIDTH_PX,
      this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,
      DEFAULT_COLUMN_WIDTH_PX
    );
  }
  renderCellText(container, textValue) {
    container.empty();
    container.createSpan({ text: textValue });
    if (textValue) {
      container.title = textValue;
    }
  }
  renderLinkFriendlyCell(container, value, textValue, sourcePath) {
    if (!value || typeof textValue !== "string") {
      return false;
    }
    if (value instanceof import_obsidian.UrlValue || value instanceof import_obsidian.LinkValue || this.containsLikelyLinkSyntax(textValue)) {
      container.empty();
      void import_obsidian.MarkdownRenderer.render(
        this.plugin.app,
        textValue,
        container,
        sourcePath,
        this.plugin
      ).catch(() => {
        this.renderCellText(container, textValue);
      });
      return true;
    }
    return false;
  }
  containsLikelyLinkSyntax(value) {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }
    if (/^\[[^\]]+\]\([^\)]*\)$/u.test(normalized)) {
      return true;
    }
    if (this.isLikelyUri(normalized)) {
      return true;
    }
    if (/\[\[[^\]]+\]\]/.test(normalized)) {
      return true;
    }
    return /(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(normalized);
  }
  isLikelyUri(value) {
    return /^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(value);
  }
  renderUriLink(container, href, label) {
    container.empty();
    const link = container.createEl("a", {
      text: label,
      href
    });
    link.addClass("external-link");
    link.addEventListener("click", (event) => {
      if (event.button !== 0 && event.button !== 1) {
        return;
      }
      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    });
    link.addEventListener("mouseover", (event) => {
      this.plugin.app.workspace.trigger("hover-link", {
        event,
        source: "bases",
        hoverParent: this,
        targetEl: link,
        linktext: href
      });
    });
    return;
  }
  renderMarkdownLink(container, value) {
    const match = /^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(
      value.trim()
    );
    if (!match || !match.groups) {
      return false;
    }
    const href = (match.groups["href"] ?? "").trim().replace(/\s+["'][^"']*["']$/, "");
    const label = match.groups["label"]?.trim() || href;
    if (!href || !label || !this.isLikelyUri(href)) {
      return false;
    }
    this.renderUriLink(container, href, label);
    return true;
  }
  renderCellValue(cell, entry, propertyId, featureSettings) {
    const parsed = (0, import_obsidian.parsePropertyId)(propertyId);
    const value = entry.getValue(propertyId);
    const textValue = value ? value.toString() : "";
    cell.classList.remove("obsidian-hotfixes-note-cell");
    if (parsed.type === "file" && parsed.name === "name") {
      const link = cell.createEl("a", {
        text: entry.file.name,
        href: entry.file.path
      });
      link.addClass("internal-link");
      link.addEventListener("click", (event) => {
        if (event.button !== 0 && event.button !== 1) {
          return;
        }
        const pane = import_obsidian.Keymap.isModEvent(event);
        event.preventDefault();
        if (pane === true || pane === false) {
          void this.plugin.app.workspace.openLinkText(
            entry.file.path,
            "",
            Boolean(pane)
          );
          return;
        }
        void this.plugin.app.workspace.openLinkText(
          entry.file.path,
          "",
          pane
        );
      });
      link.addEventListener("mouseover", (event) => {
        this.plugin.app.workspace.trigger("hover-link", {
          event,
          source: "bases",
          hoverParent: this,
          targetEl: link,
          linktext: entry.file.path
        });
      });
      if (textValue) {
        cell.title = textValue;
      }
      return;
    }
    if (value && featureSettings.preserveLinks) {
      const content = cell.createSpan();
      const sourcePath = entry?.file?.path ?? "";
      if (this.renderMarkdownLink(content, textValue)) {
        return;
      }
      if (this.isLikelyUri(textValue)) {
        this.renderUriLink(content, textValue, textValue);
        return;
      }
      const renderedAsLinkFriendly = this.renderLinkFriendlyCell(
        content,
        value,
        textValue,
        sourcePath
      );
      if (!renderedAsLinkFriendly) {
        try {
          const context = new import_obsidian.RenderContext();
          context.hoverPopover = this.hoverPopover;
          value.renderTo(content, context);
        } catch (error) {
          console.warn(
            "[Obsidian Hotfixes] Failed to render value, falling back to plain text.",
            propertyId,
            error
          );
          this.renderCellText(content, textValue);
        }
      }
    } else {
      const content = cell.createSpan();
      this.renderCellText(content, textValue);
    }
    if (parsed.type === "note" && featureSettings.editableNotes) {
      cell.classList.add("obsidian-hotfixes-note-cell");
      cell.addEventListener("dblclick", () => {
        void this.beginEditNoteCell(cell, entry, parsed.name, textValue);
      });
    }
    if (textValue) {
      cell.title = textValue;
    }
  }
  async beginEditNoteCell(cell, entry, propertyName, initialValue) {
    if (this.activeEditor) {
      return;
    }
    const previousValue = cell.innerText;
    const editor = document.createElement("textarea");
    editor.value = initialValue;
    editor.rows = 1;
    const cancel = () => {
      this.activeEditor = null;
      this.render();
    };
    const commit = async () => {
      const nextValue = editor.value;
      if (nextValue !== previousValue) {
        await this.plugin.app.fileManager.processFrontMatter(
          entry.file,
          (frontmatter) => {
            frontmatter[propertyName] = nextValue;
          }
        );
      }
      cancel();
    };
    this.activeEditor = editor;
    cell.empty();
    cell.appendChild(editor);
    editor.focus();
    editor.className = "obsidian-hotfixes-note-editor";
    editor.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });
    editor.addEventListener("blur", () => {
      void commit();
    });
  }
  getSavedColumnWidths() {
    const saved = this.config.get(COLUMN_WIDTHS_CONFIG_KEY);
    const mapped = /* @__PURE__ */ new Map();
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [key, value] of Object.entries(saved)) {
        const width = Number(value);
        if (Number.isFinite(width)) {
          mapped.set(key, width);
        }
      }
    }
    return mapped;
  }
  syncColumnWidths() {
    const loaded = this.getSavedColumnWidths();
    this.activeColumnWidths.clear();
    for (const [key, value] of loaded.entries()) {
      this.activeColumnWidths.set(key, value);
    }
  }
  getColumnWidth(propertyId, index) {
    const fallbackDefault = index === 0 ? this.getDefaultFirstColumnWidth() : DEFAULT_COLUMN_WIDTH_PX;
    const configured = this.activeColumnWidths.get(propertyId);
    const width = typeof configured === "number" ? configured : fallbackDefault;
    return this.clampColumnWidth(width, index === 0);
  }
  clampColumnWidth(width, isFirstColumn = false) {
    const normalized = Math.max(width, MIN_RESIZABLE_COLUMN_WIDTH_PX);
    if (!isFirstColumn) {
      return normalized;
    }
    const settings = this.plugin.settings.freezeFirstColumn;
    const min = Math.max(MIN_RESIZABLE_COLUMN_WIDTH_PX, settings.firstColumnMinWidthPx);
    const max = Math.max(min, settings.firstColumnMaxWidthPx);
    return Math.min(Math.max(normalized, min), max);
  }
  applyColumnWidth(propertyId, width) {
    const isFirstColumn = this.currentPropertyOrder[0] === propertyId;
    const normalized = this.clampColumnWidth(width, isFirstColumn);
    const column = this.columnElements.get(propertyId);
    if (column) {
      column.style.width = `${normalized}px`;
      column.style.minWidth = `${normalized}px`;
      column.style.maxWidth = `${normalized}px`;
    }
    const header = this.headerElements.get(propertyId);
    if (header) {
      header.style.width = `${normalized}px`;
      header.style.minWidth = `${normalized}px`;
      header.style.maxWidth = `${normalized}px`;
    }
    if (isFirstColumn && this.activeView) {
      this.activeView.style.setProperty(
        "--obsidian-hotfixes-first-column-width",
        `${normalized}px`
      );
    }
  }
  persistColumnWidths() {
    const serialized = {};
    for (const [key, value] of this.activeColumnWidths.entries()) {
      serialized[key] = value;
    }
    this.config.set(COLUMN_WIDTHS_CONFIG_KEY, serialized);
  }
  persistColumnOrder(order) {
    this.config.set(
      DRAGGABLE_ORDER_CONFIG_KEY,
      order.map((propertyId) => this.getPropertyId(propertyId))
    );
  }
  safeAttributeValue(value) {
    return value.replace(/"/g, '\\"');
  }
  clearDragTargetStyles() {
    this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach((headerCell) => {
      headerCell.removeAttribute("data-drag-target");
    });
    this.activeDragTarget = null;
  }
  onColumnDragStart(event, propertyId) {
    if (event.button !== 0) {
      return;
    }
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }
    if (event.dataTransfer) {
      this.draggingColumn = propertyId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", propertyId);
    }
  }
  onColumnDragOver(event, propertyId) {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }
    if (!this.draggingColumn || this.draggingColumn === propertyId) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (this.activeDragTarget === propertyId) {
      return;
    }
    this.clearDragTargetStyles();
    this.activeDragTarget = propertyId;
    const headerCell = this.root.querySelector(
      `th[data-property-id="${this.safeAttributeValue(propertyId)}"]`
    );
    if (headerCell) {
      headerCell.setAttribute("data-drag-target", "true");
    }
  }
  onColumnDrop(event, targetPropertyId) {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }
    event.preventDefault();
    if (!this.draggingColumn || this.draggingColumn === targetPropertyId) {
      return;
    }
    const order = this.getCurrentColumnOrder();
    const sourceIndex = order.findIndex(
      (propertyId) => this.getPropertyId(propertyId) === this.draggingColumn
    );
    const targetIndex = order.findIndex(
      (propertyId) => this.getPropertyId(propertyId) === targetPropertyId
    );
    if (sourceIndex === -1 || targetIndex === -1) {
      this.draggingColumn = null;
      this.clearDragTargetStyles();
      return;
    }
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, this.draggingColumn);
    this.persistColumnOrder(order);
    this.draggingColumn = null;
    this.clearDragTargetStyles();
    this.render();
  }
  onColumnDragEnd = () => {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }
    this.draggingColumn = null;
    this.clearDragTargetStyles();
  };
  getCurrentColumnOrder() {
    const explicitOrder = this.config.get(DRAGGABLE_ORDER_CONFIG_KEY);
    if (Array.isArray(explicitOrder)) {
      const available = new Set(this.data.properties.map(
        (propertyId) => this.getPropertyId(propertyId)
      ));
      const seen = /* @__PURE__ */ new Set();
      const normalized = explicitOrder.map(
        (value) => typeof value === "string" ? value : null
      ).filter(
        (value) => value !== null && available.has(this.getPropertyId(value)) && (seen.has(this.getPropertyId(value)) ? false : (seen.add(this.getPropertyId(value)), true))
      );
      if (normalized.length > 0) {
        const normalizedSet = new Set(
          normalized.map((propertyId) => this.getPropertyId(propertyId))
        );
        const missing = this.data.properties.filter(
          (propertyId) => !normalizedSet.has(this.getPropertyId(propertyId))
        );
        return [...normalized, ...missing];
      }
    }
    const explicitOrderFromApi = this.config.getOrder();
    if (explicitOrderFromApi.length > 0) {
      return explicitOrderFromApi;
    }
    return this.data.properties;
  }
  getPropertyOrder() {
    return this.getCurrentColumnOrder();
  }
};
var HotfixesSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  minWidthInput = null;
  maxWidthInput = null;
  backgroundInput = null;
  zIndexInput = null;
  baseFileToggle = null;
  embeddedBaseToggle = null;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  setSectionEnabled(enabled) {
    if (this.minWidthInput) this.minWidthInput.setDisabled(!enabled);
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
    if (this.backgroundInput) this.backgroundInput.setDisabled(!enabled);
    if (this.zIndexInput) this.zIndexInput.setDisabled(!enabled);
  }
  setBaseViewSwitcherSectionEnabled(enabled) {
    if (this.baseFileToggle) this.baseFileToggle.setDisabled(!enabled);
    if (this.embeddedBaseToggle) this.embeddedBaseToggle.setDisabled(!enabled);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian Hotfixes" });
    const details = containerEl.createEl("details", {
      cls: "obsidian-hotfixes-setting-section"
    });
    details.createEl("summary", {
      text: "Bases: Frozen first column"
    });
    const section = details.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content"
    });
    const state = this.plugin.settings.freezeFirstColumn;
    new import_obsidian.Setting(section).setName("Enable custom frozen table view").setDesc(
      "Use a custom Bases view with a sticky first column instead of overlay hacks."
    ).addToggle((toggle) => {
      toggle.setValue(state.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({ enabled: value });
        this.setSectionEnabled(value);
      });
    });
    new import_obsidian.Setting(section).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText((text) => {
      this.minWidthInput = text;
      text.setValue(String(state.firstColumnMinWidthPx));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 80) {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({
          firstColumnMinWidthPx: parsed
        });
      });
    });
    new import_obsidian.Setting(section).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText((text) => {
      this.maxWidthInput = text;
      text.setValue(String(state.firstColumnMaxWidthPx));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed < 80) {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({
          firstColumnMaxWidthPx: parsed
        });
      });
    });
    new import_obsidian.Setting(section).setName("Background").setDesc("Background used behind the frozen first column.").addText((text) => {
      this.backgroundInput = text;
      text.setValue(state.backgroundColor);
      text.setDisabled(!state.enabled);
      text.setPlaceholder("var(--background-primary)");
      text.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({
          backgroundColor: value || DEFAULT_SETTINGS.freezeFirstColumn.backgroundColor
        });
      });
    });
    new import_obsidian.Setting(section).setName("z-index").setDesc("Stacking order for the frozen first column.").addText((text) => {
      this.zIndexInput = text;
      text.setValue(String(state.zIndex));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.setPlaceholder("4");
      text.onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({ zIndex: parsed });
      });
    });
    new import_obsidian.Setting(section).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle((toggle) => {
      toggle.setValue(state.showDivider);
      toggle.setDisabled(!state.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({ showDivider: value });
      });
    });
    this.setSectionEnabled(state.enabled);
    const switcherDetails = containerEl.createEl("details", {
      cls: "obsidian-hotfixes-setting-section"
    });
    switcherDetails.createEl("summary", {
      text: "Bases: Quick view switcher"
    });
    const switcherSection = switcherDetails.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content"
    });
    const switcherState = this.plugin.settings.baseViewSwitcher;
    new import_obsidian.Setting(switcherSection).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle((toggle) => {
      toggle.setValue(switcherState.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateBaseViewSwitcher({ enabled: value });
        this.setBaseViewSwitcherSectionEnabled(value);
      });
    });
    new import_obsidian.Setting(switcherSection).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle((toggle) => {
      this.baseFileToggle = toggle;
      toggle.setValue(switcherState.showInBaseFiles);
      toggle.setDisabled(!switcherState.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateBaseViewSwitcher({ showInBaseFiles: value });
      });
    });
    new import_obsidian.Setting(switcherSection).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle((toggle) => {
      this.embeddedBaseToggle = toggle;
      toggle.setValue(switcherState.showInEmbeds);
      toggle.setDisabled(!switcherState.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateBaseViewSwitcher({ showInEmbeds: value });
      });
    });
    this.setBaseViewSwitcherSectionEnabled(switcherState.enabled);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICB0eXBlIEJhc2VzQ29uZmlnRmlsZSxcbiAgQmFzZXNWaWV3LFxuICB0eXBlIEJhc2VzVmlld0NvbmZpZyxcbiAgSG92ZXJQYXJlbnQsXG4gIEhvdmVyUG9wb3ZlcixcbiAgTGlua1ZhbHVlLFxuICBLZXltYXAsXG4gIFJlbmRlckNvbnRleHQsXG4gIFBhbmVUeXBlLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIE1hcmtkb3duUmVuZGVyZXIsXG4gIFF1ZXJ5Q29udHJvbGxlcixcbiAgU2V0dGluZyxcbiAgVGV4dENvbXBvbmVudCxcbiAgVEZpbGUsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbiAgVXJsVmFsdWUsXG4gIHBhcnNlUHJvcGVydHlJZCxcbiAgcGFyc2VZYW1sLFxuICB0eXBlIEJhc2VzUHJvcGVydHlJZCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IFNUWUxFX0VMRU1FTlRfSUQgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLXJ1bnRpbWUtc3R5bGVzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfVklFV19UWVBFID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tdGFibGVcIjtcbmNvbnN0IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYID0gMTgwO1xuY29uc3QgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFggPSA2MDtcbmNvbnN0IERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4tb3JkZXJcIjtcbmNvbnN0IENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6Y29sdW1uLXdpZHRoc1wiO1xuXG5jb25zdCBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcmVzaXplXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXJlb3JkZXJcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXByZXNlcnZlLWxpbmtzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLWVkaXQtbm90ZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS13cmFwLW1vZGVcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9UUlVOQ0FURV9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXRydW5jYXRlXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfQ0VMTF9IRUlHSFRfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS1jZWxsLWhlaWdodFwiO1xuY29uc3QgQkFTRV9WSUVXX1NXSVRDSEVSX1NFTEVDVE9SID0gXCIub2JzaWRpYW4taG90Zml4ZXMtYmFzZS12aWV3LXN3aXRjaGVyXCI7XG5cbmNvbnN0IERFRkFVTFRfQ0VMTF9IRUlHSFRfUFggPSAzNDtcblxudHlwZSBGcm96ZW5UYWJsZVdyYXBNb2RlID0gXCJuYXJyb3dcIiB8IFwid2lkZVwiO1xuXG5pbnRlcmZhY2UgRnJvemVuVGFibGVWaWV3RmVhdHVyZXMge1xuICBlbmFibGVSZXNpemU6IGJvb2xlYW47XG4gIGVuYWJsZVJlb3JkZXI6IGJvb2xlYW47XG4gIHByZXNlcnZlTGlua3M6IGJvb2xlYW47XG4gIGVkaXRhYmxlTm90ZXM6IGJvb2xlYW47XG4gIHdyYXBNb2RlOiBGcm96ZW5UYWJsZVdyYXBNb2RlO1xuICBjZWxsSGVpZ2h0UHg6IG51bWJlcjtcbn1cblxuY29uc3QgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVM6IEZyb3plblRhYmxlVmlld0ZlYXR1cmVzID0ge1xuICBlbmFibGVSZXNpemU6IGZhbHNlLFxuICBlbmFibGVSZW9yZGVyOiBmYWxzZSxcbiAgcHJlc2VydmVMaW5rczogdHJ1ZSxcbiAgZWRpdGFibGVOb3RlczogZmFsc2UsXG4gIHdyYXBNb2RlOiBcIm5hcnJvd1wiLFxuICBjZWxsSGVpZ2h0UHg6IERFRkFVTFRfQ0VMTF9IRUlHSFRfUFgsXG59O1xuXG5mdW5jdGlvbiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICB2YWx1ZTogdW5rbm93bixcbiAgZmFsbGJhY2s6IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgdmFsdWU6IHVua25vd24sXG4gIGFsbG93ZWQ6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgZmFsbGJhY2s6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKVxuICAgID8gdmFsdWVcbiAgICA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBnZXROdW1iZXJGZWF0dXJlVmFsdWUodmFsdWU6IHVua25vd24sIGZhbGxiYWNrOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKSB7XG4gICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZSh2YWx1ZSkgPyB2YWx1ZSA6IGZhbGxiYWNrO1xuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgIHZhbHVlICE9PSBudWxsICYmXG4gICAgXCJ2YWx1ZVwiIGluIHZhbHVlICYmXG4gICAgdHlwZW9mICh2YWx1ZSBhcyB7IHZhbHVlPzogdW5rbm93biB9KS52YWx1ZSA9PT0gXCJudW1iZXJcIlxuICApIHtcbiAgICBjb25zdCBuZXN0ZWRWYWx1ZSA9ICh2YWx1ZSBhcyB7IHZhbHVlOiBudW1iZXIgfSkudmFsdWU7XG4gICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShuZXN0ZWRWYWx1ZSkgPyBuZXN0ZWRWYWx1ZSA6IGZhbGxiYWNrO1xuICB9XG5cbiAgaWYgKFxuICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJlxuICAgIHZhbHVlICE9PSBudWxsICYmXG4gICAgXCJ2YWx1ZVwiIGluIHZhbHVlICYmXG4gICAgdHlwZW9mICh2YWx1ZSBhcyB7IHZhbHVlPzogdW5rbm93biB9KS52YWx1ZSA9PT0gXCJzdHJpbmdcIlxuICApIHtcbiAgICBjb25zdCBuZXN0ZWRQYXJzZWQgPSBOdW1iZXIucGFyc2VGbG9hdChcbiAgICAgICh2YWx1ZSBhcyB7IHZhbHVlOiBzdHJpbmcgfSkudmFsdWVcbiAgICApO1xuICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUobmVzdGVkUGFyc2VkKSA/IG5lc3RlZFBhcnNlZCA6IGZhbGxiYWNrO1xuICB9XG5cbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIikge1xuICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUZsb2F0KHZhbHVlKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKHBhcnNlZCkgPyBwYXJzZWQgOiBmYWxsYmFjaztcbiAgfVxuXG4gIHJldHVybiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXMoXG4gIGNvbmZpZzogUGljazxCYXNlc1ZpZXdDb25maWcsIFwiZ2V0XCI+XG4pOiBGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyB7XG4gIGNvbnN0IGxlZ2FjeVdyYXBNb2RlID0gZ2V0U3RyaW5nRmVhdHVyZVZhbHVlKFxuICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1dSQVBfTU9ERV9GRUFUVVJFX0tFWSksXG4gICAgW1wibmFycm93XCIsIFwid2lkZVwiXSxcbiAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy53cmFwTW9kZVxuICApO1xuICBjb25zdCB0cnVuY2F0ZUJ5VG9nZ2xlID0gZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9UUlVOQ0FURV9GRUFUVVJFX0tFWSksXG4gICAgbGVnYWN5V3JhcE1vZGUgPT09IFwibmFycm93XCJcbiAgKTtcblxuICByZXR1cm4ge1xuICAgIGVuYWJsZVJlc2l6ZTogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1JFU0laRV9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5lbmFibGVSZXNpemVcbiAgICApLFxuICAgIGVuYWJsZVJlb3JkZXI6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9SRU9SREVSX0ZFQVRVUkVfS0VZKSxcbiAgICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLmVuYWJsZVJlb3JkZXJcbiAgICApLFxuICAgIHByZXNlcnZlTGlua3M6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5wcmVzZXJ2ZUxpbmtzXG4gICAgKSxcbiAgICBlZGl0YWJsZU5vdGVzOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5lZGl0YWJsZU5vdGVzXG4gICAgKSxcbiAgICB3cmFwTW9kZTogdHJ1bmNhdGVCeVRvZ2dsZSA/IFwibmFycm93XCIgOiBcIndpZGVcIixcbiAgICBjZWxsSGVpZ2h0UHg6IGdldE51bWJlckZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX0NFTExfSEVJR0hUX0ZFQVRVUkVfS0VZKSxcbiAgICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLmNlbGxIZWlnaHRQeFxuICAgICksXG4gIH07XG59XG5cbmludGVyZmFjZSBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzIHtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBudW1iZXI7XG4gIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogbnVtYmVyO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgekluZGV4OiBudW1iZXI7XG4gIHNob3dEaXZpZGVyOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgQmFzZVZpZXdTd2l0Y2hlckhvdGZpeFNldHRpbmdzIHtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgc2hvd0luQmFzZUZpbGVzOiBib29sZWFuO1xuICBzaG93SW5FbWJlZHM6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBIb3RmaXhTZXR0aW5ncyB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzO1xuICBiYXNlVmlld1N3aXRjaGVyOiBCYXNlVmlld1N3aXRjaGVySG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogMjIwLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMzIwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiA0LFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICB9LFxuICBiYXNlVmlld1N3aXRjaGVyOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgc2hvd0luQmFzZUZpbGVzOiB0cnVlLFxuICAgIHNob3dJbkVtYmVkczogdHJ1ZSxcbiAgfSxcbn07XG5cbmludGVyZmFjZSBCYXNlVmlld0RlZmluaXRpb24ge1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBCYXNlVmlld1N3aXRjaGVyVGFyZ2V0IHtcbiAgaGVhZGVyRWw6IEhUTUxFbGVtZW50O1xuICBiYXNlRmlsZTogVEZpbGU7XG59XG5cbmludGVyZmFjZSBCYXNlQ29udHJvbGxlckxpa2Uge1xuICB2aWV3TmFtZT86IHN0cmluZztcbiAgZ2V0UXVlcnlWaWV3TmFtZXM/OiAoKSA9PiBzdHJpbmdbXTtcbiAgc2VsZWN0Vmlldz86ICh2aWV3TmFtZTogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgT3duaW5nRmlsZVZpZXcge1xuICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQ7XG4gIGZpbGU6IFRGaWxlIHwgbnVsbDtcbiAgdmlldzogdW5rbm93bjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gICAgYmFzZVZpZXdTd2l0Y2hlcjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmJhc2VWaWV3U3dpdGNoZXIgfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYXNlVmlld1N3aXRjaGVyT2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYXNlVmlld1N3aXRjaGVyUmVmcmVzaEZyYW1lOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYXNlVmlld1N3aXRjaGVyUmVmcmVzaFRva2VuID0gMDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5yZWdpc3RlclNldHRpbmdUYWIoKTtcbiAgICBjb25zdCByZWdpc3RlcmVkID0gdGhpcy5yZWdpc3RlckJhc2VzVmlldyhGUk9aRU5fVEFCTEVfVklFV19UWVBFLCB7XG4gICAgICBuYW1lOiBcIkZyb3plbiBUYWJsZVwiLFxuICAgICAgaWNvbjogXCJsdWNpZGUtbGF5b3V0LWdyaWRcIixcbiAgICAgIGZhY3Rvcnk6IChjb250cm9sbGVyLCBjb250YWluZXJFbCkgPT5cbiAgICAgICAgbmV3IEZyb3plblRhYmxlQmFzZXNWaWV3KGNvbnRyb2xsZXIsIGNvbnRhaW5lckVsLCB0aGlzKSxcbiAgICAgIG9wdGlvbnM6IChjb25maWcpID0+IHtcbiAgICAgICAgY29uc3QgZmVhdHVyZVNldHRpbmdzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXMoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJGcm96ZW4gdGFibGUgb3B0aW9uc1wiLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVzaXppbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZW5hYmxlUmVzaXplLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9SRU9SREVSX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVvcmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy5lbmFibGVSZW9yZGVyLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJQcmVzZXJ2ZSBpbmxpbmUgbGluayByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgbm90ZS1jZWxsIGVkaXRpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3RlcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfVFJVTkNBVEVfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiVHJ1bmNhdGUgbG9uZyB0ZXh0XCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLndyYXBNb2RlID09PSBcIm5hcnJvd1wiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJzbGlkZXJcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9DRUxMX0hFSUdIVF9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJDZWxsIGhlaWdodCAocHgpXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLmNlbGxIZWlnaHRQeCxcbiAgICAgICAgICAgICAgICBpbnN0YW50OiB0cnVlLFxuICAgICAgICAgICAgICAgIG1pbjogMSxcbiAgICAgICAgICAgICAgICBtYXg6IDEwMCxcbiAgICAgICAgICAgICAgICBzdGVwOiAxLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlGb3JtYXQ6ICh2YWx1ZTogbnVtYmVyKSA9PiBgJHt2YWx1ZX1weGAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGlmICghcmVnaXN0ZXJlZCkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIltPYnNpZGlhbiBIb3RmaXhlc10gRnJvemVuIFRhYmxlIHZpZXcgY291bGQgbm90IGJlIHJlZ2lzdGVyZWQuIEJhc2VzIG1heSBiZSBkaXNhYmxlZC5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVCYXNlVmlld1N3aXRjaGVyUmVmcmVzaCgpO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoKCk7XG4gICAgICB9KVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCk7XG4gICAgICAgIHRoaXMuc2NoZWR1bGVCYXNlVmlld1N3aXRjaGVyUmVmcmVzaCgpO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLnZhdWx0Lm9uKFwibW9kaWZ5XCIsIChmaWxlKSA9PiB7XG4gICAgICAgIGlmIChmaWxlIGluc3RhbmNlb2YgVEZpbGUgJiYgZmlsZS5leHRlbnNpb24gPT09IFwiYmFzZVwiKSB7XG4gICAgICAgICAgdGhpcy5zY2hlZHVsZUJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoKCk7XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQod2luZG93LCBcInJlc2l6ZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKSk7XG4gICAgdGhpcy5jb25maWd1cmVCYXNlVmlld1N3aXRjaGVyKCk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICB0aGlzLnN0b3BCYXNlVmlld1N3aXRjaGVyKCk7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLmxvYWRlZCxcbiAgICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICAgIH0sXG4gICAgICBiYXNlVmlld1N3aXRjaGVyOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuYmFzZVZpZXdTd2l0Y2hlcixcbiAgICAgICAgLi4uKGxvYWRlZD8uYmFzZVZpZXdTd2l0Y2hlciA/PyB7fSksXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCk7XG4gICAgdGhpcy5jb25maWd1cmVCYXNlVmlld1N3aXRjaGVyKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5U3R5bGVzKCkge1xuICAgIGlmICghdGhpcy5zdHlsZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQuaWQgPSBTVFlMRV9FTEVNRU5UX0lEO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCh0aGlzLnN0eWxlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCBtaW5XaWR0aCA9IE1hdGgubWF4KDgwLCBjb25maWcuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KTtcbiAgICBjb25zdCBtYXhXaWR0aCA9IE1hdGgubWF4KG1pbldpZHRoLCBjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KTtcbiAgICBjb25zdCBkaXZpZGVyID0gY29uZmlnLnNob3dEaXZpZGVyXG4gICAgICA/IFwiMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKVwiXG4gICAgICA6IFwibm9uZVwiO1xuXG4gICAgdGhpcy5zdHlsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3Qge1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGg6ICR7bWluV2lkdGh9cHg7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aDogJHttYXhXaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1jZWxsLWhlaWdodDogJHtERUZBVUxUX0NFTExfSEVJR0hUX1BYfXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZzogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tejogJHtjb25maWcuekluZGV4fTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IHtcbiAgb3ZlcmZsb3cteDogYXV0bztcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIG1pbi13aWR0aDogbWF4LWNvbnRlbnQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUge1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICBmb250LXNpemU6IHZhcigtLWZvbnQtdWktc21hbGxlcik7XG4gIHRhYmxlLWxheW91dDogZml4ZWQ7XG4gIG1heC13aWR0aDogbm9uZTtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIG1pbi1oZWlnaHQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWNlbGwtaGVpZ2h0KTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtbmFycm93IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aCxcbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLW5hcnJvdyAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICBoZWlnaHQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWNlbGwtaGVpZ2h0KTtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLXdpZGUgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtd2lkZSAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICB3aGl0ZS1zcGFjZTogbm9ybWFsO1xuICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQ6Zmlyc3QtY2hpbGQge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAwO1xuICBtaW4td2lkdGg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpO1xuICB3aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoLCB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKSk7XG4gIG1heC13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZyk7XG4gIHotaW5kZXg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16KTtcbiAgYm9yZGVyLXJpZ2h0OiAke2RpdmlkZXJ9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIHJpZ2h0OiAwO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMHB4O1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuICB6LWluZGV4OiAyO1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGU6OmFmdGVyIHtcbiAgY29udGVudDogXCJcIjtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDA7XG4gIHdpZHRoOiAxcHg7XG4gIGhlaWdodDogMTAwJTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZSB7XG4gIGN1cnNvcjogZ3JhYjtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0PVwidHJ1ZVwiXSB7XG4gIG91dGxpbmU6IDFweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkIHtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIGxlZnQ6IDA7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdHI6Zmlyc3Qtb2YtdHlwZSB0aDpsYXN0LWNoaWxkIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93IHRkIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0Ym9keSB0ci5vYnNpZGlhbi1ob3RmaXhlcy1kYXRhLXJvdzpob3ZlciB0ZCB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItaG92ZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIHtcbiAgY3Vyc29yOiB0ZXh0O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIHRleHRhcmVhLFxuLm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbCBpbnB1dCB7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXI6IG5vbmU7XG4gIHBhZGRpbmc6IDA7XG4gIGZvbnQ6IGluaGVyaXQ7XG4gIGJhY2tncm91bmQ6IHRyYW5zcGFyZW50O1xuICBjb2xvcjogaW5oZXJpdDtcbiAgcmVzaXplOiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLWVtcHR5IHtcbiAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICBwYWRkaW5nOiAwLjc1cmVtIDAuNXJlbTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlciB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgei1pbmRleDogMjtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC13cmFwOiB3cmFwO1xuICBnYXA6IDRweDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgcG9pbnRlci1ldmVudHM6IGF1dG87XG4gIHBhZGRpbmc6IDZweCA4cHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtcHJpbWFyeSk7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1iYXNlLXZpZXctc3dpdGNoZXItYnV0dG9uIHtcbiAgcG9pbnRlci1ldmVudHM6IGF1dG87XG4gIGhlaWdodDogMjZweDtcbiAgbWF4LXdpZHRoOiAyMjBweDtcbiAgcGFkZGluZzogMCA4cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBmb250LXNpemU6IHZhcigtLWZvbnQtdWktc21hbGxlcik7XG4gIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlci1idXR0b246aG92ZXIge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWhvdmVyKTtcbiAgY29sb3I6IHZhcigtLXRleHQtbm9ybWFsKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlci1idXR0b25bYXJpYS1jdXJyZW50PVwidHJ1ZVwiXSB7XG4gIGJvcmRlci1jb2xvcjogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgYmFja2dyb3VuZDogdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgY29sb3I6IHZhcigtLXRleHQtb24tYWNjZW50KTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlci1idXR0b246Zm9jdXMtdmlzaWJsZSB7XG4gIG91dGxpbmU6IDJweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xuICBvdXRsaW5lLW9mZnNldDogMnB4O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIG1hcmdpbi10b3A6IDAuNXJlbTtcbiAgcGFkZGluZzogMC41cmVtIDAuNzVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24gc3VtbWFyeSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudCB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogMC43NXJlbTtcbiAgbWFyZ2luLXRvcDogMC43NXJlbTtcbn1cbmAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWZyZXNoT3BlbkZyb3plblZpZXdzKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQWxsTGVhdmVzKChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBGcm96ZW5UYWJsZUJhc2VzVmlldykge1xuICAgICAgICB2aWV3Lm9uRGF0YVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUJhc2VWaWV3U3dpdGNoZXIoXG4gICAgdXBkYXRlczogUGFydGlhbDxCYXNlVmlld1N3aXRjaGVySG90Zml4U2V0dGluZ3M+XG4gICkge1xuICAgIHRoaXMuc2V0dGluZ3MuYmFzZVZpZXdTd2l0Y2hlciA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuYmFzZVZpZXdTd2l0Y2hlcixcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG5cbiAgcHJpdmF0ZSBjb25maWd1cmVCYXNlVmlld1N3aXRjaGVyKCkge1xuICAgIGlmICh0aGlzLnNldHRpbmdzLmJhc2VWaWV3U3dpdGNoZXIuZW5hYmxlZCkge1xuICAgICAgdGhpcy5zdGFydEJhc2VWaWV3U3dpdGNoZXIoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLnN0b3BCYXNlVmlld1N3aXRjaGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHN0YXJ0QmFzZVZpZXdTd2l0Y2hlcigpIHtcbiAgICBpZiAoIXRoaXMuYmFzZVZpZXdTd2l0Y2hlck9ic2VydmVyKSB7XG4gICAgICB0aGlzLmJhc2VWaWV3U3dpdGNoZXJPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuYmFzZVZpZXdTd2l0Y2hlck9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgICBjaGlsZExpc3Q6IHRydWUsXG4gICAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVkdWxlQmFzZVZpZXdTd2l0Y2hlclJlZnJlc2goKTtcbiAgfVxuXG4gIHByaXZhdGUgc3RvcEJhc2VWaWV3U3dpdGNoZXIoKSB7XG4gICAgaWYgKHRoaXMuYmFzZVZpZXdTd2l0Y2hlclJlZnJlc2hGcmFtZSAhPT0gbnVsbCkge1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMuYmFzZVZpZXdTd2l0Y2hlclJlZnJlc2hGcmFtZSk7XG4gICAgICB0aGlzLmJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoRnJhbWUgPSBudWxsO1xuICAgIH1cblxuICAgIHRoaXMuYmFzZVZpZXdTd2l0Y2hlclJlZnJlc2hUb2tlbisrO1xuICAgIGlmICh0aGlzLmJhc2VWaWV3U3dpdGNoZXJPYnNlcnZlcikge1xuICAgICAgdGhpcy5iYXNlVmlld1N3aXRjaGVyT2JzZXJ2ZXIuZGlzY29ubmVjdCgpO1xuICAgICAgdGhpcy5iYXNlVmlld1N3aXRjaGVyT2JzZXJ2ZXIgPSBudWxsO1xuICAgIH1cblxuICAgIGRvY3VtZW50XG4gICAgICAucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oQkFTRV9WSUVXX1NXSVRDSEVSX1NFTEVDVE9SKVxuICAgICAgLmZvckVhY2goKHJvdykgPT4gcm93LnJlbW92ZSgpKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVCYXNlVmlld1N3aXRjaGVyUmVmcmVzaCgpIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuYmFzZVZpZXdTd2l0Y2hlci5lbmFibGVkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYmFzZVZpZXdTd2l0Y2hlclJlZnJlc2hGcmFtZSAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYmFzZVZpZXdTd2l0Y2hlclJlZnJlc2hGcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgdGhpcy5iYXNlVmlld1N3aXRjaGVyUmVmcmVzaEZyYW1lID0gbnVsbDtcbiAgICAgIHZvaWQgdGhpcy5yZWZyZXNoQmFzZVZpZXdTd2l0Y2hlcnMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVmcmVzaEJhc2VWaWV3U3dpdGNoZXJzKCkge1xuICAgIGNvbnN0IHRva2VuID0gKyt0aGlzLmJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoVG9rZW47XG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmJhc2VWaWV3U3dpdGNoZXIuZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMucmVtb3ZlT3JwaGFuZWRCYXNlVmlld1N3aXRjaGVycygpO1xuICAgIGNvbnN0IHRhcmdldHMgPSB0aGlzLmZpbmRCYXNlVmlld1N3aXRjaGVyVGFyZ2V0cygpO1xuXG4gICAgZm9yIChjb25zdCB0YXJnZXQgb2YgdGFyZ2V0cykge1xuICAgICAgaWYgKHRva2VuICE9PSB0aGlzLmJhc2VWaWV3U3dpdGNoZXJSZWZyZXNoVG9rZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBhd2FpdCB0aGlzLnJlbmRlckJhc2VWaWV3U3dpdGNoZXIodGFyZ2V0KTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbW92ZU9ycGhhbmVkQmFzZVZpZXdTd2l0Y2hlcnMoKSB7XG4gICAgZG9jdW1lbnRcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihCQVNFX1ZJRVdfU1dJVENIRVJfU0VMRUNUT1IpXG4gICAgICAuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICAgIGlmICghcm93Lm5leHRFbGVtZW50U2libGluZz8ubWF0Y2hlcyhcIi5iYXNlcy1oZWFkZXJcIikpIHtcbiAgICAgICAgICByb3cucmVtb3ZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBmaW5kQmFzZVZpZXdTd2l0Y2hlclRhcmdldHMoKTogQmFzZVZpZXdTd2l0Y2hlclRhcmdldFtdIHtcbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMuc2V0dGluZ3MuYmFzZVZpZXdTd2l0Y2hlcjtcbiAgICBjb25zdCB0YXJnZXRzOiBCYXNlVmlld1N3aXRjaGVyVGFyZ2V0W10gPSBbXTtcbiAgICBjb25zdCBzZWVuSGVhZGVycyA9IG5ldyBTZXQ8SFRNTEVsZW1lbnQ+KCk7XG4gICAgY29uc3QgaGVhZGVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLmJhc2VzLWhlYWRlclwiKTtcblxuICAgIGhlYWRlcnMuZm9yRWFjaCgoaGVhZGVyRWwpID0+IHtcbiAgICAgIGlmIChzZWVuSGVhZGVycy5oYXMoaGVhZGVyRWwpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlZW5IZWFkZXJzLmFkZChoZWFkZXJFbCk7XG5cbiAgICAgIGNvbnN0IGVtYmVkRWwgPSBoZWFkZXJFbC5jbG9zZXN0PEhUTUxFbGVtZW50PihcIi5iYXNlcy1lbWJlZFwiKTtcbiAgICAgIGNvbnN0IG93bmVyID0gdGhpcy5nZXRPd25pbmdGaWxlVmlldyhoZWFkZXJFbCk7XG4gICAgICBjb25zdCBzb3VyY2VQYXRoID0gb3duZXI/LmZpbGU/LnBhdGggPz8gXCJcIjtcbiAgICAgIGNvbnN0IGlzRW1iZWRkZWRCYXNlID0gZW1iZWRFbCAhPT0gbnVsbDtcblxuICAgICAgaWYgKGlzRW1iZWRkZWRCYXNlICYmICFzZXR0aW5ncy5zaG93SW5FbWJlZHMpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVCYXNlVmlld1N3aXRjaGVyQmVmb3JlKGhlYWRlckVsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWlzRW1iZWRkZWRCYXNlICYmICFzZXR0aW5ncy5zaG93SW5CYXNlRmlsZXMpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVCYXNlVmlld1N3aXRjaGVyQmVmb3JlKGhlYWRlckVsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBiYXNlRmlsZSA9IGVtYmVkRWxcbiAgICAgICAgPyB0aGlzLnJlc29sdmVFbWJlZGRlZEJhc2VGaWxlKGVtYmVkRWwsIHNvdXJjZVBhdGgpXG4gICAgICAgIDogb3duZXI/LmZpbGUgaW5zdGFuY2VvZiBURmlsZSAmJiBvd25lci5maWxlLmV4dGVuc2lvbiA9PT0gXCJiYXNlXCJcbiAgICAgICAgICA/IG93bmVyLmZpbGVcbiAgICAgICAgICA6IG51bGw7XG5cbiAgICAgIGlmICghYmFzZUZpbGUpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVCYXNlVmlld1N3aXRjaGVyQmVmb3JlKGhlYWRlckVsKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB0YXJnZXRzLnB1c2goe1xuICAgICAgICBoZWFkZXJFbCxcbiAgICAgICAgYmFzZUZpbGUsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0YXJnZXRzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRPd25pbmdGaWxlVmlldyhlbGVtZW50OiBIVE1MRWxlbWVudCk6IE93bmluZ0ZpbGVWaWV3IHwgbnVsbCB7XG4gICAgbGV0IG93bmVyOiBPd25pbmdGaWxlVmlldyB8IG51bGwgPSBudWxsO1xuXG4gICAgdGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoKGxlYWYpID0+IHtcbiAgICAgIGlmIChvd25lcikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXcgYXMgdW5rbm93biBhcyB7XG4gICAgICAgIGNvbnRhaW5lckVsPzogSFRNTEVsZW1lbnQ7XG4gICAgICAgIGZpbGU/OiB1bmtub3duO1xuICAgICAgfTtcblxuICAgICAgaWYgKHZpZXcuY29udGFpbmVyRWw/LmNvbnRhaW5zKGVsZW1lbnQpKSB7XG4gICAgICAgIG93bmVyID0ge1xuICAgICAgICAgIGNvbnRhaW5lckVsOiB2aWV3LmNvbnRhaW5lckVsLFxuICAgICAgICAgIGZpbGU6IHZpZXcuZmlsZSBpbnN0YW5jZW9mIFRGaWxlID8gdmlldy5maWxlIDogbnVsbCxcbiAgICAgICAgICB2aWV3OiBsZWFmLnZpZXcsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb3duZXI7XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVFbWJlZGRlZEJhc2VGaWxlKFxuICAgIGVtYmVkRWw6IEhUTUxFbGVtZW50LFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZ1xuICApOiBURmlsZSB8IG51bGwge1xuICAgIGNvbnN0IGNhbmRpZGF0ZUVsZW1lbnRzID0gW1xuICAgICAgZW1iZWRFbCxcbiAgICAgIGVtYmVkRWwuY2xvc2VzdDxIVE1MRWxlbWVudD4oXCIuaW50ZXJuYWwtZW1iZWRcIiksXG4gICAgXS5maWx0ZXIoKGVsZW1lbnQpOiBlbGVtZW50IGlzIEhUTUxFbGVtZW50ID0+IGVsZW1lbnQgIT09IG51bGwpO1xuICAgIGNvbnN0IGNhbmRpZGF0ZXM6IHN0cmluZ1tdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgY2FuZGlkYXRlRWxlbWVudHMpIHtcbiAgICAgIGNhbmRpZGF0ZXMucHVzaChcbiAgICAgICAgZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJzcmNcIikgPz8gXCJcIixcbiAgICAgICAgZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJkYXRhLXNyY1wiKSA/PyBcIlwiLFxuICAgICAgICBlbGVtZW50LmdldEF0dHJpYnV0ZShcImRhdGEtcGF0aFwiKSA/PyBcIlwiLFxuICAgICAgICBlbGVtZW50LmdldEF0dHJpYnV0ZShcImFsdFwiKSA/PyBcIlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGNhbmRpZGF0ZXMpIHtcbiAgICAgIGNvbnN0IGxpbmtwYXRoID0gdGhpcy5ub3JtYWxpemVCYXNlTGlua0NhbmRpZGF0ZShjYW5kaWRhdGUpO1xuICAgICAgaWYgKCFsaW5rcGF0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlyZWN0RmlsZSA9IHRoaXMuYXBwLnZhdWx0LmdldEZpbGVCeVBhdGgobGlua3BhdGgpO1xuICAgICAgaWYgKGRpcmVjdEZpbGU/LmV4dGVuc2lvbiA9PT0gXCJiYXNlXCIpIHtcbiAgICAgICAgcmV0dXJuIGRpcmVjdEZpbGU7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlc29sdmVkID0gdGhpcy5hcHAubWV0YWRhdGFDYWNoZS5nZXRGaXJzdExpbmtwYXRoRGVzdChcbiAgICAgICAgbGlua3BhdGgsXG4gICAgICAgIHNvdXJjZVBhdGhcbiAgICAgICk7XG4gICAgICBpZiAocmVzb2x2ZWQgaW5zdGFuY2VvZiBURmlsZSAmJiByZXNvbHZlZC5leHRlbnNpb24gPT09IFwiYmFzZVwiKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplQmFzZUxpbmtDYW5kaWRhdGUodmFsdWU6IHN0cmluZyk6IHN0cmluZyB8IG51bGwge1xuICAgIGxldCBjYW5kaWRhdGUgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFjYW5kaWRhdGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjYW5kaWRhdGUgPSBkZWNvZGVVUklDb21wb25lbnQoY2FuZGlkYXRlKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIEtlZXAgdGhlIG9yaWdpbmFsIHZhbHVlIHdoZW4gaXQgaXMgbm90IFVSSS1lbmNvZGVkLlxuICAgIH1cblxuICAgIGNhbmRpZGF0ZSA9IGNhbmRpZGF0ZVxuICAgICAgLnJlcGxhY2UoL14hXFxbXFxbLywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC9eXFxbXFxbLywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC9cXF1cXF0kLywgXCJcIilcbiAgICAgIC5zcGxpdChcInxcIilbMF1cbiAgICAgIC5zcGxpdChcIiNcIilbMF1cbiAgICAgIC50cmltKCk7XG5cbiAgICBpZiAoIWNhbmRpZGF0ZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgfVxuXG4gIHByaXZhdGUgZmluZE5hdGl2ZUJhc2VWaWV3QnV0dG9uKFxuICAgIGhlYWRlckVsOiBIVE1MRWxlbWVudCxcbiAgICB2aWV3TmFtZXM6IHN0cmluZ1tdID0gW11cbiAgKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBwcmVmZXJyZWRTZWxlY3RvcnMgPSBbXG4gICAgICBcIi5iYXNlcy10b29sYmFyLWl0ZW0uYmFzZXMtdG9vbGJhci12aWV3cy1tZW51IC50ZXh0LWljb24tYnV0dG9uXCIsXG4gICAgICBcIi5iYXNlcy10b29sYmFyLXZpZXdzLW1lbnUgLnRleHQtaWNvbi1idXR0b25cIixcbiAgICAgIFwiLmJhc2VzLXRvb2xiYXItaXRlbS5iYXNlcy10b29sYmFyLXZpZXdzLW1lbnVcIixcbiAgICAgIFwiLmJhc2VzLXRvb2xiYXItdmlld3MtbWVudVwiLFxuICAgICAgXCIuYmFzZXMtdG9vbGJhci12aWV3LW1lbnVcIixcbiAgICAgIFwiLmJhc2VzLXRvb2xiYXItaXRlbS5tb2Qtdmlld1wiLFxuICAgICAgXCIuYmFzZXMtdG9vbGJhci1pdGVtLm1vZC12aWV3LW1lbnVcIixcbiAgICBdO1xuXG4gICAgZm9yIChjb25zdCBzZWxlY3RvciBvZiBwcmVmZXJyZWRTZWxlY3RvcnMpIHtcbiAgICAgIGNvbnN0IGZvdW5kID0gaGVhZGVyRWwucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oc2VsZWN0b3IpO1xuICAgICAgaWYgKGZvdW5kKSB7XG4gICAgICAgIHJldHVybiBmb3VuZDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBub3JtYWxpemVkVmlld05hbWVzID0gbmV3IFNldChcbiAgICAgIHZpZXdOYW1lcy5tYXAoKHZpZXdOYW1lKSA9PiB0aGlzLm5vcm1hbGl6ZVRleHQodmlld05hbWUpKVxuICAgICk7XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IEFycmF5LmZyb20oXG4gICAgICBoZWFkZXJFbC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcbiAgICAgICAgXCIuYmFzZXMtdG9vbGJhci1pdGVtLCBidXR0b24sIFtyb2xlPSdidXR0b24nXVwiXG4gICAgICApXG4gICAgKS5maWx0ZXIoKGNhbmRpZGF0ZSkgPT4gdGhpcy5pc1Zpc2libGVFbGVtZW50KGNhbmRpZGF0ZSkpO1xuXG4gICAgY29uc3QgbWF0Y2hpbmdUZXh0ID0gY2FuZGlkYXRlcy5maW5kKChjYW5kaWRhdGUpID0+IHtcbiAgICAgIGNvbnN0IGNhbmRpZGF0ZVRleHQgPSB0aGlzLm5vcm1hbGl6ZVRleHQoXG4gICAgICAgIGNhbmRpZGF0ZS5pbm5lclRleHQgfHwgY2FuZGlkYXRlLnRleHRDb250ZW50IHx8IFwiXCJcbiAgICAgICk7XG4gICAgICBpZiAoIWNhbmRpZGF0ZVRleHQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IHZpZXdOYW1lIG9mIG5vcm1hbGl6ZWRWaWV3TmFtZXMpIHtcbiAgICAgICAgaWYgKGNhbmRpZGF0ZVRleHQgPT09IHZpZXdOYW1lIHx8IGNhbmRpZGF0ZVRleHQuaW5jbHVkZXModmlld05hbWUpKSB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICAgIGlmIChtYXRjaGluZ1RleHQpIHtcbiAgICAgIHJldHVybiBtYXRjaGluZ1RleHQ7XG4gICAgfVxuXG4gICAgY29uc3QgYXJpYVZpZXdCdXR0b24gPSBjYW5kaWRhdGVzLmZpbmQoKGNhbmRpZGF0ZSkgPT5cbiAgICAgIHRoaXMubm9ybWFsaXplVGV4dChcbiAgICAgICAgY2FuZGlkYXRlLmdldEF0dHJpYnV0ZShcImFyaWEtbGFiZWxcIikgfHxcbiAgICAgICAgICBjYW5kaWRhdGUuZ2V0QXR0cmlidXRlKFwidGl0bGVcIikgfHxcbiAgICAgICAgICBcIlwiXG4gICAgICApXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5pbmNsdWRlcyhcInZpZXdcIilcbiAgICApO1xuICAgIGlmIChhcmlhVmlld0J1dHRvbikge1xuICAgICAgcmV0dXJuIGFyaWFWaWV3QnV0dG9uO1xuICAgIH1cblxuICAgIHJldHVybiBjYW5kaWRhdGVzWzBdID8/IG51bGw7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIHJlbmRlckJhc2VWaWV3U3dpdGNoZXIodGFyZ2V0OiBCYXNlVmlld1N3aXRjaGVyVGFyZ2V0KSB7XG4gICAgaWYgKCF0YXJnZXQuaGVhZGVyRWwuaXNDb25uZWN0ZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB2aWV3cyA9IGF3YWl0IHRoaXMucmVhZEJhc2VWaWV3RGVmaW5pdGlvbnModGFyZ2V0LmJhc2VGaWxlKTtcbiAgICBpZiAoIXRhcmdldC5oZWFkZXJFbC5pc0Nvbm5lY3RlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2aWV3cy5sZW5ndGggPCAyKSB7XG4gICAgICB0aGlzLnJlbW92ZUJhc2VWaWV3U3dpdGNoZXJCZWZvcmUodGFyZ2V0LmhlYWRlckVsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwYXJlbnQgPSB0YXJnZXQuaGVhZGVyRWwucGFyZW50RWxlbWVudDtcbiAgICBpZiAoIXBhcmVudCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCByb3cgPSB0aGlzLmdldEJhc2VWaWV3U3dpdGNoZXJCZWZvcmUodGFyZ2V0LmhlYWRlckVsKTtcbiAgICBpZiAoIXJvdykge1xuICAgICAgcm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIHJvdy5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlclwiO1xuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShyb3csIHRhcmdldC5oZWFkZXJFbCk7XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlVmlld0J1dHRvbiA9IHRoaXMuZmluZE5hdGl2ZUJhc2VWaWV3QnV0dG9uKFxuICAgICAgdGFyZ2V0LmhlYWRlckVsLFxuICAgICAgdmlld3MubWFwKCh2aWV3KSA9PiB2aWV3Lm5hbWUpXG4gICAgKTtcbiAgICBjb25zdCBjb250cm9sbGVyID0gdGhpcy5nZXRCYXNlQ29udHJvbGxlckZvckhlYWRlcih0YXJnZXQuaGVhZGVyRWwpO1xuICAgIGNvbnN0IGFjdGl2ZVZpZXdOYW1lID0gdGhpcy5maW5kQWN0aXZlQmFzZVZpZXdOYW1lKFxuICAgICAgdHlwZW9mIGNvbnRyb2xsZXI/LnZpZXdOYW1lID09PSBcInN0cmluZ1wiXG4gICAgICAgID8gY29udHJvbGxlci52aWV3TmFtZVxuICAgICAgICA6IG5hdGl2ZVZpZXdCdXR0b25cbiAgICAgICAgPyB0aGlzLm5vcm1hbGl6ZVRleHQoXG4gICAgICAgICAgICBuYXRpdmVWaWV3QnV0dG9uLmlubmVyVGV4dCB8fCBuYXRpdmVWaWV3QnV0dG9uLnRleHRDb250ZW50IHx8IFwiXCJcbiAgICAgICAgICApXG4gICAgICAgIDogbnVsbCxcbiAgICAgIHZpZXdzXG4gICAgKTtcblxuICAgIHJvdy5lbXB0eSgpO1xuICAgIHJvdy5kYXRhc2V0LmJhc2VQYXRoID0gdGFyZ2V0LmJhc2VGaWxlLnBhdGg7XG4gICAgcm93LnNldEF0dHJpYnV0ZShcInJvbGVcIiwgXCJ0b29sYmFyXCIpO1xuICAgIHJvdy5zZXRBdHRyaWJ1dGUoXCJhcmlhLWxhYmVsXCIsIFwiQmFzZSB2aWV3c1wiKTtcblxuICAgIGZvciAoY29uc3QgdmlldyBvZiB2aWV3cykge1xuICAgICAgY29uc3QgYnV0dG9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImJ1dHRvblwiKTtcbiAgICAgIGJ1dHRvbi50eXBlID0gXCJidXR0b25cIjtcbiAgICAgIGJ1dHRvbi5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWJhc2Utdmlldy1zd2l0Y2hlci1idXR0b25cIjtcbiAgICAgIGJ1dHRvbi50ZXh0Q29udGVudCA9IHZpZXcubmFtZTtcbiAgICAgIGJ1dHRvbi50aXRsZSA9IGAke3RhcmdldC5iYXNlRmlsZS5iYXNlbmFtZX06ICR7dmlldy5uYW1lfWA7XG4gICAgICBidXR0b24uZGF0YXNldC52aWV3TmFtZSA9IHZpZXcubmFtZTtcbiAgICAgIGlmICh2aWV3Lm5hbWUgPT09IGFjdGl2ZVZpZXdOYW1lKSB7XG4gICAgICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoXCJhcmlhLWN1cnJlbnRcIiwgXCJ0cnVlXCIpO1xuICAgICAgfVxuXG4gICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIH0pO1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgfSk7XG5cbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBpZiAoYnV0dG9uLmdldEF0dHJpYnV0ZShcImFyaWEtY3VycmVudFwiKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdm9pZCB0aGlzLnN3aXRjaEJhc2VUb1ZpZXcodGFyZ2V0LmhlYWRlckVsLCB2aWV3Lm5hbWUpO1xuICAgICAgfSk7XG5cbiAgICAgIHJvdy5hcHBlbmRDaGlsZChidXR0b24pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgcmVhZEJhc2VWaWV3RGVmaW5pdGlvbnMoXG4gICAgYmFzZUZpbGU6IFRGaWxlXG4gICk6IFByb21pc2U8QmFzZVZpZXdEZWZpbml0aW9uW10+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgY29udGVudCA9IGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNhY2hlZFJlYWQoYmFzZUZpbGUpO1xuICAgICAgY29uc3QgY29uZmlnID0gcGFyc2VZYW1sKGNvbnRlbnQpIGFzIEJhc2VzQ29uZmlnRmlsZSB8IG51bGw7XG4gICAgICBpZiAoIWNvbmZpZyB8fCAhQXJyYXkuaXNBcnJheShjb25maWcudmlld3MpKSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGNvbmZpZy52aWV3c1xuICAgICAgICAubWFwKCh2aWV3KSA9PiAoe1xuICAgICAgICAgIG5hbWU6IHR5cGVvZiB2aWV3Py5uYW1lID09PSBcInN0cmluZ1wiID8gdmlldy5uYW1lLnRyaW0oKSA6IFwiXCIsXG4gICAgICAgIH0pKVxuICAgICAgICAuZmlsdGVyKCh2aWV3KSA9PiB2aWV3Lm5hbWUubGVuZ3RoID4gMCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJbT2JzaWRpYW4gSG90Zml4ZXNdIEZhaWxlZCB0byByZWFkIEJhc2Ugdmlld3MuXCIsXG4gICAgICAgIGJhc2VGaWxlLnBhdGgsXG4gICAgICAgIGVycm9yXG4gICAgICApO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0QmFzZVZpZXdTd2l0Y2hlckJlZm9yZShoZWFkZXJFbDogSFRNTEVsZW1lbnQpOiBIVE1MRWxlbWVudCB8IG51bGwge1xuICAgIGNvbnN0IHByZXZpb3VzID0gaGVhZGVyRWwucHJldmlvdXNFbGVtZW50U2libGluZztcbiAgICBpZiAoXG4gICAgICBwcmV2aW91cyBpbnN0YW5jZW9mIEhUTUxFbGVtZW50ICYmXG4gICAgICBwcmV2aW91cy5tYXRjaGVzKEJBU0VfVklFV19TV0lUQ0hFUl9TRUxFQ1RPUilcbiAgICApIHtcbiAgICAgIHJldHVybiBwcmV2aW91cztcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgcmVtb3ZlQmFzZVZpZXdTd2l0Y2hlckJlZm9yZShoZWFkZXJFbDogSFRNTEVsZW1lbnQpIHtcbiAgICB0aGlzLmdldEJhc2VWaWV3U3dpdGNoZXJCZWZvcmUoaGVhZGVyRWwpPy5yZW1vdmUoKTtcbiAgfVxuXG4gIHByaXZhdGUgZmluZEFjdGl2ZUJhc2VWaWV3TmFtZShcbiAgICBsYWJlbDogc3RyaW5nIHwgbnVsbCxcbiAgICB2aWV3czogQmFzZVZpZXdEZWZpbml0aW9uW11cbiAgKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgaWYgKCFsYWJlbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3Qgbm9ybWFsaXplZExhYmVsID0gdGhpcy5ub3JtYWxpemVUZXh0KGxhYmVsKTtcbiAgICBjb25zdCBleGFjdCA9IHZpZXdzLmZpbmQoXG4gICAgICAodmlldykgPT4gdGhpcy5ub3JtYWxpemVUZXh0KHZpZXcubmFtZSkgPT09IG5vcm1hbGl6ZWRMYWJlbFxuICAgICk7XG4gICAgaWYgKGV4YWN0KSB7XG4gICAgICByZXR1cm4gZXhhY3QubmFtZTtcbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZWQgPSB2aWV3cy5maW5kKCh2aWV3KSA9PlxuICAgICAgbm9ybWFsaXplZExhYmVsLmluY2x1ZGVzKHRoaXMubm9ybWFsaXplVGV4dCh2aWV3Lm5hbWUpKVxuICAgICk7XG4gICAgcmV0dXJuIGNvbnRhaW5lZD8ubmFtZSA/PyBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBzd2l0Y2hCYXNlVG9WaWV3KGhlYWRlckVsOiBIVE1MRWxlbWVudCwgdmlld05hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IHJvdyA9IHRoaXMuZ2V0QmFzZVZpZXdTd2l0Y2hlckJlZm9yZShoZWFkZXJFbCk7XG4gICAgY29uc3Qgdmlld05hbWVzID0gcm93XG4gICAgICA/IEFycmF5LmZyb20oXG4gICAgICAgICAgcm93LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgICAgXCIub2JzaWRpYW4taG90Zml4ZXMtYmFzZS12aWV3LXN3aXRjaGVyLWJ1dHRvblwiXG4gICAgICAgICAgKVxuICAgICAgICApLm1hcCgoYnV0dG9uKSA9PiBidXR0b24uZGF0YXNldC52aWV3TmFtZSA/PyBidXR0b24udGV4dENvbnRlbnQgPz8gXCJcIilcbiAgICAgIDogW107XG4gICAgY29uc3QgY29udHJvbGxlciA9IHRoaXMuZ2V0QmFzZUNvbnRyb2xsZXJGb3JIZWFkZXIoaGVhZGVyRWwpO1xuICAgIGlmIChjb250cm9sbGVyPy5zZWxlY3RWaWV3ICYmIGNvbnRyb2xsZXIuZ2V0UXVlcnlWaWV3TmFtZXM/LigpLmluY2x1ZGVzKHZpZXdOYW1lKSkge1xuICAgICAgY29udHJvbGxlci5zZWxlY3RWaWV3KHZpZXdOYW1lKTtcbiAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuc2NoZWR1bGVCYXNlVmlld1N3aXRjaGVyUmVmcmVzaCgpLCA4MCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbmF0aXZlVmlld0J1dHRvbiA9IHRoaXMuZmluZE5hdGl2ZUJhc2VWaWV3QnV0dG9uKGhlYWRlckVsLCB2aWV3TmFtZXMpO1xuICAgIGlmICghbmF0aXZlVmlld0J1dHRvbikge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIltPYnNpZGlhbiBIb3RmaXhlc10gQ291bGQgbm90IGZpbmQgbmF0aXZlIEJhc2VzIHZpZXcgbWVudSBidXR0b24uXCJcbiAgICAgICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgbWVudUl0ZW1zQmVmb3JlID0gbmV3IFNldChcbiAgICAgIEFycmF5LmZyb20oXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgIFwiLmJhc2VzLXRvb2xiYXItbWVudS1pdGVtLCAubWVudS1pdGVtLCBbcm9sZT0nbWVudWl0ZW0nXVwiXG4gICAgICAgIClcbiAgICAgIClcbiAgICApO1xuXG4gICAgdGhpcy5hY3RpdmF0ZUVsZW1lbnQobmF0aXZlVmlld0J1dHRvbik7XG5cbiAgICBjb25zdCBuZXdNZW51SXRlbXMgPSBhd2FpdCB0aGlzLndhaXRGb3JOZXdNZW51SXRlbXMobWVudUl0ZW1zQmVmb3JlKTtcbiAgICBjb25zdCBjYW5kaWRhdGVzID0gbmV3TWVudUl0ZW1zLmxlbmd0aCA+IDBcbiAgICAgID8gbmV3TWVudUl0ZW1zXG4gICAgICA6IEFycmF5LmZyb20oXG4gICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgICBcIi5iYXNlcy10b29sYmFyLW1lbnUtaXRlbSwgLm1lbnUtaXRlbSwgW3JvbGU9J21lbnVpdGVtJ11cIlxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICBjb25zdCB0YXJnZXRJdGVtID0gdGhpcy5maW5kTWVudUl0ZW1Gb3JWaWV3KGNhbmRpZGF0ZXMsIHZpZXdOYW1lKTtcblxuICAgIGlmICghdGFyZ2V0SXRlbSkge1xuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIltPYnNpZGlhbiBIb3RmaXhlc10gQ291bGQgbm90IGZpbmQgQmFzZXMgdmlldyBtZW51IGl0ZW0uXCIsXG4gICAgICAgIHZpZXdOYW1lXG4gICAgICApO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZhdGVFbGVtZW50KHRhcmdldEl0ZW0pO1xuICAgIHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHRoaXMuc2NoZWR1bGVCYXNlVmlld1N3aXRjaGVyUmVmcmVzaCgpLCA4MCk7XG4gIH1cblxuICBwcml2YXRlIGZpbmRNZW51SXRlbUZvclZpZXcoXG4gICAgbWVudUl0ZW1zOiBIVE1MRWxlbWVudFtdLFxuICAgIHZpZXdOYW1lOiBzdHJpbmdcbiAgKTogSFRNTEVsZW1lbnQgfCBudWxsIHtcbiAgICBjb25zdCBub3JtYWxpemVkVmlld05hbWUgPSB0aGlzLm5vcm1hbGl6ZVRleHQodmlld05hbWUpO1xuICAgIGNvbnN0IHZpZXdNZW51SXRlbXMgPSBtZW51SXRlbXMuZmlsdGVyKChpdGVtKSA9PlxuICAgICAgaXRlbS5jbG9zZXN0KCdbZGF0YS1ncm91cD1cInZpZXdzXCJdJykgIT09IG51bGxcbiAgICApO1xuICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSB2aWV3TWVudUl0ZW1zLmxlbmd0aCA+IDAgPyB2aWV3TWVudUl0ZW1zIDogbWVudUl0ZW1zO1xuICAgIGNvbnN0IGV4YWN0ID0gY2FuZGlkYXRlcy5maW5kKChpdGVtKSA9PlxuICAgICAgdGhpcy5ub3JtYWxpemVNZW51SXRlbVRleHQoaXRlbSkgPT09IG5vcm1hbGl6ZWRWaWV3TmFtZVxuICAgICk7XG4gICAgaWYgKGV4YWN0KSB7XG4gICAgICByZXR1cm4gZXhhY3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgoaXRlbSkgPT4ge1xuICAgICAgY29uc3QgcmF3VGV4dCA9IHRoaXMubm9ybWFsaXplTWVudUl0ZW1UZXh0KGl0ZW0pO1xuICAgICAgY29uc3QgZmlyc3RMaW5lID0gcmF3VGV4dC5zcGxpdCgvXFxyP1xcbi91KVswXSA/PyBcIlwiO1xuICAgICAgcmV0dXJuIHRoaXMubm9ybWFsaXplVGV4dChmaXJzdExpbmUpID09PSBub3JtYWxpemVkVmlld05hbWU7XG4gICAgfSkgPz8gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgbm9ybWFsaXplVGV4dCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvXFxzKy9nLCBcIiBcIikudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSBub3JtYWxpemVNZW51SXRlbVRleHQoaXRlbTogSFRNTEVsZW1lbnQpOiBzdHJpbmcge1xuICAgIGNvbnN0IG5hbWVFbCA9IGl0ZW0ucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXCIuYmFzZXMtdG9vbGJhci1tZW51LWl0ZW0tbmFtZVwiKTtcbiAgICByZXR1cm4gdGhpcy5ub3JtYWxpemVUZXh0KFxuICAgICAgbmFtZUVsPy5pbm5lclRleHQgfHxcbiAgICAgICAgbmFtZUVsPy50ZXh0Q29udGVudCB8fFxuICAgICAgICBpdGVtLmlubmVyVGV4dCB8fFxuICAgICAgICBpdGVtLnRleHRDb250ZW50IHx8XG4gICAgICAgIFwiXCJcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRCYXNlQ29udHJvbGxlckZvckhlYWRlcihcbiAgICBoZWFkZXJFbDogSFRNTEVsZW1lbnRcbiAgKTogQmFzZUNvbnRyb2xsZXJMaWtlIHwgbnVsbCB7XG4gICAgY29uc3Qgb3duZXIgPSB0aGlzLmdldE93bmluZ0ZpbGVWaWV3KGhlYWRlckVsKTtcbiAgICBjb25zdCB2aWV3ID0gb3duZXI/LnZpZXcgYXMgeyBjb250cm9sbGVyPzogdW5rbm93biB9IHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgICBjb25zdCBjb250cm9sbGVyID0gdmlldz8uY29udHJvbGxlciBhcyBCYXNlQ29udHJvbGxlckxpa2UgfCB1bmRlZmluZWQ7XG4gICAgaWYgKFxuICAgICAgY29udHJvbGxlciAmJlxuICAgICAgdHlwZW9mIGNvbnRyb2xsZXIuc2VsZWN0VmlldyA9PT0gXCJmdW5jdGlvblwiICYmXG4gICAgICB0eXBlb2YgY29udHJvbGxlci5nZXRRdWVyeVZpZXdOYW1lcyA9PT0gXCJmdW5jdGlvblwiXG4gICAgKSB7XG4gICAgICByZXR1cm4gY29udHJvbGxlcjtcbiAgICB9XG5cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgaXNWaXNpYmxlRWxlbWVudChlbGVtZW50OiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IHJlY3QgPSBlbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWxlbWVudCk7XG4gICAgcmV0dXJuIChcbiAgICAgIHJlY3Qud2lkdGggPiAwICYmXG4gICAgICByZWN0LmhlaWdodCA+IDAgJiZcbiAgICAgIHN0eWxlLmRpc3BsYXkgIT09IFwibm9uZVwiICYmXG4gICAgICBzdHlsZS52aXNpYmlsaXR5ICE9PSBcImhpZGRlblwiXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYWN0aXZhdGVFbGVtZW50KGVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gICAgZWxlbWVudC5mb2N1cygpO1xuICAgIGNvbnN0IGRvd25FdmVudEluaXQ6IE1vdXNlRXZlbnRJbml0ID0ge1xuICAgICAgYnViYmxlczogdHJ1ZSxcbiAgICAgIGNhbmNlbGFibGU6IHRydWUsXG4gICAgICB2aWV3OiB3aW5kb3csXG4gICAgICBidXR0b246IDAsXG4gICAgICBidXR0b25zOiAxLFxuICAgIH07XG4gICAgY29uc3QgdXBFdmVudEluaXQ6IE1vdXNlRXZlbnRJbml0ID0ge1xuICAgICAgLi4uZG93bkV2ZW50SW5pdCxcbiAgICAgIGJ1dHRvbnM6IDAsXG4gICAgfTtcbiAgICBjb25zdCBwb2ludGVyRG93bkV2ZW50SW5pdDogUG9pbnRlckV2ZW50SW5pdCA9IHtcbiAgICAgIC4uLmRvd25FdmVudEluaXQsXG4gICAgICBwb2ludGVySWQ6IDEsXG4gICAgICBwb2ludGVyVHlwZTogXCJtb3VzZVwiLFxuICAgICAgaXNQcmltYXJ5OiB0cnVlLFxuICAgIH07XG4gICAgY29uc3QgcG9pbnRlclVwRXZlbnRJbml0OiBQb2ludGVyRXZlbnRJbml0ID0ge1xuICAgICAgLi4udXBFdmVudEluaXQsXG4gICAgICBwb2ludGVySWQ6IDEsXG4gICAgICBwb2ludGVyVHlwZTogXCJtb3VzZVwiLFxuICAgICAgaXNQcmltYXJ5OiB0cnVlLFxuICAgIH07XG5cbiAgICB0cnkge1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBQb2ludGVyRXZlbnQoXCJwb2ludGVyZG93blwiLCBwb2ludGVyRG93bkV2ZW50SW5pdCkpO1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwibW91c2Vkb3duXCIsIGRvd25FdmVudEluaXQpKTtcbiAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgUG9pbnRlckV2ZW50KFwicG9pbnRlcnVwXCIsIHBvaW50ZXJVcEV2ZW50SW5pdCkpO1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwibW91c2V1cFwiLCB1cEV2ZW50SW5pdCkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwibW91c2Vkb3duXCIsIGRvd25FdmVudEluaXQpKTtcbiAgICAgIGVsZW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgTW91c2VFdmVudChcIm1vdXNldXBcIiwgdXBFdmVudEluaXQpKTtcbiAgICB9XG5cbiAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQobmV3IE1vdXNlRXZlbnQoXCJjbGlja1wiLCB1cEV2ZW50SW5pdCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyB3YWl0Rm9yTmV3TWVudUl0ZW1zKFxuICAgIGV4aXN0aW5nTWVudUl0ZW1zOiBTZXQ8SFRNTEVsZW1lbnQ+LFxuICAgIHRpbWVvdXRNcyA9IDYwMFxuICApOiBQcm9taXNlPEhUTUxFbGVtZW50W10+IHtcbiAgICBjb25zdCBkZWFkbGluZSA9IERhdGUubm93KCkgKyB0aW1lb3V0TXM7XG5cbiAgICB3aGlsZSAoRGF0ZS5ub3coKSA8IGRlYWRsaW5lKSB7XG4gICAgICBhd2FpdCB0aGlzLm5leHRBbmltYXRpb25GcmFtZSgpO1xuICAgICAgY29uc3QgbWVudUl0ZW1zID0gQXJyYXkuZnJvbShcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXG4gICAgICAgICAgXCIuYmFzZXMtdG9vbGJhci1tZW51LWl0ZW0sIC5tZW51LWl0ZW0sIFtyb2xlPSdtZW51aXRlbSddXCJcbiAgICAgICAgKVxuICAgICAgKS5maWx0ZXIoXG4gICAgICAgIChpdGVtKSA9PlxuICAgICAgICAgIGl0ZW0uaXNDb25uZWN0ZWQgJiZcbiAgICAgICAgICAhZXhpc3RpbmdNZW51SXRlbXMuaGFzKGl0ZW0pICYmXG4gICAgICAgICAgdGhpcy5pc1Zpc2libGVFbGVtZW50KGl0ZW0pXG4gICAgICApO1xuXG4gICAgICBpZiAobWVudUl0ZW1zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcmV0dXJuIG1lbnVJdGVtcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBwcml2YXRlIG5leHRBbmltYXRpb25GcmFtZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4gcmVzb2x2ZSgpKTtcbiAgICB9KTtcbiAgfVxufVxuXG5jbGFzcyBGcm96ZW5UYWJsZUJhc2VzVmlldyBleHRlbmRzIEJhc2VzVmlldyBpbXBsZW1lbnRzIEhvdmVyUGFyZW50IHtcbiAgaG92ZXJQb3BvdmVyOiBIb3ZlclBvcG92ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSByb290OiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBhY3RpdmVWaWV3OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZUVkaXRvcjogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1cnJlbnRQcm9wZXJ0eU9yZGVyOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbHVtbkVsZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxUYWJsZUNvbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGVhZGVyRWxlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aXZlQ29sdW1uV2lkdGhzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXNpemVTdGFydFggPSAwO1xuICBwcml2YXRlIHJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVQb2ludGVySWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRyYWdnaW5nQ29sdW1uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVEcmFnVGFyZ2V0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHJlYWRvbmx5IG9uUmVzaXplUG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpO1xuICAgIGlmICghZmVhdHVyZXMuZW5hYmxlUmVzaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuY2xpZW50WCAtIHRoaXMucmVzaXplU3RhcnRYO1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCArIGRlbHRhLFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gMFxuICAgICk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICAgIHRoaXMuYXBwbHlDb2x1bW5XaWR0aCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb25SZXNpemVQb2ludGVyVXAgPSAoKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgaWYgKCFmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8IHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5XaWR0aHMoKTtcblxuICAgIHRoaXMuc3RvcENvbHVtblJlc2l6ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRDb2x1bW5SZXNpemUgPSAoXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudCxcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApID0+IHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBpZiAoIWZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgJiYgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCI7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIGNhbiBmYWlsIGluIGVkZ2UgY2FzZXMgKGUuZy4gY2VydGFpbiB3ZWJ2aWV3cykuXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSBldmVudC5jbGllbnRYO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aDtcblxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJjb2wtcmVzaXplXCI7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMub25SZXNpemVQb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB0aGlzLm9uUmVzaXplUG9pbnRlclVwKTtcbiAgfTtcblxuICBwcml2YXRlIHN0b3BDb2x1bW5SZXNpemUoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCAmJiB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCAhPT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnJlbGVhc2VQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIG1heSBub3QgYmUgYWN0aXZlOyBpZ25vcmUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbikge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBudWxsO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwiXCI7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSAwO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSAwO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJcIjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRyb2xsZXI6IFF1ZXJ5Q29udHJvbGxlcixcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoY29udHJvbGxlcik7XG4gICAgdGhpcy5yb290ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3RcIik7XG4gIH1cblxuICByZWFkb25seSB0eXBlID0gRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRTtcblxuICBwdWJsaWMgb25EYXRhVXBkYXRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgY29uc3QgY2VsbEhlaWdodCA9IE1hdGgubWF4KFxuICAgICAgMSxcbiAgICAgIE1hdGgubWluKDEwMCwgTWF0aC5yb3VuZChmZWF0dXJlcy5jZWxsSGVpZ2h0UHgpKVxuICAgICk7XG4gICAgdGhpcy5yb290LmNsYXNzTmFtZSA9IGBvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCBvYnNpZGlhbi1ob3RmaXhlcy13cmFwLSR7ZmVhdHVyZXMud3JhcE1vZGV9YDtcbiAgICB0aGlzLnJvb3Quc3R5bGUuc2V0UHJvcGVydHkoXG4gICAgICBcIi0tb2JzaWRpYW4taG90Zml4ZXMtY2VsbC1oZWlnaHRcIixcbiAgICAgIGAke2NlbGxIZWlnaHR9cHhgXG4gICAgKTtcblxuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBbXTtcbiAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5oZWFkZXJFbGVtZW50cy5jbGVhcigpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnN5bmNDb2x1bW5XaWR0aHMoKTtcblxuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRQcm9wZXJ0eU9yZGVyKCk7XG4gICAgaWYgKCFwcm9wZXJ0eU9yZGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBmb3IgdGhpcyBCYXNlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKGtleSwgaW5kZXgpO1xuICAgICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlcltpbmRleF0gPSBrZXk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB3aWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2aWV3ID0gdGhpcy5yb290LmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3XCIpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IHZpZXc7XG4gICAgY29uc3QgZmlyc3RQcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlci5sZW5ndGggPiAwID8gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5T3JkZXJbMF0pIDogbnVsbDtcbiAgICBpZiAoZmlyc3RQcm9wZXJ0eUlkKSB7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoZmlyc3RQcm9wZXJ0eUlkLCAwKTtcbiAgICAgIHZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLCBgJHt3aWR0aH1weGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlVEhlYWQoKTtcbiAgICBjb25zdCBoZWFkZXJSb3cgPSB0aGVhZC5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbGdyb3VwLmNyZWF0ZUVsKFwiY29sXCIpO1xuICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgdGhpcy5jb2x1bW5FbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGNvbCk7XG5cbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbmFtZSB9KTtcbiAgICAgIGhlYWRlci5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZW9yZGVyKSB7XG4gICAgICAgIGhlYWRlci5hZGRDbGFzcyhcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZVwiKTtcbiAgICAgICAgaGVhZGVyLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdPdmVyKGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJvcChldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICAgICk7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkpO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgdGhpcy5vbkNvbHVtbkRyYWdFbmQpO1xuICAgICAgfVxuICAgICAgdGhpcy5oZWFkZXJFbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGhlYWRlcik7XG5cbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gaGVhZGVyLmNyZWF0ZVNwYW4oe1xuICAgICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgaGFuZGxlLnNldEF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5zdGFydENvbHVtblJlc2l6ZShldmVudCwgcHJvcGVydHlLZXksIGluZGV4KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVUQm9keSgpO1xuICAgIGNvbnN0IGhhc1Zpc2libGVHcm91cGluZyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YS5sZW5ndGggPiAxO1xuXG4gICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBncm91cC5lbnRyaWVzO1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhc1Zpc2libGVHcm91cGluZykge1xuICAgICAgICBjb25zdCBncm91cFJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlID0gZ3JvdXAua2V5Py50b1N0cmluZygpID8/IFwiVW5ncm91cGVkXCI7XG4gICAgICAgIGNvbnN0IGdyb3VwQ2VsbCA9IGdyb3VwUm93LmNyZWF0ZUVsKFwidGRcIiwge1xuICAgICAgICAgIHRleHQ6IGtleVZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXBDZWxsLmNvbFNwYW4gPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZGF0YS1yb3dcIiB9KTtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByb3BlcnR5T3JkZXIubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgY29uc3QgcHJvcGVydHlJZCA9IHByb3BlcnR5T3JkZXJbaW5kZXhdO1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5S2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChwcm9wZXJ0eUtleSwgaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgICAgICBjZWxsLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgICAgIGNlbGwuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgY2VsbC5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICBjZWxsLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuXG4gICAgICAgICAgdGhpcy5yZW5kZXJDZWxsVmFsdWUoY2VsbCwgZW50cnksIHByb3BlcnR5SWQsIGZlYXR1cmVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQpOiBzdHJpbmcge1xuICAgIHJldHVybiBTdHJpbmcocHJvcGVydHlJZCk7XG4gIH1cblxuICBwcml2YXRlIGdldERlZmF1bHRGaXJzdENvbHVtbldpZHRoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWF4KFxuICAgICAgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFgsXG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5maXJzdENvbHVtbk1pbldpZHRoUHgsXG4gICAgICBERUZBVUxUX0NPTFVNTl9XSURUSF9QWFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNlbGxUZXh0KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRleHRWYWx1ZTogc3RyaW5nKSB7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0ZXh0VmFsdWUgfSk7XG4gICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgY29udGFpbmVyLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTGlua0ZyaWVuZGx5Q2VsbChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIHZhbHVlOiBhbnksXG4gICAgdGV4dFZhbHVlOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nXG4gICk6IGJvb2xlYW4ge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHRleHRWYWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgVXJsVmFsdWUgfHxcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgTGlua1ZhbHVlIHx8XG4gICAgICB0aGlzLmNvbnRhaW5zTGlrZWx5TGlua1N5bnRheCh0ZXh0VmFsdWUpXG4gICAgKSB7XG4gICAgICBjb250YWluZXIuZW1wdHkoKTtcblxuICAgICAgdm9pZCBNYXJrZG93blJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICB0ZXh0VmFsdWUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgc291cmNlUGF0aCxcbiAgICAgICAgdGhpcy5wbHVnaW5cbiAgICAgICkuY2F0Y2goKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlckNlbGxUZXh0KGNvbnRhaW5lciwgdGV4dFZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250YWluc0xpa2VseUxpbmtTeW50YXgodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKC9eXFxbW15cXF1dK1xcXVxcKFteXFwpXSpcXCkkL3UudGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNMaWtlbHlVcmkobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICgvXFxbXFxbW15cXF1dK1xcXVxcXS8udGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIC8oPzpodHRwcz86XFwvXFwvfHd3d1xcLilbXlxcczw+XCInKCldKy9pLnRlc3Qobm9ybWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIGlzTGlrZWx5VXJpKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gL15bYS16XVthLXowLTkrLi1dKjpbXlxcczw+J1wiKCldKyQvaS50ZXN0KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVXJpTGluayhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGhyZWY6IHN0cmluZyxcbiAgICBsYWJlbDogc3RyaW5nXG4gICkge1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnN0IGxpbmsgPSBjb250YWluZXIuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgICAgaHJlZixcbiAgICB9KTtcbiAgICBsaW5rLmFkZENsYXNzKFwiZXh0ZXJuYWwtbGlua1wiKTtcblxuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgd2luZG93Lm9wZW4oaHJlZiwgXCJfYmxhbmtcIiwgXCJub29wZW5lcixub3JlZmVycmVyXCIpO1xuICAgIH0pO1xuXG4gICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiaG92ZXItbGlua1wiLCB7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgaG92ZXJQYXJlbnQ6IHRoaXMsXG4gICAgICAgIHRhcmdldEVsOiBsaW5rLFxuICAgICAgICBsaW5rdGV4dDogaHJlZixcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNYXJrZG93bkxpbmsoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1hdGNoID0gL15cXFsoPzxsYWJlbD5bXlxcXV0rKVxcXVxcKCg/PGhyZWY+W15cXCldKj8pXFwpJC91LmV4ZWMoXG4gICAgICB2YWx1ZS50cmltKClcbiAgICApO1xuICAgIGlmICghbWF0Y2ggfHwgIW1hdGNoLmdyb3Vwcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGhyZWYgPSAobWF0Y2guZ3JvdXBzW1wiaHJlZlwiXSA/PyBcIlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnJlcGxhY2UoL1xccytbXCInXVteXCInXSpbXCInXSQvLCBcIlwiKTtcbiAgICBjb25zdCBsYWJlbCA9IG1hdGNoLmdyb3Vwc1tcImxhYmVsXCJdPy50cmltKCkgfHwgaHJlZjtcbiAgICBpZiAoIWhyZWYgfHwgIWxhYmVsIHx8ICF0aGlzLmlzTGlrZWx5VXJpKGhyZWYpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJVcmlMaW5rKGNvbnRhaW5lciwgaHJlZiwgbGFiZWwpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDZWxsVmFsdWUoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQsXG4gICAgZmVhdHVyZVNldHRpbmdzOiBGcm96ZW5UYWJsZVZpZXdGZWF0dXJlc1xuICApIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgY29uc3QgdmFsdWUgPSBlbnRyeS5nZXRWYWx1ZShwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbFwiKTtcblxuICAgIGlmIChwYXJzZWQudHlwZSA9PT0gXCJmaWxlXCIgJiYgcGFyc2VkLm5hbWUgPT09IFwibmFtZVwiKSB7XG4gICAgICBjb25zdCBsaW5rID0gY2VsbC5jcmVhdGVFbChcImFcIiwge1xuICAgICAgICB0ZXh0OiBlbnRyeS5maWxlLm5hbWUsXG4gICAgICAgIGhyZWY6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRDbGFzcyhcImludGVybmFsLWxpbmtcIik7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYW5lID0gS2V5bWFwLmlzTW9kRXZlbnQoZXZlbnQpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChwYW5lID09PSB0cnVlIHx8IHBhbmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBCb29sZWFuKHBhbmUpXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHBhbmUgYXMgUGFuZVR5cGVcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXCJob3Zlci1saW5rXCIsIHtcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgICBob3ZlclBhcmVudDogdGhpcyxcbiAgICAgICAgICB0YXJnZXRFbDogbGluayxcbiAgICAgICAgICBsaW5rdGV4dDogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSAmJiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcykge1xuICAgICAgY29uc3QgY29udGVudCA9IGNlbGwuY3JlYXRlU3BhbigpO1xuICAgICAgY29uc3Qgc291cmNlUGF0aCA9IGVudHJ5Py5maWxlPy5wYXRoID8/IFwiXCI7XG4gICAgICBpZiAodGhpcy5yZW5kZXJNYXJrZG93bkxpbmsoY29udGVudCwgdGV4dFZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzTGlrZWx5VXJpKHRleHRWYWx1ZSkpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJVcmlMaW5rKGNvbnRlbnQsIHRleHRWYWx1ZSwgdGV4dFZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVuZGVyZWRBc0xpbmtGcmllbmRseSA9IHRoaXMucmVuZGVyTGlua0ZyaWVuZGx5Q2VsbChcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIHRleHRWYWx1ZSxcbiAgICAgICAgc291cmNlUGF0aFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZW5kZXJlZEFzTGlua0ZyaWVuZGx5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBSZW5kZXJDb250ZXh0KCk7XG4gICAgICAgICAgY29udGV4dC5ob3ZlclBvcG92ZXIgPSB0aGlzLmhvdmVyUG9wb3ZlcjtcbiAgICAgICAgICB2YWx1ZS5yZW5kZXJUbyhjb250ZW50LCBjb250ZXh0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBcIltPYnNpZGlhbiBIb3RmaXhlc10gRmFpbGVkIHRvIHJlbmRlciB2YWx1ZSwgZmFsbGluZyBiYWNrIHRvIHBsYWluIHRleHQuXCIsXG4gICAgICAgICAgICBwcm9wZXJ0eUlkLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGhpcy5yZW5kZXJDZWxsVGV4dChjb250ZW50LCB0ZXh0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjZWxsLmNyZWF0ZVNwYW4oKTtcbiAgICAgIHRoaXMucmVuZGVyQ2VsbFRleHQoY29udGVudCwgdGV4dFZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAocGFyc2VkLnR5cGUgPT09IFwibm90ZVwiICYmIGZlYXR1cmVTZXR0aW5ncy5lZGl0YWJsZU5vdGVzKSB7XG4gICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJvYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGxcIik7XG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5iZWdpbkVkaXROb3RlQ2VsbChjZWxsLCBlbnRyeSwgcGFyc2VkLm5hbWUsIHRleHRWYWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYmVnaW5FZGl0Tm90ZUNlbGwoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eU5hbWU6IHN0cmluZyxcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZ1xuICApIHtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gY2VsbC5pbm5lclRleHQ7XG4gICAgY29uc3QgZWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xuICAgIGVkaXRvci52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBlZGl0b3Iucm93cyA9IDE7XG5cbiAgICBjb25zdCBjYW5jZWwgPSAoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBjb21taXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXh0VmFsdWUgPSBlZGl0b3IudmFsdWU7XG4gICAgICBpZiAobmV4dFZhbHVlICE9PSBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoXG4gICAgICAgICAgZW50cnkuZmlsZSxcbiAgICAgICAgICAoZnJvbnRtYXR0ZXIpID0+IHtcbiAgICAgICAgICAgIGZyb250bWF0dGVyW3Byb3BlcnR5TmFtZV0gPSBuZXh0VmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY2FuY2VsKCk7XG4gICAgfTtcblxuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gZWRpdG9yO1xuICAgIGNlbGwuZW1wdHkoKTtcbiAgICBjZWxsLmFwcGVuZENoaWxkKGVkaXRvcik7XG4gICAgZWRpdG9yLmZvY3VzKCk7XG4gICAgZWRpdG9yLmNsYXNzTmFtZSA9IFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1lZGl0b3JcIjtcblxuICAgIGVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCBjb21taXQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBcIkVzY2FwZVwiKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNhbmNlbCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICB2b2lkIGNvbW1pdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTYXZlZENvbHVtbldpZHRocygpOiBNYXA8c3RyaW5nLCBudW1iZXI+IHtcbiAgICBjb25zdCBzYXZlZCA9IHRoaXMuY29uZmlnLmdldChDT0xVTU5fV0lEVEhTX0NPTkZJR19LRVkpO1xuICAgIGNvbnN0IG1hcHBlZCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgICBpZiAoXG4gICAgICBzYXZlZCAmJlxuICAgICAgdHlwZW9mIHNhdmVkID09PSBcIm9iamVjdFwiICYmXG4gICAgICAhQXJyYXkuaXNBcnJheShzYXZlZClcbiAgICApIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNhdmVkKSkge1xuICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUod2lkdGgpKSB7XG4gICAgICAgICAgbWFwcGVkLnNldChrZXksIHdpZHRoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFwcGVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzeW5jQ29sdW1uV2lkdGhzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IHRoaXMuZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTtcbiAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5jbGVhcigpO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGxvYWRlZC5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldENvbHVtbldpZHRoKFxuICAgIHByb3BlcnR5SWQ6IHN0cmluZyxcbiAgICBpbmRleDogbnVtYmVyXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgZmFsbGJhY2tEZWZhdWx0ID0gaW5kZXggPT09IDBcbiAgICAgID8gdGhpcy5nZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpXG4gICAgICA6IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWQgPSB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5nZXQocHJvcGVydHlJZCk7XG4gICAgY29uc3Qgd2lkdGggPSB0eXBlb2YgY29uZmlndXJlZCA9PT0gXCJudW1iZXJcIiA/IGNvbmZpZ3VyZWQgOiBmYWxsYmFja0RlZmF1bHQ7XG4gICAgcmV0dXJuIHRoaXMuY2xhbXBDb2x1bW5XaWR0aCh3aWR0aCwgaW5kZXggPT09IDApO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGFtcENvbHVtbldpZHRoKHdpZHRoOiBudW1iZXIsIGlzRmlyc3RDb2x1bW4gPSBmYWxzZSk6IG51bWJlciB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IE1hdGgubWF4KHdpZHRoLCBNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCk7XG4gICAgaWYgKCFpc0ZpcnN0Q29sdW1uKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbiA9IE1hdGgubWF4KE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLCBzZXR0aW5ncy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KG1pbiwgc2V0dGluZ3MuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KTtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobm9ybWFsaXplZCwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDb2x1bW5XaWR0aChwcm9wZXJ0eUlkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBpc0ZpcnN0Q29sdW1uID0gdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlclswXSA9PT0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBub3JtYWxpemVkID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKHdpZHRoLCBpc0ZpcnN0Q29sdW1uKTtcbiAgICBjb25zdCBjb2x1bW4gPSB0aGlzLmNvbHVtbkVsZW1lbnRzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBpZiAoY29sdW1uKSB7XG4gICAgICBjb2x1bW4uc3R5bGUud2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGNvbHVtbi5zdHlsZS5taW5XaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgY29sdW1uLnN0eWxlLm1heFdpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5oZWFkZXJFbGVtZW50cy5nZXQocHJvcGVydHlJZCk7XG4gICAgaWYgKGhlYWRlcikge1xuICAgICAgaGVhZGVyLnN0eWxlLndpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBoZWFkZXIuc3R5bGUubWluV2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgIH1cblxuICAgIGlmIChpc0ZpcnN0Q29sdW1uICYmIHRoaXMuYWN0aXZlVmlldykge1xuICAgICAgdGhpcy5hY3RpdmVWaWV3LnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoXCIsXG4gICAgICAgIGAke25vcm1hbGl6ZWR9cHhgXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdENvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBzZXJpYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZW50cmllcygpKSB7XG4gICAgICBzZXJpYWxpemVkW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5jb25maWcuc2V0KENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSwgc2VyaWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3RDb2x1bW5PcmRlcihvcmRlcjogQmFzZXNQcm9wZXJ0eUlkW10pIHtcbiAgICB0aGlzLmNvbmZpZy5zZXQoXG4gICAgICBEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSxcbiAgICAgIG9yZGVyLm1hcCgocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHNhZmVBdHRyaWJ1dGVWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkge1xuICAgIHRoaXMucm9vdFxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoW2RhdGEtZHJhZy10YXJnZXRdXCIpXG4gICAgICAuZm9yRWFjaCgoaGVhZGVyQ2VsbCkgPT4ge1xuICAgICAgICBoZWFkZXJDZWxsLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIik7XG4gICAgICB9KTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdTdGFydChldmVudDogRHJhZ0V2ZW50LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBwcm9wZXJ0eUlkO1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwcm9wZXJ0eUlkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ092ZXIoZXZlbnQ6IERyYWdFdmVudCwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5kcmFnZ2luZ0NvbHVtbiB8fCB0aGlzLmRyYWdnaW5nQ29sdW1uID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBwcm9wZXJ0eUlkO1xuICAgIGNvbnN0IGhlYWRlckNlbGwgPSB0aGlzLnJvb3QucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICBgdGhbZGF0YS1wcm9wZXJ0eS1pZD1cIiR7dGhpcy5zYWZlQXR0cmlidXRlVmFsdWUocHJvcGVydHlJZCl9XCJdYFxuICAgICk7XG4gICAgaWYgKGhlYWRlckNlbGwpIHtcbiAgICAgIGhlYWRlckNlbGwuc2V0QXR0cmlidXRlKFwiZGF0YS1kcmFnLXRhcmdldFwiLCBcInRydWVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyb3AoZXZlbnQ6IERyYWdFdmVudCwgdGFyZ2V0UHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nQ29sdW1uIHx8IHRoaXMuZHJhZ2dpbmdDb2x1bW4gPT09IHRhcmdldFByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlciA9IHRoaXMuZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk7XG4gICAgY29uc3Qgc291cmNlSW5kZXggPSBvcmRlci5maW5kSW5kZXgoKHByb3BlcnR5SWQpID0+XG4gICAgICB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkgPT09IHRoaXMuZHJhZ2dpbmdDb2x1bW5cbiAgICApO1xuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gb3JkZXIuZmluZEluZGV4KFxuICAgICAgKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSA9PT0gdGFyZ2V0UHJvcGVydHlJZFxuICAgICk7XG4gICAgaWYgKHNvdXJjZUluZGV4ID09PSAtMSB8fCB0YXJnZXRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvcmRlci5zcGxpY2Uoc291cmNlSW5kZXgsIDEpO1xuICAgIG9yZGVyLnNwbGljZSh0YXJnZXRJbmRleCwgMCwgdGhpcy5kcmFnZ2luZ0NvbHVtbiBhcyBCYXNlc1Byb3BlcnR5SWQpO1xuICAgIHRoaXMucGVyc2lzdENvbHVtbk9yZGVyKG9yZGVyKTtcbiAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ0VuZCA9ICgpID0+IHtcbiAgICBpZiAoIWdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKS5lbmFibGVSZW9yZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgfTtcblxuICBwcml2YXRlIGdldEN1cnJlbnRDb2x1bW5PcmRlcigpOiBCYXNlc1Byb3BlcnR5SWRbXSB7XG4gICAgY29uc3QgZXhwbGljaXRPcmRlciA9IHRoaXMuY29uZmlnLmdldChEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZXhwbGljaXRPcmRlcikpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IG5ldyBTZXQodGhpcy5kYXRhLnByb3BlcnRpZXMubWFwKChwcm9wZXJ0eUlkKSA9PlxuICAgICAgICB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZClcbiAgICAgICkpO1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGV4cGxpY2l0T3JkZXJcbiAgICAgICAgLm1hcCgodmFsdWUpID0+XG4gICAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gKHZhbHVlIGFzIEJhc2VzUHJvcGVydHlJZCkgOiBudWxsXG4gICAgICAgIClcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICAodmFsdWUpOiB2YWx1ZSBpcyBCYXNlc1Byb3BlcnR5SWQgPT5cbiAgICAgICAgICAgIHZhbHVlICE9PSBudWxsICYmXG4gICAgICAgICAgICBhdmFpbGFibGUuaGFzKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpICYmXG4gICAgICAgICAgICAoc2Vlbi5oYXModGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSkgPyBmYWxzZSA6IChzZWVuLmFkZCh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSwgdHJ1ZSkpXG4gICAgICAgICk7XG5cbiAgICAgIGlmIChub3JtYWxpemVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFNldCA9IG5ldyBTZXQoXG4gICAgICAgICAgbm9ybWFsaXplZC5tYXAoKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbWlzc2luZyA9IHRoaXMuZGF0YS5wcm9wZXJ0aWVzLmZpbHRlcihcbiAgICAgICAgICAocHJvcGVydHlJZCkgPT4gIW5vcm1hbGl6ZWRTZXQuaGFzKHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIFsuLi5ub3JtYWxpemVkLCAuLi5taXNzaW5nXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBleHBsaWNpdE9yZGVyRnJvbUFwaSA9IHRoaXMuY29uZmlnLmdldE9yZGVyKCk7XG4gICAgaWYgKGV4cGxpY2l0T3JkZXJGcm9tQXBpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBleHBsaWNpdE9yZGVyRnJvbUFwaTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kYXRhLnByb3BlcnRpZXM7XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5T3JkZXIoKTogQmFzZXNQcm9wZXJ0eUlkW10ge1xuICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRDb2x1bW5PcmRlcigpO1xuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgbWluV2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1heFdpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJhc2VGaWxlVG9nZ2xlOiBUb2dnbGVDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBlbWJlZGRlZEJhc2VUb2dnbGU6IFRvZ2dsZUNvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldFNlY3Rpb25FbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5taW5XaWR0aElucHV0KSB0aGlzLm1pbldpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRCYXNlVmlld1N3aXRjaGVyU2VjdGlvbkVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLmJhc2VGaWxlVG9nZ2xlKSB0aGlzLmJhc2VGaWxlVG9nZ2xlLnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5lbWJlZGRlZEJhc2VUb2dnbGUpIHRoaXMuZW1iZWRkZWRCYXNlVG9nZ2xlLnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk9ic2lkaWFuIEhvdGZpeGVzXCIgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBcIkJhc2VzOiBGcm96ZW4gZmlyc3QgY29sdW1uXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGN1c3RvbSBmcm96ZW4gdGFibGUgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiVXNlIGEgY3VzdG9tIEJhc2VzIHZpZXcgd2l0aCBhIHN0aWNreSBmaXJzdCBjb2x1bW4gaW5zdGVhZCBvZiBvdmVybGF5IGhhY2tzLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBlbmFibGVkOiB2YWx1ZSB9KTtcbiAgICAgICAgICB0aGlzLnNldFNlY3Rpb25FbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtaW5pbXVtIHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiTWluaW11bSB3aWR0aCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWluV2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWluV2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1pbldpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtYXggd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJDYXAgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4gd2lkdGguXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm1heFdpZHRoSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS5maXJzdENvbHVtbk1heFdpZHRoUHgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkgfHwgcGFyc2VkIDwgODApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBwYXJzZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJCYWNrZ3JvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIkJhY2tncm91bmQgdXNlZCBiZWhpbmQgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0YWNraW5nIG9yZGVyIGZvciB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjRcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRHJhdyBhIGRpdmlkZXIgdG8gdGhlIHJpZ2h0IG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5zaG93RGl2aWRlcik7XG4gICAgICAgIHRvZ2dsZS5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHNob3dEaXZpZGVyOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQoc3RhdGUuZW5hYmxlZCk7XG5cbiAgICBjb25zdCBzd2l0Y2hlckRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIHN3aXRjaGVyRGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogXCJCYXNlczogUXVpY2sgdmlldyBzd2l0Y2hlclwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHN3aXRjaGVyU2VjdGlvbiA9IHN3aXRjaGVyRGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICB9KTtcbiAgICBjb25zdCBzd2l0Y2hlclN0YXRlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuYmFzZVZpZXdTd2l0Y2hlcjtcblxuICAgIG5ldyBTZXR0aW5nKHN3aXRjaGVyU2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIHZpZXcgc3dpdGNoZXIgcm93XCIpXG4gICAgICAuc2V0RGVzYyhcIkFkZCBjb21wYWN0IGJ1dHRvbnMgYWJvdmUgZWFjaCBCYXNlIGZvciBqdW1waW5nIGJldHdlZW4gaXRzIHZpZXdzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzd2l0Y2hlclN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlQmFzZVZpZXdTd2l0Y2hlcih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0QmFzZVZpZXdTd2l0Y2hlclNlY3Rpb25FbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHN3aXRjaGVyU2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBhYm92ZSBvcGVuZWQgLmJhc2UgZmlsZXNcIilcbiAgICAgIC5zZXREZXNjKFwiQWRkIHRoZSByb3cgd2hlbiBhIEJhc2UgZmlsZSBpcyBvcGVuZWQgZGlyZWN0bHkuXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdGhpcy5iYXNlRmlsZVRvZ2dsZSA9IHRvZ2dsZTtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN3aXRjaGVyU3RhdGUuc2hvd0luQmFzZUZpbGVzKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzd2l0Y2hlclN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlQmFzZVZpZXdTd2l0Y2hlcih7IHNob3dJbkJhc2VGaWxlczogdmFsdWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzd2l0Y2hlclNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlNob3cgYWJvdmUgZW1iZWRkZWQgQmFzZXNcIilcbiAgICAgIC5zZXREZXNjKFwiQWRkIHRoZSByb3cgZm9yIGVtYmVkZGVkIC5iYXNlIGZpbGVzIGluIG5vdGVzLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRoaXMuZW1iZWRkZWRCYXNlVG9nZ2xlID0gdG9nZ2xlO1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3dpdGNoZXJTdGF0ZS5zaG93SW5FbWJlZHMpO1xuICAgICAgICB0b2dnbGUuc2V0RGlzYWJsZWQoIXN3aXRjaGVyU3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVCYXNlVmlld1N3aXRjaGVyKHsgc2hvd0luRW1iZWRzOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0QmFzZVZpZXdTd2l0Y2hlclNlY3Rpb25FbmFibGVkKHN3aXRjaGVyU3RhdGUuZW5hYmxlZCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQXVCTztBQUVQLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0seUJBQXlCO0FBQy9CLElBQU0sMEJBQTBCO0FBQ2hDLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0sNkJBQTZCO0FBQ25DLElBQU0sMkJBQTJCO0FBRWpDLElBQU0sa0NBQWtDO0FBQ3hDLElBQU0sbUNBQW1DO0FBQ3pDLElBQU0saUNBQWlDO0FBQ3ZDLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0scUNBQXFDO0FBQzNDLElBQU0sb0NBQW9DO0FBQzFDLElBQU0sdUNBQXVDO0FBQzdDLElBQU0sOEJB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QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQStEbkMsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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
