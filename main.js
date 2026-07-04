"use strict";var k=Object.defineProperty;var U=Object.getOwnPropertyDescriptor;var K=Object.getOwnPropertyNames;var q=Object.prototype.hasOwnProperty;var Y=(d,s)=>{for(var e in s)k(d,e,{get:s[e],enumerable:!0})},Z=(d,s,e,t)=>{if(s&&typeof s=="object"||typeof s=="function")for(let i of K(s))!q.call(d,i)&&i!==e&&k(d,i,{get:()=>s[i],enumerable:!(t=U(s,i))||t.enumerable});return d};var X=d=>Z(k({},"__esModule",{value:!0}),d);var ee={};Y(ee,{default:()=>F});module.exports=X(ee);var h=require("obsidian"),G="obsidian-hotfixes-runtime-styles",D="obsidian-hotfixes-frozen-table",P=180,R=60,M="obsidian-hotfixes:column-order",I="obsidian-hotfixes:column-widths",W="obsidian-hotfixes:view-feature-resize",H="obsidian-hotfixes:view-feature-reorder",N="obsidian-hotfixes:view-feature-preserve-links",A="obsidian-hotfixes:view-feature-edit-notes",j="obsidian-hotfixes:view-feature-wrap-mode",O="obsidian-hotfixes:view-feature-truncate",_="obsidian-hotfixes:view-feature-cell-height",B=".obsidian-hotfixes-base-view-switcher",$=34,z={enableResize:!1,enableReorder:!1,preserveLinks:!0,editableNotes:!1,wrapMode:"narrow",cellHeightPx:$};function T(d,s){return typeof d=="boolean"?d:s}function Q(d,s,e){return typeof d=="string"&&s.includes(d)?d:e}function J(d,s){if(typeof d=="number")return Number.isFinite(d)?d:s;if(typeof d=="object"&&d!==null&&"value"in d&&typeof d.value=="number"){let e=d.value;return Number.isFinite(e)?e:s}if(typeof d=="object"&&d!==null&&"value"in d&&typeof d.value=="string"){let e=Number.parseFloat(d.value);return Number.isFinite(e)?e:s}if(typeof d=="string"){let e=Number.parseFloat(d);return Number.isFinite(e)?e:s}return s}function v(d){let s=Q(d.get(j),["narrow","wide"],z.wrapMode),e=T(d.get(O),s==="narrow");return{enableResize:T(d.get(W),z.enableResize),enableReorder:T(d.get(H),z.enableReorder),preserveLinks:T(d.get(N),z.preserveLinks),editableNotes:T(d.get(A),z.editableNotes),wrapMode:e?"narrow":"wide",cellHeightPx:J(d.get(_),z.cellHeightPx)}}var C={freezeFirstColumn:{enabled:!1,firstColumnMinWidthPx:220,firstColumnMaxWidthPx:320,backgroundColor:"var(--background-primary)",zIndex:4,showDivider:!0},baseViewSwitcher:{enabled:!1,showInBaseFiles:!0,showInEmbeds:!0}},F=class extends h.Plugin{settings={freezeFirstColumn:{...C.freezeFirstColumn},baseViewSwitcher:{...C.baseViewSwitcher}};styleElement=null;baseViewSwitcherObserver=null;baseViewSwitcherRefreshFrame=null;baseViewSwitcherRefreshToken=0;async onload(){await this.loadSettings(),this.applyStyles(),this.registerSettingTab(),this.registerBasesView(D,{name:"Frozen Table",icon:"lucide-layout-grid",factory:(e,t)=>new V(e,t,this),options:e=>{let t=v(e);return[{type:"group",displayName:"Frozen table options",items:[{type:"toggle",key:W,displayName:"Enable column resizing",default:t.enableResize},{type:"toggle",key:H,displayName:"Enable column reordering",default:t.enableReorder},{type:"toggle",key:N,displayName:"Preserve inline link rendering",default:t.preserveLinks},{type:"toggle",key:A,displayName:"Enable note-cell editing",default:t.editableNotes},{type:"toggle",key:O,displayName:"Truncate long text",default:t.wrapMode==="narrow"},{type:"slider",key:_,displayName:"Cell height (px)",default:t.cellHeightPx,instant:!0,min:1,max:100,step:1,displayFormat:i=>`${i}px`}]}]}})||console.warn("[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("file-open",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.vault.on("modify",e=>{e instanceof h.TFile&&e.extension==="base"&&this.scheduleBaseViewSwitcherRefresh()})),this.registerDomEvent(window,"resize",()=>this.refreshOpenFrozenViews()),this.configureBaseViewSwitcher()}onunload(){this.stopBaseViewSwitcher(),this.styleElement&&(this.styleElement.remove(),this.styleElement=null)}registerSettingTab(){this.addSettingTab(new L(this.app,this))}async loadSettings(){let s=await this.loadData();this.settings={...C,...s,freezeFirstColumn:{...C.freezeFirstColumn,...s?.freezeFirstColumn??{}},baseViewSwitcher:{...C.baseViewSwitcher,...s?.baseViewSwitcher??{}}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.refreshOpenFrozenViews(),this.configureBaseViewSwitcher()}applyStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=G,document.head.appendChild(this.styleElement));let s=this.settings.freezeFirstColumn,e=Math.max(80,s.firstColumnMinWidthPx),t=Math.max(e,s.firstColumnMaxWidthPx),i=s.showDivider?"1px solid var(--background-modifier-border)":"none";this.styleElement.textContent=`
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${e}px;
  --obsidian-hotfixes-first-column-max-width: ${t}px;
  --obsidian-hotfixes-cell-height: ${$}px;
  --obsidian-hotfixes-first-column-bg: ${s.backgroundColor};
  --obsidian-hotfixes-first-column-z: ${s.zIndex};
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
  border-right: ${i};
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
`.trim()}refreshOpenFrozenViews(){this.app.workspace.iterateAllLeaves(s=>{let e=s.view;e instanceof V&&e.onDataUpdated()})}async updateFreezeFirstColumn(s){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...s},await this.saveSettings()}async updateBaseViewSwitcher(s){this.settings.baseViewSwitcher={...this.settings.baseViewSwitcher,...s},await this.saveSettings()}configureBaseViewSwitcher(){if(this.settings.baseViewSwitcher.enabled){this.startBaseViewSwitcher();return}this.stopBaseViewSwitcher()}startBaseViewSwitcher(){this.baseViewSwitcherObserver||(this.baseViewSwitcherObserver=new MutationObserver(()=>{this.scheduleBaseViewSwitcherRefresh()}),this.baseViewSwitcherObserver.observe(document.body,{childList:!0,subtree:!0})),this.scheduleBaseViewSwitcherRefresh()}stopBaseViewSwitcher(){this.baseViewSwitcherRefreshFrame!==null&&(window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame),this.baseViewSwitcherRefreshFrame=null),this.baseViewSwitcherRefreshToken++,this.baseViewSwitcherObserver&&(this.baseViewSwitcherObserver.disconnect(),this.baseViewSwitcherObserver=null),document.querySelectorAll(B).forEach(s=>s.remove())}scheduleBaseViewSwitcherRefresh(){this.settings.baseViewSwitcher.enabled&&this.baseViewSwitcherRefreshFrame===null&&(this.baseViewSwitcherRefreshFrame=window.requestAnimationFrame(()=>{this.baseViewSwitcherRefreshFrame=null,this.refreshBaseViewSwitchers()}))}async refreshBaseViewSwitchers(){let s=++this.baseViewSwitcherRefreshToken;if(!this.settings.baseViewSwitcher.enabled)return;this.removeOrphanedBaseViewSwitchers();let e=this.findBaseViewSwitcherTargets();for(let t of e){if(s!==this.baseViewSwitcherRefreshToken)return;await this.renderBaseViewSwitcher(t)}}removeOrphanedBaseViewSwitchers(){document.querySelectorAll(B).forEach(s=>{s.nextElementSibling?.matches(".bases-header")||s.remove()})}findBaseViewSwitcherTargets(){let s=this.settings.baseViewSwitcher,e=[],t=new Set;return document.querySelectorAll(".bases-header").forEach(n=>{if(t.has(n))return;t.add(n);let o=n.closest(".bases-embed"),a=this.getOwningFileView(n),r=a?.file?.path??"",l=o!==null;if(l&&!s.showInEmbeds){this.removeBaseViewSwitcherBefore(n);return}if(!l&&!s.showInBaseFiles){this.removeBaseViewSwitcherBefore(n);return}let c=o?this.resolveEmbeddedBaseFile(o,r):a?.file instanceof h.TFile&&a.file.extension==="base"?a.file:null;if(!c){this.removeBaseViewSwitcherBefore(n);return}let f=this.findNativeBaseViewButton(n);e.push({headerEl:n,baseFile:c,nativeViewButton:f,activeViewName:f?this.normalizeText(f.innerText||f.textContent||""):null})}),e}getOwningFileView(s){let e=null;return this.app.workspace.iterateAllLeaves(t=>{if(e)return;let i=t.view;i.containerEl?.contains(s)&&(e={containerEl:i.containerEl,file:i.file instanceof h.TFile?i.file:null})}),e}resolveEmbeddedBaseFile(s,e){let t=[s,s.closest(".internal-embed")].filter(n=>n!==null),i=[];for(let n of t)i.push(n.getAttribute("src")??"",n.getAttribute("data-src")??"",n.getAttribute("data-path")??"",n.getAttribute("alt")??"");for(let n of i){let o=this.normalizeBaseLinkCandidate(n);if(!o)continue;let a=this.app.vault.getFileByPath(o);if(a?.extension==="base")return a;let r=this.app.metadataCache.getFirstLinkpathDest(o,e);if(r instanceof h.TFile&&r.extension==="base")return r}return null}normalizeBaseLinkCandidate(s){let e=s.trim();if(!e)return null;try{e=decodeURIComponent(e)}catch{}return e=e.replace(/^!\[\[/,"").replace(/^\[\[/,"").replace(/\]\]$/,"").split("|")[0].split("#")[0].trim(),e||null}findNativeBaseViewButton(s){let e=[".bases-toolbar-view-menu",".bases-toolbar-item.mod-view",".bases-toolbar-item.mod-view-menu"];for(let t of e){let i=s.querySelector(t);if(i)return i}return s.querySelector(".bases-toolbar-item, button, [role='button']")}async renderBaseViewSwitcher(s){if(!s.headerEl.isConnected)return;let e=await this.readBaseViewDefinitions(s.baseFile);if(!s.headerEl.isConnected)return;if(e.length<2){this.removeBaseViewSwitcherBefore(s.headerEl);return}let t=s.headerEl.parentElement;if(!t)return;let i=this.getBaseViewSwitcherBefore(s.headerEl);i||(i=document.createElement("div"),i.className="obsidian-hotfixes-base-view-switcher",t.insertBefore(i,s.headerEl));let n=this.findActiveBaseViewName(s.activeViewName,e);i.empty(),i.dataset.basePath=s.baseFile.path,i.setAttribute("role","toolbar"),i.setAttribute("aria-label","Base views");for(let o of e){let a=document.createElement("button");a.type="button",a.className="obsidian-hotfixes-base-view-switcher-button",a.textContent=o.name,a.title=`${s.baseFile.basename}: ${o.name}`,a.dataset.viewName=o.name,o.name===n&&a.setAttribute("aria-current","true"),a.addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),a.getAttribute("aria-current")!=="true"&&this.switchBaseToView(s.headerEl,o.name)}),i.appendChild(a)}}async readBaseViewDefinitions(s){try{let e=await this.app.vault.cachedRead(s),t=(0,h.parseYaml)(e);return!t||!Array.isArray(t.views)?[]:t.views.map(i=>({name:typeof i?.name=="string"?i.name.trim():""})).filter(i=>i.name.length>0)}catch(e){return console.warn("[Obsidian Hotfixes] Failed to read Base views.",s.path,e),[]}}getBaseViewSwitcherBefore(s){let e=s.previousElementSibling;return e instanceof HTMLElement&&e.matches(B)?e:null}removeBaseViewSwitcherBefore(s){this.getBaseViewSwitcherBefore(s)?.remove()}findActiveBaseViewName(s,e){if(!s)return null;let t=this.normalizeText(s),i=e.find(o=>this.normalizeText(o.name)===t);return i?i.name:e.find(o=>t.includes(this.normalizeText(o.name)))?.name??null}async switchBaseToView(s,e){let t=this.findNativeBaseViewButton(s);if(!t)return;let i=new Set(Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")));t.click(),await this.nextAnimationFrame(),await this.nextAnimationFrame();let n=Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")).filter(r=>!i.has(r)),o=n.length>0?n:Array.from(document.querySelectorAll(".menu-item, [role='menuitem']")),a=this.findMenuItemForView(o,e);a&&(a.click(),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80))}findMenuItemForView(s,e){let t=this.normalizeText(e),i=s.find(n=>this.normalizeText(n.innerText||n.textContent||"")===t);return i||(s.find(n=>{let a=(n.innerText||n.textContent||"").split(/\r?\n/u)[0]??"";return this.normalizeText(a)===t})??null)}normalizeText(s){return s.replace(/\s+/g," ").trim()}nextAnimationFrame(){return new Promise(s=>{window.requestAnimationFrame(()=>s())})}},V=class extends h.BasesView{constructor(e,t,i){super(e);this.plugin=i;this.root=t.createDiv("obsidian-hotfixes-frozen-bases-root")}hoverPopover=null;root;activeView=null;activeEditor=null;currentPropertyOrder=[];columnElements=new Map;headerElements=new Map;activeColumnWidths=new Map;activeResizeColumn=null;activeResizeColumnIndex=null;resizeStartX=0;resizedColumnStartWidth=0;activeResizeWidth=0;activeResizeElement=null;activeResizePointerId=null;draggingColumn=null;activeDragTarget=null;onResizePointerMove=e=>{if(!v(this.config).enableResize||!this.activeResizeColumn||this.activeResizeColumnIndex===null)return;e.preventDefault();let i=e.clientX-this.resizeStartX,n=this.clampColumnWidth(this.resizedColumnStartWidth+i,this.activeResizeColumnIndex===0);this.activeResizeWidth=n,this.activeColumnWidths.set(this.activeResizeColumn,n),this.applyColumnWidth(this.activeResizeColumn,n)};onResizePointerUp=()=>{v(this.config).enableResize&&(!this.activeResizeColumn||this.activeResizeColumnIndex===null||(this.activeResizeWidth=this.clampColumnWidth(this.activeResizeWidth,this.activeResizeColumnIndex===0),this.activeColumnWidths.set(this.activeResizeColumn,this.activeResizeWidth),this.applyColumnWidth(this.activeResizeColumn,this.activeResizeWidth),this.persistColumnWidths(),this.stopColumnResize()))};startColumnResize=(e,t,i)=>{if(v(this.config).enableResize&&e.button===0){if(e.preventDefault(),e.stopPropagation(),this.activeResizeElement=e.currentTarget,this.activeResizePointerId=e.pointerId,this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.setPointerCapture(this.activeResizePointerId),this.activeResizeElement.style.userSelect="none"}catch{}this.activeResizeColumn=t,this.activeResizeColumnIndex=i,this.resizeStartX=e.clientX,this.resizedColumnStartWidth=this.getColumnWidth(t,i),this.activeResizeWidth=this.resizedColumnStartWidth,document.body.style.cursor="col-resize",document.addEventListener("pointermove",this.onResizePointerMove),document.addEventListener("pointerup",this.onResizePointerUp)}};stopColumnResize(){if(this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.releasePointerCapture(this.activeResizePointerId)}catch{}if(!this.activeResizeColumn){this.activeResizePointerId=null,this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeElement=null;return}document.removeEventListener("pointermove",this.onResizePointerMove),document.removeEventListener("pointerup",this.onResizePointerUp),this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeColumn=null,this.activeResizeColumnIndex=null,this.activeResizeWidth=0,this.resizeStartX=0,this.resizedColumnStartWidth=0,this.activeResizePointerId=null,this.activeResizeElement=null,document.body.style.cursor=""}type=D;onDataUpdated(){this.render()}render(){this.root.empty(),this.activeEditor&&(this.activeEditor=null);let e=v(this.config),t=Math.max(1,Math.min(100,Math.round(e.cellHeightPx)));if(this.root.className=`obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${e.wrapMode}`,this.root.style.setProperty("--obsidian-hotfixes-cell-height",`${t}px`),this.currentPropertyOrder=[],this.columnElements.clear(),this.headerElements.clear(),this.activeColumnWidths.clear(),this.stopColumnResize(),this.clearDragTargetStyles(),this.syncColumnWidths(),!this.plugin.settings.freezeFirstColumn.enabled){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"Frozen table view is disabled. Turn it on in plugin settings."});return}let i=this.getPropertyOrder();if(!i.length){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"No properties available for this Base."});return}i.forEach((w,x)=>{let u=this.getPropertyId(w),p=this.getColumnWidth(u,x);this.currentPropertyOrder[x]=u,this.activeColumnWidths.set(u,p)});let n=this.root.createDiv("obsidian-hotfixes-frozen-bases-view");this.activeView=n;let o=i.length>0?this.getPropertyId(i[0]):null;if(o){let w=this.getColumnWidth(o,0);n.style.setProperty("--obsidian-hotfixes-first-column-width",`${w}px`)}let a=n.createEl("table",{cls:"obsidian-hotfixes-table"}),r=a.createEl("colgroup"),c=a.createTHead().createEl("tr");i.forEach((w,x)=>{let u=this.getPropertyId(w),p=this.getColumnWidth(u,x),b=r.createEl("col");b.style.width=`${p}px`,b.style.minWidth=`${p}px`,b.style.maxWidth=`${p}px`,b.dataset.propertyId=u,this.columnElements.set(u,b);let S=this.config.getDisplayName(w),m=c.createEl("th",{text:S});if(m.dataset.propertyId=u,m.style.width=`${p}px`,m.style.minWidth=`${p}px`,m.style.maxWidth=`${p}px`,e.enableReorder&&(m.addClass("obsidian-hotfixes-frozen-bases-reorder-handle"),m.draggable=!0,m.addEventListener("dragstart",g=>this.onColumnDragStart(g,u)),m.addEventListener("dragover",g=>this.onColumnDragOver(g,u)),m.addEventListener("drop",g=>this.onColumnDrop(g,u)),m.addEventListener("dragleave",()=>this.clearDragTargetStyles()),m.addEventListener("dragend",this.onColumnDragEnd)),this.headerElements.set(u,m),e.enableResize){let g=m.createSpan({cls:"obsidian-hotfixes-frozen-bases-resize-handle"});g.setAttr("draggable","false"),g.addEventListener("pointerdown",y=>this.startColumnResize(y,u,x))}});let f=a.createTBody(),E=this.data.groupedData.length>1;for(let w of this.data.groupedData){let x=w.entries;if(x.length){if(E){let u=f.createEl("tr",{cls:"obsidian-hotfixes-group-row"}),p=w.key?.toString()??"Ungrouped",b=u.createEl("td",{text:p});b.colSpan=i.length}for(let u of x){let p=f.createEl("tr",{cls:"obsidian-hotfixes-data-row"});for(let b=0;b<i.length;b++){let S=i[b],m=this.getPropertyId(S),g=this.getColumnWidth(m,b),y=p.createEl("td");y.dataset.propertyId=m,y.style.width=`${g}px`,y.style.minWidth=`${g}px`,y.style.maxWidth=`${g}px`,this.renderCellValue(y,u,S,e)}}}}}getPropertyId(e){return String(e)}getDefaultFirstColumnWidth(){return Math.max(R,this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,P)}renderCellText(e,t){e.empty(),e.createSpan({text:t}),t&&(e.title=t)}renderLinkFriendlyCell(e,t,i,n){return!t||typeof i!="string"?!1:t instanceof h.UrlValue||t instanceof h.LinkValue||this.containsLikelyLinkSyntax(i)?(e.empty(),h.MarkdownRenderer.render(this.plugin.app,i,e,n,this.plugin).catch(()=>{this.renderCellText(e,i)}),!0):!1}containsLikelyLinkSyntax(e){let t=e.trim();return t?/^\[[^\]]+\]\([^\)]*\)$/u.test(t)||this.isLikelyUri(t)||/\[\[[^\]]+\]\]/.test(t)?!0:/(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(t):!1}isLikelyUri(e){return/^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(e)}renderUriLink(e,t,i){e.empty();let n=e.createEl("a",{text:i,href:t});n.addClass("external-link"),n.addEventListener("click",o=>{o.button!==0&&o.button!==1||(o.preventDefault(),window.open(t,"_blank","noopener,noreferrer"))}),n.addEventListener("mouseover",o=>{this.plugin.app.workspace.trigger("hover-link",{event:o,source:"bases",hoverParent:this,targetEl:n,linktext:t})})}renderMarkdownLink(e,t){let i=/^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(t.trim());if(!i||!i.groups)return!1;let n=(i.groups.href??"").trim().replace(/\s+["'][^"']*["']$/,""),o=i.groups.label?.trim()||n;return!n||!o||!this.isLikelyUri(n)?!1:(this.renderUriLink(e,n,o),!0)}renderCellValue(e,t,i,n){let o=(0,h.parsePropertyId)(i),a=t.getValue(i),r=a?a.toString():"";if(e.classList.remove("obsidian-hotfixes-note-cell"),o.type==="file"&&o.name==="name"){let l=e.createEl("a",{text:t.file.name,href:t.file.path});l.addClass("internal-link"),l.addEventListener("click",c=>{if(c.button!==0&&c.button!==1)return;let f=h.Keymap.isModEvent(c);if(c.preventDefault(),f===!0||f===!1){this.plugin.app.workspace.openLinkText(t.file.path,"",!!f);return}this.plugin.app.workspace.openLinkText(t.file.path,"",f)}),l.addEventListener("mouseover",c=>{this.plugin.app.workspace.trigger("hover-link",{event:c,source:"bases",hoverParent:this,targetEl:l,linktext:t.file.path})}),r&&(e.title=r);return}if(a&&n.preserveLinks){let l=e.createSpan(),c=t?.file?.path??"";if(this.renderMarkdownLink(l,r))return;if(this.isLikelyUri(r)){this.renderUriLink(l,r,r);return}if(!this.renderLinkFriendlyCell(l,a,r,c))try{let E=new h.RenderContext;E.hoverPopover=this.hoverPopover,a.renderTo(l,E)}catch(E){console.warn("[Obsidian Hotfixes] Failed to render value, falling back to plain text.",i,E),this.renderCellText(l,r)}}else{let l=e.createSpan();this.renderCellText(l,r)}o.type==="note"&&n.editableNotes&&(e.classList.add("obsidian-hotfixes-note-cell"),e.addEventListener("dblclick",()=>{this.beginEditNoteCell(e,t,o.name,r)})),r&&(e.title=r)}async beginEditNoteCell(e,t,i,n){if(this.activeEditor)return;let o=e.innerText,a=document.createElement("textarea");a.value=n,a.rows=1;let r=()=>{this.activeEditor=null,this.render()},l=async()=>{let c=a.value;c!==o&&await this.plugin.app.fileManager.processFrontMatter(t.file,f=>{f[i]=c}),r()};this.activeEditor=a,e.empty(),e.appendChild(a),a.focus(),a.className="obsidian-hotfixes-note-editor",a.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey?(c.preventDefault(),l()):c.key==="Escape"&&(c.preventDefault(),r())}),a.addEventListener("blur",()=>{l()})}getSavedColumnWidths(){let e=this.config.get(I),t=new Map;if(e&&typeof e=="object"&&!Array.isArray(e))for(let[i,n]of Object.entries(e)){let o=Number(n);Number.isFinite(o)&&t.set(i,o)}return t}syncColumnWidths(){let e=this.getSavedColumnWidths();this.activeColumnWidths.clear();for(let[t,i]of e.entries())this.activeColumnWidths.set(t,i)}getColumnWidth(e,t){let i=t===0?this.getDefaultFirstColumnWidth():P,n=this.activeColumnWidths.get(e),o=typeof n=="number"?n:i;return this.clampColumnWidth(o,t===0)}clampColumnWidth(e,t=!1){let i=Math.max(e,R);if(!t)return i;let n=this.plugin.settings.freezeFirstColumn,o=Math.max(R,n.firstColumnMinWidthPx),a=Math.max(o,n.firstColumnMaxWidthPx);return Math.min(Math.max(i,o),a)}applyColumnWidth(e,t){let i=this.currentPropertyOrder[0]===e,n=this.clampColumnWidth(t,i),o=this.columnElements.get(e);o&&(o.style.width=`${n}px`,o.style.minWidth=`${n}px`,o.style.maxWidth=`${n}px`);let a=this.headerElements.get(e);a&&(a.style.width=`${n}px`,a.style.minWidth=`${n}px`,a.style.maxWidth=`${n}px`),i&&this.activeView&&this.activeView.style.setProperty("--obsidian-hotfixes-first-column-width",`${n}px`)}persistColumnWidths(){let e={};for(let[t,i]of this.activeColumnWidths.entries())e[t]=i;this.config.set(I,e)}persistColumnOrder(e){this.config.set(M,e.map(t=>this.getPropertyId(t)))}safeAttributeValue(e){return e.replace(/"/g,'\\"')}clearDragTargetStyles(){this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach(e=>{e.removeAttribute("data-drag-target")}),this.activeDragTarget=null}onColumnDragStart(e,t){e.button===0&&v(this.config).enableReorder&&e.dataTransfer&&(this.draggingColumn=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t))}onColumnDragOver(e,t){if(!v(this.config).enableReorder||!this.draggingColumn||this.draggingColumn===t||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.activeDragTarget===t))return;this.clearDragTargetStyles(),this.activeDragTarget=t;let i=this.root.querySelector(`th[data-property-id="${this.safeAttributeValue(t)}"]`);i&&i.setAttribute("data-drag-target","true")}onColumnDrop(e,t){if(!v(this.config).enableReorder||(e.preventDefault(),!this.draggingColumn||this.draggingColumn===t))return;let i=this.getCurrentColumnOrder(),n=i.findIndex(a=>this.getPropertyId(a)===this.draggingColumn),o=i.findIndex(a=>this.getPropertyId(a)===t);if(n===-1||o===-1){this.draggingColumn=null,this.clearDragTargetStyles();return}i.splice(n,1),i.splice(o,0,this.draggingColumn),this.persistColumnOrder(i),this.draggingColumn=null,this.clearDragTargetStyles(),this.render()}onColumnDragEnd=()=>{v(this.config).enableReorder&&(this.draggingColumn=null,this.clearDragTargetStyles())};getCurrentColumnOrder(){let e=this.config.get(M);if(Array.isArray(e)){let i=new Set(this.data.properties.map(a=>this.getPropertyId(a))),n=new Set,o=e.map(a=>typeof a=="string"?a:null).filter(a=>a!==null&&i.has(this.getPropertyId(a))&&(n.has(this.getPropertyId(a))?!1:(n.add(this.getPropertyId(a)),!0)));if(o.length>0){let a=new Set(o.map(l=>this.getPropertyId(l))),r=this.data.properties.filter(l=>!a.has(this.getPropertyId(l)));return[...o,...r]}}let t=this.config.getOrder();return t.length>0?t:this.data.properties}getPropertyOrder(){return this.getCurrentColumnOrder()}},L=class extends h.PluginSettingTab{plugin;minWidthInput=null;maxWidthInput=null;backgroundInput=null;zIndexInput=null;baseFileToggle=null;embeddedBaseToggle=null;constructor(s,e){super(s,e),this.plugin=e}setSectionEnabled(s){this.minWidthInput&&this.minWidthInput.setDisabled(!s),this.maxWidthInput&&this.maxWidthInput.setDisabled(!s),this.backgroundInput&&this.backgroundInput.setDisabled(!s),this.zIndexInput&&this.zIndexInput.setDisabled(!s)}setBaseViewSwitcherSectionEnabled(s){this.baseFileToggle&&this.baseFileToggle.setDisabled(!s),this.embeddedBaseToggle&&this.embeddedBaseToggle.setDisabled(!s)}display(){let{containerEl:s}=this;s.empty(),s.createEl("h2",{text:"Obsidian Hotfixes"});let e=s.createEl("details",{cls:"obsidian-hotfixes-setting-section"});e.createEl("summary",{text:"Bases: Frozen first column"});let t=e.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),i=this.plugin.settings.freezeFirstColumn;new h.Setting(t).setName("Enable custom frozen table view").setDesc("Use a custom Bases view with a sticky first column instead of overlay hacks.").addToggle(r=>{r.setValue(i.enabled),r.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({enabled:l}),this.setSectionEnabled(l)})}),new h.Setting(t).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText(r=>{this.minWidthInput=r,r.setValue(String(i.firstColumnMinWidthPx)),r.setDisabled(!i.enabled),r.inputEl.type="number",r.onChange(async l=>{let c=Number.parseInt(l,10);Number.isNaN(c)||c<80||await this.plugin.updateFreezeFirstColumn({firstColumnMinWidthPx:c})})}),new h.Setting(t).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText(r=>{this.maxWidthInput=r,r.setValue(String(i.firstColumnMaxWidthPx)),r.setDisabled(!i.enabled),r.inputEl.type="number",r.onChange(async l=>{let c=Number.parseInt(l,10);Number.isNaN(c)||c<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:c})})}),new h.Setting(t).setName("Background").setDesc("Background used behind the frozen first column.").addText(r=>{this.backgroundInput=r,r.setValue(i.backgroundColor),r.setDisabled(!i.enabled),r.setPlaceholder("var(--background-primary)"),r.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:l||C.freezeFirstColumn.backgroundColor})})}),new h.Setting(t).setName("z-index").setDesc("Stacking order for the frozen first column.").addText(r=>{this.zIndexInput=r,r.setValue(String(i.zIndex)),r.setDisabled(!i.enabled),r.inputEl.type="number",r.setPlaceholder("4"),r.onChange(async l=>{let c=Number.parseInt(l,10);Number.isNaN(c)||await this.plugin.updateFreezeFirstColumn({zIndex:c})})}),new h.Setting(t).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle(r=>{r.setValue(i.showDivider),r.setDisabled(!i.enabled),r.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({showDivider:l})})}),this.setSectionEnabled(i.enabled);let n=s.createEl("details",{cls:"obsidian-hotfixes-setting-section"});n.createEl("summary",{text:"Bases: Quick view switcher"});let o=n.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),a=this.plugin.settings.baseViewSwitcher;new h.Setting(o).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle(r=>{r.setValue(a.enabled),r.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({enabled:l}),this.setBaseViewSwitcherSectionEnabled(l)})}),new h.Setting(o).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle(r=>{this.baseFileToggle=r,r.setValue(a.showInBaseFiles),r.setDisabled(!a.enabled),r.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInBaseFiles:l})})}),new h.Setting(o).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle(r=>{this.embeddedBaseToggle=r,r.setValue(a.showInEmbeds),r.setDisabled(!a.enabled),r.onChange(async l=>{await this.plugin.updateBaseViewSwitcher({showInEmbeds:l})})}),this.setBaseViewSwitcherSectionEnabled(a.enabled)}};
