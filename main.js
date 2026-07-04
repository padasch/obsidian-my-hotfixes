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
      factory: (controller, containerEl) => new FrozenTableBasesView(controller, containerEl, this)
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
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-ui-smaller);
  table-layout: fixed;
  max-width: none;
  position: relative;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  min-width: var(--obsidian-hotfixes-first-column-width, var(--obsidian-hotfixes-first-column-min-width));
  width: var(--obsidian-hotfixes-first-column-width, var(--obsidian-hotfixes-first-column-min-width));
  max-width: var(--obsidian-hotfixes-first-column-width, var(--obsidian-hotfixes-first-column-max-width));
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
      header.draggable = true;
      this.headerElements.set(propertyKey, header);
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
      const handle = header.createSpan({
        cls: "obsidian-hotfixes-frozen-bases-resize-handle"
      });
      handle.setAttr("draggable", "false");
      handle.addEventListener(
        "pointerdown",
        (event) => this.startColumnResize(event, propertyKey, index)
      );
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
          const parsed = (0, import_obsidian.parsePropertyId)(propertyId);
          cell.dataset.propertyId = propertyKey;
          cell.style.width = `${width}px`;
          cell.style.minWidth = `${width}px`;
          cell.style.maxWidth = `${width}px`;
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
            continue;
          }
          const value = entry.getValue(propertyId);
          const textValue = value ? value.toString() : "";
          cell.createSpan({ text: textValue });
          if (textValue) {
            cell.title = textValue;
          }
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
    if (event.dataTransfer) {
      this.draggingColumn = propertyId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", propertyId);
    }
  }
  onColumnDragOver(event, propertyId) {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIEhvdmVyUGFyZW50LFxuICBIb3ZlclBvcG92ZXIsXG4gIEtleW1hcCxcbiAgUGFuZVR5cGUsXG4gIFBsdWdpbixcbiAgUGx1Z2luU2V0dGluZ1RhYixcbiAgUXVlcnlDb250cm9sbGVyLFxuICBTZXR0aW5nLFxuICBUZXh0Q29tcG9uZW50LFxuICBwYXJzZVByb3BlcnR5SWQsXG4gIHR5cGUgQmFzZXNQcm9wZXJ0eUlkLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9WSUVXX1RZUEUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi10YWJsZVwiO1xuY29uc3QgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFggPSAxODA7XG5jb25zdCBNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCA9IDYwO1xuY29uc3QgRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVkgPSBcIm9ic2lkaWFuLWhvdGZpeGVzOmNvbHVtbi1vcmRlclwiO1xuY29uc3QgQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZID0gXCJvYnNpZGlhbi1ob3RmaXhlczpjb2x1bW4td2lkdGhzXCI7XG5cbmludGVyZmFjZSBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzIHtcbiAgZW5hYmxlZDogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBudW1iZXI7XG4gIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogbnVtYmVyO1xuICBiYWNrZ3JvdW5kQ29sb3I6IHN0cmluZztcbiAgekluZGV4OiBudW1iZXI7XG4gIHNob3dEaXZpZGVyOiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSG90Zml4U2V0dGluZ3Mge1xuICBmcmVlemVGaXJzdENvbHVtbjogRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncztcbn1cblxuY29uc3QgREVGQVVMVF9TRVRUSU5HUzogSG90Zml4U2V0dGluZ3MgPSB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiB7XG4gICAgZW5hYmxlZDogZmFsc2UsXG4gICAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiAyMjAsXG4gICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiAzMjAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDQsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0ge1xuICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4gfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5yZWdpc3RlclNldHRpbmdUYWIoKTtcbiAgICBjb25zdCByZWdpc3RlcmVkID0gdGhpcy5yZWdpc3RlckJhc2VzVmlldyhGUk9aRU5fVEFCTEVfVklFV19UWVBFLCB7XG4gICAgICBuYW1lOiBcIkZyb3plbiBUYWJsZVwiLFxuICAgICAgaWNvbjogXCJsdWNpZGUtbGF5b3V0LWdyaWRcIixcbiAgICAgIGZhY3Rvcnk6IChjb250cm9sbGVyLCBjb250YWluZXJFbCkgPT5cbiAgICAgICAgbmV3IEZyb3plblRhYmxlQmFzZXNWaWV3KGNvbnRyb2xsZXIsIGNvbnRhaW5lckVsLCB0aGlzKSxcbiAgICB9KTtcbiAgICBpZiAoIXJlZ2lzdGVyZWQpIHtcbiAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgXCJbT2JzaWRpYW4gSG90Zml4ZXNdIEZyb3plbiBUYWJsZSB2aWV3IGNvdWxkIG5vdCBiZSByZWdpc3RlcmVkLiBCYXNlcyBtYXkgYmUgZGlzYWJsZWQuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsICgpID0+IHRoaXMuYXBwbHlTdHlsZXMoKSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJmaWxlLW9wZW5cIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRG9tRXZlbnQod2luZG93LCBcInJlc2l6ZVwiLCAoKSA9PiB0aGlzLnJlZnJlc2hPcGVuRnJvemVuVmlld3MoKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcmVnaXN0ZXJTZXR0aW5nVGFiKCkge1xuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgSG90Zml4ZXNTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgbG9hZGVkID0gYXdhaXQgdGhpcy5sb2FkRGF0YSgpO1xuICAgIHRoaXMuc2V0dGluZ3MgPSB7XG4gICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLFxuICAgICAgLi4ubG9hZGVkLFxuICAgICAgZnJlZXplRmlyc3RDb2x1bW46IHtcbiAgICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgICAgLi4uKGxvYWRlZD8uZnJlZXplRmlyc3RDb2x1bW4gPz8ge30pLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVN0eWxlcygpIHtcbiAgICBpZiAoIXRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LmlkID0gU1RZTEVfRUxFTUVOVF9JRDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3QgbWluV2lkdGggPSBNYXRoLm1heCg4MCwgY29uZmlnLmZpcnN0Q29sdW1uTWluV2lkdGhQeCk7XG4gICAgY29uc3QgbWF4V2lkdGggPSBNYXRoLm1heChtaW5XaWR0aCwgY29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCk7XG4gICAgY29uc3QgZGl2aWRlciA9IGNvbmZpZy5zaG93RGl2aWRlclxuICAgICAgPyBcIjFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcilcIlxuICAgICAgOiBcIm5vbmVcIjtcblxuICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID0gYFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoOiAke21pbldpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1tYXgtd2lkdGg6ICR7bWF4V2lkdGh9cHg7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16OiAke2NvbmZpZy56SW5kZXh9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3Qge1xuICBvdmVyZmxvdy14OiBhdXRvO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXItY29sbGFwc2U6IHNlcGFyYXRlO1xuICBib3JkZXItc3BhY2luZzogMDtcbiAgZm9udC1zaXplOiB2YXIoLS1mb250LXVpLXNtYWxsZXIpO1xuICB0YWJsZS1sYXlvdXQ6IGZpeGVkO1xuICBtYXgtd2lkdGg6IG5vbmU7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZDpmaXJzdC1jaGlsZCB7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIGxlZnQ6IDA7XG4gIG1pbi13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoLCB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKSk7XG4gIHdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4td2lkdGgsIHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1taW4td2lkdGgpKTtcbiAgbWF4LXdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4td2lkdGgsIHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1tYXgtd2lkdGgpKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnKTtcbiAgei1pbmRleDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXopO1xuICBib3JkZXItcmlnaHQ6ICR7ZGl2aWRlcn07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGUge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMDtcbiAgcmlnaHQ6IDA7XG4gIGhlaWdodDogMTAwJTtcbiAgd2lkdGg6IDEwcHg7XG4gIGN1cnNvcjogY29sLXJlc2l6ZTtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIHotaW5kZXg6IDI7XG4gIHRvdWNoLWFjdGlvbjogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZTo6YWZ0ZXIge1xuICBjb250ZW50OiBcIlwiO1xuICBkaXNwbGF5OiBibG9jaztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiA1MCU7XG4gIHRvcDogMDtcbiAgd2lkdGg6IDFweDtcbiAgaGVpZ2h0OiAxMDAlO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhbZGF0YS1kcmFnLXRhcmdldD1cInRydWVcIl0ge1xuICBvdXRsaW5lOiAxcHggc29saWQgdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCB7XG4gIHotaW5kZXg6IGNhbGModmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXosIDQpICsgMSk7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdGg6Zmlyc3QtY2hpbGQge1xuICBsZWZ0OiAwO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoZWFkIHRyOmZpcnN0LW9mLXR5cGUgdGg6bGFzdC1jaGlsZCB7XG4gIGJvcmRlci1yaWdodDogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWdyb3VwLXJvdyB0ZCB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICBmb250LXdlaWdodDogNjAwO1xuICBib3JkZXItdG9wOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLWVtcHR5IHtcbiAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICBwYWRkaW5nOiAwLjc1cmVtIDAuNXJlbTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbiB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuICBtYXJnaW4tdG9wOiAwLjVyZW07XG4gIHBhZGRpbmc6IDAuNXJlbSAwLjc1cmVtO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHN1bW1hcnkge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHVzZXItc2VsZWN0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnQge1xuICBkaXNwbGF5OiBncmlkO1xuICBnYXA6IDAuNzVyZW07XG4gIG1hcmdpbi10b3A6IDAuNzVyZW07XG59XG5gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuaXRlcmF0ZUFsbExlYXZlcygobGVhZikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgRnJvemVuVGFibGVCYXNlc1ZpZXcpIHtcbiAgICAgICAgdmlldy5vbkRhdGFVcGRhdGVkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVGcmVlemVGaXJzdENvbHVtbihcbiAgICB1cGRhdGVzOiBQYXJ0aWFsPEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M+XG4gICkge1xuICAgIHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4gPSB7XG4gICAgICAuLi50aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLFxuICAgICAgLi4udXBkYXRlcyxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvemVuVGFibGVCYXNlc1ZpZXcgZXh0ZW5kcyBCYXNlc1ZpZXcgaW1wbGVtZW50cyBIb3ZlclBhcmVudCB7XG4gIGhvdmVyUG9wb3ZlcjogSG92ZXJQb3BvdmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVhZG9ubHkgcm9vdDogSFRNTERpdkVsZW1lbnQ7XG4gIHByaXZhdGUgYWN0aXZlVmlldzogSFRNTERpdkVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBjdXJyZW50UHJvcGVydHlPcmRlcjogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSByZWFkb25seSBjb2x1bW5FbGVtZW50cyA9IG5ldyBNYXA8c3RyaW5nLCBIVE1MVGFibGVDb2xFbGVtZW50PigpO1xuICBwcml2YXRlIHJlYWRvbmx5IGhlYWRlckVsZW1lbnRzID0gbmV3IE1hcDxzdHJpbmcsIEhUTUxUYWJsZUhlYWRlckNlbGxFbGVtZW50PigpO1xuICBwcml2YXRlIHJlYWRvbmx5IGFjdGl2ZUNvbHVtbldpZHRocyA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplQ29sdW1uOiBzdHJpbmcgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW5JbmRleDogbnVtYmVyIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcmVzaXplU3RhcnRYID0gMDtcbiAgcHJpdmF0ZSByZXNpemVkQ29sdW1uU3RhcnRXaWR0aCA9IDA7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplV2lkdGggPSAwO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUVsZW1lbnQ6IEhUTUxFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlUmVzaXplUG9pbnRlcklkOiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkcmFnZ2luZ0NvbHVtbjogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYWN0aXZlRHJhZ1RhcmdldDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSByZWFkb25seSBvblJlc2l6ZVBvaW50ZXJNb3ZlID0gKGV2ZW50OiBQb2ludGVyRXZlbnQpID0+IHtcbiAgICBpZiAoXG4gICAgICAhdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gfHxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGxcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgY29uc3QgZGVsdGEgPSBldmVudC5jbGllbnRYIC0gdGhpcy5yZXNpemVTdGFydFg7XG4gICAgY29uc3Qgd2lkdGggPSB0aGlzLmNsYW1wQ29sdW1uV2lkdGgoXG4gICAgICB0aGlzLnJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoICsgZGVsdGEsXG4gICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID09PSAwXG4gICAgKTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB3aWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB3aWR0aCk7XG4gIH07XG5cbiAgcHJpdmF0ZSByZWFkb25seSBvblJlc2l6ZVBvaW50ZXJVcCA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuYWN0aXZlUmVzaXplQ29sdW1uIHx8IHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKFxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldCh0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiwgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCk7XG4gICAgdGhpcy5hcHBseUNvbHVtbldpZHRoKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoKTtcbiAgICB0aGlzLnBlcnNpc3RDb2x1bW5XaWR0aHMoKTtcblxuICAgIHRoaXMuc3RvcENvbHVtblJlc2l6ZSgpO1xuICB9O1xuXG4gIHByaXZhdGUgcmVhZG9ubHkgc3RhcnRDb2x1bW5SZXNpemUgPSAoXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudCxcbiAgICBwcm9wZXJ0eUlkOiBzdHJpbmcsXG4gICAgaW5kZXg6IG51bWJlclxuICApID0+IHtcbiAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgPSBldmVudC5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50IHwgbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCA9IGV2ZW50LnBvaW50ZXJJZDtcbiAgICBpZiAodGhpcy5hY3RpdmVSZXNpemVFbGVtZW50ICYmIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkICE9PSBudWxsKSB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc2V0UG9pbnRlckNhcHR1cmUodGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQpO1xuICAgICAgICB0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQuc3R5bGUudXNlclNlbGVjdCA9IFwibm9uZVwiO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFBvaW50ZXIgY2FwdHVyZSBjYW4gZmFpbCBpbiBlZGdlIGNhc2VzIChlLmcuIGNlcnRhaW4gd2Vidmlld3MpLlxuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbiA9IHByb3BlcnR5SWQ7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9IGluZGV4O1xuICAgIHRoaXMucmVzaXplU3RhcnRYID0gZXZlbnQuY2xpZW50WDtcbiAgICB0aGlzLnJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChwcm9wZXJ0eUlkLCBpbmRleCk7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVXaWR0aCA9IHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGg7XG5cbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiY29sLXJlc2l6ZVwiO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBzdG9wQ29sdW1uUmVzaXplKCkge1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQgJiYgdGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQgIT09IG51bGwpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5yZWxlYXNlUG9pbnRlckNhcHR1cmUodGhpcy5hY3RpdmVSZXNpemVQb2ludGVySWQpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIFBvaW50ZXIgY2FwdHVyZSBtYXkgbm90IGJlIGFjdGl2ZTsgaWdub3JlLlxuICAgICAgfVxuICAgIH1cblxuICAgIGlmICghdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4pIHtcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplUG9pbnRlcklkID0gbnVsbDtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQpIHtcbiAgICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50LnN0eWxlLnVzZXJTZWxlY3QgPSBcIlwiO1xuICAgICAgfVxuICAgICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50ID0gbnVsbDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJNb3ZlKTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHRoaXMub25SZXNpemVQb2ludGVyVXApO1xuICAgIGlmICh0aGlzLmFjdGl2ZVJlc2l6ZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplRWxlbWVudC5zdHlsZS51c2VyU2VsZWN0ID0gXCJcIjtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPSBudWxsO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplV2lkdGggPSAwO1xuICAgIHRoaXMucmVzaXplU3RhcnRYID0gMDtcbiAgICB0aGlzLnJlc2l6ZWRDb2x1bW5TdGFydFdpZHRoID0gMDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVBvaW50ZXJJZCA9IG51bGw7XG4gICAgdGhpcy5hY3RpdmVSZXNpemVFbGVtZW50ID0gbnVsbDtcbiAgICBkb2N1bWVudC5ib2R5LnN0eWxlLmN1cnNvciA9IFwiXCI7XG4gIH1cblxuICBjb25zdHJ1Y3RvcihcbiAgICBjb250cm9sbGVyOiBRdWVyeUNvbnRyb2xsZXIsXG4gICAgY29udGFpbmVyRWw6IEhUTUxFbGVtZW50LFxuICAgIHByaXZhdGUgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luXG4gICkge1xuICAgIHN1cGVyKGNvbnRyb2xsZXIpO1xuICAgIHRoaXMucm9vdCA9IGNvbnRhaW5lckVsLmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290XCIpO1xuICB9XG5cbiAgcmVhZG9ubHkgdHlwZSA9IEZST1pFTl9UQUJMRV9WSUVXX1RZUEU7XG5cbiAgcHVibGljIG9uRGF0YVVwZGF0ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyKCkge1xuICAgIHRoaXMucm9vdC5lbXB0eSgpO1xuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBbXTtcbiAgICB0aGlzLmNvbHVtbkVsZW1lbnRzLmNsZWFyKCk7XG4gICAgdGhpcy5oZWFkZXJFbGVtZW50cy5jbGVhcigpO1xuICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmNsZWFyKCk7XG4gICAgdGhpcy5zdG9wQ29sdW1uUmVzaXplKCk7XG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLnN5bmNDb2x1bW5XaWR0aHMoKTtcblxuICAgIGlmICghdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRQcm9wZXJ0eU9yZGVyKCk7XG4gICAgaWYgKCFwcm9wZXJ0eU9yZGVyLmxlbmd0aCkge1xuICAgICAgdGhpcy5yb290LmNyZWF0ZURpdih7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJObyBwcm9wZXJ0aWVzIGF2YWlsYWJsZSBmb3IgdGhpcyBCYXNlLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3Qga2V5ID0gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKGtleSwgaW5kZXgpO1xuICAgICAgdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlcltpbmRleF0gPSBrZXk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQoa2V5LCB3aWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB2aWV3ID0gdGhpcy5yb290LmNyZWF0ZURpdihcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3XCIpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IHZpZXc7XG4gICAgY29uc3QgZmlyc3RQcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlci5sZW5ndGggPiAwID8gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5T3JkZXJbMF0pIDogbnVsbDtcbiAgICBpZiAoZmlyc3RQcm9wZXJ0eUlkKSB7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgoZmlyc3RQcm9wZXJ0eUlkLCAwKTtcbiAgICAgIHZpZXcuc3R5bGUuc2V0UHJvcGVydHkoXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLCBgJHt3aWR0aH1weGApO1xuICAgIH1cblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIGNvbnN0IHRoZWFkID0gdGFibGUuY3JlYXRlVEhlYWQoKTtcbiAgICBjb25zdCBoZWFkZXJSb3cgPSB0aGVhZC5jcmVhdGVFbChcInRyXCIpO1xuXG4gICAgcHJvcGVydHlPcmRlci5mb3JFYWNoKChwcm9wZXJ0eUlkLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJvcGVydHlLZXkgPSB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgIGNvbnN0IGNvbCA9IGNvbGdyb3VwLmNyZWF0ZUVsKFwiY29sXCIpO1xuICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLnN0eWxlLm1heFdpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgY29sLmRhdGFzZXQucHJvcGVydHlJZCA9IHByb3BlcnR5S2V5O1xuICAgICAgdGhpcy5jb2x1bW5FbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGNvbCk7XG5cbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlclJvdy5jcmVhdGVFbChcInRoXCIsIHsgdGV4dDogbmFtZSB9KTtcbiAgICAgIGhlYWRlci5kYXRhc2V0LnByb3BlcnR5SWQgPSBwcm9wZXJ0eUtleTtcbiAgICAgIGhlYWRlci5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5taW5XaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgIGhlYWRlci5kcmFnZ2FibGUgPSB0cnVlO1xuICAgICAgdGhpcy5oZWFkZXJFbGVtZW50cy5zZXQocHJvcGVydHlLZXksIGhlYWRlcik7XG5cbiAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ3N0YXJ0XCIsIChldmVudCkgPT5cbiAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdTdGFydChldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICApO1xuICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnb3ZlclwiLCAoZXZlbnQpID0+XG4gICAgICAgIHRoaXMub25Db2x1bW5EcmFnT3ZlcihldmVudCwgcHJvcGVydHlLZXkpXG4gICAgICApO1xuICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcm9wXCIsIChldmVudCkgPT5cbiAgICAgICAgdGhpcy5vbkNvbHVtbkRyb3AoZXZlbnQsIHByb3BlcnR5S2V5KVxuICAgICAgKTtcbiAgICAgIGhlYWRlci5hZGRFdmVudExpc3RlbmVyKFwiZHJhZ2xlYXZlXCIsICgpID0+IHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkpO1xuICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnZW5kXCIsIHRoaXMub25Db2x1bW5EcmFnRW5kKTtcblxuICAgICAgY29uc3QgaGFuZGxlID0gaGVhZGVyLmNyZWF0ZVNwYW4oe1xuICAgICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJlc2l6ZS1oYW5kbGVcIixcbiAgICAgIH0pO1xuICAgICAgaGFuZGxlLnNldEF0dHIoXCJkcmFnZ2FibGVcIiwgXCJmYWxzZVwiKTtcbiAgICAgIGhhbmRsZS5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcmRvd25cIiwgKGV2ZW50KSA9PlxuICAgICAgICB0aGlzLnN0YXJ0Q29sdW1uUmVzaXplKGV2ZW50LCBwcm9wZXJ0eUtleSwgaW5kZXgpXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdGJvZHkgPSB0YWJsZS5jcmVhdGVUQm9keSgpO1xuICAgIGNvbnN0IGhhc1Zpc2libGVHcm91cGluZyA9IHRoaXMuZGF0YS5ncm91cGVkRGF0YS5sZW5ndGggPiAxO1xuXG4gICAgZm9yIChjb25zdCBncm91cCBvZiB0aGlzLmRhdGEuZ3JvdXBlZERhdGEpIHtcbiAgICAgIGNvbnN0IGVudHJpZXMgPSBncm91cC5lbnRyaWVzO1xuICAgICAgaWYgKCFlbnRyaWVzLmxlbmd0aCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGhhc1Zpc2libGVHcm91cGluZykge1xuICAgICAgICBjb25zdCBncm91cFJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIgfSk7XG4gICAgICAgIGNvbnN0IGtleVZhbHVlID0gZ3JvdXAua2V5Py50b1N0cmluZygpID8/IFwiVW5ncm91cGVkXCI7XG4gICAgICAgIGNvbnN0IGdyb3VwQ2VsbCA9IGdyb3VwUm93LmNyZWF0ZUVsKFwidGRcIiwge1xuICAgICAgICAgIHRleHQ6IGtleVZhbHVlLFxuICAgICAgICB9KTtcbiAgICAgICAgZ3JvdXBDZWxsLmNvbFNwYW4gPSBwcm9wZXJ0eU9yZGVyLmxlbmd0aDtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICAgIGNvbnN0IHJvdyA9IHRib2R5LmNyZWF0ZUVsKFwidHJcIik7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9wZXJ0eU9yZGVyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICAgIGNvbnN0IHByb3BlcnR5SWQgPSBwcm9wZXJ0eU9yZGVyW2luZGV4XTtcbiAgICAgICAgICBjb25zdCBwcm9wZXJ0eUtleSA9IHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKTtcbiAgICAgICAgICBjb25zdCB3aWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlLZXksIGluZGV4KTtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuICAgICAgICAgIGNlbGwuZGF0YXNldC5wcm9wZXJ0eUlkID0gcHJvcGVydHlLZXk7XG4gICAgICAgICAgY2VsbC5zdHlsZS53aWR0aCA9IGAke3dpZHRofXB4YDtcbiAgICAgICAgICBjZWxsLnN0eWxlLm1pbldpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgICAgIGNlbGwuc3R5bGUubWF4V2lkdGggPSBgJHt3aWR0aH1weGA7XG5cbiAgICAgICAgICBpZiAocGFyc2VkLnR5cGUgPT09IFwiZmlsZVwiICYmIHBhcnNlZC5uYW1lID09PSBcIm5hbWVcIikge1xuICAgICAgICAgICAgY29uc3QgbGluayA9IGNlbGwuY3JlYXRlRWwoXCJhXCIsIHtcbiAgICAgICAgICAgICAgdGV4dDogZW50cnkuZmlsZS5uYW1lLFxuICAgICAgICAgICAgICBocmVmOiBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxpbmsuYWRkQ2xhc3MoXCJpbnRlcm5hbC1saW5rXCIpO1xuICAgICAgICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIGlmIChldmVudC5idXR0b24gIT09IDAgJiYgZXZlbnQuYnV0dG9uICE9PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgY29uc3QgcGFuZSA9IEtleW1hcC5pc01vZEV2ZW50KGV2ZW50KTtcbiAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgICBpZiAocGFuZSA9PT0gdHJ1ZSB8fCBwYW5lID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQoXG4gICAgICAgICAgICAgICAgICBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgICAgICAgQm9vbGVhbihwYW5lKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICAgICAgICBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgICAgICBwYW5lIGFzIFBhbmVUeXBlXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlb3ZlclwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS50cmlnZ2VyKFwiaG92ZXItbGlua1wiLCB7XG4gICAgICAgICAgICAgICAgZXZlbnQsXG4gICAgICAgICAgICAgICAgc291cmNlOiBcImJhc2VzXCIsXG4gICAgICAgICAgICAgICAgaG92ZXJQYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgICAgICAgdGFyZ2V0RWw6IGxpbmssXG4gICAgICAgICAgICAgICAgbGlua3RleHQ6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHZhbHVlID0gZW50cnkuZ2V0VmFsdWUocHJvcGVydHlJZCk7XG4gICAgICAgICAgY29uc3QgdGV4dFZhbHVlID0gdmFsdWUgPyB2YWx1ZS50b1N0cmluZygpIDogXCJcIjtcbiAgICAgICAgICBjZWxsLmNyZWF0ZVNwYW4oeyB0ZXh0OiB0ZXh0VmFsdWUgfSk7XG4gICAgICAgICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgICAgICAgY2VsbC50aXRsZSA9IHRleHRWYWx1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldFByb3BlcnR5SWQocHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkKTogc3RyaW5nIHtcbiAgICByZXR1cm4gU3RyaW5nKHByb3BlcnR5SWQpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiBNYXRoLm1heChcbiAgICAgIE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLFxuICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NaW5XaWR0aFB4LFxuICAgICAgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFhcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRTYXZlZENvbHVtbldpZHRocygpOiBNYXA8c3RyaW5nLCBudW1iZXI+IHtcbiAgICBjb25zdCBzYXZlZCA9IHRoaXMuY29uZmlnLmdldChDT0xVTU5fV0lEVEhTX0NPTkZJR19LRVkpO1xuICAgIGNvbnN0IG1hcHBlZCA9IG5ldyBNYXA8c3RyaW5nLCBudW1iZXI+KCk7XG5cbiAgICBpZiAoXG4gICAgICBzYXZlZCAmJlxuICAgICAgdHlwZW9mIHNhdmVkID09PSBcIm9iamVjdFwiICYmXG4gICAgICAhQXJyYXkuaXNBcnJheShzYXZlZClcbiAgICApIHtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHNhdmVkKSkge1xuICAgICAgICBjb25zdCB3aWR0aCA9IE51bWJlcih2YWx1ZSk7XG4gICAgICAgIGlmIChOdW1iZXIuaXNGaW5pdGUod2lkdGgpKSB7XG4gICAgICAgICAgbWFwcGVkLnNldChrZXksIHdpZHRoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWFwcGVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzeW5jQ29sdW1uV2lkdGhzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IHRoaXMuZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTtcbiAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5jbGVhcigpO1xuICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGxvYWRlZC5lbnRyaWVzKCkpIHtcbiAgICAgIHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLnNldChrZXksIHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGdldENvbHVtbldpZHRoKFxuICAgIHByb3BlcnR5SWQ6IHN0cmluZyxcbiAgICBpbmRleDogbnVtYmVyXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgZmFsbGJhY2tEZWZhdWx0ID0gaW5kZXggPT09IDBcbiAgICAgID8gdGhpcy5nZXREZWZhdWx0Rmlyc3RDb2x1bW5XaWR0aCgpXG4gICAgICA6IERFRkFVTFRfQ09MVU1OX1dJRFRIX1BYO1xuICAgIGNvbnN0IGNvbmZpZ3VyZWQgPSB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5nZXQocHJvcGVydHlJZCk7XG4gICAgY29uc3Qgd2lkdGggPSB0eXBlb2YgY29uZmlndXJlZCA9PT0gXCJudW1iZXJcIiA/IGNvbmZpZ3VyZWQgOiBmYWxsYmFja0RlZmF1bHQ7XG4gICAgcmV0dXJuIHRoaXMuY2xhbXBDb2x1bW5XaWR0aCh3aWR0aCwgaW5kZXggPT09IDApO1xuICB9XG5cbiAgcHJpdmF0ZSBjbGFtcENvbHVtbldpZHRoKHdpZHRoOiBudW1iZXIsIGlzRmlyc3RDb2x1bW4gPSBmYWxzZSk6IG51bWJlciB7XG4gICAgY29uc3Qgbm9ybWFsaXplZCA9IE1hdGgubWF4KHdpZHRoLCBNSU5fUkVTSVpBQkxFX0NPTFVNTl9XSURUSF9QWCk7XG4gICAgaWYgKCFpc0ZpcnN0Q29sdW1uKSB7XG4gICAgICByZXR1cm4gbm9ybWFsaXplZDtcbiAgICB9XG5cbiAgICBjb25zdCBzZXR0aW5ncyA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IG1pbiA9IE1hdGgubWF4KE1JTl9SRVNJWkFCTEVfQ09MVU1OX1dJRFRIX1BYLCBzZXR0aW5ncy5maXJzdENvbHVtbk1pbldpZHRoUHgpO1xuICAgIGNvbnN0IG1heCA9IE1hdGgubWF4KG1pbiwgc2V0dGluZ3MuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KTtcbiAgICByZXR1cm4gTWF0aC5taW4oTWF0aC5tYXgobm9ybWFsaXplZCwgbWluKSwgbWF4KTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDb2x1bW5XaWR0aChwcm9wZXJ0eUlkOiBzdHJpbmcsIHdpZHRoOiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBpc0ZpcnN0Q29sdW1uID0gdGhpcy5jdXJyZW50UHJvcGVydHlPcmRlclswXSA9PT0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBub3JtYWxpemVkID0gdGhpcy5jbGFtcENvbHVtbldpZHRoKHdpZHRoLCBpc0ZpcnN0Q29sdW1uKTtcbiAgICBjb25zdCBjb2x1bW4gPSB0aGlzLmNvbHVtbkVsZW1lbnRzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBpZiAoY29sdW1uKSB7XG4gICAgICBjb2x1bW4uc3R5bGUud2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGNvbHVtbi5zdHlsZS5taW5XaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgICAgY29sdW1uLnN0eWxlLm1heFdpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgfVxuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5oZWFkZXJFbGVtZW50cy5nZXQocHJvcGVydHlJZCk7XG4gICAgaWYgKGhlYWRlcikge1xuICAgICAgaGVhZGVyLnN0eWxlLndpZHRoID0gYCR7bm9ybWFsaXplZH1weGA7XG4gICAgICBoZWFkZXIuc3R5bGUubWluV2lkdGggPSBgJHtub3JtYWxpemVkfXB4YDtcbiAgICAgIGhlYWRlci5zdHlsZS5tYXhXaWR0aCA9IGAke25vcm1hbGl6ZWR9cHhgO1xuICAgIH1cblxuICAgIGlmIChpc0ZpcnN0Q29sdW1uICYmIHRoaXMuYWN0aXZlVmlldykge1xuICAgICAgdGhpcy5hY3RpdmVWaWV3LnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgICBcIi0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoXCIsXG4gICAgICAgIGAke25vcm1hbGl6ZWR9cHhgXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdENvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBzZXJpYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZW50cmllcygpKSB7XG4gICAgICBzZXJpYWxpemVkW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5jb25maWcuc2V0KENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSwgc2VyaWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIHBlcnNpc3RDb2x1bW5PcmRlcihvcmRlcjogQmFzZXNQcm9wZXJ0eUlkW10pIHtcbiAgICB0aGlzLmNvbmZpZy5zZXQoXG4gICAgICBEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSxcbiAgICAgIG9yZGVyLm1hcCgocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHNhZmVBdHRyaWJ1dGVWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCkge1xuICAgIHRoaXMucm9vdFxuICAgICAgLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KFwiLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoW2RhdGEtZHJhZy10YXJnZXRdXCIpXG4gICAgICAuZm9yRWFjaCgoaGVhZGVyQ2VsbCkgPT4ge1xuICAgICAgICBoZWFkZXJDZWxsLnJlbW92ZUF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIik7XG4gICAgICB9KTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdTdGFydChldmVudDogRHJhZ0V2ZW50LCBwcm9wZXJ0eUlkOiBzdHJpbmcpIHtcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5lZmZlY3RBbGxvd2VkID0gXCJtb3ZlXCI7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuc2V0RGF0YShcInRleHQvcGxhaW5cIiwgcHJvcGVydHlJZCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyYWdPdmVyKGV2ZW50OiBEcmFnRXZlbnQsIHByb3BlcnR5SWQ6IHN0cmluZykge1xuICAgIGlmICghdGhpcy5kcmFnZ2luZ0NvbHVtbiB8fCB0aGlzLmRyYWdnaW5nQ29sdW1uID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKTtcbiAgICB0aGlzLmFjdGl2ZURyYWdUYXJnZXQgPSBwcm9wZXJ0eUlkO1xuICAgIGNvbnN0IGhlYWRlckNlbGwgPSB0aGlzLnJvb3QucXVlcnlTZWxlY3RvcjxIVE1MRWxlbWVudD4oXG4gICAgICBgdGhbZGF0YS1wcm9wZXJ0eS1pZD1cIiR7dGhpcy5zYWZlQXR0cmlidXRlVmFsdWUocHJvcGVydHlJZCl9XCJdYFxuICAgICk7XG4gICAgaWYgKGhlYWRlckNlbGwpIHtcbiAgICAgIGhlYWRlckNlbGwuc2V0QXR0cmlidXRlKFwiZGF0YS1kcmFnLXRhcmdldFwiLCBcInRydWVcIik7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBvbkNvbHVtbkRyb3AoZXZlbnQ6IERyYWdFdmVudCwgdGFyZ2V0UHJvcGVydHlJZDogc3RyaW5nKSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoIXRoaXMuZHJhZ2dpbmdDb2x1bW4gfHwgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9PT0gdGFyZ2V0UHJvcGVydHlJZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IG9yZGVyID0gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgICBjb25zdCBzb3VyY2VJbmRleCA9IG9yZGVyLmZpbmRJbmRleCgocHJvcGVydHlJZCkgPT5cbiAgICAgIHRoaXMuZ2V0UHJvcGVydHlJZChwcm9wZXJ0eUlkKSA9PT0gdGhpcy5kcmFnZ2luZ0NvbHVtblxuICAgICk7XG4gICAgY29uc3QgdGFyZ2V0SW5kZXggPSBvcmRlci5maW5kSW5kZXgoXG4gICAgICAocHJvcGVydHlJZCkgPT4gdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpID09PSB0YXJnZXRQcm9wZXJ0eUlkXG4gICAgKTtcbiAgICBpZiAoc291cmNlSW5kZXggPT09IC0xIHx8IHRhcmdldEluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9yZGVyLnNwbGljZShzb3VyY2VJbmRleCwgMSk7XG4gICAgb3JkZXIuc3BsaWNlKHRhcmdldEluZGV4LCAwLCB0aGlzLmRyYWdnaW5nQ29sdW1uIGFzIEJhc2VzUHJvcGVydHlJZCk7XG4gICAgdGhpcy5wZXJzaXN0Q29sdW1uT3JkZXIob3JkZXIpO1xuICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5EcmFnRW5kID0gKCkgPT4ge1xuICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBudWxsO1xuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBnZXRDdXJyZW50Q29sdW1uT3JkZXIoKTogQmFzZXNQcm9wZXJ0eUlkW10ge1xuICAgIGNvbnN0IGV4cGxpY2l0T3JkZXIgPSB0aGlzLmNvbmZpZy5nZXQoRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVkpO1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV4cGxpY2l0T3JkZXIpKSB7XG4gICAgICBjb25zdCBhdmFpbGFibGUgPSBuZXcgU2V0KHRoaXMuZGF0YS5wcm9wZXJ0aWVzLm1hcCgocHJvcGVydHlJZCkgPT5cbiAgICAgICAgdGhpcy5nZXRQcm9wZXJ0eUlkKHByb3BlcnR5SWQpXG4gICAgICApKTtcbiAgICAgIGNvbnN0IHNlZW4gPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGNvbnN0IG5vcm1hbGl6ZWQgPSBleHBsaWNpdE9yZGVyXG4gICAgICAgIC5tYXAoKHZhbHVlKSA9PlxuICAgICAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gXCJzdHJpbmdcIiA/ICh2YWx1ZSBhcyBCYXNlc1Byb3BlcnR5SWQpIDogbnVsbFxuICAgICAgICApXG4gICAgICAgIC5maWx0ZXIoXG4gICAgICAgICAgKHZhbHVlKTogdmFsdWUgaXMgQmFzZXNQcm9wZXJ0eUlkID0+XG4gICAgICAgICAgICB2YWx1ZSAhPT0gbnVsbCAmJlxuICAgICAgICAgICAgYXZhaWxhYmxlLmhhcyh0aGlzLmdldFByb3BlcnR5SWQodmFsdWUpKSAmJlxuICAgICAgICAgICAgKHNlZW4uaGFzKHRoaXMuZ2V0UHJvcGVydHlJZCh2YWx1ZSkpID8gZmFsc2UgOiAoc2Vlbi5hZGQodGhpcy5nZXRQcm9wZXJ0eUlkKHZhbHVlKSksIHRydWUpKVxuICAgICAgICApO1xuXG4gICAgICBpZiAobm9ybWFsaXplZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IG5vcm1hbGl6ZWRTZXQgPSBuZXcgU2V0KFxuICAgICAgICAgIG5vcm1hbGl6ZWQubWFwKChwcm9wZXJ0eUlkKSA9PiB0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IG1pc3NpbmcgPSB0aGlzLmRhdGEucHJvcGVydGllcy5maWx0ZXIoXG4gICAgICAgICAgKHByb3BlcnR5SWQpID0+ICFub3JtYWxpemVkU2V0Lmhhcyh0aGlzLmdldFByb3BlcnR5SWQocHJvcGVydHlJZCkpXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBbLi4ubm9ybWFsaXplZCwgLi4ubWlzc2luZ107XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZXhwbGljaXRPcmRlckZyb21BcGkgPSB0aGlzLmNvbmZpZy5nZXRPcmRlcigpO1xuICAgIGlmIChleHBsaWNpdE9yZGVyRnJvbUFwaS5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZXhwbGljaXRPcmRlckZyb21BcGk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wcm9wZXJ0aWVzO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm9wZXJ0eU9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgfVxufVxuXG5jbGFzcyBIb3RmaXhlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luO1xuICBwcml2YXRlIG1pbldpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXhXaWR0aElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYmFja2dyb3VuZElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgekluZGV4SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRTZWN0aW9uRW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMubWluV2lkdGhJbnB1dCkgdGhpcy5taW5XaWR0aElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5tYXhXaWR0aElucHV0KSB0aGlzLm1heFdpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmJhY2tncm91bmRJbnB1dCkgdGhpcy5iYWNrZ3JvdW5kSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLnpJbmRleElucHV0KSB0aGlzLnpJbmRleElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk9ic2lkaWFuIEhvdGZpeGVzXCIgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBcIkJhc2VzOiBGcm96ZW4gZmlyc3QgY29sdW1uXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGN1c3RvbSBmcm96ZW4gdGFibGUgdmlld1wiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiVXNlIGEgY3VzdG9tIEJhc2VzIHZpZXcgd2l0aCBhIHN0aWNreSBmaXJzdCBjb2x1bW4gaW5zdGVhZCBvZiBvdmVybGF5IGhhY2tzLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBlbmFibGVkOiB2YWx1ZSB9KTtcbiAgICAgICAgICB0aGlzLnNldFNlY3Rpb25FbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtaW5pbXVtIHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiTWluaW11bSB3aWR0aCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWluV2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWluV2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1pbldpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0IGNvbHVtbiBtYXggd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJDYXAgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4gd2lkdGguXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm1heFdpZHRoSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS5maXJzdENvbHVtbk1heFdpZHRoUHgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkgfHwgcGFyc2VkIDwgODApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBwYXJzZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJCYWNrZ3JvdW5kXCIpXG4gICAgICAuc2V0RGVzYyhcIkJhY2tncm91bmQgdXNlZCBiZWhpbmQgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcIlN0YWNraW5nIG9yZGVyIGZvciB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjRcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFwiRHJhdyBhIGRpdmlkZXIgdG8gdGhlIHJpZ2h0IG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5zaG93RGl2aWRlcik7XG4gICAgICAgIHRvZ2dsZS5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHNob3dEaXZpZGVyOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQoc3RhdGUuZW5hYmxlZCk7XG4gIH1cbn1cbiJd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
