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
    const selector = (config.selector || DEFAULT_FIRST_COLUMN_SELECTOR).trim();
    const divider = config.showDivider ? "box-shadow: 1px 0 0 var(--background-modifier-border);" : "";
    this.styleElement.textContent = `
${selector} {
  position: relative;
}

${selector} .bases-table {
  overflow-x: auto;
  max-width: 100%;
}

${selector} .bases-table table {
  width: auto;
  min-width: 0;
  border-collapse: separate;
  border-spacing: 0;
  table-layout: auto;
}

${selector} .bases-td:first-of-type,
${selector} .bases-th:first-of-type,
${selector} table tr td:first-child,
${selector} table tr th:first-child {
  position: sticky;
  left: ${config.leftOffsetPx}px;
  background: ${config.backgroundColor};
  z-index: ${config.zIndex};
  width: ${config.firstColumnMaxWidthPx}px;
  min-width: 120px;
  max-width: ${config.firstColumnMaxWidthPx}px;
  ${divider}
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

${selector} .bases-th:first-of-type,
${selector} thead th:first-child {
  z-index: ${config.zIndex + 1};
  position: sticky;
  left: ${config.leftOffsetPx}px;
  background: ${config.backgroundColor};
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
    new import_obsidian.Setting(section).setName("First-column max width (px)").setDesc("Cap the sticky first column width to avoid taking too much space.").addText((text) => {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHtcbiAgQXBwLFxuICBQbHVnaW4sXG4gIFBsdWdpblNldHRpbmdUYWIsXG4gIFNldHRpbmcsXG4gIFRleHRDb21wb25lbnQsXG4gIFRvZ2dsZUNvbXBvbmVudCxcbn0gZnJvbSBcIm9ic2lkaWFuXCI7XG5cbmNvbnN0IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SID0gXCIuYmFzZXMtdmlld1tkYXRhLXZpZXctdHlwZT0ndGFibGUnXVwiO1xuY29uc3QgU1RZTEVfRUxFTUVOVF9JRCA9IFwib2JzaWRpYW4taG90Zml4ZXMtcnVudGltZS1zdHlsZXNcIjtcblxuaW50ZXJmYWNlIEZyZWV6ZUZpcnN0Q29sdW1uSG90Zml4U2V0dGluZ3Mge1xuICBlbmFibGVkOiBib29sZWFuO1xuICBzZWxlY3Rvcjogc3RyaW5nO1xuICBsZWZ0T2Zmc2V0UHg6IG51bWJlcjtcbiAgYmFja2dyb3VuZENvbG9yOiBzdHJpbmc7XG4gIHpJbmRleDogbnVtYmVyO1xuICBzaG93RGl2aWRlcjogYm9vbGVhbjtcbiAgZmlyc3RDb2x1bW5NYXhXaWR0aFB4OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBIb3RmaXhTZXR0aW5ncyB7XG4gIGZyZWV6ZUZpcnN0Q29sdW1uOiBGcmVlemVGaXJzdENvbHVtbkhvdGZpeFNldHRpbmdzO1xufVxuXG5jb25zdCBERUZBVUxUX1NFVFRJTkdTOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgZnJlZXplRmlyc3RDb2x1bW46IHtcbiAgICBlbmFibGVkOiBmYWxzZSxcbiAgICBzZWxlY3RvcjogREVGQVVMVF9GSVJTVF9DT0xVTU5fU0VMRUNUT1IsXG4gICAgbGVmdE9mZnNldFB4OiAwLFxuICAgIGJhY2tncm91bmRDb2xvcjogXCJ2YXIoLS1iYWNrZ3JvdW5kLXByaW1hcnkpXCIsXG4gICAgekluZGV4OiAzLFxuICAgIHNob3dEaXZpZGVyOiB0cnVlLFxuICAgIGZpcnN0Q29sdW1uTWF4V2lkdGhQeDogMjgwLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgT2JzaWRpYW5Ib3RmaXhlc1BsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBIb3RmaXhTZXR0aW5ncyA9IHtcbiAgICBmcmVlemVGaXJzdENvbHVtbjogeyAuLi5ERUZBVUxUX1NFVFRJTkdTLmZyZWV6ZUZpcnN0Q29sdW1uIH0sXG4gIH07XG4gIHByaXZhdGUgc3R5bGVFbGVtZW50OiBIVE1MU3R5bGVFbGVtZW50IHwgbnVsbCA9IG51bGw7XG5cbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIGF3YWl0IHRoaXMubG9hZFNldHRpbmdzKCk7XG4gICAgdGhpcy5hcHBseVN0eWxlcygpO1xuXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBIb3RmaXhlc1NldHRpbmdUYWIodGhpcy5hcHAsIHRoaXMpKTtcblxuICAgIHRoaXMucmVnaXN0ZXJFdmVudChcbiAgICAgIHRoaXMuYXBwLndvcmtzcGFjZS5vbihcImxheW91dC1jaGFuZ2VcIiwgKCkgPT4gdGhpcy5hcHBseVN0eWxlcygpKVxuICAgICk7XG4gICAgdGhpcy5yZWdpc3RlckV2ZW50KFxuICAgICAgdGhpcy5hcHAud29ya3NwYWNlLm9uKFwiYWN0aXZlLWxlYWYtY2hhbmdlXCIsICgpID0+IHRoaXMuYXBwbHlTdHlsZXMoKSlcbiAgICApO1xuICB9XG5cbiAgb251bmxvYWQoKSB7XG4gICAgaWYgKHRoaXMuc3R5bGVFbGVtZW50KSB7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5yZW1vdmUoKTtcbiAgICAgIHRoaXMuc3R5bGVFbGVtZW50ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBhc3luYyBsb2FkU2V0dGluZ3MoKSB7XG4gICAgY29uc3QgbG9hZGVkID0gYXdhaXQgdGhpcy5sb2FkRGF0YSgpO1xuXG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLkRFRkFVTFRfU0VUVElOR1MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi4obG9hZGVkPy5mcmVlemVGaXJzdENvbHVtbiA/PyB7fSksXG4gICAgfTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICAgIHRoaXMuYXBwbHlTdHlsZXMoKTtcbiAgfVxuXG4gIHByaXZhdGUgYXBwbHlTdHlsZXMoKSB7XG4gICAgaWYgKCF0aGlzLnN0eWxlRWxlbWVudCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgICB0aGlzLnN0eWxlRWxlbWVudC5pZCA9IFNUWUxFX0VMRU1FTlRfSUQ7XG4gICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbGVtZW50KTtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4uZW5hYmxlZCkge1xuICAgICAgdGhpcy5zdHlsZUVsZW1lbnQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbmZpZyA9IHRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW47XG4gICAgY29uc3Qgc2VsZWN0b3IgPSAoY29uZmlnLnNlbGVjdG9yIHx8IERFRkFVTFRfRklSU1RfQ09MVU1OX1NFTEVDVE9SKS50cmltKCk7XG4gICAgY29uc3QgZGl2aWRlciA9IGNvbmZpZy5zaG93RGl2aWRlclxuICAgICAgPyBcImJveC1zaGFkb3c6IDFweCAwIDAgdmFyKC0tYmFja2dyb3VuZC1tb2RpZmllci1ib3JkZXIpO1wiXG4gICAgICA6IFwiXCI7XG5cbiAgICB0aGlzLnN0eWxlRWxlbWVudC50ZXh0Q29udGVudCA9IGBcbiR7c2VsZWN0b3J9IHtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuXG4ke3NlbGVjdG9yfSAuYmFzZXMtdGFibGUge1xuICBvdmVyZmxvdy14OiBhdXRvO1xuICBtYXgtd2lkdGg6IDEwMCU7XG59XG5cbiR7c2VsZWN0b3J9IC5iYXNlcy10YWJsZSB0YWJsZSB7XG4gIHdpZHRoOiBhdXRvO1xuICBtaW4td2lkdGg6IDA7XG4gIGJvcmRlci1jb2xsYXBzZTogc2VwYXJhdGU7XG4gIGJvcmRlci1zcGFjaW5nOiAwO1xuICB0YWJsZS1sYXlvdXQ6IGF1dG87XG59XG5cbiR7c2VsZWN0b3J9IC5iYXNlcy10ZDpmaXJzdC1vZi10eXBlLFxuJHtzZWxlY3Rvcn0gLmJhc2VzLXRoOmZpcnN0LW9mLXR5cGUsXG4ke3NlbGVjdG9yfSB0YWJsZSB0ciB0ZDpmaXJzdC1jaGlsZCxcbiR7c2VsZWN0b3J9IHRhYmxlIHRyIHRoOmZpcnN0LWNoaWxkIHtcbiAgcG9zaXRpb246IHN0aWNreTtcbiAgbGVmdDogJHtjb25maWcubGVmdE9mZnNldFB4fXB4O1xuICBiYWNrZ3JvdW5kOiAke2NvbmZpZy5iYWNrZ3JvdW5kQ29sb3J9O1xuICB6LWluZGV4OiAke2NvbmZpZy56SW5kZXh9O1xuICB3aWR0aDogJHtjb25maWcuZmlyc3RDb2x1bW5NYXhXaWR0aFB4fXB4O1xuICBtaW4td2lkdGg6IDEyMHB4O1xuICBtYXgtd2lkdGg6ICR7Y29uZmlnLmZpcnN0Q29sdW1uTWF4V2lkdGhQeH1weDtcbiAgJHtkaXZpZGVyfVxuICBvdmVyZmxvdzogaGlkZGVuO1xuICB0ZXh0LW92ZXJmbG93OiBlbGxpcHNpcztcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cblxuJHtzZWxlY3Rvcn0gLmJhc2VzLXRoOmZpcnN0LW9mLXR5cGUsXG4ke3NlbGVjdG9yfSB0aGVhZCB0aDpmaXJzdC1jaGlsZCB7XG4gIHotaW5kZXg6ICR7Y29uZmlnLnpJbmRleCArIDF9O1xuICBwb3NpdGlvbjogc3RpY2t5O1xuICBsZWZ0OiAke2NvbmZpZy5sZWZ0T2Zmc2V0UHh9cHg7XG4gIGJhY2tncm91bmQ6ICR7Y29uZmlnLmJhY2tncm91bmRDb2xvcn07XG59XG5gLnRyaW0oKTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKFxuICAgIHVwZGF0ZXM6IFBhcnRpYWw8RnJlZXplRmlyc3RDb2x1bW5Ib3RmaXhTZXR0aW5ncz5cbiAgKSB7XG4gICAgdGhpcy5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbiA9IHtcbiAgICAgIC4uLnRoaXMuc2V0dGluZ3MuZnJlZXplRmlyc3RDb2x1bW4sXG4gICAgICAuLi51cGRhdGVzLFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy5zYXZlU2V0dGluZ3MoKTtcbiAgfVxufVxuXG5jbGFzcyBIb3RmaXhlc1NldHRpbmdUYWIgZXh0ZW5kcyBQbHVnaW5TZXR0aW5nVGFiIHtcbiAgcGx1Z2luOiBPYnNpZGlhbkhvdGZpeGVzUGx1Z2luO1xuICBwcml2YXRlIHNlbGVjdG9ySW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBsZWZ0T2Zmc2V0SW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSBiYWNrZ3JvdW5kSW5wdXQ6IFRleHRDb21wb25lbnQgfCBudWxsID0gbnVsbDtcbiAgcHJpdmF0ZSB6SW5kZXhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuICBwcml2YXRlIGRpdmlkZXJUb2dnbGVJbnB1dDogVG9nZ2xlQ29tcG9uZW50IHwgbnVsbCA9IG51bGw7XG4gIHByaXZhdGUgbWF4V2lkdGhJbnB1dDogVGV4dENvbXBvbmVudCB8IG51bGwgPSBudWxsO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBwbHVnaW46IE9ic2lkaWFuSG90Zml4ZXNQbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBwcml2YXRlIHNldEhvdGZpeEVuYWJsZWQoZW5hYmxlZDogYm9vbGVhbikge1xuICAgIGlmICh0aGlzLnNlbGVjdG9ySW5wdXQpIHRoaXMuc2VsZWN0b3JJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMubGVmdE9mZnNldElucHV0KSB0aGlzLmxlZnRPZmZzZXRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuYmFja2dyb3VuZElucHV0KSB0aGlzLmJhY2tncm91bmRJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gICAgaWYgKHRoaXMuekluZGV4SW5wdXQpIHRoaXMuekluZGV4SW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLmRpdmlkZXJUb2dnbGVJbnB1dCkgdGhpcy5kaXZpZGVyVG9nZ2xlSW5wdXQuc2V0RGlzYWJsZWQoIWVuYWJsZWQpO1xuICAgIGlmICh0aGlzLm1heFdpZHRoSW5wdXQpIHRoaXMubWF4V2lkdGhJbnB1dC5zZXREaXNhYmxlZCghZW5hYmxlZCk7XG4gIH1cblxuICBkaXNwbGF5KCkge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgyXCIsIHsgdGV4dDogXCJPYnNpZGlhbiBIb3RmaXhlc1wiIH0pO1xuXG4gICAgY29uc3QgZGV0YWlscyA9IGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiZGV0YWlsc1wiLCB7XG4gICAgICBjbHM6IFwib2JzaWRpYW4taG90Zml4ZXMtc2V0dGluZy1zZWN0aW9uXCIsXG4gICAgfSk7XG4gICAgZGV0YWlscy5jcmVhdGVFbChcInN1bW1hcnlcIiwge1xuICAgICAgdGV4dDogXCJCYXNlczogRnJlZXplIGZpcnN0IGNvbHVtblwiLFxuICAgIH0pO1xuICAgIGNvbnN0IHNlY3Rpb24gPSBkZXRhaWxzLmNyZWF0ZUVsKFwiZGl2XCIsIHtcbiAgICAgIGNsczogXCJvYnNpZGlhbi1ob3RmaXhlcy1zZXR0aW5nLXNlY3Rpb24tY29udGVudFwiLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgc3RhdGUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5mcmVlemVGaXJzdENvbHVtbjtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkVuYWJsZSBmaXJzdC1jb2x1bW4gZnJlZXplXCIpXG4gICAgICAuc2V0RGVzYyhcbiAgICAgICAgXCJLZWVwIHRoZSBmaXJzdCBjb2x1bW4gaW4gQmFzZXMgdGFibGUgdmlldyB2aXNpYmxlIHdoaWxlIHNjcm9sbGluZyBob3Jpem9udGFsbHkuXCJcbiAgICAgIClcbiAgICAgIC5hZGRUb2dnbGUoKHRvZ2dsZSkgPT4ge1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuZW5hYmxlZCk7XG4gICAgICAgIHRvZ2dsZS5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7IGVuYWJsZWQ6IHZhbHVlIH0pO1xuICAgICAgICAgIHRoaXMuc2V0SG90Zml4RW5hYmxlZCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJUYXJnZXQgc2VsZWN0b3JcIilcbiAgICAgIC5zZXREZXNjKFxuICAgICAgICBcIkNTUyBzZWxlY3RvciBmb3IgdGhlIEJhc2VzIGNvbnRhaW5lci4gRGVmYXVsdCB0YXJnZXRzIHRhYmxlIHZpZXctb25seSBCYXNlcy5cIlxuICAgICAgKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy5zZWxlY3RvcklucHV0ID0gdGV4dDtcbiAgICAgICAgdGV4dC5zZXRWYWx1ZShzdGF0ZS5zZWxlY3Rvcik7XG4gICAgICAgIHRleHQuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnVwZGF0ZUZyZWV6ZUZpcnN0Q29sdW1uKHtcbiAgICAgICAgICAgIHNlbGVjdG9yOiB2YWx1ZSB8fCBERUZBVUxUX0ZJUlNUX0NPTFVNTl9TRUxFQ1RPUixcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkxlZnQgb2Zmc2V0IChweClcIilcbiAgICAgIC5zZXREZXNjKFwiT3B0aW9uYWwgb2Zmc2V0IGZvciB0aGUgZnJvemVuIGNvbHVtbiBmcm9tIHRoZSBsZWZ0IGVkZ2UuXCIpXG4gICAgICAuYWRkVGV4dCgodGV4dCkgPT4ge1xuICAgICAgICB0aGlzLmxlZnRPZmZzZXRJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmxlZnRPZmZzZXRQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiMFwiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBsZWZ0T2Zmc2V0UHg6IHBhcnNlZCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIkJhY2tncm91bmRcIilcbiAgICAgICAgLnNldERlc2MoXG4gICAgICAgICAgXCJCYWNrZ3JvdW5kIGZvciB0aGUgZml4ZWQgZmlyc3QgY29sdW1uIHdoaWxlIHNjcm9sbGluZyAoQ1NTIGNvbG9yIG9yIHZhcmlhYmxlKS5cIlxuICAgICAgICApXG4gICAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kSW5wdXQgPSB0ZXh0O1xuICAgICAgICAgIHRleHQuc2V0VmFsdWUoc3RhdGUuYmFja2dyb3VuZENvbG9yKTtcbiAgICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwidmFyKC0tYmFja2dyb3VuZC1wcmltYXJ5KVwiKTtcbiAgICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oe1xuICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6XG4gICAgICAgICAgICAgICAgdmFsdWUgfHwgREVGQVVMVF9TRVRUSU5HUy5mcmVlemVGaXJzdENvbHVtbi5iYWNrZ3JvdW5kQ29sb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhzZWN0aW9uKVxuICAgICAgLnNldE5hbWUoXCJGaXJzdC1jb2x1bW4gbWF4IHdpZHRoIChweClcIilcbiAgICAgIC5zZXREZXNjKFwiQ2FwIHRoZSBzdGlja3kgZmlyc3QgY29sdW1uIHdpZHRoIHRvIGF2b2lkIHRha2luZyB0b28gbXVjaCBzcGFjZS5cIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRoaXMubWF4V2lkdGhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLmZpcnN0Q29sdW1uTWF4V2lkdGhQeCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiMjgwXCIpO1xuICAgICAgICB0ZXh0Lm9uQ2hhbmdlKGFzeW5jICh2YWx1ZSkgPT4ge1xuICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IE51bWJlci5wYXJzZUludCh2YWx1ZSwgMTApO1xuICAgICAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyc2VkKSB8fCBwYXJzZWQgPCA4MCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi51cGRhdGVGcmVlemVGaXJzdENvbHVtbih7XG4gICAgICAgICAgICBmaXJzdENvbHVtbk1heFdpZHRoUHg6IHBhcnNlZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcInotaW5kZXhcIilcbiAgICAgIC5zZXREZXNjKFwiei1pbmRleCB2YWx1ZSB1c2VkIGZvciBzdGlja3kgZmlyc3QtY29sdW1uIGNlbGxzLlwiKVxuICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgdGhpcy56SW5kZXhJbnB1dCA9IHRleHQ7XG4gICAgICAgIHRleHQuc2V0VmFsdWUoU3RyaW5nKHN0YXRlLnpJbmRleCkpO1xuICAgICAgICB0ZXh0LnNldERpc2FibGVkKCFzdGF0ZS5lbmFibGVkKTtcbiAgICAgICAgdGV4dC5pbnB1dEVsLnR5cGUgPSBcIm51bWJlclwiO1xuICAgICAgICB0ZXh0LnNldFBsYWNlaG9sZGVyKFwiM1wiKTtcbiAgICAgICAgdGV4dC5vbkNoYW5nZShhc3luYyAodmFsdWUpID0+IHtcbiAgICAgICAgICBjb25zdCBwYXJzZWQgPSBOdW1iZXIucGFyc2VJbnQodmFsdWUsIDEwKTtcbiAgICAgICAgICBpZiAoTnVtYmVyLmlzTmFOKHBhcnNlZCkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyB6SW5kZXg6IHBhcnNlZCB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgIG5ldyBTZXR0aW5nKHNlY3Rpb24pXG4gICAgICAuc2V0TmFtZShcIlNob3cgZGl2aWRlclwiKVxuICAgICAgLnNldERlc2MoXG4gICAgICAgIFwiRHJhdyBhIHRoaW4gZGl2aWRlciBsaW5lIHRvIHRoZSByaWdodCBvZiB0aGUgZnJvemVuIGZpcnN0IGNvbHVtbi5cIlxuICAgICAgKVxuICAgICAgLmFkZFRvZ2dsZSgodG9nZ2xlKSA9PiB7XG4gICAgICAgIHRoaXMuZGl2aWRlclRvZ2dsZUlucHV0ID0gdG9nZ2xlO1xuICAgICAgICB0b2dnbGUuc2V0VmFsdWUoc3RhdGUuc2hvd0RpdmlkZXIpO1xuICAgICAgICB0b2dnbGUuc2V0RGlzYWJsZWQoIXN0YXRlLmVuYWJsZWQpO1xuICAgICAgICB0b2dnbGUub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5wbHVnaW4udXBkYXRlRnJlZXplRmlyc3RDb2x1bW4oeyBzaG93RGl2aWRlcjogdmFsdWUgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICB0aGlzLnNldEhvdGZpeEVuYWJsZWQoc3RhdGUuZW5hYmxlZCk7XG4gIH1cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHNCQU9PO0FBRVAsSUFBTSxnQ0FBZ0M7QUFDdEMsSUFBTSxtQkFBbUI7QUFnQnpCLElBQU0sbUJBQW1DO0FBQUEsRUFDdkMsbUJBQW1CO0FBQUEsSUFDakIsU0FBUztBQUFBLElBQ1QsVUFBVTtBQUFBLElBQ1YsY0FBYztBQUFBLElBQ2QsaUJBQWlCO0FBQUEsSUFDakIsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLElBQ2IsdUJBQXVCO0FBQUEsRUFDekI7QUFD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
