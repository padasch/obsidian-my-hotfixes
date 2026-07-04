import {
  App,
  BasesPropertyId,
  BasesView,
  HoverParent,
  HoverPopover,
  Keymap,
  PaneType,
  Plugin,
  PluginSettingTab,
  QueryController,
  RenderContext,
  Setting,
  TextComponent,
  parsePropertyId,
} from "obsidian";

const STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";
const FROZEN_TABLE_VIEW_TYPE = "obsidian-hotfixes-frozen-table";
const COLUMN_WIDTHS_CONFIG_KEY = "obsidian-hotfixes:column-widths";

type ColumnWrapMode = "narrow" | "large";

interface FreezeFirstColumnHotfixSettings {
  enabled: boolean;
  firstColumnMinWidthPx: number;
  firstColumnMaxWidthPx: number;
  backgroundColor: string;
  zIndex: number;
  showDivider: boolean;
  columnWrapMode: ColumnWrapMode;
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
    columnWrapMode: "narrow",
  },
};

const MIN_COLUMN_WIDTH_PX = 60;
const DEFAULT_COLUMN_WIDTH_PX = 190;
const DRAGGABLE_ORDER_CONFIG_KEY = "order";

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

    this.styleElement.textContent = `
.obsidian-hotfixes-frozen-bases-view {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
  --obsidian-hotfixes-first-column-width: var(--obsidian-hotfixes-first-column-min-width);
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
  table-layout: fixed;
  font-size: var(--font-ui-smaller);
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
  vertical-align: top;
  position: relative;
}

.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-frozen-bases-view th,
.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-frozen-bases-view td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.obsidian-hotfixes-wrap-large .obsidian-hotfixes-frozen-bases-view th,
.obsidian-hotfixes-wrap-large .obsidian-hotfixes-frozen-bases-view td {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 100%;
  cursor: col-resize;
  z-index: 2;
  touch-action: none;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle::after {
  content: "";
  display: block;
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: var(--background-modifier-border);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th {
  background: var(--background-secondary);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th[data-drag-target="true"] {
  outline: 1px solid var(--interactive-accent);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  width: var(--obsidian-hotfixes-first-column-width);
  min-width: var(--obsidian-hotfixes-first-column-width);
  max-width: var(--obsidian-hotfixes-first-column-width);
  background: var(--obsidian-hotfixes-first-column-bg);
  z-index: var(--obsidian-hotfixes-first-column-z);
  border-right: ${config.showDivider ? "1px solid var(--background-modifier-border)" : "none"};
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table thead th:first-child {
  z-index: calc(var(--obsidian-hotfixes-first-column-z, 4) + 1);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-group-row td {
  background: var(--background-secondary);
  color: var(--text-muted);
  font-weight: 600;
  border-top: 1px solid var(--background-modifier-border);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell {
  cursor: text;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell textarea,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-note-cell input {
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: inherit;
  color: inherit;
  background: var(--background-primary);
  border: 1px solid var(--interactive-accent);
  border-radius: 4px;
  padding: 4px 6px;
  min-height: 24px;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-empty {
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
  private currentPropertyOrder: BasesPropertyId[] = [];
  private resizedColumnStartWidth = 0;
  private resizeStartX = 0;
  private activeResizeColumn: BasesPropertyId | null = null;
  private activeResizeColumnIndex: number | null = null;
  private activeResizeWidth = 0;
  private draggingColumn: BasesPropertyId | null = null;
  private activeDragTarget: BasesPropertyId | null = null;
  private activeColumnWidths = new Map<BasesPropertyId, number>();
  private activeEditor: HTMLInputElement | HTMLTextAreaElement | null = null;
  private activeView: HTMLDivElement | null = null;

  constructor(
    controller: QueryController,
    containerEl: HTMLElement,
    private plugin: ObsidianHotfixesPlugin
  ) {
    super(controller);
    this.root = containerEl.createDiv(
      "obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-narrow"
    );
  }

  readonly type = FROZEN_TABLE_VIEW_TYPE;

  public onDataUpdated(): void {
    this.render();
  }

  private getColumnWrapClass() {
    return this.plugin.settings.freezeFirstColumn.columnWrapMode === "large"
      ? "obsidian-hotfixes-wrap-large"
      : "obsidian-hotfixes-wrap-narrow";
  }

  private getSavedColumnWidths(): Map<BasesPropertyId, number> {
    const saved = this.config.get(COLUMN_WIDTHS_CONFIG_KEY);
    const mapped = new Map<BasesPropertyId, number>();

    if (
      saved &&
      typeof saved === "object" &&
      !Array.isArray(saved)
    ) {
      for (const [key, value] of Object.entries(saved)) {
        if (typeof value === "number" && Number.isFinite(value)) {
          mapped.set(key as BasesPropertyId, value);
        }
      }
    }

    return mapped;
  }

  private syncColumnWidths() {
    const loaded = this.getSavedColumnWidths();
    const configured = new Map<BasesPropertyId, number>(loaded);
    this.activeColumnWidths = configured;
  }

  private clampWidth(width: number, isFirstColumn: boolean): number {
    const min = isFirstColumn
      ? Math.max(
          MIN_COLUMN_WIDTH_PX,
          this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx
        )
      : MIN_COLUMN_WIDTH_PX;
    const max = isFirstColumn
      ? Math.max(
          min,
          this.plugin.settings.freezeFirstColumn.firstColumnMaxWidthPx
        )
      : 2000;
    return Math.max(min, Math.min(width, max));
  }

  private getColumnWidth(propertyId: BasesPropertyId, index: number): number {
    const configured = this.activeColumnWidths.get(propertyId);
    if (typeof configured === "number" && Number.isFinite(configured)) {
      return this.clampWidth(
        configured,
        index === 0 &&
          this.currentPropertyOrder[index] === propertyId
      );
    }

    if (index === 0) {
      return this.clampWidth(
        this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,
        true
      );
    }

    return DEFAULT_COLUMN_WIDTH_PX;
  }

  private persistColumnWidths() {
    const serialized: Record<string, number> = {};
    for (const [key, value] of this.activeColumnWidths.entries()) {
      serialized[key] = value;
    }
    this.config.set(COLUMN_WIDTHS_CONFIG_KEY, serialized);
  }

  private safeAttributeValue(value: string) {
    return value.replace(/"/g, '\\"');
  }

  private setFirstColumnWidth(width: number) {
    if (!this.activeView) {
      return;
    }
    this.activeView.style.setProperty(
      "--obsidian-hotfixes-first-column-width",
      `${width}px`
    );
  }

  private applyColumnWidthStyle(propertyId: BasesPropertyId, width: number) {
    const propertyValue = this.safeAttributeValue(propertyId);
    const selectors = `[data-property-id="${propertyValue}"]`;
    this.root.querySelectorAll<HTMLElement>(selectors).forEach((el) => {
      el.style.width = `${width}px`;
    });
    this.root
      .querySelectorAll<HTMLTableColElement>(
        `col[data-property-id="${propertyValue}"]`
      )
      .forEach((col) => {
        col.style.width = `${width}px`;
      });

    const first = this.currentPropertyOrder[0];
    if (first === propertyId) {
      this.setFirstColumnWidth(width);
    }
  }

  private beginResizeColumn(
    propertyId: BasesPropertyId,
    index: number,
    event: PointerEvent
  ) {
    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.activeResizeColumn = propertyId;
    this.activeResizeColumnIndex = index;
    this.resizeStartX = event.clientX;
    this.resizedColumnStartWidth = this.getColumnWidth(propertyId, index);
    this.activeResizeWidth = this.resizedColumnStartWidth;
    document.addEventListener("pointermove", this.onResizePointerMove);
    document.addEventListener("pointerup", this.onResizePointerUp);
    document.body.style.cursor = "col-resize";
  }

  private onResizePointerMove = (event: PointerEvent) => {
    if (!this.activeResizeColumn || this.activeResizeColumnIndex === null) {
      return;
    }

    const delta = event.clientX - this.resizeStartX;
    const nextWidth = this.clampWidth(
      this.resizedColumnStartWidth + delta,
      this.activeResizeColumnIndex === 0
    );
    this.activeResizeWidth = nextWidth;
    this.activeColumnWidths.set(this.activeResizeColumn, nextWidth);
    this.applyColumnWidthStyle(this.activeResizeColumn, nextWidth);
  };

  private onResizePointerUp = () => {
    if (!this.activeResizeColumn) {
      return;
    }

    if (Number.isFinite(this.activeResizeWidth)) {
      const isFirst = this.currentPropertyOrder[0] === this.activeResizeColumn;
      const clamped = this.clampWidth(this.activeResizeWidth, isFirst);
      this.activeColumnWidths.set(this.activeResizeColumn, clamped);
      this.applyColumnWidthStyle(this.activeResizeColumn, clamped);
      this.persistColumnWidths();
      this.render();
    }

    this.activeResizeColumn = null;
    this.activeResizeColumnIndex = null;
    this.activeResizeWidth = 0;
    this.resizeStartX = 0;
    this.resizedColumnStartWidth = 0;
    document.body.style.cursor = "";
    document.removeEventListener("pointermove", this.onResizePointerMove);
    document.removeEventListener("pointerup", this.onResizePointerUp);
  };

  private clearDragTargetStyles() {
    if (!this.root) {
      return;
    }
    this.root
      .querySelectorAll<HTMLElement>(".obsidian-hotfixes-table th[data-drag-target]")
      .forEach((headerCell) => {
        headerCell.removeAttribute("data-drag-target");
      });
    this.activeDragTarget = null;
  }

  private onColumnDragStart(event: DragEvent, propertyId: BasesPropertyId) {
    if (event.dataTransfer) {
      this.draggingColumn = propertyId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", propertyId);
    }
  }

  private onColumnDragOver(event: DragEvent, propertyId: BasesPropertyId) {
    if (!this.draggingColumn || this.draggingColumn === propertyId) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "move";
    }
    if (this.activeDragTarget === propertyId) {
      return;
    }
    this.clearDragTargetStyles();
    this.activeDragTarget = propertyId;
    const headerCell = this.root.querySelector<HTMLElement>(
      `th[data-property-id="${this.safeAttributeValue(propertyId)}"]`
    );
    if (headerCell) {
      headerCell.setAttribute("data-drag-target", "true");
    }
  }

  private onColumnDrop(event: DragEvent, targetPropertyId: BasesPropertyId) {
    event.preventDefault();
    if (!this.draggingColumn || this.draggingColumn === targetPropertyId) {
      return;
    }

    const order = this.getCurrentColumnOrder();
    const sourceIndex = order.indexOf(this.draggingColumn);
    const targetIndex = order.indexOf(targetPropertyId);
    if (sourceIndex === -1 || targetIndex === -1) {
      this.draggingColumn = null;
      this.clearDragTargetStyles();
      return;
    }

    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, this.draggingColumn);
    this.config.set(DRAGGABLE_ORDER_CONFIG_KEY, order);
    this.draggingColumn = null;
    this.clearDragTargetStyles();
    this.render();
  }

  private onColumnDragEnd = () => {
    this.draggingColumn = null;
    this.clearDragTargetStyles();
  };

  private async beginEditNoteCell(
    cell: HTMLTableCellElement,
    entry: any,
    propertyName: string,
    initialValue: string
  ) {
    if (this.activeEditor) {
      return;
    }

    const previous = cell.innerText;
    const input = document.createElement("textarea");
    input.value = initialValue;
    input.rows = 1;

    const cancel = () => {
      this.activeEditor = null;
      this.render();
    };

    const commit = async () => {
      const nextValue = input.value;
      if (nextValue !== previous) {
        await this.plugin.app.fileManager.processFrontMatter(
          entry.file,
          (frontmatter) => {
            frontmatter[propertyName] = nextValue;
          }
        );
      }
      cancel();
    };

    this.activeEditor = input;
    cell.empty();
    cell.appendChild(input);
    input.focus();
    input.selectionStart = input.value.length;
    input.selectionEnd = input.value.length;
    input.className = "obsidian-hotfixes-note-editor";

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });
    input.addEventListener("blur", () => {
      void commit();
    });
  }

  private addCellValue(
    cell: HTMLTableCellElement,
    entry: any,
    propertyId: BasesPropertyId
  ) {
    const parsed = parsePropertyId(propertyId);
    const value = entry.getValue(propertyId);
    const textValue = value ? value.toString() : "";
    cell.classList.remove("obsidian-hotfixes-note-cell");

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
      if (textValue) {
        cell.title = textValue;
      }
      return;
    }

    if (value) {
      const context = new RenderContext();
      context.hoverPopover = this.hoverPopover;
      value.renderTo(cell, context);
      if (textValue) {
        cell.title = textValue;
      }
    } else if (textValue) {
      cell.createSpan({ text: textValue });
      cell.title = textValue;
    }

    if (parsed.type === "note") {
      cell.addClass("obsidian-hotfixes-note-cell");
      cell.addEventListener("dblclick", () => {
        void this.beginEditNoteCell(cell, entry, parsed.name, textValue);
      });
    }
  }

  private getCurrentColumnOrder(): BasesPropertyId[] {
    const explicitOrder = this.config.getOrder();
    if (explicitOrder.length > 0) {
      return explicitOrder;
    }
    return this.data.properties;
  }

  private render() {
    this.root.empty();
    this.root.className = `obsidian-hotfixes-frozen-bases-root ${this.getColumnWrapClass()}`;
    this.clearDragTargetStyles();
    this.activeView = null;
    this.syncColumnWidths();

    if (!this.plugin.settings.freezeFirstColumn.enabled) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-empty",
        text: "Frozen table view is disabled. Turn it on in plugin settings.",
      });
      return;
    }

    const propertyOrder = this.getCurrentColumnOrder();
    if (!propertyOrder.length) {
      this.root.createDiv({
        cls: "obsidian-hotfixes-empty",
        text: "No properties available for this Base.",
      });
      return;
    }

    this.currentPropertyOrder = propertyOrder;
    this.currentPropertyOrder.forEach((propertyId, index) => {
      const configuredWidth = this.getColumnWidth(propertyId, index);
      this.activeColumnWidths.set(propertyId, configuredWidth);
    });

    const firstColumnWidth = this.getColumnWidth(
      propertyOrder[0],
      this.currentPropertyOrder[0] === propertyOrder[0] ? 0 : 0
    );

    const view = this.root.createDiv("obsidian-hotfixes-frozen-bases-view");
    this.activeView = view;
    this.setFirstColumnWidth(firstColumnWidth);

    const table = view.createEl("table", { cls: "obsidian-hotfixes-table" });
    const colgroup = table.createEl("colgroup");
    propertyOrder.forEach((propertyId, index) => {
      const width = this.getColumnWidth(propertyId, index);
      colgroup
        .createEl("col", { attr: { "data-property-id": propertyId } })
        .setAttr("style", `width: ${width}px;`);
    });

    const thead = table.createTHead();
    const headerRow = thead.createEl("tr");

    for (let index = 0; index < propertyOrder.length; index++) {
      const propertyId = propertyOrder[index];
      const width = this.getColumnWidth(propertyId, index);
      const name = this.config.getDisplayName(propertyId);
      const headerCell = headerRow.createEl("th", { text: name });
      headerCell.setAttribute("data-property-id", propertyId);
      headerCell.style.width = `${width}px`;
      headerCell.draggable = true;

      headerCell.addEventListener("dragstart", (event) =>
        this.onColumnDragStart(event, propertyId)
      );
      headerCell.addEventListener("dragover", (event) =>
        this.onColumnDragOver(event, propertyId)
      );
      headerCell.addEventListener("drop", (event) =>
        this.onColumnDrop(event, propertyId)
      );
      headerCell.addEventListener("dragleave", () =>
        this.clearDragTargetStyles()
      );
      headerCell.addEventListener("dragend", this.onColumnDragEnd);

      const resizeHandle = headerCell.createEl("span", {
        cls: "obsidian-hotfixes-frozen-bases-resize-handle",
      });
      resizeHandle.addEventListener("pointerdown", (event) =>
        this.beginResizeColumn(propertyId, index, event)
      );
    }

    const tbody = table.createTBody();
    const hasVisibleGrouping = this.data.groupedData.length > 1;

    for (const group of this.data.groupedData) {
      const entries = group.entries;
      if (!entries.length) {
        continue;
      }

      if (hasVisibleGrouping) {
        const groupRow = tbody.createEl("tr", {
          cls: "obsidian-hotfixes-group-row",
        });
        const keyValue = group.key?.toString() ?? "Ungrouped";
        const groupCell = groupRow.createEl("td", {
          text: keyValue,
        });
        groupCell.colSpan = propertyOrder.length;
      }

      for (const entry of entries) {
        const row = tbody.createEl("tr");
        for (let index = 0; index < propertyOrder.length; index++) {
          const propertyId = propertyOrder[index];
          const width = this.getColumnWidth(propertyId, index);
          const cell = row.createEl("td");
          cell.setAttribute("data-property-id", propertyId);
          cell.style.width = `${width}px`;
          this.addCellValue(cell, entry, propertyId);
        }
      }
    }
  }
}

class HotfixesSettingTab extends PluginSettingTab {
  plugin: ObsidianHotfixesPlugin;
  private minWidthInput: TextComponent | null = null;
  private maxWidthInput: TextComponent | null = null;
  private backgroundInput: TextComponent | null = null;
  private zIndexInput: TextComponent | null = null;
  private wrapModeSelect: HTMLSelectElement | null = null;

  constructor(app: App, plugin: ObsidianHotfixesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  private setSectionEnabled(enabled: boolean) {
    if (this.minWidthInput) this.minWidthInput.setDisabled(!enabled);
    if (this.maxWidthInput) this.maxWidthInput.setDisabled(!enabled);
    if (this.backgroundInput) this.backgroundInput.setDisabled(!enabled);
    if (this.zIndexInput) this.zIndexInput.setDisabled(!enabled);
    if (this.wrapModeSelect) this.wrapModeSelect.disabled = !enabled;
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
            backgroundColor:
              value || DEFAULT_SETTINGS.freezeFirstColumn.backgroundColor,
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

    new Setting(section)
      .setName("Cell wrap mode")
      .setDesc(
        "Choose how long values appear when they are wider than the column."
      )
      .addDropdown((dropdown) => {
        this.wrapModeSelect = dropdown.selectEl;
        dropdown
          .addOption("narrow", "Narrow (truncate)")
          .addOption("large", "Large (wrap)")
          .setValue(state.columnWrapMode)
          .setDisabled(!state.enabled);
        dropdown.onChange(async (value) => {
          if (value !== "narrow" && value !== "large") {
            return;
          }
          await this.plugin.updateFreezeFirstColumn({
            columnWrapMode: value,
          });
        });
      });

    this.setSectionEnabled(state.enabled);
  }
}
