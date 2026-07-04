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
  settings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn }
  };
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SID0gXCIuYmFzZXMtdmlld1tkYXRhLXZpZXctdHlwZT0ndGFibGUnXVwiO1xuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsZWZ0T2Zmc2V0UHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIEhvdGZpeFNldHRpbmdzIHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3M7XG59XG5cbmNvbnN0IERFRkFVTFRfU0VUVElOR1M6IEhvdGZpeFNldHRpbmdzID0ge1xuICBmcmVlemVGaXJzdENvbHVtbjoge1xuICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgIHNlbGVjdG9yOiBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUixcbiAgICBsZWZ0T2Zmc2V0UHg6IDAsXG4gICAgYmFja2dyb3VuZENvbG9yOiBcInZhcigtLWJhY2tncm91bmQtcHJpbWFyeSlcIixcbiAgICB6SW5kZXg6IDMsXG4gICAgc2hvd0RpdmlkZXI6IHRydWUsXG4gIH0sXG59O1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgc2V0dGluZ3M6IEhvdGZpeFNldHRpbmdzID0ge1xuICAgIGZyZWV6ZUZpcnN0Q29sdW1uOiB7IC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4gfSxcbiAgfTtcbiAgcHJpdmF0ZSBzdHlsZUVsZW1lbnQ6IEhUTUxTdHlsZUVsZW1lbnQgfCBudWxsID0gbnVsbDtcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcbiAgICB0aGlzLmFwcGx5U3R5bGVzKCk7XG5cbiAgICB0aGlzLmFkZFNldHRpbmdUYWIobmV3IEhvdGZpeGVzU2V0dGluZ1RhYih0aGlzLmFwcCwgdGhpcykpO1xuXG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwibGF5b3V0LWNoYW5nZVwiLCAoKSA9PiB0aGlzLmFwcGx5U3R5bGVzKCkpXG4gICAgKTtcbiAgICB0aGlzLnJlZ2lzdGVyRXZlbnQoXG4gICAgICB0aGlzLmFwcC53b3Jrc3BhY2Uub24oXCJhY3RpdmUtbGVhZi1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5hcHBseVN0eWxlcygpKVxuICAgICk7XG4gIH1cblxuICBvbnVubG9hZCgpIHtcbiAgICBpZiAodGhpcy5zdHlsZUVsZW1lbnQpIHtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LnJlbW92ZSgpO1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICBjb25zdCBsb2FkZWQgPSBhd2FpdCB0aGlzLmxvYWREYXRhKCk7XG5cbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4uREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLihsb2FkZWQ/LmZyZWV6ZUZpcnN0Q29sdW1uID8/IHt9KSxcbiAgICB9O1xuICB9XG5cbiAgYXN5bmMgc2F2ZVNldHRpbmdzKCkge1xuICAgIGF3YWl0IHRoaXMuc2F2ZURhdGEodGhpcy5zZXR0aW5ncyk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuICB9XG5cbiAgcHJpdmF0ZSBhcHBseVN0eWxlcygpIHtcbiAgICBpZiAoIXRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzdHlsZVwiKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50LmlkID0gU1RZTEVfRUxFTUVOVF9JRDtcbiAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsZW1lbnQpO1xuICAgIH1cblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbi5lbmFibGVkKSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IFwiXCI7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgY29uZmlnID0gdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcbiAgICBjb25zdCBzYWZlU2VsZWN0b3IgPSAoY29uZmlnLnNlbGVjdG9yIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SKS50cmltKCk7XG4gICAgY29uc3QgZGl2aWRlciA9IGNvbmZpZy5zaG93RGl2aWRlclxuICAgICAgPyBcImJveC1zaGFkb3c6IDFweCAwIDAgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1wiXG4gICAgICA6IFwiXCI7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbiR7c2FmZVNlbGVjdG9yfSB7XG4gIG92ZXJmbG93LXg6IGF1dG87XG59XG5cbiR7c2FmZVNlbGVjdG9yfSAuYmFzZXMtdGQ6Zmlyc3Qtb2YtdHlwZSxcbiR7c2FmZVNlbGVjdG9yfSAuYmFzZXMtdGg6Zmlyc3Qtb2YtdHlwZSxcbiR7c2FmZVNlbGVjdG9yfSB0YWJsZSB0ciB0ZDpmaXJzdC1jaGlsZCxcbiR7c2FmZVNlbGVjdG9yfSB0YWJsZSB0ciB0aDpmaXJzdC1jaGlsZCB7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIGxlZnQ6ICR7Y29uZmlnLmxlZnRPZmZzZXRQeH1weDtcbiAgYmFja2dyb3VuZDogJHtjb25maWcuYmFja2dyb3VuZENvbG9yfTtcbiAgei1pbmRleDogJHtjb25maWcuekluZGV4fTtcbiAgJHtkaXZpZGVyfVxufVxuXG4ke3NhZmVTZWxlY3Rvcn0gLmJhc2VzLXRoOmZpcnN0LW9mLXR5cGUsXG4ke3NhZmVTZWxlY3Rvcn0gdGhlYWQgdGg6Zmlyc3QtY2hpbGQge1xuICB6LWluZGV4OiAke2NvbmZpZy56SW5kZXggKyAxfTtcbn1cbmAudHJpbSgpO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oXG4gICAgdXBkYXRlczogUGFydGlhbDxGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzPlxuICApIHtcbiAgICB0aGlzLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uID0ge1xuICAgICAgLi4udGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbixcbiAgICAgIC4uLnVwZGF0ZXMsXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLnNhdmVTZXR0aW5ncygpO1xuICB9XG59XG5cbmNsYXNzIEhvdGZpeGVzU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW47XG4gIHByaXZhdGUgc2VsZWN0b3JJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGxlZnRPZmZzZXRJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGJhY2tncm91bmRJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIHpJbmRleElucHV0OiBUZXh0Q29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgZGl2aWRlclRvZ2dsZUlucHV0OiBUb2dnbGVDb21wb25lbnQgfCBudWxsID0gbnVsbDtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luKSB7XG4gICAgc3VwZXIoYXBwLCBwbHVnaW4pO1xuICAgIHRoaXMucGx1Z2luID0gcGx1Z2luO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRIb3RmaXhFbmFibGVkKGVuYWJsZWQ6IGJvb2xlYW4pIHtcbiAgICBpZiAodGhpcy5zZWxlY3RvcklucHV0KSB0aGlzLnNlbGVjdG9ySW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmxlZnRPZmZzZXRJbnB1dCkgdGhpcy5sZWZ0T2Zmc2V0SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmJhY2tncm91bmRJbnB1dCkgdGhpcy5iYWNrZ3JvdW5kSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLnpJbmRleElucHV0KSB0aGlzLnpJbmRleElucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgICBpZiAodGhpcy5kaXZpZGVyVG9nZ2xlSW5wdXQpIHRoaXMuZGl2aWRlclRvZ2dsZUlucHV0LnNldERpc2FibGVkKCFlbmFibGVkKTtcbiAgfVxuXG4gIGRpc3BsYXkoKSB7XG4gICAgY29uc3QgeyBjb250YWluZXJFbCB9ID0gdGhpcztcbiAgICBjb250YWluZXJFbC5lbXB0eSgpO1xuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIk9ic2lkaWFuIEhvdGZpeGVzXCIgfSk7XG5cbiAgICBjb25zdCBkZXRhaWxzID0gY29udGFpbmVyRWwuY3JlYXRlRWwoXCJkZXRhaWxzXCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb25cIixcbiAgICB9KTtcbiAgICBkZXRhaWxzLmNyZWF0ZUVsKFwic3VtbWFyeVwiLCB7XG4gICAgICB0ZXh0OiBcIkJhc2VzOiBGcmVlemUgZmlyc3QgY29sdW1uXCIsXG4gICAgfSk7XG4gICAgY29uc3Qgc2VjdGlvbiA9IGRldGFpbHMuY3JlYXRlRWwoXCJkaXZcIiwge1xuICAgICAgY2xzOiBcIm9ic2lkaWFuLWhvdGZpeGVzLXNldHRpbmctc2VjdGlvbi1jb250ZW50XCIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMucGx1Z2luLnNldHRpbmdzLmZyZWV6ZUZpcnN0Q29sdW1uO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiRW5hYmxlIGZpcnN0LWNvbHVtbiBmcmVlemVcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIktlZXAgdGhlIGZpcnN0IGNvbHVtbiBpbiBCYXNlcyB0YWJsZSB2aWV3IHZpc2libGUgd2hpbGUgc2Nyb2xsaW5nIGhvcml6b250YWxseS5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRvZ2dsZS5zZXRWYWx1ZShzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgZW5hYmxlZDogdmFsdWUgfSk7XG4gICAgICAgICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHZhbHVlKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlRhcmdldCBzZWxlY3RvclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiQ1NTIHNlbGVjdG9yIGZvciB0aGUgQmFzZXMgY29udGFpbmVyLiBEZWZhdWx0IHRhcmdldHMgdGFibGUgdmlldy1vbmx5IEJhc2VzLlwiXG4gICAgICApXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLnNlbGVjdG9ySW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKHN0YXRlLnNlbGVjdG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgc2VsZWN0b3I6IHZhbHVlIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiTGVmdCBvZmZzZXQgKHB4KVwiKVxuICAgICAgLnNldERlc2MoXCJPcHRpb25hbCBvZmZzZXQgZm9yIHRoZSBmcm96ZW4gY29sdW1uIGZyb20gdGhlIGxlZnQgZWRnZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubGVmdE9mZnNldElucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShTdHJpbmcoc3RhdGUubGVmdE9mZnNldFB4KSk7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0LmlucHV0RWwudHlwZSA9IFwibnVtYmVyXCI7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCIwXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGxlZnRPZmZzZXRQeDogcGFyc2VkIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgbmV3IFNldHRpbmcoc2VjdGlvbilcbiAgICAgIC5zZXROYW1lKFwiQmFja2dyb3VuZFwiKVxuICAgICAgICAuc2V0RGVzYyhcbiAgICAgICAgICBcIkJhY2tncm91bmQgZm9yIHRoZSBmaXhlZCBmaXJzdCBjb2x1bW4gd2hpbGUgc2Nyb2xsaW5nIChDU1MgY29sb3Igb3IgdmFyaWFibGUpLlwiXG4gICAgICAgIClcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0aGlzLmJhY2tncm91bmRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjpcbiAgICAgICAgICAgICAgdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJ6LWluZGV4XCIpXG4gICAgICAuc2V0RGVzYyhcInotaW5kZXggdmFsdWUgdXNlZCBmb3Igc3RpY2t5IGZpcnN0LWNvbHVtbiBjZWxscy5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMuekluZGV4SW5wdXQgPSB0ZXh0O1xuICAgICAgICB0ZXh0LnNldFZhbHVlKFN0cmluZyhzdGF0ZS56SW5kZXgpKTtcbiAgICAgICAgdGV4dC5zZXREaXNhYmxlZCghc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRleHQuaW5wdXRFbC50eXBlID0gXCJudW1iZXJcIjtcbiAgICAgICAgdGV4dC5zZXRQbGFjZWhvbGRlcihcIjNcIik7XG4gICAgICAgIHRleHQub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgY29uc3QgcGFyc2VkID0gTnVtYmVyLnBhcnNlSW50KHZhbHVlLCAxMCk7XG4gICAgICAgICAgaWYgKE51bWJlci5pc05hTihwYXJzZWQpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgekluZGV4OiBwYXJzZWQgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJTaG93IGRpdmlkZXJcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkRyYXcgYSB0aGluIGRpdmlkZXIgbGluZSB0byB0aGUgcmlnaHQgb2YgdGhlIGZyb3plbiBmaXJzdCBjb2x1bW4uXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCA9IHRvZ2dsZTtcbiAgICAgICAgdG9nZ2xlLnNldFZhbHVlKHN0YXRlLnNob3dEaXZpZGVyKTtcbiAgICAgICAgdG9nZ2xlLnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdG9nZ2xlLm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHsgc2hvd0RpdmlkZXI6IHZhbHVlIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgdGhpcy5zZXRIb3RmaXhFbmFibGVkKHN0YXRlLmVuYWJsZWQpO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxzQkFPTztBQUVQLElBQU0sZ0NBQWdDO0FBQ3RDLElBQU0sbUJBQW1CO0FBZXpCLElBQU0sbUJBQW1DO0FBQUEsRUFDdkMsbUJBQW1CO0FBQUEsSUFDakIsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsY0FBYztBQUFBLElBQ2QsaUJBQWlCO0FBQUEsSUFDakIsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLEVBQ2Y7QUFDRjtBQUVBLElBQXFCLHlCQUFyQixjQUFvRCx1QkFBTztBQUFBLEVBQ3pELFdBQTJCO0FBQUEsSUFDekIsbUJBQW1CLEVBQUUsR0FBRyxpQkFBaUIsa0JBQWtCO0FBQUEsRUFDN0Q7QUFBQSxFQUNRLGVBQXdDO0FBQUEsRUFFaEQsTUFBTSxTQUFTO0FBQ2IsVUFBTSxLQUFLLGFBQWE7QUFDeEIsU0FBSyxZQUFZO0FBRWpCLFNBQUssY0FBYyxJQUFJLG1CQUFtQixLQUFLLEtBQUssSUFBSSxDQUFDO0FBRXpELFNBQUs7QUFBQSxNQUNILEtBQUssSUFBSSxVQUFVLEdBQUcsaUJBQWlCLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFBQSxJQUNqRTtBQUNBLFNBQUs7QUFBQSxNQUNILEtBQUssSUFBSSxVQUFVLEdBQUcsc0JBQXNCLE1BQU0sS0FBSyxZQUFZLENBQUM7QUFBQSxJQUN0RTtBQUFBLEVBQ0Y7QUFBQSxFQUVBLFdBQVc7QUFDVCxRQUFJLEtBQUssY0FBYztBQUNyQixXQUFLLGFBQWEsT0FBTztBQUN6QixXQUFLLGVBQWU7QUFBQSxJQUN0QjtBQUFBLEVBQ0Y7QUFBQSxFQUVBLE1BQU0sZUFBZTtBQUNuQixVQUFNLFNBQVMsTUFBTSxLQUFLLFNBQVM7QUFFbkMsU0FB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
