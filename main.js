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
var DEFAULT_FIRST_COLUMN_SELECTOR = ".bases-view[data-view-type='table']";
var STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";
var DEFAULT_SETTINGS = {
  freezeFirstColumn: {
    enabled: false,
    selector: DEFAULT_FIRST_COLUMN_SELECTOR,
    leftOffsetPx: 0,
    backgroundColor: "var(--background-primary)",
    zIndex: 3,
    showDivider: true,
    firstColumnMaxWidthPx: 280
  }
};
var ObsidianHotfixesPlugin = class extends import_obsidian.Plugin {
  settings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn }
  };
  styleElement = null;
  pendingPatchFrame = 0;
  mutationObserver = null;
  frozenCellElements = /* @__PURE__ */ new Set();
  activeOverlays = /* @__PURE__ */ new Map();
  overlayScrollHandlers = /* @__PURE__ */ new Map();
  async onload() {
    await this.loadSettings();
    this.applyStyles();
    this.scheduleBasePatchRefresh();
    this.addSettingTab(new HotfixesSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.applyStyles())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.applyStyles();
        this.scheduleBasePatchRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.scheduleBasePatchRefresh())
    );
    this.registerDomEvent(window, "resize", () => this.scheduleBasePatchRefresh());
    this.mutationObserver = new MutationObserver(
      () => this.scheduleBasePatchRefresh()
    );
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
    this.register(() => this.mutationObserver?.disconnect());
  }
  onunload() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.clearFrozenColumnOverlays();
    if (this.pendingPatchFrame) {
      window.cancelAnimationFrame(this.pendingPatchFrame);
      this.pendingPatchFrame = 0;
    }
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
    this.scheduleBasePatchRefresh();
  }
  applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = STYLE_ELEMENT_ID;
      document.head.appendChild(this.styleElement);
    }
    if (!this.settings.freezeFirstColumn.enabled) {
      this.styleElement.textContent = "";
      this.clearFrozenColumnOverlays();
      return;
    }
    const config = this.settings.freezeFirstColumn;
    const selector = (config.selector || DEFAULT_FIRST_COLUMN_SELECTOR).trim();
    const divider = config.showDivider ? "box-shadow: 1px 0 0 var(--background-modifier-border);" : "";
    this.styleElement.textContent = `
${selector} {
  position: relative;
}

${selector} .bases-table {
  position: relative;
  overflow-x: auto;
  max-width: 100%;
}

${selector} .bases-table table {
  border-collapse: separate;
  border-spacing: 0;
  width: max-content;
  min-width: 100%;
  table-layout: auto;
}

${selector} .obsidian-hotfixes-first-column-overlay {
  position: absolute;
  top: 0;
  left: ${config.leftOffsetPx}px;
  width: ${config.firstColumnMaxWidthPx}px;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: ${config.zIndex};
  background: ${config.backgroundColor};
  ${divider}
  transform: translateX(0px);
}

${selector} .obsidian-hotfixes-first-column-overlay table {
  width: ${config.firstColumnMaxWidthPx}px;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
}

${selector} .obsidian-hotfixes-first-column-overlay th,
${selector} .obsidian-hotfixes-first-column-overlay td,
${selector} .bases-td:first-of-type,
${selector} .bases-th:first-of-type,
${selector} table tr td:first-child,
${selector} table tr th:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

${selector} .obsidian-hotfixes-hide-original-first-column {
  visibility: hidden;
  width: ${config.firstColumnMaxWidthPx}px !important;
  min-width: 120px !important;
  max-width: ${config.firstColumnMaxWidthPx}px !important;
}
`.trim();
    this.scheduleBasePatchRefresh();
  }
  scheduleBasePatchRefresh() {
    if (!this.settings.freezeFirstColumn.enabled) {
      this.clearFrozenColumnOverlays();
      return;
    }
    if (this.pendingPatchFrame) {
      return;
    }
    this.pendingPatchFrame = window.requestAnimationFrame(() => {
      this.pendingPatchFrame = 0;
      this.refreshBasePatches();
    });
  }
  refreshBasePatches() {
    this.clearFrozenColumnOverlays();
    if (!this.settings.freezeFirstColumn.enabled) {
      return;
    }
    const config = this.settings.freezeFirstColumn;
    const selector = (config.selector || DEFAULT_FIRST_COLUMN_SELECTOR).trim();
    let roots;
    try {
      roots = document.querySelectorAll(selector);
    } catch {
      return;
    }
    roots.forEach((root) => this.patchBaseView(root));
  }
  patchBaseView(root) {
    const config = this.settings.freezeFirstColumn;
    const table = root.querySelector("table");
    const container = root.querySelector(".bases-table") ?? root;
    if (!container || !table) {
      return;
    }
    const rows = this.getTableFirstColumnRows(table);
    if (!rows.length) {
      return;
    }
    const overlay = this.ensureOverlay(container, table);
    this.renderOverlayRows(overlay.querySelector("table"), rows);
    this.syncOverlayStyles(overlay, container, table);
    this.bindOverlayScrollSync(container, overlay);
  }
  getTableFirstColumnRows(table) {
    const rows = table.querySelectorAll("tr");
    const rowInfo = [];
    rows.forEach((row) => {
      const firstCell = row.querySelector(":scope > td:first-child, :scope > th:first-child");
      if (!firstCell) {
        return;
      }
      const parent = row.parentElement?.tagName.toLowerCase();
      const section = parent === "thead" ? "thead" : parent === "tbody" ? "tbody" : parent === "tfoot" ? "tfoot" : "other";
      firstCell.classList.add("obsidian-hotfixes-hide-original-first-column");
      firstCell.style.width = `${this.settings.freezeFirstColumn.firstColumnMaxWidthPx}px`;
      firstCell.style.minWidth = "120px";
      firstCell.style.maxWidth = `${this.settings.freezeFirstColumn.firstColumnMaxWidthPx}px`;
      this.frozenCellElements.add(firstCell);
      rowInfo.push({ sourceRow: row, firstCell, section });
    });
    return rowInfo;
  }
  ensureOverlay(container, table) {
    let overlay = this.activeOverlays.get(container);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "obsidian-hotfixes-first-column-overlay";
      const overlayTable = document.createElement("table");
      overlay.appendChild(overlayTable);
      container.appendChild(overlay);
      this.activeOverlays.set(container, overlay);
    }
    return overlay;
  }
  renderOverlayRows(overlayTable, rows) {
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const tfoot = document.createElement("tfoot");
    const otherRows = [];
    rows.forEach((rowLike) => {
      const clonedCell = rowLike.firstCell.cloneNode(true);
      clonedCell.classList.add("obsidian-hotfixes-overlay-cell");
      const clonedRow = document.createElement("tr");
      clonedRow.style.height = `${Math.max(1, rowLike.sourceRow.getBoundingClientRect().height)}px`;
      clonedRow.appendChild(clonedCell);
      switch (rowLike.section) {
        case "thead":
          thead.appendChild(clonedRow);
          break;
        case "tfoot":
          tfoot.appendChild(clonedRow);
          break;
        default:
          if (rowLike.section === "tbody") {
            tbody.appendChild(clonedRow);
          } else {
            otherRows.push(clonedRow);
          }
          break;
      }
    });
    overlayTable.replaceChildren();
    if (thead.childNodes.length) {
      overlayTable.appendChild(thead);
    }
    if (tbody.childNodes.length) {
      if (otherRows.length) {
        otherRows.forEach((rowLike) => tbody.appendChild(rowLike));
      }
      overlayTable.appendChild(tbody);
    } else if (otherRows.length) {
      const fallbackBody = document.createElement("tbody");
      otherRows.forEach((rowLike) => fallbackBody.appendChild(rowLike));
      overlayTable.appendChild(fallbackBody);
    }
    if (tfoot.childNodes.length) {
      overlayTable.appendChild(tfoot);
    }
  }
  syncOverlayStyles(overlay, container, table) {
    const config = this.settings.freezeFirstColumn;
    overlay.style.width = `${config.firstColumnMaxWidthPx}px`;
    overlay.style.left = `${config.leftOffsetPx}px`;
    overlay.style.height = `${Math.max(1, table.getBoundingClientRect().height)}px`;
    this.syncOverlayScroll(container, overlay);
  }
  bindOverlayScrollSync(container, overlay) {
    if (this.overlayScrollHandlers.has(container)) {
      return;
    }
    const handler = () => this.syncOverlayScroll(container, overlay);
    container.addEventListener("scroll", handler, { passive: true });
    this.overlayScrollHandlers.set(container, handler);
  }
  syncOverlayScroll(container, overlay) {
    overlay.style.transform = `translateX(${container.scrollLeft}px)`;
  }
  clearFrozenColumnOverlays() {
    for (const cell of this.frozenCellElements) {
      cell.classList.remove("obsidian-hotfixes-hide-original-first-column");
      cell.style.width = "";
      cell.style.minWidth = "";
      cell.style.maxWidth = "";
    }
    this.frozenCellElements.clear();
    for (const [container, overlay] of this.activeOverlays) {
      overlay.remove();
      const handler = this.overlayScrollHandlers.get(container);
      if (handler) {
        container.removeEventListener("scroll", handler);
      }
    }
    this.activeOverlays.clear();
    this.overlayScrollHandlers.clear();
  }
  async updateFreezeFirstColumn(updates) {
    this.settings.freezeFirstColumn = {
      ...this.settings.freezeFirstColumn,
      ...updates
    };
    await this.saveSettings();
  }
};
var HotfixesSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  selectorInput = null;
  leftOffsetInput = null;
  backgroundInput = null;
  zIndexInput = null;
  dividerToggleInput = null;
  maxWidthInput = null;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  setHotfixEnabled(enabled) {
    if (this.selectorInput) this.selectorInput.setDisabled(!enabled);
    if (this.leftOffsetInput) this.leftOffsetInput.setDisabled(!enabled);
    if (this.backgroundInput) this.backgroundInput.setDisabled(!enabled);
    if (this.zIndexInput) this.zIndexInput.setDisabled(!enabled);
    if (this.dividerToggleInput) this.dividerToggleInput.setDisabled(!enabled);
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Obsidian Hotfixes" });
    const details = containerEl.createEl("details", {
      cls: "obsidian-hotfixes-setting-section"
    });
    details.createEl("summary", {
      text: "Bases: Freeze first column"
    });
    const section = details.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content"
    });
    const state = this.plugin.settings.freezeFirstColumn;
    new import_obsidian.Setting(section).setName("Enable first-column freeze").setDesc(
      "Keep the first column in Bases table view visible while scrolling horizontally."
    ).addToggle((toggle) => {
      toggle.setValue(state.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({ enabled: value });
        this.setHotfixEnabled(value);
      });
    });
    new import_obsidian.Setting(section).setName("Target selector").setDesc(
      "CSS selector for the Bases container. Default targets table view-only Bases."
    ).addText((text) => {
      this.selectorInput = text;
      text.setValue(state.selector);
      text.setDisabled(!state.enabled);
      text.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({
          selector: value || DEFAULT_FIRST_COLUMN_SELECTOR
        });
      });
    });
    new import_obsidian.Setting(section).setName("Left offset (px)").setDesc("Optional offset for the frozen column from the left edge.").addText((text) => {
      this.leftOffsetInput = text;
      text.setValue(String(state.leftOffsetPx));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.setPlaceholder("0");
      text.onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({ leftOffsetPx: parsed });
      });
    });
    new import_obsidian.Setting(section).setName("Background").setDesc(
      "Background for the fixed first column while scrolling (CSS color or variable)."
    ).addText((text) => {
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
    new import_obsidian.Setting(section).setName("First-column max width (px)").setDesc("Cap the frozen first-column width to avoid taking too much space.").addText((text) => {
      this.maxWidthInput = text;
      text.setValue(String(state.firstColumnMaxWidthPx));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.setPlaceholder("280");
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
    new import_obsidian.Setting(section).setName("z-index").setDesc("z-index value used for frozen first-column overlay.").addText((text) => {
      this.zIndexInput = text;
      text.setValue(String(state.zIndex));
      text.setDisabled(!state.enabled);
      text.inputEl.type = "number";
      text.setPlaceholder("3");
      text.onChange(async (value) => {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed)) {
          return;
        }
        await this.plugin.updateFreezeFirstColumn({ zIndex: parsed });
      });
    });
    new import_obsidian.Setting(section).setName("Show divider").setDesc(
      "Draw a thin divider line to the right of the frozen first column."
    ).addToggle((toggle) => {
      this.dividerToggleInput = toggle;
      toggle.setValue(state.showDivider);
      toggle.setDisabled(!state.enabled);
      toggle.onChange(async (value) => {
        await this.plugin.updateFreezeFirstColumn({ showDivider: value });
      });
    });
    this.setHotfixEnabled(state.enabled);
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SID0gXCIuYmFzZXMtdmlld1tkYXRhLXZpZXctdHlwZT0ndGFibGUnXVwiO1xuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsZWZ0T2Zmc2V0UHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBIb3RmaXhTZXR0aW5ncyB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzO1xufVxuXG5pbnRlcmZhY2UgVGFibGVSb3dMaWtlIHtcbiAgc291cmNlUm93OiBIVE1MVGFibGVSb3dFbGVtZW50O1xuICBmaXJzdENlbGw6IEhUTUxUYWJsZUNlbGxFbGVtZW50O1xuICBzZWN0aW9uOiBcInRoZWFkXCIgfCBcInRib2R5XCIgfCBcInRmb290XCIgfCBcIm90aGVyXCI7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIHNlbGVjdG9yOiBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUixcbiAgICBsZWZ0T2Zmc2V0UHg6IDAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDMsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gICAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiAyODAsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0ge1xuICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4gfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBwZW5kaW5nUGF0Y2hGcmFtZSA9IDA7XG4gIHByaXZhdGUgbXV0YXRpb25PYnNlcnZlcjogTXV0YXRpb25PYnNlcnZlciB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGZyb3plbkNlbGxFbGVtZW50cyA9IG5ldyBTZXQ8SFRNTEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgYWN0aXZlT3ZlcmxheXMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBIVE1MRWxlbWVudD4oKTtcbiAgcHJpdmF0ZSBvdmVybGF5U2Nyb2xsSGFuZGxlcnMgPSBuZXcgTWFwPEhUTUxFbGVtZW50LCAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkPigpO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnNjaGVkdWxlQmFzZVBhdGNoUmVmcmVzaCgpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBIb3RmaXhlc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5hcHBseVN0eWxlcygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsICgpID0+IHtcbiAgICAgICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICAgICAgICB0aGlzLnNjaGVkdWxlQmFzZVBhdGNoUmVmcmVzaCgpO1xuICAgICAgfSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKSlcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3RlckRvbUV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKCkgPT4gdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKSk7XG5cbiAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PlxuICAgICAgdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKVxuICAgICk7XG4gICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgICAgc3VidHJlZTogdHJ1ZSxcbiAgICB9KTtcbiAgICB0aGlzLnJlZ2lzdGVyKCgpID0+IHRoaXMubXV0YXRpb25PYnNlcnZlcj8uZGlzY29ubmVjdCgpKTtcbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuY2xlYXJGcm96ZW5Db2x1bW5PdmVybGF5cygpO1xuICAgIGlmICh0aGlzLnBlbmRpbmdQYXRjaEZyYW1lKSB7XG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5wZW5kaW5nUGF0Y2hGcmFtZSk7XG4gICAgICB0aGlzLnBlbmRpbmdQYXRjaEZyYW1lID0gMDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgbG9hZGVkID0gYXdhaXQgdGhpcy5sb2FkRGF0YSgpO1xuXG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi4obG9hZGVkPy5mcmVlemVGaXJzdENvbHVtbiA/PyB7fSksXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICB0aGlzLnNjaGVkdWxlQmFzZVBhdGNoUmVmcmVzaCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVN0eWxlcygpIHtcbiAgICBpZiAoIXRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LmlkID0gU1RZTEVfRUxFTUVOVF9JRDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5lbmFibGVkKSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICB0aGlzLmNsZWFyRnJvemVuQ29sdW1uT3ZlcmxheXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IHNlbGVjdG9yID0gKGNvbmZpZy5zZWxlY3RvciB8fCBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUikudHJpbSgpO1xuICAgIGNvbnN0IGRpdmlkZXIgPSBjb25maWcuc2hvd0RpdmlkZXJcbiAgICAgID8gXCJib3gtc2hhZG93OiAxcHggMCAwIHZhcigtLWJhY2tncm91bmQtbW9kaWZpZXItYm9yZGVyKTtcIlxuICAgICAgOiBcIlwiO1xuXG4gICAgdGhpcy5zdHlsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBgXG4ke3NlbGVjdG9yfSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuJHtzZWxlY3Rvcn0gLmJhc2VzLXRhYmxlIHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBvdmVyZmxvdy14OiBhdXRvO1xuICBtYXgtd2lkdGg6IDEwMCU7XG59XG5cbiR7c2VsZWN0b3J9IC5iYXNlcy10YWJsZSB0YWJsZSB7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICB3aWR0aDogbWF4LWNvbnRlbnQ7XG4gIG1pbi13aWR0aDogMTAwJTtcbiAgdGFibGUtbGF5b3V0OiBhdXRvO1xufVxuXG4ke3NlbGVjdG9yfSAub2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW92ZXJsYXkge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogMDtcbiAgbGVmdDogJHtjb25maWcubGVmdE9mZnNldFB4fXB4O1xuICB3aWR0aDogJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4O1xuICBoZWlnaHQ6IDEwMCU7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB6LWluZGV4OiAke2NvbmZpZy56SW5kZXh9O1xuICBiYWNrZ3JvdW5kOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICAke2RpdmlkZXJ9XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwcHgpO1xufVxuXG4ke3NlbGVjdG9yfSAub2JzaWRpYW4taG90Zml4ZXMtZmlyc3QtY29sdW1uLW92ZXJsYXkgdGFibGUge1xuICB3aWR0aDogJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4O1xuICBib3JkZXItY29sbGFwc2U6IHNlcGFyYXRlO1xuICBib3JkZXItc3BhY2luZzogMDtcbiAgdGFibGUtbGF5b3V0OiBmaXhlZDtcbn1cblxuJHtzZWxlY3Rvcn0gLm9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1vdmVybGF5IHRoLFxuJHtzZWxlY3Rvcn0gLm9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1vdmVybGF5IHRkLFxuJHtzZWxlY3Rvcn0gLmJhc2VzLXRkOmZpcnN0LW9mLXR5cGUsXG4ke3NlbGVjdG9yfSAuYmFzZXMtdGg6Zmlyc3Qtb2YtdHlwZSxcbiR7c2VsZWN0b3J9IHRhYmxlIHRyIHRkOmZpcnN0LWNoaWxkLFxuJHtzZWxlY3Rvcn0gdGFibGUgdHIgdGg6Zmlyc3QtY2hpbGQge1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuJHtzZWxlY3Rvcn0gLm9ic2lkaWFuLWhvdGZpeGVzLWhpZGUtb3JpZ2luYWwtZmlyc3QtY29sdW1uIHtcbiAgdmlzaWJpbGl0eTogaGlkZGVuO1xuICB3aWR0aDogJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4ICFpbXBvcnRhbnQ7XG4gIG1pbi13aWR0aDogMTIwcHggIWltcG9ydGFudDtcbiAgbWF4LXdpZHRoOiAke2NvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHh9cHggIWltcG9ydGFudDtcbn1cbmAudHJpbSgpO1xuXG4gICAgdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKTtcbiAgfVxuXG4gIHByaXZhdGUgc2NoZWR1bGVCYXNlUGF0Y2hSZWZyZXNoKCkge1xuICAgIGlmICghdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5lbmFibGVkKSB7XG4gICAgICB0aGlzLmNsZWFyRnJvemVuQ29sdW1uT3ZlcmxheXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMucGVuZGluZ1BhdGNoRnJhbWUpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5wZW5kaW5nUGF0Y2hGcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xuICAgICAgdGhpcy5wZW5kaW5nUGF0Y2hGcmFtZSA9IDA7XG4gICAgICB0aGlzLnJlZnJlc2hCYXNlUGF0Y2hlcygpO1xuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZWZyZXNoQmFzZVBhdGNoZXMoKSB7XG4gICAgdGhpcy5jbGVhckZyb3plbkNvbHVtbk92ZXJsYXlzKCk7XG5cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3Qgc2VsZWN0b3IgPSAoY29uZmlnLnNlbGVjdG9yIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SKS50cmltKCk7XG5cbiAgICBsZXQgcm9vdHM6IE5vZGVMaXN0T2Y8SFRNTEVsZW1lbnQ+O1xuICAgIHRyeSB7XG4gICAgICByb290cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJvb3RzLmZvckVhY2goKHJvb3QpID0+IHRoaXMucGF0Y2hCYXNlVmlldyhyb290KSk7XG4gIH1cblxuICBwcml2YXRlIHBhdGNoQmFzZVZpZXcocm9vdDogSFRNTEVsZW1lbnQpIHtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IHRhYmxlID0gcm9vdC5xdWVyeVNlbGVjdG9yPEhUTUxUYWJsZUVsZW1lbnQ+KFwidGFibGVcIik7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSByb290LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiLmJhc2VzLXRhYmxlXCIpID8/IHJvb3Q7XG4gICAgaWYgKCFjb250YWluZXIgfHwgIXRhYmxlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgcm93cyA9IHRoaXMuZ2V0VGFibGVGaXJzdENvbHVtblJvd3ModGFibGUpO1xuICAgIGlmICghcm93cy5sZW5ndGgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBvdmVybGF5ID0gdGhpcy5lbnN1cmVPdmVybGF5KGNvbnRhaW5lciwgdGFibGUpO1xuICAgIHRoaXMucmVuZGVyT3ZlcmxheVJvd3Mob3ZlcmxheS5xdWVyeVNlbGVjdG9yKFwidGFibGVcIikhLCByb3dzKTtcbiAgICB0aGlzLnN5bmNPdmVybGF5U3R5bGVzKG92ZXJsYXksIGNvbnRhaW5lciwgdGFibGUpO1xuICAgIHRoaXMuYmluZE92ZXJsYXlTY3JvbGxTeW5jKGNvbnRhaW5lciwgb3ZlcmxheSk7XG4gIH1cblxuICBwcml2YXRlIGdldFRhYmxlRmlyc3RDb2x1bW5Sb3dzKHRhYmxlOiBIVE1MVGFibGVFbGVtZW50KTogVGFibGVSb3dMaWtlW10ge1xuICAgIGNvbnN0IHJvd3MgPSB0YWJsZS5xdWVyeVNlbGVjdG9yQWxsPEhUTUxUYWJsZVJvd0VsZW1lbnQ+KFwidHJcIik7XG4gICAgY29uc3Qgcm93SW5mbzogVGFibGVSb3dMaWtlW10gPSBbXTtcblxuICAgIHJvd3MuZm9yRWFjaCgocm93KSA9PiB7XG4gICAgICBjb25zdCBmaXJzdENlbGwgPSByb3cucXVlcnlTZWxlY3RvcjxIVE1MVGFibGVDZWxsRWxlbWVudD4oXCI6c2NvcGUgPiB0ZDpmaXJzdC1jaGlsZCwgOnNjb3BlID4gdGg6Zmlyc3QtY2hpbGRcIik7XG4gICAgICBpZiAoIWZpcnN0Q2VsbCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHBhcmVudCA9IHJvdy5wYXJlbnRFbGVtZW50Py50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCBzZWN0aW9uID1cbiAgICAgICAgcGFyZW50ID09PSBcInRoZWFkXCJcbiAgICAgICAgICA/IFwidGhlYWRcIlxuICAgICAgICAgIDogcGFyZW50ID09PSBcInRib2R5XCJcbiAgICAgICAgICAgID8gXCJ0Ym9keVwiXG4gICAgICAgICAgICA6IHBhcmVudCA9PT0gXCJ0Zm9vdFwiXG4gICAgICAgICAgICAgID8gXCJ0Zm9vdFwiXG4gICAgICAgICAgICAgIDogXCJvdGhlclwiO1xuXG4gICAgICBmaXJzdENlbGwuY2xhc3NMaXN0LmFkZChcIm9ic2lkaWFuLWhvdGZpeGVzLWhpZGUtb3JpZ2luYWwtZmlyc3QtY29sdW1uXCIpO1xuICAgICAgZmlyc3RDZWxsLnN0eWxlLndpZHRoID0gYCR7dGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5maXJzdENvbHVtbk1heFdpZHRoUHh9cHhgO1xuICAgICAgZmlyc3RDZWxsLnN0eWxlLm1pbldpZHRoID0gXCIxMjBweFwiO1xuICAgICAgZmlyc3RDZWxsLnN0eWxlLm1heFdpZHRoID0gYCR7dGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5maXJzdENvbHVtbk1heFdpZHRoUHh9cHhgO1xuICAgICAgdGhpcy5mcm96ZW5DZWxsRWxlbWVudHMuYWRkKGZpcnN0Q2VsbCk7XG5cbiAgICAgIHJvd0luZm8ucHVzaCh7IHNvdXJjZVJvdzogcm93LCBmaXJzdENlbGwsIHNlY3Rpb24gfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcm93SW5mbztcbiAgfVxuXG4gIHByaXZhdGUgZW5zdXJlT3ZlcmxheShcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIHRhYmxlOiBIVE1MVGFibGVFbGVtZW50XG4gICk6IEhUTUxFbGVtZW50IHtcbiAgICBsZXQgb3ZlcmxheSA9IHRoaXMuYWN0aXZlT3ZlcmxheXMuZ2V0KGNvbnRhaW5lcik7XG4gICAgaWYgKCFvdmVybGF5KSB7XG4gICAgICBvdmVybGF5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgIG92ZXJsYXkuY2xhc3NOYW1lID0gXCJvYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tb3ZlcmxheVwiO1xuICAgICAgY29uc3Qgb3ZlcmxheVRhYmxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRhYmxlXCIpO1xuICAgICAgb3ZlcmxheS5hcHBlbmRDaGlsZChvdmVybGF5VGFibGUpO1xuICAgICAgY29udGFpbmVyLmFwcGVuZENoaWxkKG92ZXJsYXkpO1xuICAgICAgdGhpcy5hY3RpdmVPdmVybGF5cy5zZXQoY29udGFpbmVyLCBvdmVybGF5KTtcbiAgICB9XG4gICAgcmV0dXJuIG92ZXJsYXk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck92ZXJsYXlSb3dzKFxuICAgIG92ZXJsYXlUYWJsZTogSFRNTFRhYmxlRWxlbWVudCxcbiAgICByb3dzOiBUYWJsZVJvd0xpa2VbXVxuICApIHtcbiAgICBjb25zdCB0aGVhZCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0aGVhZFwiKTtcbiAgICBjb25zdCB0Ym9keSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Ym9keVwiKTtcbiAgICBjb25zdCB0Zm9vdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJ0Zm9vdFwiKTtcbiAgICBjb25zdCBvdGhlclJvd3M6IEhUTUxUYWJsZVJvd0VsZW1lbnRbXSA9IFtdO1xuXG4gICAgcm93cy5mb3JFYWNoKChyb3dMaWtlKSA9PiB7XG4gICAgICBjb25zdCBjbG9uZWRDZWxsID0gcm93TGlrZS5maXJzdENlbGwuY2xvbmVOb2RlKHRydWUpIGFzIEhUTUxUYWJsZUNlbGxFbGVtZW50O1xuICAgICAgY2xvbmVkQ2VsbC5jbGFzc0xpc3QuYWRkKFwib2JzaWRpYW4taG90Zml4ZXMtb3ZlcmxheS1jZWxsXCIpO1xuICAgICAgY29uc3QgY2xvbmVkUm93ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRyXCIpO1xuICAgICAgY2xvbmVkUm93LnN0eWxlLmhlaWdodCA9IGAke01hdGgubWF4KDEsIHJvd0xpa2Uuc291cmNlUm93LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCl9cHhgO1xuICAgICAgY2xvbmVkUm93LmFwcGVuZENoaWxkKGNsb25lZENlbGwpO1xuXG4gICAgICBzd2l0Y2ggKHJvd0xpa2Uuc2VjdGlvbikge1xuICAgICAgICBjYXNlIFwidGhlYWRcIjpcbiAgICAgICAgICB0aGVhZC5hcHBlbmRDaGlsZChjbG9uZWRSb3cpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwidGZvb3RcIjpcbiAgICAgICAgICB0Zm9vdC5hcHBlbmRDaGlsZChjbG9uZWRSb3cpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGlmIChyb3dMaWtlLnNlY3Rpb24gPT09IFwidGJvZHlcIikge1xuICAgICAgICAgICAgdGJvZHkuYXBwZW5kQ2hpbGQoY2xvbmVkUm93KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3RoZXJSb3dzLnB1c2goY2xvbmVkUm93KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBvdmVybGF5VGFibGUucmVwbGFjZUNoaWxkcmVuKCk7XG4gICAgaWYgKHRoZWFkLmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICBvdmVybGF5VGFibGUuYXBwZW5kQ2hpbGQodGhlYWQpO1xuICAgIH1cbiAgICBpZiAodGJvZHkuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIGlmIChvdGhlclJvd3MubGVuZ3RoKSB7XG4gICAgICAgIG90aGVyUm93cy5mb3JFYWNoKChyb3dMaWtlKSA9PiB0Ym9keS5hcHBlbmRDaGlsZChyb3dMaWtlKSk7XG4gICAgICB9XG4gICAgICBvdmVybGF5VGFibGUuYXBwZW5kQ2hpbGQodGJvZHkpO1xuICAgIH0gZWxzZSBpZiAob3RoZXJSb3dzLmxlbmd0aCkge1xuICAgICAgY29uc3QgZmFsbGJhY2tCb2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICAgICAgb3RoZXJSb3dzLmZvckVhY2goKHJvd0xpa2UpID0+IGZhbGxiYWNrQm9keS5hcHBlbmRDaGlsZChyb3dMaWtlKSk7XG4gICAgICBvdmVybGF5VGFibGUuYXBwZW5kQ2hpbGQoZmFsbGJhY2tCb2R5KTtcbiAgICB9XG4gICAgaWYgKHRmb290LmNoaWxkTm9kZXMubGVuZ3RoKSB7XG4gICAgICBvdmVybGF5VGFibGUuYXBwZW5kQ2hpbGQodGZvb3QpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc3luY092ZXJsYXlTdHlsZXMoXG4gICAgb3ZlcmxheTogSFRNTEVsZW1lbnQsXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICB0YWJsZTogSFRNTFRhYmxlRWxlbWVudFxuICApIHtcbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIG92ZXJsYXkuc3R5bGUud2lkdGggPSBgJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4YDtcbiAgICBvdmVybGF5LnN0eWxlLmxlZnQgPSBgJHtjb25maWcubGVmdE9mZnNldFB4fXB4YDtcbiAgICBvdmVybGF5LnN0eWxlLmhlaWdodCA9IGAke01hdGgubWF4KDEsIHRhYmxlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCl9cHhgO1xuICAgIHRoaXMuc3luY092ZXJsYXlTY3JvbGwoY29udGFpbmVyLCBvdmVybGF5KTtcbiAgfVxuXG4gIHByaXZhdGUgYmluZE92ZXJsYXlTY3JvbGxTeW5jKFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgb3ZlcmxheTogSFRNTEVsZW1lbnRcbiAgKSB7XG4gICAgaWYgKHRoaXMub3ZlcmxheVNjcm9sbEhhbmRsZXJzLmhhcyhjb250YWluZXIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlciA9ICgpID0+IHRoaXMuc3luY092ZXJsYXlTY3JvbGwoY29udGFpbmVyLCBvdmVybGF5KTtcbiAgICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcihcInNjcm9sbFwiLCBoYW5kbGVyLCB7IHBhc3NpdmU6IHRydWUgfSk7XG4gICAgdGhpcy5vdmVybGF5U2Nyb2xsSGFuZGxlcnMuc2V0KGNvbnRhaW5lciwgaGFuZGxlcik7XG4gIH1cblxuICBwcml2YXRlIHN5bmNPdmVybGF5U2Nyb2xsKGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsIG92ZXJsYXk6IEhUTUxFbGVtZW50KSB7XG4gICAgb3ZlcmxheS5zdHlsZS50cmFuc2Zvcm0gPSBgdHJhbnNsYXRlWCgke2NvbnRhaW5lci5zY3JvbGxMZWZ0fXB4KWA7XG4gIH1cblxuICBwcml2YXRlIGNsZWFyRnJvemVuQ29sdW1uT3ZlcmxheXMoKSB7XG4gICAgZm9yIChjb25zdCBjZWxsIG9mIHRoaXMuZnJvemVuQ2VsbEVsZW1lbnRzKSB7XG4gICAgICBjZWxsLmNsYXNzTGlzdC5yZW1vdmUoXCJvYnNpZGlhbi1ob3RmaXhlcy1oaWRlLW9yaWdpbmFsLWZpcnN0LWNvbHVtblwiKTtcbiAgICAgIGNlbGwuc3R5bGUud2lkdGggPSBcIlwiO1xuICAgICAgY2VsbC5zdHlsZS5taW5XaWR0aCA9IFwiXCI7XG4gICAgICBjZWxsLnN0eWxlLm1heFdpZHRoID0gXCJcIjtcbiAgICB9XG4gICAgdGhpcy5mcm96ZW5DZWxsRWxlbWVudHMuY2xlYXIoKTtcblxuICAgIGZvciAoY29uc3QgW2NvbnRhaW5lciwgb3ZlcmxheV0gb2YgdGhpcy5hY3RpdmVPdmVybGF5cykge1xuICAgICAgb3ZlcmxheS5yZW1vdmUoKTtcbiAgICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLm92ZXJsYXlTY3JvbGxIYW5kbGVycy5nZXQoY29udGFpbmVyKTtcbiAgICAgIGlmIChoYW5kbGVyKSB7XG4gICAgICAgIGNvbnRhaW5lci5yZW1vdmVFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIGhhbmRsZXIpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmFjdGl2ZU92ZXJsYXlzLmNsZWFyKCk7XG4gICAgdGhpcy5vdmVybGF5U2Nyb2xsSGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxufVxuXG5jbGFzcyBIb3RmaXhlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luO1xuICBwcml2YXRlIHNlbGVjdG9ySW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsZWZ0T2Zmc2V0SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRpdmlkZXJUb2dnbGVJbnB1dDogVG9nZ2xlQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWF4V2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldEhvdGZpeEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLnNlbGVjdG9ySW5wdXQpIHRoaXMuc2VsZWN0b3JJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMubGVmdE9mZnNldElucHV0KSB0aGlzLmxlZnRPZmZzZXRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCkgdGhpcy5kaXZpZGVyVG9nZ2xlSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gIH1cblxuICBkaXNwbGF5KCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJPYnNpZGlhbiBIb3RmaXhlc1wiIH0pO1xuXG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogXCJCYXNlczogRnJlZXplIGZpcnN0IGNvbHVtblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHNlY3Rpb24gPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudFwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBmaXJzdC1jb2x1bW4gZnJlZXplXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJLZWVwIHRoZSBmaXJzdCBjb2x1bW4gaW4gQmFzZXMgdGFibGUgdmlldyB2aXNpYmxlIHdoaWxlIHNjcm9sbGluZyBob3Jpem9udGFsbHkuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0SG90Zml4RW5hYmxlZCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJUYXJnZXQgc2VsZWN0b3JcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkNTUyBzZWxlY3RvciBmb3IgdGhlIEJhc2VzIGNvbnRhaW5lci4gRGVmYXVsdCB0YXJnZXRzIHRhYmxlIHZpZXctb25seSBCYXNlcy5cIlxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5zZWxlY3RvcklucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShzdGF0ZS5zZWxlY3Rvcik7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiB2YWx1ZSB8fCBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkxlZnQgb2Zmc2V0IChweClcIilcbiAgICAgIC5zZXREZXNjKFwiT3B0aW9uYWwgb2Zmc2V0IGZvciB0aGUgZnJvemVuIGNvbHVtbiBmcm9tIHRoZSBsZWZ0IGVkZ2UuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmxlZnRPZmZzZXRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmxlZnRPZmZzZXRQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiMFwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBsZWZ0T2Zmc2V0UHg6IHBhcnNlZCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkJhY2tncm91bmRcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkJhY2tncm91bmQgZm9yIHRoZSBmaXhlZCBmaXJzdCBjb2x1bW4gd2hpbGUgc2Nyb2xsaW5nIChDU1MgY29sb3Igb3IgdmFyaWFibGUpLlwiXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjpcbiAgICAgICAgICAgICAgdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdC1jb2x1bW4gbWF4IHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiQ2FwIHRoZSBmcm96ZW4gZmlyc3QtY29sdW1uIHdpZHRoIHRvIGF2b2lkIHRha2luZyB0b28gbXVjaCBzcGFjZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWF4V2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiMjgwXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcInotaW5kZXhcIilcbiAgICAgIC5zZXREZXNjKFwiei1pbmRleCB2YWx1ZSB1c2VkIGZvciBmcm96ZW4gZmlyc3QtY29sdW1uIG92ZXJsYXkuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnpJbmRleElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuekluZGV4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIzXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHpJbmRleDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiU2hvdyBkaXZpZGVyXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJEcmF3IGEgdGhpbiBkaXZpZGVyIGxpbmUgdG8gdGhlIHJpZ2h0IG9mIHRoZSBmcm96ZW4gZmlyc3QgY29sdW1uLlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdGhpcy5kaXZpZGVyVG9nZ2xlSW5wdXQgPSB0b2dnbGU7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5zaG93RGl2aWRlcik7XG4gICAgICAgIHRvZ2dsZS5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IHNob3dEaXZpZGVyOiB2YWx1ZSB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0SG90Zml4RW5hYmxlZChzdGF0ZS5lbmFibGVkKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7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
