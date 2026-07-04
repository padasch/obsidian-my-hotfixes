"use strict";var L=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var q=Object.getOwnPropertyNames;var K=Object.prototype.hasOwnProperty;var Y=(h,t)=>{for(var e in t)L(h,e,{get:t[e],enumerable:!0})},Z=(h,t,e,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let n of q(t))!K.call(h,n)&&n!==e&&L(h,n,{get:()=>t[n],enumerable:!(i=U(t,n))||i.enumerable});return h};var X=h=>Z(L({},"__esModule",{value:!0}),h);var ee={};Y(ee,{default:()=>F});module.exports=X(ee);var c=require("obsidian"),G="obsidian-hotfixes-runtime-styles",H="obsidian-hotfixes-frozen-table",M=180,k=60,I="obsidian-hotfixes:column-order",P="obsidian-hotfixes:column-widths",D="obsidian-hotfixes:view-feature-resize",N="obsidian-hotfixes:view-feature-reorder",W="obsidian-hotfixes:view-feature-preserve-links",A="obsidian-hotfixes:view-feature-edit-notes",Q="obsidian-hotfixes:view-feature-wrap-mode",O="obsidian-hotfixes:view-feature-truncate",_="obsidian-hotfixes:view-feature-cell-height",y=".obsidian-hotfixes-base-view-switcher",$=34,z={enableResize:!1,enableReorder:!1,preserveLinks:!0,editableNotes:!1,wrapMode:"narrow",cellHeightPx:$};function S(h,t){return typeof h=="boolean"?h:t}function j(h,t,e){return typeof h=="string"&&t.includes(h)?h:e}function J(h,t){if(typeof h=="number")return Number.isFinite(h)?h:t;if(typeof h=="object"&&h!==null&&"value"in h&&typeof h.value=="number"){let e=h.value;return Number.isFinite(e)?e:t}if(typeof h=="object"&&h!==null&&"value"in h&&typeof h.value=="string"){let e=Number.parseFloat(h.value);return Number.isFinite(e)?e:t}if(typeof h=="string"){let e=Number.parseFloat(h);return Number.isFinite(e)?e:t}return t}function v(h){let t=j(h.get(Q),["narrow","wide"],z.wrapMode),e=S(h.get(O),t==="narrow");return{enableResize:S(h.get(D),z.enableResize),enableReorder:S(h.get(N),z.enableReorder),preserveLinks:S(h.get(W),z.preserveLinks),editableNotes:S(h.get(A),z.editableNotes),wrapMode:e?"narrow":"wide",cellHeightPx:J(h.get(_),z.cellHeightPx)}}var T={freezeFirstColumn:{enabled:!1,firstColumnMinWidthPx:220,firstColumnMaxWidthPx:320,backgroundColor:"var(--background-primary)",zIndex:4,showDivider:!0},baseViewSwitcher:{enabled:!1,showInBaseFiles:!0,showInEmbeds:!0}},F=class extends c.Plugin{settings={freezeFirstColumn:{...T.freezeFirstColumn},baseViewSwitcher:{...T.baseViewSwitcher}};styleElement=null;baseViewSwitcherObserver=null;baseViewSwitcherRefreshFrame=null;baseViewSwitcherRefreshToken=0;async onload(){await this.loadSettings(),this.applyStyles(),this.registerSettingTab(),this.registerBasesView(H,{name:"Frozen Table",icon:"lucide-layout-grid",factory:(e,i)=>new B(e,i,this),options:e=>{let i=v(e);return[{type:"group",displayName:"Frozen table options",items:[{type:"toggle",key:D,displayName:"Enable column resizing",default:i.enableResize},{type:"toggle",key:N,displayName:"Enable column reordering",default:i.enableReorder},{type:"toggle",key:W,displayName:"Preserve inline link rendering",default:i.preserveLinks},{type:"toggle",key:A,displayName:"Enable note-cell editing",default:i.editableNotes},{type:"toggle",key:O,displayName:"Truncate long text",default:i.wrapMode==="narrow"},{type:"slider",key:_,displayName:"Cell height (px)",default:i.cellHeightPx,instant:!0,min:1,max:100,step:1,displayFormat:n=>`${n}px`}]}]}})||console.warn("[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("file-open",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.vault.on("modify",e=>{e instanceof c.TFile&&e.extension==="base"&&this.scheduleBaseViewSwitcherRefresh()})),this.registerDomEvent(window,"resize",()=>this.refreshOpenFrozenViews()),this.configureBaseViewSwitcher()}onunload(){this.stopBaseViewSwitcher(),this.styleElement&&(this.styleElement.remove(),this.styleElement=null)}registerSettingTab(){this.addSettingTab(new R(this.app,this))}async loadSettings(){let t=await this.loadData();this.settings={...T,...t,freezeFirstColumn:{...T.freezeFirstColumn,...t?.freezeFirstColumn??{}},baseViewSwitcher:{...T.baseViewSwitcher,...t?.baseViewSwitcher??{}}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.refreshOpenFrozenViews(),this.configureBaseViewSwitcher()}applyStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=G,document.head.appendChild(this.styleElement));let t=this.settings.freezeFirstColumn,e=Math.max(80,t.firstColumnMinWidthPx),i=Math.max(e,t.firstColumnMaxWidthPx),n=t.showDivider?"1px solid var(--background-modifier-border)":"none";this.styleElement.textContent=`
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${e}px;
  --obsidian-hotfixes-first-column-max-width: ${i}px;
  --obsidian-hotfixes-cell-height: ${$}px;
  --obsidian-hotfixes-first-column-bg: ${t.backgroundColor};
  --obsidian-hotfixes-first-column-z: ${t.zIndex};
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
  border-right: ${n};
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
  position: relative;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  pointer-events: auto;
  padding: 6px 8px;
  border-bottom: 1px solid var(--background-modifier-border);
  background: var(--background-primary);
}

.obsidian-hotfixes-base-view-switcher-button {
  pointer-events: auto;
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
`.trim()}refreshOpenFrozenViews(){this.app.workspace.iterateAllLeaves(t=>{let e=t.view;e instanceof B&&e.onDataUpdated()})}async updateFreezeFirstColumn(t){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...t},await this.saveSettings()}async updateBaseViewSwitcher(t){this.settings.baseViewSwitcher={...this.settings.baseViewSwitcher,...t},await this.saveSettings()}configureBaseViewSwitcher(){if(this.settings.baseViewSwitcher.enabled){this.startBaseViewSwitcher();return}this.stopBaseViewSwitcher()}startBaseViewSwitcher(){this.baseViewSwitcherObserver||(this.baseViewSwitcherObserver=new MutationObserver(t=>{t.every(e=>this.isBaseViewSwitcherMutation(e))||this.scheduleBaseViewSwitcherRefresh()}),this.baseViewSwitcherObserver.observe(document.body,{childList:!0,subtree:!0})),this.scheduleBaseViewSwitcherRefresh()}stopBaseViewSwitcher(){this.baseViewSwitcherRefreshFrame!==null&&(window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame),this.baseViewSwitcherRefreshFrame=null),this.baseViewSwitcherRefreshToken++,this.baseViewSwitcherObserver&&(this.baseViewSwitcherObserver.disconnect(),this.baseViewSwitcherObserver=null),document.querySelectorAll(y).forEach(t=>t.remove())}scheduleBaseViewSwitcherRefresh(){this.settings.baseViewSwitcher.enabled&&this.baseViewSwitcherRefreshFrame===null&&(this.baseViewSwitcherRefreshFrame=window.requestAnimationFrame(()=>{this.baseViewSwitcherRefreshFrame=null,this.refreshBaseViewSwitchers()}))}async refreshBaseViewSwitchers(){let t=++this.baseViewSwitcherRefreshToken;if(!this.settings.baseViewSwitcher.enabled)return;this.removeOrphanedBaseViewSwitchers();let e=this.findBaseViewSwitcherTargets();for(let i of e){if(t!==this.baseViewSwitcherRefreshToken)return;await this.renderBaseViewSwitcher(i)}}removeOrphanedBaseViewSwitchers(){document.querySelectorAll(y).forEach(t=>{t.nextElementSibling?.matches(".bases-header")||t.remove()})}findBaseViewSwitcherTargets(){let t=this.settings.baseViewSwitcher,e=[],i=new Set;return document.querySelectorAll(".bases-header").forEach(r=>{if(i.has(r))return;i.add(r);let l=r.closest(".bases-embed"),o=this.getOwningFileView(r),s=o?.file?.path??"",a=l!==null;if(a&&!t.showInEmbeds){this.removeBaseViewSwitcherBefore(r);return}if(!a&&!t.showInBaseFiles){this.removeBaseViewSwitcherBefore(r);return}let d=l?this.resolveEmbeddedBaseFile(l,s):o?.file instanceof c.TFile&&o.file.extension==="base"?o.file:null;if(!d){this.removeBaseViewSwitcherBefore(r);return}e.push({headerEl:r,baseFile:d})}),e}getOwningFileView(t){let e=null;return this.app.workspace.iterateAllLeaves(i=>{if(e)return;let n=i.view;n.containerEl?.contains(t)&&(e={containerEl:n.containerEl,file:n.file instanceof c.TFile?n.file:null,view:i.view})}),e}resolveEmbeddedBaseFile(t,e){let i=[t,t.closest(".internal-embed")].filter(r=>r!==null),n=[];for(let r of i)n.push(r.getAttribute("src")??"",r.getAttribute("data-src")??"",r.getAttribute("data-path")??"",r.getAttribute("alt")??"");for(let r of n){let l=this.normalizeBaseLinkCandidate(r);if(!l)continue;let o=this.app.vault.getFileByPath(l);if(o?.extension==="base")return o;let s=this.app.metadataCache.getFirstLinkpathDest(l,e);if(s instanceof c.TFile&&s.extension==="base")return s}return null}normalizeBaseLinkCandidate(t){let e=t.trim();if(!e)return null;try{e=decodeURIComponent(e)}catch{}return e=e.replace(/^!\[\[/,"").replace(/^\[\[/,"").replace(/\]\]$/,"").split("|")[0].split("#")[0].trim(),e||null}findNativeBaseViewButton(t,e=[]){let i=[".bases-toolbar-item.bases-toolbar-views-menu .text-icon-button",".bases-toolbar-views-menu .text-icon-button",".bases-toolbar-item.bases-toolbar-views-menu",".bases-toolbar-views-menu",".bases-toolbar-view-menu",".bases-toolbar-item.mod-view",".bases-toolbar-item.mod-view-menu"];for(let s of i){let a=t.querySelector(s);if(a)return a}let n=new Set(e.map(s=>this.normalizeText(s))),r=Array.from(t.querySelectorAll(".bases-toolbar-item, button, [role='button']")).filter(s=>this.isVisibleElement(s)),l=r.find(s=>{let a=this.normalizeText(s.innerText||s.textContent||"");if(!a)return!1;for(let d of n)if(a===d||a.includes(d))return!0;return!1});if(l)return l;let o=r.find(s=>this.normalizeText(s.getAttribute("aria-label")||s.getAttribute("title")||"").toLowerCase().includes("view"));return o||(r[0]??null)}async renderBaseViewSwitcher(t){if(!t.headerEl.isConnected)return;let e=await this.readBaseViewDefinitions(t.baseFile);if(!t.headerEl.isConnected)return;if(e.length<2){this.removeBaseViewSwitcherBefore(t.headerEl);return}let i=t.headerEl.parentElement;if(!i)return;let n=this.getBaseViewSwitcherBefore(t.headerEl);n||(n=document.createElement("div"),n.className="obsidian-hotfixes-base-view-switcher",i.insertBefore(n,t.headerEl));let r=this.findNativeBaseViewButton(t.headerEl,e.map(s=>s.name)),l=this.getBaseControllerForHeader(t.headerEl),o=this.findActiveBaseViewName(typeof l?.viewName=="string"?l.viewName:r?this.normalizeText(r.innerText||r.textContent||""):null,e);n.empty(),n.dataset.basePath=t.baseFile.path,n.setAttribute("role","toolbar"),n.setAttribute("aria-label","Base views");for(let s of e){let a=document.createElement("button");a.type="button",a.className="obsidian-hotfixes-base-view-switcher-button",a.textContent=s.name,a.title=`${t.baseFile.basename}: ${s.name}`,a.dataset.viewName=s.name,s.name===o&&a.setAttribute("aria-current","true"),a.addEventListener("pointerdown",d=>{d.stopPropagation()}),a.addEventListener("mousedown",d=>{d.stopPropagation()}),a.addEventListener("click",d=>{if(d.preventDefault(),d.stopPropagation(),a.getAttribute("aria-current")==="true")return;let m=this.getBaseViewSwitcherHeader(a);if(!m){this.scheduleBaseViewSwitcherRefresh();return}this.switchBaseToView(m,s.name)}),n.appendChild(a)}}async readBaseViewDefinitions(t){try{let e=await this.app.vault.cachedRead(t),i=(0,c.parseYaml)(e);return!i||!Array.isArray(i.views)?[]:i.views.map(n=>({name:typeof n?.name=="string"?n.name.trim():""})).filter(n=>n.name.length>0)}catch(e){return console.warn("[Obsidian Hotfixes] Failed to read Base views.",t.path,e),[]}}getBaseViewSwitcherBefore(t){let e=t.previousElementSibling;return e instanceof HTMLElement&&e.matches(y)?e:null}removeBaseViewSwitcherBefore(t){this.getBaseViewSwitcherBefore(t)?.remove()}getBaseViewSwitcherHeader(t){let i=t.closest(y)?.nextElementSibling;return i instanceof HTMLElement&&i.matches(".bases-header")?i:null}findActiveBaseViewName(t,e){if(!t)return null;let i=this.normalizeText(t),n=e.find(l=>this.normalizeText(l.name)===i);return n?n.name:e.find(l=>i.includes(this.normalizeText(l.name)))?.name??null}async switchBaseToView(t,e){let i=this.getBaseViewSwitcherBefore(t),n=i?Array.from(i.querySelectorAll(".obsidian-hotfixes-base-view-switcher-button")).map(m=>m.dataset.viewName??m.textContent??""):[],r=this.getBaseControllerForHeader(t);if(r?.selectView&&r.getQueryViewNames?.().includes(e)){r.selectView(e),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80);return}let l=this.findNativeBaseViewButton(t,n);if(!l){console.warn("[Obsidian Hotfixes] Could not find native Bases view menu button.");return}let o=new Set(Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")));this.activateElement(l);let s=await this.waitForNewMenuItems(o),a=s.length>0?s:Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")),d=this.findMenuItemForView(a,e);if(!d){console.warn("[Obsidian Hotfixes] Could not find Bases view menu item.",e);return}this.activateElement(d),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80)}findMenuItemForView(t,e){let i=this.normalizeText(e),n=t.filter(o=>o.closest('[data-group="views"]')!==null),r=n.length>0?n:t,l=r.find(o=>this.normalizeMenuItemText(o)===i);return l||(r.find(o=>{let a=this.normalizeMenuItemText(o).split(/\r?\n/u)[0]??"";return this.normalizeText(a)===i})??null)}normalizeText(t){return t.replace(/\s+/g," ").trim()}isBaseViewSwitcherMutation(t){if(t.target instanceof HTMLElement&&t.target.closest(y))return!0;let e=[...Array.from(t.addedNodes),...Array.from(t.removedNodes)];return e.length>0&&e.every(i=>this.isBaseViewSwitcherNode(i))}isBaseViewSwitcherNode(t){return t instanceof HTMLElement?t.matches(y)||t.closest(y)!==null:!1}normalizeMenuItemText(t){let e=t.querySelector(".bases-toolbar-menu-item-name");return this.normalizeText(e?.innerText||e?.textContent||t.innerText||t.textContent||"")}getBaseControllerForHeader(t){let n=this.getOwningFileView(t)?.view?.controller;return n&&typeof n.selectView=="function"&&typeof n.getQueryViewNames=="function"?n:null}isVisibleElement(t){let e=t.getBoundingClientRect(),i=window.getComputedStyle(t);return e.width>0&&e.height>0&&i.display!=="none"&&i.visibility!=="hidden"}activateElement(t){t.focus();let e={bubbles:!0,cancelable:!0,view:window,button:0,buttons:1},i={...e,buttons:0},n={...e,pointerId:1,pointerType:"mouse",isPrimary:!0},r={...i,pointerId:1,pointerType:"mouse",isPrimary:!0};try{t.dispatchEvent(new PointerEvent("pointerdown",n)),t.dispatchEvent(new MouseEvent("mousedown",e)),t.dispatchEvent(new PointerEvent("pointerup",r)),t.dispatchEvent(new MouseEvent("mouseup",i))}catch{t.dispatchEvent(new MouseEvent("mousedown",e)),t.dispatchEvent(new MouseEvent("mouseup",i))}t.dispatchEvent(new MouseEvent("click",i))}async waitForNewMenuItems(t,e=600){let i=Date.now()+e;for(;Date.now()<i;){await this.nextAnimationFrame();let n=Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")).filter(r=>r.isConnected&&!t.has(r)&&this.isVisibleElement(r));if(n.length>0)return n}return[]}nextAnimationFrame(){return new Promise(t=>{window.requestAnimationFrame(()=>t())})}},B=class extends c.BasesView{constructor(e,i,n){super(e);this.plugin=n;this.root=i.createDiv("obsidian-hotfixes-frozen-bases-root")}hoverPopover=null;root;activeView=null;activeEditor=null;currentPropertyOrder=[];columnElements=new Map;headerElements=new Map;activeColumnWidths=new Map;activeResizeColumn=null;activeResizeColumnIndex=null;resizeStartX=0;resizedColumnStartWidth=0;activeResizeWidth=0;activeResizeElement=null;activeResizePointerId=null;draggingColumn=null;activeDragTarget=null;onResizePointerMove=e=>{if(!v(this.config).enableResize||!this.activeResizeColumn||this.activeResizeColumnIndex===null)return;e.preventDefault();let n=e.clientX-this.resizeStartX,r=this.clampColumnWidth(this.resizedColumnStartWidth+n,this.activeResizeColumnIndex===0);this.activeResizeWidth=r,this.activeColumnWidths.set(this.activeResizeColumn,r),this.applyColumnWidth(this.activeResizeColumn,r)};onResizePointerUp=()=>{v(this.config).enableResize&&(!this.activeResizeColumn||this.activeResizeColumnIndex===null||(this.activeResizeWidth=this.clampColumnWidth(this.activeResizeWidth,this.activeResizeColumnIndex===0),this.activeColumnWidths.set(this.activeResizeColumn,this.activeResizeWidth),this.applyColumnWidth(this.activeResizeColumn,this.activeResizeWidth),this.persistColumnWidths(),this.stopColumnResize()))};startColumnResize=(e,i,n)=>{if(v(this.config).enableResize&&e.button===0){if(e.preventDefault(),e.stopPropagation(),this.activeResizeElement=e.currentTarget,this.activeResizePointerId=e.pointerId,this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.setPointerCapture(this.activeResizePointerId),this.activeResizeElement.style.userSelect="none"}catch{}this.activeResizeColumn=i,this.activeResizeColumnIndex=n,this.resizeStartX=e.clientX,this.resizedColumnStartWidth=this.getColumnWidth(i,n),this.activeResizeWidth=this.resizedColumnStartWidth,document.body.style.cursor="col-resize",document.addEventListener("pointermove",this.onResizePointerMove),document.addEventListener("pointerup",this.onResizePointerUp)}};stopColumnResize(){if(this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.releasePointerCapture(this.activeResizePointerId)}catch{}if(!this.activeResizeColumn){this.activeResizePointerId=null,this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeElement=null;return}document.removeEventListener("pointermove",this.onResizePointerMove),document.removeEventListener("pointerup",this.onResizePointerUp),this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeColumn=null,this.activeResizeColumnIndex=null,this.activeResizeWidth=0,this.resizeStartX=0,this.resizedColumnStartWidth=0,this.activeResizePointerId=null,this.activeResizeElement=null,document.body.style.cursor=""}type=H;onDataUpdated(){this.render()}render(){this.root.empty(),this.activeEditor&&(this.activeEditor=null);let e=v(this.config),i=Math.max(1,Math.min(100,Math.round(e.cellHeightPx)));if(this.root.className=`obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${e.wrapMode}`,this.root.style.setProperty("--obsidian-hotfixes-cell-height",`${i}px`),this.currentPropertyOrder=[],this.columnElements.clear(),this.headerElements.clear(),this.activeColumnWidths.clear(),this.stopColumnResize(),this.clearDragTargetStyles(),this.syncColumnWidths(),!this.plugin.settings.freezeFirstColumn.enabled){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"Frozen table view is disabled. Turn it on in plugin settings."});return}let n=this.getPropertyOrder();if(!n.length){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"No properties available for this Base."});return}n.forEach((g,x)=>{let u=this.getPropertyId(g),p=this.getColumnWidth(u,x);this.currentPropertyOrder[x]=u,this.activeColumnWidths.set(u,p)});let r=this.root.createDiv("obsidian-hotfixes-frozen-bases-view");this.activeView=r;let l=n.length>0?this.getPropertyId(n[0]):null;if(l){let g=this.getColumnWidth(l,0);r.style.setProperty("--obsidian-hotfixes-first-column-width",`${g}px`)}let o=r.createEl("table",{cls:"obsidian-hotfixes-table"}),s=o.createEl("colgroup"),d=o.createTHead().createEl("tr");n.forEach((g,x)=>{let u=this.getPropertyId(g),p=this.getColumnWidth(u,x),b=s.createEl("col");b.style.width=`${p}px`,b.style.minWidth=`${p}px`,b.style.maxWidth=`${p}px`,b.dataset.propertyId=u,this.columnElements.set(u,b);let V=this.config.getDisplayName(g),f=d.createEl("th",{text:V});if(f.dataset.propertyId=u,f.style.width=`${p}px`,f.style.minWidth=`${p}px`,f.style.maxWidth=`${p}px`,e.enableReorder&&(f.addClass("obsidian-hotfixes-frozen-bases-reorder-handle"),f.draggable=!0,f.addEventListener("dragstart",w=>this.onColumnDragStart(w,u)),f.addEventListener("dragover",w=>this.onColumnDragOver(w,u)),f.addEventListener("drop",w=>this.onColumnDrop(w,u)),f.addEventListener("dragleave",()=>this.clearDragTargetStyles()),f.addEventListener("dragend",this.onColumnDragEnd)),this.headerElements.set(u,f),e.enableResize){let w=f.createSpan({cls:"obsidian-hotfixes-frozen-bases-resize-handle"});w.setAttr("draggable","false"),w.addEventListener("pointerdown",E=>this.startColumnResize(E,u,x))}});let m=o.createTBody(),C=this.data.groupedData.length>1;for(let g of this.data.groupedData){let x=g.entries;if(x.length){if(C){let u=m.createEl("tr",{cls:"obsidian-hotfixes-group-row"}),p=g.key?.toString()??"Ungrouped",b=u.createEl("td",{text:p});b.colSpan=n.length}for(let u of x){let p=m.createEl("tr",{cls:"obsidian-hotfixes-data-row"});for(let b=0;b<n.length;b++){let V=n[b],f=this.getPropertyId(V),w=this.getColumnWidth(f,b),E=p.createEl("td");E.dataset.propertyId=f,E.style.width=`${w}px`,E.style.minWidth=`${w}px`,E.style.maxWidth=`${w}px`,this.renderCellValue(E,u,V,e)}}}}}getPropertyId(e){return String(e)}getDefaultFirstColumnWidth(){return Math.max(k,this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,M)}renderCellText(e,i){e.empty(),e.createSpan({text:i}),i&&(e.title=i)}renderLinkFriendlyCell(e,i,n,r){return!i||typeof n!="string"?!1:i instanceof c.UrlValue||i instanceof c.LinkValue||this.containsLikelyLinkSyntax(n)?(e.empty(),c.MarkdownRenderer.render(this.plugin.app,n,e,r,this.plugin).catch(()=>{this.renderCellText(e,n)}),!0):!1}containsLikelyLinkSyntax(e){let i=e.trim();return i?/^\[[^\]]+\]\([^\)]*\)$/u.test(i)||this.isLikelyUri(i)||/\[\[[^\]]+\]\]/.test(i)?!0:/(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(i):!1}isLikelyUri(e){return/^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(e)}renderUriLink(e,i,n){e.empty();let r=e.createEl("a",{text:n,href:i});r.addClass("external-link"),r.addEventListener("click",l=>{l.button!==0&&l.button!==1||(l.preventDefault(),window.open(i,"_blank","noopener,noreferrer"))}),r.addEventListener("mouseover",l=>{this.plugin.app.workspace.trigger("hover-link",{event:l,source:"bases",hoverParent:this,targetEl:r,linktext:i})})}renderMarkdownLink(e,i){let n=/^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(i.trim());if(!n||!n.groups)return!1;let r=(n.groups.href??"").trim().replace(/\s+["'][^"']*["']$/,""),l=n.groups.label?.trim()||r;return!r||!l||!this.isLikelyUri(r)?!1:(this.renderUriLink(e,r,l),!0)}renderCellValue(e,i,n,r){let l=(0,c.parsePropertyId)(n),o=i.getValue(n),s=o?o.toString():"";if(e.classList.remove("obsidian-hotfixes-note-cell"),l.type==="file"&&l.name==="name"){let a=e.createEl("a",{text:i.file.name,href:i.file.path});a.addClass("internal-link"),a.addEventListener("click",d=>{if(d.button!==0&&d.button!==1)return;let m=c.Keymap.isModEvent(d);if(d.preventDefault(),m===!0||m===!1){this.plugin.app.workspace.openLinkText(i.file.path,"",!!m);return}this.plugin.app.workspace.openLinkText(i.file.path,"",m)}),a.addEventListener("mouseover",d=>{this.plugin.app.workspace.trigger("hover-link",{event:d,source:"bases",hoverParent:this,targetEl:a,linktext:i.file.path})}),s&&(e.title=s);return}if(o&&r.preserveLinks){let a=e.createSpan(),d=i?.file?.path??"";if(this.renderMarkdownLink(a,s))return;if(this.isLikelyUri(s)){this.renderUriLink(a,s,s);return}if(!this.renderLinkFriendlyCell(a,o,s,d))try{let C=new c.RenderContext;C.hoverPopover=this.hoverPopover,o.renderTo(a,C)}catch(C){console.warn("[Obsidian Hotfixes] Failed to render value, falling back to plain text.",n,C),this.renderCellText(a,s)}}else{let a=e.createSpan();this.renderCellText(a,s)}l.type==="note"&&r.editableNotes&&(e.classList.add("obsidian-hotfixes-note-cell"),e.addEventListener("dblclick",()=>{this.beginEditNoteCell(e,i,l.name,s)})),s&&(e.title=s)}async beginEditNoteCell(e,i,n,r){if(this.activeEditor)return;let l=e.innerText,o=document.createElement("textarea");o.value=r,o.rows=1;let s=()=>{this.activeEditor=null,this.render()},a=async()=>{let d=o.value;d!==l&&await this.plugin.app.fileManager.processFrontMatter(i.file,m=>{m[n]=d}),s()};this.activeEditor=o,e.empty(),e.appendChild(o),o.focus(),o.className="obsidian-hotfixes-note-editor",o.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey?(d.preventDefault(),a()):d.key==="Escape"&&(d.preventDefault(),s())}),o.addEventListener("blur",()=>{a()})}getSavedColumnWidths(){let e=this.config.get(P),i=new Map;if(e&&typeof e=="object"&&!Array.isArray(e))for(let[n,r]of Object.entries(e)){let l=Number(r);Number.isFinite(l)&&i.set(n,l)}return i}syncColumnWidths(){let e=this.getSavedColumnWidths();this.activeColumnWidths.clear();for(let[i,n]of e.entries())this.activeColumnWidths.set(i,n)}getColumnWidth(e,i){let n=i===0?this.getDefaultFirstColumnWidth():M,r=this.activeColumnWidths.get(e),l=typeof r=="number"?r:n;return this.clampColumnWidth(l,i===0)}clampColumnWidth(e,i=!1){let n=Math.max(e,k);if(!i)return n;let r=this.plugin.settings.freezeFirstColumn,l=Math.max(k,r.firstColumnMinWidthPx),o=Math.max(l,r.firstColumnMaxWidthPx);return Math.min(Math.max(n,l),o)}applyColumnWidth(e,i){let n=this.currentPropertyOrder[0]===e,r=this.clampColumnWidth(i,n),l=this.columnElements.get(e);l&&(l.style.width=`${r}px`,l.style.minWidth=`${r}px`,l.style.maxWidth=`${r}px`);let o=this.headerElements.get(e);o&&(o.style.width=`${r}px`,o.style.minWidth=`${r}px`,o.style.maxWidth=`${r}px`),n&&this.activeView&&this.activeView.style.setProperty("--obsidian-hotfixes-first-column-width",`${r}px`)}persistColumnWidths(){let e={};for(let[i,n]of this.activeColumnWidths.entries())e[i]=n;this.config.set(P,e)}persistColumnOrder(e){this.config.set(I,e.map(i=>this.getPropertyId(i)))}safeAttributeValue(e){return e.replace(/"/g,'\\"')}clearDragTargetStyles(){this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach(e=>{e.removeAttribute("data-drag-target")}),this.activeDragTarget=null}onColumnDragStart(e,i){e.button===0&&v(this.config).enableReorder&&e.dataTransfer&&(this.draggingColumn=i,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",i))}onColumnDragOver(e,i){if(!v(this.config).enableReorder||!this.draggingColumn||this.draggingColumn===i||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.activeDragTarget===i))return;this.clearDragTargetStyles(),this.activeDragTarget=i;let n=this.root.querySelector(`th[data-property-id="${this.safeAttributeValue(i)}"]`);n&&n.setAttribute("data-drag-target","true")}onColumnDrop(e,i){if(!v(this.config).enableReorder||(e.preventDefault(),!this.draggingColumn||this.draggingColumn===i))return;let n=this.getCurrentColumnOrder(),r=n.findIndex(o=>this.getPropertyId(o)===this.draggingColumn),l=n.findIndex(o=>this.getPropertyId(o)===i);if(r===-1||l===-1){this.draggingColumn=null,this.clearDragTargetStyles();return}n.splice(r,1),n.splice(l,0,this.draggingColumn),this.persistColumnOrder(n),this.draggingColumn=null,this.clearDragTargetStyles(),this.render()}onColumnDragEnd=()=>{v(this.config).enableReorder&&(this.draggingColumn=null,this.clearDragTargetStyles())};getCurrentColumnOrder(){let e=this.config.get(I);if(Array.isArray(e)){let n=new Set(this.data.properties.map(o=>this.getPropertyId(o))),r=new Set,l=e.map(o=>typeof o=="string"?o:null).filter(o=>o!==null&&n.has(this.getPropertyId(o))&&(r.has(this.getPropertyId(o))?!1:(r.add(this.getPropertyId(o)),!0)));if(l.length>0){let o=new Set(l.map(a=>this.getPropertyId(a))),s=this.data.properties.filter(a=>!o.has(this.getPropertyId(a)));return[...l,...s]}}let i=this.config.getOrder();return i.length>0?i:this.data.properties}getPropertyOrder(){return this.getCurrentColumnOrder()}},R=class extends c.PluginSettingTab{plugin;minWidthInput=null;maxWidthInput=null;backgroundInput=null;zIndexInput=null;baseFileToggle=null;embeddedBaseToggle=null;constructor(t,e){super(t,e),this.plugin=e}setSectionEnabled(t){this.minWidthInput&&this.minWidthInput.setDisabled(!t),this.maxWidthInput&&this.maxWidthInput.setDisabled(!t),this.backgroundInput&&this.backgroundInput.setDisabled(!t),this.zIndexInput&&this.zIndexInput.setDisabled(!t)}setBaseViewSwitcherSectionEnabled(t){this.baseFileToggle&&this.baseFileToggle.setDisabled(!t),this.embeddedBaseToggle&&this.embeddedBaseToggle.setDisabled(!t)}display(){let{containerEl:t}=this;t.empty(),t.createEl("h2",{text:"Obsidian Hotfixes"});let e=t.createEl("details",{cls:"obsidian-hotfixes-setting-section"});e.createEl("summary",{text:"Bases: Frozen first column"});let i=e.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),n=this.plugin.settings.freezeFirstColumn;new c.Setting(i).setName("Enable custom frozen table view").setDesc("Use a custom Bases view with a sticky first column instead of overlay hacks.").addToggle(s=>{s.setValue(n.enabled),s.onChange(async a=>{await this.plugin.updateFreezeFirstColumn({enabled:a}),this.setSectionEnabled(a)})}),new c.Setting(i).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText(s=>{this.minWidthInput=s,s.setValue(String(n.firstColumnMinWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async a=>{let d=Number.parseInt(a,10);Number.isNaN(d)||d<80||await this.plugin.updateFreezeFirstColumn({firstColumnMinWidthPx:d})})}),new c.Setting(i).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText(s=>{this.maxWidthInput=s,s.setValue(String(n.firstColumnMaxWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async a=>{let d=Number.parseInt(a,10);Number.isNaN(d)||d<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:d})})}),new c.Setting(i).setName("Background").setDesc("Background used behind the frozen first column.").addText(s=>{this.backgroundInput=s,s.setValue(n.backgroundColor),s.setDisabled(!n.enabled),s.setPlaceholder("var(--background-primary)"),s.onChange(async a=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:a||T.freezeFirstColumn.backgroundColor})})}),new c.Setting(i).setName("z-index").setDesc("Stacking order for the frozen first column.").addText(s=>{this.zIndexInput=s,s.setValue(String(n.zIndex)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.setPlaceholder("4"),s.onChange(async a=>{let d=Number.parseInt(a,10);Number.isNaN(d)||await this.plugin.updateFreezeFirstColumn({zIndex:d})})}),new c.Setting(i).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle(s=>{s.setValue(n.showDivider),s.setDisabled(!n.enabled),s.onChange(async a=>{await this.plugin.updateFreezeFirstColumn({showDivider:a})})}),this.setSectionEnabled(n.enabled);let r=t.createEl("details",{cls:"obsidian-hotfixes-setting-section"});r.createEl("summary",{text:"Bases: Quick view switcher"});let l=r.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),o=this.plugin.settings.baseViewSwitcher;new c.Setting(l).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle(s=>{s.setValue(o.enabled),s.onChange(async a=>{await this.plugin.updateBaseViewSwitcher({enabled:a}),this.setBaseViewSwitcherSectionEnabled(a)})}),new c.Setting(l).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle(s=>{this.baseFileToggle=s,s.setValue(o.showInBaseFiles),s.setDisabled(!o.enabled),s.onChange(async a=>{await this.plugin.updateBaseViewSwitcher({showInBaseFiles:a})})}),new c.Setting(l).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle(s=>{this.embeddedBaseToggle=s,s.setValue(o.showInEmbeds),s.setDisabled(!o.enabled),s.onChange(async a=>{await this.plugin.updateBaseViewSwitcher({showInEmbeds:a})})}),this.setBaseViewSwitcherSectionEnabled(o.enabled)}};
