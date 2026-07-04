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
    wrapMode: getStringFeatureValue(
      config.get(FROZEN_TABLE_WRAP_MODE_FEATURE_KEY),
      ["narrow", "wide"],
      DEFAULT_FROZEN_TABLE_FEATURES.wrapMode
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
                type: "dropdown",
                key: FROZEN_TABLE_WRAP_MODE_FEATURE_KEY,
                displayName: "Cell wrapping",
                default: featureSettings.wrapMode,
                options: {
                  narrow: "Narrow (truncate)",
                  wide: "Large (wrap)"
                }
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
.obsidian-hotfixes-frozen-bases-view {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
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
}

.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table th,
.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table td {
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
      const context = new import_obsidian.RenderContext();
      context.hoverPopover = this.hoverPopover;
      value.renderTo(cell, context);
      if (textValue) {
        cell.title = textValue;
      }
    } else {
      const span = cell.createSpan({ text: textValue });
      if (textValue) {
        span.title = textValue;
      }
    }
    if (parsed.type === "note" && featureSettings.editableNotes) {
      cell.classList.add("obsidian-hotfixes-note-cell");
      cell.addEventListener("dblclick", () => {
        void this.beginEditNoteCell(cell, entry, parsed.name, textValue);
      });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIHR5cGUgQmFzZXNWaWV3Q29uZmlnLFxuICBIb3ZlclBhcmVudCxcbiAgSG92ZXJQb3BvdmVyLFxuICBLZXltYXAsXG4gIFJlbmRlckNvbnRleHQsXG4gIFBhbmVUeXBlLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFF1ZXJ5Q29udHJvbGxlcixcbiAgU2V0dGluZyxcbiAgVGV4dENvbXBvbmVudCxcbiAgcGFyc2VQcm9wZXJ0eUlkLFxuICB0eXBlIEJhc2VzUHJvcGVydHlJZCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IFNUWUxFX0VMRU1FTlRfSUQgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLXJ1bnRpbWUtc3R5bGVzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfVklFV19UWVBFID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tdGFibGVcIjtcbmNvbnN0IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYID0gMTgwO1xuY29uc3QgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFggPSA2MDtcbmNvbnN0IERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4tb3JkZXJcIjtcbmNvbnN0IENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6Y29sdW1uLXdpZHRoc1wiO1xuXG5jb25zdCBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcmVzaXplXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXJlb3JkZXJcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXByZXNlcnZlLWxpbmtzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLWVkaXQtbm90ZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS13cmFwLW1vZGVcIjtcblxudHlwZSBGcm96ZW5UYWJsZVdyYXBNb2RlID0gXCJuYXJyb3dcIiB8IFwid2lkZVwiO1xuXG5pbnRlcmZhY2UgRnJvemVuVGFibGVWaWV3RmVhdHVyZXMge1xuICBlbmFibGVSZXNpemU6IGJvb2xlYW47XG4gIGVuYWJsZVJlb3JkZXI6IGJvb2xlYW47XG4gIHByZXNlcnZlTGlua3M6IGJvb2xlYW47XG4gIGVkaXRhYmxlTm90ZXM6IGJvb2xlYW47XG4gIHdyYXBNb2RlOiBGcm96ZW5UYWJsZVdyYXBNb2RlO1xufVxuXG5jb25zdCBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUzogRnJvemVuVGFibGVWaWV3RmVhdHVyZXMgPSB7XG4gIGVuYWJsZVJlc2l6ZTogZmFsc2UsXG4gIGVuYWJsZVJlb3JkZXI6IGZhbHNlLFxuICBwcmVzZXJ2ZUxpbmtzOiB0cnVlLFxuICBlZGl0YWJsZU5vdGVzOiBmYWxzZSxcbiAgd3JhcE1vZGU6IFwibmFycm93XCIsXG59O1xuXG5mdW5jdGlvbiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICB2YWx1ZTogdW5rbm93bixcbiAgZmFsbGJhY2s6IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgdmFsdWU6IHVua25vd24sXG4gIGFsbG93ZWQ6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgZmFsbGJhY2s6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKVxuICAgID8gdmFsdWVcbiAgICA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyhcbiAgY29uZmlnOiBQaWNrPEJhc2VzVmlld0NvbmZpZywgXCJnZXRcIj5cbik6IEZyb3plblRhYmxlVmlld0ZlYXR1cmVzIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVSZXNpemU6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9SRVNJWkVfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZW5hYmxlUmVzaXplXG4gICAgKSxcbiAgICBlbmFibGVSZW9yZGVyOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5lbmFibGVSZW9yZGVyXG4gICAgKSxcbiAgICBwcmVzZXJ2ZUxpbmtzOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfTElOS1NfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMucHJlc2VydmVMaW5rc1xuICAgICksXG4gICAgZWRpdGFibGVOb3RlczogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX0VESVRfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZWRpdGFibGVOb3Rlc1xuICAgICksXG4gICAgd3JhcE1vZGU6IGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1dSQVBfTU9ERV9GRUFUVVJFX0tFWSksXG4gICAgICBbXCJuYXJyb3dcIiwgXCJ3aWRlXCJdLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMud3JhcE1vZGVcbiAgICApIGFzIEZyb3plblRhYmxlV3JhcE1vZGUsXG4gIH07XG59XG5cbmludGVyZmFjZSBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzIHtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBudW1iZXI7XG4gIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogbnVtYmVyO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgekluZGV4OiBudW1iZXI7XG4gIHNob3dEaXZpZGVyOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSG90Zml4U2V0dGluZ3Mge1xuICBmcmVlemVGaXJzdENvbHVtbjogRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncztcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogSG90Zml4U2V0dGluZ3MgPSB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiAyMjAsXG4gICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiAzMjAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDQsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0ge1xuICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4gfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5yZWdpc3RlclNldHRpbmdUYWIoKTtcbiAgICBjb25zdCByZWdpc3RlcmVkID0gdGhpcy5yZWdpc3RlckJhc2VzVmlldyhGUk9aRU5fVEFCTEVfVklFV19UWVBFLCB7XG4gICAgICBuYW1lOiBcIkZyb3plbiBUYWJsZVwiLFxuICAgICAgaWNvbjogXCJsdWNpZGUtbGF5b3V0LWdyaWRcIixcbiAgICAgIGZhY3Rvcnk6IChjb250cm9sbGVyLCBjb250YWluZXJFbCkgPT5cbiAgICAgICAgbmV3IEZyb3plblRhYmxlQmFzZXNWaWV3KGNvbnRyb2xsZXIsIGNvbnRhaW5lckVsLCB0aGlzKSxcbiAgICAgIG9wdGlvbnM6IChjb25maWcpID0+IHtcbiAgICAgICAgY29uc3QgZmVhdHVyZVNldHRpbmdzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXMoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJGcm96ZW4gdGFibGUgb3B0aW9uc1wiLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVzaXppbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZW5hYmxlUmVzaXplLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9SRU9SREVSX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVvcmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy5lbmFibGVSZW9yZGVyLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJQcmVzZXJ2ZSBpbmxpbmUgbGluayByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgbm90ZS1jZWxsIGVkaXRpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3RlcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZHJvcGRvd25cIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiQ2VsbCB3cmFwcGluZ1wiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy53cmFwTW9kZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICBuYXJyb3c6IFwiTmFycm93ICh0cnVuY2F0ZSlcIixcbiAgICAgICAgICAgICAgICAgIHdpZGU6IFwiTGFyZ2UgKHdyYXApXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLmxvYWRlZCxcbiAgICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbldpZHRoID0gTWF0aC5tYXgoODAsIGNvbmZpZy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5tYXgobWluV2lkdGgsIGNvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHgpO1xuICAgIGNvbnN0IGRpdmlkZXIgPSBjb25maWcuc2hvd0RpdmlkZXJcbiAgICAgID8gXCIxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpXCJcbiAgICAgIDogXCJub25lXCI7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aDogJHttaW5XaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoOiAke21heFdpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZzogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tejogJHtjb25maWcuekluZGV4fTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IHtcbiAgb3ZlcmZsb3cteDogYXV0bztcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIG1pbi13aWR0aDogbWF4LWNvbnRlbnQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUge1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICBmb250LXNpemU6IHZhcigtLWZvbnQtdWktc21hbGxlcik7XG4gIHRhYmxlLWxheW91dDogZml4ZWQ7XG4gIG1heC13aWR0aDogbm9uZTtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLW5hcnJvdyAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgsXG4ub2JzaWRpYW4taG90Zml4ZXMtd3JhcC1uYXJyb3cgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRkIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLXdpZGUgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtd2lkZSAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICB3aGl0ZS1zcGFjZTogbm9ybWFsO1xuICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQ6Zmlyc3QtY2hpbGQge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAwO1xuICBtaW4td2lkdGg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpO1xuICB3aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoLCB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKSk7XG4gIG1heC13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZyk7XG4gIHotaW5kZXg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16KTtcbiAgYm9yZGVyLXJpZ2h0OiAke2RpdmlkZXJ9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIHJpZ2h0OiAwO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMHB4O1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuICB6LWluZGV4OiAyO1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGU6OmFmdGVyIHtcbiAgY29udGVudDogXCJcIjtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDA7XG4gIHdpZHRoOiAxcHg7XG4gIGhlaWdodDogMTAwJTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZSB7XG4gIGN1cnNvcjogZ3JhYjtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0PVwidHJ1ZVwiXSB7XG4gIG91dGxpbmU6IDFweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkIHtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIGxlZnQ6IDA7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdHI6Zmlyc3Qtb2YtdHlwZSB0aDpsYXN0LWNoaWxkIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93IHRkIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwge1xuICBjdXJzb3I6IHRleHQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwgdGV4dGFyZWEsXG4ub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIGlucHV0IHtcbiAgd2lkdGg6IDEwMCU7XG4gIGJvcmRlcjogbm9uZTtcbiAgcGFkZGluZzogMDtcbiAgZm9udDogaW5oZXJpdDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiBpbmhlcml0O1xuICByZXNpemU6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHkge1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIHBhZGRpbmc6IDAuNzVyZW0gMC41cmVtO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIG1hcmdpbi10b3A6IDAuNXJlbTtcbiAgcGFkZGluZzogMC41cmVtIDAuNzVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24gc3VtbWFyeSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudCB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogMC43NXJlbTtcbiAgbWFyZ2luLXRvcDogMC43NXJlbTtcbn1cbmAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWZyZXNoT3BlbkZyb3plblZpZXdzKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQWxsTGVhdmVzKChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBGcm96ZW5UYWJsZUJhc2VzVmlldykge1xuICAgICAgICB2aWV3Lm9uRGF0YVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm96ZW5UYWJsZUJhc2VzVmlldyBleHRlbmRzIEJhc2VzVmlldyBpbXBsZW1lbnRzIEhvdmVyUGFyZW50IHtcbiAgaG92ZXJQb3BvdmVyOiBIb3ZlclBvcG92ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSByb290OiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBhY3RpdmVWaWV3OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZUVkaXRvcjogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1cnJlbnRQcm9wZXJ0eU9yZGVyOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbHVtbkVsZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxUYWJsZUNvbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGVhZGVyRWxlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aXZlQ29sdW1uV2lkdGhzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXNpemVTdGFydFggPSAwO1xuICBwcml2YXRlIHJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVQb2ludGVySWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRyYWdnaW5nQ29sdW1uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVEcmFnVGFyZ2V0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHJlYWRvbmx5IG9uUmVzaXplUG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpO1xuICAgIGlmICghZmVhdHVyZXMuZW5hYmxlUmVzaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuY2xpZW50WCAtIHRoaXMucmVzaXplU3RhcnRYO1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCArIGRlbHRhLFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gMFxuICAgICk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICAgIHRoaXMuYXBwbHlDb2x1bW5XaWR0aCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb25SZXNpemVQb2ludGVyVXAgPSAoKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgaWYgKCFmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8IHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5XaWR0aHMoKTtcblxuICAgIHRoaXMuc3RvcENvbHVtblJlc2l6ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRDb2x1bW5SZXNpemUgPSAoXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudCxcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApID0+IHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBpZiAoIWZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgJiYgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCI7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIGNhbiBmYWlsIGluIGVkZ2UgY2FzZXMgKGUuZy4gY2VydGFpbiB3ZWJ2aWV3cykuXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSBldmVudC5jbGllbnRYO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aDtcblxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJjb2wtcmVzaXplXCI7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMub25SZXNpemVQb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB0aGlzLm9uUmVzaXplUG9pbnRlclVwKTtcbiAgfTtcblxuICBwcml2YXRlIHN0b3BDb2x1bW5SZXNpemUoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCAmJiB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCAhPT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnJlbGVhc2VQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIG1heSBub3QgYmUgYWN0aXZlOyBpZ25vcmUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbikge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBudWxsO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwiXCI7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSAwO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSAwO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJcIjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRyb2xsZXI6IFF1ZXJ5Q29udHJvbGxlcixcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoY29udHJvbGxlcik7XG4gICAgdGhpcy5yb290ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3RcIik7XG4gIH1cblxuICByZWFkb25seSB0eXBlID0gRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRTtcblxuICBwdWJsaWMgb25EYXRhVXBkYXRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgdGhpcy5yb290LmNsYXNzTmFtZSA9IGBvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCBvYnNpZGlhbi1ob3RmaXhlcy13cmFwLSR7ZmVhdHVyZXMud3JhcE1vZGV9YDtcblxuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBbXTtcbiAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5oZWFkZXJFbGVtZW50cy5jbGVhcigpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnN5bmNDb2x1bW5XaWR0aHMoKTtcblxuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRQcm9wZXJ0eU9yZGVyKCk7XG4gICAgaWYgKCFwcm9wZXJ0eU9yZGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBmb3IgdGhpcyBCYXNlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKGtleSwgaW5kZXgpO1xuICAgICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlcltpbmRleF0gPSBrZXk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB3aWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2aWV3ID0gdGhpcy5yb290LmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3XCIpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IHZpZXc7XG4gICAgY29uc3QgZmlyc3RQcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlci5sZW5ndGggPiAwID8gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5T3JkZXJbMF0pIDogbnVsbDtcbiAgICBpZiAoZmlyc3RQcm9wZXJ0eUlkKSB7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoZmlyc3RQcm9wZXJ0eUlkLCAwKTtcbiAgICAgIHZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLCBgJHt3aWR0aH1weGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlVEhlYWQoKTtcbiAgICBjb25zdCBoZWFkZXJSb3cgPSB0aGVhZC5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbGdyb3VwLmNyZWF0ZUVsKFwiY29sXCIpO1xuICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgdGhpcy5jb2x1bW5FbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGNvbCk7XG5cbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbmFtZSB9KTtcbiAgICAgIGhlYWRlci5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZW9yZGVyKSB7XG4gICAgICAgIGhlYWRlci5hZGRDbGFzcyhcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZVwiKTtcbiAgICAgICAgaGVhZGVyLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdPdmVyKGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJvcChldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICAgICk7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkpO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgdGhpcy5vbkNvbHVtbkRyYWdFbmQpO1xuICAgICAgfVxuICAgICAgdGhpcy5oZWFkZXJFbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGhlYWRlcik7XG5cbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gaGVhZGVyLmNyZWF0ZVNwYW4oe1xuICAgICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgaGFuZGxlLnNldEF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5zdGFydENvbHVtblJlc2l6ZShldmVudCwgcHJvcGVydHlLZXksIGluZGV4KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVUQm9keSgpO1xuICAgIGNvbnN0IGhhc1Zpc2libGVHcm91cGluZyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YS5sZW5ndGggPiAxO1xuXG4gICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBncm91cC5lbnRyaWVzO1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhc1Zpc2libGVHcm91cGluZykge1xuICAgICAgICBjb25zdCBncm91cFJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlID0gZ3JvdXAua2V5Py50b1N0cmluZygpID8/IFwiVW5ncm91cGVkXCI7XG4gICAgICAgIGNvbnN0IGdyb3VwQ2VsbCA9IGdyb3VwUm93LmNyZWF0ZUVsKFwidGRcIiwge1xuICAgICAgICAgIHRleHQ6IGtleVZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXBDZWxsLmNvbFNwYW4gPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9wZXJ0eU9yZGVyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5SWQgPSBwcm9wZXJ0eU9yZGVyW2luZGV4XTtcbiAgICAgICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgICAgICBjZWxsLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgIGNlbGwuc3R5bGUubWluV2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgY2VsbC5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcblxuICAgICAgICAgIHRoaXMucmVuZGVyQ2VsbFZhbHVlKGNlbGwsIGVudHJ5LCBwcm9wZXJ0eUlkLCBmZWF0dXJlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5SWQocHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKHByb3BlcnR5SWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NaW5XaWR0aFB4LFxuICAgICAgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFhcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDZWxsVmFsdWUoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eUlkOiBCYXNlc1Byb3BlcnR5SWQsXG4gICAgZmVhdHVyZVNldHRpbmdzOiBGcm96ZW5UYWJsZVZpZXdGZWF0dXJlc1xuICApIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgY29uc3QgdmFsdWUgPSBlbnRyeS5nZXRWYWx1ZShwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbFwiKTtcblxuICAgIGlmIChwYXJzZWQudHlwZSA9PT0gXCJmaWxlXCIgJiYgcGFyc2VkLm5hbWUgPT09IFwibmFtZVwiKSB7XG4gICAgICBjb25zdCBsaW5rID0gY2VsbC5jcmVhdGVFbChcImFcIiwge1xuICAgICAgICB0ZXh0OiBlbnRyeS5maWxlLm5hbWUsXG4gICAgICAgIGhyZWY6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRDbGFzcyhcImludGVybmFsLWxpbmtcIik7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYW5lID0gS2V5bWFwLmlzTW9kRXZlbnQoZXZlbnQpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChwYW5lID09PSB0cnVlIHx8IHBhbmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBCb29sZWFuKHBhbmUpXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHBhbmUgYXMgUGFuZVR5cGVcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXCJob3Zlci1saW5rXCIsIHtcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgICBob3ZlclBhcmVudDogdGhpcyxcbiAgICAgICAgICB0YXJnZXRFbDogbGluayxcbiAgICAgICAgICBsaW5rdGV4dDogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSAmJiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcykge1xuICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBSZW5kZXJDb250ZXh0KCk7XG4gICAgICBjb250ZXh0LmhvdmVyUG9wb3ZlciA9IHRoaXMuaG92ZXJQb3BvdmVyO1xuICAgICAgdmFsdWUucmVuZGVyVG8oY2VsbCwgY29udGV4dCk7XG4gICAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICAgIGNlbGwudGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHNwYW4gPSBjZWxsLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0ZXh0VmFsdWUgfSk7XG4gICAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICAgIHNwYW4udGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlZC50eXBlID09PSBcIm5vdGVcIiAmJiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3Rlcykge1xuICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsXCIpO1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuYmVnaW5FZGl0Tm90ZUNlbGwoY2VsbCwgZW50cnksIHBhcnNlZC5uYW1lLCB0ZXh0VmFsdWUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBiZWdpbkVkaXROb3RlQ2VsbChcbiAgICBjZWxsOiBIVE1MVGFibGVDZWxsRWxlbWVudCxcbiAgICBlbnRyeTogYW55LFxuICAgIHByb3BlcnR5TmFtZTogc3RyaW5nLFxuICAgIGluaXRpYWxWYWx1ZTogc3RyaW5nXG4gICkge1xuICAgIGlmICh0aGlzLmFjdGl2ZUVkaXRvcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzVmFsdWUgPSBjZWxsLmlubmVyVGV4dDtcbiAgICBjb25zdCBlZGl0b3IgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGV4dGFyZWFcIik7XG4gICAgZWRpdG9yLnZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIGVkaXRvci5yb3dzID0gMTtcblxuICAgIGNvbnN0IGNhbmNlbCA9ICgpID0+IHtcbiAgICAgIHRoaXMuYWN0aXZlRWRpdG9yID0gbnVsbDtcbiAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfTtcblxuICAgIGNvbnN0IGNvbW1pdCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5leHRWYWx1ZSA9IGVkaXRvci52YWx1ZTtcbiAgICAgIGlmIChuZXh0VmFsdWUgIT09IHByZXZpb3VzVmFsdWUpIHtcbiAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4uYXBwLmZpbGVNYW5hZ2VyLnByb2Nlc3NGcm9udE1hdHRlcihcbiAgICAgICAgICBlbnRyeS5maWxlLFxuICAgICAgICAgIChmcm9udG1hdHRlcikgPT4ge1xuICAgICAgICAgICAgZnJvbnRtYXR0ZXJbcHJvcGVydHlOYW1lXSA9IG5leHRWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjYW5jZWwoKTtcbiAgICB9O1xuXG4gICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBlZGl0b3I7XG4gICAgY2VsbC5lbXB0eSgpO1xuICAgIGNlbGwuYXBwZW5kQ2hpbGQoZWRpdG9yKTtcbiAgICBlZGl0b3IuZm9jdXMoKTtcbiAgICBlZGl0b3IuY2xhc3NOYW1lID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWVkaXRvclwiO1xuXG4gICAgZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50LmtleSA9PT0gXCJFbnRlclwiICYmICFldmVudC5zaGlmdEtleSkge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2b2lkIGNvbW1pdCgpO1xuICAgICAgfSBlbHNlIGlmIChldmVudC5rZXkgPT09IFwiRXNjYXBlXCIpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY2FuY2VsKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgY29tbWl0KCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGdldFNhdmVkQ29sdW1uV2lkdGhzKCk6IE1hcDxzdHJpbmcsIG51bWJlcj4ge1xuICAgIGNvbnN0IHNhdmVkID0gdGhpcy5jb25maWcuZ2V0KENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSk7XG4gICAgY29uc3QgbWFwcGVkID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcblxuICAgIGlmIChcbiAgICAgIHNhdmVkICYmXG4gICAgICB0eXBlb2Ygc2F2ZWQgPT09IFwib2JqZWN0XCIgJiZcbiAgICAgICFBcnJheS5pc0FycmF5KHNhdmVkKVxuICAgICkge1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoc2F2ZWQpKSB7XG4gICAgICAgIGNvbnN0IHdpZHRoID0gTnVtYmVyKHZhbHVlKTtcbiAgICAgICAgaWYgKE51bWJlci5pc0Zpbml0ZSh3aWR0aCkpIHtcbiAgICAgICAgICBtYXBwZWQuc2V0KGtleSwgd2lkdGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXBwZWQ7XG4gIH1cblxuICBwcml2YXRlIHN5bmNDb2x1bW5XaWR0aHMoKSB7XG4gICAgY29uc3QgbG9hZGVkID0gdGhpcy5nZXRTYXZlZENvbHVtbldpZHRocygpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgbG9hZGVkLmVudHJpZXMoKSkge1xuICAgICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KGtleSwgdmFsdWUpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29sdW1uV2lkdGgoXG4gICAgcHJvcGVydHlJZDogc3RyaW5nLFxuICAgIGluZGV4OiBudW1iZXJcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBmYWxsYmFja0RlZmF1bHQgPSBpbmRleCA9PT0gMFxuICAgICAgPyB0aGlzLmdldERlZmF1bHRGaXJzdENvbHVtbldpZHRoKClcbiAgICAgIDogREVGQVVMVF9DT0xVTU5fV0lEVEhfUFg7XG4gICAgY29uc3QgY29uZmlndXJlZCA9IHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB3aWR0aCA9IHR5cGVvZiBjb25maWd1cmVkID09PSBcIm51bWJlclwiID8gY29uZmlndXJlZCA6IGZhbGxiYWNrRGVmYXVsdDtcbiAgICByZXR1cm4gdGhpcy5jbGFtcENvbHVtbldpZHRoKHdpZHRoLCBpbmRleCA9PT0gMCk7XG4gIH1cblxuICBwcml2YXRlIGNsYW1wQ29sdW1uV2lkdGgod2lkdGg6IG51bWJlciwgaXNGaXJzdENvbHVtbiA9IGZhbHNlKTogbnVtYmVyIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gTWF0aC5tYXgod2lkdGgsIE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYKTtcbiAgICBpZiAoIWlzRmlyc3RDb2x1bW4pIHtcbiAgICAgIHJldHVybiBub3JtYWxpemVkO1xuICAgIH1cblxuICAgIGNvbnN0IHNldHRpbmdzID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3QgbWluID0gTWF0aC5tYXgoTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFgsIHNldHRpbmdzLmZpcnN0Q29sdW1uTWluV2lkdGhQeCk7XG4gICAgY29uc3QgbWF4ID0gTWF0aC5tYXgobWluLCBzZXR0aW5ncy5maXJzdENvbHVtbk1heFdpZHRoUHgpO1xuICAgIHJldHVybiBNYXRoLm1pbihNYXRoLm1heChub3JtYWxpemVkLCBtaW4pLCBtYXgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseUNvbHVtbldpZHRoKHByb3BlcnR5SWQ6IHN0cmluZywgd2lkdGg6IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGlzRmlyc3RDb2x1bW4gPSB0aGlzLmN1cnJlbnRQcm9wZXJ0eU9yZGVyWzBdID09PSBwcm9wZXJ0eUlkO1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSB0aGlzLmNsYW1wQ29sdW1uV2lkdGgod2lkdGgsIGlzRmlyc3RDb2x1bW4pO1xuICAgIGNvbnN0IGNvbHVtbiA9IHRoaXMuY29sdW1uRWxlbWVudHMuZ2V0KHByb3BlcnR5SWQpO1xuICAgIGlmIChjb2x1bW4pIHtcbiAgICAgIGNvbHVtbi5zdHlsZS53aWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgY29sdW1uLnN0eWxlLm1pbldpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBjb2x1bW4uc3R5bGUubWF4V2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICB9XG5cbiAgICBjb25zdCBoZWFkZXIgPSB0aGlzLmhlYWRlckVsZW1lbnRzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBpZiAoaGVhZGVyKSB7XG4gICAgICBoZWFkZXIuc3R5bGUud2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgaGVhZGVyLnN0eWxlLm1heFdpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgfVxuXG4gICAgaWYgKGlzRmlyc3RDb2x1bW4gJiYgdGhpcy5hY3RpdmVWaWV3KSB7XG4gICAgICB0aGlzLmFjdGl2ZVZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXG4gICAgICAgIFwiLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4td2lkdGhcIixcbiAgICAgICAgYCR7bm9ybWFsaXplZH1weGBcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBwZXJzaXN0Q29sdW1uV2lkdGhzKCkge1xuICAgIGNvbnN0IHNlcmlhbGl6ZWQ6IFJlY29yZDxzdHJpbmcsIG51bWJlcj4gPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5lbnRyaWVzKCkpIHtcbiAgICAgIHNlcmlhbGl6ZWRba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgICB0aGlzLmNvbmZpZy5zZXQoQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZLCBzZXJpYWxpemVkKTtcbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdENvbHVtbk9yZGVyKG9yZGVyOiBCYXNlc1Byb3BlcnR5SWRbXSkge1xuICAgIHRoaXMuY29uZmlnLnNldChcbiAgICAgIERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZLFxuICAgICAgb3JkZXIubWFwKChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgc2FmZUF0dHJpYnV0ZVZhbHVlKHZhbHVlOiBzdHJpbmcpIHtcbiAgICByZXR1cm4gdmFsdWUucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGVhckRyYWdUYXJnZXRTdHlsZXMoKSB7XG4gICAgdGhpcy5yb290XG4gICAgICAucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhbZGF0YS1kcmFnLXRhcmdldF1cIilcbiAgICAgIC5mb3JFYWNoKChoZWFkZXJDZWxsKSA9PiB7XG4gICAgICAgIGhlYWRlckNlbGwucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1kcmFnLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgIHRoaXMuYWN0aXZlRHJhZ1RhcmdldCA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50OiBEcmFnRXZlbnQsIHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIWdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKS5lbmFibGVSZW9yZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlcikge1xuICAgICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IHByb3BlcnR5SWQ7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IFwibW92ZVwiO1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLnNldERhdGEoXCJ0ZXh0L3BsYWluXCIsIHByb3BlcnR5SWQpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5EcmFnT3ZlcihldmVudDogRHJhZ0V2ZW50LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICBpZiAoIWdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKS5lbmFibGVSZW9yZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nQ29sdW1uIHx8IHRoaXMuZHJhZ2dpbmdDb2x1bW4gPT09IHByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5kcm9wRWZmZWN0ID0gXCJtb3ZlXCI7XG4gICAgfVxuICAgIGlmICh0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPT09IHByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMuYWN0aXZlRHJhZ1RhcmdldCA9IHByb3BlcnR5SWQ7XG4gICAgY29uc3QgaGVhZGVyQ2VsbCA9IHRoaXMucm9vdC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcbiAgICAgIGB0aFtkYXRhLXByb3BlcnR5LWlkPVwiJHt0aGlzLnNhZmVBdHRyaWJ1dGVWYWx1ZShwcm9wZXJ0eUlkKX1cIl1gXG4gICAgKTtcbiAgICBpZiAoaGVhZGVyQ2VsbCkge1xuICAgICAgaGVhZGVyQ2VsbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLWRyYWctdGFyZ2V0XCIsIFwidHJ1ZVwiKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJvcChldmVudDogRHJhZ0V2ZW50LCB0YXJnZXRQcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICBpZiAoIWdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKS5lbmFibGVSZW9yZGVyKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmdDb2x1bW4gfHwgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9PT0gdGFyZ2V0UHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG9yZGVyID0gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgICBjb25zdCBzb3VyY2VJbmRleCA9IG9yZGVyLmZpbmRJbmRleCgocHJvcGVydHlJZCkgPT5cbiAgICAgIHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSA9PT0gdGhpcy5kcmFnZ2luZ0NvbHVtblxuICAgICk7XG4gICAgY29uc3QgdGFyZ2V0SW5kZXggPSBvcmRlci5maW5kSW5kZXgoXG4gICAgICAocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpID09PSB0YXJnZXRQcm9wZXJ0eUlkXG4gICAgKTtcbiAgICBpZiAoc291cmNlSW5kZXggPT09IC0xIHx8IHRhcmdldEluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9yZGVyLnNwbGljZShzb3VyY2VJbmRleCwgMSk7XG4gICAgb3JkZXIuc3BsaWNlKHRhcmdldEluZGV4LCAwLCB0aGlzLmRyYWdnaW5nQ29sdW1uIGFzIEJhc2VzUHJvcGVydHlJZCk7XG4gICAgdGhpcy5wZXJzaXN0Q29sdW1uT3JkZXIob3JkZXIpO1xuICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5EcmFnRW5kID0gKCkgPT4ge1xuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICB9O1xuXG4gIHByaXZhdGUgZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICBjb25zdCBleHBsaWNpdE9yZGVyID0gdGhpcy5jb25maWcuZ2V0KERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZKTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShleHBsaWNpdE9yZGVyKSkge1xuICAgICAgY29uc3QgYXZhaWxhYmxlID0gbmV3IFNldCh0aGlzLmRhdGEucHJvcGVydGllcy5tYXAoKHByb3BlcnR5SWQpID0+XG4gICAgICAgIHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKVxuICAgICAgKSk7XG4gICAgICBjb25zdCBzZWVuID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gICAgICBjb25zdCBub3JtYWxpemVkID0gZXhwbGljaXRPcmRlclxuICAgICAgICAubWFwKCh2YWx1ZSkgPT5cbiAgICAgICAgICB0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIgPyAodmFsdWUgYXMgQmFzZXNQcm9wZXJ0eUlkKSA6IG51bGxcbiAgICAgICAgKVxuICAgICAgICAuZmlsdGVyKFxuICAgICAgICAgICh2YWx1ZSk6IHZhbHVlIGlzIEJhc2VzUHJvcGVydHlJZCA9PlxuICAgICAgICAgICAgdmFsdWUgIT09IG51bGwgJiZcbiAgICAgICAgICAgIGF2YWlsYWJsZS5oYXModGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSkgJiZcbiAgICAgICAgICAgIChzZWVuLmhhcyh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSA/IGZhbHNlIDogKHNlZW4uYWRkKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpLCB0cnVlKSlcbiAgICAgICAgKTtcblxuICAgICAgaWYgKG5vcm1hbGl6ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBub3JtYWxpemVkU2V0ID0gbmV3IFNldChcbiAgICAgICAgICBub3JtYWxpemVkLm1hcCgocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpKVxuICAgICAgICApO1xuICAgICAgICBjb25zdCBtaXNzaW5nID0gdGhpcy5kYXRhLnByb3BlcnRpZXMuZmlsdGVyKFxuICAgICAgICAgIChwcm9wZXJ0eUlkKSA9PiAhbm9ybWFsaXplZFNldC5oYXModGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpKVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gWy4uLm5vcm1hbGl6ZWQsIC4uLm1pc3NpbmddO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGV4cGxpY2l0T3JkZXJGcm9tQXBpID0gdGhpcy5jb25maWcuZ2V0T3JkZXIoKTtcbiAgICBpZiAoZXhwbGljaXRPcmRlckZyb21BcGkubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIGV4cGxpY2l0T3JkZXJGcm9tQXBpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRhdGEucHJvcGVydGllcztcbiAgfVxuXG4gIHByaXZhdGUgZ2V0UHJvcGVydHlPcmRlcigpOiBCYXNlc1Byb3BlcnR5SWRbXSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk7XG4gIH1cbn1cblxuY2xhc3MgSG90Zml4ZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbjtcbiAgcHJpdmF0ZSBtaW5XaWR0aElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWF4V2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJhY2tncm91bmRJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHpJbmRleElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIHByaXZhdGUgc2V0U2VjdGlvbkVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLm1pbldpZHRoSW5wdXQpIHRoaXMubWluV2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMubWF4V2lkdGhJbnB1dCkgdGhpcy5tYXhXaWR0aElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5iYWNrZ3JvdW5kSW5wdXQpIHRoaXMuYmFja2dyb3VuZElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy56SW5kZXhJbnB1dCkgdGhpcy56SW5kZXhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gIH1cblxuICBkaXNwbGF5KCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJPYnNpZGlhbiBIb3RmaXhlc1wiIH0pO1xuXG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogXCJCYXNlczogRnJvemVuIGZpcnN0IGNvbHVtblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHNlY3Rpb24gPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudFwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBjdXN0b20gZnJvemVuIHRhYmxlIHZpZXdcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlVzZSBhIGN1c3RvbSBCYXNlcyB2aWV3IHdpdGggYSBzdGlja3kgZmlyc3QgY29sdW1uIGluc3RlYWQgb2Ygb3ZlcmxheSBoYWNrcy5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgZW5hYmxlZDogdmFsdWUgfSk7XG4gICAgICAgICAgdGhpcy5zZXRTZWN0aW9uRW5hYmxlZCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdCBjb2x1bW4gbWluaW11bSB3aWR0aCAocHgpXCIpXG4gICAgICAuc2V0RGVzYyhcIk1pbmltdW0gd2lkdGggb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm1pbldpZHRoSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS5maXJzdENvbHVtbk1pbldpZHRoUHgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkgfHwgcGFyc2VkIDwgODApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBwYXJzZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdCBjb2x1bW4gbWF4IHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiQ2FwIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uIHdpZHRoLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5tYXhXaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiQmFja2dyb3VuZFwiKVxuICAgICAgLnNldERlc2MoXCJCYWNrZ3JvdW5kIHVzZWQgYmVoaW5kIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHN0YXRlLmJhY2tncm91bmRDb2xvcik7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwidmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KVwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHZhbHVlIHx8IERFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4uYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiei1pbmRleFwiKVxuICAgICAgLnNldERlc2MoXCJTdGFja2luZyBvcmRlciBmb3IgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnpJbmRleElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuekluZGV4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCI0XCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHpJbmRleDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBkaXZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRyYXcgYSBkaXZpZGVyIHRvIHRoZSByaWdodCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuc2hvd0RpdmlkZXIpO1xuICAgICAgICB0b2dnbGUuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBzaG93RGl2aWRlcjogdmFsdWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnNldFNlY3Rpb25FbmFibGVkKHN0YXRlLmVuYWJsZWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFnQk87QUFFUCxJQUFNLG1CQUFtQjtBQUN6QixJQUFNLHlCQUF5QjtBQUMvQixJQUFNLDBCQUEwQjtBQUNoQyxJQUFNLGdDQUFnQztBQUN0QyxJQUFNLDZCQUE2QjtBQUNuQyxJQUFNLDJCQUEyQjtBQUVqQyxJQUFNLGtDQUFrQztBQUN4QyxJQUFNLG1DQUFtQztBQUN6QyxJQUFNLGlDQUFpQztBQUN2QyxJQUFNLGdDQUFnQztBQUN0QyxJQUFNLHFDQUFxQztBQVkzQyxJQUFNLGdDQUF5RDtBQUFBLEVBQzdELGNBQWM7QUFBQSxFQUNk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
