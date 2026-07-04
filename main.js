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
  table-layout: auto;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  min-width: var(--obsidian-hotfixes-first-column-min-width);
  width: var(--obsidian-hotfixes-first-column-min-width);
  max-width: var(--obsidian-hotfixes-first-column-max-width);
  background: var(--obsidian-hotfixes-first-column-bg);
  z-index: var(--obsidian-hotfixes-first-column-z);
  border-right: ${divider};
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
  type = FROZEN_TABLE_VIEW_TYPE;
  onDataUpdated() {
    this.render();
  }
  render() {
    this.root.empty();
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
    const view = this.root.createDiv("obsidian-hotfixes-frozen-bases-view");
    const table = view.createEl("table", { cls: "obsidian-hotfixes-table" });
    const thead = table.createTHead();
    const headerRow = thead.createEl("tr");
    for (const propertyId of propertyOrder) {
      const name = this.config.getDisplayName(propertyId);
      headerRow.createEl("th", {
        text: name
      });
    }
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
        for (const propertyId of propertyOrder) {
          const cell = row.createEl("td");
          const parsed = (0, import_obsidian.parsePropertyId)(propertyId);
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
  getPropertyOrder() {
    const explicitOrder = this.config.getOrder();
    if (explicitOrder.length > 0) {
      return explicitOrder;
    }
    return this.data.properties;
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBCYXNlc1ZpZXcsXG4gIEhvdmVyUGFyZW50LFxuICBIb3ZlclBvcG92ZXIsXG4gIEtleW1hcCxcbiAgUGFuZVR5cGUsXG4gIFBsdWdpbixcbiAgUGx1Z2luU2V0dGluZ1RhYixcbiAgUXVlcnlDb250cm9sbGVyLFxuICBTZXR0aW5nLFxuICBUZXh0Q29tcG9uZW50LFxuICBwYXJzZVByb3BlcnR5SWQsXG4gIHR5cGUgQmFzZXNQcm9wZXJ0eUlkLFxufSBmcm9tIFwib2JzaWRpYW5cIjtcblxuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcbmNvbnN0IEZST1pFTl9UQUJMRV9WSUVXX1RZUEUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi10YWJsZVwiO1xuXG5pbnRlcmZhY2UgRnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncyB7XG4gIGVuYWJsZWQ6IGJvb2xlYW47XG4gIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogbnVtYmVyO1xuICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEhvdGZpeFNldHRpbmdzIHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogMjIwLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMzIwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiA0LFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVnaXN0ZXJTZXR0aW5nVGFiKCk7XG4gICAgY29uc3QgcmVnaXN0ZXJlZCA9IHRoaXMucmVnaXN0ZXJCYXNlc1ZpZXcoRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRSwge1xuICAgICAgbmFtZTogXCJGcm96ZW4gVGFibGVcIixcbiAgICAgIGljb246IFwibHVjaWRlLWxheW91dC1ncmlkXCIsXG4gICAgICBmYWN0b3J5OiAoY29udHJvbGxlciwgY29udGFpbmVyRWwpID0+XG4gICAgICAgIG5ldyBGcm96ZW5UYWJsZUJhc2VzVmlldyhjb250cm9sbGVyLCBjb250YWluZXJFbCwgdGhpcyksXG4gICAgfSk7XG4gICAgaWYgKCFyZWdpc3RlcmVkKSB7XG4gICAgICBjb25zb2xlLndhcm4oXG4gICAgICAgIFwiW09ic2lkaWFuIEhvdGZpeGVzXSBGcm96ZW4gVGFibGUgdmlldyBjb3VsZCBub3QgYmUgcmVnaXN0ZXJlZC4gQmFzZXMgbWF5IGJlIGRpc2FibGVkLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiZmlsZS1vcGVuXCIsICgpID0+IHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5yZWZyZXNoT3BlbkZyb3plblZpZXdzKCkpO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHJlZ2lzdGVyU2V0dGluZ1RhYigpIHtcbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgIHRoaXMucmVmcmVzaE9wZW5Gcm96ZW5WaWV3cygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVN0eWxlcygpIHtcbiAgICBpZiAoIXRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LmlkID0gU1RZTEVfRUxFTUVOVF9JRDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3QgbWluV2lkdGggPSBNYXRoLm1heCg4MCwgY29uZmlnLmZpcnN0Q29sdW1uTWluV2lkdGhQeCk7XG4gICAgY29uc3QgbWF4V2lkdGggPSBNYXRoLm1heChtaW5XaWR0aCwgY29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCk7XG4gICAgY29uc3QgZGl2aWRlciA9IGNvbmZpZy5zaG93RGl2aWRlclxuICAgICAgPyBcIjFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcilcIlxuICAgICAgOiBcIm5vbmVcIjtcblxuICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID0gYFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoOiAke21pbldpZHRofXB4O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1tYXgtd2lkdGg6ICR7bWF4V2lkdGh9cHg7XG4gIC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICAtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16OiAke2NvbmZpZy56SW5kZXh9O1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3Qge1xuICBvdmVyZmxvdy14OiBhdXRvO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy12aWV3IHtcbiAgbWluLXdpZHRoOiBtYXgtY29udGVudDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB7XG4gIHdpZHRoOiAxMDAlO1xuICBib3JkZXItY29sbGFwc2U6IHNlcGFyYXRlO1xuICBib3JkZXItc3BhY2luZzogMDtcbiAgZm9udC1zaXplOiB2YXIoLS1mb250LXVpLXNtYWxsZXIpO1xuICB0YWJsZS1sYXlvdXQ6IGF1dG87XG4gIG1heC13aWR0aDogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0aCB7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJhY2tncm91bmQtc2Vjb25kYXJ5KTtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgdG9wOiAwO1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZCB7XG4gIHBhZGRpbmc6IDhweCAxMHB4O1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoOmZpcnN0LWNoaWxkLFxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0ZDpmaXJzdC1jaGlsZCB7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIGxlZnQ6IDA7XG4gIG1pbi13aWR0aDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW1pbi13aWR0aCk7XG4gIHdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWluLXdpZHRoKTtcbiAgbWF4LXdpZHRoOiB2YXIoLS1vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tbWF4LXdpZHRoKTtcbiAgYmFja2dyb3VuZDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLWJnKTtcbiAgei1pbmRleDogdmFyKC0tb2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLXopO1xuICBib3JkZXItcmlnaHQ6ICR7ZGl2aWRlcn07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1mcm96ZW4tYmFzZXMtcm9vdCAub2JzaWRpYW4taG90Zml4ZXMtdGFibGUgdGg6Zmlyc3QtY2hpbGQge1xuICB6LWluZGV4OiBjYWxjKHZhcigtLW9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi16LCA0KSArIDEpO1xufVxuXG4ub2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3QgLm9ic2lkaWFuLWhvdGZpeGVzLXRhYmxlIHRoZWFkIHRoOmZpcnN0LWNoaWxkIHtcbiAgbGVmdDogMDtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1yb290IC5vYnNpZGlhbi1ob3RmaXhlcy10YWJsZSB0aGVhZCB0cjpmaXJzdC1vZi10eXBlIHRoOmxhc3QtY2hpbGQge1xuICBib3JkZXItcmlnaHQ6IG5vbmU7XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1ncm91cC1yb3cgdGQge1xuICBiYWNrZ3JvdW5kOiB2YXIoLS1iYWNrZ3JvdW5kLXNlY29uZGFyeSk7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLWZyb3plbi1iYXNlcy1lbXB0eSB7XG4gIGNvbG9yOiB2YXIoLS10ZXh0LW11dGVkKTtcbiAgcGFkZGluZzogMC43NXJlbSAwLjVyZW07XG59XG5cbi5vYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24ge1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XG4gIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgbWFyZ2luLXRvcDogMC41cmVtO1xuICBwYWRkaW5nOiAwLjVyZW0gMC43NXJlbTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbiBzdW1tYXJ5IHtcbiAgY3Vyc29yOiBwb2ludGVyO1xuICBmb250LXdlaWdodDogNjAwO1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbn1cblxuLm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50IHtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ2FwOiAwLjc1cmVtO1xuICBtYXJnaW4tdG9wOiAwLjc1cmVtO1xufVxuYC50cmltKCk7XG4gIH1cblxuICBwcml2YXRlIHJlZnJlc2hPcGVuRnJvemVuVmlld3MoKSB7XG4gICAgdGhpcy5hcHAud29ya3NwYWNlLml0ZXJhdGVBbGxMZWF2ZXMoKGxlYWYpID0+IHtcbiAgICAgIGNvbnN0IHZpZXcgPSBsZWFmLnZpZXc7XG4gICAgICBpZiAodmlldyBpbnN0YW5jZW9mIEZyb3plblRhYmxlQmFzZXNWaWV3KSB7XG4gICAgICAgIHZpZXcub25EYXRhVXBkYXRlZCgpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oXG4gICAgdXBkYXRlczogUGFydGlhbDxGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzPlxuICApIHtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4udGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG59XG5cbmNsYXNzIEZyb3plblRhYmxlQmFzZXNWaWV3IGV4dGVuZHMgQmFzZXNWaWV3IGltcGxlbWVudHMgSG92ZXJQYXJlbnQge1xuICBob3ZlclBvcG92ZXI6IEhvdmVyUG9wb3ZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHJlYWRvbmx5IHJvb3Q6IEhUTUxEaXZFbGVtZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvbnRyb2xsZXI6IFF1ZXJ5Q29udHJvbGxlcixcbiAgICBjb250YWluZXJFbDogSFRNTEVsZW1lbnQsXG4gICAgcHJpdmF0ZSBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW5cbiAgKSB7XG4gICAgc3VwZXIoY29udHJvbGxlcik7XG4gICAgdGhpcy5yb290ID0gY29udGFpbmVyRWwuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXJvb3RcIik7XG4gIH1cblxuICByZWFkb25seSB0eXBlID0gRlJPWkVOX1RBQkxFX1ZJRVdfVFlQRTtcblxuICBwdWJsaWMgb25EYXRhVXBkYXRlZCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlbmRlcigpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXIoKSB7XG4gICAgdGhpcy5yb290LmVtcHR5KCk7XG5cbiAgICBpZiAoIXRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMucm9vdC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiRnJvemVuIHRhYmxlIHZpZXcgaXMgZGlzYWJsZWQuIFR1cm4gaXQgb24gaW4gcGx1Z2luIHNldHRpbmdzLlwiLFxuICAgICAgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgcHJvcGVydHlPcmRlciA9IHRoaXMuZ2V0UHJvcGVydHlPcmRlcigpO1xuICAgIGlmICghcHJvcGVydHlPcmRlci5sZW5ndGgpIHtcbiAgICAgIHRoaXMucm9vdC5jcmVhdGVEaXYoe1xuICAgICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLWVtcHR5XCIsXG4gICAgICAgIHRleHQ6IFwiTm8gcHJvcGVydGllcyBhdmFpbGFibGUgZm9yIHRoaXMgQmFzZS5cIixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHZpZXcgPSB0aGlzLnJvb3QuY3JlYXRlRGl2KFwib2JzaWRpYW4taG90Zml4ZXMtZnJvemVuLWJhc2VzLXZpZXdcIik7XG4gICAgY29uc3QgdGFibGUgPSB2aWV3LmNyZWF0ZUVsKFwidGFibGVcIiwgeyBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtdGFibGVcIiB9KTtcbiAgICBjb25zdCB0aGVhZCA9IHRhYmxlLmNyZWF0ZVRIZWFkKCk7XG4gICAgY29uc3QgaGVhZGVyUm93ID0gdGhlYWQuY3JlYXRlRWwoXCJ0clwiKTtcblxuICAgIGZvciAoY29uc3QgcHJvcGVydHlJZCBvZiBwcm9wZXJ0eU9yZGVyKSB7XG4gICAgICBjb25zdCBuYW1lID0gdGhpcy5jb25maWcuZ2V0RGlzcGxheU5hbWUocHJvcGVydHlJZCk7XG4gICAgICBoZWFkZXJSb3cuY3JlYXRlRWwoXCJ0aFwiLCB7XG4gICAgICAgIHRleHQ6IG5hbWUsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB0Ym9keSA9IHRhYmxlLmNyZWF0ZVRCb2R5KCk7XG4gICAgY29uc3QgaGFzVmlzaWJsZUdyb3VwaW5nID0gdGhpcy5kYXRhLmdyb3VwZWREYXRhLmxlbmd0aCA+IDE7XG5cbiAgICBmb3IgKGNvbnN0IGdyb3VwIG9mIHRoaXMuZGF0YS5ncm91cGVkRGF0YSkge1xuICAgICAgY29uc3QgZW50cmllcyA9IGdyb3VwLmVudHJpZXM7XG4gICAgICBpZiAoIWVudHJpZXMubGVuZ3RoKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFzVmlzaWJsZUdyb3VwaW5nKSB7XG4gICAgICAgIGNvbnN0IGdyb3VwUm93ID0gdGJvZHkuY3JlYXRlRWwoXCJ0clwiLCB7IGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1ncm91cC1yb3dcIiB9KTtcbiAgICAgICAgY29uc3Qga2V5VmFsdWUgPSBncm91cC5rZXk/LnRvU3RyaW5nKCkgPz8gXCJVbmdyb3VwZWRcIjtcbiAgICAgICAgY29uc3QgZ3JvdXBDZWxsID0gZ3JvdXBSb3cuY3JlYXRlRWwoXCJ0ZFwiLCB7XG4gICAgICAgICAgdGV4dDoga2V5VmFsdWUsXG4gICAgICAgIH0pO1xuICAgICAgICBncm91cENlbGwuY29sU3BhbiA9IHByb3BlcnR5T3JkZXIubGVuZ3RoO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgICAgY29uc3Qgcm93ID0gdGJvZHkuY3JlYXRlRWwoXCJ0clwiKTtcbiAgICAgICAgZm9yIChjb25zdCBwcm9wZXJ0eUlkIG9mIHByb3BlcnR5T3JkZXIpIHtcbiAgICAgICAgICBjb25zdCBjZWxsID0gcm93LmNyZWF0ZUVsKFwidGRcIik7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gcGFyc2VQcm9wZXJ0eUlkKHByb3BlcnR5SWQpO1xuXG4gICAgICAgICAgaWYgKHBhcnNlZC50eXBlID09PSBcImZpbGVcIiAmJiBwYXJzZWQubmFtZSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpbmsgPSBjZWxsLmNyZWF0ZUVsKFwiYVwiLCB7XG4gICAgICAgICAgICAgIHRleHQ6IGVudHJ5LmZpbGUubmFtZSxcbiAgICAgICAgICAgICAgaHJlZjogZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsaW5rLmFkZENsYXNzKFwiaW50ZXJuYWwtbGlua1wiKTtcbiAgICAgICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwICYmIGV2ZW50LmJ1dHRvbiAhPT0gMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbnN0IHBhbmUgPSBLZXltYXAuaXNNb2RFdmVudChldmVudCk7XG4gICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICAgICAgaWYgKHBhbmUgPT09IHRydWUgfHwgcGFuZSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICB2b2lkIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2Uub3BlbkxpbmtUZXh0KFxuICAgICAgICAgICAgICAgICAgZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgICAgICAgIEJvb2xlYW4ocGFuZSlcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHZvaWQgdGhpcy5wbHVnaW4uYXBwLndvcmtzcGFjZS5vcGVuTGlua1RleHQoXG4gICAgICAgICAgICAgICAgZW50cnkuZmlsZS5wYXRoLFxuICAgICAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAgICAgcGFuZSBhcyBQYW5lVHlwZVxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZW92ZXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucGx1Z2luLmFwcC53b3Jrc3BhY2UudHJpZ2dlcihcImhvdmVyLWxpbmtcIiwge1xuICAgICAgICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgICAgICAgIHNvdXJjZTogXCJiYXNlc1wiLFxuICAgICAgICAgICAgICAgIGhvdmVyUGFyZW50OiB0aGlzLFxuICAgICAgICAgICAgICAgIHRhcmdldEVsOiBsaW5rLFxuICAgICAgICAgICAgICAgIGxpbmt0ZXh0OiBlbnRyeS5maWxlLnBhdGgsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBjb25zdCB2YWx1ZSA9IGVudHJ5LmdldFZhbHVlKHByb3BlcnR5SWQpO1xuICAgICAgICAgIGNvbnN0IHRleHRWYWx1ZSA9IHZhbHVlID8gdmFsdWUudG9TdHJpbmcoKSA6IFwiXCI7XG4gICAgICAgICAgY2VsbC5jcmVhdGVTcGFuKHsgdGV4dDogdGV4dFZhbHVlIH0pO1xuICAgICAgICAgIGlmICh0ZXh0VmFsdWUpIHtcbiAgICAgICAgICAgIGNlbGwudGl0bGUgPSB0ZXh0VmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBnZXRQcm9wZXJ0eU9yZGVyKCk6IEJhc2VzUHJvcGVydHlJZFtdIHtcbiAgICBjb25zdCBleHBsaWNpdE9yZGVyID0gdGhpcy5jb25maWcuZ2V0T3JkZXIoKTtcbiAgICBpZiAoZXhwbGljaXRPcmRlci5sZW5ndGggPiAwKSB7XG4gICAgICByZXR1cm4gZXhwbGljaXRPcmRlcjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wcm9wZXJ0aWVzO1xuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgbWluV2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIG1heFdpZHRoSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldFNlY3Rpb25FbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5taW5XaWR0aElucHV0KSB0aGlzLm1pbldpZHRoSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICB9XG5cbiAgZGlzcGxheSgpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT2JzaWRpYW4gSG90Zml4ZXNcIiB9KTtcblxuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IFwiQmFzZXM6IEZyb3plbiBmaXJzdCBjb2x1bW5cIixcbiAgICB9KTtcbiAgICBjb25zdCBzZWN0aW9uID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgY3VzdG9tIGZyb3plbiB0YWJsZSB2aWV3XCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJVc2UgYSBjdXN0b20gQmFzZXMgdmlldyB3aXRoIGEgc3RpY2t5IGZpcnN0IGNvbHVtbiBpbnN0ZWFkIG9mIG92ZXJsYXkgaGFja3MuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0U2VjdGlvbkVuYWJsZWQodmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1pbmltdW0gd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJNaW5pbXVtIHdpZHRoIG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5taW5XaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NaW5XaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWluV2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRmlyc3QgY29sdW1uIG1heCB3aWR0aCAocHgpXCIpXG4gICAgICAuc2V0RGVzYyhcIkNhcCB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbiB3aWR0aC5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWF4V2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkJhY2tncm91bmRcIilcbiAgICAgIC5zZXREZXNjKFwiQmFja2dyb3VuZCB1c2VkIGJlaGluZCB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShzdGF0ZS5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiB2YWx1ZSB8fCBERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcInotaW5kZXhcIilcbiAgICAgIC5zZXREZXNjKFwiU3RhY2tpbmcgb3JkZXIgZm9yIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy56SW5kZXhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLnpJbmRleCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiNFwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyB6SW5kZXg6IHBhcnNlZCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlNob3cgZGl2aWRlclwiKVxuICAgICAgLnNldERlc2MoXCJEcmF3IGEgZGl2aWRlciB0byB0aGUgcmlnaHQgb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCIpXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLnNob3dEaXZpZGVyKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgc2hvd0RpdmlkZXI6IHZhbHVlIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5zZXRTZWN0aW9uRW5hYmxlZChzdGF0ZS5lbmFibGVkKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsc0JBY087QUFFUCxJQUFNLG1CQUFtQjtBQUN6QixJQUFNLHlCQUF5QjtBQWUvQixJQUFNLG1CQUFtQztBQUFBLEVBQ3ZDLG1CQUFtQjtBQUFBLElBQ2pCLFNBQVM7QUFBQSxJQUNULHVCQUF1QjtBQUFBLElBQ3ZCLHVCQUF1QjtBQUFBLElBQ3ZCLGlCQUFpQjtBQUFBLElBQ2pCLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQ0Y7QUFFQSxJQUFxQix5QkFBckIsY0FBb0QsdUJBQU87QUFBQSxFQUN6RCxXQUEyQjtBQUFBLElBQ3pCLG1CQUFtQixFQUFFLEdBQUcsaUJBQWlCLGtCQUFrQjtBQUFBLEVBQzdEO0FBQUEsRUFDUSxlQUF3QztBQUFBLEVBRWhELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBQ3hCLFNBQUssWUFBWTtBQUNqQixTQUFLLG1CQUFtQjtBQUN4QixVQUFNLGFBQWEsS0FBSyxrQkFB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
