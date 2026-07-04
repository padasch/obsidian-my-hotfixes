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
var COLUMN_WIDTHS_CONFIG_KEY = "obsidian-hotfixes:column-widths";
var DEFAULT_SETTINGS = {
  freezeFirstColumn: {
    enabled: false,
    firstColumnMinWidthPx: 220,
    firstColumnMaxWidthPx: 320,
    backgroundColor: "var(--background-primary)",
    zIndex: 4,
    showDivider: true,
    columnWrapMode: "narrow"
  }
};
var MIN_COLUMN_WIDTH_PX = 60;
var DEFAULT_COLUMN_WIDTH_PX = 190;
var DRAGGABLE_ORDER_CONFIG_KEY = "order";
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
    this.settings.freezeFirstColumn = {
      ...DEFAULT_SETTINGS.freezeFirstColumn,
      ...loaded?.freezeFirstColumn ?? {}
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
    this.styleElement.textContent = `
.obsidian-hotfixes-frozen-bases-view {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
  --obsidian-hotfixes-first-column-width: var(--obsidian-hotfixes-first-column-min-width);
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
  table-layout: fixed;
  font-size: var(--font-ui-smaller);
  max-width: none;
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
  position: relative;
}

.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-frozen-bases-view th,
.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-frozen-bases-view td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.obsidian-hotfixes-wrap-large .obsidian-hotfixes-frozen-bases-view th,
.obsidian-hotfixes-wrap-large .obsidian-hotfixes-frozen-bases-view td {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
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

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th {
  background: var(--background-secondary);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th[data-drag-target="true"] {
  outline: 1px solid var(--interactive-accent);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  width: var(--obsidian-hotfixes-first-column-width);
  min-width: var(--obsidian-hotfixes-first-column-width);
  max-width: var(--obsidian-hotfixes-first-column-width);
  background: var(--obsidian-hotfixes-first-column-bg);
  z-index: var(--obsidian-hotfixes-first-column-z);
  border-right: ${config.showDivider ? "1px solid var(--background-modifier-border)" : "none"};
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table thead th:first-child {
  z-index: calc(var(--obsidian-hotfixes-first-column-z, 4) + 1);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-group-row td {
  background: var(--background-secondary);
  color: var(--text-muted);
  font-weight: 600;
  border-top: 1px solid var(--background-modifier-border);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell {
  cursor: text;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell textarea,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: inherit;
  color: inherit;
  background: var(--background-primary);
  border: 1px solid var(--interactive-accent);
  border-radius: 4px;
  padding: 4px 6px;
  min-height: 24px;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-empty {
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
    this.root = containerEl.createDiv(
      "obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-narrow"
    );
  }
  hoverPopover = null;
  root;
  currentPropertyOrder = [];
  resizedColumnStartWidth = 0;
  resizeStartX = 0;
  activeResizeColumn = null;
  activeResizeColumnIndex = null;
  activeResizeWidth = 0;
  draggingColumn = null;
  activeDragTarget = null;
  activeColumnWidths = /* @__PURE__ */ new Map();
  activeEditor = null;
  activeView = null;
  type = FROZEN_TABLE_VIEW_TYPE;
  onDataUpdated() {
    this.render();
  }
  getColumnWrapClass() {
    return this.plugin.settings.freezeFirstColumn.columnWrapMode === "large" ? "obsidian-hotfixes-wrap-large" : "obsidian-hotfixes-wrap-narrow";
  }
  getSavedColumnWidths() {
    const saved = this.config.get(COLUMN_WIDTHS_CONFIG_KEY);
    const mapped = /* @__PURE__ */ new Map();
    if (saved && typeof saved === "object" && !Array.isArray(saved)) {
      for (const [key, value] of Object.entries(saved)) {
        if (typeof value === "number" && Number.isFinite(value)) {
          mapped.set(key, value);
        }
      }
    }
    return mapped;
  }
  syncColumnWidths() {
    const loaded = this.getSavedColumnWidths();
    const configured = new Map(loaded);
    this.activeColumnWidths = configured;
  }
  clampWidth(width, isFirstColumn) {
    const min = isFirstColumn ? Math.max(
      MIN_COLUMN_WIDTH_PX,
      this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx
    ) : MIN_COLUMN_WIDTH_PX;
    const max = isFirstColumn ? Math.max(
      min,
      this.plugin.settings.freezeFirstColumn.firstColumnMaxWidthPx
    ) : 2e3;
    return Math.max(min, Math.min(width, max));
  }
  getColumnWidth(propertyId, index) {
    const configured = this.activeColumnWidths.get(propertyId);
    if (typeof configured === "number" && Number.isFinite(configured)) {
      return this.clampWidth(
        configured,
        index === 0 && this.currentPropertyOrder[index] === propertyId
      );
    }
    if (index === 0) {
      return this.clampWidth(
        this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,
        true
      );
    }
    return DEFAULT_COLUMN_WIDTH_PX;
  }
  persistColumnWidths() {
    const serialized = {};
    for (const [key, value] of this.activeColumnWidths.entries()) {
      serialized[key] = value;
    }
    this.config.set(COLUMN_WIDTHS_CONFIG_KEY, serialized);
  }
  safeAttributeValue(value) {
    return value.replace(/"/g, '\\"');
  }
  setFirstColumnWidth(width) {
    if (!this.activeView) {
      return;
    }
    this.activeView.style.setProperty(
      "--obsidian-hotfixes-first-column-width",
      `${width}px`
    );
  }
  applyColumnWidthStyle(propertyId, width) {
    const propertyValue = this.safeAttributeValue(propertyId);
    const selectors = `[data-property-id="${propertyValue}"]`;
    this.root.querySelectorAll(selectors).forEach((el) => {
      el.style.width = `${width}px`;
    });
    this.root.querySelectorAll(
      `col[data-property-id="${propertyValue}"]`
    ).forEach((col) => {
      col.style.width = `${width}px`;
    });
    const first = this.currentPropertyOrder[0];
    if (first === propertyId) {
      this.setFirstColumnWidth(width);
    }
  }
  beginResizeColumn(propertyId, index, event) {
    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.activeResizeColumn = propertyId;
    this.activeResizeColumnIndex = index;
    this.resizeStartX = event.clientX;
    this.resizedColumnStartWidth = this.getColumnWidth(propertyId, index);
    this.activeResizeWidth = this.resizedColumnStartWidth;
    document.addEventListener("pointermove", this.onResizePointerMove);
    document.addEventListener("pointerup", this.onResizePointerUp);
    document.body.style.cursor = "col-resize";
  }
  onResizePointerMove = (event) => {
    if (!this.activeResizeColumn || this.activeResizeColumnIndex === null) {
      return;
    }
    const delta = event.clientX - this.resizeStartX;
    const nextWidth = this.clampWidth(
      this.resizedColumnStartWidth + delta,
      this.activeResizeColumnIndex === 0
    );
    this.activeResizeWidth = nextWidth;
    this.activeColumnWidths.set(this.activeResizeColumn, nextWidth);
    this.applyColumnWidthStyle(this.activeResizeColumn, nextWidth);
  };
  onResizePointerUp = () => {
    if (!this.activeResizeColumn) {
      return;
    }
    if (Number.isFinite(this.activeResizeWidth)) {
      const isFirst = this.currentPropertyOrder[0] === this.activeResizeColumn;
      const clamped = this.clampWidth(this.activeResizeWidth, isFirst);
      this.activeColumnWidths.set(this.activeResizeColumn, clamped);
      this.applyColumnWidthStyle(this.activeResizeColumn, clamped);
      this.persistColumnWidths();
      this.render();
    }
    this.activeResizeColumn = null;
    this.activeResizeColumnIndex = null;
    this.activeResizeWidth = 0;
    this.resizeStartX = 0;
    this.resizedColumnStartWidth = 0;
    document.body.style.cursor = "";
    document.removeEventListener("pointermove", this.onResizePointerMove);
    document.removeEventListener("pointerup", this.onResizePointerUp);
  };
  clearDragTargetStyles() {
    if (!this.root) {
      return;
    }
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
    const sourceIndex = order.indexOf(this.draggingColumn);
    const targetIndex = order.indexOf(targetPropertyId);
    if (sourceIndex === -1 || targetIndex === -1) {
      this.draggingColumn = null;
      this.clearDragTargetStyles();
      return;
    }
    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, this.draggingColumn);
    this.config.set(DRAGGABLE_ORDER_CONFIG_KEY, order);
    this.draggingColumn = null;
    this.clearDragTargetStyles();
    this.render();
  }
  onColumnDragEnd = () => {
    this.draggingColumn = null;
    this.clearDragTargetStyles();
  };
  async beginEditNoteCell(cell, entry, propertyName, initialValue) {
    if (this.activeEditor) {
      return;
    }
    const previous = cell.innerText;
    const input = document.createElement("textarea");
    input.value = initialValue;
    input.rows = 1;
    const cancel = () => {
      this.activeEditor = null;
      this.render();
    };
    const commit = async () => {
      const nextValue = input.value;
      if (nextValue !== previous) {
        await this.plugin.app.fileManager.processFrontMatter(
          entry.file,
          (frontmatter) => {
            frontmatter[propertyName] = nextValue;
          }
        );
      }
      cancel();
    };
    this.activeEditor = input;
    cell.empty();
    cell.appendChild(input);
    input.focus();
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
    input.className = "obsidian-hotfixes-note-editor";
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });
    input.addEventListener("blur", () => {
      void commit();
    });
  }
  addCellValue(cell, entry, propertyId) {
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
    if (value) {
      const context = new import_obsidian.RenderContext();
      context.hoverPopover = this.hoverPopover;
      value.renderTo(cell, context);
      if (textValue) {
        cell.title = textValue;
      }
    } else if (textValue) {
      cell.createSpan({ text: textValue });
      cell.title = textValue;
    }
    if (parsed.type === "note") {
      cell.addClass("obsidian-hotfixes-note-cell");
      cell.addEventListener("dblclick", () => {
        void this.beginEditNoteCell(cell, entry, parsed.name, textValue);
      });
    }
  }
  getCurrentColumnOrder() {
    const explicitOrder = this.config.getOrder();
    if (explicitOrder.length > 0) {
      return explicitOrder;
    }
    return this.data.properties;
  }
  render() {
    this.root.empty();
    this.root.className = `obsidian-hotfixes-frozen-bases-root ${this.getColumnWrapClass()}`;
    this.clearDragTargetStyles();
    this.activeView = null;
    this.syncColumnWidths();
    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-empty",
        text: "Frozen table view is disabled. Turn it on in plugin settings."
      });
      return;
    }
    const propertyOrder = this.getCurrentColumnOrder();
    if (!propertyOrder.length) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-empty",
        text: "No properties available for this Base."
      });
      return;
    }
    this.currentPropertyOrder = propertyOrder;
    this.currentPropertyOrder.forEach((propertyId, index) => {
      const configuredWidth = this.getColumnWidth(propertyId, index);
      this.activeColumnWidths.set(propertyId, configuredWidth);
    });
    const firstColumnWidth = this.getColumnWidth(
      propertyOrder[0],
      this.currentPropertyOrder[0] === propertyOrder[0] ? 0 : 0
    );
    const view = this.root.createDiv("obsidian-hotfixes-frozen-bases-view");
    this.activeView = view;
    this.setFirstColumnWidth(firstColumnWidth);
    const table = view.createEl("table", { cls: "obsidian-hotfixes-table" });
    const colgroup = table.createEl("colgroup");
    propertyOrder.forEach((propertyId, index) => {
      const width = this.getColumnWidth(propertyId, index);
      colgroup.createEl("col", { attr: { "data-property-id": propertyId } }).setAttr("style", `width: ${width}px;`);
    });
    const thead = table.createTHead();
    const headerRow = thead.createEl("tr");
    for (let index = 0; index < propertyOrder.length; index++) {
      const propertyId = propertyOrder[index];
      const width = this.getColumnWidth(propertyId, index);
      const name = this.config.getDisplayName(propertyId);
      const headerCell = headerRow.createEl("th", { text: name });
      headerCell.setAttribute("data-property-id", propertyId);
      headerCell.style.width = `${width}px`;
      headerCell.draggable = true;
      headerCell.addEventListener(
        "dragstart",
        (event) => this.onColumnDragStart(event, propertyId)
      );
      headerCell.addEventListener(
        "dragover",
        (event) => this.onColumnDragOver(event, propertyId)
      );
      headerCell.addEventListener(
        "drop",
        (event) => this.onColumnDrop(event, propertyId)
      );
      headerCell.addEventListener(
        "dragleave",
        () => this.clearDragTargetStyles()
      );
      headerCell.addEventListener("dragend", this.onColumnDragEnd);
      const resizeHandle = headerCell.createEl("span", {
        cls: "obsidian-hotfixes-frozen-bases-resize-handle"
      });
      resizeHandle.addEventListener(
        "pointerdown",
        (event) => this.beginResizeColumn(propertyId, index, event)
      );
    }
    const tbody = table.createTBody();
    const hasVisibleGrouping = this.data.groupedData.length > 1;
    for (const group of this.data.groupedData) {
      const entries = group.entries;
      if (!entries.length) {
        continue;
      }
      if (hasVisibleGrouping) {
        const groupRow = tbody.createEl("tr", {
          cls: "obsidian-hotfixes-group-row"
        });
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
          const width = this.getColumnWidth(propertyId, index);
          const cell = row.createEl("td");
          cell.setAttribute("data-property-id", propertyId);
          cell.style.width = `${width}px`;
          this.addCellValue(cell, entry, propertyId);
        }
      }
    }
  }
};
var HotfixesSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  minWidthInput = null;
  maxWidthInput = null;
  backgroundInput = null;
  zIndexInput = null;
  wrapModeSelect = null;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  setSectionEnabled(enabled) {
    if (this.minWidthInput) this.minWidthInput.setDisabled(!enabled);
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
    if (this.backgroundInput) this.backgroundInput.setDisabled(!enabled);
    if (this.zIndexInput) this.zIndexInput.setDisabled(!enabled);
    if (this.wrapModeSelect) this.wrapModeSelect.disabled = !enabled;
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
    new import_obsidian.Setting(section).setName("Cell wrap mode").setDesc(
      "Choose how long values appear when they are wider than the column."
    ).addDropdown((dropdown) => {
      this.wrapModeSelect = dropdown.selectEl;
      dropdown.addOption("narrow", "Narrow (truncate)").addOption("large", "Large (wrap)").setValue(state.columnWrapMode).setDisabled(!state.enabled);
      dropdown.onChange(async (value) => {
        if (value !== "narrow" && value !== "large") {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({
          columnWrapMode: value
        });
      });
    });
    this.setSectionEnabled(state.enabled);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1Byb3BlcnR5SWQsXG4gIEJhc2VzVmlldyxcbiAgSG92ZXJQYXJlbnQsXG4gIEhvdmVyUG9wb3ZlcixcbiAgS2V5bWFwLFxuICBQYW5lVHlwZSxcbiAgUGx1Z2luLFxuICBQbHVnaW5TZXR0aW5nVGFiLFxuICBRdWVyeUNvbnRyb2xsZXIsXG4gIFJlbmRlckNvbnRleHQsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIHBhcnNlUHJvcGVydHlJZCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IFNUWUxFX0VMRU1FTlRfSUQgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLXJ1bnRpbWUtc3R5bGVzXCI7XG5jb25zdCBGUk9aRU5fVEFCTEVfVklFV19UWVBFID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tdGFibGVcIjtcbmNvbnN0IENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSA9IFwib2JzaWRpYW4taG90Zml4ZXM6Y29sdW1uLXdpZHRoc1wiO1xuXG50eXBlIENvbHVtbldyYXBNb2RlID0gXCJuYXJyb3dcIiB8IFwibGFyZ2VcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBmaXJzdENvbHVtbk1pbldpZHRoUHg6IG51bWJlcjtcbiAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBudW1iZXI7XG4gIGJhY2tncm91bmRDb2xvcjogc3RyaW5nO1xuICB6SW5kZXg6IG51bWJlcjtcbiAgc2hvd0RpdmlkZXI6IGJvb2xlYW47XG4gIGNvbHVtbldyYXBNb2RlOiBDb2x1bW5XcmFwTW9kZTtcbn1cblxuaW50ZXJmYWNlIEhvdGZpeFNldHRpbmdzIHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogMjIwLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMzIwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiA0LFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICAgIGNvbHVtbldyYXBNb2RlOiBcIm5hcnJvd1wiLFxuICB9LFxufTtcblxuY29uc3QgTUlOX0NPTFVNTl9XSURUSF9QWCA9IDYwO1xuY29uc3QgREVGQVVMVF9DT0xVTU5fV0lEVEhfUFggPSAxOTA7XG5jb25zdCBEUkFHR0FCTEVfT1JERVJfQ09ORklHX0tFWSA9IFwib3JkZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVnaXN0ZXJTZXR0aW5nVGFiKCk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZCA9IHRoaXMucmVnaXN0ZXJCYXNlc1ZpZXcoRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRSwge1xuICAgICAgbmFtZTogXCJGcm96ZW4gVGFibGVcIixcbiAgICAgIGljb246IFwibHVjaWRlLWxheW91dC1ncmlkXCIsXG4gICAgICBmYWN0b3J5OiAoY29udHJvbGxlciwgY29udGFpbmVyRWwpID0+XG4gICAgICAgIG5ldyBGcm96ZW5UYWJsZUJhc2VzVmlldyhjb250cm9sbGVyLCBjb250YWluZXJFbCwgdGhpcyksXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVN0eWxlcygpIHtcbiAgICBpZiAoIXRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LmlkID0gU1RZTEVfRUxFTUVOVF9JRDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3QgbWluV2lkdGggPSBNYXRoLm1heCg4MCwgY29uZmlnLmZpcnN0Q29sdW1uTWluV2lkdGhQeCk7XG4gICAgY29uc3QgbWF4V2lkdGggPSBNYXRoLm1heChtaW5XaWR0aCwgY29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCk7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aDogJHttaW5XaWR0aH1weDtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoOiAke21heFdpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aCk7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16OiAke2NvbmZpZy56SW5kZXh9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3Qge1xuICBvdmVyZmxvdy14OiBhdXRvO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXItY29sbGFwc2U6IHNlcGFyYXRlO1xuICBib3JkZXItc3BhY2luZzogMDtcbiAgdGFibGUtbGF5b3V0OiBmaXhlZDtcbiAgZm9udC1zaXplOiB2YXIoLS1mb250LXVpLXNtYWxsZXIpO1xuICBtYXgtd2lkdGg6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhlYWQgdGgge1xuICBmb250LXdlaWdodDogNjAwO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIHRvcDogMDtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQge1xuICBwYWRkaW5nOiA4cHggMTBweDtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgYm9yZGVyLXJpZ2h0OiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLW5hcnJvdyAub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXZpZXcgdGgsXG4ub2JzaWRpYW4taG90Zml4ZXMtd3JhcC1uYXJyb3cgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHRkIHtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLWxhcmdlIC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB0aCxcbi5vYnNpZGlhbi1ob3RmaXhlcy13cmFwLWxhcmdlIC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlldyB0ZCB7XG4gIHdoaXRlLXNwYWNlOiBub3JtYWw7XG4gIG92ZXJmbG93LXdyYXA6IGFueXdoZXJlO1xuICB3b3JkLWJyZWFrOiBicmVhay13b3JkO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yZXNpemUtaGFuZGxlIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIHJpZ2h0OiAwO1xuICB3aWR0aDogMTBweDtcbiAgaGVpZ2h0OiAxMDAlO1xuICBjdXJzb3I6IGNvbC1yZXNpemU7XG4gIHotaW5kZXg6IDI7XG4gIHRvdWNoLWFjdGlvbjogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZTo6YWZ0ZXIge1xuICBjb250ZW50OiBcIlwiO1xuICBkaXNwbGF5OiBibG9jaztcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBsZWZ0OiA1MCU7XG4gIHRvcDogMDtcbiAgd2lkdGg6IDFweDtcbiAgaGVpZ2h0OiAxMDAlO1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGgge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhbZGF0YS1kcmFnLXRhcmdldD1cInRydWVcIl0ge1xuICBvdXRsaW5lOiAxcHggc29saWQgdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aDpmaXJzdC1jaGlsZCxcbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGQ6Zmlyc3QtY2hpbGQge1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAwO1xuICB3aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXdpZHRoKTtcbiAgbWluLXdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4td2lkdGgpO1xuICBtYXgtd2lkdGg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aCk7XG4gIGJhY2tncm91bmQ6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1iZyk7XG4gIHotaW5kZXg6IHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16KTtcbiAgYm9yZGVyLXJpZ2h0OiAke2NvbmZpZy5zaG93RGl2aWRlciA/IFwiMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKVwiIDogXCJub25lXCJ9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoZWFkIHRoOmZpcnN0LWNoaWxkIHtcbiAgei1pbmRleDogY2FsYyh2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4teiwgNCkgKyAxKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1ncm91cC1yb3cgdGQge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwge1xuICBjdXJzb3I6IHRleHQ7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtbm90ZS1jZWxsIHRleHRhcmVhLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy1ub3RlLWNlbGwgaW5wdXQge1xuICB3aWR0aDogMTAwJTtcbiAgYm94LXNpemluZzogYm9yZGVyLWJveDtcbiAgZm9udDogaW5oZXJpdDtcbiAgZm9udC1zaXplOiBpbmhlcml0O1xuICBjb2xvcjogaW5oZXJpdDtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KTtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0taW50ZXJhY3RpdmUtYWNjZW50KTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBwYWRkaW5nOiA0cHggNnB4O1xuICBtaW4taGVpZ2h0OiAyNHB4O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWVtcHR5IHtcbiAgY29sb3I6IHZhcigtLXRleHQtbXV0ZWQpO1xuICBwYWRkaW5nOiAwLjc1cmVtIDAuNXJlbTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbiB7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbiAgYm9yZGVyLXJhZGl1czogOHB4O1xuICBtYXJnaW4tdG9wOiAwLjVyZW07XG4gIHBhZGRpbmc6IDAuNXJlbSAwLjc1cmVtO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uIHN1bW1hcnkge1xuICBjdXJzb3I6IHBvaW50ZXI7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIHVzZXItc2VsZWN0OiBub25lO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnQge1xuICBkaXNwbGF5OiBncmlkO1xuICBnYXA6IDAuNzVyZW07XG4gIG1hcmdpbi10b3A6IDAuNzVyZW07XG59XG5gLnRyaW0oKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpIHtcbiAgICB0aGlzLmFwcC53b3Jrc3BhY2UuaXRlcmF0ZUFsbExlYXZlcygobGVhZikgPT4ge1xuICAgICAgY29uc3QgdmlldyA9IGxlYWYudmlldztcbiAgICAgIGlmICh2aWV3IGluc3RhbmNlb2YgRnJvemVuVGFibGVCYXNlc1ZpZXcpIHtcbiAgICAgICAgdmlldy5vbkRhdGFVcGRhdGVkKCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVGcmVlemVGaXJzdENvbHVtbihcbiAgICB1cGRhdGVzOiBQYXJ0aWFsPEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M+XG4gICkge1xuICAgIHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4gPSB7XG4gICAgICAuLi50aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLFxuICAgICAgLi4udXBkYXRlcyxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gIH1cbn1cblxuY2xhc3MgRnJvemVuVGFibGVCYXNlc1ZpZXcgZXh0ZW5kcyBCYXNlc1ZpZXcgaW1wbGVtZW50cyBIb3ZlclBhcmVudCB7XG4gIGhvdmVyUG9wb3ZlcjogSG92ZXJQb3BvdmVyIHwgbnVsbCA9IG51bGw7XG5cbiAgcHJpdmF0ZSByZWFkb25seSByb290OiBIVE1MRGl2RWxlbWVudDtcbiAgcHJpdmF0ZSBjdXJyZW50UHJvcGVydHlPcmRlcjogQmFzZXNQcm9wZXJ0eUlkW10gPSBbXTtcbiAgcHJpdmF0ZSByZXNpemVkQ29sdW1uU3RhcnRXaWR0aCA9IDA7XG4gIHByaXZhdGUgcmVzaXplU3RhcnRYID0gMDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVDb2x1bW46IEJhc2VzUHJvcGVydHlJZCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4OiBudW1iZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBhY3RpdmVSZXNpemVXaWR0aCA9IDA7XG4gIHByaXZhdGUgZHJhZ2dpbmdDb2x1bW46IEJhc2VzUHJvcGVydHlJZCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZURyYWdUYXJnZXQ6IEJhc2VzUHJvcGVydHlJZCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZUNvbHVtbldpZHRocyA9IG5ldyBNYXA8QmFzZXNQcm9wZXJ0eUlkLCBudW1iZXI+KCk7XG4gIHByaXZhdGUgYWN0aXZlRWRpdG9yOiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGFjdGl2ZVZpZXc6IEhUTUxEaXZFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY29udHJvbGxlcjogUXVlcnlDb250cm9sbGVyLFxuICAgIGNvbnRhaW5lckVsOiBIVE1MRWxlbWVudCxcbiAgICBwcml2YXRlIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpblxuICApIHtcbiAgICBzdXBlcihjb250cm9sbGVyKTtcbiAgICB0aGlzLnJvb3QgPSBjb250YWluZXJFbC5jcmVhdGVEaXYoXG4gICAgICBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IG9ic2lkaWFuLWhvdGZpeGVzLXdyYXAtbmFycm93XCJcbiAgICApO1xuICB9XG5cbiAgcmVhZG9ubHkgdHlwZSA9IEZST1pFTl9UQUJMRV9WSUVXX1RZUEU7XG5cbiAgcHVibGljIG9uRGF0YVVwZGF0ZWQoKTogdm9pZCB7XG4gICAgdGhpcy5yZW5kZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q29sdW1uV3JhcENsYXNzKCkge1xuICAgIHJldHVybiB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5jb2x1bW5XcmFwTW9kZSA9PT0gXCJsYXJnZVwiXG4gICAgICA/IFwib2JzaWRpYW4taG90Zml4ZXMtd3JhcC1sYXJnZVwiXG4gICAgICA6IFwib2JzaWRpYW4taG90Zml4ZXMtd3JhcC1uYXJyb3dcIjtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTogTWFwPEJhc2VzUHJvcGVydHlJZCwgbnVtYmVyPiB7XG4gICAgY29uc3Qgc2F2ZWQgPSB0aGlzLmNvbmZpZy5nZXQoQ09MVU1OX1dJRFRIU19DT05GSUdfS0VZKTtcbiAgICBjb25zdCBtYXBwZWQgPSBuZXcgTWFwPEJhc2VzUHJvcGVydHlJZCwgbnVtYmVyPigpO1xuXG4gICAgaWYgKFxuICAgICAgc2F2ZWQgJiZcbiAgICAgIHR5cGVvZiBzYXZlZCA9PT0gXCJvYmplY3RcIiAmJlxuICAgICAgIUFycmF5LmlzQXJyYXkoc2F2ZWQpXG4gICAgKSB7XG4gICAgICBmb3IgKGNvbnN0IFtrZXksIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhzYXZlZCkpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJudW1iZXJcIiAmJiBOdW1iZXIuaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgICAgICAgbWFwcGVkLnNldChrZXkgYXMgQmFzZXNQcm9wZXJ0eUlkLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWFwcGVkO1xuICB9XG5cbiAgcHJpdmF0ZSBzeW5jQ29sdW1uV2lkdGhzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IHRoaXMuZ2V0U2F2ZWRDb2x1bW5XaWR0aHMoKTtcbiAgICBjb25zdCBjb25maWd1cmVkID0gbmV3IE1hcDxCYXNlc1Byb3BlcnR5SWQsIG51bWJlcj4obG9hZGVkKTtcbiAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocyA9IGNvbmZpZ3VyZWQ7XG4gIH1cblxuICBwcml2YXRlIGNsYW1wV2lkdGgod2lkdGg6IG51bWJlciwgaXNGaXJzdENvbHVtbjogYm9vbGVhbik6IG51bWJlciB7XG4gICAgY29uc3QgbWluID0gaXNGaXJzdENvbHVtblxuICAgICAgPyBNYXRoLm1heChcbiAgICAgICAgICBNSU5fQ09MVU1OX1dJRFRIX1BYLFxuICAgICAgICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmZpcnN0Q29sdW1uTWluV2lkdGhQeFxuICAgICAgICApXG4gICAgICA6IE1JTl9DT0xVTU5fV0lEVEhfUFg7XG4gICAgY29uc3QgbWF4ID0gaXNGaXJzdENvbHVtblxuICAgICAgPyBNYXRoLm1heChcbiAgICAgICAgICBtaW4sXG4gICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NYXhXaWR0aFB4XG4gICAgICAgIClcbiAgICAgIDogMjAwMDtcbiAgICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih3aWR0aCwgbWF4KSk7XG4gIH1cblxuICBwcml2YXRlIGdldENvbHVtbldpZHRoKHByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZCwgaW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gICAgY29uc3QgY29uZmlndXJlZCA9IHRoaXMuYWN0aXZlQ29sdW1uV2lkdGhzLmdldChwcm9wZXJ0eUlkKTtcbiAgICBpZiAodHlwZW9mIGNvbmZpZ3VyZWQgPT09IFwibnVtYmVyXCIgJiYgTnVtYmVyLmlzRmluaXRlKGNvbmZpZ3VyZWQpKSB7XG4gICAgICByZXR1cm4gdGhpcy5jbGFtcFdpZHRoKFxuICAgICAgICBjb25maWd1cmVkLFxuICAgICAgICBpbmRleCA9PT0gMCAmJlxuICAgICAgICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXJbaW5kZXhdID09PSBwcm9wZXJ0eUlkXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRoaXMuY2xhbXBXaWR0aChcbiAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZmlyc3RDb2x1bW5NaW5XaWR0aFB4LFxuICAgICAgICB0cnVlXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiBERUZBVUxUX0NPTFVNTl9XSURUSF9QWDtcbiAgfVxuXG4gIHByaXZhdGUgcGVyc2lzdENvbHVtbldpZHRocygpIHtcbiAgICBjb25zdCBzZXJpYWxpemVkOiBSZWNvcmQ8c3RyaW5nLCBudW1iZXI+ID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuZW50cmllcygpKSB7XG4gICAgICBzZXJpYWxpemVkW2tleV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgdGhpcy5jb25maWcuc2V0KENPTFVNTl9XSURUSFNfQ09ORklHX0tFWSwgc2VyaWFsaXplZCk7XG4gIH1cblxuICBwcml2YXRlIHNhZmVBdHRyaWJ1dGVWYWx1ZSh2YWx1ZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKTtcbiAgfVxuXG4gIHByaXZhdGUgc2V0Rmlyc3RDb2x1bW5XaWR0aCh3aWR0aDogbnVtYmVyKSB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZVZpZXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5hY3RpdmVWaWV3LnN0eWxlLnNldFByb3BlcnR5KFxuICAgICAgXCItLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi13aWR0aFwiLFxuICAgICAgYCR7d2lkdGh9cHhgXG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlDb2x1bW5XaWR0aFN0eWxlKHByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZCwgd2lkdGg6IG51bWJlcikge1xuICAgIGNvbnN0IHByb3BlcnR5VmFsdWUgPSB0aGlzLnNhZmVBdHRyaWJ1dGVWYWx1ZShwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCBzZWxlY3RvcnMgPSBgW2RhdGEtcHJvcGVydHktaWQ9XCIke3Byb3BlcnR5VmFsdWV9XCJdYDtcbiAgICB0aGlzLnJvb3QucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oc2VsZWN0b3JzKS5mb3JFYWNoKChlbCkgPT4ge1xuICAgICAgZWwuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgfSk7XG4gICAgdGhpcy5yb290XG4gICAgICAucXVlcnlTZWxlY3RvckFsbDxIVE1MVGFibGVDb2xFbGVtZW50PihcbiAgICAgICAgYGNvbFtkYXRhLXByb3BlcnR5LWlkPVwiJHtwcm9wZXJ0eVZhbHVlfVwiXWBcbiAgICAgIClcbiAgICAgIC5mb3JFYWNoKChjb2wpID0+IHtcbiAgICAgICAgY29sLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBmaXJzdCA9IHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXJbMF07XG4gICAgaWYgKGZpcnN0ID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICB0aGlzLnNldEZpcnN0Q29sdW1uV2lkdGgod2lkdGgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgYmVnaW5SZXNpemVDb2x1bW4oXG4gICAgcHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkLFxuICAgIGluZGV4OiBudW1iZXIsXG4gICAgZXZlbnQ6IFBvaW50ZXJFdmVudFxuICApIHtcbiAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gcHJvcGVydHlJZDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gaW5kZXg7XG4gICAgdGhpcy5yZXNpemVTdGFydFggPSBldmVudC5jbGllbnRYO1xuICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aDtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcm1vdmVcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJNb3ZlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwicG9pbnRlcnVwXCIsIHRoaXMub25SZXNpemVQb2ludGVyVXApO1xuICAgIGRvY3VtZW50LmJvZHkuc3R5bGUuY3Vyc29yID0gXCJjb2wtcmVzaXplXCI7XG4gIH1cblxuICBwcml2YXRlIG9uUmVzaXplUG9pbnRlck1vdmUgPSAoZXZlbnQ6IFBvaW50ZXJFdmVudCkgPT4ge1xuICAgIGlmICghdGhpcy5hY3RpdmVSZXNpemVDb2x1bW4gfHwgdGhpcy5hY3RpdmVSZXNpemVDb2x1bW5JbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGRlbHRhID0gZXZlbnQuY2xpZW50WCAtIHRoaXMucmVzaXplU3RhcnRYO1xuICAgIGNvbnN0IG5leHRXaWR0aCA9IHRoaXMuY2xhbXBXaWR0aChcbiAgICAgIHRoaXMucmVzaXplZENvbHVtblN0YXJ0V2lkdGggKyBkZWx0YSxcbiAgICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uSW5kZXggPT09IDBcbiAgICApO1xuICAgIHRoaXMuYWN0aXZlUmVzaXplV2lkdGggPSBuZXh0V2lkdGg7XG4gICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCBuZXh0V2lkdGgpO1xuICAgIHRoaXMuYXBwbHlDb2x1bW5XaWR0aFN0eWxlKHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uLCBuZXh0V2lkdGgpO1xuICB9O1xuXG4gIHByaXZhdGUgb25SZXNpemVQb2ludGVyVXAgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChOdW1iZXIuaXNGaW5pdGUodGhpcy5hY3RpdmVSZXNpemVXaWR0aCkpIHtcbiAgICAgIGNvbnN0IGlzRmlyc3QgPSB0aGlzLmN1cnJlbnRQcm9wZXJ0eU9yZGVyWzBdID09PSB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbjtcbiAgICAgIGNvbnN0IGNsYW1wZWQgPSB0aGlzLmNsYW1wV2lkdGgodGhpcy5hY3RpdmVSZXNpemVXaWR0aCwgaXNGaXJzdCk7XG4gICAgICB0aGlzLmFjdGl2ZUNvbHVtbldpZHRocy5zZXQodGhpcy5hY3RpdmVSZXNpemVDb2x1bW4sIGNsYW1wZWQpO1xuICAgICAgdGhpcy5hcHBseUNvbHVtbldpZHRoU3R5bGUodGhpcy5hY3RpdmVSZXNpemVDb2x1bW4sIGNsYW1wZWQpO1xuICAgICAgdGhpcy5wZXJzaXN0Q29sdW1uV2lkdGhzKCk7XG4gICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH1cblxuICAgIHRoaXMuYWN0aXZlUmVzaXplQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZUNvbHVtbkluZGV4ID0gbnVsbDtcbiAgICB0aGlzLmFjdGl2ZVJlc2l6ZVdpZHRoID0gMDtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0WCA9IDA7XG4gICAgdGhpcy5yZXNpemVkQ29sdW1uU3RhcnRXaWR0aCA9IDA7XG4gICAgZG9jdW1lbnQuYm9keS5zdHlsZS5jdXJzb3IgPSBcIlwiO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVybW92ZVwiLCB0aGlzLm9uUmVzaXplUG9pbnRlck1vdmUpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJwb2ludGVydXBcIiwgdGhpcy5vblJlc2l6ZVBvaW50ZXJVcCk7XG4gIH07XG5cbiAgcHJpdmF0ZSBjbGVhckRyYWdUYXJnZXRTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnJvb3QpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5yb290XG4gICAgICAucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCIub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGhbZGF0YS1kcmFnLXRhcmdldF1cIilcbiAgICAgIC5mb3JFYWNoKChoZWFkZXJDZWxsKSA9PiB7XG4gICAgICAgIGhlYWRlckNlbGwucmVtb3ZlQXR0cmlidXRlKFwiZGF0YS1kcmFnLXRhcmdldFwiKTtcbiAgICAgIH0pO1xuICAgIHRoaXMuYWN0aXZlRHJhZ1RhcmdldCA9IG51bGw7XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50OiBEcmFnRXZlbnQsIHByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZCkge1xuICAgIGlmIChldmVudC5kYXRhVHJhbnNmZXIpIHtcbiAgICAgIHRoaXMuZHJhZ2dpbmdDb2x1bW4gPSBwcm9wZXJ0eUlkO1xuICAgICAgZXZlbnQuZGF0YVRyYW5zZmVyLmVmZmVjdEFsbG93ZWQgPSBcIm1vdmVcIjtcbiAgICAgIGV2ZW50LmRhdGFUcmFuc2Zlci5zZXREYXRhKFwidGV4dC9wbGFpblwiLCBwcm9wZXJ0eUlkKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ092ZXIoZXZlbnQ6IERyYWdFdmVudCwgcHJvcGVydHlJZDogQmFzZXNQcm9wZXJ0eUlkKSB7XG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nQ29sdW1uIHx8IHRoaXMuZHJhZ2dpbmdDb2x1bW4gPT09IHByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICBpZiAoZXZlbnQuZGF0YVRyYW5zZmVyKSB7XG4gICAgICBldmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xuICAgIH1cbiAgICBpZiAodGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID09PSBwcm9wZXJ0eUlkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuY2xlYXJEcmFnVGFyZ2V0U3R5bGVzKCk7XG4gICAgdGhpcy5hY3RpdmVEcmFnVGFyZ2V0ID0gcHJvcGVydHlJZDtcbiAgICBjb25zdCBoZWFkZXJDZWxsID0gdGhpcy5yb290LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgYHRoW2RhdGEtcHJvcGVydHktaWQ9XCIke3RoaXMuc2FmZUF0dHJpYnV0ZVZhbHVlKHByb3BlcnR5SWQpfVwiXWBcbiAgICApO1xuICAgIGlmIChoZWFkZXJDZWxsKSB7XG4gICAgICBoZWFkZXJDZWxsLnNldEF0dHJpYnV0ZShcImRhdGEtZHJhZy10YXJnZXRcIiwgXCJ0cnVlXCIpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgb25Db2x1bW5Ecm9wKGV2ZW50OiBEcmFnRXZlbnQsIHRhcmdldFByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgaWYgKCF0aGlzLmRyYWdnaW5nQ29sdW1uIHx8IHRoaXMuZHJhZ2dpbmdDb2x1bW4gPT09IHRhcmdldFByb3BlcnR5SWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvcmRlciA9IHRoaXMuZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk7XG4gICAgY29uc3Qgc291cmNlSW5kZXggPSBvcmRlci5pbmRleE9mKHRoaXMuZHJhZ2dpbmdDb2x1bW4pO1xuICAgIGNvbnN0IHRhcmdldEluZGV4ID0gb3JkZXIuaW5kZXhPZih0YXJnZXRQcm9wZXJ0eUlkKTtcbiAgICBpZiAoc291cmNlSW5kZXggPT09IC0xIHx8IHRhcmdldEluZGV4ID09PSAtMSkge1xuICAgICAgdGhpcy5kcmFnZ2luZ0NvbHVtbiA9IG51bGw7XG4gICAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIG9yZGVyLnNwbGljZShzb3VyY2VJbmRleCwgMSk7XG4gICAgb3JkZXIuc3BsaWNlKHRhcmdldEluZGV4LCAwLCB0aGlzLmRyYWdnaW5nQ29sdW1uKTtcbiAgICB0aGlzLmNvbmZpZy5zZXQoRFJBR0dBQkxFX09SREVSX0NPTkZJR19LRVksIG9yZGVyKTtcbiAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMucmVuZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIG9uQ29sdW1uRHJhZ0VuZCA9ICgpID0+IHtcbiAgICB0aGlzLmRyYWdnaW5nQ29sdW1uID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICB9O1xuXG4gIHByaXZhdGUgYXN5bmMgYmVnaW5FZGl0Tm90ZUNlbGwoXG4gICAgY2VsbDogSFRNTFRhYmxlQ2VsbEVsZW1lbnQsXG4gICAgZW50cnk6IGFueSxcbiAgICBwcm9wZXJ0eU5hbWU6IHN0cmluZyxcbiAgICBpbml0aWFsVmFsdWU6IHN0cmluZ1xuICApIHtcbiAgICBpZiAodGhpcy5hY3RpdmVFZGl0b3IpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcmV2aW91cyA9IGNlbGwuaW5uZXJUZXh0O1xuICAgIGNvbnN0IGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xuICAgIGlucHV0LnZhbHVlID0gaW5pdGlhbFZhbHVlO1xuICAgIGlucHV0LnJvd3MgPSAxO1xuXG4gICAgY29uc3QgY2FuY2VsID0gKCkgPT4ge1xuICAgICAgdGhpcy5hY3RpdmVFZGl0b3IgPSBudWxsO1xuICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9O1xuXG4gICAgY29uc3QgY29tbWl0ID0gYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmV4dFZhbHVlID0gaW5wdXQudmFsdWU7XG4gICAgICBpZiAobmV4dFZhbHVlICE9PSBwcmV2aW91cykge1xuICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5hcHAuZmlsZU1hbmFnZXIucHJvY2Vzc0Zyb250TWF0dGVyKFxuICAgICAgICAgIGVudHJ5LmZpbGUsXG4gICAgICAgICAgKGZyb250bWF0dGVyKSA9PiB7XG4gICAgICAgICAgICBmcm9udG1hdHRlcltwcm9wZXJ0eU5hbWVdID0gbmV4dFZhbHVlO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNhbmNlbCgpO1xuICAgIH07XG5cbiAgICB0aGlzLmFjdGl2ZUVkaXRvciA9IGlucHV0O1xuICAgIGNlbGwuZW1wdHkoKTtcbiAgICBjZWxsLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICBpbnB1dC5mb2N1cygpO1xuICAgIGlucHV0LnNlbGVjdGlvblN0YXJ0ID0gaW5wdXQudmFsdWUubGVuZ3RoO1xuICAgIGlucHV0LnNlbGVjdGlvbkVuZCA9IGlucHV0LnZhbHVlLmxlbmd0aDtcbiAgICBpbnB1dC5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtZWRpdG9yXCI7XG5cbiAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09IFwiRW50ZXJcIiAmJiAhZXZlbnQuc2hpZnRLZXkpIHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdm9pZCBjb21taXQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZXZlbnQua2V5ID09PSBcIkVzY2FwZVwiKSB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNhbmNlbCgpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsICgpID0+IHtcbiAgICAgIHZvaWQgY29tbWl0KCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFkZENlbGxWYWx1ZShcbiAgICBjZWxsOiBIVE1MVGFibGVDZWxsRWxlbWVudCxcbiAgICBlbnRyeTogYW55LFxuICAgIHByb3BlcnR5SWQ6IEJhc2VzUHJvcGVydHlJZFxuICApIHtcbiAgICBjb25zdCBwYXJzZWQgPSBwYXJzZVByb3BlcnR5SWQocHJvcGVydHlJZCk7XG4gICAgY29uc3QgdmFsdWUgPSBlbnRyeS5nZXRWYWx1ZShwcm9wZXJ0eUlkKTtcbiAgICBjb25zdCB0ZXh0VmFsdWUgPSB2YWx1ZSA/IHZhbHVlLnRvU3RyaW5nKCkgOiBcIlwiO1xuICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbFwiKTtcblxuICAgIGlmIChwYXJzZWQudHlwZSA9PT0gXCJmaWxlXCIgJiYgcGFyc2VkLm5hbWUgPT09IFwibmFtZVwiKSB7XG4gICAgICBjb25zdCBsaW5rID0gY2VsbC5jcmVhdGVFbChcImFcIiwge1xuICAgICAgICB0ZXh0OiBlbnRyeS5maWxlLm5hbWUsXG4gICAgICAgIGhyZWY6IGVudHJ5LmZpbGUucGF0aCxcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRDbGFzcyhcImludGVybmFsLWxpbmtcIik7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCAmJiBldmVudC5idXR0b24gIT09IDEpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYW5lID0gS2V5bWFwLmlzTW9kRXZlbnQoZXZlbnQpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGlmIChwYW5lID09PSB0cnVlIHx8IHBhbmUgPT09IGZhbHNlKSB7XG4gICAgICAgICAgdm9pZCB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLm9wZW5MaW5rVGV4dChcbiAgICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICBCb29sZWFuKHBhbmUpXG4gICAgICAgICAgKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgIGVudHJ5LmZpbGUucGF0aCxcbiAgICAgICAgICBcIlwiLFxuICAgICAgICAgIHBhbmUgYXMgUGFuZVR5cGVcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKFwibW91c2VvdmVyXCIsIChldmVudCkgPT4ge1xuICAgICAgICB0aGlzLnBsdWdpbi5hcHAud29ya3NwYWNlLnRyaWdnZXIoXCJob3Zlci1saW5rXCIsIHtcbiAgICAgICAgICBldmVudCxcbiAgICAgICAgICBzb3VyY2U6IFwiYmFzZXNcIixcbiAgICAgICAgICBob3ZlclBhcmVudDogdGhpcyxcbiAgICAgICAgICB0YXJnZXRFbDogbGluayxcbiAgICAgICAgICBsaW5rdGV4dDogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRleHRWYWx1ZSkge1xuICAgICAgICBjZWxsLnRpdGxlID0gdGV4dFZhbHVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSkge1xuICAgICAgY29uc3QgY29udGV4dCA9IG5ldyBSZW5kZXJDb250ZXh0KCk7XG4gICAgICBjb250ZXh0LmhvdmVyUG9wb3ZlciA9IHRoaXMuaG92ZXJQb3BvdmVyO1xuICAgICAgdmFsdWUucmVuZGVyVG8oY2VsbCwgY29udGV4dCk7XG4gICAgICBpZiAodGV4dFZhbHVlKSB7XG4gICAgICAgIGNlbGwudGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0ZXh0VmFsdWUpIHtcbiAgICAgIGNlbGwuY3JlYXRlU3Bhbih7IHRleHQ6IHRleHRWYWx1ZSB9KTtcbiAgICAgIGNlbGwudGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgfVxuXG4gICAgaWYgKHBhcnNlZC50eXBlID09PSBcIm5vdGVcIikge1xuICAgICAgY2VsbC5hZGRDbGFzcyhcIm9ic2lkaWFuLWhvdGZpeGVzLW5vdGUtY2VsbFwiKTtcbiAgICAgIGNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRibGNsaWNrXCIsICgpID0+IHtcbiAgICAgICAgdm9pZCB0aGlzLmJlZ2luRWRpdE5vdGVDZWxsKGNlbGwsIGVudHJ5LCBwYXJzZWQubmFtZSwgdGV4dFZhbHVlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0Q3VycmVudENvbHVtbk9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICBjb25zdCBleHBsaWNpdE9yZGVyID0gdGhpcy5jb25maWcuZ2V0T3JkZXIoKTtcbiAgICBpZiAoZXhwbGljaXRPcmRlci5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZXhwbGljaXRPcmRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wcm9wZXJ0aWVzO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG4gICAgdGhpcy5yb290LmNsYXNzTmFtZSA9IGBvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAke3RoaXMuZ2V0Q29sdW1uV3JhcENsYXNzKCl9YDtcbiAgICB0aGlzLmNsZWFyRHJhZ1RhcmdldFN0eWxlcygpO1xuICAgIHRoaXMuYWN0aXZlVmlldyA9IG51bGw7XG4gICAgdGhpcy5zeW5jQ29sdW1uV2lkdGhzKCk7XG5cbiAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMucm9vdC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZW1wdHlcIixcbiAgICAgICAgdGV4dDogXCJGcm96ZW4gdGFibGUgdmlldyBpcyBkaXNhYmxlZC4gVHVybiBpdCBvbiBpbiBwbHVnaW4gc2V0dGluZ3MuXCIsXG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwcm9wZXJ0eU9yZGVyID0gdGhpcy5nZXRDdXJyZW50Q29sdW1uT3JkZXIoKTtcbiAgICBpZiAoIXByb3BlcnR5T3JkZXIubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJvb3QuY3JlYXRlRGl2KHtcbiAgICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiTm8gcHJvcGVydGllcyBhdmFpbGFibGUgZm9yIHRoaXMgQmFzZS5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIgPSBwcm9wZXJ0eU9yZGVyO1xuICAgIHRoaXMuY3VycmVudFByb3BlcnR5T3JkZXIuZm9yRWFjaCgocHJvcGVydHlJZCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IGNvbmZpZ3VyZWRXaWR0aCA9IHRoaXMuZ2V0Q29sdW1uV2lkdGgocHJvcGVydHlJZCwgaW5kZXgpO1xuICAgICAgdGhpcy5hY3RpdmVDb2x1bW5XaWR0aHMuc2V0KHByb3BlcnR5SWQsIGNvbmZpZ3VyZWRXaWR0aCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBmaXJzdENvbHVtbldpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChcbiAgICAgIHByb3BlcnR5T3JkZXJbMF0sXG4gICAgICB0aGlzLmN1cnJlbnRQcm9wZXJ0eU9yZGVyWzBdID09PSBwcm9wZXJ0eU9yZGVyWzBdID8gMCA6IDBcbiAgICApO1xuXG4gICAgY29uc3QgdmlldyA9IHRoaXMucm9vdC5jcmVhdGVEaXYoXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtdmlld1wiKTtcbiAgICB0aGlzLmFjdGl2ZVZpZXcgPSB2aWV3O1xuICAgIHRoaXMuc2V0Rmlyc3RDb2x1bW5XaWR0aChmaXJzdENvbHVtbldpZHRoKTtcblxuICAgIGNvbnN0IHRhYmxlID0gdmlldy5jcmVhdGVFbChcInRhYmxlXCIsIHsgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlXCIgfSk7XG4gICAgY29uc3QgY29sZ3JvdXAgPSB0YWJsZS5jcmVhdGVFbChcImNvbGdyb3VwXCIpO1xuICAgIHByb3BlcnR5T3JkZXIuZm9yRWFjaCgocHJvcGVydHlJZCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHdpZHRoID0gdGhpcy5nZXRDb2x1bW5XaWR0aChwcm9wZXJ0eUlkLCBpbmRleCk7XG4gICAgICBjb2xncm91cFxuICAgICAgICAuY3JlYXRlRWwoXCJjb2xcIiwgeyBhdHRyOiB7IFwiZGF0YS1wcm9wZXJ0eS1pZFwiOiBwcm9wZXJ0eUlkIH0gfSlcbiAgICAgICAgLnNldEF0dHIoXCJzdHlsZVwiLCBgd2lkdGg6ICR7d2lkdGh9cHg7YCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0aGVhZCA9IHRhYmxlLmNyZWF0ZVRIZWFkKCk7XG4gICAgY29uc3QgaGVhZGVyUm93ID0gdGhlYWQuY3JlYXRlRWwoXCJ0clwiKTtcblxuICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBwcm9wZXJ0eU9yZGVyLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgY29uc3QgcHJvcGVydHlJZCA9IHByb3BlcnR5T3JkZXJbaW5kZXhdO1xuICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICAgIGNvbnN0IG5hbWUgPSB0aGlzLmNvbmZpZy5nZXREaXNwbGF5TmFtZShwcm9wZXJ0eUlkKTtcbiAgICAgIGNvbnN0IGhlYWRlckNlbGwgPSBoZWFkZXJSb3cuY3JlYXRlRWwoXCJ0aFwiLCB7IHRleHQ6IG5hbWUgfSk7XG4gICAgICBoZWFkZXJDZWxsLnNldEF0dHJpYnV0ZShcImRhdGEtcHJvcGVydHktaWRcIiwgcHJvcGVydHlJZCk7XG4gICAgICBoZWFkZXJDZWxsLnN0eWxlLndpZHRoID0gYCR7d2lkdGh9cHhgO1xuICAgICAgaGVhZGVyQ2VsbC5kcmFnZ2FibGUgPSB0cnVlO1xuXG4gICAgICBoZWFkZXJDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnc3RhcnRcIiwgKGV2ZW50KSA9PlxuICAgICAgICB0aGlzLm9uQ29sdW1uRHJhZ1N0YXJ0KGV2ZW50LCBwcm9wZXJ0eUlkKVxuICAgICAgKTtcbiAgICAgIGhlYWRlckNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdvdmVyXCIsIChldmVudCkgPT5cbiAgICAgICAgdGhpcy5vbkNvbHVtbkRyYWdPdmVyKGV2ZW50LCBwcm9wZXJ0eUlkKVxuICAgICAgKTtcbiAgICAgIGhlYWRlckNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyb3BcIiwgKGV2ZW50KSA9PlxuICAgICAgICB0aGlzLm9uQ29sdW1uRHJvcChldmVudCwgcHJvcGVydHlJZClcbiAgICAgICk7XG4gICAgICBoZWFkZXJDZWxsLmFkZEV2ZW50TGlzdGVuZXIoXCJkcmFnbGVhdmVcIiwgKCkgPT5cbiAgICAgICAgdGhpcy5jbGVhckRyYWdUYXJnZXRTdHlsZXMoKVxuICAgICAgKTtcbiAgICAgIGhlYWRlckNlbGwuYWRkRXZlbnRMaXN0ZW5lcihcImRyYWdlbmRcIiwgdGhpcy5vbkNvbHVtbkRyYWdFbmQpO1xuXG4gICAgICBjb25zdCByZXNpemVIYW5kbGUgPSBoZWFkZXJDZWxsLmNyZWF0ZUVsKFwic3BhblwiLCB7XG4gICAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcmVzaXplLWhhbmRsZVwiLFxuICAgICAgfSk7XG4gICAgICByZXNpemVIYW5kbGUuYWRkRXZlbnRMaXN0ZW5lcihcInBvaW50ZXJkb3duXCIsIChldmVudCkgPT5cbiAgICAgICAgdGhpcy5iZWdpblJlc2l6ZUNvbHVtbihwcm9wZXJ0eUlkLCBpbmRleCwgZXZlbnQpXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IHRib2R5ID0gdGFibGUuY3JlYXRlVEJvZHkoKTtcbiAgICBjb25zdCBoYXNWaXNpYmxlR3JvdXBpbmcgPSB0aGlzLmRhdGEuZ3JvdXBlZERhdGEubGVuZ3RoID4gMTtcblxuICAgIGZvciAoY29uc3QgZ3JvdXAgb2YgdGhpcy5kYXRhLmdyb3VwZWREYXRhKSB7XG4gICAgICBjb25zdCBlbnRyaWVzID0gZ3JvdXAuZW50cmllcztcbiAgICAgIGlmICghZW50cmllcy5sZW5ndGgpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChoYXNWaXNpYmxlR3JvdXBpbmcpIHtcbiAgICAgICAgY29uc3QgZ3JvdXBSb3cgPSB0Ym9keS5jcmVhdGVFbChcInRyXCIsIHtcbiAgICAgICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZ3JvdXAtcm93XCIsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBrZXlWYWx1ZSA9IGdyb3VwLmtleT8udG9TdHJpbmcoKSA/PyBcIlVuZ3JvdXBlZFwiO1xuICAgICAgICBjb25zdCBncm91cENlbGwgPSBncm91cFJvdy5jcmVhdGVFbChcInRkXCIsIHtcbiAgICAgICAgICB0ZXh0OiBrZXlWYWx1ZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGdyb3VwQ2VsbC5jb2xTcGFuID0gcHJvcGVydHlPcmRlci5sZW5ndGg7XG4gICAgICB9XG5cbiAgICAgIGZvciAoY29uc3QgZW50cnkgb2YgZW50cmllcykge1xuICAgICAgICBjb25zdCByb3cgPSB0Ym9keS5jcmVhdGVFbChcInRyXCIpO1xuICAgICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgcHJvcGVydHlPcmRlci5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgICBjb25zdCBwcm9wZXJ0eUlkID0gcHJvcGVydHlPcmRlcltpbmRleF07XG4gICAgICAgICAgY29uc3Qgd2lkdGggPSB0aGlzLmdldENvbHVtbldpZHRoKHByb3BlcnR5SWQsIGluZGV4KTtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY2VsbC5zZXRBdHRyaWJ1dGUoXCJkYXRhLXByb3BlcnR5LWlkXCIsIHByb3BlcnR5SWQpO1xuICAgICAgICAgIGNlbGwuc3R5bGUud2lkdGggPSBgJHt3aWR0aH1weGA7XG4gICAgICAgICAgdGhpcy5hZGRDZWxsVmFsdWUoY2VsbCwgZW50cnksIHByb3BlcnR5SWQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgbWluV2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1heFdpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHdyYXBNb2RlU2VsZWN0OiBIVE1MU2VsZWN0RWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldFNlY3Rpb25FbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5taW5XaWR0aElucHV0KSB0aGlzLm1pbldpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLndyYXBNb2RlU2VsZWN0KSB0aGlzLndyYXBNb2RlU2VsZWN0LmRpc2FibGVkID0gIWVuYWJsZWQ7XG4gIH1cblxuICBkaXNwbGF5KCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJPYnNpZGlhbiBIb3RmaXhlc1wiIH0pO1xuXG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogXCJCYXNlczogRnJvemVuIGZpcnN0IGNvbHVtblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHNlY3Rpb24gPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudFwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBjdXN0b20gZnJvemVuIHRhYmxlIHZpZXdcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIlVzZSBhIGN1c3RvbSBCYXNlcyB2aWV3IHdpdGggYSBzdGlja3kgZmlyc3QgY29sdW1uIGluc3RlYWQgb2Ygb3ZlcmxheSBoYWNrcy5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgZW5hYmxlZDogdmFsdWUgfSk7XG4gICAgICAgICAgdGhpcy5zZXRTZWN0aW9uRW5hYmxlZCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdCBjb2x1bW4gbWluaW11bSB3aWR0aCAocHgpXCIpXG4gICAgICAuc2V0RGVzYyhcIk1pbmltdW0gd2lkdGggb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLm1pbldpZHRoSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS5maXJzdENvbHVtbk1pbldpZHRoUHgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkgfHwgcGFyc2VkIDwgODApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgZmlyc3RDb2x1bW5NaW5XaWR0aFB4OiBwYXJzZWQsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdCBjb2x1bW4gbWF4IHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiQ2FwIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uIHdpZHRoLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5tYXhXaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiQmFja2dyb3VuZFwiKVxuICAgICAgLnNldERlc2MoXCJCYWNrZ3JvdW5kIHVzZWQgYmVoaW5kIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kSW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHN0YXRlLmJhY2tncm91bmRDb2xvcik7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwidmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KVwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6XG4gICAgICAgICAgICAgIHZhbHVlIHx8IERFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4uYmFja2dyb3VuZENvbG9yLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiei1pbmRleFwiKVxuICAgICAgLnNldERlc2MoXCJTdGFja2luZyBvcmRlciBmb3IgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnpJbmRleElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuekluZGV4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCI0XCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHpJbmRleDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBkaXZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcIkRyYXcgYSBkaXZpZGVyIHRvIHRoZSByaWdodCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuc2hvd0RpdmlkZXIpO1xuICAgICAgICB0b2dnbGUuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBzaG93RGl2aWRlcjogdmFsdWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJDZWxsIHdyYXAgbW9kZVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQ2hvb3NlIGhvdyBsb25nIHZhbHVlcyBhcHBlYXIgd2hlbiB0aGV5IGFyZSB3aWRlciB0aGFuIHRoZSBjb2x1bW4uXCJcbiAgICAgIClcbiAgICAgIC5hZGREcm9wZG93bigoZHJvcGRvd24pID0+IHtcbiAgICAgICAgdGhpcy53cmFwTW9kZVNlbGVjdCA9IGRyb3Bkb3duLnNlbGVjdEVsO1xuICAgICAgICBkcm9wZG93blxuICAgICAgICAgIC5hZGRPcHRpb24oXCJuYXJyb3dcIiwgXCJOYXJyb3cgKHRydW5jYXRlKVwiKVxuICAgICAgICAgIC5hZGRPcHRpb24oXCJsYXJnZVwiLCBcIkxhcmdlICh3cmFwKVwiKVxuICAgICAgICAgIC5zZXRWYWx1ZShzdGF0ZS5jb2x1bW5XcmFwTW9kZSlcbiAgICAgICAgICAuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICBkcm9wZG93bi5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBpZiAodmFsdWUgIT09IFwibmFycm93XCIgJiYgdmFsdWUgIT09IFwibGFyZ2VcIikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBjb2x1bW5XcmFwTW9kZTogdmFsdWUsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnNldFNlY3Rpb25FbmFibGVkKHN0YXRlLmVuYWJsZWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFlTztBQUVQLElBQU0sbUJBQW1CO0FBQ3pCLElBQU0seUJBQXlCO0FBQy9CLElBQU0sMkJBQTJCO0FBa0JqQyxJQUFNLG1CQUFtQztBQUFBLEVBQ3ZDLG1CQUFtQjtBQUFBLElBQ2pCLFNBQVM7QUFBQSxJQUNULHVCQUF1QjtBQUFBLElBQ3ZCLHVCQUF1QjtBQUFBLElBQ3ZCLGlCQUFpQjtBQUFBLElBQ2pCLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLGdCQUFnQjtBQUFBLEVBQ2xCO0FBQ0Y7QUFFQSxJQUFNLHNCQUFzQjtBQUM1QixJQUFNLDBCQUEwQjtBQUNoQyxJQUFNLDZCQUE2QjtBQUVuQyxJQUFxQix5QkFBckIsY0FBb0QsdUJBQU87QUFBQSxFQUN6RCxXQUEyQjtBQUFBLElBQ3pCLG1CQUFtQixFQUFFLEdBQUcsaUJBQWlCLGtCQUFrQjtBQUFBLEVBQzdEO0FBQUEsRUFDUSxlQUF3QztBQUFBLEVBRWhELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBQ3hCLFNBQUssWUFBWTtBQUNqQixTQUFLLG1CQUFtQjtBQUN4QixVQUFNLGFBQWEsS0FBSyxrQkFBa0Isd0JBQXdC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
