import {
  App,
  BasesView,
  HoverParent,
  HoverPopover,
  Keymap,
  PaneType,
  Plugin,
  PluginSettingTab,
  QueryController,
  Setting,
  TextComponent,
  parsePropertyId,
  type BasesPropertyId,
} from "obsidian";

const STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";
const FROZEN_TABLE_VIEW_TYPE = "obsidian-hotfixes-frozen-table";

interface FreezeFirstColumnHotfixSettings {
  enabled: boolean;
  firstColumnMinWidthPx: number;
  firstColumnMaxWidthPx: number;
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
    firstColumnMinWidthPx: 220,
    firstColumnMaxWidthPx: 320,
    backgroundColor: "var(--background-primary)",
    zIndex: 4,
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
    this.registerSettingTab();
    const registered = this.registerBasesView(FROZEN_TABLE_VIEW_TYPE, {
      name: "Frozen Table",
      icon: "lucide-layout-grid",
      factory: (controller, containerEl) =>
        new FrozenTableBasesView(controller, containerEl, this),
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

  private registerSettingTab() {
    this.addSettingTab(new HotfixesSettingTab(this.app, this));
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
    this.refreshOpenFrozenViews();
  }

  private applyStyles() {
    if (!this.styleElement) {
      this.styleElement = document.createElement("style");
      this.styleElement.id = STYLE_ELEMENT_ID;
      document.head.appendChild(this.styleElement);
    }

    const config = this.settings.freezeFirstColumn;
    const minWidth = Math.max(80, config.firstColumnMinWidthPx);
    const maxWidth = Math.max(minWidth, config.firstColumnMaxWidthPx);
    const divider = config.showDivider
      ? "1px solid var(--background-modifier-border)"
      : "none";

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

  private refreshOpenFrozenViews() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const view = leaf.view;
      if (view instanceof FrozenTableBasesView) {
        view.onDataUpdated();
      }
    });
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

class FrozenTableBasesView extends BasesView implements HoverParent {
  hoverPopover: HoverPopover | null = null;
  private readonly root: HTMLDivElement;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private plugin: ObsidianHotfixesPlugin
  ) {
    super(controller);
    this.root = containerEl.createDiv("obsidian-hotfixes-frozen-bases-root");
  }

  readonly type = FROZEN_TABLE_VIEW_TYPE;

  public onDataUpdated(): void {
    this.render();
  }

  private render() {
    this.root.empty();

    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-frozen-bases-empty",
        text: "Frozen table view is disabled. Turn it on in plugin settings.",
      });
      return;
    }

    const propertyOrder = this.getPropertyOrder();
    if (!propertyOrder.length) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-frozen-bases-empty",
        text: "No properties available for this Base.",
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
        text: name,
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
          text: keyValue,
        });
        groupCell.colSpan = propertyOrder.length;
      }

      for (const entry of entries) {
        const row = tbody.createEl("tr");
        for (const propertyId of propertyOrder) {
          const cell = row.createEl("td");
          const parsed = parsePropertyId(propertyId);

          if (parsed.type === "file" && parsed.name === "name") {
            const link = cell.createEl("a", {
              text: entry.file.name,
              href: entry.file.path,
            });
            link.addClass("internal-link");
            link.addEventListener("click", (event) => {
              if (event.button !== 0 && event.button !== 1) {
                return;
              }

              const pane = Keymap.isModEvent(event);
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
                pane as PaneType
              );
            });
            link.addEventListener("mouseover", (event) => {
              this.plugin.app.workspace.trigger("hover-link", {
                event,
                source: "bases",
                hoverParent: this,
                targetEl: link,
                linktext: entry.file.path,
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

  private getPropertyOrder(): BasesPropertyId[] {
    const explicitOrder = this.config.getOrder();
    if (explicitOrder.length > 0) {
      return explicitOrder;
    }
    return this.data.properties;
  }
}

class HotfixesSettingTab extends PluginSettingTab {
  plugin: ObsidianHotfixesPlugin;
  private minWidthInput: TextComponent | null = null;
  private maxWidthInput: TextComponent | null = null;
  private backgroundInput: TextComponent | null = null;
  private zIndexInput: TextComponent | null = null;

  constructor(app: App, plugin: ObsidianHotfixesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private setSectionEnabled(enabled: boolean) {
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
      cls: "obsidian-hotfixes-setting-section",
    });
    details.createEl("summary", {
      text: "Bases: Frozen first column",
    });
    const section = details.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content",
    });

    const state = this.plugin.settings.freezeFirstColumn;

    new Setting(section)
      .setName("Enable custom frozen table view")
      .setDesc(
        "Use a custom Bases view with a sticky first column instead of overlay hacks."
      )
      .addToggle((toggle) => {
        toggle.setValue(state.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({ enabled: value });
          this.setSectionEnabled(value);
        });
      });

    new Setting(section)
      .setName("First column minimum width (px)")
      .setDesc("Minimum width of the frozen first column.")
      .addText((text) => {
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
            firstColumnMinWidthPx: parsed,
          });
        });
      });

    new Setting(section)
      .setName("First column max width (px)")
      .setDesc("Cap the frozen first column width.")
      .addText((text) => {
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
            firstColumnMaxWidthPx: parsed,
          });
        });
      });

    new Setting(section)
      .setName("Background")
      .setDesc("Background used behind the frozen first column.")
      .addText((text) => {
        this.backgroundInput = text;
        text.setValue(state.backgroundColor);
        text.setDisabled(!state.enabled);
        text.setPlaceholder("var(--background-primary)");
        text.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({
            backgroundColor: value || DEFAULT_SETTINGS.freezeFirstColumn.backgroundColor,
          });
        });
      });

    new Setting(section)
      .setName("z-index")
      .setDesc("Stacking order for the frozen first column.")
      .addText((text) => {
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

    new Setting(section)
      .setName("Show divider")
      .setDesc("Draw a divider to the right of the frozen first column.")
      .addToggle((toggle) => {
        toggle.setValue(state.showDivider);
        toggle.setDisabled(!state.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateFreezeFirstColumn({ showDivider: value });
        });
      });

    this.setSectionEnabled(state.enabled);
  }
}
