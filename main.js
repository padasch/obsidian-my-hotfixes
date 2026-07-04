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
  }
};
var ObsidianHotfixesPlugin = class extends import_obsidian.Plugin {
  settings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn }
  };
  styleElement = null;
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
                min: 18,
                max: 96,
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
      this.app.workspace.on("active-leaf-change", () => this.applyStyles())
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.refreshOpenFrozenViews())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refreshOpenFrozenViews())
    );
    this.registerDomEvent(window, "resize", () => this.refreshOpenFrozenViews());
  }
  onunload() {
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
      }
    };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.applyStyles();
    this.refreshOpenFrozenViews();
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
      18,
      Math.min(96, Math.round(features.cellHeightPx))
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
        const row = tbody.createEl("tr");
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
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIHR5cGUgQmFzZXNWaWV3Q29uZmlnLFxuICBIb3ZlclBhcmVudCxcbiAgSG92ZXJQb3BvdmVyLFxuICBMaW5rVmFsdWUsXG4gIEtleW1hcCxcbiAgUmVuZGVyQ29udGV4dCxcbiAgUGFuZVR5cGUsXG4gIFBsdWdpbixcbiAgUGx1Z2luU2V0dGluZ1RhYixcbiAgTWFya2Rvd25SZW5kZXJlcixcbiAgUXVlcnlDb250cm9sbGVyLFxuICBTZXR0aW5nLFxuICBUZXh0Q29tcG9uZW50LFxuICBVcmxWYWx1ZSxcbiAgcGFyc2VQcm9wZXJ0eUlkLFxuICB0eXBlIEJhc2VzUHJvcGVydHlJZCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IFNUWUxFX0VMRU1FTlRfSUQgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLXJ1bnRpbWUtc3R5bGVzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfVklFV19UWVBFID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tdGFibGVcIjtcbmNvbnN0IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYID0gMTgwO1xuY29uc3QgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFggPSA2MDtcbmNvbnN0IERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4tb3JkZXJcIjtcbmNvbnN0IENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6Y29sdW1uLXdpZHRoc1wiO1xuXG5jb25zdCBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcmVzaXplXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXJlb3JkZXJcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXByZXNlcnZlLWxpbmtzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLWVkaXQtbm90ZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS13cmFwLW1vZGVcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9UUlVOQ0FURV9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXRydW5jYXRlXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfQ0VMTF9IRUlHSFRfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS1jZWxsLWhlaWdodFwiO1xuXG5jb25zdCBERUZBVUxUX0NFTExfSEVJR0hUX1BYID0gMzQ7XG5cbnR5cGUgRnJvemVuVGFibGVXcmFwTW9kZSA9IFwibmFycm93XCIgfCBcIndpZGVcIjtcblxuaW50ZXJmYWNlIEZyb3plblRhYmxlVmlld0ZlYXR1cmVzIHtcbiAgZW5hYmxlUmVzaXplOiBib29sZWFuO1xuICBlbmFibGVSZW9yZGVyOiBib29sZWFuO1xuICBwcmVzZXJ2ZUxpbmtzOiBib29sZWFuO1xuICBlZGl0YWJsZU5vdGVzOiBib29sZWFuO1xuICB3cmFwTW9kZTogRnJvemVuVGFibGVXcmFwTW9kZTtcbiAgY2VsbEhlaWdodFB4OiBudW1iZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTOiBGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyA9IHtcbiAgZW5hYmxlUmVzaXplOiBmYWxzZSxcbiAgZW5hYmxlUmVvcmRlcjogZmFsc2UsXG4gIHByZXNlcnZlTGlua3M6IHRydWUsXG4gIGVkaXRhYmxlTm90ZXM6IGZhbHNlLFxuICB3cmFwTW9kZTogXCJuYXJyb3dcIixcbiAgY2VsbEhlaWdodFB4OiBERUZBVUxUX0NFTExfSEVJR0hUX1BYLFxufTtcblxuZnVuY3Rpb24gZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgdmFsdWU6IHVua25vd24sXG4gIGZhbGxiYWNrOiBib29sZWFuXG4pOiBib29sZWFuIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJib29sZWFuXCIgPyB2YWx1ZSA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBnZXRTdHJpbmdGZWF0dXJlVmFsdWUoXG4gIHZhbHVlOiB1bmtub3duLFxuICBhbGxvd2VkOiBSZWFkb25seUFycmF5PHN0cmluZz4sXG4gIGZhbGxiYWNrOiBzdHJpbmdcbik6IHN0cmluZyB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgJiYgYWxsb3dlZC5pbmNsdWRlcyh2YWx1ZSlcbiAgICA/IHZhbHVlXG4gICAgOiBmYWxsYmFjaztcbn1cblxuZnVuY3Rpb24gZ2V0TnVtYmVyRmVhdHVyZVZhbHVlKHZhbHVlOiB1bmtub3duLCBmYWxsYmFjazogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIikge1xuICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpID8gdmFsdWUgOiBmYWxsYmFjaztcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiZcbiAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgIFwidmFsdWVcIiBpbiB2YWx1ZSAmJlxuICAgIHR5cGVvZiAodmFsdWUgYXMgeyB2YWx1ZT86IHVua25vd24gfSkudmFsdWUgPT09IFwibnVtYmVyXCJcbiAgKSB7XG4gICAgY29uc3QgbmVzdGVkVmFsdWUgPSAodmFsdWUgYXMgeyB2YWx1ZTogbnVtYmVyIH0pLnZhbHVlO1xuICAgIHJldHVybiBOdW1iZXIuaXNGaW5pdGUobmVzdGVkVmFsdWUpID8gbmVzdGVkVmFsdWUgOiBmYWxsYmFjaztcbiAgfVxuXG4gIGlmIChcbiAgICB0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiZcbiAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgIFwidmFsdWVcIiBpbiB2YWx1ZSAmJlxuICAgIHR5cGVvZiAodmFsdWUgYXMgeyB2YWx1ZT86IHVua25vd24gfSkudmFsdWUgPT09IFwic3RyaW5nXCJcbiAgKSB7XG4gICAgY29uc3QgbmVzdGVkUGFyc2VkID0gTnVtYmVyLnBhcnNlRmxvYXQoXG4gICAgICAodmFsdWUgYXMgeyB2YWx1ZTogc3RyaW5nIH0pLnZhbHVlXG4gICAgKTtcbiAgICByZXR1cm4gTnVtYmVyLmlzRmluaXRlKG5lc3RlZFBhcnNlZCkgPyBuZXN0ZWRQYXJzZWQgOiBmYWxsYmFjaztcbiAgfVxuXG4gIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VGbG9hdCh2YWx1ZSk7XG4gICAgcmV0dXJuIE51bWJlci5pc0Zpbml0ZShwYXJzZWQpID8gcGFyc2VkIDogZmFsbGJhY2s7XG4gIH1cblxuICByZXR1cm4gZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKFxuICBjb25maWc6IFBpY2s8QmFzZXNWaWV3Q29uZmlnLCBcImdldFwiPlxuKTogRnJvemVuVGFibGVWaWV3RmVhdHVyZXMge1xuICBjb25zdCBsZWdhY3lXcmFwTW9kZSA9IGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVkpLFxuICAgIFtcIm5hcnJvd1wiLCBcIndpZGVcIl0sXG4gICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMud3JhcE1vZGVcbiAgKTtcbiAgY29uc3QgdHJ1bmNhdGVCeVRvZ2dsZSA9IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfVFJVTkNBVEVfRkVBVFVSRV9LRVkpLFxuICAgIGxlZ2FjeVdyYXBNb2RlID09PSBcIm5hcnJvd1wiXG4gICk7XG5cbiAgcmV0dXJuIHtcbiAgICBlbmFibGVSZXNpemU6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9SRVNJWkVfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZW5hYmxlUmVzaXplXG4gICAgKSxcbiAgICBlbmFibGVSZW9yZGVyOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5lbmFibGVSZW9yZGVyXG4gICAgKSxcbiAgICBwcmVzZXJ2ZUxpbmtzOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfTElOS1NfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMucHJlc2VydmVMaW5rc1xuICAgICksXG4gICAgZWRpdGFibGVOb3RlczogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX0VESVRfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZWRpdGFibGVOb3Rlc1xuICAgICksXG4gICAgd3JhcE1vZGU6IHRydW5jYXRlQnlUb2dnbGUgPyBcIm5hcnJvd1wiIDogXCJ3aWRlXCIsXG4gICAgY2VsbEhlaWdodFB4OiBnZXROdW1iZXJGZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9DRUxMX0hFSUdIVF9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5jZWxsSGVpZ2h0UHhcbiAgICApLFxuICB9O1xufVxuXG5pbnRlcmZhY2UgRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncyB7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogbnVtYmVyO1xuICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEhvdGZpeFNldHRpbmdzIHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogMjIwLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMzIwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiA0LFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVnaXN0ZXJTZXR0aW5nVGFiKCk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZCA9IHRoaXMucmVnaXN0ZXJCYXNlc1ZpZXcoRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRSwge1xuICAgICAgbmFtZTogXCJGcm96ZW4gVGFibGVcIixcbiAgICAgIGljb246IFwibHVjaWRlLWxheW91dC1ncmlkXCIsXG4gICAgICBmYWN0b3J5OiAoY29udHJvbGxlciwgY29udGFpbmVyRWwpID0+XG4gICAgICAgIG5ldyBGcm96ZW5UYWJsZUJhc2VzVmlldyhjb250cm9sbGVyLCBjb250YWluZXJFbCwgdGhpcyksXG4gICAgICBvcHRpb25zOiAoY29uZmlnKSA9PiB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVTZXR0aW5ncyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKGNvbmZpZyk7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJncm91cFwiLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiRnJvemVuIHRhYmxlIG9wdGlvbnNcIixcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX1JFU0laRV9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgY29sdW1uIHJlc2l6aW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLmVuYWJsZVJlc2l6ZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgY29sdW1uIHJlb3JkZXJpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZW5hYmxlUmVvcmRlcixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfTElOS1NfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiUHJlc2VydmUgaW5saW5lIGxpbmsgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLnByZXNlcnZlTGlua3MsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX0VESVRfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiRW5hYmxlIG5vdGUtY2VsbCBlZGl0aW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLmVkaXRhYmxlTm90ZXMsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX1RSVU5DQVRFX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIlRydW5jYXRlIGxvbmcgdGV4dFwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy53cmFwTW9kZSA9PT0gXCJuYXJyb3dcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwic2xpZGVyXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfQ0VMTF9IRUlHSFRfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiQ2VsbCBoZWlnaHQgKHB4KVwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy5jZWxsSGVpZ2h0UHgsXG4gICAgICAgICAgICAgICAgaW5zdGFudDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtaW46IDE4LFxuICAgICAgICAgICAgICAgIG1heDogOTYsXG4gICAgICAgICAgICAgICAgc3RlcDogMSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5Rm9ybWF0OiAodmFsdWUpID0+IGAke3ZhbHVlfXB4YCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLmxvYWRlZCxcbiAgICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbldpZHRoID0gTWF0aC5tYXgoODAsIGNvbmZpZy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5tYXgobWluV2lkdGgsIGNvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHgpO1xuICAgIGNvbnN0IGRpdmlkZXIgPSBjb25maWcuc2hvd0RpdmlkZXJcbiAgICAgID8gXCIxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpXCJcbiAgICAgIDogXCJub25lXCI7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCB7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aDogJHttaW5XaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoOiAke21heFdpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWNlbGwtaGVpZ2h0OiAke0RFRkFVTFRfQ0VMTF9IRUlHSFRfUFh9cHg7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16OiAke2NvbmZpZy56SW5kZXh9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3Qge1xuICBvdmVyZmxvdy14OiBhdXRvO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB7XG4gIHdpZHRoOiBtYXgtY29udGVudDtcbiAgYm9yZGVyLWNvbGxhcHNlOiBzZXBhcmF0ZTtcbiAgYm9yZGVyLXNwYWNpbmc6IDA7XG4gIGZvbnQtc2l6ZTogdmFyKC0tZm9udC11aS1zbWFsbGVyKTtcbiAgdGFibGUtbGF5b3V0OiBmaXhlZDtcbiAgbWF4LXdpZHRoOiBub25lO1xuICBtaW4td2lkdGg6IG1heC1jb250ZW50O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoZWFkIHRoIHtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICB0b3A6IDA7XG4gIHotaW5kZXg6IGNhbGModmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXosIDQpICsgMSk7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgsXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRkIHtcbiAgcGFkZGluZzogOHB4IDEwcHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIGJvcmRlci1yaWdodDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgdmVydGljYWwtYWxpZ246IHRvcDtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgbWluLWhlaWdodDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtY2VsbC1oZWlnaHQpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtd3JhcC1uYXJyb3cgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtbmFycm93IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIGhlaWdodDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtY2VsbC1oZWlnaHQpO1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtd2lkZSAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgsXG4ub2JzaWRpYW4taG90Zml4ZXMtd3JhcC13aWRlIC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHdoaXRlLXNwYWNlOiBub3JtYWw7XG4gIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZDpmaXJzdC1jaGlsZCB7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIGxlZnQ6IDA7XG4gIG1pbi13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aCk7XG4gIHdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4td2lkdGgsIHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpKTtcbiAgbWF4LXdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnKTtcbiAgei1pbmRleDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXopO1xuICBib3JkZXItcmlnaHQ6ICR7ZGl2aWRlcn07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMDtcbiAgcmlnaHQ6IDA7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwcHg7XG4gIGN1cnNvcjogY29sLXJlc2l6ZTtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIHotaW5kZXg6IDI7XG4gIHRvdWNoLWFjdGlvbjogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZTo6YWZ0ZXIge1xuICBjb250ZW50OiBcIlwiO1xuICBkaXNwbGF5OiBibG9jaztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiA1MCU7XG4gIHRvcDogMDtcbiAgd2lkdGg6IDFweDtcbiAgaGVpZ2h0OiAxMDAlO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlb3JkZXItaGFuZGxlIHtcbiAgY3Vyc29yOiBncmFiO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoW2RhdGEtZHJhZy10YXJnZXQ9XCJ0cnVlXCJdIHtcbiAgb3V0bGluZTogMXB4IHNvbGlkIHZhcigtLWludGVyYWN0aXZlLWFjY2VudCk7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGg6Zmlyc3QtY2hpbGQge1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoZWFkIHRoOmZpcnN0LWNoaWxkIHtcbiAgbGVmdDogMDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0cjpmaXJzdC1vZi10eXBlIHRoOmxhc3QtY2hpbGQge1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ncm91cC1yb3cgdGQge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbCB7XG4gIGN1cnNvcjogdGV4dDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbCB0ZXh0YXJlYSxcbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwgaW5wdXQge1xuICB3aWR0aDogMTAwJTtcbiAgYm9yZGVyOiBub25lO1xuICBwYWRkaW5nOiAwO1xuICBmb250OiBpbmhlcml0O1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgY29sb3I6IGluaGVyaXQ7XG4gIHJlc2l6ZTogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1lbXB0eSB7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgcGFkZGluZzogMC43NXJlbSAwLjVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24ge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgbWFyZ2luLXRvcDogMC41cmVtO1xuICBwYWRkaW5nOiAwLjVyZW0gMC43NXJlbTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbiBzdW1tYXJ5IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBmb250LXdlaWdodDogNjAwO1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50IHtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ2FwOiAwLjc1cmVtO1xuICBtYXJnaW4tdG9wOiAwLjc1cmVtO1xufVxuYC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hPcGVuRnJvemVuVmlld3MoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEZyb3plblRhYmxlQmFzZXNWaWV3KSB7XG4gICAgICAgIHZpZXcub25EYXRhVXBkYXRlZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oXG4gICAgdXBkYXRlczogUGFydGlhbDxGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzPlxuICApIHtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4udGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG59XG5cbmNsYXNzIEZyb3plblRhYmxlQmFzZXNWaWV3IGV4dGVuZHMgQmFzZXNWaWV3IGltcGxlbWVudHMgSG92ZXJQYXJlbnQge1xuICBob3ZlclBvcG92ZXI6IEhvdmVyUG9wb3ZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IHJvb3Q6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGFjdGl2ZVZpZXc6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlRWRpdG9yOiBIVE1MVGV4dEFyZWFFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY3VycmVudFByb3BlcnR5T3JkZXI6IHN0cmluZ1tdID0gW107XG4gIHByaXZhdGUgcmVhZG9ubHkgY29sdW1uRWxlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgSFRNTFRhYmxlQ29sRWxlbWVudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBoZWFkZXJFbGVtZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBIVE1MVGFibGVIZWFkZXJDZWxsRWxlbWVudD4oKTtcbiAgcHJpdmF0ZSByZWFkb25seSBhY3RpdmVDb2x1bW5XaWR0aHMgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplQ29sdW1uSW5kZXg6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlc2l6ZVN0YXJ0WCA9IDA7XG4gIHByaXZhdGUgcmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSAwO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZVdpZHRoID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZVBvaW50ZXJJZDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZHJhZ2dpbmdDb2x1bW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZURyYWdUYXJnZXQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb25SZXNpemVQb2ludGVyTW92ZSA9IChldmVudDogUG9pbnRlckV2ZW50KSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgaWYgKCFmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gfHxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGxcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgZGVsdGEgPSBldmVudC5jbGllbnRYIC0gdGhpcy5yZXNpemVTdGFydFg7XG4gICAgY29uc3Qgd2lkdGggPSB0aGlzLmNsYW1wQ29sdW1uV2lkdGgoXG4gICAgICB0aGlzLnJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoICsgZGVsdGEsXG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSAwXG4gICAgKTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB3aWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB3aWR0aCk7XG4gIH07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBvblJlc2l6ZVBvaW50ZXJVcCA9ICgpID0+IHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBpZiAoIWZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gfHwgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlUmVzaXplV2lkdGggPSB0aGlzLmNsYW1wQ29sdW1uV2lkdGgoXG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoLFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gMFxuICAgICk7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLmFwcGx5Q29sdW1uV2lkdGgodGhpcy5hY3RpdmVSZXNpemVDb2x1bW4sIHRoaXMuYWN0aXZlUmVzaXplV2lkdGgpO1xuICAgIHRoaXMucGVyc2lzdENvbHVtbldpZHRocygpO1xuXG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBzdGFydENvbHVtblJlc2l6ZSA9IChcbiAgICBldmVudDogUG9pbnRlckV2ZW50LFxuICAgIHByb3BlcnR5SWQ6IHN0cmluZyxcbiAgICBpbmRleDogbnVtYmVyXG4gICkgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpO1xuICAgIGlmICghZmVhdHVyZXMuZW5hYmxlUmVzaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50ID0gZXZlbnQuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCB8IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBldmVudC5wb2ludGVySWQ7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCAmJiB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCAhPT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnNldFBvaW50ZXJDYXB0dXJlKHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkKTtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIm5vbmVcIjtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBQb2ludGVyIGNhcHR1cmUgY2FuIGZhaWwgaW4gZWRnZSBjYXNlcyAoZS5nLiBjZXJ0YWluIHdlYnZpZXdzKS5cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gPSBwcm9wZXJ0eUlkO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPSBpbmRleDtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0WCA9IGV2ZW50LmNsaWVudFg7XG4gICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlJZCwgaW5kZXgpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplV2lkdGggPSB0aGlzLnJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoO1xuXG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcImNvbC1yZXNpemVcIjtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJNb3ZlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHRoaXMub25SZXNpemVQb2ludGVyVXApO1xuICB9O1xuXG4gIHByaXZhdGUgc3RvcENvbHVtblJlc2l6ZSgpIHtcbiAgICBpZiAodGhpcy5hY3RpdmVSZXNpemVFbGVtZW50ICYmIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkICE9PSBudWxsKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQucmVsZWFzZVBvaW50ZXJDYXB0dXJlKHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkKTtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICAvLyBQb2ludGVyIGNhcHR1cmUgbWF5IG5vdCBiZSBhY3RpdmU7IGlnbm9yZS5cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uKSB7XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCA9IG51bGw7XG4gICAgICBpZiAodGhpcy5hY3RpdmVSZXNpemVFbGVtZW50KSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJcIjtcbiAgICAgIH1cbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMub25SZXNpemVQb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB0aGlzLm9uUmVzaXplUG9pbnRlclVwKTtcbiAgICBpZiAodGhpcy5hY3RpdmVSZXNpemVFbGVtZW50KSB7XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwiXCI7XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gMDtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0WCA9IDA7XG4gICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCA9IDA7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IG51bGw7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIlwiO1xuICB9XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29udHJvbGxlcjogUXVlcnlDb250cm9sbGVyLFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpblxuICApIHtcbiAgICBzdXBlcihjb250cm9sbGVyKTtcbiAgICB0aGlzLnJvb3QgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdFwiKTtcbiAgfVxuXG4gIHJlYWRvbmx5IHR5cGUgPSBGUk9aRU5fVEFCTEVfVklFV19UWVBFO1xuXG4gIHB1YmxpYyBvbkRhdGFVcGRhdGVkKCk6IHZvaWQge1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlcigpIHtcbiAgICB0aGlzLnJvb3QuZW1wdHkoKTtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpIHtcbiAgICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBjb25zdCBjZWxsSGVpZ2h0ID0gTWF0aC5tYXgoXG4gICAgICAxOCxcbiAgICAgIE1hdGgubWluKDk2LCBNYXRoLnJvdW5kKGZlYXR1cmVzLmNlbGxIZWlnaHRQeCkpXG4gICAgKTtcbiAgICB0aGlzLnJvb3QuY2xhc3NOYW1lID0gYG9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IG9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtJHtmZWF0dXJlcy53cmFwTW9kZX1gO1xuICAgIHRoaXMucm9vdC5zdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgIFwiLS1vYnNpZGlhbi1ob3RmaXhlcy1jZWxsLWhlaWdodFwiLFxuICAgICAgYCR7Y2VsbEhlaWdodH1weGBcbiAgICApO1xuXG4gICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlciA9IFtdO1xuICAgIHRoaXMuY29sdW1uRWxlbWVudHMuY2xlYXIoKTtcbiAgICB0aGlzLmhlYWRlckVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuY2xlYXIoKTtcbiAgICB0aGlzLnN0b3BDb2x1bW5SZXNpemUoKTtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMuc3luY0NvbHVtbldpZHRocygpO1xuXG4gICAgaWYgKCF0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5lbmFibGVkKSB7XG4gICAgICB0aGlzLnJvb3QuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIkZyb3plbiB0YWJsZSB2aWV3IGlzIGRpc2FibGVkLiBUdXJuIGl0IG9uIGluIHBsdWdpbiBzZXR0aW5ncy5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByb3BlcnR5T3JkZXIgPSB0aGlzLmdldFByb3BlcnR5T3JkZXIoKTtcbiAgICBpZiAoIXByb3BlcnR5T3JkZXIubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJvb3QuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1lbXB0eVwiLFxuICAgICAgICB0ZXh0OiBcIk5vIHByb3BlcnRpZXMgYXZhaWxhYmxlIGZvciB0aGlzIEJhc2UuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBwcm9wZXJ0eU9yZGVyLmZvckVhY2goKHByb3BlcnR5SWQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBrZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoa2V5LCBpbmRleCk7XG4gICAgICB0aGlzLmN1cnJlbnRQcm9wZXJ0eU9yZGVyW2luZGV4XSA9IGtleTtcbiAgICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldChrZXksIHdpZHRoKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHZpZXcgPSB0aGlzLnJvb3QuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXZpZXdcIik7XG4gICAgdGhpcy5hY3RpdmVWaWV3ID0gdmlldztcbiAgICBjb25zdCBmaXJzdFByb3BlcnR5SWQgPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aCA+IDAgPyB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlPcmRlclswXSkgOiBudWxsO1xuICAgIGlmIChmaXJzdFByb3BlcnR5SWQpIHtcbiAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChmaXJzdFByb3BlcnR5SWQsIDApO1xuICAgICAgdmlldy5zdHlsZS5zZXRQcm9wZXJ0eShcIi0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoXCIsIGAke3dpZHRofXB4YCk7XG4gICAgfVxuXG4gICAgY29uc3QgdGFibGUgPSB2aWV3LmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtdGFibGVcIiB9KTtcbiAgICBjb25zdCBjb2xncm91cCA9IHRhYmxlLmNyZWF0ZUVsKFwiY29sZ3JvdXBcIik7XG4gICAgY29uc3QgdGhlYWQgPSB0YWJsZS5jcmVhdGVUSGVhZCgpO1xuICAgIGNvbnN0IGhlYWRlclJvdyA9IHRoZWFkLmNyZWF0ZUVsKFwidHJcIik7XG5cbiAgICBwcm9wZXJ0eU9yZGVyLmZvckVhY2goKHByb3BlcnR5SWQsIGluZGV4KSA9PiB7XG4gICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChwcm9wZXJ0eUtleSwgaW5kZXgpO1xuICAgICAgY29uc3QgY29sID0gY29sZ3JvdXAuY3JlYXRlRWwoXCJjb2xcIik7XG4gICAgICBjb2wuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICBjb2wuc3R5bGUubWluV2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICBjb2wuc3R5bGUubWF4V2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICBjb2wuZGF0YXNldC5wcm9wZXJ0eUlkID0gcHJvcGVydHlLZXk7XG4gICAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLnNldChwcm9wZXJ0eUtleSwgY29sKTtcblxuICAgICAgY29uc3QgbmFtZSA9IHRoaXMuY29uZmlnLmdldERpc3BsYXlOYW1lKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3QgaGVhZGVyID0gaGVhZGVyUm93LmNyZWF0ZUVsKFwidGhcIiwgeyB0ZXh0OiBuYW1lIH0pO1xuICAgICAgaGVhZGVyLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgaGVhZGVyLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgaGVhZGVyLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgaGVhZGVyLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgaWYgKGZlYXR1cmVzLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgICAgaGVhZGVyLmFkZENsYXNzKFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlb3JkZXItaGFuZGxlXCIpO1xuICAgICAgICBoZWFkZXIuZHJhZ2dhYmxlID0gdHJ1ZTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PlxuICAgICAgICAgIHRoaXMub25Db2x1bW5EcmFnU3RhcnQoZXZlbnQsIHByb3BlcnR5S2V5KVxuICAgICAgICApO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ092ZXIoZXZlbnQsIHByb3BlcnR5S2V5KVxuICAgICAgICApO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgKGV2ZW50KSA9PlxuICAgICAgICAgIHRoaXMub25Db2x1bW5Ecm9wKGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT4gdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKSk7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2VuZFwiLCB0aGlzLm9uQ29sdW1uRHJhZ0VuZCk7XG4gICAgICB9XG4gICAgICB0aGlzLmhlYWRlckVsZW1lbnRzLnNldChwcm9wZXJ0eUtleSwgaGVhZGVyKTtcblxuICAgICAgaWYgKGZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgICBjb25zdCBoYW5kbGUgPSBoZWFkZXIuY3JlYXRlU3Bhbih7XG4gICAgICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlXCIsXG4gICAgICAgIH0pO1xuICAgICAgICBoYW5kbGUuc2V0QXR0cihcImRyYWdnYWJsZVwiLCBcImZhbHNlXCIpO1xuICAgICAgICBoYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLnN0YXJ0Q29sdW1uUmVzaXplKGV2ZW50LCBwcm9wZXJ0eUtleSwgaW5kZXgpXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCB0Ym9keSA9IHRhYmxlLmNyZWF0ZVRCb2R5KCk7XG4gICAgY29uc3QgaGFzVmlzaWJsZUdyb3VwaW5nID0gdGhpcy5kYXRhLmdyb3VwZWREYXRhLmxlbmd0aCA+IDE7XG5cbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZGF0YS5ncm91cGVkRGF0YSkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGdyb3VwLmVudHJpZXM7XG4gICAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFzVmlzaWJsZUdyb3VwaW5nKSB7XG4gICAgICAgIGNvbnN0IGdyb3VwUm93ID0gdGJvZHkuY3JlYXRlRWwoXCJ0clwiLCB7IGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1ncm91cC1yb3dcIiB9KTtcbiAgICAgICAgY29uc3Qga2V5VmFsdWUgPSBncm91cC5rZXk/LnRvU3RyaW5nKCkgPz8gXCJVbmdyb3VwZWRcIjtcbiAgICAgICAgY29uc3QgZ3JvdXBDZWxsID0gZ3JvdXBSb3cuY3JlYXRlRWwoXCJ0ZFwiLCB7XG4gICAgICAgICAgdGV4dDoga2V5VmFsdWUsXG4gICAgICAgIH0pO1xuICAgICAgICBncm91cENlbGwuY29sU3BhbiA9IHByb3BlcnR5T3JkZXIubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gdGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IHByb3BlcnR5T3JkZXIubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgICAgY29uc3QgcHJvcGVydHlJZCA9IHByb3BlcnR5T3JkZXJbaW5kZXhdO1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5S2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChwcm9wZXJ0eUtleSwgaW5kZXgpO1xuICAgICAgICAgIGNvbnN0IGNlbGwgPSByb3cuY3JlYXRlRWwoXCJ0ZFwiKTtcbiAgICAgICAgICBjZWxsLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgICAgIGNlbGwuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgY2VsbC5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICBjZWxsLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuXG4gICAgICAgICAgdGhpcy5yZW5kZXJDZWxsVmFsdWUoY2VsbCwgZW50cnksIHByb3BlcnR5SWQsIGZlYXR1cmVzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQpOiBzdHJpbmcge1xuICAgIHJldHVybiBTdHJpbmcocHJvcGVydHlJZCk7XG4gIH1cblxuICBwcml2YXRlIGdldERlZmF1bHRGaXJzdENvbHVtbldpZHRoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGgubWF4KFxuICAgICAgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFgsXG4gICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5maXJzdENvbHVtbk1pbldpZHRoUHgsXG4gICAgICBERUZBVUxUX0NPTFVNTl9XSURUSF9QWFxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNlbGxUZXh0KGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHRleHRWYWx1ZTogc3RyaW5nKSB7XG4gICAgY29udGFpbmVyLmVtcHR5KCk7XG4gICAgY29udGFpbmVyLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0ZXh0VmFsdWUgfSk7XG4gICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgY29udGFpbmVyLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTGlua0ZyaWVuZGx5Q2VsbChcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIHZhbHVlOiBhbnksXG4gICAgdGV4dFZhbHVlOiBzdHJpbmcsXG4gICAgc291cmNlUGF0aDogc3RyaW5nXG4gICk6IGJvb2xlYW4ge1xuICAgIGlmICghdmFsdWUgfHwgdHlwZW9mIHRleHRWYWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgVXJsVmFsdWUgfHxcbiAgICAgIHZhbHVlIGluc3RhbmNlb2YgTGlua1ZhbHVlIHx8XG4gICAgICB0aGlzLmNvbnRhaW5zTGlrZWx5TGlua1N5bnRheCh0ZXh0VmFsdWUpXG4gICAgKSB7XG4gICAgICBjb250YWluZXIuZW1wdHkoKTtcblxuICAgICAgdm9pZCBNYXJrZG93blJlbmRlcmVyLnJlbmRlcihcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLFxuICAgICAgICB0ZXh0VmFsdWUsXG4gICAgICAgIGNvbnRhaW5lcixcbiAgICAgICAgc291cmNlUGF0aCxcbiAgICAgICAgdGhpcy5wbHVnaW5cbiAgICAgICkuY2F0Y2goKCkgPT4ge1xuICAgICAgICB0aGlzLnJlbmRlckNlbGxUZXh0KGNvbnRhaW5lciwgdGV4dFZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcHJpdmF0ZSBjb250YWluc0xpa2VseUxpbmtTeW50YXgodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB2YWx1ZS50cmltKCk7XG4gICAgaWYgKCFub3JtYWxpemVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKC9eXFxbW15cXF1dK1xcXVxcKFteXFwpXSpcXCkkL3UudGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuaXNMaWtlbHlVcmkobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICgvXFxbXFxbW15cXF1dK1xcXVxcXS8udGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIC8oPzpodHRwcz86XFwvXFwvfHd3d1xcLilbXlxcczw+XCInKCldKy9pLnRlc3Qobm9ybWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIGlzTGlrZWx5VXJpKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICByZXR1cm4gL15bYS16XVthLXowLTkrLi1dKjpbXlxcczw+J1wiKCldKyQvaS50ZXN0KHZhbHVlKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyVXJpTGluayhcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGhyZWY6IHN0cmluZyxcbiAgICBsYWJlbDogc3RyaW5nXG4gICkge1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnN0IGxpbmsgPSBjb250YWluZXIuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgIHRleHQ6IGxhYmVsLFxuICAgICAgaHJlZixcbiAgICB9KTtcbiAgICBsaW5rLmFkZENsYXNzKFwiZXh0ZXJuYWwtbGlua1wiKTtcblxuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgd2luZG93Lm9wZW4oaHJlZiwgXCJfYmxhbmtcIiwgXCJub29wZW5lcixub3JlZmVycmVyXCIpO1xuICAgIH0pO1xuXG4gICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiaG92ZXItbGlua1wiLCB7XG4gICAgICAgIGV2ZW50LFxuICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgaG92ZXJQYXJlbnQ6IHRoaXMsXG4gICAgICAgIHRhcmdldEVsOiBsaW5rLFxuICAgICAgICBsaW5rdGV4dDogaHJlZixcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJNYXJrZG93bkxpbmsoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgdmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG1hdGNoID0gL15cXFsoPzxsYWJlbD5bXlxcXV0rKVxcXVxcKCg/PGhyZWY+W15cXCldKj8pXFwpJC91LmV4ZWMoXG4gICAgICB2YWx1ZS50cmltKClcbiAgICApO1xuICAgIGlmICghbWF0Y2ggfHwgIW1hdGNoLmdyb3Vwcykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNvbnN0IGhyZWYgPSAobWF0Y2guZ3JvdXBzW1wiaHJlZlwiXSA/PyBcIlwiKVxuICAgICAgLnRyaW0oKVxuICAgICAgLnJlcGxhY2UoL1xccytbXCInXVteXCInXSpbXCInXSQvLCBcIlwiKTtcbiAgICBjb25zdCBsYWJlbCA9IG1hdGNoLmdyb3Vwc1tcImxhYmVsXCJdPy50cmltKCkgfHwgaHJlZjtcbiAgICBpZiAoIWhyZWYgfHwgIWxhYmVsIHx8ICF0aGlzLmlzTGlrZWx5VXJpKGhyZWYpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhpcy5yZW5kZXJVcmlMaW5rKGNvbnRhaW5lciwgaHJlZiwgbGFiZWwpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDZWxsVmFsdWUoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQsXG4gICAgZmVhdHVyZVNldHRpbmdzOiBGcm96ZW5UYWJsZVZpZXdGZWF0dXJlc1xuICApIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgY29uc3QgdmFsdWUgPSBlbnRyeS5nZXRWYWx1ZShwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbFwiKTtcblxuICAgIGlmIChwYXJzZWQudHlwZSA9PT0gXCJmaWxlXCIgJiYgcGFyc2VkLm5hbWUgPT09IFwibmFtZVwiKSB7XG4gICAgICBjb25zdCBsaW5rID0gY2VsbC5jcmVhdGVFbChcImFcIiwge1xuICAgICAgICB0ZXh0OiBlbnRyeS5maWxlLm5hbWUsXG4gICAgICAgIGhyZWY6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRDbGFzcyhcImludGVybmFsLWxpbmtcIik7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYW5lID0gS2V5bWFwLmlzTW9kRXZlbnQoZXZlbnQpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChwYW5lID09PSB0cnVlIHx8IHBhbmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBCb29sZWFuKHBhbmUpXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHBhbmUgYXMgUGFuZVR5cGVcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXCJob3Zlci1saW5rXCIsIHtcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgICBob3ZlclBhcmVudDogdGhpcyxcbiAgICAgICAgICB0YXJnZXRFbDogbGluayxcbiAgICAgICAgICBsaW5rdGV4dDogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSAmJiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcykge1xuICAgICAgY29uc3QgY29udGVudCA9IGNlbGwuY3JlYXRlU3BhbigpO1xuICAgICAgY29uc3Qgc291cmNlUGF0aCA9IGVudHJ5Py5maWxlPy5wYXRoID8/IFwiXCI7XG4gICAgICBpZiAodGhpcy5yZW5kZXJNYXJrZG93bkxpbmsoY29udGVudCwgdGV4dFZhbHVlKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzTGlrZWx5VXJpKHRleHRWYWx1ZSkpIHtcbiAgICAgICAgdGhpcy5yZW5kZXJVcmlMaW5rKGNvbnRlbnQsIHRleHRWYWx1ZSwgdGV4dFZhbHVlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVuZGVyZWRBc0xpbmtGcmllbmRseSA9IHRoaXMucmVuZGVyTGlua0ZyaWVuZGx5Q2VsbChcbiAgICAgICAgY29udGVudCxcbiAgICAgICAgdmFsdWUsXG4gICAgICAgIHRleHRWYWx1ZSxcbiAgICAgICAgc291cmNlUGF0aFxuICAgICAgKTtcblxuICAgICAgaWYgKCFyZW5kZXJlZEFzTGlua0ZyaWVuZGx5KSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBSZW5kZXJDb250ZXh0KCk7XG4gICAgICAgICAgY29udGV4dC5ob3ZlclBvcG92ZXIgPSB0aGlzLmhvdmVyUG9wb3ZlcjtcbiAgICAgICAgICB2YWx1ZS5yZW5kZXJUbyhjb250ZW50LCBjb250ZXh0KTtcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgICAgICBcIltPYnNpZGlhbiBIb3RmaXhlc10gRmFpbGVkIHRvIHJlbmRlciB2YWx1ZSwgZmFsbGluZyBiYWNrIHRvIHBsYWluIHRleHQuXCIsXG4gICAgICAgICAgICBwcm9wZXJ0eUlkLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgdGhpcy5yZW5kZXJDZWxsVGV4dChjb250ZW50LCB0ZXh0VmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjZWxsLmNyZWF0ZVNwYW4oKTtcbiAgICAgIHRoaXMucmVuZGVyQ2VsbFRleHQoY29udGVudCwgdGV4dFZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAocGFyc2VkLnR5cGUgPT09IFwibm90ZVwiICYmIGZlYXR1cmVTZXR0aW5ncy5lZGl0YWJsZU5vdGVzKSB7XG4gICAgICBjZWxsLmNsYXNzTGlzdC5hZGQoXCJvYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGxcIik7XG4gICAgICBjZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkYmxjbGlja1wiLCAoKSA9PiB7XG4gICAgICAgIHZvaWQgdGhpcy5iZWdpbkVkaXROb3RlQ2VsbChjZWxsLCBlbnRyeSwgcGFyc2VkLm5hbWUsIHRleHRWYWx1ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYmVnaW5FZGl0Tm90ZUNlbGwoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eU5hbWU6IHN0cmluZyxcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZ1xuICApIHtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gY2VsbC5pbm5lclRleHQ7XG4gICAgY29uc3QgZWRpdG9yID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xuICAgIGVkaXRvci52YWx1ZSA9IGluaXRpYWxWYWx1ZTtcbiAgICBlZGl0b3Iucm93cyA9IDE7XG5cbiAgICBjb25zdCBjYW5jZWwgPSAoKSA9PiB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH07XG5cbiAgICBjb25zdCBjb21taXQgPSBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXh0VmFsdWUgPSBlZGl0b3IudmFsdWU7XG4gICAgICBpZiAobmV4dFZhbHVlICE9PSBwcmV2aW91c1ZhbHVlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLmFwcC5maWxlTWFuYWdlci5wcm9jZXNzRnJvbnRNYXR0ZXIoXG4gICAgICAgICAgZW50cnkuZmlsZSxcbiAgICAgICAgICAoZnJvbnRtYXR0ZXIpID0+IHtcbiAgICAgICAgICAgIGZyb250bWF0dGVyW3Byb3BlcnR5TmFtZV0gPSBuZXh0VmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY2FuY2VsKCk7XG4gICAgfTtcblxuICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gZWRpdG9yO1xuICAgIGNlbGwuZW1wdHkoKTtcbiAgICBjZWxsLmFwcGVuZENoaWxkKGVkaXRvcik7XG4gICAgZWRpdG9yLmZvY3VzKCk7XG4gICAgZWRpdG9yLmNsYXNzTmFtZSA9IFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1lZGl0b3JcIjtcblxuICAgIGVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCBjb21taXQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBcIkVzY2FwZVwiKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNhbmNlbCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCAoKSA9PiB7XG4gICAgICB2b2lkIGNvbW1pdCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTYXZlZENvbHVtbldpZHRocygpOiBNYXA8c3RyaW5nLCBudW1iZXI+IHtcbiAgICBjb25zdCBzYXZlZCA9IHRoaXMuY29uZmlnLmdldChDT0xVTU5fV0lEVEhTX0NPTkZJR19LRVkpO1xuICAgIGNvbnN0IG1hcHBlZCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgICBpZiAoXG4gICAgICBzYXZlZCAmJlxuICAgICAgdHlwZW9mIHNhdmVkID09PSBcIm9iamVjdFwiICYmXG4gICAgICAhQXJyYXkuaXNBcnJheShzYXZlZClcbiAgICApIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNhdmVkKSkge1xuICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUod2lkdGgpKSB7XG4gICAgICAgICAgbWFwcGVkLnNldChrZXksIHdpZHRoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFwcGVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzeW5jQ29sdW1uV2lkdGhzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IHRoaXMuZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTtcbiAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5jbGVhcigpO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGxvYWRlZC5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldENvbHVtbldpZHRoKFxuICAgIHByb3BlcnR5SWQ6IHN0cmluZyxcbiAgICBpbmRleDogbnVtYmVyXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgZmFsbGJhY2tEZWZhdWx0ID0gaW5kZXggPT09IDBcbiAgICAgID8gdGhpcy5nZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpXG4gICAgICA6IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWQgPSB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5nZXQocHJvcGVydHlJZCk7XG4gICAgY29uc3Qgd2lkdGggPSB0eXBlb2YgY29uZmlndXJlZCA9PT0gXCJudW1iZXJcIiA/IGNvbmZpZ3VyZWQgOiBmYWxsYmFja0RlZmF1bHQ7XG4gICAgcmV0dXJuIHRoaXMuY2xhbXBDb2x1bW5XaWR0aCh3aWR0aCwgaW5kZXggPT09IDApO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGFtcENvbHVtbldpZHRoKHdpZHRoOiBudW1iZXIsIGlzRmlyc3RDb2x1bW4gPSBmYWxzZSk6IG51bWJlciB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IE1hdGgubWF4KHdpZHRoLCBNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCk7XG4gICAgaWYgKCFpc0ZpcnN0Q29sdW1uKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbiA9IE1hdGgubWF4KE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLCBzZXR0aW5ncy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KG1pbiwgc2V0dGluZ3MuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KTtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobm9ybWFsaXplZCwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDb2x1bW5XaWR0aChwcm9wZXJ0eUlkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBpc0ZpcnN0Q29sdW1uID0gdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlclswXSA9PT0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBub3JtYWxpemVkID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKHdpZHRoLCBpc0ZpcnN0Q29sdW1uKTtcbiAgICBjb25zdCBjb2x1bW4gPSB0aGlzLmNvbHVtbkVsZW1lbnRzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBpZiAoY29sdW1uKSB7XG4gICAgICBjb2x1bW4uc3R5bGUud2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGNvbHVtbi5zdHlsZS5taW5XaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgY29sdW1uLnN0eWxlLm1heFdpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5oZWFkZXJFbGVtZW50cy5nZXQocHJvcGVydHlJZCk7XG4gICAgaWYgKGhlYWRlcikge1xuICAgICAgaGVhZGVyLnN0eWxlLndpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBoZWFkZXIuc3R5bGUubWluV2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgIH1cblxuICAgIGlmIChpc0ZpcnN0Q29sdW1uICYmIHRoaXMuYWN0aXZlVmlldykge1xuICAgICAgdGhpcy5hY3RpdmVWaWV3LnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoXCIsXG4gICAgICAgIGAke25vcm1hbGl6ZWR9cHhgXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdENvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBzZXJpYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZW50cmllcygpKSB7XG4gICAgICBzZXJpYWxpemVkW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5jb25maWcuc2V0KENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSwgc2VyaWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3RDb2x1bW5PcmRlcihvcmRlcjogQmFzZXNQcm9wZXJ0eUlkW10pIHtcbiAgICB0aGlzLmNvbmZpZy5zZXQoXG4gICAgICBEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSxcbiAgICAgIG9yZGVyLm1hcCgocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHNhZmVBdHRyaWJ1dGVWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkge1xuICAgIHRoaXMucm9vdFxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoW2RhdGEtZHJhZy10YXJnZXRdXCIpXG4gICAgICAuZm9yRWFjaCgoaGVhZGVyQ2VsbCkgPT4ge1xuICAgICAgICBoZWFkZXJDZWxsLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIik7XG4gICAgICB9KTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdTdGFydChldmVudDogRHJhZ0V2ZW50LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBwcm9wZXJ0eUlkO1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwcm9wZXJ0eUlkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ092ZXIoZXZlbnQ6IERyYWdFdmVudCwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5kcmFnZ2luZ0NvbHVtbiB8fCB0aGlzLmRyYWdnaW5nQ29sdW1uID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBwcm9wZXJ0eUlkO1xuICAgIGNvbnN0IGhlYWRlckNlbGwgPSB0aGlzLnJvb3QucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICBgdGhbZGF0YS1wcm9wZXJ0eS1pZD1cIiR7dGhpcy5zYWZlQXR0cmlidXRlVmFsdWUocHJvcGVydHlJZCl9XCJdYFxuICAgICk7XG4gICAgaWYgKGhlYWRlckNlbGwpIHtcbiAgICAgIGhlYWRlckNlbGwuc2V0QXR0cmlidXRlKFwiZGF0YS1kcmFnLXRhcmdldFwiLCBcInRydWVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyb3AoZXZlbnQ6IERyYWdFdmVudCwgdGFyZ2V0UHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nQ29sdW1uIHx8IHRoaXMuZHJhZ2dpbmdDb2x1bW4gPT09IHRhcmdldFByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlciA9IHRoaXMuZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk7XG4gICAgY29uc3Qgc291cmNlSW5kZXggPSBvcmRlci5maW5kSW5kZXgoKHByb3BlcnR5SWQpID0+XG4gICAgICB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkgPT09IHRoaXMuZHJhZ2dpbmdDb2x1bW5cbiAgICApO1xuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gb3JkZXIuZmluZEluZGV4KFxuICAgICAgKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSA9PT0gdGFyZ2V0UHJvcGVydHlJZFxuICAgICk7XG4gICAgaWYgKHNvdXJjZUluZGV4ID09PSAtMSB8fCB0YXJnZXRJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBvcmRlci5zcGxpY2Uoc291cmNlSW5kZXgsIDEpO1xuICAgIG9yZGVyLnNwbGljZSh0YXJnZXRJbmRleCwgMCwgdGhpcy5kcmFnZ2luZ0NvbHVtbiBhcyBCYXNlc1Byb3BlcnR5SWQpO1xuICAgIHRoaXMucGVyc2lzdENvbHVtbk9yZGVyKG9yZGVyKTtcbiAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ0VuZCA9ICgpID0+IHtcbiAgICBpZiAoIWdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKS5lbmFibGVSZW9yZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgfTtcblxuICBwcml2YXRlIGdldEN1cnJlbnRDb2x1bW5PcmRlcigpOiBCYXNlc1Byb3BlcnR5SWRbXSB7XG4gICAgY29uc3QgZXhwbGljaXRPcmRlciA9IHRoaXMuY29uZmlnLmdldChEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSk7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZXhwbGljaXRPcmRlcikpIHtcbiAgICAgIGNvbnN0IGF2YWlsYWJsZSA9IG5ldyBTZXQodGhpcy5kYXRhLnByb3BlcnRpZXMubWFwKChwcm9wZXJ0eUlkKSA9PlxuICAgICAgICB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZClcbiAgICAgICkpO1xuICAgICAgY29uc3Qgc2VlbiA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICAgICAgY29uc3Qgbm9ybWFsaXplZCA9IGV4cGxpY2l0T3JkZXJcbiAgICAgICAgLm1hcCgodmFsdWUpID0+XG4gICAgICAgICAgdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gKHZhbHVlIGFzIEJhc2VzUHJvcGVydHlJZCkgOiBudWxsXG4gICAgICAgIClcbiAgICAgICAgLmZpbHRlcihcbiAgICAgICAgICAodmFsdWUpOiB2YWx1ZSBpcyBCYXNlc1Byb3BlcnR5SWQgPT5cbiAgICAgICAgICAgIHZhbHVlICE9PSBudWxsICYmXG4gICAgICAgICAgICBhdmFpbGFibGUuaGFzKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpICYmXG4gICAgICAgICAgICAoc2Vlbi5oYXModGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSkgPyBmYWxzZSA6IChzZWVuLmFkZCh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSwgdHJ1ZSkpXG4gICAgICAgICk7XG5cbiAgICAgIGlmIChub3JtYWxpemVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qgbm9ybWFsaXplZFNldCA9IG5ldyBTZXQoXG4gICAgICAgICAgbm9ybWFsaXplZC5tYXAoKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgbWlzc2luZyA9IHRoaXMuZGF0YS5wcm9wZXJ0aWVzLmZpbHRlcihcbiAgICAgICAgICAocHJvcGVydHlJZCkgPT4gIW5vcm1hbGl6ZWRTZXQuaGFzKHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIFsuLi5ub3JtYWxpemVkLCAuLi5taXNzaW5nXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBleHBsaWNpdE9yZGVyRnJvbUFwaSA9IHRoaXMuY29uZmlnLmdldE9yZGVyKCk7XG4gICAgaWYgKGV4cGxpY2l0T3JkZXJGcm9tQXBpLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiBleHBsaWNpdE9yZGVyRnJvbUFwaTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5kYXRhLnByb3BlcnRpZXM7XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5T3JkZXIoKTogQmFzZXNQcm9wZXJ0eUlkW10ge1xuICAgIHJldHVybiB0aGlzLmdldEN1cnJlbnRDb2x1bW5PcmRlcigpO1xuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgbWluV2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1heFdpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldFNlY3Rpb25FbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5taW5XaWR0aElucHV0KSB0aGlzLm1pbldpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICB9XG5cbiAgZGlzcGxheSgpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT2JzaWRpYW4gSG90Zml4ZXNcIiB9KTtcblxuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IFwiQmFzZXM6IEZyb3plbiBmaXJzdCBjb2x1bW5cIixcbiAgICB9KTtcbiAgICBjb25zdCBzZWN0aW9uID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgY3VzdG9tIGZyb3plbiB0YWJsZSB2aWV3XCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJVc2UgYSBjdXN0b20gQmFzZXMgdmlldyB3aXRoIGEgc3RpY2t5IGZpcnN0IGNvbHVtbiBpbnN0ZWFkIG9mIG92ZXJsYXkgaGFja3MuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQodmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1pbmltdW0gd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJNaW5pbXVtIHdpZHRoIG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5taW5XaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1heCB3aWR0aCAocHgpXCIpXG4gICAgICAuc2V0RGVzYyhcIkNhcCB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbiB3aWR0aC5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWF4V2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkJhY2tncm91bmRcIilcbiAgICAgIC5zZXREZXNjKFwiQmFja2dyb3VuZCB1c2VkIGJlaGluZCB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShzdGF0ZS5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB2YWx1ZSB8fCBERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcInotaW5kZXhcIilcbiAgICAgIC5zZXREZXNjKFwiU3RhY2tpbmcgb3JkZXIgZm9yIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy56SW5kZXhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLnpJbmRleCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiNFwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyB6SW5kZXg6IHBhcnNlZCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlNob3cgZGl2aWRlclwiKVxuICAgICAgLnNldERlc2MoXCJEcmF3IGEgZGl2aWRlciB0byB0aGUgcmlnaHQgb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLnNob3dEaXZpZGVyKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgc2hvd0RpdmlkZXI6IHZhbHVlIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5zZXRTZWN0aW9uRW5hYmxlZChzdGF0ZS5lbmFibGVkKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBbUJPO0FBRVAsSUFBTSxtQkFBbUI7QUFDekIsSUFBTSx5QkFBeUI7QUFDL0IsSUFBTSwwQkFBMEI7QUFDaEMsSUFBTSxnQ0FBZ0M7QUFDdEMsSUFBTSw2QkFBNkI7QUFDbkMsSUFBTSwyQkFBMkI7QUFFakMsSUFBTSxrQ0FBa0M7QUFDeEMsSUFBTSxtQ0FBbUM7QUFDekMsSUFBTSxpQ0FBaUM7QUFDdkMsSUFBTSxnQ0FBZ0M7QUFDdEMsSUFBTSxxQ0FBcUM7QUFDM0MsSUFBTSxvQ0FBb0M7QUFDMUMsSUFBTSx1Q0FBdUM7QUFFN0MsSUFBTSx5QkFBeUI7QUFhL0IsSUFBTSxnQ0FBeUQ7QUFBQSxFQUM3RCxjQUFjO0FBQUEsRUFDZCxlQUFlO0FBQUEsRUFDZixlQUFlO0FBQUEsRUFDZixlQUFlO0FBQUEsRUFDZixVQUFVO0FBQUEsRUFDVixjQUFjO0FBQ2hCO0FBRUEsU0FBUyx1QkFDUCxPQUNBLFVBQ1M7QUFDVCxTQUFPLE9BQU8sVUFBVSxZQUFZLFFBQVE7QUFDOUM7QUFFQSxTQUFTLHNCQUNQLE9BQ0EsU0FDQSxVQUNRO0FBQ1IsU0FBTyxPQUFPLFVBQVUsWUFBWSxRQUFRLFNBQVMsS0FBSyxJQUN0RCxRQUNBO0FBQ047QUFFQSxTQUFTLHNCQUFzQixPQUFnQixVQUEwQjtBQUN2RSxNQUFJLE9BQU8sVUFBVSxVQUFVO0FBQzdC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
