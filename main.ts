import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  TextComponent,
  ToggleComponent,
} from "obsidian";

const DEFAULT_FIRST_COLUMN_SELECTOR = ".bases-view[data-view-type='table']";
const STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";

interface FreezeFirstColumnHotfixSettings {
  enabled: boolean;
  selector: string;
  leftOffsetPx: number;
  backgroundColor: string;
  zIndex: number;
  showDivider: boolean;
}

interface HotfixSettings {
  freezeFirstColumn: FreezeFirstColumnHotfixSettings;
}

const DEFAULT_SETTINGS: HotfixSettings = {
  freezeFirstColumn: {
    enabled: false,
    selector: DEFAULT_FIRST_COLUMN_SELECTOR,
    leftOffsetPx: 0,
    backgroundColor: "var(--background-primary)",
    zIndex: 3,
    showDivider: true,
  },
};

export default class ObsidianHotfixesPlugin extends Plugin {
  settings: HotfixSettings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn },
  };
  private styleElement: HTMLStyleElement | null = null;

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
      ...(loaded?.freezeFirstColumn ?? {}),
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyStyles();
  }

  private applyStyles() {
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
    const divider = config.showDivider
      ? "box-shadow: 1px 0 0 var(--background-modifier-border);"
      : "";

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

  async updateFreezeFirstColumn(
    updates: Partial<FreezeFirstColumnHotfixSettings>
  ) {
    this.settings.freezeFirstColumn = {
      ...this.settings.freezeFirstColumn,
      ...updates,
    };
    await this.saveSettings();
  }
}

class HotfixesSettingTab extends PluginSettingTab {
  plugin: ObsidianHotfixesPlugin;
  private selectorInput: TextComponent | null = null;
  private leftOffsetInput: TextComponent | null = null;
  private backgroundInput: TextComponent | null = null;
  private zIndexInput: TextComponent | null = null;
  private dividerToggleInput: ToggleComponent | null = null;

  constructor(app: App, plugin: ObsidianHotfixesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private setHotfixEnabled(enabled: boolean) {
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
      cls: "obsidian-hotfixes-setting-section",
    });
    details.createEl("summary", {
      text: "Bases: Freeze first column",
    });
    const section = details.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content",
    });

    const state = this.plugin.settings.freezeFirstColumn;

    new Setting(section)
      .setName("Enable first-column freeze")
      .setDesc(
        "Keep the first column in Bases table view visible while scrolling horizontally."
      )
      .addToggle((toggle) => {
        toggle.setValue(state.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({ enabled: value });
          this.setHotfixEnabled(value);
        });
      });

    new Setting(section)
      .setName("Target selector")
      .setDesc(
        "CSS selector for the Bases container. Default targets table view-only Bases."
      )
      .addText((text) => {
        this.selectorInput = text;
        text.setValue(state.selector);
        text.setDisabled(!state.enabled);
        text.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({
            selector: value || DEFAULT_FIRST_COLUMN_SELECTOR,
          });
        });
      });

    new Setting(section)
      .setName("Left offset (px)")
      .setDesc("Optional offset for the frozen column from the left edge.")
      .addText((text) => {
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

    new Setting(section)
      .setName("Background")
        .setDesc(
          "Background for the fixed first column while scrolling (CSS color or variable)."
        )
        .addText((text) => {
          this.backgroundInput = text;
        text.setValue(state.backgroundColor);
        text.setDisabled(!state.enabled);
        text.setPlaceholder("var(--background-primary)");
        text.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({
            backgroundColor:
              value || DEFAULT_SETTINGS.freezeFirstColumn.backgroundColor,
          });
        });
      });

    new Setting(section)
      .setName("z-index")
      .setDesc("z-index value used for sticky first-column cells.")
      .addText((text) => {
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

    new Setting(section)
      .setName("Show divider")
      .setDesc(
        "Draw a thin divider line to the right of the frozen first column."
      )
      .addToggle((toggle) => {
        this.dividerToggleInput = toggle;
        toggle.setValue(state.showDivider);
        toggle.setDisabled(!state.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({ showDivider: value });
        });
      });

    this.setHotfixEnabled(state.enabled);
  }
}
