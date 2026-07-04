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
    const rows = table.querySelectorAll("tr, .bases-tr");
    const rowInfo = [];
    rows.forEach((row) => {
      const firstCell = row.querySelector(
        ":scope > .bases-td:first-child, :scope > .bases-th:first-child, :scope > td:first-child, :scope > th:first-child"
      ) ?? row.querySelector(":scope > *:first-child");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SID0gXCIuYmFzZXMtdmlld1tkYXRhLXZpZXctdHlwZT0ndGFibGUnXVwiO1xuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsZWZ0T2Zmc2V0UHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBIb3RmaXhTZXR0aW5ncyB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzO1xufVxuXG5pbnRlcmZhY2UgVGFibGVSb3dMaWtlIHtcbiAgc291cmNlUm93OiBIVE1MRWxlbWVudDtcbiAgZmlyc3RDZWxsOiBIVE1MRWxlbWVudDtcbiAgc2VjdGlvbjogXCJ0aGVhZFwiIHwgXCJ0Ym9keVwiIHwgXCJ0Zm9vdFwiIHwgXCJvdGhlclwiO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBzZWxlY3RvcjogREVGQVVMVF9GSVJTVF9DT0xVTU5fU0VMRUNUT1IsXG4gICAgbGVmdE9mZnNldFB4OiAwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiAzLFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMjgwLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgcGVuZGluZ1BhdGNoRnJhbWUgPSAwO1xuICBwcml2YXRlIG11dGF0aW9uT2JzZXJ2ZXI6IE11dGF0aW9uT2JzZXJ2ZXIgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBmcm96ZW5DZWxsRWxlbWVudHMgPSBuZXcgU2V0PEhUTUxFbGVtZW50PigpO1xuICBwcml2YXRlIGFjdGl2ZU92ZXJsYXlzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnQ+KCk7XG4gIHByaXZhdGUgb3ZlcmxheVNjcm9sbEhhbmRsZXJzID0gbmV3IE1hcDxIVE1MRWxlbWVudCwgKGV2ZW50OiBFdmVudCkgPT4gdm9pZD4oKTtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgSG90Zml4ZXNTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMuYXBwbHlTdHlsZXMoKSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB7XG4gICAgICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMuc2NoZWR1bGVCYXNlUGF0Y2hSZWZyZXNoKCkpXG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJEb21FdmVudCh3aW5kb3csIFwicmVzaXplXCIsICgpID0+IHRoaXMuc2NoZWR1bGVCYXNlUGF0Y2hSZWZyZXNoKCkpO1xuXG4gICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT5cbiAgICAgIHRoaXMuc2NoZWR1bGVCYXNlUGF0Y2hSZWZyZXNoKClcbiAgICApO1xuICAgIHRoaXMubXV0YXRpb25PYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHtcbiAgICAgIGNoaWxkTGlzdDogdHJ1ZSxcbiAgICAgIHN1YnRyZWU6IHRydWUsXG4gICAgfSk7XG4gICAgdGhpcy5yZWdpc3RlcigoKSA9PiB0aGlzLm11dGF0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKSk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLmNsZWFyRnJvemVuQ29sdW1uT3ZlcmxheXMoKTtcbiAgICBpZiAodGhpcy5wZW5kaW5nUGF0Y2hGcmFtZSkge1xuICAgICAgd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKHRoaXMucGVuZGluZ1BhdGNoRnJhbWUpO1xuICAgICAgdGhpcy5wZW5kaW5nUGF0Y2hGcmFtZSA9IDA7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcblxuICAgIHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4gPSB7XG4gICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uLFxuICAgICAgLi4uKGxvYWRlZD8uZnJlZXplRmlyc3RDb2x1bW4gPz8ge30pLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gICAgdGhpcy5zY2hlZHVsZUJhc2VQYXRjaFJlZnJlc2goKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgdGhpcy5jbGVhckZyb3plbkNvbHVtbk92ZXJsYXlzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCBzZWxlY3RvciA9IChjb25maWcuc2VsZWN0b3IgfHwgREVGQVVMVF9GSVJTVF9DT0xVTU5fU0VMRUNUT1IpLnRyaW0oKTtcbiAgICBjb25zdCBkaXZpZGVyID0gY29uZmlnLnNob3dEaXZpZGVyXG4gICAgICA/IFwiYm94LXNoYWRvdzogMXB4IDAgMCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XCJcbiAgICAgIDogXCJcIjtcblxuICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID0gYFxuJHtzZWxlY3Rvcn0ge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbiR7c2VsZWN0b3J9IC5iYXNlcy10YWJsZSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgb3ZlcmZsb3cteDogYXV0bztcbiAgbWF4LXdpZHRoOiAxMDAlO1xufVxuXG4ke3NlbGVjdG9yfSAuYmFzZXMtdGFibGUgdGFibGUge1xuICBib3JkZXItY29sbGFwc2U6IHNlcGFyYXRlO1xuICBib3JkZXItc3BhY2luZzogMDtcbiAgd2lkdGg6IG1heC1jb250ZW50O1xuICBtaW4td2lkdGg6IDEwMCU7XG4gIHRhYmxlLWxheW91dDogYXV0bztcbn1cblxuJHtzZWxlY3Rvcn0gLm9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1vdmVybGF5IHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6ICR7Y29uZmlnLmxlZnRPZmZzZXRQeH1weDtcbiAgd2lkdGg6ICR7Y29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weDtcbiAgaGVpZ2h0OiAxMDAlO1xuICBwb2ludGVyLWV2ZW50czogbm9uZTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgei1pbmRleDogJHtjb25maWcuekluZGV4fTtcbiAgYmFja2dyb3VuZDogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgJHtkaXZpZGVyfVxuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMHB4KTtcbn1cblxuJHtzZWxlY3Rvcn0gLm9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1vdmVybGF5IHRhYmxlIHtcbiAgd2lkdGg6ICR7Y29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weDtcbiAgYm9yZGVyLWNvbGxhcHNlOiBzZXBhcmF0ZTtcbiAgYm9yZGVyLXNwYWNpbmc6IDA7XG4gIHRhYmxlLWxheW91dDogZml4ZWQ7XG59XG5cbiR7c2VsZWN0b3J9IC5vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tb3ZlcmxheSB0aCxcbiR7c2VsZWN0b3J9IC5vYnNpZGlhbi1ob3RmaXhlcy1maXJzdC1jb2x1bW4tb3ZlcmxheSB0ZCxcbiR7c2VsZWN0b3J9IC5iYXNlcy10ZDpmaXJzdC1vZi10eXBlLFxuJHtzZWxlY3Rvcn0gLmJhc2VzLXRoOmZpcnN0LW9mLXR5cGUsXG4ke3NlbGVjdG9yfSB0YWJsZSB0ciB0ZDpmaXJzdC1jaGlsZCxcbiR7c2VsZWN0b3J9IHRhYmxlIHRyIHRoOmZpcnN0LWNoaWxkIHtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG59XG5cbiR7c2VsZWN0b3J9IC5vYnNpZGlhbi1ob3RmaXhlcy1oaWRlLW9yaWdpbmFsLWZpcnN0LWNvbHVtbiB7XG4gIHZpc2liaWxpdHk6IGhpZGRlbjtcbiAgd2lkdGg6ICR7Y29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weCAhaW1wb3J0YW50O1xuICBtaW4td2lkdGg6IDEyMHB4ICFpbXBvcnRhbnQ7XG4gIG1heC13aWR0aDogJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4ICFpbXBvcnRhbnQ7XG59XG5gLnRyaW0oKTtcblxuICAgIHRoaXMuc2NoZWR1bGVCYXNlUGF0Y2hSZWZyZXNoKCk7XG4gIH1cblxuICBwcml2YXRlIHNjaGVkdWxlQmFzZVBhdGNoUmVmcmVzaCgpIHtcbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5jbGVhckZyb3plbkNvbHVtbk92ZXJsYXlzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICh0aGlzLnBlbmRpbmdQYXRjaEZyYW1lKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMucGVuZGluZ1BhdGNoRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHtcbiAgICAgIHRoaXMucGVuZGluZ1BhdGNoRnJhbWUgPSAwO1xuICAgICAgdGhpcy5yZWZyZXNoQmFzZVBhdGNoZXMoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVmcmVzaEJhc2VQYXRjaGVzKCkge1xuICAgIHRoaXMuY2xlYXJGcm96ZW5Db2x1bW5PdmVybGF5cygpO1xuXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmVuYWJsZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IHNlbGVjdG9yID0gKGNvbmZpZy5zZWxlY3RvciB8fCBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUikudHJpbSgpO1xuXG4gICAgbGV0IHJvb3RzOiBOb2RlTGlzdE9mPEhUTUxFbGVtZW50PjtcbiAgICB0cnkge1xuICAgICAgcm9vdHMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByb290cy5mb3JFYWNoKChyb290KSA9PiB0aGlzLnBhdGNoQmFzZVZpZXcocm9vdCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBwYXRjaEJhc2VWaWV3KHJvb3Q6IEhUTUxFbGVtZW50KSB7XG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCB0YWJsZSA9IHJvb3QucXVlcnlTZWxlY3RvcjxIVE1MVGFibGVFbGVtZW50PihcInRhYmxlXCIpO1xuXG4gICAgY29uc3QgY29udGFpbmVyID0gcm9vdC5xdWVyeVNlbGVjdG9yPEhUTUxFbGVtZW50PihcIi5iYXNlcy10YWJsZVwiKSA/PyByb290O1xuICAgIGlmICghY29udGFpbmVyIHx8ICF0YWJsZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHJvd3MgPSB0aGlzLmdldFRhYmxlRmlyc3RDb2x1bW5Sb3dzKHRhYmxlKTtcbiAgICBpZiAoIXJvd3MubGVuZ3RoKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qgb3ZlcmxheSA9IHRoaXMuZW5zdXJlT3ZlcmxheShjb250YWluZXIsIHRhYmxlKTtcbiAgICB0aGlzLnJlbmRlck92ZXJsYXlSb3dzKG92ZXJsYXkucXVlcnlTZWxlY3RvcihcInRhYmxlXCIpISwgcm93cyk7XG4gICAgdGhpcy5zeW5jT3ZlcmxheVN0eWxlcyhvdmVybGF5LCBjb250YWluZXIsIHRhYmxlKTtcbiAgICB0aGlzLmJpbmRPdmVybGF5U2Nyb2xsU3luYyhjb250YWluZXIsIG92ZXJsYXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRUYWJsZUZpcnN0Q29sdW1uUm93cyh0YWJsZTogSFRNTFRhYmxlRWxlbWVudCk6IFRhYmxlUm93TGlrZVtdIHtcbiAgICBjb25zdCByb3dzID0gdGFibGUucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4oXCJ0ciwgLmJhc2VzLXRyXCIpO1xuICAgIGNvbnN0IHJvd0luZm86IFRhYmxlUm93TGlrZVtdID0gW107XG5cbiAgICByb3dzLmZvckVhY2goKHJvdykgPT4ge1xuICAgICAgY29uc3QgZmlyc3RDZWxsID1cbiAgICAgICAgcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFxuICAgICAgICAgIFwiOnNjb3BlID4gLmJhc2VzLXRkOmZpcnN0LWNoaWxkLCA6c2NvcGUgPiAuYmFzZXMtdGg6Zmlyc3QtY2hpbGQsIDpzY29wZSA+IHRkOmZpcnN0LWNoaWxkLCA6c2NvcGUgPiB0aDpmaXJzdC1jaGlsZFwiXG4gICAgICAgICkgPz9cbiAgICAgICAgcm93LnF1ZXJ5U2VsZWN0b3I8SFRNTEVsZW1lbnQ+KFwiOnNjb3BlID4gKjpmaXJzdC1jaGlsZFwiKTtcbiAgICAgIGlmICghZmlyc3RDZWxsKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcGFyZW50ID0gcm93LnBhcmVudEVsZW1lbnQ/LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IHNlY3Rpb24gPVxuICAgICAgICBwYXJlbnQgPT09IFwidGhlYWRcIlxuICAgICAgICAgID8gXCJ0aGVhZFwiXG4gICAgICAgICAgOiBwYXJlbnQgPT09IFwidGJvZHlcIlxuICAgICAgICAgICAgPyBcInRib2R5XCJcbiAgICAgICAgICAgIDogcGFyZW50ID09PSBcInRmb290XCJcbiAgICAgICAgICAgICAgPyBcInRmb290XCJcbiAgICAgICAgICAgICAgOiBcIm90aGVyXCI7XG5cbiAgICAgIGZpcnN0Q2VsbC5jbGFzc0xpc3QuYWRkKFwib2JzaWRpYW4taG90Zml4ZXMtaGlkZS1vcmlnaW5hbC1maXJzdC1jb2x1bW5cIik7XG4gICAgICBmaXJzdENlbGwuc3R5bGUud2lkdGggPSBgJHt0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weGA7XG4gICAgICBmaXJzdENlbGwuc3R5bGUubWluV2lkdGggPSBcIjEyMHB4XCI7XG4gICAgICBmaXJzdENlbGwuc3R5bGUubWF4V2lkdGggPSBgJHt0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weGA7XG4gICAgICB0aGlzLmZyb3plbkNlbGxFbGVtZW50cy5hZGQoZmlyc3RDZWxsKTtcblxuICAgICAgcm93SW5mby5wdXNoKHsgc291cmNlUm93OiByb3csIGZpcnN0Q2VsbCwgc2VjdGlvbiB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiByb3dJbmZvO1xuICB9XG5cbiAgcHJpdmF0ZSBlbnN1cmVPdmVybGF5KFxuICAgIGNvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgdGFibGU6IEhUTUxUYWJsZUVsZW1lbnRcbiAgKTogSFRNTEVsZW1lbnQge1xuICAgIGxldCBvdmVybGF5ID0gdGhpcy5hY3RpdmVPdmVybGF5cy5nZXQoY29udGFpbmVyKTtcbiAgICBpZiAoIW92ZXJsYXkpIHtcbiAgICAgIG92ZXJsYXkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuICAgICAgb3ZlcmxheS5jbGFzc05hbWUgPSBcIm9ic2lkaWFuLWhvdGZpeGVzLWZpcnN0LWNvbHVtbi1vdmVybGF5XCI7XG4gICAgICBjb25zdCBvdmVybGF5VGFibGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGFibGVcIik7XG4gICAgICBvdmVybGF5LmFwcGVuZENoaWxkKG92ZXJsYXlUYWJsZSk7XG4gICAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQob3ZlcmxheSk7XG4gICAgICB0aGlzLmFjdGl2ZU92ZXJsYXlzLnNldChjb250YWluZXIsIG92ZXJsYXkpO1xuICAgIH1cbiAgICByZXR1cm4gb3ZlcmxheTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyT3ZlcmxheVJvd3MoXG4gICAgb3ZlcmxheVRhYmxlOiBIVE1MVGFibGVFbGVtZW50LFxuICAgIHJvd3M6IFRhYmxlUm93TGlrZVtdXG4gICkge1xuICAgIGNvbnN0IHRoZWFkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRoZWFkXCIpO1xuICAgIGNvbnN0IHRib2R5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRib2R5XCIpO1xuICAgIGNvbnN0IHRmb290ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRmb290XCIpO1xuICAgIGNvbnN0IG90aGVyUm93czogSFRNTFRhYmxlUm93RWxlbWVudFtdID0gW107XG5cbiAgICByb3dzLmZvckVhY2goKHJvd0xpa2UpID0+IHtcbiAgICAgIGNvbnN0IGNsb25lZENlbGwgPSByb3dMaWtlLmZpcnN0Q2VsbC5jbG9uZU5vZGUodHJ1ZSkgYXMgSFRNTFRhYmxlQ2VsbEVsZW1lbnQ7XG4gICAgICBjbG9uZWRDZWxsLmNsYXNzTGlzdC5hZGQoXCJvYnNpZGlhbi1ob3RmaXhlcy1vdmVybGF5LWNlbGxcIik7XG4gICAgICBjb25zdCBjbG9uZWRSb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidHJcIik7XG4gICAgICBjbG9uZWRSb3cuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5tYXgoMSwgcm93TGlrZS5zb3VyY2VSb3cuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0KX1weGA7XG4gICAgICBjbG9uZWRSb3cuYXBwZW5kQ2hpbGQoY2xvbmVkQ2VsbCk7XG5cbiAgICAgIHN3aXRjaCAocm93TGlrZS5zZWN0aW9uKSB7XG4gICAgICAgIGNhc2UgXCJ0aGVhZFwiOlxuICAgICAgICAgIHRoZWFkLmFwcGVuZENoaWxkKGNsb25lZFJvdyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJ0Zm9vdFwiOlxuICAgICAgICAgIHRmb290LmFwcGVuZENoaWxkKGNsb25lZFJvdyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKHJvd0xpa2Uuc2VjdGlvbiA9PT0gXCJ0Ym9keVwiKSB7XG4gICAgICAgICAgICB0Ym9keS5hcHBlbmRDaGlsZChjbG9uZWRSb3cpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBvdGhlclJvd3MucHVzaChjbG9uZWRSb3cpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIG92ZXJsYXlUYWJsZS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgICBpZiAodGhlYWQuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIG92ZXJsYXlUYWJsZS5hcHBlbmRDaGlsZCh0aGVhZCk7XG4gICAgfVxuICAgIGlmICh0Ym9keS5jaGlsZE5vZGVzLmxlbmd0aCkge1xuICAgICAgaWYgKG90aGVyUm93cy5sZW5ndGgpIHtcbiAgICAgICAgb3RoZXJSb3dzLmZvckVhY2goKHJvd0xpa2UpID0+IHRib2R5LmFwcGVuZENoaWxkKHJvd0xpa2UpKTtcbiAgICAgIH1cbiAgICAgIG92ZXJsYXlUYWJsZS5hcHBlbmRDaGlsZCh0Ym9keSk7XG4gICAgfSBlbHNlIGlmIChvdGhlclJvd3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCBmYWxsYmFja0JvZHkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwidGJvZHlcIik7XG4gICAgICBvdGhlclJvd3MuZm9yRWFjaCgocm93TGlrZSkgPT4gZmFsbGJhY2tCb2R5LmFwcGVuZENoaWxkKHJvd0xpa2UpKTtcbiAgICAgIG92ZXJsYXlUYWJsZS5hcHBlbmRDaGlsZChmYWxsYmFja0JvZHkpO1xuICAgIH1cbiAgICBpZiAodGZvb3QuY2hpbGROb2Rlcy5sZW5ndGgpIHtcbiAgICAgIG92ZXJsYXlUYWJsZS5hcHBlbmRDaGlsZCh0Zm9vdCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzeW5jT3ZlcmxheVN0eWxlcyhcbiAgICBvdmVybGF5OiBIVE1MRWxlbWVudCxcbiAgICBjb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIHRhYmxlOiBIVE1MVGFibGVFbGVtZW50XG4gICkge1xuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgb3ZlcmxheS5zdHlsZS53aWR0aCA9IGAke2NvbmZpZy5maXJzdENvbHVtbk1heFdpZHRoUHh9cHhgO1xuICAgIG92ZXJsYXkuc3R5bGUubGVmdCA9IGAke2NvbmZpZy5sZWZ0T2Zmc2V0UHh9cHhgO1xuICAgIG92ZXJsYXkuc3R5bGUuaGVpZ2h0ID0gYCR7TWF0aC5tYXgoMSwgdGFibGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0KX1weGA7XG4gICAgdGhpcy5zeW5jT3ZlcmxheVNjcm9sbChjb250YWluZXIsIG92ZXJsYXkpO1xuICB9XG5cbiAgcHJpdmF0ZSBiaW5kT3ZlcmxheVNjcm9sbFN5bmMoXG4gICAgY29udGFpbmVyOiBIVE1MRWxlbWVudCxcbiAgICBvdmVybGF5OiBIVE1MRWxlbWVudFxuICApIHtcbiAgICBpZiAodGhpcy5vdmVybGF5U2Nyb2xsSGFuZGxlcnMuaGFzKGNvbnRhaW5lcikpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gKCkgPT4gdGhpcy5zeW5jT3ZlcmxheVNjcm9sbChjb250YWluZXIsIG92ZXJsYXkpO1xuICAgIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKFwic2Nyb2xsXCIsIGhhbmRsZXIsIHsgcGFzc2l2ZTogdHJ1ZSB9KTtcbiAgICB0aGlzLm92ZXJsYXlTY3JvbGxIYW5kbGVycy5zZXQoY29udGFpbmVyLCBoYW5kbGVyKTtcbiAgfVxuXG4gIHByaXZhdGUgc3luY092ZXJsYXlTY3JvbGwoY29udGFpbmVyOiBIVE1MRWxlbWVudCwgb3ZlcmxheTogSFRNTEVsZW1lbnQpIHtcbiAgICBvdmVybGF5LnN0eWxlLnRyYW5zZm9ybSA9IGB0cmFuc2xhdGVYKCR7Y29udGFpbmVyLnNjcm9sbExlZnR9cHgpYDtcbiAgfVxuXG4gIHByaXZhdGUgY2xlYXJGcm96ZW5Db2x1bW5PdmVybGF5cygpIHtcbiAgICBmb3IgKGNvbnN0IGNlbGwgb2YgdGhpcy5mcm96ZW5DZWxsRWxlbWVudHMpIHtcbiAgICAgIGNlbGwuY2xhc3NMaXN0LnJlbW92ZShcIm9ic2lkaWFuLWhvdGZpeGVzLWhpZGUtb3JpZ2luYWwtZmlyc3QtY29sdW1uXCIpO1xuICAgICAgY2VsbC5zdHlsZS53aWR0aCA9IFwiXCI7XG4gICAgICBjZWxsLnN0eWxlLm1pbldpZHRoID0gXCJcIjtcbiAgICAgIGNlbGwuc3R5bGUubWF4V2lkdGggPSBcIlwiO1xuICAgIH1cbiAgICB0aGlzLmZyb3plbkNlbGxFbGVtZW50cy5jbGVhcigpO1xuXG4gICAgZm9yIChjb25zdCBbY29udGFpbmVyLCBvdmVybGF5XSBvZiB0aGlzLmFjdGl2ZU92ZXJsYXlzKSB7XG4gICAgICBvdmVybGF5LnJlbW92ZSgpO1xuICAgICAgY29uc3QgaGFuZGxlciA9IHRoaXMub3ZlcmxheVNjcm9sbEhhbmRsZXJzLmdldChjb250YWluZXIpO1xuICAgICAgaWYgKGhhbmRsZXIpIHtcbiAgICAgICAgY29udGFpbmVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJzY3JvbGxcIiwgaGFuZGxlcik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuYWN0aXZlT3ZlcmxheXMuY2xlYXIoKTtcbiAgICB0aGlzLm92ZXJsYXlTY3JvbGxIYW5kbGVycy5jbGVhcigpO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oXG4gICAgdXBkYXRlczogUGFydGlhbDxGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzPlxuICApIHtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4udGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgc2VsZWN0b3JJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxlZnRPZmZzZXRJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJhY2tncm91bmRJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHpJbmRleElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZGl2aWRlclRvZ2dsZUlucHV0OiBUb2dnbGVDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBtYXhXaWR0aElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbikge1xuICAgIHN1cGVyKGFwcCwgcGx1Z2luKTtcbiAgICB0aGlzLnBsdWdpbiA9IHBsdWdpbjtcbiAgfVxuXG4gIHByaXZhdGUgc2V0SG90Zml4RW5hYmxlZChlbmFibGVkOiBib29sZWFuKSB7XG4gICAgaWYgKHRoaXMuc2VsZWN0b3JJbnB1dCkgdGhpcy5zZWxlY3RvcklucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5sZWZ0T2Zmc2V0SW5wdXQpIHRoaXMubGVmdE9mZnNldElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5iYWNrZ3JvdW5kSW5wdXQpIHRoaXMuYmFja2dyb3VuZElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy56SW5kZXhJbnB1dCkgdGhpcy56SW5kZXhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuZGl2aWRlclRvZ2dsZUlucHV0KSB0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMubWF4V2lkdGhJbnB1dCkgdGhpcy5tYXhXaWR0aElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk9ic2lkaWFuIEhvdGZpeGVzXCIgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBcIkJhc2VzOiBGcmVlemUgZmlyc3QgY29sdW1uXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGZpcnN0LWNvbHVtbiBmcmVlemVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIktlZXAgdGhlIGZpcnN0IGNvbHVtbiBpbiBCYXNlcyB0YWJsZSB2aWV3IHZpc2libGUgd2hpbGUgc2Nyb2xsaW5nIGhvcml6b250YWxseS5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgZW5hYmxlZDogdmFsdWUgfSk7XG4gICAgICAgICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlRhcmdldCBzZWxlY3RvclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQ1NTIHNlbGVjdG9yIGZvciB0aGUgQmFzZXMgY29udGFpbmVyLiBEZWZhdWx0IHRhcmdldHMgdGFibGUgdmlldy1vbmx5IEJhc2VzLlwiXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnNlbGVjdG9ySW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHN0YXRlLnNlbGVjdG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgc2VsZWN0b3I6IHZhbHVlIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiTGVmdCBvZmZzZXQgKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJPcHRpb25hbCBvZmZzZXQgZm9yIHRoZSBmcm96ZW4gY29sdW1uIGZyb20gdGhlIGxlZnQgZWRnZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubGVmdE9mZnNldElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUubGVmdE9mZnNldFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIwXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGxlZnRPZmZzZXRQeDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiQmFja2dyb3VuZFwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQmFja2dyb3VuZCBmb3IgdGhlIGZpeGVkIGZpcnN0IGNvbHVtbiB3aGlsZSBzY3JvbGxpbmcgKENTUyBjb2xvciBvciB2YXJpYWJsZSkuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShzdGF0ZS5iYWNrZ3JvdW5kQ29sb3IpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOlxuICAgICAgICAgICAgICB2YWx1ZSB8fCBERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkZpcnN0LWNvbHVtbiBtYXggd2lkdGggKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJDYXAgdGhlIGZyb3plbiBmaXJzdC1jb2x1bW4gd2lkdGggdG8gYXZvaWQgdGFraW5nIHRvbyBtdWNoIHNwYWNlLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5tYXhXaWR0aElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUuZmlyc3RDb2x1bW5NYXhXaWR0aFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIyODBcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpIHx8IHBhcnNlZCA8IDgwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogcGFyc2VkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiei1pbmRleFwiKVxuICAgICAgLnNldERlc2MoXCJ6LWluZGV4IHZhbHVlIHVzZWQgZm9yIGZyb3plbiBmaXJzdC1jb2x1bW4gb3ZlcmxheS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjNcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRyYXcgYSB0aGluIGRpdmlkZXIgbGluZSB0byB0aGUgcmlnaHQgb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCA9IHRvZ2dsZTtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLnNob3dEaXZpZGVyKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgc2hvd0RpdmlkZXI6IHZhbHVlIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHN0YXRlLmVuYWJsZWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFPTztBQUVQLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0sbUJBQW1CO0FBc0J6QixJQUFNLG1CQUFtQztBQUFBLEVBQ3ZDLG1CQUFtQjtBQUFBLElBQ2pCLFNBQVM7QUFBQSxJQUNULFVBQVU7QUFBQSxJQUNWLGNBQWM7QUFBQSxJQUNkLGlCQUFpQjtBQUFBLElBQ2pCLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxJQUNiLHVCQUF1QjtBQUFBLEVBQ3pCO0FBQ0Y7QUFFQSxJQUFxQix5QkFBckIsY0FBb0QsdUJBQU87QUFBQSxFQUN6RCxXQUEyQjtBQUFBLElBQ3pCLG1CQUFtQixFQUFFLEdBQUcsaUJBQWlCLGtCQUFrQjtBQUFBLEVBQzdEO0FBQUEsRUFDUSxlQUF3QztBQUFBLEVBQ3hDLG9CQUFvQjtBQUFBLEVBQ3BCLG1CQUE0QztBQUFBLEVBQzVDLHFCQUFxQixvQkFBSSxJQUFpQjtBQUFBLEVBQzFDLGlCQUFpQixvQkFBSSxJQUE4QjtBQUFBLEVBQ25ELHdCQUF3QixvQkFBSSxJQUF5QztBQUFBLEVBRTdFLE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBQ3hCLFNBQUssWUFBWTtBQUNqQixTQUFLLHlCQUF5QjtBQUU5QixTQUFLLGNBQWMsSUFBSSxtQkFBbUIsS0FBSyxLQUFLLElBQUksQ0FBQztBQUV6RCxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLGlCQUFpQixNQUFNLEtBQUssWUFBWSxDQUFDO0FBQUEsSUFDakU7QUFDQSxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLHNCQUFzQixNQUFNO0FBQ2hELGFBQUssWUFB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
