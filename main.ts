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

${selector} .bases-table,
${selector} .bases-table-container {
  position: relative;
  overflow-x: auto;
  max-width: 100%;
}

${selector} .obsidian-hotfixes-first-column-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: ${config.zIndex};
  background: ${config.backgroundColor};
  ${divider}
  transform: translateX(0px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  will-change: transform, width, height;
}

${selector} .obsidian-hotfixes-first-column-overlay .obsidian-hotfixes-overlay-row {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  overflow: hidden;
  width: 100%;
}

${selector} .obsidian-hotfixes-overlay-row > .bases-td,
${selector} .obsidian-hotfixes-overlay-row > .bases-th,
${selector} .obsidian-hotfixes-overlay-row > td,
${selector} .obsidian-hotfixes-overlay-row > th,
${selector} .obsidian-hotfixes-overlay-row > div {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

${selector} .obsidian-hotfixes-hide-original-first-column {
  visibility: hidden;
  pointer-events: none;
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
    const container = this.findHorizontalScrollContainer(root);
    const rows = this.getTableFirstColumnRows(root);

    if (!rows.length) {
      return;
    }

    const overlayWidth = this.measureFrozenColumnWidth(rows, config.firstColumnMaxWidthPx);

    for (const rowLike of rows) {
      const firstCell = rowLike.firstCell;
      firstCell.classList.add("obsidian-hotfixes-hide-original-first-column");
      firstCell.style.width = `${overlayWidth}px`;
      firstCell.style.minWidth = `${Math.max(80, overlayWidth)}px`;
      firstCell.style.maxWidth = `${overlayWidth}px`;
      this.frozenCellElements.add(firstCell);
    }

    const overlay = this.ensureOverlay(container);
    this.renderOverlayRows(overlay, rows);
    this.syncOverlayStyles(overlay, container, overlayWidth);
    this.bindOverlayScrollSync(container, overlay);
  }

  private getTableFirstColumnRows(root: HTMLElement): TableRowLike[] {
    const rows = root.querySelectorAll<HTMLElement>("tr, .bases-tr, [role='row']");
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

      const parentSection =
        row.closest(".bases-thead") || row.closest("thead")
          ? "thead"
          : row.closest(".bases-tbody") || row.closest("tbody")
            ? "tbody"
            : row.closest(".bases-tfoot") || row.closest("tfoot")
              ? "tfoot"
              : "other";

      const section = parentSection;
      rowInfo.push({ sourceRow: row, firstCell, section });
    });

    return rowInfo;
  }

  private findHorizontalScrollContainer(root: HTMLElement): HTMLElement {
    const directCandidates = [
      root.querySelector<HTMLElement>(".bases-table"),
      root.querySelector<HTMLElement>(".bases-table-container"),
      root.querySelector<HTMLElement>(".bases-viewport"),
    ];

    for (const candidate of directCandidates) {
      if (!candidate) {
        continue;
      }
      if (this.isHorizontallyScrollable(candidate)) {
        return candidate;
      }
    }

    return root;
  }

  private isHorizontallyScrollable(container: HTMLElement): boolean {
    const style = window.getComputedStyle(container);
    const overflowX = style.overflowX;
    const overflow = style.overflow;
    const canScrollByOverflow =
      overflowX === "auto" ||
      overflowX === "scroll" ||
      overflow === "auto" ||
      overflow === "scroll";

    return canScrollByOverflow || container.scrollWidth > container.clientWidth + 1;
  }

  private ensureOverlay(container: HTMLElement): HTMLElement {
    let overlay = this.activeOverlays.get(container);
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "obsidian-hotfixes-first-column-overlay";
      container.appendChild(overlay);
      this.activeOverlays.set(container, overlay);
    }
    return overlay;
  }

  private renderOverlayRows(
    overlay: HTMLElement,
    rows: TableRowLike[]
  ) {
    const overlayRows: HTMLElement[] = [];

    rows.forEach((rowLike) => {
      const clonedCell = rowLike.firstCell.cloneNode(true) as HTMLTableCellElement;
      clonedCell.classList.add("obsidian-hotfixes-overlay-cell");
      const clonedRow = document.createElement("div");
      clonedRow.className = `obsidian-hotfixes-overlay-row obsidian-hotfixes-overlay-${rowLike.section}`;
      clonedRow.style.height = `${Math.max(1, rowLike.sourceRow.getBoundingClientRect().height)}px`;
      clonedRow.appendChild(clonedCell);
      overlayRows.push(clonedRow);
    });

    overlay.replaceChildren();
    overlay.append(...overlayRows);
  }

  private syncOverlayStyles(
    overlay: HTMLElement,
    container: HTMLElement,
    width: number
  ) {
    const config = this.settings.freezeFirstColumn;
    overlay.style.width = `${width}px`;
    overlay.style.left = `${config.leftOffsetPx}px`;
    overlay.style.height = `${Math.max(1, Math.ceil(container.scrollHeight))}px`;
    this.syncOverlayScroll(container, overlay);
  }

  private measureFrozenColumnWidth(
    rows: TableRowLike[],
    maxWidth: number
  ): number {
    const candidateWidth = rows.reduce<number>((acc, rowLike) => {
      const rect = rowLike.firstCell.getBoundingClientRect();
      return Math.max(acc, Math.ceil(rect.width), rowLike.firstCell.offsetWidth);
    }, 0);

    const resolved = Math.max(80, candidateWidth || maxWidth);
    return Math.min(maxWidth, resolved);
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
