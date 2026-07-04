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
var DEFAULT_FROZEN_TABLE_FEATURES = {
  enableResize: false,
  enableReorder: false,
  preserveLinks: true,
  editableNotes: false,
  wrapMode: "narrow"
};
function getBooleanFeatureValue(value, fallback) {
  return typeof value === "boolean" ? value : fallback;
}
function getStringFeatureValue(value, allowed, fallback) {
  return typeof value === "string" && allowed.includes(value) ? value : fallback;
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
    wrapMode: truncateByToggle ? "narrow" : "wide"
  };
}
var DEFAULT_SETTINGS = {
  freezeFirstColumn: {
    enabled: false,
    firstColumnMinWidthPx: 220,
    firstColumnMaxWidthPx: 320,
    cellHeightPx: 34,
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
    const cellHeight = Math.max(18, Math.min(96, config.cellHeightPx));
    this.styleElement.textContent = `
.obsidian-hotfixes-frozen-bases-view {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
  --obsidian-hotfixes-cell-height: ${cellHeight}px;
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
    this.root.className = `obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${features.wrapMode}`;
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
  cellHeightSlider = null;
  backgroundInput = null;
  zIndexInput = null;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  setSectionEnabled(enabled) {
    if (this.minWidthInput) this.minWidthInput.setDisabled(!enabled);
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
    if (this.cellHeightSlider) this.cellHeightSlider.setDisabled(!enabled);
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
    new import_obsidian.Setting(section).setName("Cell height (px)").setDesc("Control row height / vertical spacing in the frozen table.").addSlider((slider) => {
      this.cellHeightSlider = slider;
      slider.setLimits(18, 96, 1).setValue(state.cellHeightPx).setDynamicTooltip();
      slider.setDisabled(!state.enabled);
      slider.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({
          cellHeightPx: Math.round(value)
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIHR5cGUgQmFzZXNWaWV3Q29uZmlnLFxuICBIb3ZlclBhcmVudCxcbiAgSG92ZXJQb3BvdmVyLFxuICBMaW5rVmFsdWUsXG4gIEtleW1hcCxcbiAgUmVuZGVyQ29udGV4dCxcbiAgUGFuZVR5cGUsXG4gIFBsdWdpbixcbiAgUGx1Z2luU2V0dGluZ1RhYixcbiAgTWFya2Rvd25SZW5kZXJlcixcbiAgUXVlcnlDb250cm9sbGVyLFxuICBTZXR0aW5nLFxuICBTbGlkZXJDb21wb25lbnQsXG4gIFRleHRDb21wb25lbnQsXG4gIFVybFZhbHVlLFxuICBwYXJzZVByb3BlcnR5SWQsXG4gIHR5cGUgQmFzZXNQcm9wZXJ0eUlkLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9WSUVXX1RZUEUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi10YWJsZVwiO1xuY29uc3QgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFggPSAxODA7XG5jb25zdCBNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCA9IDYwO1xuY29uc3QgRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOmNvbHVtbi1vcmRlclwiO1xuY29uc3QgQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4td2lkdGhzXCI7XG5cbmNvbnN0IEZST1pFTl9UQUJMRV9SRVNJWkVfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS1yZXNpemVcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9SRU9SREVSX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcmVvcmRlclwiO1xuY29uc3QgRlJPWkVOX1RBQkxFX0xJTktTX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcHJlc2VydmUtbGlua3NcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9FRElUX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtZWRpdC1ub3Rlc1wiO1xuY29uc3QgRlJPWkVOX1RBQkxFX1dSQVBfTU9ERV9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXdyYXAtbW9kZVwiO1xuY29uc3QgRlJPWkVOX1RBQkxFX1RSVU5DQVRFX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtdHJ1bmNhdGVcIjtcblxudHlwZSBGcm96ZW5UYWJsZVdyYXBNb2RlID0gXCJuYXJyb3dcIiB8IFwid2lkZVwiO1xuXG5pbnRlcmZhY2UgRnJvemVuVGFibGVWaWV3RmVhdHVyZXMge1xuICBlbmFibGVSZXNpemU6IGJvb2xlYW47XG4gIGVuYWJsZVJlb3JkZXI6IGJvb2xlYW47XG4gIHByZXNlcnZlTGlua3M6IGJvb2xlYW47XG4gIGVkaXRhYmxlTm90ZXM6IGJvb2xlYW47XG4gIHdyYXBNb2RlOiBGcm96ZW5UYWJsZVdyYXBNb2RlO1xufVxuXG5jb25zdCBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUzogRnJvemVuVGFibGVWaWV3RmVhdHVyZXMgPSB7XG4gIGVuYWJsZVJlc2l6ZTogZmFsc2UsXG4gIGVuYWJsZVJlb3JkZXI6IGZhbHNlLFxuICBwcmVzZXJ2ZUxpbmtzOiB0cnVlLFxuICBlZGl0YWJsZU5vdGVzOiBmYWxzZSxcbiAgd3JhcE1vZGU6IFwibmFycm93XCIsXG59O1xuXG5mdW5jdGlvbiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICB2YWx1ZTogdW5rbm93bixcbiAgZmFsbGJhY2s6IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgdmFsdWU6IHVua25vd24sXG4gIGFsbG93ZWQ6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgZmFsbGJhY2s6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKVxuICAgID8gdmFsdWVcbiAgICA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyhcbiAgY29uZmlnOiBQaWNrPEJhc2VzVmlld0NvbmZpZywgXCJnZXRcIj5cbik6IEZyb3plblRhYmxlVmlld0ZlYXR1cmVzIHtcbiAgY29uc3QgbGVnYWN5V3JhcE1vZGUgPSBnZXRTdHJpbmdGZWF0dXJlVmFsdWUoXG4gICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfV1JBUF9NT0RFX0ZFQVRVUkVfS0VZKSxcbiAgICBbXCJuYXJyb3dcIiwgXCJ3aWRlXCJdLFxuICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLndyYXBNb2RlXG4gICk7XG4gIGNvbnN0IHRydW5jYXRlQnlUb2dnbGUgPSBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1RSVU5DQVRFX0ZFQVRVUkVfS0VZKSxcbiAgICBsZWdhY3lXcmFwTW9kZSA9PT0gXCJuYXJyb3dcIlxuICApO1xuXG4gIHJldHVybiB7XG4gICAgZW5hYmxlUmVzaXplOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZKSxcbiAgICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLmVuYWJsZVJlc2l6ZVxuICAgICksXG4gICAgZW5hYmxlUmVvcmRlcjogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1JFT1JERVJfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZW5hYmxlUmVvcmRlclxuICAgICksXG4gICAgcHJlc2VydmVMaW5rczogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX0xJTktTX0ZFQVRVUkVfS0VZKSxcbiAgICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLnByZXNlcnZlTGlua3NcbiAgICApLFxuICAgIGVkaXRhYmxlTm90ZXM6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9FRElUX0ZFQVRVUkVfS0VZKSxcbiAgICAgIERFRkFVTFRfRlJPWkVOX1RBQkxFX0ZFQVRVUkVTLmVkaXRhYmxlTm90ZXNcbiAgICApLFxuICAgIHdyYXBNb2RlOiB0cnVuY2F0ZUJ5VG9nZ2xlID8gXCJuYXJyb3dcIiA6IFwid2lkZVwiLFxuICB9O1xufVxuXG5pbnRlcmZhY2UgRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncyB7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogbnVtYmVyO1xuICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IG51bWJlcjtcbiAgY2VsbEhlaWdodFB4OiBudW1iZXI7XG4gIGJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuICB6SW5kZXg6IG51bWJlcjtcbiAgc2hvd0RpdmlkZXI6IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBIb3RmaXhTZXR0aW5ncyB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBmaXJzdENvbHVtbk1pbldpZHRoUHg6IDIyMCxcbiAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IDMyMCxcbiAgICBjZWxsSGVpZ2h0UHg6IDM0LFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiA0LFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVnaXN0ZXJTZXR0aW5nVGFiKCk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZCA9IHRoaXMucmVnaXN0ZXJCYXNlc1ZpZXcoRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRSwge1xuICAgICAgbmFtZTogXCJGcm96ZW4gVGFibGVcIixcbiAgICAgIGljb246IFwibHVjaWRlLWxheW91dC1ncmlkXCIsXG4gICAgICBmYWN0b3J5OiAoY29udHJvbGxlciwgY29udGFpbmVyRWwpID0+XG4gICAgICAgIG5ldyBGcm96ZW5UYWJsZUJhc2VzVmlldyhjb250cm9sbGVyLCBjb250YWluZXJFbCwgdGhpcyksXG4gICAgICBvcHRpb25zOiAoY29uZmlnKSA9PiB7XG4gICAgICAgIGNvbnN0IGZlYXR1cmVTZXR0aW5ncyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKGNvbmZpZyk7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogXCJncm91cFwiLFxuICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiRnJvemVuIHRhYmxlIG9wdGlvbnNcIixcbiAgICAgICAgICAgIGl0ZW1zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX1JFU0laRV9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgY29sdW1uIHJlc2l6aW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLmVuYWJsZVJlc2l6ZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgY29sdW1uIHJlb3JkZXJpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZW5hYmxlUmVvcmRlcixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfTElOS1NfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiUHJlc2VydmUgaW5saW5lIGxpbmsgcmVuZGVyaW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLnByZXNlcnZlTGlua3MsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX0VESVRfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiRW5hYmxlIG5vdGUtY2VsbCBlZGl0aW5nXCIsXG4gICAgICAgICAgICAgICAgZGVmYXVsdDogZmVhdHVyZVNldHRpbmdzLmVkaXRhYmxlTm90ZXMsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvZ2dsZVwiLFxuICAgICAgICAgICAgICAgIGtleTogRlJPWkVOX1RBQkxFX1RSVU5DQVRFX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIlRydW5jYXRlIGxvbmcgdGV4dFwiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy53cmFwTW9kZSA9PT0gXCJuYXJyb3dcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLmxvYWRlZCxcbiAgICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbldpZHRoID0gTWF0aC5tYXgoODAsIGNvbmZpZy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5tYXgobWluV2lkdGgsIGNvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHgpO1xuICAgIGNvbnN0IGRpdmlkZXIgPSBjb25maWcuc2hvd0RpdmlkZXJcbiAgICAgID8gXCIxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpXCJcbiAgICAgIDogXCJub25lXCI7XG4gICAgY29uc3QgY2VsbEhlaWdodCA9IE1hdGgubWF4KDE4LCBNYXRoLm1pbig5NiwgY29uZmlnLmNlbGxIZWlnaHRQeCkpO1xuXG4gICAgdGhpcy5zdHlsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXZpZXcge1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGg6ICR7bWluV2lkdGh9cHg7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aDogJHttYXhXaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1jZWxsLWhlaWdodDogJHtjZWxsSGVpZ2h0fXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZzogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tejogJHtjb25maWcuekluZGV4fTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IHtcbiAgb3ZlcmZsb3cteDogYXV0bztcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIG1pbi13aWR0aDogbWF4LWNvbnRlbnQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUge1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICBmb250LXNpemU6IHZhcigtLWZvbnQtdWktc21hbGxlcik7XG4gIHRhYmxlLWxheW91dDogZml4ZWQ7XG4gIG1heC13aWR0aDogbm9uZTtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG4gIG1pbi1oZWlnaHQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWNlbGwtaGVpZ2h0KTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtbmFycm93IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aCxcbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLW5hcnJvdyAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICBoZWlnaHQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWNlbGwtaGVpZ2h0KTtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLXdpZGUgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtd2lkZSAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICB3aGl0ZS1zcGFjZTogbm9ybWFsO1xuICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQ6Zmlyc3QtY2hpbGQge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAwO1xuICBtaW4td2lkdGg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpO1xuICB3aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoLCB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKSk7XG4gIG1heC13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZyk7XG4gIHotaW5kZXg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16KTtcbiAgYm9yZGVyLXJpZ2h0OiAke2RpdmlkZXJ9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIHJpZ2h0OiAwO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMHB4O1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuICB6LWluZGV4OiAyO1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGU6OmFmdGVyIHtcbiAgY29udGVudDogXCJcIjtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDA7XG4gIHdpZHRoOiAxcHg7XG4gIGhlaWdodDogMTAwJTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZSB7XG4gIGN1cnNvcjogZ3JhYjtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0PVwidHJ1ZVwiXSB7XG4gIG91dGxpbmU6IDFweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkIHtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIGxlZnQ6IDA7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdHI6Zmlyc3Qtb2YtdHlwZSB0aDpsYXN0LWNoaWxkIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93IHRkIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwge1xuICBjdXJzb3I6IHRleHQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwgdGV4dGFyZWEsXG4ub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIGlucHV0IHtcbiAgd2lkdGg6IDEwMCU7XG4gIGJvcmRlcjogbm9uZTtcbiAgcGFkZGluZzogMDtcbiAgZm9udDogaW5oZXJpdDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiBpbmhlcml0O1xuICByZXNpemU6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHkge1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIHBhZGRpbmc6IDAuNzVyZW0gMC41cmVtO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIG1hcmdpbi10b3A6IDAuNXJlbTtcbiAgcGFkZGluZzogMC41cmVtIDAuNzVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24gc3VtbWFyeSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudCB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogMC43NXJlbTtcbiAgbWFyZ2luLXRvcDogMC43NXJlbTtcbn1cbmAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWZyZXNoT3BlbkZyb3plblZpZXdzKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQWxsTGVhdmVzKChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBGcm96ZW5UYWJsZUJhc2VzVmlldykge1xuICAgICAgICB2aWV3Lm9uRGF0YVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm96ZW5UYWJsZUJhc2VzVmlldyBleHRlbmRzIEJhc2VzVmlldyBpbXBsZW1lbnRzIEhvdmVyUGFyZW50IHtcbiAgaG92ZXJQb3BvdmVyOiBIb3ZlclBvcG92ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSByb290OiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBhY3RpdmVWaWV3OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZUVkaXRvcjogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1cnJlbnRQcm9wZXJ0eU9yZGVyOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbHVtbkVsZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxUYWJsZUNvbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGVhZGVyRWxlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aXZlQ29sdW1uV2lkdGhzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXNpemVTdGFydFggPSAwO1xuICBwcml2YXRlIHJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVQb2ludGVySWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRyYWdnaW5nQ29sdW1uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVEcmFnVGFyZ2V0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHJlYWRvbmx5IG9uUmVzaXplUG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpO1xuICAgIGlmICghZmVhdHVyZXMuZW5hYmxlUmVzaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuY2xpZW50WCAtIHRoaXMucmVzaXplU3RhcnRYO1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCArIGRlbHRhLFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gMFxuICAgICk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICAgIHRoaXMuYXBwbHlDb2x1bW5XaWR0aCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb25SZXNpemVQb2ludGVyVXAgPSAoKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgaWYgKCFmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8IHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5XaWR0aHMoKTtcblxuICAgIHRoaXMuc3RvcENvbHVtblJlc2l6ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRDb2x1bW5SZXNpemUgPSAoXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudCxcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApID0+IHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBpZiAoIWZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgJiYgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCI7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIGNhbiBmYWlsIGluIGVkZ2UgY2FzZXMgKGUuZy4gY2VydGFpbiB3ZWJ2aWV3cykuXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSBldmVudC5jbGllbnRYO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aDtcblxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJjb2wtcmVzaXplXCI7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMub25SZXNpemVQb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB0aGlzLm9uUmVzaXplUG9pbnRlclVwKTtcbiAgfTtcblxuICBwcml2YXRlIHN0b3BDb2x1bW5SZXNpemUoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCAmJiB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCAhPT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnJlbGVhc2VQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIG1heSBub3QgYmUgYWN0aXZlOyBpZ25vcmUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbikge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBudWxsO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwiXCI7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSAwO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSAwO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJcIjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRyb2xsZXI6IFF1ZXJ5Q29udHJvbGxlcixcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoY29udHJvbGxlcik7XG4gICAgdGhpcy5yb290ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3RcIik7XG4gIH1cblxuICByZWFkb25seSB0eXBlID0gRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRTtcblxuICBwdWJsaWMgb25EYXRhVXBkYXRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgdGhpcy5yb290LmNsYXNzTmFtZSA9IGBvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCBvYnNpZGlhbi1ob3RmaXhlcy13cmFwLSR7ZmVhdHVyZXMud3JhcE1vZGV9YDtcblxuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBbXTtcbiAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5oZWFkZXJFbGVtZW50cy5jbGVhcigpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnN5bmNDb2x1bW5XaWR0aHMoKTtcblxuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRQcm9wZXJ0eU9yZGVyKCk7XG4gICAgaWYgKCFwcm9wZXJ0eU9yZGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBmb3IgdGhpcyBCYXNlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKGtleSwgaW5kZXgpO1xuICAgICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlcltpbmRleF0gPSBrZXk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB3aWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2aWV3ID0gdGhpcy5yb290LmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3XCIpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IHZpZXc7XG4gICAgY29uc3QgZmlyc3RQcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlci5sZW5ndGggPiAwID8gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5T3JkZXJbMF0pIDogbnVsbDtcbiAgICBpZiAoZmlyc3RQcm9wZXJ0eUlkKSB7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoZmlyc3RQcm9wZXJ0eUlkLCAwKTtcbiAgICAgIHZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLCBgJHt3aWR0aH1weGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlVEhlYWQoKTtcbiAgICBjb25zdCBoZWFkZXJSb3cgPSB0aGVhZC5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbGdyb3VwLmNyZWF0ZUVsKFwiY29sXCIpO1xuICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgdGhpcy5jb2x1bW5FbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGNvbCk7XG5cbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbmFtZSB9KTtcbiAgICAgIGhlYWRlci5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZW9yZGVyKSB7XG4gICAgICAgIGhlYWRlci5hZGRDbGFzcyhcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZVwiKTtcbiAgICAgICAgaGVhZGVyLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdPdmVyKGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJvcChldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICAgICk7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkpO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgdGhpcy5vbkNvbHVtbkRyYWdFbmQpO1xuICAgICAgfVxuICAgICAgdGhpcy5oZWFkZXJFbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGhlYWRlcik7XG5cbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gaGVhZGVyLmNyZWF0ZVNwYW4oe1xuICAgICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgaGFuZGxlLnNldEF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5zdGFydENvbHVtblJlc2l6ZShldmVudCwgcHJvcGVydHlLZXksIGluZGV4KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVUQm9keSgpO1xuICAgIGNvbnN0IGhhc1Zpc2libGVHcm91cGluZyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YS5sZW5ndGggPiAxO1xuXG4gICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBncm91cC5lbnRyaWVzO1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhc1Zpc2libGVHcm91cGluZykge1xuICAgICAgICBjb25zdCBncm91cFJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlID0gZ3JvdXAua2V5Py50b1N0cmluZygpID8/IFwiVW5ncm91cGVkXCI7XG4gICAgICAgIGNvbnN0IGdyb3VwQ2VsbCA9IGdyb3VwUm93LmNyZWF0ZUVsKFwidGRcIiwge1xuICAgICAgICAgIHRleHQ6IGtleVZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXBDZWxsLmNvbFNwYW4gPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9wZXJ0eU9yZGVyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5SWQgPSBwcm9wZXJ0eU9yZGVyW2luZGV4XTtcbiAgICAgICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgICAgICBjZWxsLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgIGNlbGwuc3R5bGUubWluV2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgY2VsbC5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcblxuICAgICAgICAgIHRoaXMucmVuZGVyQ2VsbFZhbHVlKGNlbGwsIGVudHJ5LCBwcm9wZXJ0eUlkLCBmZWF0dXJlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5SWQocHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKHByb3BlcnR5SWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NaW5XaWR0aFB4LFxuICAgICAgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFhcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDZWxsVGV4dChjb250YWluZXI6IEhUTUxFbGVtZW50LCB0ZXh0VmFsdWU6IHN0cmluZykge1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5jcmVhdGVTcGFuKHsgdGV4dDogdGV4dFZhbHVlIH0pO1xuICAgIGlmICh0ZXh0VmFsdWUpIHtcbiAgICAgIGNvbnRhaW5lci50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckxpbmtGcmllbmRseUNlbGwoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICB2YWx1ZTogYW55LFxuICAgIHRleHRWYWx1ZTogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZ1xuICApOiBib29sZWFuIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB0ZXh0VmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB2YWx1ZSBpbnN0YW5jZW9mIFVybFZhbHVlIHx8XG4gICAgICB2YWx1ZSBpbnN0YW5jZW9mIExpbmtWYWx1ZSB8fFxuICAgICAgdGhpcy5jb250YWluc0xpa2VseUxpbmtTeW50YXgodGV4dFZhbHVlKVxuICAgICkge1xuICAgICAgY29udGFpbmVyLmVtcHR5KCk7XG5cbiAgICAgIHZvaWQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIoXG4gICAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgICAgdGV4dFZhbHVlLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIHNvdXJjZVBhdGgsXG4gICAgICAgIHRoaXMucGx1Z2luXG4gICAgICApLmNhdGNoKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJDZWxsVGV4dChjb250YWluZXIsIHRleHRWYWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgY29udGFpbnNMaWtlbHlMaW5rU3ludGF4KHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICgvXlxcW1teXFxdXStcXF1cXChbXlxcKV0qXFwpJC91LnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmlzTGlrZWx5VXJpKG5vcm1hbGl6ZWQpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoL1xcW1xcW1teXFxdXStcXF1cXF0vLnRlc3Qobm9ybWFsaXplZCkpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiAvKD86aHR0cHM/OlxcL1xcL3x3d3dcXC4pW15cXHM8PlwiJygpXSsvaS50ZXN0KG5vcm1hbGl6ZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBpc0xpa2VseVVyaSh2YWx1ZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIC9eW2Etel1bYS16MC05Ky4tXSo6W15cXHM8PidcIigpXSskL2kudGVzdCh2YWx1ZSk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlclVyaUxpbmsoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBocmVmOiBzdHJpbmcsXG4gICAgbGFiZWw6IHN0cmluZ1xuICApIHtcbiAgICBjb250YWluZXIuZW1wdHkoKTtcbiAgICBjb25zdCBsaW5rID0gY29udGFpbmVyLmNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICB0ZXh0OiBsYWJlbCxcbiAgICAgIGhyZWYsXG4gICAgfSk7XG4gICAgbGluay5hZGRDbGFzcyhcImV4dGVybmFsLWxpbmtcIik7XG5cbiAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHdpbmRvdy5vcGVuKGhyZWYsIFwiX2JsYW5rXCIsIFwibm9vcGVuZXIsbm9yZWZlcnJlclwiKTtcbiAgICB9KTtcblxuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCAoZXZlbnQpID0+IHtcbiAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UudHJpZ2dlcihcImhvdmVyLWxpbmtcIiwge1xuICAgICAgICBldmVudCxcbiAgICAgICAgc291cmNlOiBcImJhc2VzXCIsXG4gICAgICAgIGhvdmVyUGFyZW50OiB0aGlzLFxuICAgICAgICB0YXJnZXRFbDogbGluayxcbiAgICAgICAgbGlua3RleHQ6IGhyZWYsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybjtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTWFya2Rvd25MaW5rKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBtYXRjaCA9IC9eXFxbKD88bGFiZWw+W15cXF1dKylcXF1cXCgoPzxocmVmPlteXFwpXSo/KVxcKSQvdS5leGVjKFxuICAgICAgdmFsdWUudHJpbSgpXG4gICAgKTtcbiAgICBpZiAoIW1hdGNoIHx8ICFtYXRjaC5ncm91cHMpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBjb25zdCBocmVmID0gKG1hdGNoLmdyb3Vwc1tcImhyZWZcIl0gPz8gXCJcIilcbiAgICAgIC50cmltKClcbiAgICAgIC5yZXBsYWNlKC9cXHMrW1wiJ11bXlwiJ10qW1wiJ10kLywgXCJcIik7XG4gICAgY29uc3QgbGFiZWwgPSBtYXRjaC5ncm91cHNbXCJsYWJlbFwiXT8udHJpbSgpIHx8IGhyZWY7XG4gICAgaWYgKCFocmVmIHx8ICFsYWJlbCB8fCAhdGhpcy5pc0xpa2VseVVyaShocmVmKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHRoaXMucmVuZGVyVXJpTGluayhjb250YWluZXIsIGhyZWYsIGxhYmVsKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyQ2VsbFZhbHVlKFxuICAgIGNlbGw6IEhUTUxUYWJsZUNlbGxFbGVtZW50LFxuICAgIGVudHJ5OiBhbnksXG4gICAgcHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkLFxuICAgIGZlYXR1cmVTZXR0aW5nczogRnJvemVuVGFibGVWaWV3RmVhdHVyZXNcbiAgKSB7XG4gICAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgIGNvbnN0IHZhbHVlID0gZW50cnkuZ2V0VmFsdWUocHJvcGVydHlJZCk7XG4gICAgY29uc3QgdGV4dFZhbHVlID0gdmFsdWUgPyB2YWx1ZS50b1N0cmluZygpIDogXCJcIjtcbiAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoXCJvYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGxcIik7XG5cbiAgICBpZiAocGFyc2VkLnR5cGUgPT09IFwiZmlsZVwiICYmIHBhcnNlZC5uYW1lID09PSBcIm5hbWVcIikge1xuICAgICAgY29uc3QgbGluayA9IGNlbGwuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgICAgdGV4dDogZW50cnkuZmlsZS5uYW1lLFxuICAgICAgICBocmVmOiBlbnRyeS5maWxlLnBhdGgsXG4gICAgICB9KTtcbiAgICAgIGxpbmsuYWRkQ2xhc3MoXCJpbnRlcm5hbC1saW5rXCIpO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcGFuZSA9IEtleW1hcC5pc01vZEV2ZW50KGV2ZW50KTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBpZiAocGFuZSA9PT0gdHJ1ZSB8fCBwYW5lID09PSBmYWxzZSkge1xuICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQoXG4gICAgICAgICAgICBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgQm9vbGVhbihwYW5lKVxuICAgICAgICAgICk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgXCJcIixcbiAgICAgICAgICBwYW5lIGFzIFBhbmVUeXBlXG4gICAgICAgICk7XG4gICAgICB9KTtcbiAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiaG92ZXItbGlua1wiLCB7XG4gICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgc291cmNlOiBcImJhc2VzXCIsXG4gICAgICAgICAgaG92ZXJQYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgdGFyZ2V0RWw6IGxpbmssXG4gICAgICAgICAgbGlua3RleHQ6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICAgIGlmICh0ZXh0VmFsdWUpIHtcbiAgICAgICAgY2VsbC50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgJiYgZmVhdHVyZVNldHRpbmdzLnByZXNlcnZlTGlua3MpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjZWxsLmNyZWF0ZVNwYW4oKTtcbiAgICAgIGNvbnN0IHNvdXJjZVBhdGggPSBlbnRyeT8uZmlsZT8ucGF0aCA/PyBcIlwiO1xuICAgICAgaWYgKHRoaXMucmVuZGVyTWFya2Rvd25MaW5rKGNvbnRlbnQsIHRleHRWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pc0xpa2VseVVyaSh0ZXh0VmFsdWUpKSB7XG4gICAgICAgIHRoaXMucmVuZGVyVXJpTGluayhjb250ZW50LCB0ZXh0VmFsdWUsIHRleHRWYWx1ZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbmRlcmVkQXNMaW5rRnJpZW5kbHkgPSB0aGlzLnJlbmRlckxpbmtGcmllbmRseUNlbGwoXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICB0ZXh0VmFsdWUsXG4gICAgICAgIHNvdXJjZVBhdGhcbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVuZGVyZWRBc0xpbmtGcmllbmRseSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgUmVuZGVyQ29udGV4dCgpO1xuICAgICAgICAgIGNvbnRleHQuaG92ZXJQb3BvdmVyID0gdGhpcy5ob3ZlclBvcG92ZXI7XG4gICAgICAgICAgdmFsdWUucmVuZGVyVG8oY29udGVudCwgY29udGV4dCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgXCJbT2JzaWRpYW4gSG90Zml4ZXNdIEZhaWxlZCB0byByZW5kZXIgdmFsdWUsIGZhbGxpbmcgYmFjayB0byBwbGFpbiB0ZXh0LlwiLFxuICAgICAgICAgICAgcHJvcGVydHlJZCxcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRoaXMucmVuZGVyQ2VsbFRleHQoY29udGVudCwgdGV4dFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gY2VsbC5jcmVhdGVTcGFuKCk7XG4gICAgICB0aGlzLnJlbmRlckNlbGxUZXh0KGNvbnRlbnQsIHRleHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlZC50eXBlID09PSBcIm5vdGVcIiAmJiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3Rlcykge1xuICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsXCIpO1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuYmVnaW5FZGl0Tm90ZUNlbGwoY2VsbCwgZW50cnksIHBhcnNlZC5uYW1lLCB0ZXh0VmFsdWUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgY2VsbC50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGJlZ2luRWRpdE5vdGVDZWxsKFxuICAgIGNlbGw6IEhUTUxUYWJsZUNlbGxFbGVtZW50LFxuICAgIGVudHJ5OiBhbnksXG4gICAgcHJvcGVydHlOYW1lOiBzdHJpbmcsXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGNlbGwuaW5uZXJUZXh0O1xuICAgIGNvbnN0IGVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbiAgICBlZGl0b3IudmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgZWRpdG9yLnJvd3MgPSAxO1xuXG4gICAgY29uc3QgY2FuY2VsID0gKCkgPT4ge1xuICAgICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29tbWl0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gZWRpdG9yLnZhbHVlO1xuICAgICAgaWYgKG5leHRWYWx1ZSAhPT0gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKFxuICAgICAgICAgIGVudHJ5LmZpbGUsXG4gICAgICAgICAgKGZyb250bWF0dGVyKSA9PiB7XG4gICAgICAgICAgICBmcm9udG1hdHRlcltwcm9wZXJ0eU5hbWVdID0gbmV4dFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNhbmNlbCgpO1xuICAgIH07XG5cbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGVkaXRvcjtcbiAgICBjZWxsLmVtcHR5KCk7XG4gICAgY2VsbC5hcHBlbmRDaGlsZChlZGl0b3IpO1xuICAgIGVkaXRvci5mb2N1cygpO1xuICAgIGVkaXRvci5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtZWRpdG9yXCI7XG5cbiAgICBlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgY29tbWl0KCk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjYW5jZWwoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBjb21taXQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTogTWFwPHN0cmluZywgbnVtYmVyPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSB0aGlzLmNvbmZpZy5nZXQoQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZKTtcbiAgICBjb25zdCBtYXBwZWQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gICAgaWYgKFxuICAgICAgc2F2ZWQgJiZcbiAgICAgIHR5cGVvZiBzYXZlZCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgIUFycmF5LmlzQXJyYXkoc2F2ZWQpXG4gICAgKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzYXZlZCkpIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHdpZHRoKSkge1xuICAgICAgICAgIG1hcHBlZC5zZXQoa2V5LCB3aWR0aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcHBlZDtcbiAgfVxuXG4gIHByaXZhdGUgc3luY0NvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBsb2FkZWQgPSB0aGlzLmdldFNhdmVkQ29sdW1uV2lkdGhzKCk7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuY2xlYXIoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBsb2FkZWQuZW50cmllcygpKSB7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb2x1bW5XaWR0aChcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGZhbGxiYWNrRGVmYXVsdCA9IGluZGV4ID09PSAwXG4gICAgICA/IHRoaXMuZ2V0RGVmYXVsdEZpcnN0Q29sdW1uV2lkdGgoKVxuICAgICAgOiBERUZBVUxUX0NPTFVNTl9XSURUSF9QWDtcbiAgICBjb25zdCBjb25maWd1cmVkID0gdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZ2V0KHByb3BlcnR5SWQpO1xuICAgIGNvbnN0IHdpZHRoID0gdHlwZW9mIGNvbmZpZ3VyZWQgPT09IFwibnVtYmVyXCIgPyBjb25maWd1cmVkIDogZmFsbGJhY2tEZWZhdWx0O1xuICAgIHJldHVybiB0aGlzLmNsYW1wQ29sdW1uV2lkdGgod2lkdGgsIGluZGV4ID09PSAwKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xhbXBDb2x1bW5XaWR0aCh3aWR0aDogbnVtYmVyLCBpc0ZpcnN0Q29sdW1uID0gZmFsc2UpOiBudW1iZXIge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBNYXRoLm1heCh3aWR0aCwgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFgpO1xuICAgIGlmICghaXNGaXJzdENvbHVtbikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1heChNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCwgc2V0dGluZ3MuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heChtaW4sIHNldHRpbmdzLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCk7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG5vcm1hbGl6ZWQsIG1pbiksIG1heCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Q29sdW1uV2lkdGgocHJvcGVydHlJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgaXNGaXJzdENvbHVtbiA9IHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXJbMF0gPT09IHByb3BlcnR5SWQ7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IHRoaXMuY2xhbXBDb2x1bW5XaWR0aCh3aWR0aCwgaXNGaXJzdENvbHVtbik7XG4gICAgY29uc3QgY29sdW1uID0gdGhpcy5jb2x1bW5FbGVtZW50cy5nZXQocHJvcGVydHlJZCk7XG4gICAgaWYgKGNvbHVtbikge1xuICAgICAgY29sdW1uLnN0eWxlLndpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBjb2x1bW4uc3R5bGUubWluV2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGNvbHVtbi5zdHlsZS5tYXhXaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuaGVhZGVyRWxlbWVudHMuZ2V0KHByb3BlcnR5SWQpO1xuICAgIGlmIChoZWFkZXIpIHtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgaGVhZGVyLnN0eWxlLm1pbldpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBoZWFkZXIuc3R5bGUubWF4V2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICB9XG5cbiAgICBpZiAoaXNGaXJzdENvbHVtbiAmJiB0aGlzLmFjdGl2ZVZpZXcpIHtcbiAgICAgIHRoaXMuYWN0aXZlVmlldy5zdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgICAgXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLFxuICAgICAgICBgJHtub3JtYWxpemVkfXB4YFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3RDb2x1bW5XaWR0aHMoKSB7XG4gICAgY29uc3Qgc2VyaWFsaXplZDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmVudHJpZXMoKSkge1xuICAgICAgc2VyaWFsaXplZFtrZXldID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuY29uZmlnLnNldChDT0xVTU5fV0lEVEhTX0NPTkZJR19LRVksIHNlcmlhbGl6ZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBwZXJzaXN0Q29sdW1uT3JkZXIob3JkZXI6IEJhc2VzUHJvcGVydHlJZFtdKSB7XG4gICAgdGhpcy5jb25maWcuc2V0KFxuICAgICAgRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVksXG4gICAgICBvcmRlci5tYXAoKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzYWZlQXR0cmlidXRlVmFsdWUodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJyk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFyRHJhZ1RhcmdldFN0eWxlcygpIHtcbiAgICB0aGlzLnJvb3RcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0XVwiKVxuICAgICAgLmZvckVhY2goKGhlYWRlckNlbGwpID0+IHtcbiAgICAgICAgaGVhZGVyQ2VsbC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWRyYWctdGFyZ2V0XCIpO1xuICAgICAgfSk7XG4gICAgdGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5EcmFnU3RhcnQoZXZlbnQ6IERyYWdFdmVudCwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgcHJvcGVydHlJZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdPdmVyKGV2ZW50OiBEcmFnRXZlbnQsIHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmdDb2x1bW4gfHwgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9PT0gcHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlcikge1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcIm1vdmVcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuYWN0aXZlRHJhZ1RhcmdldCA9PT0gcHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgdGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBoZWFkZXJDZWxsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgYHRoW2RhdGEtcHJvcGVydHktaWQ9XCIke3RoaXMuc2FmZUF0dHJpYnV0ZVZhbHVlKHByb3BlcnR5SWQpfVwiXWBcbiAgICApO1xuICAgIGlmIChoZWFkZXJDZWxsKSB7XG4gICAgICBoZWFkZXJDZWxsLnNldEF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIiwgXCJ0cnVlXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5Ecm9wKGV2ZW50OiBEcmFnRXZlbnQsIHRhcmdldFByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghdGhpcy5kcmFnZ2luZ0NvbHVtbiB8fCB0aGlzLmRyYWdnaW5nQ29sdW1uID09PSB0YXJnZXRQcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXIgPSB0aGlzLmdldEN1cnJlbnRDb2x1bW5PcmRlcigpO1xuICAgIGNvbnN0IHNvdXJjZUluZGV4ID0gb3JkZXIuZmluZEluZGV4KChwcm9wZXJ0eUlkKSA9PlxuICAgICAgdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpID09PSB0aGlzLmRyYWdnaW5nQ29sdW1uXG4gICAgKTtcbiAgICBjb25zdCB0YXJnZXRJbmRleCA9IG9yZGVyLmZpbmRJbmRleChcbiAgICAgIChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkgPT09IHRhcmdldFByb3BlcnR5SWRcbiAgICApO1xuICAgIGlmIChzb3VyY2VJbmRleCA9PT0gLTEgfHwgdGFyZ2V0SW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb3JkZXIuc3BsaWNlKHNvdXJjZUluZGV4LCAxKTtcbiAgICBvcmRlci5zcGxpY2UodGFyZ2V0SW5kZXgsIDAsIHRoaXMuZHJhZ2dpbmdDb2x1bW4gYXMgQmFzZXNQcm9wZXJ0eUlkKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5PcmRlcihvcmRlcik7XG4gICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdFbmQgPSAoKSA9PiB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBnZXRDdXJyZW50Q29sdW1uT3JkZXIoKTogQmFzZXNQcm9wZXJ0eUlkW10ge1xuICAgIGNvbnN0IGV4cGxpY2l0T3JkZXIgPSB0aGlzLmNvbmZpZy5nZXQoRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVkpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cGxpY2l0T3JkZXIpKSB7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KHRoaXMuZGF0YS5wcm9wZXJ0aWVzLm1hcCgocHJvcGVydHlJZCkgPT5cbiAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpXG4gICAgICApKTtcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBleHBsaWNpdE9yZGVyXG4gICAgICAgIC5tYXAoKHZhbHVlKSA9PlxuICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/ICh2YWx1ZSBhcyBCYXNlc1Byb3BlcnR5SWQpIDogbnVsbFxuICAgICAgICApXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgKHZhbHVlKTogdmFsdWUgaXMgQmFzZXNQcm9wZXJ0eUlkID0+XG4gICAgICAgICAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgYXZhaWxhYmxlLmhhcyh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSAmJlxuICAgICAgICAgICAgKHNlZW4uaGFzKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpID8gZmFsc2UgOiAoc2Vlbi5hZGQodGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSksIHRydWUpKVxuICAgICAgICApO1xuXG4gICAgICBpZiAobm9ybWFsaXplZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTZXQgPSBuZXcgU2V0KFxuICAgICAgICAgIG5vcm1hbGl6ZWQubWFwKChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IG1pc3NpbmcgPSB0aGlzLmRhdGEucHJvcGVydGllcy5maWx0ZXIoXG4gICAgICAgICAgKHByb3BlcnR5SWQpID0+ICFub3JtYWxpemVkU2V0Lmhhcyh0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBbLi4ubm9ybWFsaXplZCwgLi4ubWlzc2luZ107XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZXhwbGljaXRPcmRlckZyb21BcGkgPSB0aGlzLmNvbmZpZy5nZXRPcmRlcigpO1xuICAgIGlmIChleHBsaWNpdE9yZGVyRnJvbUFwaS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZXhwbGljaXRPcmRlckZyb21BcGk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wcm9wZXJ0aWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm9wZXJ0eU9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgfVxufVxuXG5jbGFzcyBIb3RmaXhlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luO1xuICBwcml2YXRlIG1pbldpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXhXaWR0aElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgY2VsbEhlaWdodFNsaWRlcjogU2xpZGVyQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYmFja2dyb3VuZElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgekluZGV4SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRTZWN0aW9uRW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMubWluV2lkdGhJbnB1dCkgdGhpcy5taW5XaWR0aElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5tYXhXaWR0aElucHV0KSB0aGlzLm1heFdpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmNlbGxIZWlnaHRTbGlkZXIpIHRoaXMuY2VsbEhlaWdodFNsaWRlci5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICB9XG5cbiAgZGlzcGxheSgpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT2JzaWRpYW4gSG90Zml4ZXNcIiB9KTtcblxuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IFwiQmFzZXM6IEZyb3plbiBmaXJzdCBjb2x1bW5cIixcbiAgICB9KTtcbiAgICBjb25zdCBzZWN0aW9uID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgY3VzdG9tIGZyb3plbiB0YWJsZSB2aWV3XCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJVc2UgYSBjdXN0b20gQmFzZXMgdmlldyB3aXRoIGEgc3RpY2t5IGZpcnN0IGNvbHVtbiBpbnN0ZWFkIG9mIG92ZXJsYXkgaGFja3MuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQodmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1pbmltdW0gd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJNaW5pbXVtIHdpZHRoIG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5taW5XaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1heCB3aWR0aCAocHgpXCIpXG4gICAgICAuc2V0RGVzYyhcIkNhcCB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbiB3aWR0aC5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWF4V2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkNlbGwgaGVpZ2h0IChweClcIilcbiAgICAgIC5zZXREZXNjKFwiQ29udHJvbCByb3cgaGVpZ2h0IC8gdmVydGljYWwgc3BhY2luZyBpbiB0aGUgZnJvemVuIHRhYmxlLlwiKVxuICAgICAgLmFkZFNsaWRlcigoc2xpZGVyKSA9PiB7XG4gICAgICAgIHRoaXMuY2VsbEhlaWdodFNsaWRlciA9IHNsaWRlcjtcbiAgICAgICAgc2xpZGVyXG4gICAgICAgICAgLnNldExpbWl0cygxOCwgOTYsIDEpXG4gICAgICAgICAgLnNldFZhbHVlKHN0YXRlLmNlbGxIZWlnaHRQeClcbiAgICAgICAgICAuc2V0RHluYW1pY1Rvb2x0aXAoKTtcbiAgICAgICAgc2xpZGVyLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgc2xpZGVyLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGNlbGxIZWlnaHRQeDogTWF0aC5yb3VuZCh2YWx1ZSksXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJCYWNrZ3JvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIkJhY2tncm91bmQgdXNlZCBiZWhpbmQgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0YWNraW5nIG9yZGVyIGZvciB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjRcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRHJhdyBhIGRpdmlkZXIgdG8gdGhlIHJpZ2h0IG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5zaG93RGl2aWRlcik7XG4gICAgICAgIHRvZ2dsZS5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHNob3dEaXZpZGVyOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQoc3Rh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
