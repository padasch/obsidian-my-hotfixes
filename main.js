"use strict";var B=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var q=Object.prototype.hasOwnProperty;var Y=(d,i)=>{for(var e in i)B(d,e,{get:i[e],enumerable:!0})},Z=(d,i,e,t)=>{if(i&&typeof i=="object"||typeof i=="function")for(let n of K(i))!q.call(d,n)&&n!==e&&B(d,n,{get:()=>i[n],enumerable:!(t=U(i,n))||t.enumerable});return d};var X=d=>Z(B({},"__esModule",{value:!0}),d);var ee={};Y(ee,{default:()=>F});module.exports=X(ee);var c=require("obsidian"),G="obsidian-hotfixes-runtime-styles",D="obsidian-hotfixes-frozen-table",M=180,R=60,P="obsidian-hotfixes:column-order",I="obsidian-hotfixes:column-widths",H="obsidian-hotfixes:view-feature-resize",W="obsidian-hotfixes:view-feature-reorder",N="obsidian-hotfixes:view-feature-preserve-links",A="obsidian-hotfixes:view-feature-edit-notes",j="obsidian-hotfixes:view-feature-wrap-mode",O="obsidian-hotfixes:view-feature-truncate",_="obsidian-hotfixes:view-feature-cell-height",L=".obsidian-hotfixes-base-view-switcher",$=34,C={enableResize:!1,enableReorder:!1,preserveLinks:!0,editableNotes:!1,wrapMode:"narrow",cellHeightPx:$};function T(d,i){return typeof d=="boolean"?d:i}function Q(d,i,e){return typeof d=="string"&&i.includes(d)?d:e}function J(d,i){if(typeof d=="number")return Number.isFinite(d)?d:i;if(typeof d=="object"&&d!==null&&"value"in d&&typeof d.value=="number"){let e=d.value;return Number.isFinite(e)?e:i}if(typeof d=="object"&&d!==null&&"value"in d&&typeof d.value=="string"){let e=Number.parseFloat(d.value);return Number.isFinite(e)?e:i}if(typeof d=="string"){let e=Number.parseFloat(d);return Number.isFinite(e)?e:i}return i}function v(d){let i=Q(d.get(j),["narrow","wide"],C.wrapMode),e=T(d.get(O),i==="narrow");return{enableResize:T(d.get(H),C.enableResize),enableReorder:T(d.get(W),C.enableReorder),preserveLinks:T(d.get(N),C.preserveLinks),editableNotes:T(d.get(A),C.editableNotes),wrapMode:e?"narrow":"wide",cellHeightPx:J(d.get(_),C.cellHeightPx)}}var z={freezeFirstColumn:{enabled:!1,firstColumnMinWidthPx:220,firstColumnMaxWidthPx:320,backgroundColor:"var(--background-primary)",zIndex:4,showDivider:!0},baseViewSwitcher:{enabled:!1,showInBaseFiles:!0,showInEmbeds:!0}},F=class extends c.Plugin{settings={freezeFirstColumn:{...z.freezeFirstColumn},baseViewSwitcher:{...z.baseViewSwitcher}};styleElement=null;baseViewSwitcherObserver=null;baseViewSwitcherRefreshFrame=null;baseViewSwitcherRefreshToken=0;async onload(){await this.loadSettings(),this.applyStyles(),this.registerSettingTab(),this.registerBasesView(D,{name:"Frozen Table",icon:"lucide-layout-grid",factory:(e,t)=>new V(e,t,this),options:e=>{let t=v(e);return[{type:"group",displayName:"Frozen table options",items:[{type:"toggle",key:H,displayName:"Enable column resizing",default:t.enableResize},{type:"toggle",key:W,displayName:"Enable column reordering",default:t.enableReorder},{type:"toggle",key:N,displayName:"Preserve inline link rendering",default:t.preserveLinks},{type:"toggle",key:A,displayName:"Enable note-cell editing",default:t.editableNotes},{type:"toggle",key:O,displayName:"Truncate long text",default:t.wrapMode==="narrow"},{type:"slider",key:_,displayName:"Cell height (px)",default:t.cellHeightPx,instant:!0,min:1,max:100,step:1,displayFormat:n=>`${n}px`}]}]}})||console.warn("[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("file-open",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.vault.on("modify",e=>{e instanceof c.TFile&&e.extension==="base"&&this.scheduleBaseViewSwitcherRefresh()})),this.registerDomEvent(window,"resize",()=>this.refreshOpenFrozenViews()),this.configureBaseViewSwitcher()}onunload(){this.stopBaseViewSwitcher(),this.styleElement&&(this.styleElement.remove(),this.styleElement=null)}registerSettingTab(){this.addSettingTab(new k(this.app,this))}async loadSettings(){let i=await this.loadData();this.settings={...z,...i,freezeFirstColumn:{...z.freezeFirstColumn,...i?.freezeFirstColumn??{}},baseViewSwitcher:{...z.baseViewSwitcher,...i?.baseViewSwitcher??{}}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.refreshOpenFrozenViews(),this.configureBaseViewSwitcher()}applyStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=G,document.head.appendChild(this.styleElement));let i=this.settings.freezeFirstColumn,e=Math.max(80,i.firstColumnMinWidthPx),t=Math.max(e,i.firstColumnMaxWidthPx),n=i.showDivider?"1px solid var(--background-modifier-border)":"none";this.styleElement.textContent=`
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${e}px;
  --obsidian-hotfixes-first-column-max-width: ${t}px;
  --obsidian-hotfixes-cell-height: ${$}px;
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
`.trim()}refreshOpenFrozenViews(){this.app.workspace.iterateAllLeaves(i=>{let e=i.view;e instanceof V&&e.onDataUpdated()})}async updateFreezeFirstColumn(i){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...i},await this.saveSettings()}async updateBaseViewSwitcher(i){this.settings.baseViewSwitcher={...this.settings.baseViewSwitcher,...i},await this.saveSettings()}configureBaseViewSwitcher(){if(this.settings.baseViewSwitcher.enabled){this.startBaseViewSwitcher();return}this.stopBaseViewSwitcher()}startBaseViewSwitcher(){this.baseViewSwitcherObserver||(this.baseViewSwitcherObserver=new MutationObserver(()=>{this.scheduleBaseViewSwitcherRefresh()}),this.baseViewSwitcherObserver.observe(document.body,{childList:!0,subtree:!0})),this.scheduleBaseViewSwitcherRefresh()}stopBaseViewSwitcher(){this.baseViewSwitcherRefreshFrame!==null&&(window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame),this.baseViewSwitcherRefreshFrame=null),this.baseViewSwitcherRefreshToken++,this.baseViewSwitcherObserver&&(this.baseViewSwitcherObserver.disconnect(),this.baseViewSwitcherObserver=null),document.querySelectorAll(L).forEach(i=>i.remove())}scheduleBaseViewSwitcherRefresh(){this.settings.baseViewSwitcher.enabled&&this.baseViewSwitcherRefreshFrame===null&&(this.baseViewSwitcherRefreshFrame=window.requestAnimationFrame(()=>{this.baseViewSwitcherRefreshFrame=null,this.refreshBaseViewSwitchers()}))}async refreshBaseViewSwitchers(){let i=++this.baseViewSwitcherRefreshToken;if(!this.settings.baseViewSwitcher.enabled)return;this.removeOrphanedBaseViewSwitchers();let e=this.findBaseViewSwitcherTargets();for(let t of e){if(i!==this.baseViewSwitcherRefreshToken)return;await this.renderBaseViewSwitcher(t)}}removeOrphanedBaseViewSwitchers(){document.querySelectorAll(L).forEach(i=>{i.nextElementSibling?.matches(".bases-header")||i.remove()})}findBaseViewSwitcherTargets(){let i=this.settings.baseViewSwitcher,e=[],t=new Set;return document.querySelectorAll(".bases-header").forEach(r=>{if(t.has(r))return;t.add(r);let o=r.closest(".bases-embed"),a=this.getOwningFileView(r),s=a?.file?.path??"",l=o!==null;if(l&&!i.showInEmbeds){this.removeBaseViewSwitcherBefore(r);return}if(!l&&!i.showInBaseFiles){this.removeBaseViewSwitcherBefore(r);return}let h=o?this.resolveEmbeddedBaseFile(o,s):a?.file instanceof c.TFile&&a.file.extension==="base"?a.file:null;if(!h){this.removeBaseViewSwitcherBefore(r);return}e.push({headerEl:r,baseFile:h})}),e}getOwningFileView(i){let e=null;return this.app.workspace.iterateAllLeaves(t=>{if(e)return;let n=t.view;n.containerEl?.contains(i)&&(e={containerEl:n.containerEl,file:n.file instanceof c.TFile?n.file:null})}),e}resolveEmbeddedBaseFile(i,e){let t=[i,i.closest(".internal-embed")].filter(r=>r!==null),n=[];for(let r of t)n.push(r.getAttribute("src")??"",r.getAttribute("data-src")??"",r.getAttribute("data-path")??"",r.getAttribute("alt")??"");for(let r of n){let o=this.normalizeBaseLinkCandidate(r);if(!o)continue;let a=this.app.vault.getFileByPath(o);if(a?.extension==="base")return a;let s=this.app.metadataCache.getFirstLinkpathDest(o,e);if(s instanceof c.TFile&&s.extension==="base")return s}return null}normalizeBaseLinkCandidate(i){let e=i.trim();if(!e)return null;try{e=decodeURIComponent(e)}catch{}return e=e.replace(/^!\[\[/,"").replace(/^\[\[/,"").replace(/\]\]$/,"").split("|")[0].split("#")[0].trim(),e||null}findNativeBaseViewButton(i,e=[]){let t=[".bases-toolbar-view-menu",".bases-toolbar-item.mod-view",".bases-toolbar-item.mod-view-menu"];for(let s of t){let l=i.querySelector(s);if(l)return l}let n=new Set(e.map(s=>this.normalizeText(s))),r=Array.from(i.querySelectorAll(".bases-toolbar-item, button, [role='button']")).filter(s=>this.isVisibleElement(s)),o=r.find(s=>{let l=this.normalizeText(s.innerText||s.textContent||"");if(!l)return!1;for(let h of n)if(l===h||l.includes(h))return!0;return!1});if(o)return o;let a=r.find(s=>this.normalizeText(s.getAttribute("aria-label")||s.getAttribute("title")||"").toLowerCase().includes("view"));return a||(r[0]??null)}async renderBaseViewSwitcher(i){if(!i.headerEl.isConnected)return;let e=await this.readBaseViewDefinitions(i.baseFile);if(!i.headerEl.isConnected)return;if(e.length<2){this.removeBaseViewSwitcherBefore(i.headerEl);return}let t=i.headerEl.parentElement;if(!t)return;let n=this.getBaseViewSwitcherBefore(i.headerEl);n||(n=document.createElement("div"),n.className="obsidian-hotfixes-base-view-switcher",t.insertBefore(n,i.headerEl));let r=this.findNativeBaseViewButton(i.headerEl,e.map(a=>a.name)),o=this.findActiveBaseViewName(r?this.normalizeText(r.innerText||r.textContent||""):null,e);n.empty(),n.dataset.basePath=i.baseFile.path,n.setAttribute("role","toolbar"),n.setAttribute("aria-label","Base views");for(let a of e){let s=document.createElement("button");s.type="button",s.className="obsidian-hotfixes-base-view-switcher-button",s.textContent=a.name,s.title=`${i.baseFile.basename}: ${a.name}`,s.dataset.viewName=a.name,a.name===o&&s.setAttribute("aria-current","true"),s.addEventListener("pointerdown",l=>{l.stopPropagation()}),s.addEventListener("mousedown",l=>{l.stopPropagation()}),s.addEventListener("click",l=>{l.preventDefault(),l.stopPropagation(),s.getAttribute("aria-current")!=="true"&&this.switchBaseToView(i.headerEl,a.name)}),n.appendChild(s)}}async readBaseViewDefinitions(i){try{let e=await this.app.vault.cachedRead(i),t=(0,c.parseYaml)(e);return!t||!Array.isArray(t.views)?[]:t.views.map(n=>({name:typeof n?.name=="string"?n.name.trim():""})).filter(n=>n.name.length>0)}catch(e){return console.warn("[Obsidian Hotfixes] Failed to read Base views.",i.path,e),[]}}getBaseViewSwitcherBefore(i){let e=i.previousElementSibling;return e instanceof HTMLElement&&e.matches(L)?e:null}removeBaseViewSwitcherBefore(i){this.getBaseViewSwitcherBefore(i)?.remove()}findActiveBaseViewName(i,e){if(!i)return null;let t=this.normalizeText(i),n=e.find(o=>this.normalizeText(o.name)===t);return n?n.name:e.find(o=>t.includes(this.normalizeText(o.name)))?.name??null}async switchBaseToView(i,e){let t=this.getBaseViewSwitcherBefore(i),n=t?Array.from(t.querySelectorAll(".obsidian-hotfixes-base-view-switcher-button")).map(h=>h.dataset.viewName??h.textContent??""):[],r=this.findNativeBaseViewButton(i,n);if(!r){console.warn("[Obsidian Hotfixes] Could not find native Bases view menu button.");return}let o=new Set(Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")));this.activateElement(r);let a=await this.waitForNewMenuItems(o),s=a.length>0?a:Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")),l=this.findMenuItemForView(s,e);if(!l){console.warn("[Obsidian Hotfixes] Could not find Bases view menu item.",e);return}this.activateElement(l),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80)}findMenuItemForView(i,e){let t=this.normalizeText(e),n=i.find(r=>this.normalizeText(r.innerText||r.textContent||"")===t);return n||(i.find(r=>{let a=(r.innerText||r.textContent||"").split(/\r?\n/u)[0]??"";return this.normalizeText(a)===t})??null)}normalizeText(i){return i.replace(/\s+/g," ").trim()}isVisibleElement(i){let e=i.getBoundingClientRect(),t=window.getComputedStyle(i);return e.width>0&&e.height>0&&t.display!=="none"&&t.visibility!=="hidden"}activateElement(i){i.focus();let e={bubbles:!0,cancelable:!0,view:window,button:0,buttons:1},t={...e,buttons:0},n={...e,pointerId:1,pointerType:"mouse",isPrimary:!0},r={...t,pointerId:1,pointerType:"mouse",isPrimary:!0};try{i.dispatchEvent(new PointerEvent("pointerdown",n)),i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new PointerEvent("pointerup",r)),i.dispatchEvent(new MouseEvent("mouseup",t))}catch{i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new MouseEvent("mouseup",t))}i.dispatchEvent(new MouseEvent("click",t))}async waitForNewMenuItems(i,e=600){let t=Date.now()+e;for(;Date.now()<t;){await this.nextAnimationFrame();let n=Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")).filter(r=>r.isConnected&&!i.has(r)&&this.isVisibleElement(r));if(n.length>0)return n}return[]}nextAnimationFrame(){return new Promise(i=>{window.requestAnimationFrame(()=>i())})}},V=class extends c.BasesView{constructor(e,t,n){super(e);this.plugin=n;this.root=t.createDiv("obsidian-hotfixes-frozen-bases-root")}hoverPopover=null;root;activeView=null;activeEditor=null;currentPropertyOrder=[];columnElements=new Map;headerElements=new Map;activeColumnWidths=new Map;activeResizeColumn=null;activeResizeColumnIndex=null;resizeStartX=0;resizedColumnStartWidth=0;activeResizeWidth=0;activeResizeElement=null;activeResizePointerId=null;draggingColumn=null;activeDragTarget=null;onResizePointerMove=e=>{if(!v(this.config).enableResize||!this.activeResizeColumn||this.activeResizeColumnIndex===null)return;e.preventDefault();let n=e.clientX-this.resizeStartX,r=this.clampColumnWidth(this.resizedColumnStartWidth+n,this.activeResizeColumnIndex===0);this.activeResizeWidth=r,this.activeColumnWidths.set(this.activeResizeColumn,r),this.applyColumnWidth(this.activeResizeColumn,r)};onResizePointerUp=()=>{v(this.config).enableResize&&(!this.activeResizeColumn||this.activeResizeColumnIndex===null||(this.activeResizeWidth=this.clampColumnWidth(this.activeResizeWidth,this.activeResizeColumnIndex===0),this.activeColumnWidths.set(this.activeResizeColumn,this.activeResizeWidth),this.applyColumnWidth(this.activeResizeColumn,this.activeResizeWidth),this.persistColumnWidths(),this.stopColumnResize()))};startColumnResize=(e,t,n)=>{if(v(this.config).enableResize&&e.button===0){if(e.preventDefault(),e.stopPropagation(),this.activeResizeElement=e.currentTarget,this.activeResizePointerId=e.pointerId,this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.setPointerCapture(this.activeResizePointerId),this.activeResizeElement.style.userSelect="none"}catch{}this.activeResizeColumn=t,this.activeResizeColumnIndex=n,this.resizeStartX=e.clientX,this.resizedColumnStartWidth=this.getColumnWidth(t,n),this.activeResizeWidth=this.resizedColumnStartWidth,document.body.style.cursor="col-resize",document.addEventListener("pointermove",this.onResizePointerMove),document.addEventListener("pointerup",this.onResizePointerUp)}};stopColumnResize(){if(this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.releasePointerCapture(this.activeResizePointerId)}catch{}if(!this.activeResizeColumn){this.activeResizePointerId=null,this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeElement=null;return}document.removeEventListener("pointermove",this.onResizePointerMove),document.removeEventListener("pointerup",this.onResizePointerUp),this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeColumn=null,this.activeResizeColumnIndex=null,this.activeResizeWidth=0,this.resizeStartX=0,this.resizedColumnStartWidth=0,this.activeResizePointerId=null,this.activeResizeElement=null,document.body.style.cursor=""}type=D;onDataUpdated(){this.render()}render(){this.root.empty(),this.activeEditor&&(this.activeEditor=null);let e=v(this.config),t=Math.max(1,Math.min(100,Math.round(e.cellHeightPx)));if(this.root.className=`obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${e.wrapMode}`,this.root.style.setProperty("--obsidian-hotfixes-cell-height",`${t}px`),this.currentPropertyOrder=[],this.columnElements.clear(),this.headerElements.clear(),this.activeColumnWidths.clear(),this.stopColumnResize(),this.clearDragTargetStyles(),this.syncColumnWidths(),!this.plugin.settings.freezeFirstColumn.enabled){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"Frozen table view is disabled. Turn it on in plugin settings."});return}let n=this.getPropertyOrder();if(!n.length){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"No properties available for this Base."});return}n.forEach((g,x)=>{let u=this.getPropertyId(g),f=this.getColumnWidth(u,x);this.currentPropertyOrder[x]=u,this.activeColumnWidths.set(u,f)});let r=this.root.createDiv("obsidian-hotfixes-frozen-bases-view");this.activeView=r;let o=n.length>0?this.getPropertyId(n[0]):null;if(o){let g=this.getColumnWidth(o,0);r.style.setProperty("--obsidian-hotfixes-first-column-width",`${g}px`)}let a=r.createEl("table",{cls:"obsidian-hotfixes-table"}),s=a.createEl("colgroup"),h=a.createTHead().createEl("tr");n.forEach((g,x)=>{let u=this.getPropertyId(g),f=this.getColumnWidth(u,x),p=s.createEl("col");p.style.width=`${f}px`,p.style.minWidth=`${f}px`,p.style.maxWidth=`${f}px`,p.dataset.propertyId=u,this.columnElements.set(u,p);let S=this.config.getDisplayName(g),m=h.createEl("th",{text:S});if(m.dataset.propertyId=u,m.style.width=`${f}px`,m.style.minWidth=`${f}px`,m.style.maxWidth=`${f}px`,e.enableReorder&&(m.addClass("obsidian-hotfixes-frozen-bases-reorder-handle"),m.draggable=!0,m.addEventListener("dragstart",b=>this.onColumnDragStart(b,u)),m.addEventListener("dragover",b=>this.onColumnDragOver(b,u)),m.addEventListener("drop",b=>this.onColumnDrop(b,u)),m.addEventListener("dragleave",()=>this.clearDragTargetStyles()),m.addEventListener("dragend",this.onColumnDragEnd)),this.headerElements.set(u,m),e.enableResize){let b=m.createSpan({cls:"obsidian-hotfixes-frozen-bases-resize-handle"});b.setAttr("draggable","false"),b.addEventListener("pointerdown",E=>this.startColumnResize(E,u,x))}});let w=a.createTBody(),y=this.data.groupedData.length>1;for(let g of this.data.groupedData){let x=g.entries;if(x.length){if(y){let u=w.createEl("tr",{cls:"obsidian-hotfixes-group-row"}),f=g.key?.toString()??"Ungrouped",p=u.createEl("td",{text:f});p.colSpan=n.length}for(let u of x){let f=w.createEl("tr",{cls:"obsidian-hotfixes-data-row"});for(let p=0;p<n.length;p++){let S=n[p],m=this.getPropertyId(S),b=this.getColumnWidth(m,p),E=f.createEl("td");E.dataset.propertyId=m,E.style.width=`${b}px`,E.style.minWidth=`${b}px`,E.style.maxWidth=`${b}px`,this.renderCellValue(E,u,S,e)}}}}}getPropertyId(e){return String(e)}getDefaultFirstColumnWidth(){return Math.max(R,this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,M)}renderCellText(e,t){e.empty(),e.createSpan({text:t}),t&&(e.title=t)}renderLinkFriendlyCell(e,t,n,r){return!t||typeof n!="string"?!1:t instanceof c.UrlValue||t instanceof c.LinkValue||this.containsLikelyLinkSyntax(n)?(e.empty(),c.MarkdownRenderer.render(this.plugin.app,n,e,r,this.plugin).catch(()=>{this.renderCellText(e,n)}),!0):!1}containsLikelyLinkSyntax(e){let t=e.trim();return t?/^\[[^\]]+\]\([^\)]*\)$/u.test(t)||this.isLikelyUri(t)||/\[\[[^\]]+\]\]/.test(t)?!0:/(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(t):!1}isLikelyUri(e){return/^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(e)}renderUriLink(e,t,n){e.empty();let r=e.createEl("a",{text:n,href:t});r.addClass("external-link"),r.addEventListener("click",o=>{o.button!==0&&o.button!==1||(o.preventDefault(),window.open(t,"_blank","noopener,noreferrer"))}),r.addEventListener("mouseover",o=>{this.plugin.app.workspace.trigger("hover-link",{event:o,source:"bases",hoverParent:this,targetEl:r,linktext:t})})}renderMarkdownLink(e,t){let n=/^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(t.trim());if(!n||!n.groups)return!1;let r=(n.groups.href??"").trim().replace(/\s+["'][^"']*["']$/,""),o=n.groups.label?.trim()||r;return!r||!o||!this.isLikelyUri(r)?!1:(this.renderUriLink(e,r,o),!0)}renderCellValue(e,t,n,r){let o=(0,c.parsePropertyId)(n),a=t.getValue(n),s=a?a.toString():"";if(e.classList.remove("obsidian-hotfixes-note-cell"),o.type==="file"&&o.name==="name"){let l=e.createEl("a",{text:t.file.name,href:t.file.path});l.addClass("internal-link"),l.addEventListener("click",h=>{if(h.button!==0&&h.button!==1)return;let w=c.Keymap.isModEvent(h);if(h.preventDefault(),w===!0||w===!1){this.plugin.app.workspace.openLinkText(t.file.path,"",!!w);return}this.plugin.app.workspace.openLinkText(t.file.path,"",w)}),l.addEventListener("mouseover",h=>{this.plugin.app.workspace.trigger("hover-link",{event:h,source:"bases",hoverParent:this,targetEl:l,linktext:t.file.path})}),s&&(e.title=s);return}if(a&&r.preserveLinks){let l=e.createSpan(),h=t?.file?.path??"";if(this.renderMarkdownLink(l,s))return;if(this.isLikelyUri(s)){this.renderUriLink(l,s,s);return}if(!this.renderLinkFriendlyCell(l,a,s,h))try{let y=new c.RenderContext;y.hoverPopover=this.hoverPopover,a.renderTo(l,y)}catch(y){console.warn("[Obsidian Hotfixes] Failed to render value, falling back to plain text.",n,y),this.renderCellText(l,s)}}else{let l=e.createSpan();this.renderCellText(l,s)}o.type==="note"&&r.editableNotes&&(e.classList.add("obsidian-hotfixes-note-cell"),e.addEventListener("dblclick",()=>{this.beginEditNoteCell(e,t,o.name,s)})),s&&(e.title=s)}async beginEditNoteCell(e,t,n,r){if(this.activeEditor)return;let o=e.innerText,a=document.createElement("textarea");a.value=r,a.rows=1;let s=()=>{this.activeEditor=null,this.render()},l=async()=>{let h=a.value;h!==o&&await this.plugin.app.fileManager.processFrontMatter(t.file,w=>{w[n]=h}),s()};this.activeEditor=a,e.empty(),e.appendChild(a),a.focus(),a.className="obsidian-hotfixes-note-editor",a.addEventListener("keydown",h=>{h.key==="Enter"&&!h.shiftKey?(h.preventDefault(),l()):h.key==="Escape"&&(h.preventDefault(),s())}),a.addEventListener("blur",()=>{l()})}getSavedColumnWidths(){let e=this.config.get(I),t=new Map;if(e&&typeof e=="object"&&!Array.isArray(e))for(let[n,r]of Object.entries(e)){let o=Number(r);Number.isFinite(o)&&t.set(n,o)}return t}syncColumnWidths(){let e=this.getSavedColumnWidths();this.activeColumnWidths.clear();for(let[t,n]of e.entries())this.activeColumnWidths.set(t,n)}getColumnWidth(e,t){let n=t===0?this.getDefaultFirstColumnWidth():M,r=this.activeColumnWidths.get(e),o=typeof r=="number"?r:n;return this.clampColumnWidth(o,t===0)}clampColumnWidth(e,t=!1){let n=Math.max(e,R);if(!t)return n;let r=this.plugin.settings.freezeFirstColumn,o=Math.max(R,r.firstColumnMinWidthPx),a=Math.max(o,r.firstColumnMaxWidthPx);return Math.min(Math.max(n,o),a)}applyColumnWidth(e,t){let n=this.currentPropertyOrder[0]===e,r=this.clampColumnWidth(t,n),o=this.columnElements.get(e);o&&(o.style.width=`${r}px`,o.style.minWidth=`${r}px`,o.style.maxWidth=`${r}px`);let a=this.headerElements.get(e);a&&(a.style.width=`${r}px`,a.style.minWidth=`${r}px`,a.style.maxWidth=`${r}px`),n&&this.activeView&&this.activeView.style.setProperty("--obsidian-hotfixes-first-column-width",`${r}px`)}persistColumnWidths(){let e={};for(let[t,n]of this.activeColumnWidths.entries())e[t]=n;this.config.set(I,e)}persistColumnOrder(e){this.config.set(P,e.map(t=>this.getPropertyId(t)))}safeAttributeValue(e){return e.replace(/"/g,'\\"')}clearDragTargetStyles(){this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach(e=>{e.removeAttribute("data-drag-target")}),this.activeDragTarget=null}onColumnDragStart(e,t){e.button===0&&v(this.config).enableReorder&&e.dataTransfer&&(this.draggingColumn=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t))}onColumnDragOver(e,t){if(!v(this.config).enableReorder||!this.draggingColumn||this.draggingColumn===t||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.activeDragTarget===t))return;this.clearDragTargetStyles(),this.activeDragTarget=t;let n=this.root.querySelector(`th[data-property-id="${this.safeAttributeValue(t)}"]`);n&&n.setAttribute("data-drag-target","true")}onColumnDrop(e,t){if(!v(this.config).enableReorder||(e.preventDefault(),!this.draggingColumn||this.draggingColumn===t))return;let n=this.getCurrentColumnOrder(),r=n.findIndex(a=>this.getPropertyId(a)===this.draggingColumn),o=n.findIndex(a=>this.getPropertyId(a)===t);if(r===-1||o===-1){this.draggingColumn=null,this.clearDragTargetStyles();return}n.splice(r,1),n.splice(o,0,this.draggingColumn),this.persistColumnOrder(n),this.draggingColumn=null,this.clearDragTargetStyles(),this.render()}onColumnDragEnd=()=>{v(this.config).enableReorder&&(this.draggingColumn=null,this.clearDragTargetStyles())};getCurrentColumnOrder(){let e=this.config.get(P);if(Array.isArray(e)){let n=new Set(this.data.properties.map(a=>this.getPropertyId(a))),r=new Set,o=e.map(a=>typeof a=="string"?a:null).filter(a=>a!==null&&n.has(this.getPropertyId(a))&&(r.has(this.getPropertyId(a))?!1:(r.add(this.getPropertyId(a)),!0)));if(o.length>0){let a=new Set(o.map(l=>this.getPropertyId(l))),s=this.data.properties.filter(l=>!a.has(this.getPropertyId(l)));return[...o,...s]}}let t=this.config.getOrder();return t.length>0?t:this.data.properties}getPropertyOrder(){return this.getCurrentColumnOrder()}},k=class extends c.PluginSettingTab{plugin;minWidthInput=null;maxWidthInput=null;backgroundInput=null;zIndexInput=null;baseFileToggle=null;embeddedBaseToggle=null;constructor(i,e){super(i,e),this.plugin=e}setSectionEnabled(i){this.minWidthInput&&this.minWidthInput.setDisabled(!i),this.maxWidthInput&&this.maxWidthInput.setDisabled(!i),this.backgroundInput&&this.backgroundInput.setDisabled(!i),this.zIndexInput&&this.zIndexInput.setDisabled(!i)}setBaseViewSwitcherSectionEnabled(i){this.baseFileToggle&&this.baseFileToggle.setDisabled(!i),this.embeddedBaseToggle&&this.embeddedBaseToggle.setDisabled(!i)}display(){let{containerEl:i}=this;i.empty(),i.createEl("h2",{text:"Obsidian Hotfixes"});let e=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});e.createEl("summary",{text:"Bases: Frozen first column"});let t=e.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),n=this.plugin.settings.freezeFirstColumn;new c.Setting(t).setName("Enable custom frozen table view").setDesc("Use a custom Bases view with a sticky first column instead of overlay hacks.").addToggle(s=>{s.setValue(n.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({enabled:l}),this.setSectionEnabled(l)})}),new c.Setting(t).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText(s=>{this.minWidthInput=s,s.setValue(String(n.firstColumnMinWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async l=>{let h=Number.parseInt(l,10);Number.isNaN(h)||h<80||await this.plugin.updateFreezeFirstColumn({firstColumnMinWidthPx:h})})}),new c.Setting(t).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText(s=>{this.maxWidthInput=s,s.setValue(String(n.firstColumnMaxWidthPx)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.onChange(async l=>{let h=Number.parseInt(l,10);Number.isNaN(h)||h<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:h})})}),new c.Setting(t).setName("Background").setDesc("Background used behind the frozen first column.").addText(s=>{this.backgroundInput=s,s.setValue(n.backgroundColor),s.setDisabled(!n.enabled),s.setPlaceholder("var(--background-primary)"),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:l||z.freezeFirstColumn.backgroundColor})})}),new c.Setting(t).setName("z-index").setDesc("Stacking order for the frozen first column.").addText(s=>{this.zIndexInput=s,s.setValue(String(n.zIndex)),s.setDisabled(!n.enabled),s.inputEl.type="number",s.setPlaceholder("4"),s.onChange(async l=>{let h=Number.parseInt(l,10);Number.isNaN(h)||await this.plugin.updateFreezeFirstColumn({zIndex:h})})}),new c.Setting(t).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle(s=>{s.setValue(n.showDivider),s.setDisabled(!n.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({showDivider:l})})}),this.setSectionEnabled(n.enabled);let r=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});r.createEl("summary",{text:"Bases: Quick view switcher"});let o=r.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),a=this.plugin.settings.baseViewSwitcher;new c.Setting(o).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle(s=>{s.setValue(a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({enabled:l}),this.setBaseViewSwitcherSectionEnabled(l)})}),new c.Setting(o).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle(s=>{this.baseFileToggle=s,s.setValue(a.showInBaseFiles),s.setDisabled(!a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInBaseFiles:l})})}),new c.Setting(o).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle(s=>{this.embeddedBaseToggle=s,s.setValue(a.showInEmbeds),s.setDisabled(!a.enabled),s.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInEmbeds:l})})}),this.setBaseViewSwitcherSectionEnabled(a.enabled)}};
