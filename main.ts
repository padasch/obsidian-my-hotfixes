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
  firstColumnMaxWidthPx: number;
}

interface HotfixSettings {
  freezeFirstColumn: FreezeFirstColumnHotfixSettings;
}

interface TableRowLike {
  sourceRow: HTMLElement;
  firstCell: HTMLElement;
  section: "thead" | "tbody" | "tfoot" | "other";
}

const DEFAULT_SETTINGS: HotfixSettings = {
  freezeFirstColumn: {
    enabled: false,
    selector: DEFAULT_FIRST_COLUMN_SELECTOR,
    leftOffsetPx: 0,
    backgroundColor: "var(--background-primary)",
    zIndex: 3,
    showDivider: true,
    firstColumnMaxWidthPx: 280,
  },
};

export default class ObsidianHotfixesPlugin extends Plugin {
  settings: HotfixSettings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn },
  };
  private styleElement: HTMLStyleElement | null = null;
  private pendingPatchFrame = 0;
  private mutationObserver: MutationObserver | null = null;
  private frozenCellElements = new Set<HTMLElement>();
  private activeOverlays = new Map<HTMLElement, HTMLElement>();
  private overlayScrollHandlers = new Map<HTMLElement, (event: Event) => void>();

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

    this.mutationObserver = new MutationObserver(() =>
      this.scheduleBasePatchRefresh()
    );
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
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
      ...(loaded?.freezeFirstColumn ?? {}),
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyStyles();
    this.scheduleBasePatchRefresh();
  }

  private applyStyles() {
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
    const divider = config.showDivider
      ? "box-shadow: 1px 0 0 var(--background-modifier-border);"
      : "";

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

  private scheduleBasePatchRefresh() {
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

  private refreshBasePatches() {
    this.clearFrozenColumnOverlays();

    if (!this.settings.freezeFirstColumn.enabled) {
      return;
    }

    const config = this.settings.freezeFirstColumn;
    const selector = (config.selector || DEFAULT_FIRST_COLUMN_SELECTOR).trim();

    let roots: NodeListOf<HTMLElement>;
    try {
      roots = document.querySelectorAll(selector);
    } catch {
      return;
    }

    roots.forEach((root) => this.patchBaseView(root));
  }

  private patchBaseView(root: HTMLElement) {
    const config = this.settings.freezeFirstColumn;
    const table = root.querySelector<HTMLTableElement>("table");

    const container = root.querySelector<HTMLElement>(".bases-table") ?? root;
    if (!container || !table) {
      return;
    }

    const rows = this.getTableFirstColumnRows(table);
    if (!rows.length) {
      return;
    }

    const overlay = this.ensureOverlay(container, table);
    this.renderOverlayRows(overlay.querySelector("table")!, rows);
    this.syncOverlayStyles(overlay, container, table);
    this.bindOverlayScrollSync(container, overlay);
  }

  private getTableFirstColumnRows(table: HTMLTableElement): TableRowLike[] {
    const rows = table.querySelectorAll<HTMLElement>("tr, .bases-tr");
    const rowInfo: TableRowLike[] = [];

    rows.forEach((row) => {
      const firstCell =
        row.querySelector<HTMLElement>(
          ":scope > .bases-td:first-child, :scope > .bases-th:first-child, :scope > td:first-child, :scope > th:first-child"
        ) ??
        row.querySelector<HTMLElement>(":scope > *:first-child");
      if (!firstCell) {
        return;
      }

      const parent = row.parentElement?.tagName.toLowerCase();
      const section =
        parent === "thead"
          ? "thead"
          : parent === "tbody"
            ? "tbody"
            : parent === "tfoot"
              ? "tfoot"
              : "other";

      firstCell.classList.add("obsidian-hotfixes-hide-original-first-column");
      firstCell.style.width = `${this.settings.freezeFirstColumn.firstColumnMaxWidthPx}px`;
      firstCell.style.minWidth = "120px";
      firstCell.style.maxWidth = `${this.settings.freezeFirstColumn.firstColumnMaxWidthPx}px`;
      this.frozenCellElements.add(firstCell);

      rowInfo.push({ sourceRow: row, firstCell, section });
    });

    return rowInfo;
  }

  private ensureOverlay(
    container: HTMLElement,
    table: HTMLTableElement
  ): HTMLElement {
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

  private renderOverlayRows(
    overlayTable: HTMLTableElement,
    rows: TableRowLike[]
  ) {
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const tfoot = document.createElement("tfoot");
    const otherRows: HTMLTableRowElement[] = [];

    rows.forEach((rowLike) => {
      const clonedCell = rowLike.firstCell.cloneNode(true) as HTMLTableCellElement;
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

  private syncOverlayStyles(
    overlay: HTMLElement,
    container: HTMLElement,
    table: HTMLTableElement
  ) {
    const config = this.settings.freezeFirstColumn;
    overlay.style.width = `${config.firstColumnMaxWidthPx}px`;
    overlay.style.left = `${config.leftOffsetPx}px`;
    overlay.style.height = `${Math.max(1, table.getBoundingClientRect().height)}px`;
    this.syncOverlayScroll(container, overlay);
  }

  private bindOverlayScrollSync(
    container: HTMLElement,
    overlay: HTMLElement
  ) {
    if (this.overlayScrollHandlers.has(container)) {
      return;
    }

    const handler = () => this.syncOverlayScroll(container, overlay);
    container.addEventListener("scroll", handler, { passive: true });
    this.overlayScrollHandlers.set(container, handler);
  }

  private syncOverlayScroll(container: HTMLElement, overlay: HTMLElement) {
    overlay.style.transform = `translateX(${container.scrollLeft}px)`;
  }

  private clearFrozenColumnOverlays() {
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
  private maxWidthInput: TextComponent | null = null;

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
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
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
      .setName("First-column max width (px)")
      .setDesc("Cap the frozen first-column width to avoid taking too much space.")
      .addText((text) => {
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
            firstColumnMaxWidthPx: parsed,
          });
        });
      });

    new Setting(section)
      .setName("z-index")
      .setDesc("z-index value used for frozen first-column overlay.")
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
