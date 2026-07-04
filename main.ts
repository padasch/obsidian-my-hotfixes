import {
  App,
  type BasesConfigFile,
  BasesView,
  type BasesViewConfig,
  HoverParent,
  HoverPopover,
  LinkValue,
  Keymap,
  RenderContext,
  PaneType,
  Plugin,
  PluginSettingTab,
  MarkdownRenderer,
  QueryController,
  Setting,
  TextComponent,
  TFile,
  ToggleComponent,
  UrlValue,
  parsePropertyId,
  parseYaml,
  type BasesPropertyId,
} from "obsidian";

const STYLE_ELEMENT_ID = "obsidian-hotfixes-runtime-styles";
const FROZEN_TABLE_VIEW_TYPE = "obsidian-hotfixes-frozen-table";
const DEFAULT_COLUMN_WIDTH_PX = 180;
const MIN_RESIZABLE_COLUMN_WIDTH_PX = 60;
const DRAGGABLE_ORDER_CONFIG_KEY = "obsidian-hotfixes:column-order";
const COLUMN_WIDTHS_CONFIG_KEY = "obsidian-hotfixes:column-widths";

const FROZEN_TABLE_RESIZE_FEATURE_KEY = "obsidian-hotfixes:view-feature-resize";
const FROZEN_TABLE_REORDER_FEATURE_KEY = "obsidian-hotfixes:view-feature-reorder";
const FROZEN_TABLE_LINKS_FEATURE_KEY = "obsidian-hotfixes:view-feature-preserve-links";
const FROZEN_TABLE_EDIT_FEATURE_KEY = "obsidian-hotfixes:view-feature-edit-notes";
const FROZEN_TABLE_WRAP_MODE_FEATURE_KEY = "obsidian-hotfixes:view-feature-wrap-mode";
const FROZEN_TABLE_TRUNCATE_FEATURE_KEY = "obsidian-hotfixes:view-feature-truncate";
const FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY = "obsidian-hotfixes:view-feature-cell-height";
const BASE_VIEW_SWITCHER_SELECTOR = ".obsidian-hotfixes-base-view-switcher";

const DEFAULT_CELL_HEIGHT_PX = 34;

type FrozenTableWrapMode = "narrow" | "wide";

interface FrozenTableViewFeatures {
  enableResize: boolean;
  enableReorder: boolean;
  preserveLinks: boolean;
  editableNotes: boolean;
  wrapMode: FrozenTableWrapMode;
  cellHeightPx: number;
}

const DEFAULT_FROZEN_TABLE_FEATURES: FrozenTableViewFeatures = {
  enableResize: false,
  enableReorder: false,
  preserveLinks: true,
  editableNotes: false,
  wrapMode: "narrow",
  cellHeightPx: DEFAULT_CELL_HEIGHT_PX,
};

function getBooleanFeatureValue(
  value: unknown,
  fallback: boolean
): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function getStringFeatureValue(
  value: unknown,
  allowed: ReadonlyArray<string>,
  fallback: string
): string {
  return typeof value === "string" && allowed.includes(value)
    ? value
    : fallback;
}

function getNumberFeatureValue(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "number"
  ) {
    const nestedValue = (value as { value: number }).value;
    return Number.isFinite(nestedValue) ? nestedValue : fallback;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    typeof (value as { value?: unknown }).value === "string"
  ) {
    const nestedParsed = Number.parseFloat(
      (value as { value: string }).value
    );
    return Number.isFinite(nestedParsed) ? nestedParsed : fallback;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function getFrozenTableViewFeatures(
  config: Pick<BasesViewConfig, "get">
): FrozenTableViewFeatures {
  const legacyWrapMode = getStringFeatureValue(
    config.get(FROZEN_TABLE_WRAP_MODE_FEATURE_KEY),
    ["narrow", "wide"],
    DEFAULT_FROZEN_TABLE_FEATURES.wrapMode
  );
  const truncateByToggle = getBooleanFeatureValue(
    config.get(FROZEN_TABLE_TRUNCATE_FEATURE_KEY),
    legacyWrapMode === "narrow"
  );

  return {
    enableResize: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_RESIZE_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.enableResize
    ),
    enableReorder: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_REORDER_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.enableReorder
    ),
    preserveLinks: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_LINKS_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.preserveLinks
    ),
    editableNotes: getBooleanFeatureValue(
      config.get(FROZEN_TABLE_EDIT_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.editableNotes
    ),
    wrapMode: truncateByToggle ? "narrow" : "wide",
    cellHeightPx: getNumberFeatureValue(
      config.get(FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY),
      DEFAULT_FROZEN_TABLE_FEATURES.cellHeightPx
    ),
  };
}

interface FreezeFirstColumnHotfixSettings {
  enabled: boolean;
  firstColumnMinWidthPx: number;
  firstColumnMaxWidthPx: number;
  backgroundColor: string;
  zIndex: number;
  showDivider: boolean;
}

interface BaseViewSwitcherHotfixSettings {
  enabled: boolean;
  showInBaseFiles: boolean;
  showInEmbeds: boolean;
}

interface HotfixSettings {
  freezeFirstColumn: FreezeFirstColumnHotfixSettings;
  baseViewSwitcher: BaseViewSwitcherHotfixSettings;
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
  baseViewSwitcher: {
    enabled: false,
    showInBaseFiles: true,
    showInEmbeds: true,
  },
};

interface BaseViewDefinition {
  name: string;
}

interface BaseViewSwitcherTarget {
  headerEl: HTMLElement;
  baseFile: TFile;
  nativeViewButton: HTMLElement | null;
  activeViewName: string | null;
}

export default class ObsidianHotfixesPlugin extends Plugin {
  settings: HotfixSettings = {
    freezeFirstColumn: { ...DEFAULT_SETTINGS.freezeFirstColumn },
    baseViewSwitcher: { ...DEFAULT_SETTINGS.baseViewSwitcher },
  };
  private styleElement: HTMLStyleElement | null = null;
  private baseViewSwitcherObserver: MutationObserver | null = null;
  private baseViewSwitcherRefreshFrame: number | null = null;
  private baseViewSwitcherRefreshToken = 0;

  async onload() {
    await this.loadSettings();
    this.applyStyles();
    this.registerSettingTab();
    const registered = this.registerBasesView(FROZEN_TABLE_VIEW_TYPE, {
      name: "Frozen Table",
      icon: "lucide-layout-grid",
      factory: (controller, containerEl) =>
        new FrozenTableBasesView(controller, containerEl, this),
      options: (config) => {
        const featureSettings = getFrozenTableViewFeatures(config);
        return [
          {
            type: "group",
            displayName: "Frozen table options",
            items: [
              {
                type: "toggle",
                key: FROZEN_TABLE_RESIZE_FEATURE_KEY,
                displayName: "Enable column resizing",
                default: featureSettings.enableResize,
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_REORDER_FEATURE_KEY,
                displayName: "Enable column reordering",
                default: featureSettings.enableReorder,
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_LINKS_FEATURE_KEY,
                displayName: "Preserve inline link rendering",
                default: featureSettings.preserveLinks,
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_EDIT_FEATURE_KEY,
                displayName: "Enable note-cell editing",
                default: featureSettings.editableNotes,
              },
              {
                type: "toggle",
                key: FROZEN_TABLE_TRUNCATE_FEATURE_KEY,
                displayName: "Truncate long text",
                default: featureSettings.wrapMode === "narrow",
              },
              {
                type: "slider",
                key: FROZEN_TABLE_CELL_HEIGHT_FEATURE_KEY,
                displayName: "Cell height (px)",
                default: featureSettings.cellHeightPx,
                instant: true,
                min: 1,
                max: 100,
                step: 1,
                displayFormat: (value: number) => `${value}px`,
              },
            ],
          },
        ];
      },
    });
    if (!registered) {
      console.warn(
        "[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."
      );
    }

    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.applyStyles();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.refreshOpenFrozenViews();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => {
        this.refreshOpenFrozenViews();
        this.scheduleBaseViewSwitcherRefresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && file.extension === "base") {
          this.scheduleBaseViewSwitcherRefresh();
        }
      })
    );
    this.registerDomEvent(window, "resize", () => this.refreshOpenFrozenViews());
    this.configureBaseViewSwitcher();
  }

  onunload() {
    this.stopBaseViewSwitcher();
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
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...loaded,
      freezeFirstColumn: {
        ...DEFAULT_SETTINGS.freezeFirstColumn,
        ...(loaded?.freezeFirstColumn ?? {}),
      },
      baseViewSwitcher: {
        ...DEFAULT_SETTINGS.baseViewSwitcher,
        ...(loaded?.baseViewSwitcher ?? {}),
      },
    };
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.applyStyles();
    this.refreshOpenFrozenViews();
    this.configureBaseViewSwitcher();
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
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${minWidth}px;
  --obsidian-hotfixes-first-column-max-width: ${maxWidth}px;
  --obsidian-hotfixes-cell-height: ${DEFAULT_CELL_HEIGHT_PX}px;
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
  width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: var(--font-ui-smaller);
  table-layout: fixed;
  max-width: none;
  min-width: max-content;
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
  box-sizing: border-box;
  min-height: var(--obsidian-hotfixes-cell-height);
}

.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table th,
.obsidian-hotfixes-wrap-narrow .obsidian-hotfixes-table td {
  height: var(--obsidian-hotfixes-cell-height);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.obsidian-hotfixes-wrap-wide .obsidian-hotfixes-table th,
.obsidian-hotfixes-wrap-wide .obsidian-hotfixes-table td {
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th:first-child,
.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table td:first-child {
  position: sticky;
  left: 0;
  min-width: var(--obsidian-hotfixes-first-column-min-width);
  width: var(--obsidian-hotfixes-first-column-width, var(--obsidian-hotfixes-first-column-min-width));
  max-width: var(--obsidian-hotfixes-first-column-max-width);
  background: var(--obsidian-hotfixes-first-column-bg);
  z-index: var(--obsidian-hotfixes-first-column-z);
  border-right: ${divider};
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th {
  position: relative;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: 10px;
  cursor: col-resize;
  user-select: none;
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

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-frozen-bases-reorder-handle {
  cursor: grab;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th[data-drag-target="true"] {
  outline: 1px solid var(--interactive-accent);
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

.obsidian-hotfixes-table tbody tr.obsidian-hotfixes-data-row:hover td {
  background: var(--background-modifier-hover);
}

.obsidian-hotfixes-note-cell {
  cursor: text;
}

.obsidian-hotfixes-note-cell textarea,
.obsidian-hotfixes-note-cell input {
  width: 100%;
  border: none;
  padding: 0;
  font: inherit;
  background: transparent;
  color: inherit;
  resize: none;
}

.obsidian-hotfixes-frozen-bases-empty {
  color: var(--text-muted);
  padding: 0.75rem 0.5rem;
}

.obsidian-hotfixes-base-view-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
}

.obsidian-hotfixes-base-view-switcher-button {
  height: 26px;
  max-width: 220px;
  padding: 0 8px;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  background: var(--background-secondary);
  color: var(--text-muted);
  cursor: pointer;
  font-size: var(--font-ui-smaller);
  line-height: 24px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.obsidian-hotfixes-base-view-switcher-button:hover {
  background: var(--background-modifier-hover);
  color: var(--text-normal);
}

.obsidian-hotfixes-base-view-switcher-button[aria-current="true"] {
  border-color: var(--interactive-accent);
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.obsidian-hotfixes-base-view-switcher-button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
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

  async updateBaseViewSwitcher(
    updates: Partial<BaseViewSwitcherHotfixSettings>
  ) {
    this.settings.baseViewSwitcher = {
      ...this.settings.baseViewSwitcher,
      ...updates,
    };
    await this.saveSettings();
  }

  private configureBaseViewSwitcher() {
    if (this.settings.baseViewSwitcher.enabled) {
      this.startBaseViewSwitcher();
      return;
    }

    this.stopBaseViewSwitcher();
  }

  private startBaseViewSwitcher() {
    if (!this.baseViewSwitcherObserver) {
      this.baseViewSwitcherObserver = new MutationObserver(() => {
        this.scheduleBaseViewSwitcherRefresh();
      });
      this.baseViewSwitcherObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    this.scheduleBaseViewSwitcherRefresh();
  }

  private stopBaseViewSwitcher() {
    if (this.baseViewSwitcherRefreshFrame !== null) {
      window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame);
      this.baseViewSwitcherRefreshFrame = null;
    }

    this.baseViewSwitcherRefreshToken++;
    if (this.baseViewSwitcherObserver) {
      this.baseViewSwitcherObserver.disconnect();
      this.baseViewSwitcherObserver = null;
    }

    document
      .querySelectorAll<HTMLElement>(BASE_VIEW_SWITCHER_SELECTOR)
      .forEach((row) => row.remove());
  }

  private scheduleBaseViewSwitcherRefresh() {
    if (!this.settings.baseViewSwitcher.enabled) {
      return;
    }

    if (this.baseViewSwitcherRefreshFrame !== null) {
      return;
    }

    this.baseViewSwitcherRefreshFrame = window.requestAnimationFrame(() => {
      this.baseViewSwitcherRefreshFrame = null;
      void this.refreshBaseViewSwitchers();
    });
  }

  private async refreshBaseViewSwitchers() {
    const token = ++this.baseViewSwitcherRefreshToken;
    if (!this.settings.baseViewSwitcher.enabled) {
      return;
    }

    this.removeOrphanedBaseViewSwitchers();
    const targets = this.findBaseViewSwitcherTargets();

    for (const target of targets) {
      if (token !== this.baseViewSwitcherRefreshToken) {
        return;
      }

      await this.renderBaseViewSwitcher(target);
    }
  }

  private removeOrphanedBaseViewSwitchers() {
    document
      .querySelectorAll<HTMLElement>(BASE_VIEW_SWITCHER_SELECTOR)
      .forEach((row) => {
        if (!row.nextElementSibling?.matches(".bases-header")) {
          row.remove();
        }
      });
  }

  private findBaseViewSwitcherTargets(): BaseViewSwitcherTarget[] {
    const settings = this.settings.baseViewSwitcher;
    const targets: BaseViewSwitcherTarget[] = [];
    const seenHeaders = new Set<HTMLElement>();
    const headers = document.querySelectorAll<HTMLElement>(".bases-header");

    headers.forEach((headerEl) => {
      if (seenHeaders.has(headerEl)) {
        return;
      }
      seenHeaders.add(headerEl);

      const embedEl = headerEl.closest<HTMLElement>(".bases-embed");
      const owner = this.getOwningFileView(headerEl);
      const sourcePath = owner?.file?.path ?? "";
      const isEmbeddedBase = embedEl !== null;

      if (isEmbeddedBase && !settings.showInEmbeds) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }

      if (!isEmbeddedBase && !settings.showInBaseFiles) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }

      const baseFile = embedEl
        ? this.resolveEmbeddedBaseFile(embedEl, sourcePath)
        : owner?.file instanceof TFile && owner.file.extension === "base"
          ? owner.file
          : null;

      if (!baseFile) {
        this.removeBaseViewSwitcherBefore(headerEl);
        return;
      }

      const nativeViewButton = this.findNativeBaseViewButton(headerEl);
      targets.push({
        headerEl,
        baseFile,
        nativeViewButton,
        activeViewName: nativeViewButton
          ? this.normalizeText(
              nativeViewButton.innerText ||
                nativeViewButton.textContent ||
                ""
            )
          : null,
      });
    });

    return targets;
  }

  private getOwningFileView(element: HTMLElement): {
    containerEl: HTMLElement;
    file: TFile | null;
  } | null {
    let owner: { containerEl: HTMLElement; file: TFile | null } | null = null;

    this.app.workspace.iterateAllLeaves((leaf) => {
      if (owner) {
        return;
      }

      const view = leaf.view as unknown as {
        containerEl?: HTMLElement;
        file?: unknown;
      };

      if (view.containerEl?.contains(element)) {
        owner = {
          containerEl: view.containerEl,
          file: view.file instanceof TFile ? view.file : null,
        };
      }
    });

    return owner;
  }

  private resolveEmbeddedBaseFile(
    embedEl: HTMLElement,
    sourcePath: string
  ): TFile | null {
    const candidateElements = [
      embedEl,
      embedEl.closest<HTMLElement>(".internal-embed"),
    ].filter((element): element is HTMLElement => element !== null);
    const candidates: string[] = [];

    for (const element of candidateElements) {
      candidates.push(
        element.getAttribute("src") ?? "",
        element.getAttribute("data-src") ?? "",
        element.getAttribute("data-path") ?? "",
        element.getAttribute("alt") ?? ""
      );
    }

    for (const candidate of candidates) {
      const linkpath = this.normalizeBaseLinkCandidate(candidate);
      if (!linkpath) {
        continue;
      }

      const directFile = this.app.vault.getFileByPath(linkpath);
      if (directFile?.extension === "base") {
        return directFile;
      }

      const resolved = this.app.metadataCache.getFirstLinkpathDest(
        linkpath,
        sourcePath
      );
      if (resolved instanceof TFile && resolved.extension === "base") {
        return resolved;
      }
    }

    return null;
  }

  private normalizeBaseLinkCandidate(value: string): string | null {
    let candidate = value.trim();
    if (!candidate) {
      return null;
    }

    try {
      candidate = decodeURIComponent(candidate);
    } catch {
      // Keep the original value when it is not URI-encoded.
    }

    candidate = candidate
      .replace(/^!\[\[/, "")
      .replace(/^\[\[/, "")
      .replace(/\]\]$/, "")
      .split("|")[0]
      .split("#")[0]
      .trim();

    if (!candidate) {
      return null;
    }

    return candidate;
  }

  private findNativeBaseViewButton(headerEl: HTMLElement): HTMLElement | null {
    const preferredSelectors = [
      ".bases-toolbar-view-menu",
      ".bases-toolbar-item.mod-view",
      ".bases-toolbar-item.mod-view-menu",
    ];

    for (const selector of preferredSelectors) {
      const found = headerEl.querySelector<HTMLElement>(selector);
      if (found) {
        return found;
      }
    }

    return headerEl.querySelector<HTMLElement>(
      ".bases-toolbar-item, button, [role='button']"
    );
  }

  private async renderBaseViewSwitcher(target: BaseViewSwitcherTarget) {
    if (!target.headerEl.isConnected) {
      return;
    }

    const views = await this.readBaseViewDefinitions(target.baseFile);
    if (!target.headerEl.isConnected) {
      return;
    }

    if (views.length < 2) {
      this.removeBaseViewSwitcherBefore(target.headerEl);
      return;
    }

    const parent = target.headerEl.parentElement;
    if (!parent) {
      return;
    }

    let row = this.getBaseViewSwitcherBefore(target.headerEl);
    if (!row) {
      row = document.createElement("div");
      row.className = "obsidian-hotfixes-base-view-switcher";
      parent.insertBefore(row, target.headerEl);
    }

    const activeViewName = this.findActiveBaseViewName(
      target.activeViewName,
      views
    );

    row.empty();
    row.dataset.basePath = target.baseFile.path;
    row.setAttribute("role", "toolbar");
    row.setAttribute("aria-label", "Base views");

    for (const view of views) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "obsidian-hotfixes-base-view-switcher-button";
      button.textContent = view.name;
      button.title = `${target.baseFile.basename}: ${view.name}`;
      button.dataset.viewName = view.name;
      if (view.name === activeViewName) {
        button.setAttribute("aria-current", "true");
      }

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (button.getAttribute("aria-current") === "true") {
          return;
        }
        void this.switchBaseToView(target.headerEl, view.name);
      });

      row.appendChild(button);
    }
  }

  private async readBaseViewDefinitions(
    baseFile: TFile
  ): Promise<BaseViewDefinition[]> {
    try {
      const content = await this.app.vault.cachedRead(baseFile);
      const config = parseYaml(content) as BasesConfigFile | null;
      if (!config || !Array.isArray(config.views)) {
        return [];
      }

      return config.views
        .map((view) => ({
          name: typeof view?.name === "string" ? view.name.trim() : "",
        }))
        .filter((view) => view.name.length > 0);
    } catch (error) {
      console.warn(
        "[Obsidian Hotfixes] Failed to read Base views.",
        baseFile.path,
        error
      );
      return [];
    }
  }

  private getBaseViewSwitcherBefore(headerEl: HTMLElement): HTMLElement | null {
    const previous = headerEl.previousElementSibling;
    if (
      previous instanceof HTMLElement &&
      previous.matches(BASE_VIEW_SWITCHER_SELECTOR)
    ) {
      return previous;
    }

    return null;
  }

  private removeBaseViewSwitcherBefore(headerEl: HTMLElement) {
    this.getBaseViewSwitcherBefore(headerEl)?.remove();
  }

  private findActiveBaseViewName(
    label: string | null,
    views: BaseViewDefinition[]
  ): string | null {
    if (!label) {
      return null;
    }

    const normalizedLabel = this.normalizeText(label);
    const exact = views.find(
      (view) => this.normalizeText(view.name) === normalizedLabel
    );
    if (exact) {
      return exact.name;
    }

    const contained = views.find((view) =>
      normalizedLabel.includes(this.normalizeText(view.name))
    );
    return contained?.name ?? null;
  }

  private async switchBaseToView(headerEl: HTMLElement, viewName: string) {
    const nativeViewButton = this.findNativeBaseViewButton(headerEl);
    if (!nativeViewButton) {
      return;
    }

    const menuItemsBefore = new Set(
      Array.from(
        document.querySelectorAll<HTMLElement>(".menu-item, [role='menuitem']")
      )
    );

    nativeViewButton.click();
    await this.nextAnimationFrame();
    await this.nextAnimationFrame();

    const newMenuItems = Array.from(
      document.querySelectorAll<HTMLElement>(".menu-item, [role='menuitem']")
    ).filter((item) => !menuItemsBefore.has(item));
    const candidates = newMenuItems.length > 0
      ? newMenuItems
      : Array.from(
          document.querySelectorAll<HTMLElement>(".menu-item, [role='menuitem']")
        );
    const targetItem = this.findMenuItemForView(candidates, viewName);

    if (!targetItem) {
      return;
    }

    targetItem.click();
    window.setTimeout(() => this.scheduleBaseViewSwitcherRefresh(), 80);
  }

  private findMenuItemForView(
    menuItems: HTMLElement[],
    viewName: string
  ): HTMLElement | null {
    const normalizedViewName = this.normalizeText(viewName);
    const exact = menuItems.find((item) =>
      this.normalizeText(item.innerText || item.textContent || "") ===
      normalizedViewName
    );
    if (exact) {
      return exact;
    }

    return menuItems.find((item) => {
      const rawText = item.innerText || item.textContent || "";
      const firstLine = rawText.split(/\r?\n/u)[0] ?? "";
      return this.normalizeText(firstLine) === normalizedViewName;
    }) ?? null;
  }

  private normalizeText(value: string): string {
    return value.replace(/\s+/g, " ").trim();
  }

  private nextAnimationFrame(): Promise<void> {
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
}

class FrozenTableBasesView extends BasesView implements HoverParent {
  hoverPopover: HoverPopover | null = null;
  private readonly root: HTMLDivElement;
  private activeView: HTMLDivElement | null = null;
  private activeEditor: HTMLTextAreaElement | null = null;
  private currentPropertyOrder: string[] = [];
  private readonly columnElements = new Map<string, HTMLTableColElement>();
  private readonly headerElements = new Map<string, HTMLTableHeaderCellElement>();
  private readonly activeColumnWidths = new Map<string, number>();
  private activeResizeColumn: string | null = null;
  private activeResizeColumnIndex: number | null = null;
  private resizeStartX = 0;
  private resizedColumnStartWidth = 0;
  private activeResizeWidth = 0;
  private activeResizeElement: HTMLElement | null = null;
  private activeResizePointerId: number | null = null;
  private draggingColumn: string | null = null;
  private activeDragTarget: string | null = null;

  private readonly onResizePointerMove = (event: PointerEvent) => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }

    if (
      !this.activeResizeColumn ||
      this.activeResizeColumnIndex === null
    ) {
      return;
    }

    event.preventDefault();

    const delta = event.clientX - this.resizeStartX;
    const width = this.clampColumnWidth(
      this.resizedColumnStartWidth + delta,
      this.activeResizeColumnIndex === 0
    );
    this.activeResizeWidth = width;
    this.activeColumnWidths.set(this.activeResizeColumn, width);
    this.applyColumnWidth(this.activeResizeColumn, width);
  };

  private readonly onResizePointerUp = () => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }

    if (!this.activeResizeColumn || this.activeResizeColumnIndex === null) {
      return;
    }

    this.activeResizeWidth = this.clampColumnWidth(
      this.activeResizeWidth,
      this.activeResizeColumnIndex === 0
    );
    this.activeColumnWidths.set(this.activeResizeColumn, this.activeResizeWidth);
    this.applyColumnWidth(this.activeResizeColumn, this.activeResizeWidth);
    this.persistColumnWidths();

    this.stopColumnResize();
  };

  private readonly startColumnResize = (
    event: PointerEvent,
    propertyId: string,
    index: number
  ) => {
    const features = getFrozenTableViewFeatures(this.config);
    if (!features.enableResize) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.activeResizeElement = event.currentTarget as HTMLElement | null;
    this.activeResizePointerId = event.pointerId;
    if (this.activeResizeElement && this.activeResizePointerId !== null) {
      try {
        this.activeResizeElement.setPointerCapture(this.activeResizePointerId);
        this.activeResizeElement.style.userSelect = "none";
      } catch {
        // Pointer capture can fail in edge cases (e.g. certain webviews).
      }
    }
    this.activeResizeColumn = propertyId;
    this.activeResizeColumnIndex = index;
    this.resizeStartX = event.clientX;
    this.resizedColumnStartWidth = this.getColumnWidth(propertyId, index);
    this.activeResizeWidth = this.resizedColumnStartWidth;

    document.body.style.cursor = "col-resize";
    document.addEventListener("pointermove", this.onResizePointerMove);
    document.addEventListener("pointerup", this.onResizePointerUp);
  };

  private stopColumnResize() {
    if (this.activeResizeElement && this.activeResizePointerId !== null) {
      try {
        this.activeResizeElement.releasePointerCapture(this.activeResizePointerId);
      } catch {
        // Pointer capture may not be active; ignore.
      }
    }

    if (!this.activeResizeColumn) {
      this.activeResizePointerId = null;
      if (this.activeResizeElement) {
        this.activeResizeElement.style.userSelect = "";
      }
      this.activeResizeElement = null;
      return;
    }

    document.removeEventListener("pointermove", this.onResizePointerMove);
    document.removeEventListener("pointerup", this.onResizePointerUp);
    if (this.activeResizeElement) {
      this.activeResizeElement.style.userSelect = "";
    }
    this.activeResizeColumn = null;
    this.activeResizeColumnIndex = null;
    this.activeResizeWidth = 0;
    this.resizeStartX = 0;
    this.resizedColumnStartWidth = 0;
    this.activeResizePointerId = null;
    this.activeResizeElement = null;
    document.body.style.cursor = "";
  }

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
    if (this.activeEditor) {
      this.activeEditor = null;
    }

    const features = getFrozenTableViewFeatures(this.config);
    const cellHeight = Math.max(
      1,
      Math.min(100, Math.round(features.cellHeightPx))
    );
    this.root.className = `obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${features.wrapMode}`;
    this.root.style.setProperty(
      "--obsidian-hotfixes-cell-height",
      `${cellHeight}px`
    );

    this.currentPropertyOrder = [];
    this.columnElements.clear();
    this.headerElements.clear();
    this.activeColumnWidths.clear();
    this.stopColumnResize();
    this.clearDragTargetStyles();
    this.syncColumnWidths();

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

    propertyOrder.forEach((propertyId, index) => {
      const key = this.getPropertyId(propertyId);
      const width = this.getColumnWidth(key, index);
      this.currentPropertyOrder[index] = key;
      this.activeColumnWidths.set(key, width);
    });

    const view = this.root.createDiv("obsidian-hotfixes-frozen-bases-view");
    this.activeView = view;
    const firstPropertyId = propertyOrder.length > 0 ? this.getPropertyId(propertyOrder[0]) : null;
    if (firstPropertyId) {
      const width = this.getColumnWidth(firstPropertyId, 0);
      view.style.setProperty("--obsidian-hotfixes-first-column-width", `${width}px`);
    }

    const table = view.createEl("table", { cls: "obsidian-hotfixes-table" });
    const colgroup = table.createEl("colgroup");
    const thead = table.createTHead();
    const headerRow = thead.createEl("tr");

    propertyOrder.forEach((propertyId, index) => {
      const propertyKey = this.getPropertyId(propertyId);
      const width = this.getColumnWidth(propertyKey, index);
      const col = colgroup.createEl("col");
      col.style.width = `${width}px`;
      col.style.minWidth = `${width}px`;
      col.style.maxWidth = `${width}px`;
      col.dataset.propertyId = propertyKey;
      this.columnElements.set(propertyKey, col);

      const name = this.config.getDisplayName(propertyId);
      const header = headerRow.createEl("th", { text: name });
      header.dataset.propertyId = propertyKey;
      header.style.width = `${width}px`;
      header.style.minWidth = `${width}px`;
      header.style.maxWidth = `${width}px`;
      if (features.enableReorder) {
        header.addClass("obsidian-hotfixes-frozen-bases-reorder-handle");
        header.draggable = true;
        header.addEventListener("dragstart", (event) =>
          this.onColumnDragStart(event, propertyKey)
        );
        header.addEventListener("dragover", (event) =>
          this.onColumnDragOver(event, propertyKey)
        );
        header.addEventListener("drop", (event) =>
          this.onColumnDrop(event, propertyKey)
        );
        header.addEventListener("dragleave", () => this.clearDragTargetStyles());
        header.addEventListener("dragend", this.onColumnDragEnd);
      }
      this.headerElements.set(propertyKey, header);

      if (features.enableResize) {
        const handle = header.createSpan({
          cls: "obsidian-hotfixes-frozen-bases-resize-handle",
        });
        handle.setAttr("draggable", "false");
        handle.addEventListener("pointerdown", (event) =>
          this.startColumnResize(event, propertyKey, index)
        );
      }
    });

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
        const row = tbody.createEl("tr", { cls: "obsidian-hotfixes-data-row" });
        for (let index = 0; index < propertyOrder.length; index++) {
          const propertyId = propertyOrder[index];
          const propertyKey = this.getPropertyId(propertyId);
          const width = this.getColumnWidth(propertyKey, index);
          const cell = row.createEl("td");
          cell.dataset.propertyId = propertyKey;
          cell.style.width = `${width}px`;
          cell.style.minWidth = `${width}px`;
          cell.style.maxWidth = `${width}px`;

          this.renderCellValue(cell, entry, propertyId, features);
        }
      }
    }
  }

  private getPropertyId(propertyId: BasesPropertyId): string {
    return String(propertyId);
  }

  private getDefaultFirstColumnWidth(): number {
    return Math.max(
      MIN_RESIZABLE_COLUMN_WIDTH_PX,
      this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,
      DEFAULT_COLUMN_WIDTH_PX
    );
  }

  private renderCellText(container: HTMLElement, textValue: string) {
    container.empty();
    container.createSpan({ text: textValue });
    if (textValue) {
      container.title = textValue;
    }
  }

  private renderLinkFriendlyCell(
    container: HTMLElement,
    value: any,
    textValue: string,
    sourcePath: string
  ): boolean {
    if (!value || typeof textValue !== "string") {
      return false;
    }

    if (
      value instanceof UrlValue ||
      value instanceof LinkValue ||
      this.containsLikelyLinkSyntax(textValue)
    ) {
      container.empty();

      void MarkdownRenderer.render(
        this.plugin.app,
        textValue,
        container,
        sourcePath,
        this.plugin
      ).catch(() => {
        this.renderCellText(container, textValue);
      });
      return true;
    }

    return false;
  }

  private containsLikelyLinkSyntax(value: string): boolean {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }

    if (/^\[[^\]]+\]\([^\)]*\)$/u.test(normalized)) {
      return true;
    }

    if (this.isLikelyUri(normalized)) {
      return true;
    }

    if (/\[\[[^\]]+\]\]/.test(normalized)) {
      return true;
    }

    return /(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(normalized);
  }

  private isLikelyUri(value: string): boolean {
    return /^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(value);
  }

  private renderUriLink(
    container: HTMLElement,
    href: string,
    label: string
  ) {
    container.empty();
    const link = container.createEl("a", {
      text: label,
      href,
    });
    link.addClass("external-link");

    link.addEventListener("click", (event) => {
      if (event.button !== 0 && event.button !== 1) {
        return;
      }

      event.preventDefault();
      window.open(href, "_blank", "noopener,noreferrer");
    });

    link.addEventListener("mouseover", (event) => {
      this.plugin.app.workspace.trigger("hover-link", {
        event,
        source: "bases",
        hoverParent: this,
        targetEl: link,
        linktext: href,
      });
    });

    return;
  }

  private renderMarkdownLink(container: HTMLElement, value: string): boolean {
    const match = /^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(
      value.trim()
    );
    if (!match || !match.groups) {
      return false;
    }

    const href = (match.groups["href"] ?? "")
      .trim()
      .replace(/\s+["'][^"']*["']$/, "");
    const label = match.groups["label"]?.trim() || href;
    if (!href || !label || !this.isLikelyUri(href)) {
      return false;
    }

    this.renderUriLink(container, href, label);
    return true;
  }

  private renderCellValue(
    cell: HTMLTableCellElement,
    entry: any,
    propertyId: BasesPropertyId,
    featureSettings: FrozenTableViewFeatures
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

    if (value && featureSettings.preserveLinks) {
      const content = cell.createSpan();
      const sourcePath = entry?.file?.path ?? "";
      if (this.renderMarkdownLink(content, textValue)) {
        return;
      }

      if (this.isLikelyUri(textValue)) {
        this.renderUriLink(content, textValue, textValue);
        return;
      }
      const renderedAsLinkFriendly = this.renderLinkFriendlyCell(
        content,
        value,
        textValue,
        sourcePath
      );

      if (!renderedAsLinkFriendly) {
        try {
          const context = new RenderContext();
          context.hoverPopover = this.hoverPopover;
          value.renderTo(content, context);
        } catch (error) {
          console.warn(
            "[Obsidian Hotfixes] Failed to render value, falling back to plain text.",
            propertyId,
            error
          );

          this.renderCellText(content, textValue);
        }
      }
    } else {
      const content = cell.createSpan();
      this.renderCellText(content, textValue);
    }

    if (parsed.type === "note" && featureSettings.editableNotes) {
      cell.classList.add("obsidian-hotfixes-note-cell");
      cell.addEventListener("dblclick", () => {
        void this.beginEditNoteCell(cell, entry, parsed.name, textValue);
      });
    }

    if (textValue) {
      cell.title = textValue;
    }
  }

  private async beginEditNoteCell(
    cell: HTMLTableCellElement,
    entry: any,
    propertyName: string,
    initialValue: string
  ) {
    if (this.activeEditor) {
      return;
    }

    const previousValue = cell.innerText;
    const editor = document.createElement("textarea");
    editor.value = initialValue;
    editor.rows = 1;

    const cancel = () => {
      this.activeEditor = null;
      this.render();
    };

    const commit = async () => {
      const nextValue = editor.value;
      if (nextValue !== previousValue) {
        await this.plugin.app.fileManager.processFrontMatter(
          entry.file,
          (frontmatter) => {
            frontmatter[propertyName] = nextValue;
          }
        );
      }
      cancel();
    };

    this.activeEditor = editor;
    cell.empty();
    cell.appendChild(editor);
    editor.focus();
    editor.className = "obsidian-hotfixes-note-editor";

    editor.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void commit();
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    });
    editor.addEventListener("blur", () => {
      void commit();
    });
  }

  private getSavedColumnWidths(): Map<string, number> {
    const saved = this.config.get(COLUMN_WIDTHS_CONFIG_KEY);
    const mapped = new Map<string, number>();

    if (
      saved &&
      typeof saved === "object" &&
      !Array.isArray(saved)
    ) {
      for (const [key, value] of Object.entries(saved)) {
        const width = Number(value);
        if (Number.isFinite(width)) {
          mapped.set(key, width);
        }
      }
    }
    return mapped;
  }

  private syncColumnWidths() {
    const loaded = this.getSavedColumnWidths();
    this.activeColumnWidths.clear();
    for (const [key, value] of loaded.entries()) {
      this.activeColumnWidths.set(key, value);
    }
  }

  private getColumnWidth(
    propertyId: string,
    index: number
  ): number {
    const fallbackDefault = index === 0
      ? this.getDefaultFirstColumnWidth()
      : DEFAULT_COLUMN_WIDTH_PX;
    const configured = this.activeColumnWidths.get(propertyId);
    const width = typeof configured === "number" ? configured : fallbackDefault;
    return this.clampColumnWidth(width, index === 0);
  }

  private clampColumnWidth(width: number, isFirstColumn = false): number {
    const normalized = Math.max(width, MIN_RESIZABLE_COLUMN_WIDTH_PX);
    if (!isFirstColumn) {
      return normalized;
    }

    const settings = this.plugin.settings.freezeFirstColumn;
    const min = Math.max(MIN_RESIZABLE_COLUMN_WIDTH_PX, settings.firstColumnMinWidthPx);
    const max = Math.max(min, settings.firstColumnMaxWidthPx);
    return Math.min(Math.max(normalized, min), max);
  }

  private applyColumnWidth(propertyId: string, width: number): void {
    const isFirstColumn = this.currentPropertyOrder[0] === propertyId;
    const normalized = this.clampColumnWidth(width, isFirstColumn);
    const column = this.columnElements.get(propertyId);
    if (column) {
      column.style.width = `${normalized}px`;
      column.style.minWidth = `${normalized}px`;
      column.style.maxWidth = `${normalized}px`;
    }

    const header = this.headerElements.get(propertyId);
    if (header) {
      header.style.width = `${normalized}px`;
      header.style.minWidth = `${normalized}px`;
      header.style.maxWidth = `${normalized}px`;
    }

    if (isFirstColumn && this.activeView) {
      this.activeView.style.setProperty(
        "--obsidian-hotfixes-first-column-width",
        `${normalized}px`
      );
    }
  }

  private persistColumnWidths() {
    const serialized: Record<string, number> = {};
    for (const [key, value] of this.activeColumnWidths.entries()) {
      serialized[key] = value;
    }
    this.config.set(COLUMN_WIDTHS_CONFIG_KEY, serialized);
  }

  private persistColumnOrder(order: BasesPropertyId[]) {
    this.config.set(
      DRAGGABLE_ORDER_CONFIG_KEY,
      order.map((propertyId) => this.getPropertyId(propertyId))
    );
  }

  private safeAttributeValue(value: string) {
    return value.replace(/"/g, '\\"');
  }

  private clearDragTargetStyles() {
    this.root
      .querySelectorAll<HTMLElement>(".obsidian-hotfixes-table th[data-drag-target]")
      .forEach((headerCell) => {
        headerCell.removeAttribute("data-drag-target");
      });
    this.activeDragTarget = null;
  }

  private onColumnDragStart(event: DragEvent, propertyId: string) {
    if (event.button !== 0) {
      return;
    }

    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }

    if (event.dataTransfer) {
      this.draggingColumn = propertyId;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", propertyId);
    }
  }

  private onColumnDragOver(event: DragEvent, propertyId: string) {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }

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

  private onColumnDrop(event: DragEvent, targetPropertyId: string) {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }

    event.preventDefault();
    if (!this.draggingColumn || this.draggingColumn === targetPropertyId) {
      return;
    }

    const order = this.getCurrentColumnOrder();
    const sourceIndex = order.findIndex((propertyId) =>
      this.getPropertyId(propertyId) === this.draggingColumn
    );
    const targetIndex = order.findIndex(
      (propertyId) => this.getPropertyId(propertyId) === targetPropertyId
    );
    if (sourceIndex === -1 || targetIndex === -1) {
      this.draggingColumn = null;
      this.clearDragTargetStyles();
      return;
    }

    order.splice(sourceIndex, 1);
    order.splice(targetIndex, 0, this.draggingColumn as BasesPropertyId);
    this.persistColumnOrder(order);
    this.draggingColumn = null;
    this.clearDragTargetStyles();
    this.render();
  }

  private onColumnDragEnd = () => {
    if (!getFrozenTableViewFeatures(this.config).enableReorder) {
      return;
    }

    this.draggingColumn = null;
    this.clearDragTargetStyles();
  };

  private getCurrentColumnOrder(): BasesPropertyId[] {
    const explicitOrder = this.config.get(DRAGGABLE_ORDER_CONFIG_KEY);
    if (Array.isArray(explicitOrder)) {
      const available = new Set(this.data.properties.map((propertyId) =>
        this.getPropertyId(propertyId)
      ));
      const seen = new Set<string>();
      const normalized = explicitOrder
        .map((value) =>
          typeof value === "string" ? (value as BasesPropertyId) : null
        )
        .filter(
          (value): value is BasesPropertyId =>
            value !== null &&
            available.has(this.getPropertyId(value)) &&
            (seen.has(this.getPropertyId(value)) ? false : (seen.add(this.getPropertyId(value)), true))
        );

      if (normalized.length > 0) {
        const normalizedSet = new Set(
          normalized.map((propertyId) => this.getPropertyId(propertyId))
        );
        const missing = this.data.properties.filter(
          (propertyId) => !normalizedSet.has(this.getPropertyId(propertyId))
        );
        return [...normalized, ...missing];
      }
    }

    const explicitOrderFromApi = this.config.getOrder();
    if (explicitOrderFromApi.length > 0) {
      return explicitOrderFromApi;
    }

    return this.data.properties;
  }

  private getPropertyOrder(): BasesPropertyId[] {
    return this.getCurrentColumnOrder();
  }
}

class HotfixesSettingTab extends PluginSettingTab {
  plugin: ObsidianHotfixesPlugin;
  private minWidthInput: TextComponent | null = null;
  private maxWidthInput: TextComponent | null = null;
  private backgroundInput: TextComponent | null = null;
  private zIndexInput: TextComponent | null = null;
  private baseFileToggle: ToggleComponent | null = null;
  private embeddedBaseToggle: ToggleComponent | null = null;

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

  private setBaseViewSwitcherSectionEnabled(enabled: boolean) {
    if (this.baseFileToggle) this.baseFileToggle.setDisabled(!enabled);
    if (this.embeddedBaseToggle) this.embeddedBaseToggle.setDisabled(!enabled);
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

    const switcherDetails = containerEl.createEl("details", {
      cls: "obsidian-hotfixes-setting-section",
    });
    switcherDetails.createEl("summary", {
      text: "Bases: Quick view switcher",
    });
    const switcherSection = switcherDetails.createEl("div", {
      cls: "obsidian-hotfixes-setting-section-content",
    });
    const switcherState = this.plugin.settings.baseViewSwitcher;

    new Setting(switcherSection)
      .setName("Enable view switcher row")
      .setDesc("Add compact buttons above each Base for jumping between its views.")
      .addToggle((toggle) => {
        toggle.setValue(switcherState.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateBaseViewSwitcher({ enabled: value });
          this.setBaseViewSwitcherSectionEnabled(value);
        });
      });

    new Setting(switcherSection)
      .setName("Show above opened .base files")
      .setDesc("Add the row when a Base file is opened directly.")
      .addToggle((toggle) => {
        this.baseFileToggle = toggle;
        toggle.setValue(switcherState.showInBaseFiles);
        toggle.setDisabled(!switcherState.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateBaseViewSwitcher({ showInBaseFiles: value });
        });
      });

    new Setting(switcherSection)
      .setName("Show above embedded Bases")
      .setDesc("Add the row for embedded .base files in notes.")
      .addToggle((toggle) => {
        this.embeddedBaseToggle = toggle;
        toggle.setValue(switcherState.showInEmbeds);
        toggle.setDisabled(!switcherState.enabled);
        toggle.onChange(async (value) => {
          await this.plugin.updateBaseViewSwitcher({ showInEmbeds: value });
        });
      });

    this.setBaseViewSwitcherSectionEnabled(switcherState.enabled);
  }
}
