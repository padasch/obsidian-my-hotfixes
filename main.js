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
    showDivider: true
  }
};
var ObsidianHotfixesPlugin = class extends import_obsidian.Plugin {
  settings = structuredClone(DEFAULT_SETTINGS);
  styleElement = null;
  async onload() {
    await this.loadSettings();
    this.applyStyles();
    this.addSettingTab(new HotfixesSettingTab(this.app, this));
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.applyStyles())
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.applyStyles())
    );
  }
  onunload() {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
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
  }
  applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = STYLE_ELEMENT_ID;
      document.head.appendChild(this.styleElement);
    }
    if (!this.settings.freezeFirstColumn.enabled) {
      this.styleElement.textContent = "";
      return;
    }
    const config = this.settings.freezeFirstColumn;
    const safeSelector = (config.selector || DEFAULT_FIRST_COLUMN_SELECTOR).trim();
    const divider = config.showDivider ? "box-shadow: 1px 0 0 var(--background-modifier-border);" : "";
    this.styleElement.textContent = `
${safeSelector} {
  overflow-x: auto;
}

${safeSelector} .bases-td:first-of-type,
${safeSelector} .bases-th:first-of-type,
${safeSelector} table tr td:first-child,
${safeSelector} table tr th:first-child {
  position: sticky;
  left: ${config.leftOffsetPx}px;
  background: ${config.backgroundColor};
  z-index: ${config.zIndex};
  ${divider}
}

${safeSelector} .bases-th:first-of-type,
${safeSelector} thead th:first-child {
  z-index: ${config.zIndex + 1};
}
`.trim();
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
      this.enableToggleComponent = toggle;
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
    new import_obsidian.Setting(section).setName("z-index").setDesc("z-index value used for sticky first-column cells.").addText((text) => {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SID0gXCIuYmFzZXMtdmlld1tkYXRhLXZpZXctdHlwZT0ndGFibGUnXVwiO1xuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsZWZ0T2Zmc2V0UHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEhvdGZpeFNldHRpbmdzIHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIHNlbGVjdG9yOiBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUixcbiAgICBsZWZ0T2Zmc2V0UHg6IDAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDMsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0gc3RydWN0dXJlZENsb25lKERFRkFVTFRfU0VUVElOR1MpO1xuICBwcml2YXRlIHN0eWxlRWxlbWVudDogSFRNTFN0eWxlRWxlbWVudCB8IG51bGwgPSBudWxsO1xuXG4gIGFzeW5jIG9ubG9hZCgpIHtcbiAgICBhd2FpdCB0aGlzLmxvYWRTZXR0aW5ncygpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcblxuICAgIHRoaXMuYWRkU2V0dGluZ1RhYihuZXcgSG90Zml4ZXNTZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJsYXlvdXQtY2hhbmdlXCIsICgpID0+IHRoaXMuYXBwbHlTdHlsZXMoKSlcbiAgICApO1xuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImFjdGl2ZS1sZWFmLWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgfVxuXG4gIG9udW5sb2FkKCkge1xuICAgIGlmICh0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQucmVtb3ZlKCk7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IG51bGw7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgbG9hZFNldHRpbmdzKCkge1xuICAgIGNvbnN0IGxvYWRlZCA9IGF3YWl0IHRoaXMubG9hZERhdGEoKTtcblxuICAgIHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4gPSB7XG4gICAgICAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uLFxuICAgICAgLi4uKGxvYWRlZD8uZnJlZXplRmlyc3RDb2x1bW4gPz8ge30pLFxuICAgIH07XG4gIH1cblxuICBhc3luYyBzYXZlU2V0dGluZ3MoKSB7XG4gICAgYXdhaXQgdGhpcy5zYXZlRGF0YSh0aGlzLnNldHRpbmdzKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG4gIH1cblxuICBwcml2YXRlIGFwcGx5U3R5bGVzKCkge1xuICAgIGlmICghdGhpcy5zdHlsZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQuaWQgPSBTVFlMRV9FTEVNRU5UX0lEO1xuICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZCh0aGlzLnN0eWxlRWxlbWVudCk7XG4gICAgfVxuXG4gICAgaWYgKCF0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLmVuYWJsZWQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb25maWcgPSB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuICAgIGNvbnN0IHNhZmVTZWxlY3RvciA9IChjb25maWcuc2VsZWN0b3IgfHwgREVGQVVMVF9GSVJTVF9DT0xVTU5fU0VMRUNUT1IpLnRyaW0oKTtcbiAgICBjb25zdCBkaXZpZGVyID0gY29uZmlnLnNob3dEaXZpZGVyXG4gICAgICA/IFwiYm94LXNoYWRvdzogMXB4IDAgMCB2YXIoLS1iYWNrZ3JvdW5kLW1vZGlmaWVyLWJvcmRlcik7XCJcbiAgICAgIDogXCJcIjtcblxuICAgIHRoaXMuc3R5bGVFbGVtZW50LnRleHRDb250ZW50ID0gYFxuJHtzYWZlU2VsZWN0b3J9IHtcbiAgb3ZlcmZsb3cteDogYXV0bztcbn1cblxuJHtzYWZlU2VsZWN0b3J9IC5iYXNlcy10ZDpmaXJzdC1vZi10eXBlLFxuJHtzYWZlU2VsZWN0b3J9IC5iYXNlcy10aDpmaXJzdC1vZi10eXBlLFxuJHtzYWZlU2VsZWN0b3J9IHRhYmxlIHRyIHRkOmZpcnN0LWNoaWxkLFxuJHtzYWZlU2VsZWN0b3J9IHRhYmxlIHRyIHRoOmZpcnN0LWNoaWxkIHtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgbGVmdDogJHtjb25maWcubGVmdE9mZnNldFB4fXB4O1xuICBiYWNrZ3JvdW5kOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICB6LWluZGV4OiAke2NvbmZpZy56SW5kZXh9O1xuICAke2RpdmlkZXJ9XG59XG5cbiR7c2FmZVNlbGVjdG9yfSAuYmFzZXMtdGg6Zmlyc3Qtb2YtdHlwZSxcbiR7c2FmZVNlbGVjdG9yfSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIHotaW5kZXg6ICR7Y29uZmlnLnpJbmRleCArIDF9O1xufVxuYC50cmltKCk7XG4gIH1cblxuICBhc3luYyB1cGRhdGVGcmVlemVGaXJzdENvbHVtbihcbiAgICB1cGRhdGVzOiBQYXJ0aWFsPEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M+XG4gICkge1xuICAgIHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4gPSB7XG4gICAgICAuLi50aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uLFxuICAgICAgLi4udXBkYXRlcyxcbiAgICB9O1xuICAgIGF3YWl0IHRoaXMuc2F2ZVNldHRpbmdzKCk7XG4gIH1cbn1cblxuY2xhc3MgSG90Zml4ZXNTZXR0aW5nVGFiIGV4dGVuZHMgUGx1Z2luU2V0dGluZ1RhYiB7XG4gIHBsdWdpbjogT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbjtcbiAgcHJpdmF0ZSBzZWxlY3RvcklucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbGVmdE9mZnNldElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgYmFja2dyb3VuZElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgekluZGV4SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBkaXZpZGVyVG9nZ2xlSW5wdXQ6IFRvZ2dsZUNvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldEhvdGZpeEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLnNlbGVjdG9ySW5wdXQpIHRoaXMuc2VsZWN0b3JJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMubGVmdE9mZnNldElucHV0KSB0aGlzLmxlZnRPZmZzZXRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCkgdGhpcy5kaXZpZGVyVG9nZ2xlSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICB9XG5cbiAgZGlzcGxheSgpIHtcbiAgICBjb25zdCB7IGNvbnRhaW5lckVsIH0gPSB0aGlzO1xuICAgIGNvbnRhaW5lckVsLmVtcHR5KCk7XG4gICAgY29udGFpbmVyRWwuY3JlYXRlRWwoXCJoMlwiLCB7IHRleHQ6IFwiT2JzaWRpYW4gSG90Zml4ZXNcIiB9KTtcblxuICAgIGNvbnN0IGRldGFpbHMgPSBjb250YWluZXJFbC5jcmVhdGVFbChcImRldGFpbHNcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvblwiLFxuICAgIH0pO1xuICAgIGRldGFpbHMuY3JlYXRlRWwoXCJzdW1tYXJ5XCIsIHtcbiAgICAgIHRleHQ6IFwiQmFzZXM6IEZyZWV6ZSBmaXJzdCBjb2x1bW5cIixcbiAgICB9KTtcbiAgICBjb25zdCBzZWN0aW9uID0gZGV0YWlscy5jcmVhdGVFbChcImRpdlwiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uLWNvbnRlbnRcIixcbiAgICB9KTtcblxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5wbHVnaW4uc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJFbmFibGUgZmlyc3QtY29sdW1uIGZyZWV6ZVwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiS2VlcCB0aGUgZmlyc3QgY29sdW1uIGluIEJhc2VzIHRhYmxlIHZpZXcgdmlzaWJsZSB3aGlsZSBzY3JvbGxpbmcgaG9yaXpvbnRhbGx5LlwiXG4gICAgICApXG4gICAgICAuYWRkVG9nZ2xlKCh0b2dnbGUpID0+IHtcbiAgICAgICAgdGhpcy5lbmFibGVUb2dnbGVDb21wb25lbnQgPSB0b2dnbGU7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgZW5hYmxlZDogdmFsdWUgfSk7XG4gICAgICAgICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlRhcmdldCBzZWxlY3RvclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQ1NTIHNlbGVjdG9yIGZvciB0aGUgQmFzZXMgY29udGFpbmVyLiBEZWZhdWx0IHRhcmdldHMgdGFibGUgdmlldy1vbmx5IEJhc2VzLlwiXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnNlbGVjdG9ySW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHN0YXRlLnNlbGVjdG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgc2VsZWN0b3I6IHZhbHVlIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiTGVmdCBvZmZzZXQgKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJPcHRpb25hbCBvZmZzZXQgZm9yIHRoZSBmcm96ZW4gY29sdW1uIGZyb20gdGhlIGxlZnQgZWRnZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubGVmdE9mZnNldElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUubGVmdE9mZnNldFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIwXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGxlZnRPZmZzZXRQeDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiQmFja2dyb3VuZFwiKVxuICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICBcIkJhY2tncm91bmQgZm9yIHRoZSBmaXhlZCBmaXJzdCBjb2x1bW4gd2hpbGUgc2Nyb2xsaW5nIChDU1MgY29sb3Igb3IgdmFyaWFibGUpLlwiXG4gICAgICAgIClcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjpcbiAgICAgICAgICAgICAgdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcInotaW5kZXggdmFsdWUgdXNlZCBmb3Igc3RpY2t5IGZpcnN0LWNvbHVtbiBjZWxscy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjNcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRyYXcgYSB0aGluIGRpdmlkZXIgbGluZSB0byB0aGUgcmlnaHQgb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCA9IHRvZ2dsZTtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLnNob3dEaXZpZGVyKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgc2hvd0RpdmlkZXI6IHZhbHVlIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHN0YXRlLmVuYWJsZWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFPTztBQUVQLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0sbUJBQW1CO0FBZXpCLElBQU0sbUJBQW1DO0FBQUEsRUFDdkMsbUJBQW1CO0FBQUEsSUFDakIsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsY0FBYztBQUFBLElBQ2QsaUJBQWlCO0FBQUEsSUFDakIsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLEVBQ2Y7QUFDRjtBQUVBLElBQXFCLHlCQUFyQixjQUFvRCx1QkFBTztBQUFBLEVBQ3pELFdBQTJCLGdCQUFnQixnQkFBZ0I7QUFBQSxFQUNuRCxlQUF3QztBQUFBLEVBRWhELE1BQU0sU0FBUztBQUNiLFVBQU0sS0FBSyxhQUFhO0FBQ3hCLFNBQUssWUFBWTtBQUVqQixTQUFLLGNBQWMsSUFBSSxtQkFBbUIsS0FBSyxLQUFLLElBQUksQ0FBQztBQUV6RCxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLGlCQUFpQixNQUFNLEtBQUssWUFBWSxDQUFDO0FBQUEsSUFDakU7QUFDQSxTQUFLO0FBQUEsTUFDSCxLQUFLLElBQUksVUFBVSxHQUFHLHNCQUFzQixNQUFNLEtBQUssWUFBWSxDQUFDO0FBQUEsSUFDdEU7QUFBQSxFQUNGO0FBQUEsRUFFQSxXQUFXO0FBQ1QsUUFBSSxLQUFLLGNBQWM7QUFDckIsV0FBSyxhQUFhLE9BQU87QUFDekIsV0FBSyxlQUFlO0FBQUEsSUFDdEI7QUFBQSxFQUNGO0FBQUEsRUFFQSxNQUFNLGVBQWU7QUFDbkIsVUFBTSxTQUFTLE1BQU0sS0FBSyxTQUFTO0FBRW5DLFNBQUssU0FBUyxvQkFBb0I7QUFBQSxNQUNoQyxHQUFHLGlC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
