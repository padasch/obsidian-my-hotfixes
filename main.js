"use strict";var L=Object.defineProperty;var Z=Object.getOwnPropertyDescriptor;var X=Object.getOwnPropertyNames;var j=Object.prototype.hasOwnProperty;var G=(h,i)=>{for(var e in i)L(h,e,{get:i[e],enumerable:!0})},Q=(h,i,e,t)=>{if(i&&typeof i=="object"||typeof i=="function")for(let n of X(i))!j.call(h,n)&&n!==e&&L(h,n,{get:()=>i[n],enumerable:!(t=Z(i,n))||t.enumerable});return h};var J=h=>Q(L({},"__esModule",{value:!0}),h);var re={};G(re,{default:()=>B});module.exports=J(re);var c=require("obsidian"),ee="obsidian-hotfixes-runtime-styles",H="obsidian-hotfixes-frozen-table",I=180,R=60,P="obsidian-hotfixes:column-order",D="obsidian-hotfixes:column-widths",N="obsidian-hotfixes:view-feature-resize",W="obsidian-hotfixes:view-feature-reorder",O="obsidian-hotfixes:view-feature-preserve-links",_="obsidian-hotfixes:view-feature-edit-notes",te="obsidian-hotfixes:view-feature-wrap-mode",U="obsidian-hotfixes:view-feature-truncate",$="obsidian-hotfixes:view-feature-cell-height",K="obsidian-hotfixes:view-feature-sort",A="obsidian-hotfixes:view-state-sort",S=".obsidian-hotfixes-base-view-switcher",Y=34,C={enableResize:!1,enableReorder:!1,preserveLinks:!0,editableNotes:!1,wrapMode:"narrow",cellHeightPx:Y,enableSorting:!0};function z(h,i){return typeof h=="boolean"?h:i}function ie(h,i,e){return typeof h=="string"&&i.includes(h)?h:e}function ne(h,i){if(typeof h=="number")return Number.isFinite(h)?h:i;if(typeof h=="object"&&h!==null&&"value"in h&&typeof h.value=="number"){let e=h.value;return Number.isFinite(e)?e:i}if(typeof h=="object"&&h!==null&&"value"in h&&typeof h.value=="string"){let e=Number.parseFloat(h.value);return Number.isFinite(e)?e:i}if(typeof h=="string"){let e=Number.parseFloat(h);return Number.isFinite(e)?e:i}return i}function g(h){let i=ie(h.get(te),["narrow","wide"],C.wrapMode),e=z(h.get(U),i==="narrow");return{enableResize:z(h.get(N),C.enableResize),enableReorder:z(h.get(W),C.enableReorder),preserveLinks:z(h.get(O),C.preserveLinks),editableNotes:z(h.get(_),C.editableNotes),wrapMode:e?"narrow":"wide",cellHeightPx:ne(h.get($),C.cellHeightPx),enableSorting:z(h.get(K),C.enableSorting)}}var T={freezeFirstColumn:{enabled:!1,firstColumnMinWidthPx:220,firstColumnMaxWidthPx:320,backgroundColor:"var(--background-primary)",zIndex:4,showDivider:!0},baseViewSwitcher:{enabled:!1,showInBaseFiles:!0,showInEmbeds:!0}},B=class extends c.Plugin{settings={freezeFirstColumn:{...T.freezeFirstColumn},baseViewSwitcher:{...T.baseViewSwitcher}};styleElement=null;baseViewSwitcherObserver=null;baseViewSwitcherRefreshFrame=null;baseViewSwitcherRefreshToken=0;async onload(){await this.loadSettings(),this.applyStyles(),this.registerSettingTab(),this.registerBasesView(H,{name:"Frozen Table",icon:"lucide-layout-grid",factory:(e,t)=>new k(e,t,this),options:e=>{let t=g(e);return[{type:"group",displayName:"Frozen table options",items:[{type:"toggle",key:N,displayName:"Enable column resizing",default:t.enableResize},{type:"toggle",key:W,displayName:"Enable column reordering",default:t.enableReorder},{type:"toggle",key:K,displayName:"Enable column sorting",default:t.enableSorting},{type:"toggle",key:O,displayName:"Preserve inline link rendering",default:t.preserveLinks},{type:"toggle",key:_,displayName:"Enable note-cell editing",default:t.editableNotes},{type:"toggle",key:U,displayName:"Truncate long text",default:t.wrapMode==="narrow"},{type:"slider",key:$,displayName:"Cell height (px)",default:t.cellHeightPx,instant:!0,min:1,max:100,step:1,displayFormat:n=>`${n}px`}]}]}})||console.warn("[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("file-open",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.vault.on("modify",e=>{e instanceof c.TFile&&e.extension==="base"&&this.scheduleBaseViewSwitcherRefresh()})),this.registerDomEvent(window,"resize",()=>this.refreshOpenFrozenViews()),this.configureBaseViewSwitcher()}onunload(){this.stopBaseViewSwitcher(),this.styleElement&&(this.styleElement.remove(),this.styleElement=null)}registerSettingTab(){this.addSettingTab(new M(this.app,this))}async loadSettings(){let i=await this.loadData();this.settings={...T,...i,freezeFirstColumn:{...T.freezeFirstColumn,...i?.freezeFirstColumn??{}},baseViewSwitcher:{...T.baseViewSwitcher,...i?.baseViewSwitcher??{}}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.refreshOpenFrozenViews(),this.configureBaseViewSwitcher()}applyStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=ee,document.head.appendChild(this.styleElement));let i=this.settings.freezeFirstColumn,e=Math.max(80,i.firstColumnMinWidthPx),t=Math.max(e,i.firstColumnMaxWidthPx),n=i.showDivider?"1px solid var(--background-modifier-border)":"none";this.styleElement.textContent=`
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${e}px;
  --obsidian-hotfixes-first-column-max-width: ${t}px;
  --obsidian-hotfixes-cell-height: ${Y}px;
  --obsidian-hotfixes-first-column-bg: ${i.backgroundColor};
  --obsidian-hotfixes-first-column-z: ${i.zIndex};
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

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th.obsidian-hotfixes-frozen-bases-sortable {
  cursor: pointer;
  user-select: none;
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th.obsidian-hotfixes-frozen-bases-sortable:hover {
  background: var(--background-modifier-hover);
}

.obsidian-hotfixes-frozen-bases-root .obsidian-hotfixes-table th.obsidian-hotfixes-frozen-bases-sortable[data-sort-direction]::after {
  content: attr(data-sort-direction);
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.75em;
  opacity: 0.75;
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
`.trim()}refreshOpenFrozenViews(){this.app.workspace.iterateAllLeaves(i=>{let e=i.view;e instanceof k&&e.onDataUpdated()})}async updateFreezeFirstColumn(i){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...i},await this.saveSettings()}async updateBaseViewSwitcher(i){this.settings.baseViewSwitcher={...this.settings.baseViewSwitcher,...i},await this.saveSettings()}configureBaseViewSwitcher(){if(this.settings.baseViewSwitcher.enabled){this.startBaseViewSwitcher();return}this.stopBaseViewSwitcher()}startBaseViewSwitcher(){this.baseViewSwitcherObserver||(this.baseViewSwitcherObserver=new MutationObserver(i=>{i.every(e=>this.isBaseViewSwitcherMutation(e))||this.scheduleBaseViewSwitcherRefresh()}),this.baseViewSwitcherObserver.observe(document.body,{childList:!0,subtree:!0})),this.scheduleBaseViewSwitcherRefresh()}stopBaseViewSwitcher(){this.baseViewSwitcherRefreshFrame!==null&&(window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame),this.baseViewSwitcherRefreshFrame=null),this.baseViewSwitcherRefreshToken++,this.baseViewSwitcherObserver&&(this.baseViewSwitcherObserver.disconnect(),this.baseViewSwitcherObserver=null),document.querySelectorAll(S).forEach(i=>i.remove())}scheduleBaseViewSwitcherRefresh(){this.settings.baseViewSwitcher.enabled&&this.baseViewSwitcherRefreshFrame===null&&(this.baseViewSwitcherRefreshFrame=window.requestAnimationFrame(()=>{this.baseViewSwitcherRefreshFrame=null,this.refreshBaseViewSwitchers()}))}async refreshBaseViewSwitchers(){let i=++this.baseViewSwitcherRefreshToken;if(!this.settings.baseViewSwitcher.enabled)return;this.removeOrphanedBaseViewSwitchers();let e=this.findBaseViewSwitcherTargets();for(let t of e){if(i!==this.baseViewSwitcherRefreshToken)return;await this.renderBaseViewSwitcher(t)}}removeOrphanedBaseViewSwitchers(){document.querySelectorAll(S).forEach(i=>{i.nextElementSibling?.matches(".bases-header")||i.remove()})}findBaseViewSwitcherTargets(){let i=this.settings.baseViewSwitcher,e=[],t=new Set;return document.querySelectorAll(".bases-header").forEach(r=>{if(t.has(r))return;t.add(r);let o=r.closest(".bases-embed"),a=this.getOwningFileView(r),s=a?.file?.path??"",l=o!==null;if(l&&!i.showInEmbeds){this.removeBaseViewSwitcherBefore(r);return}if(!l&&!i.showInBaseFiles){this.removeBaseViewSwitcherBefore(r);return}let d=o?this.resolveEmbeddedBaseFile(o,s):a?.file instanceof c.TFile&&a.file.extension==="base"?a.file:null;if(!d){this.removeBaseViewSwitcherBefore(r);return}e.push({headerEl:r,baseFile:d})}),e}getOwningFileView(i){let e=null;return this.app.workspace.iterateAllLeaves(t=>{if(e)return;let n=t.view;n.containerEl?.contains(i)&&(e={containerEl:n.containerEl,file:n.file instanceof c.TFile?n.file:null,view:t.view})}),e}resolveEmbeddedBaseFile(i,e){let t=[i,i.closest(".internal-embed")].filter(r=>r!==null),n=[];for(let r of t)n.push(r.getAttribute("src")??"",r.getAttribute("data-src")??"",r.getAttribute("data-path")??"",r.getAttribute("alt")??"");for(let r of n){let o=this.normalizeBaseLinkCandidate(r);if(!o)continue;let a=this.app.vault.getFileByPath(o);if(a?.extension==="base")return a;let s=this.app.metadataCache.getFirstLinkpathDest(o,e);if(s instanceof c.TFile&&s.extension==="base")return s}return null}normalizeBaseLinkCandidate(i){let e=i.trim();if(!e)return null;try{e=decodeURIComponent(e)}catch{}return e=e.replace(/^!\[\[/,"").replace(/^\[\[/,"").replace(/\]\]$/,"").split("|")[0].split("#")[0].trim(),e||null}findNativeBaseViewButton(i,e=[]){let t=[".bases-toolbar-item.bases-toolbar-views-menu .text-icon-button",".bases-toolbar-views-menu .text-icon-button",".bases-toolbar-item.bases-toolbar-views-menu",".bases-toolbar-views-menu",".bases-toolbar-view-menu",".bases-toolbar-item.mod-view",".bases-toolbar-item.mod-view-menu"];for(let s of t){let l=i.querySelector(s);if(l)return l}let n=new Set(e.map(s=>this.normalizeText(s))),r=Array.from(i.querySelectorAll(".bases-toolbar-item, button, [role='button']")).filter(s=>this.isVisibleElement(s)),o=r.find(s=>{let l=this.normalizeText(s.innerText||s.textContent||"");if(!l)return!1;for(let d of n)if(l===d||l.includes(d))return!0;return!1});if(o)return o;let a=r.find(s=>this.normalizeText(s.getAttribute("aria-label")||s.getAttribute("title")||"").toLowerCase().includes("view"));return a||(r[0]??null)}async renderBaseViewSwitcher(i){if(!i.headerEl.isConnected)return;let e=await this.readBaseViewDefinitions(i.baseFile);if(!i.headerEl.isConnected)return;if(e.length<2){this.removeBaseViewSwitcherBefore(i.headerEl);return}let t=i.headerEl.parentElement;if(!t)return;let n=this.getBaseViewSwitcherBefore(i.headerEl);n||(n=document.createElement("div"),n.className="obsidian-hotfixes-base-view-switcher",t.insertBefore(n,i.headerEl));let r=this.findNativeBaseViewButton(i.headerEl,e.map(s=>s.name)),o=this.getBaseControllerForHeader(i.headerEl),a=this.findActiveBaseViewName(typeof o?.viewName=="string"?o.viewName:r?this.normalizeText(r.innerText||r.textContent||""):null,e);n.empty(),n.dataset.basePath=i.baseFile.path,n.setAttribute("role","toolbar"),n.setAttribute("aria-label","Base views");for(let s of e){let l=document.createElement("button");l.type="button",l.className="obsidian-hotfixes-base-view-switcher-button",l.textContent=s.name,l.title=`${i.baseFile.basename}: ${s.name}`,l.dataset.viewName=s.name,s.name===a&&l.setAttribute("aria-current","true"),l.addEventListener("pointerdown",d=>{d.stopPropagation()}),l.addEventListener("mousedown",d=>{d.stopPropagation()}),l.addEventListener("click",d=>{if(d.preventDefault(),d.stopPropagation(),l.getAttribute("aria-current")==="true")return;let f=this.getBaseViewSwitcherHeader(l);if(!f){this.scheduleBaseViewSwitcherRefresh();return}this.switchBaseToView(f,s.name)}),n.appendChild(l)}}async readBaseViewDefinitions(i){try{let e=await this.app.vault.cachedRead(i),t=(0,c.parseYaml)(e);return!t||!Array.isArray(t.views)?[]:t.views.map(n=>({name:typeof n?.name=="string"?n.name.trim():""})).filter(n=>n.name.length>0)}catch(e){return console.warn("[Obsidian Hotfixes] Failed to read Base views.",i.path,e),[]}}getBaseViewSwitcherBefore(i){let e=i.previousElementSibling;return e instanceof HTMLElement&&e.matches(S)?e:null}removeBaseViewSwitcherBefore(i){this.getBaseViewSwitcherBefore(i)?.remove()}getBaseViewSwitcherHeader(i){let t=i.closest(S)?.nextElementSibling;return t instanceof HTMLElement&&t.matches(".bases-header")?t:null}findActiveBaseViewName(i,e){if(!i)return null;let t=this.normalizeText(i),n=e.find(o=>this.normalizeText(o.name)===t);return n?n.name:e.find(o=>t.includes(this.normalizeText(o.name)))?.name??null}async switchBaseToView(i,e){let t=this.getBaseViewSwitcherBefore(i),n=t?Array.from(t.querySelectorAll(".obsidian-hotfixes-base-view-switcher-button")).map(f=>f.dataset.viewName??f.textContent??""):[],r=this.getBaseControllerForHeader(i);if(r?.selectView&&r.getQueryViewNames?.().includes(e)){r.selectView(e),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80);return}let o=this.findNativeBaseViewButton(i,n);if(!o){console.warn("[Obsidian Hotfixes] Could not find native Bases view menu button.");return}let a=new Set(Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")));this.activateElement(o);let s=await this.waitForNewMenuItems(a),l=s.length>0?s:Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")),d=this.findMenuItemForView(l,e);if(!d){console.warn("[Obsidian Hotfixes] Could not find Bases view menu item.",e);return}this.activateElement(d),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80)}findMenuItemForView(i,e){let t=this.normalizeText(e),n=i.filter(a=>a.closest('[data-group="views"]')!==null),r=n.length>0?n:i,o=r.find(a=>this.normalizeMenuItemText(a)===t);return o||(r.find(a=>{let l=this.normalizeMenuItemText(a).split(/\r?\n/u)[0]??"";return this.normalizeText(l)===t})??null)}normalizeText(i){return i.replace(/\s+/g," ").trim()}isBaseViewSwitcherMutation(i){if(i.target instanceof HTMLElement&&i.target.closest(S))return!0;let e=[...Array.from(i.addedNodes),...Array.from(i.removedNodes)];return e.length>0&&e.every(t=>this.isBaseViewSwitcherNode(t))}isBaseViewSwitcherNode(i){return i instanceof HTMLElement?i.matches(S)||i.closest(S)!==null:!1}normalizeMenuItemText(i){let e=i.querySelector(".bases-toolbar-menu-item-name");return this.normalizeText(e?.innerText||e?.textContent||i.innerText||i.textContent||"")}getBaseControllerForHeader(i){let n=this.getOwningFileView(i)?.view?.controller;return n&&typeof n.selectView=="function"&&typeof n.getQueryViewNames=="function"?n:null}isVisibleElement(i){let e=i.getBoundingClientRect(),t=window.getComputedStyle(i);return e.width>0&&e.height>0&&t.display!=="none"&&t.visibility!=="hidden"}activateElement(i){i.focus();let e={bubbles:!0,cancelable:!0,view:window,button:0,buttons:1},t={...e,buttons:0},n={...e,pointerId:1,pointerType:"mouse",isPrimary:!0},r={...t,pointerId:1,pointerType:"mouse",isPrimary:!0};try{i.dispatchEvent(new PointerEvent("pointerdown",n)),i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new PointerEvent("pointerup",r)),i.dispatchEvent(new MouseEvent("mouseup",t))}catch{i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new MouseEvent("mouseup",t))}i.dispatchEvent(new MouseEvent("click",t))}async waitForNewMenuItems(i,e=600){let t=Date.now()+e;for(;Date.now()<t;){await this.nextAnimationFrame();let n=Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")).filter(r=>r.isConnected&&!i.has(r)&&this.isVisibleElement(r));if(n.length>0)return n}return[]}nextAnimationFrame(){return new Promise(i=>{window.requestAnimationFrame(()=>i())})}},k=class extends c.BasesView{constructor(e,t,n){super(e);this.plugin=n;this.root=t.createDiv("obsidian-hotfixes-frozen-bases-root")}hoverPopover=null;root;activeView=null;activeEditor=null;currentPropertyOrder=[];columnElements=new Map;headerElements=new Map;activeColumnWidths=new Map;activeResizeColumn=null;activeResizeColumnIndex=null;resizeStartX=0;resizedColumnStartWidth=0;activeResizeWidth=0;activeResizeElement=null;activeResizePointerId=null;draggingColumn=null;activeDragTarget=null;onResizePointerMove=e=>{if(!g(this.config).enableResize||!this.activeResizeColumn||this.activeResizeColumnIndex===null)return;e.preventDefault();let n=e.clientX-this.resizeStartX,r=this.clampColumnWidth(this.resizedColumnStartWidth+n,this.activeResizeColumnIndex===0);this.activeResizeWidth=r,this.activeColumnWidths.set(this.activeResizeColumn,r),this.applyColumnWidth(this.activeResizeColumn,r)};onResizePointerUp=()=>{g(this.config).enableResize&&(!this.activeResizeColumn||this.activeResizeColumnIndex===null||(this.activeResizeWidth=this.clampColumnWidth(this.activeResizeWidth,this.activeResizeColumnIndex===0),this.activeColumnWidths.set(this.activeResizeColumn,this.activeResizeWidth),this.applyColumnWidth(this.activeResizeColumn,this.activeResizeWidth),this.persistColumnWidths(),this.stopColumnResize()))};startColumnResize=(e,t,n)=>{if(g(this.config).enableResize&&e.button===0){if(e.preventDefault(),e.stopPropagation(),this.activeResizeElement=e.currentTarget,this.activeResizePointerId=e.pointerId,this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.setPointerCapture(this.activeResizePointerId),this.activeResizeElement.style.userSelect="none"}catch{}this.activeResizeColumn=t,this.activeResizeColumnIndex=n,this.resizeStartX=e.clientX,this.resizedColumnStartWidth=this.getColumnWidth(t,n),this.activeResizeWidth=this.resizedColumnStartWidth,document.body.style.cursor="col-resize",document.addEventListener("pointermove",this.onResizePointerMove),document.addEventListener("pointerup",this.onResizePointerUp)}};stopColumnResize(){if(this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.releasePointerCapture(this.activeResizePointerId)}catch{}if(!this.activeResizeColumn){this.activeResizePointerId=null,this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeElement=null;return}document.removeEventListener("pointermove",this.onResizePointerMove),document.removeEventListener("pointerup",this.onResizePointerUp),this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeColumn=null,this.activeResizeColumnIndex=null,this.activeResizeWidth=0,this.resizeStartX=0,this.resizedColumnStartWidth=0,this.activeResizePointerId=null,this.activeResizeElement=null,document.body.style.cursor=""}type=H;onDataUpdated(){this.render()}render(){this.root.empty(),this.activeEditor&&(this.activeEditor=null);let e=g(this.config),t=Math.max(1,Math.min(100,Math.round(e.cellHeightPx))),n=e.enableSorting?this.getSortState():null;if(this.root.className=`obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${e.wrapMode}`,this.root.style.setProperty("--obsidian-hotfixes-cell-height",`${t}px`),this.currentPropertyOrder=[],this.columnElements.clear(),this.headerElements.clear(),this.activeColumnWidths.clear(),this.stopColumnResize(),this.clearDragTargetStyles(),this.syncColumnWidths(),!this.plugin.settings.freezeFirstColumn.enabled){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"Frozen table view is disabled. Turn it on in plugin settings."});return}let r=this.getPropertyOrder();if(!r.length){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"No properties available for this Base."});return}r.forEach((w,v)=>{let m=this.getPropertyId(w),b=this.getColumnWidth(m,v);this.currentPropertyOrder[v]=m,this.activeColumnWidths.set(m,b)});let o=this.root.createDiv("obsidian-hotfixes-frozen-bases-view");this.activeView=o;let a=r.length>0?this.getPropertyId(r[0]):null;if(a){let w=this.getColumnWidth(a,0);o.style.setProperty("--obsidian-hotfixes-first-column-width",`${w}px`)}let s=o.createEl("table",{cls:"obsidian-hotfixes-table"}),l=s.createEl("colgroup"),f=s.createTHead().createEl("tr");r.forEach((w,v)=>{let m=this.getPropertyId(w),b=this.getColumnWidth(m,v),x=l.createEl("col");x.style.width=`${b}px`,x.style.minWidth=`${b}px`,x.style.maxWidth=`${b}px`,x.dataset.propertyId=m,this.columnElements.set(m,x);let y=this.config.getDisplayName(w),u=f.createEl("th",{text:y});if(u.dataset.propertyId=m,u.style.width=`${b}px`,u.style.minWidth=`${b}px`,u.style.maxWidth=`${b}px`,e.enableReorder&&(u.addClass("obsidian-hotfixes-frozen-bases-reorder-handle"),u.draggable=!0,u.addEventListener("dragstart",p=>this.onColumnDragStart(p,m)),u.addEventListener("dragover",p=>this.onColumnDragOver(p,m)),u.addEventListener("drop",p=>this.onColumnDrop(p,m)),u.addEventListener("dragleave",()=>this.clearDragTargetStyles()),u.addEventListener("dragend",this.onColumnDragEnd)),this.headerElements.set(m,u),e.enableResize){let p=u.createSpan({cls:"obsidian-hotfixes-frozen-bases-resize-handle"});p.setAttr("draggable","false"),p.addEventListener("pointerdown",V=>this.startColumnResize(V,m,v))}e.enableSorting&&(u.addClass("obsidian-hotfixes-frozen-bases-sortable"),u.setAttribute("role","columnheader"),n?.propertyId===m?(u.setAttribute("data-sort-direction",n.direction==="ASC"?"\u2191":"\u2193"),u.setAttribute("aria-sort",n.direction==="ASC"?"ascending":"descending")):(u.removeAttribute("data-sort-direction"),u.setAttribute("aria-sort","none")),u.addEventListener("click",p=>this.onHeaderSortClick(p,m)))});let E=s.createTBody(),q=this.data.groupedData.length>1;for(let w of this.data.groupedData){let v=w.entries;if(!v.length)continue;if(q){let b=E.createEl("tr",{cls:"obsidian-hotfixes-group-row"}),x=w.key?.toString()??"Ungrouped",y=b.createEl("td",{text:x});y.colSpan=r.length}let m=n?this.getSortedEntries(v,n):v;for(let b of m){let x=E.createEl("tr",{cls:"obsidian-hotfixes-data-row"});for(let y=0;y<r.length;y++){let u=r[y],p=this.getPropertyId(u),V=this.getColumnWidth(p,y),F=x.createEl("td");F.dataset.propertyId=p,F.style.width=`${V}px`,F.style.minWidth=`${V}px`,F.style.maxWidth=`${V}px`,this.renderCellValue(F,b,u,e)}}}}getPropertyId(e){return String(e)}getDefaultFirstColumnWidth(){return Math.max(R,this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,I)}renderCellText(e,t){e.empty(),e.createSpan({text:t}),t&&(e.title=t)}renderLinkFriendlyCell(e,t,n,r){return!t||typeof n!="string"?!1:t instanceof c.UrlValue||t instanceof c.LinkValue||this.containsLikelyLinkSyntax(n)?(e.empty(),c.MarkdownRenderer.render(this.plugin.app,n,e,r,this.plugin).catch(()=>{this.renderCellText(e,n)}),!0):!1}containsLikelyLinkSyntax(e){let t=e.trim();return t?/^\[[^\]]+\]\([^\)]*\)$/u.test(t)||this.isLikelyUri(t)||/\[\[[^\]]+\]\]/.test(t)?!0:/(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(t):!1}isLikelyUri(e){return/^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(e)}renderUriLink(e,t,n){e.empty();let r=e.createEl("a",{text:n,href:t});r.addClass("external-link"),r.addEventListener("click",o=>{o.button!==0&&o.button!==1||(o.preventDefault(),window.open(t,"_blank","noopener,noreferrer"))}),r.addEventListener("mouseover",o=>{this.plugin.app.workspace.trigger("hover-link",{event:o,source:"bases",hoverParent:this,targetEl:r,linktext:t})})}renderMarkdownLink(e,t){let n=/^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(t.trim());if(!n||!n.groups)return!1;let r=(n.groups.href??"").trim().replace(/\s+["'][^"']*["']$/,""),o=n.groups.label?.trim()||r;return!r||!o||!this.isLikelyUri(r)?!1:(this.renderUriLink(e,r,o),!0)}renderCellValue(e,t,n,r){let o=(0,c.parsePropertyId)(n),a=t.getValue(n),s=a?a.toString():"";if(e.classList.remove("obsidian-hotfixes-note-cell"),o.type==="file"&&o.name==="name"){let l=e.createEl("a",{text:t.file.name,href:t.file.path});l.addClass("internal-link"),l.addEventListener("click",d=>{if(d.button!==0&&d.button!==1)return;let f=c.Keymap.isModEvent(d);if(d.preventDefault(),f===!0||f===!1){this.plugin.app.workspace.openLinkText(t.file.path,"",!!f);return}this.plugin.app.workspace.openLinkText(t.file.path,"",f)}),l.addEventListener("mouseover",d=>{this.plugin.app.workspace.trigger("hover-link",{event:d,source:"bases",hoverParent:this,targetEl:l,linktext:t.file.path})}),s&&(e.title=s);return}if(a&&r.preserveLinks){let l=e.createSpan(),d=t?.file?.path??"";if(this.renderMarkdownLink(l,s))return;if(this.isLikelyUri(s)){this.renderUriLink(l,s,s);return}if(!this.renderLinkFriendlyCell(l,a,s,d))try{let E=new c.RenderContext;E.hoverPopover=this.hoverPopover,a.renderTo(l,E)}catch(E){console.warn("[Obsidian Hotfixes] Failed to render value, falling back to plain text.",n,E),this.renderCellText(l,s)}}else{let l=e.createSpan();this.renderCellText(l,s)}o.type==="note"&&r.editableNotes&&(e.classList.add("obsidian-hotfixes-note-cell"),e.addEventListener("dblclick",()=>{this.beginEditNoteCell(e,t,o.name,s)})),s&&(e.title=s)}async beginEditNoteCell(e,t,n,r){if(this.activeEditor)return;let o=e.innerText,a=document.createElement("textarea");a.value=r,a.rows=1;let s=()=>{this.activeEditor=null,this.render()},l=async()=>{let d=a.value;d!==o&&await this.plugin.app.fileManager.processFrontMatter(t.file,f=>{f[n]=d}),s()};this.activeEditor=a,e.empty(),e.appendChild(a),a.focus(),a.className="obsidian-hotfixes-note-editor",a.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey?(d.preventDefault(),l()):d.key==="Escape"&&(d.preventDefault(),s())}),a.addEventListener("blur",()=>{l()})}getSavedColumnWidths(){let e=this.config.get(D),t=new Map;if(e&&typeof e=="object"&&!Array.isArray(e))for(let[n,r]of Object.entries(e)){let o=Number(r);Number.isFinite(o)&&t.set(n,o)}return t}syncColumnWidths(){let e=this.getSavedColumnWidths();this.activeColumnWidths.clear();for(let[t,n]of e.entries())this.activeColumnWidths.set(t,n)}getColumnWidth(e,t){let n=t===0?this.getDefaultFirstColumnWidth():I,r=this.activeColumnWidths.get(e),o=typeof r=="number"?r:n;return this.clampColumnWidth(o,t===0)}clampColumnWidth(e,t=!1){let n=Math.max(e,R);if(!t)return n;let r=this.plugin.settings.freezeFirstColumn,o=Math.max(R,r.firstColumnMinWidthPx),a=Math.max(o,r.firstColumnMaxWidthPx);return Math.min(Math.max(n,o),a)}applyColumnWidth(e,t){let n=this.currentPropertyOrder[0]===e,r=this.clampColumnWidth(t,n),o=this.columnElements.get(e);o&&(o.style.width=`${r}px`,o.style.minWidth=`${r}px`,o.style.maxWidth=`${r}px`);let a=this.headerElements.get(e);a&&(a.style.width=`${r}px`,a.style.minWidth=`${r}px`,a.style.maxWidth=`${r}px`),n&&this.activeView&&this.activeView.style.setProperty("--obsidian-hotfixes-first-column-width",`${r}px`)}persistColumnWidths(){let e={};for(let[t,n]of this.activeColumnWidths.entries())e[t]=n;this.config.set(D,e)}persistColumnOrder(e){this.config.set(P,e.map(t=>this.getPropertyId(t)))}safeAttributeValue(e){return e.replace(/"/g,'\\"')}clearDragTargetStyles(){this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach(e=>{e.removeAttribute("data-drag-target")}),this.activeDragTarget=null}onColumnDragStart(e,t){e.button===0&&g(this.config).enableReorder&&e.dataTransfer&&(this.draggingColumn=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t))}onColumnDragOver(e,t){if(!g(this.config).enableReorder||!this.draggingColumn||this.draggingColumn===t||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.activeDragTarget===t))return;this.clearDragTargetStyles(),this.activeDragTarget=t;let n=this.root.querySelector(`th[data-property-id="${this.safeAttributeValue(t)}"]`);n&&n.setAttribute("data-drag-target","true")}onColumnDrop(e,t){if(!g(this.config).enableReorder||(e.preventDefault(),!this.draggingColumn||this.draggingColumn===t))return;let n=this.getCurrentColumnOrder(),r=n.findIndex(a=>this.getPropertyId(a)===this.draggingColumn),o=n.findIndex(a=>this.getPropertyId(a)===t);if(r===-1||o===-1){this.draggingColumn=null,this.clearDragTargetStyles();return}n.splice(r,1),n.splice(o,0,this.draggingColumn),this.persistColumnOrder(n),this.draggingColumn=null,this.clearDragTargetStyles(),this.render()}onColumnDragEnd=()=>{g(this.config).enableReorder&&(this.draggingColumn=null,this.clearDragTargetStyles())};getSortState(){let e=this.config.get(A);if(!e||typeof e!="object"||Array.isArray(e)||typeof e.direction!="string"||typeof e.propertyId!="string")return null;let t=e.direction;return t!=="ASC"&&t!=="DESC"?null:{propertyId:e.propertyId,direction:t}}setSortState(e){this.config.set(A,e)}onHeaderSortClick(e,t){if(!g(this.config).enableSorting)return;let r=e.target;if(r&&r.closest(".obsidian-hotfixes-frozen-bases-resize-handle"))return;e.preventDefault();let o=this.getSortState();if(!o||o.propertyId!==t){this.setSortState({propertyId:t,direction:"ASC"}),this.render();return}if(o.direction==="ASC"){this.setSortState({propertyId:t,direction:"DESC"}),this.render();return}this.setSortState(null),this.render()}getSortedEntries(e,t){let n=t.propertyId;return e.map((r,o)=>({entry:r,index:o})).sort((r,o)=>{let a=this.normalizeSortValue(this.readCellValue(r.entry,n)),s=this.normalizeSortValue(this.readCellValue(o.entry,n)),l=t.direction==="ASC"?1:-1,d=this.compareSortableValues(a,s);if(d!==0)return d*l;let f=this.compareSortableValues(this.getSortFallback(r.entry),this.getSortFallback(o.entry));return f!==0?f:r.index-o.index}).map(({entry:r})=>r)}readCellValue(e,t){try{return e.getValue(t)}catch{return null}}getSortFallback(e){let t=e?.file?.path,n=e?.file?.name;return typeof t=="string"&&t.length>0?t:typeof n=="string"&&n.length>0?n:""}normalizeSortValue(e){if(e==null)return null;if(e instanceof c.UrlValue||e instanceof c.LinkValue)return e.toString();if(e instanceof Date)return e.getTime();if(typeof e=="number")return e;if(typeof e=="boolean")return e?1:0;if(typeof e=="string")return e;if(Array.isArray(e))return e.map(t=>typeof t=="string"?t:typeof t=="number"?t.toString():"").filter(t=>t.length>0).join(", ");if(typeof e=="object"){let t=["text","path","name","value","toString"];for(let n of t){let r=e[n];if(typeof r=="string"&&r.length>0)return r}}return String(e)}compareSortableValues(e,t){if(e===null)return t===null?0:1;if(t===null)return-1;if(typeof e=="number"&&typeof t=="number")return e>t?1:e<t?-1:0;let n=String(e).toLowerCase(),r=String(t).toLowerCase();return n===r?0:new Intl.Collator(void 0,{numeric:!0,sensitivity:"base"}).compare(n,r)}getCurrentColumnOrder(){let e=this.config.get(P);if(Array.isArray(e)){let n=new Set(this.data.properties.map(a=>this.getPropertyId(a))),r=new Set,o=e.map(a=>typeof a=="string"?a:null).filter(a=>a!==null&&n.has(this.getPropertyId(a))&&(r.has(this.getPropertyId(a))?!1:(r.add(this.getPropertyId(a)),!0)));if(o.length>0){let a=new Set(o.map(l=>this.getPropertyId(l))),s=this.data.properties.filter(l=>!a.has(this.getPropertyId(l)));return[...o,...s]}}let t=this.config.getOrder();return t.length>0?t:this.data.properties}getPropertyOrder(){return this.getCurrentColumnOrder()}},M=class extends c.PluginSettingTab{plugin;minWidthInput=null;maxWidthInput=null;backgroundInput=null;zIndexInput=null;baseFileToggle=null;embeddedBaseToggle=null;constructor(i,e){super(i,e),this.plugin=e}setSectionEnabled(i){this.minWidthInput&&this.minWidthInput.setDisabled(!i),this.maxWidthInput&&this.maxWidthInput.setDisabled(!i),this.backgroundInput&&this.backgroundInput.setDisabled(!i),this.zIndexInput&&this.zIndexInput.setDisabled(!i)}setBaseViewSwitcherSectionEnabled(i){this.baseFileToggle&&this.baseFileToggle.setDisabled(!i),this.embeddedBaseToggle&&this.embeddedBaseToggle.setDisabled(!i)}display(){let{containerEl:i}=this;i.empty(),i.createEl("h2",{text:"Obsidian Hotfixes"});let e=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});e.createEl("summary",{text:"Bases: Frozen first column"});let t=e.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),n=this.plugin.settings.freezeFirstColumn;new c.Setting(t).setName("Enable custom frozen table view").setDesc("Use a custom Bases view with a sticky first column instead of overlay hacks.").addToggle(s=>{s.setValue(n.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({enabled:l}),this.setSectionEnabled(l)})}),new c.Setting(t).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText(s=>{this.minWidthInput=s,s.setValue(String(n.firstColumnMinWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async l=>{let d=Number.parseInt(l,10);Number.isNaN(d)||d<80||await this.plugin.updateFreezeFirstColumn({firstColumnMinWidthPx:d})})}),new c.Setting(t).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText(s=>{this.maxWidthInput=s,s.setValue(String(n.firstColumnMaxWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async l=>{let d=Number.parseInt(l,10);Number.isNaN(d)||d<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:d})})}),new c.Setting(t).setName("Background").setDesc("Background used behind the frozen first column.").addText(s=>{this.backgroundInput=s,s.setValue(n.backgroundColor),s.setDisabled(!n.enabled),s.setPlaceholder("var(--background-primary)"),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:l||T.freezeFirstColumn.backgroundColor})})}),new c.Setting(t).setName("z-index").setDesc("Stacking order for the frozen first column.").addText(s=>{this.zIndexInput=s,s.setValue(String(n.zIndex)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.setPlaceholder("4"),s.onChange(async l=>{let d=Number.parseInt(l,10);Number.isNaN(d)||await this.plugin.updateFreezeFirstColumn({zIndex:d})})}),new c.Setting(t).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle(s=>{s.setValue(n.showDivider),s.setDisabled(!n.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({showDivider:l})})}),this.setSectionEnabled(n.enabled);let r=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});r.createEl("summary",{text:"Bases: Quick view switcher"});let o=r.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),a=this.plugin.settings.baseViewSwitcher;new c.Setting(o).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle(s=>{s.setValue(a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({enabled:l}),this.setBaseViewSwitcherSectionEnabled(l)})}),new c.Setting(o).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle(s=>{this.baseFileToggle=s,s.setValue(a.showInBaseFiles),s.setDisabled(!a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInBaseFiles:l})})}),new c.Setting(o).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle(s=>{this.embeddedBaseToggle=s,s.setValue(a.showInEmbeds),s.setDisabled(!a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInEmbeds:l})})}),this.setBaseViewSwitcherSectionEnabled(a.enabled)}};
