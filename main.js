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
    if (/\[\[[^\]]+\]\]/.test(normalized)) {
      return true;
    }
    return /(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(normalized);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIHR5cGUgQmFzZXNWaWV3Q29uZmlnLFxuICBIb3ZlclBhcmVudCxcbiAgSG92ZXJQb3BvdmVyLFxuICBMaW5rVmFsdWUsXG4gIEtleW1hcCxcbiAgUmVuZGVyQ29udGV4dCxcbiAgUGFuZVR5cGUsXG4gIFBsdWdpbixcbiAgUGx1Z2luU2V0dGluZ1RhYixcbiAgTWFya2Rvd25SZW5kZXJlcixcbiAgUXVlcnlDb250cm9sbGVyLFxuICBTZXR0aW5nLFxuICBUZXh0Q29tcG9uZW50LFxuICBVcmxWYWx1ZSxcbiAgcGFyc2VQcm9wZXJ0eUlkLFxuICB0eXBlIEJhc2VzUHJvcGVydHlJZCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IFNUWUxFX0VMRU1FTlRfSUQgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLXJ1bnRpbWUtc3R5bGVzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfVklFV19UWVBFID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tdGFibGVcIjtcbmNvbnN0IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYID0gMTgwO1xuY29uc3QgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFggPSA2MDtcbmNvbnN0IERSQUdHQUJMRV9PUkRFUl9DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4tb3JkZXJcIjtcbmNvbnN0IENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6Y29sdW1uLXdpZHRoc1wiO1xuXG5jb25zdCBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczp2aWV3LWZlYXR1cmUtcmVzaXplXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXJlb3JkZXJcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLXByZXNlcnZlLWxpbmtzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6dmlldy1mZWF0dXJlLWVkaXQtbm90ZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOnZpZXctZmVhdHVyZS13cmFwLW1vZGVcIjtcblxudHlwZSBGcm96ZW5UYWJsZVdyYXBNb2RlID0gXCJuYXJyb3dcIiB8IFwid2lkZVwiO1xuXG5pbnRlcmZhY2UgRnJvemVuVGFibGVWaWV3RmVhdHVyZXMge1xuICBlbmFibGVSZXNpemU6IGJvb2xlYW47XG4gIGVuYWJsZVJlb3JkZXI6IGJvb2xlYW47XG4gIHByZXNlcnZlTGlua3M6IGJvb2xlYW47XG4gIGVkaXRhYmxlTm90ZXM6IGJvb2xlYW47XG4gIHdyYXBNb2RlOiBGcm96ZW5UYWJsZVdyYXBNb2RlO1xufVxuXG5jb25zdCBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUzogRnJvemVuVGFibGVWaWV3RmVhdHVyZXMgPSB7XG4gIGVuYWJsZVJlc2l6ZTogZmFsc2UsXG4gIGVuYWJsZVJlb3JkZXI6IGZhbHNlLFxuICBwcmVzZXJ2ZUxpbmtzOiB0cnVlLFxuICBlZGl0YWJsZU5vdGVzOiBmYWxzZSxcbiAgd3JhcE1vZGU6IFwibmFycm93XCIsXG59O1xuXG5mdW5jdGlvbiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICB2YWx1ZTogdW5rbm93bixcbiAgZmFsbGJhY2s6IGJvb2xlYW5cbik6IGJvb2xlYW4ge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSBcImJvb2xlYW5cIiA/IHZhbHVlIDogZmFsbGJhY2s7XG59XG5cbmZ1bmN0aW9uIGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgdmFsdWU6IHVua25vd24sXG4gIGFsbG93ZWQ6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgZmFsbGJhY2s6IHN0cmluZ1xuKTogc3RyaW5nIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiAmJiBhbGxvd2VkLmluY2x1ZGVzKHZhbHVlKVxuICAgID8gdmFsdWVcbiAgICA6IGZhbGxiYWNrO1xufVxuXG5mdW5jdGlvbiBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyhcbiAgY29uZmlnOiBQaWNrPEJhc2VzVmlld0NvbmZpZywgXCJnZXRcIj5cbik6IEZyb3plblRhYmxlVmlld0ZlYXR1cmVzIHtcbiAgcmV0dXJuIHtcbiAgICBlbmFibGVSZXNpemU6IGdldEJvb2xlYW5GZWF0dXJlVmFsdWUoXG4gICAgICBjb25maWcuZ2V0KEZST1pFTl9UQUJMRV9SRVNJWkVfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZW5hYmxlUmVzaXplXG4gICAgKSxcbiAgICBlbmFibGVSZW9yZGVyOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfUkVPUkRFUl9GRUFUVVJFX0tFWSksXG4gICAgICBERUZBVUxUX0ZST1pFTl9UQUJMRV9GRUFUVVJFUy5lbmFibGVSZW9yZGVyXG4gICAgKSxcbiAgICBwcmVzZXJ2ZUxpbmtzOiBnZXRCb29sZWFuRmVhdHVyZVZhbHVlKFxuICAgICAgY29uZmlnLmdldChGUk9aRU5fVEFCTEVfTElOS1NfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMucHJlc2VydmVMaW5rc1xuICAgICksXG4gICAgZWRpdGFibGVOb3RlczogZ2V0Qm9vbGVhbkZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX0VESVRfRkVBVFVSRV9LRVkpLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMuZWRpdGFibGVOb3Rlc1xuICAgICksXG4gICAgd3JhcE1vZGU6IGdldFN0cmluZ0ZlYXR1cmVWYWx1ZShcbiAgICAgIGNvbmZpZy5nZXQoRlJPWkVOX1RBQkxFX1dSQVBfTU9ERV9GRUFUVVJFX0tFWSksXG4gICAgICBbXCJuYXJyb3dcIiwgXCJ3aWRlXCJdLFxuICAgICAgREVGQVVMVF9GUk9aRU5fVEFCTEVfRkVBVFVSRVMud3JhcE1vZGVcbiAgICApIGFzIEZyb3plblRhYmxlV3JhcE1vZGUsXG4gIH07XG59XG5cbmludGVyZmFjZSBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzIHtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBudW1iZXI7XG4gIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogbnVtYmVyO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgekluZGV4OiBudW1iZXI7XG4gIHNob3dEaXZpZGVyOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSG90Zml4U2V0dGluZ3Mge1xuICBmcmVlemVGaXJzdENvbHVtbjogRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncztcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogSG90Zml4U2V0dGluZ3MgPSB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiAyMjAsXG4gICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiAzMjAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDQsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0ge1xuICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4gfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5yZWdpc3RlclNldHRpbmdUYWIoKTtcbiAgICBjb25zdCByZWdpc3RlcmVkID0gdGhpcy5yZWdpc3RlckJhc2VzVmlldyhGUk9aRU5fVEFCTEVfVklFV19UWVBFLCB7XG4gICAgICBuYW1lOiBcIkZyb3plbiBUYWJsZVwiLFxuICAgICAgaWNvbjogXCJsdWNpZGUtbGF5b3V0LWdyaWRcIixcbiAgICAgIGZhY3Rvcnk6IChjb250cm9sbGVyLCBjb250YWluZXJFbCkgPT5cbiAgICAgICAgbmV3IEZyb3plblRhYmxlQmFzZXNWaWV3KGNvbnRyb2xsZXIsIGNvbnRhaW5lckVsLCB0aGlzKSxcbiAgICAgIG9wdGlvbnM6IChjb25maWcpID0+IHtcbiAgICAgICAgY29uc3QgZmVhdHVyZVNldHRpbmdzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXMoY29uZmlnKTtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImdyb3VwXCIsXG4gICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJGcm96ZW4gdGFibGUgb3B0aW9uc1wiLFxuICAgICAgICAgICAgaXRlbXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfUkVTSVpFX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVzaXppbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZW5hYmxlUmVzaXplLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9SRU9SREVSX0ZFQVRVUkVfS0VZLFxuICAgICAgICAgICAgICAgIGRpc3BsYXlOYW1lOiBcIkVuYWJsZSBjb2x1bW4gcmVvcmRlcmluZ1wiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy5lbmFibGVSZW9yZGVyLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogXCJ0b2dnbGVcIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9MSU5LU19GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJQcmVzZXJ2ZSBpbmxpbmUgbGluayByZW5kZXJpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MucHJlc2VydmVMaW5rcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9nZ2xlXCIsXG4gICAgICAgICAgICAgICAga2V5OiBGUk9aRU5fVEFCTEVfRURJVF9GRUFUVVJFX0tFWSxcbiAgICAgICAgICAgICAgICBkaXNwbGF5TmFtZTogXCJFbmFibGUgbm90ZS1jZWxsIGVkaXRpbmdcIixcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3RlcyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6IFwiZHJvcGRvd25cIixcbiAgICAgICAgICAgICAgICBrZXk6IEZST1pFTl9UQUJMRV9XUkFQX01PREVfRkVBVFVSRV9LRVksXG4gICAgICAgICAgICAgICAgZGlzcGxheU5hbWU6IFwiQ2VsbCB3cmFwcGluZ1wiLFxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IGZlYXR1cmVTZXR0aW5ncy53cmFwTW9kZSxcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgICBuYXJyb3c6IFwiTmFycm93ICh0cnVuY2F0ZSlcIixcbiAgICAgICAgICAgICAgICAgIHdpZGU6IFwiTGFyZ2UgKHdyYXApXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUyxcbiAgICAgIC4uLmxvYWRlZCxcbiAgICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbldpZHRoID0gTWF0aC5tYXgoODAsIGNvbmZpZy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heFdpZHRoID0gTWF0aC5tYXgobWluV2lkdGgsIGNvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHgpO1xuICAgIGNvbnN0IGRpdmlkZXIgPSBjb25maWcuc2hvd0RpdmlkZXJcbiAgICAgID8gXCIxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpXCJcbiAgICAgIDogXCJub25lXCI7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aDogJHttaW5XaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoOiAke21heFdpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZzogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tejogJHtjb25maWcuekluZGV4fTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IHtcbiAgb3ZlcmZsb3cteDogYXV0bztcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIG1pbi13aWR0aDogbWF4LWNvbnRlbnQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUge1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICBmb250LXNpemU6IHZhcigtLWZvbnQtdWktc21hbGxlcik7XG4gIHRhYmxlLWxheW91dDogZml4ZWQ7XG4gIG1heC13aWR0aDogbm9uZTtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHZlcnRpY2FsLWFsaWduOiB0b3A7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLW5hcnJvdyAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgsXG4ub2JzaWRpYW4taG90Zml4ZXMtd3JhcC1uYXJyb3cgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRkIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLXdpZGUgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtd2lkZSAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICB3aGl0ZS1zcGFjZTogbm9ybWFsO1xuICBvdmVyZmxvdy13cmFwOiBhbnl3aGVyZTtcbiAgd29yZC1icmVhazogYnJlYWstd29yZDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQ6Zmlyc3QtY2hpbGQge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAwO1xuICBtaW4td2lkdGg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpO1xuICB3aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoLCB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKSk7XG4gIG1heC13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1heC13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZyk7XG4gIHotaW5kZXg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16KTtcbiAgYm9yZGVyLXJpZ2h0OiAke2RpdmlkZXJ9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIHJpZ2h0OiAwO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMHB4O1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuICB6LWluZGV4OiAyO1xuICB0b3VjaC1hY3Rpb246IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGU6OmFmdGVyIHtcbiAgY29udGVudDogXCJcIjtcbiAgZGlzcGxheTogYmxvY2s7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDA7XG4gIHdpZHRoOiAxcHg7XG4gIGhlaWdodDogMTAwJTtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZSB7XG4gIGN1cnNvcjogZ3JhYjtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0PVwidHJ1ZVwiXSB7XG4gIG91dGxpbmU6IDFweCBzb2xpZCB2YXIoLS1pbnRlcmFjdGl2ZS1hY2NlbnQpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkIHtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIGxlZnQ6IDA7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdHI6Zmlyc3Qtb2YtdHlwZSB0aDpsYXN0LWNoaWxkIHtcbiAgYm9yZGVyLXJpZ2h0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93IHRkIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1zZWNvbmRhcnkpO1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJvcmRlci10b3A6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwge1xuICBjdXJzb3I6IHRleHQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwgdGV4dGFyZWEsXG4ub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIGlucHV0IHtcbiAgd2lkdGg6IDEwMCU7XG4gIGJvcmRlcjogbm9uZTtcbiAgcGFkZGluZzogMDtcbiAgZm9udDogaW5oZXJpdDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiBpbmhlcml0O1xuICByZXNpemU6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHkge1xuICBjb2xvcjogdmFyKC0tdGV4dC1tdXRlZCk7XG4gIHBhZGRpbmc6IDAuNzVyZW0gMC41cmVtO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiA4cHg7XG4gIG1hcmdpbi10b3A6IDAuNXJlbTtcbiAgcGFkZGluZzogMC41cmVtIDAuNzVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24gc3VtbWFyeSB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudCB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogMC43NXJlbTtcbiAgbWFyZ2luLXRvcDogMC43NXJlbTtcbn1cbmAudHJpbSgpO1xuICB9XG5cbiAgcHJpdmF0ZSByZWZyZXNoT3BlbkZyb3plblZpZXdzKCkge1xuICAgIHRoaXMuYXBwLndvcmtzcGFjZS5pdGVyYXRlQWxsTGVhdmVzKChsZWFmKSA9PiB7XG4gICAgICBjb25zdCB2aWV3ID0gbGVhZi52aWV3O1xuICAgICAgaWYgKHZpZXcgaW5zdGFuY2VvZiBGcm96ZW5UYWJsZUJhc2VzVmlldykge1xuICAgICAgICB2aWV3Lm9uRGF0YVVwZGF0ZWQoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxufVxuXG5jbGFzcyBGcm96ZW5UYWJsZUJhc2VzVmlldyBleHRlbmRzIEJhc2VzVmlldyBpbXBsZW1lbnRzIEhvdmVyUGFyZW50IHtcbiAgaG92ZXJQb3BvdmVyOiBIb3ZlclBvcG92ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZWFkb25seSByb290OiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBhY3RpdmVWaWV3OiBIVE1MRGl2RWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZUVkaXRvcjogSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGN1cnJlbnRQcm9wZXJ0eU9yZGVyOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIHJlYWRvbmx5IGNvbHVtbkVsZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxUYWJsZUNvbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgaGVhZGVyRWxlbWVudHMgPSBuZXcgTWFwPHN0cmluZywgSFRNTFRhYmxlSGVhZGVyQ2VsbEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgcmVhZG9ubHkgYWN0aXZlQ29sdW1uV2lkdGhzID0gbmV3IE1hcDxzdHJpbmcsIG51bWJlcj4oKTtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW46IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSByZXNpemVTdGFydFggPSAwO1xuICBwcml2YXRlIHJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplRWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVQb2ludGVySWQ6IG51bWJlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRyYWdnaW5nQ29sdW1uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVEcmFnVGFyZ2V0OiBzdHJpbmcgfCBudWxsID0gbnVsbDtcblxuICBwcml2YXRlIHJlYWRvbmx5IG9uUmVzaXplUG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGNvbnN0IGZlYXR1cmVzID0gZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpO1xuICAgIGlmICghZmVhdHVyZXMuZW5hYmxlUmVzaXplKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSBudWxsXG4gICAgKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuY2xpZW50WCAtIHRoaXMucmVzaXplU3RhcnRYO1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCArIGRlbHRhLFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gMFxuICAgICk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IHdpZHRoO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICAgIHRoaXMuYXBwbHlDb2x1bW5XaWR0aCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgd2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgb25SZXNpemVQb2ludGVyVXAgPSAoKSA9PiB7XG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgaWYgKCFmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8IHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5XaWR0aHMoKTtcblxuICAgIHRoaXMuc3RvcENvbHVtblJlc2l6ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRDb2x1bW5SZXNpemUgPSAoXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudCxcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApID0+IHtcbiAgICBjb25zdCBmZWF0dXJlcyA9IGdldEZyb3plblRhYmxlVmlld0ZlYXR1cmVzKHRoaXMuY29uZmlnKTtcbiAgICBpZiAoIWZlYXR1cmVzLmVuYWJsZVJlc2l6ZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCA9IGV2ZW50LmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQgfCBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gZXZlbnQucG9pbnRlcklkO1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgJiYgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zZXRQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJub25lXCI7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIGNhbiBmYWlsIGluIGVkZ2UgY2FzZXMgKGUuZy4gY2VydGFpbiB3ZWJ2aWV3cykuXG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSBldmVudC5jbGllbnRYO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aDtcblxuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJjb2wtcmVzaXplXCI7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJtb3ZlXCIsIHRoaXMub25SZXNpemVQb2ludGVyTW92ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJ1cFwiLCB0aGlzLm9uUmVzaXplUG9pbnRlclVwKTtcbiAgfTtcblxuICBwcml2YXRlIHN0b3BDb2x1bW5SZXNpemUoKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCAmJiB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCAhPT0gbnVsbCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnJlbGVhc2VQb2ludGVyQ2FwdHVyZSh0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCk7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgLy8gUG9pbnRlciBjYXB0dXJlIG1heSBub3QgYmUgYWN0aXZlOyBpZ25vcmUuXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbikge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgPSBudWxsO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwiXCI7XG4gICAgICB9XG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudCkge1xuICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSAwO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSAwO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBudWxsO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJcIjtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRyb2xsZXI6IFF1ZXJ5Q29udHJvbGxlcixcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoY29udHJvbGxlcik7XG4gICAgdGhpcy5yb290ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3RcIik7XG4gIH1cblxuICByZWFkb25seSB0eXBlID0gRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRTtcblxuICBwdWJsaWMgb25EYXRhVXBkYXRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgZmVhdHVyZXMgPSBnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZyk7XG4gICAgdGhpcy5yb290LmNsYXNzTmFtZSA9IGBvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCBvYnNpZGlhbi1ob3RmaXhlcy13cmFwLSR7ZmVhdHVyZXMud3JhcE1vZGV9YDtcblxuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBbXTtcbiAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5oZWFkZXJFbGVtZW50cy5jbGVhcigpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnN5bmNDb2x1bW5XaWR0aHMoKTtcblxuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRQcm9wZXJ0eU9yZGVyKCk7XG4gICAgaWYgKCFwcm9wZXJ0eU9yZGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBmb3IgdGhpcyBCYXNlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKGtleSwgaW5kZXgpO1xuICAgICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlcltpbmRleF0gPSBrZXk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB3aWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2aWV3ID0gdGhpcy5yb290LmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3XCIpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IHZpZXc7XG4gICAgY29uc3QgZmlyc3RQcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlci5sZW5ndGggPiAwID8gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5T3JkZXJbMF0pIDogbnVsbDtcbiAgICBpZiAoZmlyc3RQcm9wZXJ0eUlkKSB7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoZmlyc3RQcm9wZXJ0eUlkLCAwKTtcbiAgICAgIHZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLCBgJHt3aWR0aH1weGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlVEhlYWQoKTtcbiAgICBjb25zdCBoZWFkZXJSb3cgPSB0aGVhZC5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbGdyb3VwLmNyZWF0ZUVsKFwiY29sXCIpO1xuICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgdGhpcy5jb2x1bW5FbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGNvbCk7XG5cbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbmFtZSB9KTtcbiAgICAgIGhlYWRlci5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZW9yZGVyKSB7XG4gICAgICAgIGhlYWRlci5hZGRDbGFzcyhcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZW9yZGVyLWhhbmRsZVwiKTtcbiAgICAgICAgaGVhZGVyLmRyYWdnYWJsZSA9IHRydWU7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdPdmVyKGV2ZW50LCBwcm9wZXJ0eUtleSlcbiAgICAgICAgKTtcbiAgICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT5cbiAgICAgICAgICB0aGlzLm9uQ29sdW1uRHJvcChldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICAgICk7XG4gICAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkpO1xuICAgICAgICBoZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgdGhpcy5vbkNvbHVtbkRyYWdFbmQpO1xuICAgICAgfVxuICAgICAgdGhpcy5oZWFkZXJFbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGhlYWRlcik7XG5cbiAgICAgIGlmIChmZWF0dXJlcy5lbmFibGVSZXNpemUpIHtcbiAgICAgICAgY29uc3QgaGFuZGxlID0gaGVhZGVyLmNyZWF0ZVNwYW4oe1xuICAgICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZVwiLFxuICAgICAgICB9KTtcbiAgICAgICAgaGFuZGxlLnNldEF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcbiAgICAgICAgaGFuZGxlLmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVyZG93blwiLCAoZXZlbnQpID0+XG4gICAgICAgICAgdGhpcy5zdGFydENvbHVtblJlc2l6ZShldmVudCwgcHJvcGVydHlLZXksIGluZGV4KVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVUQm9keSgpO1xuICAgIGNvbnN0IGhhc1Zpc2libGVHcm91cGluZyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YS5sZW5ndGggPiAxO1xuXG4gICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBncm91cC5lbnRyaWVzO1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhc1Zpc2libGVHcm91cGluZykge1xuICAgICAgICBjb25zdCBncm91cFJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlID0gZ3JvdXAua2V5Py50b1N0cmluZygpID8/IFwiVW5ncm91cGVkXCI7XG4gICAgICAgIGNvbnN0IGdyb3VwQ2VsbCA9IGdyb3VwUm93LmNyZWF0ZUVsKFwidGRcIiwge1xuICAgICAgICAgIHRleHQ6IGtleVZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXBDZWxsLmNvbFNwYW4gPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9wZXJ0eU9yZGVyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5SWQgPSBwcm9wZXJ0eU9yZGVyW2luZGV4XTtcbiAgICAgICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY2VsbC5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgICAgICBjZWxsLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgIGNlbGwuc3R5bGUubWluV2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgY2VsbC5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcblxuICAgICAgICAgIHRoaXMucmVuZGVyQ2VsbFZhbHVlKGNlbGwsIGVudHJ5LCBwcm9wZXJ0eUlkLCBmZWF0dXJlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5SWQocHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKHByb3BlcnR5SWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NaW5XaWR0aFB4LFxuICAgICAgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFhcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJDZWxsVGV4dChjb250YWluZXI6IEhUTUxFbGVtZW50LCB0ZXh0VmFsdWU6IHN0cmluZykge1xuICAgIGNvbnRhaW5lci5lbXB0eSgpO1xuICAgIGNvbnRhaW5lci5jcmVhdGVTcGFuKHsgdGV4dDogdGV4dFZhbHVlIH0pO1xuICAgIGlmICh0ZXh0VmFsdWUpIHtcbiAgICAgIGNvbnRhaW5lci50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckxpbmtGcmllbmRseUNlbGwoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICB2YWx1ZTogYW55LFxuICAgIHRleHRWYWx1ZTogc3RyaW5nLFxuICAgIHNvdXJjZVBhdGg6IHN0cmluZ1xuICApOiBib29sZWFuIHtcbiAgICBpZiAoIXZhbHVlIHx8IHR5cGVvZiB0ZXh0VmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICB2YWx1ZSBpbnN0YW5jZW9mIFVybFZhbHVlIHx8XG4gICAgICB2YWx1ZSBpbnN0YW5jZW9mIExpbmtWYWx1ZSB8fFxuICAgICAgdGhpcy5jb250YWluc0xpa2VseUxpbmtTeW50YXgodGV4dFZhbHVlKVxuICAgICkge1xuICAgICAgY29udGFpbmVyLmVtcHR5KCk7XG5cbiAgICAgIHZvaWQgTWFya2Rvd25SZW5kZXJlci5yZW5kZXIoXG4gICAgICAgIHRoaXMucGx1Z2luLmFwcCxcbiAgICAgICAgdGV4dFZhbHVlLFxuICAgICAgICBjb250YWluZXIsXG4gICAgICAgIHNvdXJjZVBhdGgsXG4gICAgICAgIHRoaXMucGx1Z2luXG4gICAgICApLmNhdGNoKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZW5kZXJDZWxsVGV4dChjb250YWluZXIsIHRleHRWYWx1ZSk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHByaXZhdGUgY29udGFpbnNMaWtlbHlMaW5rU3ludGF4KHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICBjb25zdCBub3JtYWxpemVkID0gdmFsdWUudHJpbSgpO1xuICAgIGlmICghbm9ybWFsaXplZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICgvXFxbXFxbW15cXF1dK1xcXVxcXS8udGVzdChub3JtYWxpemVkKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIC8oPzpodHRwcz86XFwvXFwvfHd3d1xcLilbXlxcczw+XCInKCldKy9pLnRlc3Qobm9ybWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckNlbGxWYWx1ZShcbiAgICBjZWxsOiBIVE1MVGFibGVDZWxsRWxlbWVudCxcbiAgICBlbnRyeTogYW55LFxuICAgIHByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZCxcbiAgICBmZWF0dXJlU2V0dGluZ3M6IEZyb3plblRhYmxlVmlld0ZlYXR1cmVzXG4gICkge1xuICAgIGNvbnN0IHBhcnNlZCA9IHBhcnNlUHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LmdldFZhbHVlKHByb3BlcnR5SWQpO1xuICAgIGNvbnN0IHRleHRWYWx1ZSA9IHZhbHVlID8gdmFsdWUudG9TdHJpbmcoKSA6IFwiXCI7XG4gICAgY2VsbC5jbGFzc0xpc3QucmVtb3ZlKFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsXCIpO1xuXG4gICAgaWYgKHBhcnNlZC50eXBlID09PSBcImZpbGVcIiAmJiBwYXJzZWQubmFtZSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgIGNvbnN0IGxpbmsgPSBjZWxsLmNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICAgIHRleHQ6IGVudHJ5LmZpbGUubmFtZSxcbiAgICAgICAgaHJlZjogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgfSk7XG4gICAgICBsaW5rLmFkZENsYXNzKFwiaW50ZXJuYWwtbGlua1wiKTtcbiAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwICYmIGV2ZW50LmJ1dHRvbiAhPT0gMSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhbmUgPSBLZXltYXAuaXNNb2RFdmVudChldmVudCk7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgaWYgKHBhbmUgPT09IHRydWUgfHwgcGFuZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgICAgZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgIEJvb2xlYW4ocGFuZSlcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQoXG4gICAgICAgICAgZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgcGFuZSBhcyBQYW5lVHlwZVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW92ZXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UudHJpZ2dlcihcImhvdmVyLWxpbmtcIiwge1xuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIHNvdXJjZTogXCJiYXNlc1wiLFxuICAgICAgICAgIGhvdmVyUGFyZW50OiB0aGlzLFxuICAgICAgICAgIHRhcmdldEVsOiBsaW5rLFxuICAgICAgICAgIGxpbmt0ZXh0OiBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICAgIGNlbGwudGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlICYmIGZlYXR1cmVTZXR0aW5ncy5wcmVzZXJ2ZUxpbmtzKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gY2VsbC5jcmVhdGVTcGFuKCk7XG4gICAgICBjb25zdCBzb3VyY2VQYXRoID0gZW50cnk/LmZpbGU/LnBhdGggPz8gXCJcIjtcbiAgICAgIGNvbnN0IHJlbmRlcmVkQXNMaW5rRnJpZW5kbHkgPSB0aGlzLnJlbmRlckxpbmtGcmllbmRseUNlbGwoXG4gICAgICAgIGNvbnRlbnQsXG4gICAgICAgIHZhbHVlLFxuICAgICAgICB0ZXh0VmFsdWUsXG4gICAgICAgIHNvdXJjZVBhdGhcbiAgICAgICk7XG5cbiAgICAgIGlmICghcmVuZGVyZWRBc0xpbmtGcmllbmRseSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBuZXcgUmVuZGVyQ29udGV4dCgpO1xuICAgICAgICAgIGNvbnRleHQuaG92ZXJQb3BvdmVyID0gdGhpcy5ob3ZlclBvcG92ZXI7XG4gICAgICAgICAgdmFsdWUucmVuZGVyVG8oY29udGVudCwgY29udGV4dCk7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgXCJbT2JzaWRpYW4gSG90Zml4ZXNdIEZhaWxlZCB0byByZW5kZXIgdmFsdWUsIGZhbGxpbmcgYmFjayB0byBwbGFpbiB0ZXh0LlwiLFxuICAgICAgICAgICAgcHJvcGVydHlJZCxcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHRoaXMucmVuZGVyQ2VsbFRleHQoY29udGVudCwgdGV4dFZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gY2VsbC5jcmVhdGVTcGFuKCk7XG4gICAgICB0aGlzLnJlbmRlckNlbGxUZXh0KGNvbnRlbnQsIHRleHRWYWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlZC50eXBlID09PSBcIm5vdGVcIiAmJiBmZWF0dXJlU2V0dGluZ3MuZWRpdGFibGVOb3Rlcykge1xuICAgICAgY2VsbC5jbGFzc0xpc3QuYWRkKFwib2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsXCIpO1xuICAgICAgY2VsbC5hZGRFdmVudExpc3RlbmVyKFwiZGJsY2xpY2tcIiwgKCkgPT4ge1xuICAgICAgICB2b2lkIHRoaXMuYmVnaW5FZGl0Tm90ZUNlbGwoY2VsbCwgZW50cnksIHBhcnNlZC5uYW1lLCB0ZXh0VmFsdWUpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgY2VsbC50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGJlZ2luRWRpdE5vdGVDZWxsKFxuICAgIGNlbGw6IEhUTUxUYWJsZUNlbGxFbGVtZW50LFxuICAgIGVudHJ5OiBhbnksXG4gICAgcHJvcGVydHlOYW1lOiBzdHJpbmcsXG4gICAgaW5pdGlhbFZhbHVlOiBzdHJpbmdcbiAgKSB7XG4gICAgaWYgKHRoaXMuYWN0aXZlRWRpdG9yKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJldmlvdXNWYWx1ZSA9IGNlbGwuaW5uZXJUZXh0O1xuICAgIGNvbnN0IGVkaXRvciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0ZXh0YXJlYVwiKTtcbiAgICBlZGl0b3IudmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gICAgZWRpdG9yLnJvd3MgPSAxO1xuXG4gICAgY29uc3QgY2FuY2VsID0gKCkgPT4ge1xuICAgICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29tbWl0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gZWRpdG9yLnZhbHVlO1xuICAgICAgaWYgKG5leHRWYWx1ZSAhPT0gcHJldmlvdXNWYWx1ZSkge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKFxuICAgICAgICAgIGVudHJ5LmZpbGUsXG4gICAgICAgICAgKGZyb250bWF0dGVyKSA9PiB7XG4gICAgICAgICAgICBmcm9udG1hdHRlcltwcm9wZXJ0eU5hbWVdID0gbmV4dFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNhbmNlbCgpO1xuICAgIH07XG5cbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGVkaXRvcjtcbiAgICBjZWxsLmVtcHR5KCk7XG4gICAgY2VsbC5hcHBlbmRDaGlsZChlZGl0b3IpO1xuICAgIGVkaXRvci5mb2N1cygpO1xuICAgIGVkaXRvci5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtZWRpdG9yXCI7XG5cbiAgICBlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImtleWRvd25cIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSBcIkVudGVyXCIgJiYgIWV2ZW50LnNoaWZ0S2V5KSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZvaWQgY29tbWl0KCk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50LmtleSA9PT0gXCJFc2NhcGVcIikge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjYW5jZWwoKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBlZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKCkgPT4ge1xuICAgICAgdm9pZCBjb21taXQoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTogTWFwPHN0cmluZywgbnVtYmVyPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSB0aGlzLmNvbmZpZy5nZXQoQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZKTtcbiAgICBjb25zdCBtYXBwZWQgPSBuZXcgTWFwPHN0cmluZywgbnVtYmVyPigpO1xuXG4gICAgaWYgKFxuICAgICAgc2F2ZWQgJiZcbiAgICAgIHR5cGVvZiBzYXZlZCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgIUFycmF5LmlzQXJyYXkoc2F2ZWQpXG4gICAgKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzYXZlZCkpIHtcbiAgICAgICAgY29uc3Qgd2lkdGggPSBOdW1iZXIodmFsdWUpO1xuICAgICAgICBpZiAoTnVtYmVyLmlzRmluaXRlKHdpZHRoKSkge1xuICAgICAgICAgIG1hcHBlZC5zZXQoa2V5LCB3aWR0aCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hcHBlZDtcbiAgfVxuXG4gIHByaXZhdGUgc3luY0NvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBsb2FkZWQgPSB0aGlzLmdldFNhdmVkQ29sdW1uV2lkdGhzKCk7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuY2xlYXIoKTtcbiAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBsb2FkZWQuZW50cmllcygpKSB7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRDb2x1bW5XaWR0aChcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApOiBudW1iZXIge1xuICAgIGNvbnN0IGZhbGxiYWNrRGVmYXVsdCA9IGluZGV4ID09PSAwXG4gICAgICA/IHRoaXMuZ2V0RGVmYXVsdEZpcnN0Q29sdW1uV2lkdGgoKVxuICAgICAgOiBERUZBVUxUX0NPTFVNTl9XSURUSF9QWDtcbiAgICBjb25zdCBjb25maWd1cmVkID0gdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZ2V0KHByb3BlcnR5SWQpO1xuICAgIGNvbnN0IHdpZHRoID0gdHlwZW9mIGNvbmZpZ3VyZWQgPT09IFwibnVtYmVyXCIgPyBjb25maWd1cmVkIDogZmFsbGJhY2tEZWZhdWx0O1xuICAgIHJldHVybiB0aGlzLmNsYW1wQ29sdW1uV2lkdGgod2lkdGgsIGluZGV4ID09PSAwKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xhbXBDb2x1bW5XaWR0aCh3aWR0aDogbnVtYmVyLCBpc0ZpcnN0Q29sdW1uID0gZmFsc2UpOiBudW1iZXIge1xuICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBNYXRoLm1heCh3aWR0aCwgTUlOX1JFU0laQUJMRV9DT0xVTU5fV0lEVEhfUFgpO1xuICAgIGlmICghaXNGaXJzdENvbHVtbikge1xuICAgICAgcmV0dXJuIG5vcm1hbGl6ZWQ7XG4gICAgfVxuXG4gICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCBtaW4gPSBNYXRoLm1heChNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCwgc2V0dGluZ3MuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KTtcbiAgICBjb25zdCBtYXggPSBNYXRoLm1heChtaW4sIHNldHRpbmdzLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCk7XG4gICAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KG5vcm1hbGl6ZWQsIG1pbiksIG1heCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5Q29sdW1uV2lkdGgocHJvcGVydHlJZDogc3RyaW5nLCB3aWR0aDogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgaXNGaXJzdENvbHVtbiA9IHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXJbMF0gPT09IHByb3BlcnR5SWQ7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IHRoaXMuY2xhbXBDb2x1bW5XaWR0aCh3aWR0aCwgaXNGaXJzdENvbHVtbik7XG4gICAgY29uc3QgY29sdW1uID0gdGhpcy5jb2x1bW5FbGVtZW50cy5nZXQocHJvcGVydHlJZCk7XG4gICAgaWYgKGNvbHVtbikge1xuICAgICAgY29sdW1uLnN0eWxlLndpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBjb2x1bW4uc3R5bGUubWluV2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGNvbHVtbi5zdHlsZS5tYXhXaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgIH1cblxuICAgIGNvbnN0IGhlYWRlciA9IHRoaXMuaGVhZGVyRWxlbWVudHMuZ2V0KHByb3BlcnR5SWQpO1xuICAgIGlmIChoZWFkZXIpIHtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgaGVhZGVyLnN0eWxlLm1pbldpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBoZWFkZXIuc3R5bGUubWF4V2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICB9XG5cbiAgICBpZiAoaXNGaXJzdENvbHVtbiAmJiB0aGlzLmFjdGl2ZVZpZXcpIHtcbiAgICAgIHRoaXMuYWN0aXZlVmlldy5zdHlsZS5zZXRQcm9wZXJ0eShcbiAgICAgICAgXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLFxuICAgICAgICBgJHtub3JtYWxpemVkfXB4YFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3RDb2x1bW5XaWR0aHMoKSB7XG4gICAgY29uc3Qgc2VyaWFsaXplZDogUmVjb3JkPHN0cmluZywgbnVtYmVyPiA9IHt9O1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmVudHJpZXMoKSkge1xuICAgICAgc2VyaWFsaXplZFtrZXldID0gdmFsdWU7XG4gICAgfVxuICAgIHRoaXMuY29uZmlnLnNldChDT0xVTU5fV0lEVEhTX0NPTkZJR19LRVksIHNlcmlhbGl6ZWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBwZXJzaXN0Q29sdW1uT3JkZXIob3JkZXI6IEJhc2VzUHJvcGVydHlJZFtdKSB7XG4gICAgdGhpcy5jb25maWcuc2V0KFxuICAgICAgRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVksXG4gICAgICBvcmRlci5tYXAoKHByb3BlcnR5SWQpID0+IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSlcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBzYWZlQXR0cmlidXRlVmFsdWUodmFsdWU6IHN0cmluZykge1xuICAgIHJldHVybiB2YWx1ZS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJyk7XG4gIH1cblxuICBwcml2YXRlIGNsZWFyRHJhZ1RhcmdldFN0eWxlcygpIHtcbiAgICB0aGlzLnJvb3RcbiAgICAgIC5xdWVyeVNlbGVjdG9yQWxsPEhUTUxFbGVtZW50PihcIi5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aFtkYXRhLWRyYWctdGFyZ2V0XVwiKVxuICAgICAgLmZvckVhY2goKGhlYWRlckNlbGwpID0+IHtcbiAgICAgICAgaGVhZGVyQ2VsbC5yZW1vdmVBdHRyaWJ1dGUoXCJkYXRhLWRyYWctdGFyZ2V0XCIpO1xuICAgICAgfSk7XG4gICAgdGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID0gbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5EcmFnU3RhcnQoZXZlbnQ6IERyYWdFdmVudCwgcHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgcHJvcGVydHlJZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdPdmVyKGV2ZW50OiBEcmFnRXZlbnQsIHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmdDb2x1bW4gfHwgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9PT0gcHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKGV2ZW50LmRhdGFUcmFuc2Zlcikge1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSBcIm1vdmVcIjtcbiAgICB9XG4gICAgaWYgKHRoaXMuYWN0aXZlRHJhZ1RhcmdldCA9PT0gcHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgdGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBoZWFkZXJDZWxsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgYHRoW2RhdGEtcHJvcGVydHktaWQ9XCIke3RoaXMuc2FmZUF0dHJpYnV0ZVZhbHVlKHByb3BlcnR5SWQpfVwiXWBcbiAgICApO1xuICAgIGlmIChoZWFkZXJDZWxsKSB7XG4gICAgICBoZWFkZXJDZWxsLnNldEF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIiwgXCJ0cnVlXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5Ecm9wKGV2ZW50OiBEcmFnRXZlbnQsIHRhcmdldFByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmICghZ2V0RnJvemVuVGFibGVWaWV3RmVhdHVyZXModGhpcy5jb25maWcpLmVuYWJsZVJlb3JkZXIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghdGhpcy5kcmFnZ2luZ0NvbHVtbiB8fCB0aGlzLmRyYWdnaW5nQ29sdW1uID09PSB0YXJnZXRQcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3JkZXIgPSB0aGlzLmdldEN1cnJlbnRDb2x1bW5PcmRlcigpO1xuICAgIGNvbnN0IHNvdXJjZUluZGV4ID0gb3JkZXIuZmluZEluZGV4KChwcm9wZXJ0eUlkKSA9PlxuICAgICAgdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpID09PSB0aGlzLmRyYWdnaW5nQ29sdW1uXG4gICAgKTtcbiAgICBjb25zdCB0YXJnZXRJbmRleCA9IG9yZGVyLmZpbmRJbmRleChcbiAgICAgIChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkgPT09IHRhcmdldFByb3BlcnR5SWRcbiAgICApO1xuICAgIGlmIChzb3VyY2VJbmRleCA9PT0gLTEgfHwgdGFyZ2V0SW5kZXggPT09IC0xKSB7XG4gICAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgb3JkZXIuc3BsaWNlKHNvdXJjZUluZGV4LCAxKTtcbiAgICBvcmRlci5zcGxpY2UodGFyZ2V0SW5kZXgsIDAsIHRoaXMuZHJhZ2dpbmdDb2x1bW4gYXMgQmFzZXNQcm9wZXJ0eUlkKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5PcmRlcihvcmRlcik7XG4gICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdFbmQgPSAoKSA9PiB7XG4gICAgaWYgKCFnZXRGcm96ZW5UYWJsZVZpZXdGZWF0dXJlcyh0aGlzLmNvbmZpZykuZW5hYmxlUmVvcmRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBnZXRDdXJyZW50Q29sdW1uT3JkZXIoKTogQmFzZXNQcm9wZXJ0eUlkW10ge1xuICAgIGNvbnN0IGV4cGxpY2l0T3JkZXIgPSB0aGlzLmNvbmZpZy5nZXQoRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVkpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cGxpY2l0T3JkZXIpKSB7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KHRoaXMuZGF0YS5wcm9wZXJ0aWVzLm1hcCgocHJvcGVydHlJZCkgPT5cbiAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpXG4gICAgICApKTtcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBleHBsaWNpdE9yZGVyXG4gICAgICAgIC5tYXAoKHZhbHVlKSA9PlxuICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/ICh2YWx1ZSBhcyBCYXNlc1Byb3BlcnR5SWQpIDogbnVsbFxuICAgICAgICApXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgKHZhbHVlKTogdmFsdWUgaXMgQmFzZXNQcm9wZXJ0eUlkID0+XG4gICAgICAgICAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgYXZhaWxhYmxlLmhhcyh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSAmJlxuICAgICAgICAgICAgKHNlZW4uaGFzKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpID8gZmFsc2UgOiAoc2Vlbi5hZGQodGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSksIHRydWUpKVxuICAgICAgICApO1xuXG4gICAgICBpZiAobm9ybWFsaXplZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTZXQgPSBuZXcgU2V0KFxuICAgICAgICAgIG5vcm1hbGl6ZWQubWFwKChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IG1pc3NpbmcgPSB0aGlzLmRhdGEucHJvcGVydGllcy5maWx0ZXIoXG4gICAgICAgICAgKHByb3BlcnR5SWQpID0+ICFub3JtYWxpemVkU2V0Lmhhcyh0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBbLi4ubm9ybWFsaXplZCwgLi4ubWlzc2luZ107XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZXhwbGljaXRPcmRlckZyb21BcGkgPSB0aGlzLmNvbmZpZy5nZXRPcmRlcigpO1xuICAgIGlmIChleHBsaWNpdE9yZGVyRnJvbUFwaS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZXhwbGljaXRPcmRlckZyb21BcGk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wcm9wZXJ0aWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm9wZXJ0eU9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgfVxufVxuXG5jbGFzcyBIb3RmaXhlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luO1xuICBwcml2YXRlIG1pbldpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXhXaWR0aElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYmFja2dyb3VuZElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgekluZGV4SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRTZWN0aW9uRW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMubWluV2lkdGhJbnB1dCkgdGhpcy5taW5XaWR0aElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5tYXhXaWR0aElucHV0KSB0aGlzLm1heFdpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmJhY2tncm91bmRJbnB1dCkgdGhpcy5iYWNrZ3JvdW5kSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLnpJbmRleElucHV0KSB0aGlzLnpJbmRleElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk9ic2lkaWFuIEhvdGZpeGVzXCIgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBcIkJhc2VzOiBGcm96ZW4gZmlyc3QgY29sdW1uXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGN1c3RvbSBmcm96ZW4gdGFibGUgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiVXNlIGEgY3VzdG9tIEJhc2VzIHZpZXcgd2l0aCBhIHN0aWNreSBmaXJzdCBjb2x1bW4gaW5zdGVhZCBvZiBvdmVybGF5IGhhY2tzLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBlbmFibGVkOiB2YWx1ZSB9KTtcbiAgICAgICAgICB0aGlzLnNldFNlY3Rpb25FbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtaW5pbXVtIHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiTWluaW11bSB3aWR0aCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWluV2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWluV2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1pbldpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtYXggd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJDYXAgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4gd2lkdGguXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm1heFdpZHRoSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS5maXJzdENvbHVtbk1heFdpZHRoUHgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkgfHwgcGFyc2VkIDwgODApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBwYXJzZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJCYWNrZ3JvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIkJhY2tncm91bmQgdXNlZCBiZWhpbmQgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0YWNraW5nIG9yZGVyIGZvciB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjRcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRHJhdyBhIGRpdmlkZXIgdG8gdGhlIHJpZ2h0IG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5zaG93RGl2aWRlcik7XG4gICAgICAgIHRvZ2dsZS5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHNob3dEaXZpZGVyOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQoc3RhdGUuZW5hYmxlZCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQW1CTztBQUVQLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0seUJBQXlCO0FBQy9CLElBQU0sMEJBQTBCO0FBQ2hDLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0sNkJBQTZCO0FBQ25DLElBQU0sMkJBQTJCO0FBRWpDLElBQU0sa0NBQWtDO0FBQ3hDLElBQU0sbUNBQW1DO0FBQ3pDLElBQU0saUNBQWlDO0FBQ3ZDLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0scUNBQXFDO0FBWTNDLElBQU0sZ0NBQXlEO0FBQUEsRUFDN0QsY0FB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
