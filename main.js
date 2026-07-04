"use strict";var R=Object.defineProperty;var Z=Object.getOwnPropertyDescriptor;var j=Object.getOwnPropertyNames;var X=Object.prototype.hasOwnProperty;var Q=(c,i)=>{for(var e in i)R(c,e,{get:i[e],enumerable:!0})},J=(c,i,e,t)=>{if(i&&typeof i=="object"||typeof i=="function")for(let n of j(i))!X.call(c,n)&&n!==e&&R(c,n,{get:()=>i[n],enumerable:!(t=Z(i,n))||t.enumerable});return c};var ee=c=>J(R({},"__esModule",{value:!0}),c);var de={};Q(de,{default:()=>F});module.exports=ee(de);var h=require("obsidian"),te="obsidian-hotfixes-runtime-styles",N="obsidian-hotfixes-frozen-table",P=180,M=60,A="obsidian-hotfixes:column-order",D="obsidian-hotfixes:column-widths",W="obsidian-hotfixes:view-feature-resize",O="obsidian-hotfixes:view-feature-reorder",_="obsidian-hotfixes:view-feature-preserve-links",U="obsidian-hotfixes:view-feature-edit-notes",ie="obsidian-hotfixes:view-feature-wrap-mode",$="obsidian-hotfixes:view-feature-truncate",G="obsidian-hotfixes:view-feature-cell-height",K="obsidian-hotfixes:view-feature-sort",H="obsidian-hotfixes:view-state-sort",T=".obsidian-hotfixes-base-view-switcher",Y=34,ne=["a[href]","button","input","select","textarea","label","summary","[role='button']","[role='checkbox']",".task-list-item-checkbox",".checkbox-container"],se=[".callout-title",".callout-title-inner",".callout-icon","[data-callout-icon]","[data-icon='caret-right']","[data-icon='chevron-right']"],re=[".task-list-item",".task-list-item-checkbox","[data-task-id]","[data-task-action]","[data-action^='task']","[data-action^='tasks']",".tasks-edit",".tasks-postpone",".task-due",".task-scheduled",".task-start",".task-created",".task-done",".task-cancelled",".task-priority",".task-recurring",".task-id",".task-block","[class*='tasks-']","[class*='task-']","[role='button'][aria-label*='due']","[role='button'][aria-label*='schedule']","[role='button'][title*='due']","[role='button'][title*='schedule']","button[data-action][aria-label*='task']"],oe=[".edit-block-button","button[data-action='edit-block']","button[data-action='open-source']","[data-tooltip='Edit']","[aria-label='Edit block']","[aria-label='Edit']"],z={enableResize:!1,enableReorder:!1,preserveLinks:!0,editableNotes:!1,wrapMode:"narrow",cellHeightPx:Y,enableSorting:!0};function k(c,i){return typeof c=="boolean"?c:i}function ae(c,i,e){return typeof c=="string"&&i.includes(c)?c:e}function le(c,i){if(typeof c=="number")return Number.isFinite(c)?c:i;if(typeof c=="object"&&c!==null&&"value"in c&&typeof c.value=="number"){let e=c.value;return Number.isFinite(e)?e:i}if(typeof c=="object"&&c!==null&&"value"in c&&typeof c.value=="string"){let e=Number.parseFloat(c.value);return Number.isFinite(e)?e:i}if(typeof c=="string"){let e=Number.parseFloat(c);return Number.isFinite(e)?e:i}return i}function v(c){let i=ae(c.get(ie),["narrow","wide"],z.wrapMode),e=k(c.get($),i==="narrow");return{enableResize:k(c.get(W),z.enableResize),enableReorder:k(c.get(O),z.enableReorder),preserveLinks:k(c.get(_),z.preserveLinks),editableNotes:k(c.get(U),z.editableNotes),wrapMode:e?"narrow":"wide",cellHeightPx:le(c.get(G),z.cellHeightPx),enableSorting:k(c.get(K),z.enableSorting)}}var C={freezeFirstColumn:{enabled:!1,firstColumnMinWidthPx:220,firstColumnMaxWidthPx:320,backgroundColor:"var(--background-primary)",zIndex:4,showDivider:!0},baseViewSwitcher:{enabled:!1,showInBaseFiles:!0,showInEmbeds:!0},calloutEditGuard:{enabled:!0}},F=class extends h.Plugin{settings={freezeFirstColumn:{...C.freezeFirstColumn},baseViewSwitcher:{...C.baseViewSwitcher},calloutEditGuard:{...C.calloutEditGuard}};styleElement=null;baseViewSwitcherObserver=null;baseViewSwitcherRefreshFrame=null;baseViewSwitcherRefreshToken=0;async onload(){await this.loadSettings(),this.applyStyles(),this.registerSettingTab(),this.registerCalloutEditGuard(),this.registerBasesView(N,{name:"Frozen Table",icon:"lucide-layout-grid",factory:(e,t)=>new B(e,t,this),options:e=>{let t=v(e);return[{type:"group",displayName:"Frozen table options",items:[{type:"toggle",key:W,displayName:"Enable column resizing",default:t.enableResize},{type:"toggle",key:O,displayName:"Enable column reordering",default:t.enableReorder},{type:"toggle",key:K,displayName:"Enable column sorting",default:t.enableSorting},{type:"toggle",key:_,displayName:"Preserve inline link rendering",default:t.preserveLinks},{type:"toggle",key:U,displayName:"Enable note-cell editing",default:t.editableNotes},{type:"toggle",key:$,displayName:"Truncate long text",default:t.wrapMode==="narrow"},{type:"slider",key:G,displayName:"Cell height (px)",default:t.cellHeightPx,instant:!0,min:1,max:100,step:1,displayFormat:n=>`${n}px`}]}]}})||console.warn("[Obsidian Hotfixes] Frozen Table view could not be registered. Bases may be disabled."),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.workspace.on("file-open",()=>{this.refreshOpenFrozenViews(),this.scheduleBaseViewSwitcherRefresh()})),this.registerEvent(this.app.vault.on("modify",e=>{e instanceof h.TFile&&e.extension==="base"&&this.scheduleBaseViewSwitcherRefresh()})),this.registerDomEvent(window,"resize",()=>this.refreshOpenFrozenViews()),this.configureBaseViewSwitcher()}onunload(){this.stopBaseViewSwitcher(),this.styleElement&&(this.styleElement.remove(),this.styleElement=null)}registerSettingTab(){this.addSettingTab(new I(this.app,this))}async loadSettings(){let i=await this.loadData();this.settings={...C,...i,freezeFirstColumn:{...C.freezeFirstColumn,...i?.freezeFirstColumn??{}},baseViewSwitcher:{...C.baseViewSwitcher,...i?.baseViewSwitcher??{}},calloutEditGuard:{...C.calloutEditGuard,...i?.calloutEditGuard??{}}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.refreshOpenFrozenViews(),this.configureBaseViewSwitcher()}applyStyles(){this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=te,document.head.appendChild(this.styleElement));let i=this.settings.freezeFirstColumn,e=Math.max(80,i.firstColumnMinWidthPx),t=Math.max(e,i.firstColumnMaxWidthPx),n=i.showDivider?"1px solid var(--background-modifier-border)":"none";this.styleElement.textContent=`
.obsidian-hotfixes-frozen-bases-root {
  --obsidian-hotfixes-first-column-min-width: ${e}px;
  --obsidian-hotfixes-first-column-max-width: ${t}px;
  --obsidian-hotfixes-cell-height: ${Y}px;
  --obsidian-hotfixes-cell-padding-y: 8px;
  --obsidian-hotfixes-cell-padding-x: 10px;
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
  padding: var(--obsidian-hotfixes-cell-padding-y) var(--obsidian-hotfixes-cell-padding-x);
  border-bottom: 1px solid var(--background-modifier-border);
  border-right: 1px solid var(--background-modifier-border);
  vertical-align: top;
  line-height: 1.2;
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
`.trim()}refreshOpenFrozenViews(){this.app.workspace.iterateAllLeaves(i=>{let e=i.view;e instanceof B&&e.onDataUpdated()})}async updateFreezeFirstColumn(i){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...i},await this.saveSettings()}async updateBaseViewSwitcher(i){this.settings.baseViewSwitcher={...this.settings.baseViewSwitcher,...i},await this.saveSettings()}async updateCalloutEditGuard(i){this.settings.calloutEditGuard={...this.settings.calloutEditGuard,...i},await this.saveSettings()}registerCalloutEditGuard(){this.registerDomEvent(document,"pointerdown",this.onCalloutEditGuardEventCapture,!0),this.registerDomEvent(document,"mousedown",this.onCalloutEditGuardEventCapture,!0),this.registerDomEvent(document,"click",this.onCalloutEditGuardEventCapture,!0)}onCalloutEditGuardEventCapture=i=>{!this.settings.calloutEditGuard.enabled||!(i.target instanceof HTMLElement)||"button"in i&&i.button!==0||i.type==="contextmenu"||!i.target.closest(".markdown-source-view.mod-cm6")||!i.target.closest(".callout")||this.isCalloutHeaderLine(i.target)||this.isInsideInteractiveElement(i.target)||this.isTasksEmojiAction(i.target)||this.isCalloutEditButton(i.target)||i.stopImmediatePropagation()};isInsideInteractiveElement(i){return ne.some(e=>i.closest(e)!==null)}isCalloutHeaderLine(i){return se.some(e=>i.closest(e)!==null)}isTasksEmojiAction(i){if(i.closest(".tasks-edit, .tasks-postpone, .task-list-item, .task-list-item-checkbox, [data-task-id], [data-task-action], [data-action^='task'], [data-action^='tasks']")||re.some(r=>i.closest(r)!==null))return!0;let t=i.closest("button, [role='button'], [tabindex], a");if(!t||!t.closest("[data-task-id], [data-task-action], [data-action^='task'], [data-action^='tasks'], [class*='tasks-'], [class*='task-']"))return!1;let s=[t.getAttribute("aria-label")??"",t.getAttribute("title")??"",t.textContent??""].join(" ").toLowerCase();return/task|calendar|due|schedule|recurr|memo|repeat|postpone|start date|due date|done|priority|cancel/.test(s)}isCalloutEditButton(i){if(oe.some(n=>i.closest(n)!==null))return!0;let e=i.closest("button, [role='button']");return e?(e.getAttribute("aria-label")?.toLowerCase()??"").includes("edit"):!1}configureBaseViewSwitcher(){if(this.settings.baseViewSwitcher.enabled){this.startBaseViewSwitcher();return}this.stopBaseViewSwitcher()}startBaseViewSwitcher(){this.baseViewSwitcherObserver||(this.baseViewSwitcherObserver=new MutationObserver(i=>{i.every(e=>this.isBaseViewSwitcherMutation(e))||this.scheduleBaseViewSwitcherRefresh()}),this.baseViewSwitcherObserver.observe(document.body,{childList:!0,subtree:!0})),this.scheduleBaseViewSwitcherRefresh()}stopBaseViewSwitcher(){this.baseViewSwitcherRefreshFrame!==null&&(window.cancelAnimationFrame(this.baseViewSwitcherRefreshFrame),this.baseViewSwitcherRefreshFrame=null),this.baseViewSwitcherRefreshToken++,this.baseViewSwitcherObserver&&(this.baseViewSwitcherObserver.disconnect(),this.baseViewSwitcherObserver=null),document.querySelectorAll(T).forEach(i=>i.remove())}scheduleBaseViewSwitcherRefresh(){this.settings.baseViewSwitcher.enabled&&this.baseViewSwitcherRefreshFrame===null&&(this.baseViewSwitcherRefreshFrame=window.requestAnimationFrame(()=>{this.baseViewSwitcherRefreshFrame=null,this.refreshBaseViewSwitchers()}))}async refreshBaseViewSwitchers(){let i=++this.baseViewSwitcherRefreshToken;if(!this.settings.baseViewSwitcher.enabled)return;this.removeOrphanedBaseViewSwitchers();let e=this.findBaseViewSwitcherTargets();for(let t of e){if(i!==this.baseViewSwitcherRefreshToken)return;await this.renderBaseViewSwitcher(t)}}removeOrphanedBaseViewSwitchers(){document.querySelectorAll(T).forEach(i=>{i.nextElementSibling?.matches(".bases-header")||i.remove()})}findBaseViewSwitcherTargets(){let i=this.settings.baseViewSwitcher,e=[],t=new Set;return document.querySelectorAll(".bases-header").forEach(s=>{if(t.has(s))return;t.add(s);let r=s.closest(".bases-embed"),o=this.getOwningFileView(s),l=o?.file?.path??"",d=r!==null;if(d&&!i.showInEmbeds){this.removeBaseViewSwitcherBefore(s);return}if(!d&&!i.showInBaseFiles){this.removeBaseViewSwitcherBefore(s);return}let u=r?this.resolveEmbeddedBaseFile(r,l):o?.file instanceof h.TFile&&o.file.extension==="base"?o.file:null;if(!u){this.removeBaseViewSwitcherBefore(s);return}e.push({headerEl:s,baseFile:u})}),e}getOwningFileView(i){let e=null;return this.app.workspace.iterateAllLeaves(t=>{if(e)return;let n=t.view;n.containerEl?.contains(i)&&(e={containerEl:n.containerEl,file:n.file instanceof h.TFile?n.file:null,view:t.view})}),e}resolveEmbeddedBaseFile(i,e){let t=[i,i.closest(".internal-embed")].filter(s=>s!==null),n=[];for(let s of t)n.push(s.getAttribute("src")??"",s.getAttribute("data-src")??"",s.getAttribute("data-path")??"",s.getAttribute("alt")??"");for(let s of n){let r=this.normalizeBaseLinkCandidate(s);if(!r)continue;let o=this.app.vault.getFileByPath(r);if(o?.extension==="base")return o;let l=this.app.metadataCache.getFirstLinkpathDest(r,e);if(l instanceof h.TFile&&l.extension==="base")return l}return null}normalizeBaseLinkCandidate(i){let e=i.trim();if(!e)return null;try{e=decodeURIComponent(e)}catch{}return e=e.replace(/^!\[\[/,"").replace(/^\[\[/,"").replace(/\]\]$/,"").split("|")[0].split("#")[0].trim(),e||null}findNativeBaseViewButton(i,e=[]){let t=[".bases-toolbar-item.bases-toolbar-views-menu .text-icon-button",".bases-toolbar-views-menu .text-icon-button",".bases-toolbar-item.bases-toolbar-views-menu",".bases-toolbar-views-menu",".bases-toolbar-view-menu",".bases-toolbar-item.mod-view",".bases-toolbar-item.mod-view-menu"];for(let l of t){let d=i.querySelector(l);if(d)return d}let n=new Set(e.map(l=>this.normalizeText(l))),s=Array.from(i.querySelectorAll(".bases-toolbar-item, button, [role='button']")).filter(l=>this.isVisibleElement(l)),r=s.find(l=>{let d=this.normalizeText(l.innerText||l.textContent||"");if(!d)return!1;for(let u of n)if(d===u||d.includes(u))return!0;return!1});if(r)return r;let o=s.find(l=>this.normalizeText(l.getAttribute("aria-label")||l.getAttribute("title")||"").toLowerCase().includes("view"));return o||(s[0]??null)}async renderBaseViewSwitcher(i){if(!i.headerEl.isConnected)return;let e=await this.readBaseViewDefinitions(i.baseFile);if(!i.headerEl.isConnected)return;if(e.length<2){this.removeBaseViewSwitcherBefore(i.headerEl);return}let t=i.headerEl.parentElement;if(!t)return;let n=this.getBaseViewSwitcherBefore(i.headerEl);n||(n=document.createElement("div"),n.className="obsidian-hotfixes-base-view-switcher",t.insertBefore(n,i.headerEl));let s=this.findNativeBaseViewButton(i.headerEl,e.map(l=>l.name)),r=this.getBaseControllerForHeader(i.headerEl),o=this.findActiveBaseViewName(typeof r?.viewName=="string"?r.viewName:s?this.normalizeText(s.innerText||s.textContent||""):null,e);n.empty(),n.dataset.basePath=i.baseFile.path,n.setAttribute("role","toolbar"),n.setAttribute("aria-label","Base views");for(let l of e){let d=document.createElement("button");d.type="button",d.className="obsidian-hotfixes-base-view-switcher-button",d.textContent=l.name,d.title=`${i.baseFile.basename}: ${l.name}`,d.dataset.viewName=l.name,l.name===o&&d.setAttribute("aria-current","true"),d.addEventListener("pointerdown",u=>{u.stopPropagation()}),d.addEventListener("mousedown",u=>{u.stopPropagation()}),d.addEventListener("click",u=>{if(u.preventDefault(),u.stopPropagation(),d.getAttribute("aria-current")==="true")return;let a=this.getBaseViewSwitcherHeader(d);if(!a){this.scheduleBaseViewSwitcherRefresh();return}this.switchBaseToView(a,l.name)}),n.appendChild(d)}}async readBaseViewDefinitions(i){try{let e=await this.app.vault.cachedRead(i),t=(0,h.parseYaml)(e);return!t||!Array.isArray(t.views)?[]:t.views.map(n=>({name:typeof n?.name=="string"?n.name.trim():""})).filter(n=>n.name.length>0)}catch(e){return console.warn("[Obsidian Hotfixes] Failed to read Base views.",i.path,e),[]}}getBaseViewSwitcherBefore(i){let e=i.previousElementSibling;return e instanceof HTMLElement&&e.matches(T)?e:null}removeBaseViewSwitcherBefore(i){this.getBaseViewSwitcherBefore(i)?.remove()}getBaseViewSwitcherHeader(i){let t=i.closest(T)?.nextElementSibling;return t instanceof HTMLElement&&t.matches(".bases-header")?t:null}findActiveBaseViewName(i,e){if(!i)return null;let t=this.normalizeText(i),n=e.find(r=>this.normalizeText(r.name)===t);return n?n.name:e.find(r=>t.includes(this.normalizeText(r.name)))?.name??null}async switchBaseToView(i,e){let t=this.getBaseViewSwitcherBefore(i),n=t?Array.from(t.querySelectorAll(".obsidian-hotfixes-base-view-switcher-button")).map(a=>a.dataset.viewName??a.textContent??""):[],s=this.getBaseControllerForHeader(i);if(s?.selectView&&s.getQueryViewNames?.().includes(e)){s.selectView(e),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80);return}let r=this.findNativeBaseViewButton(i,n);if(!r){console.warn("[Obsidian Hotfixes] Could not find native Bases view menu button.");return}let o=new Set(Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")));this.activateElement(r);let l=await this.waitForNewMenuItems(o),d=l.length>0?l:Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")),u=this.findMenuItemForView(d,e);if(!u){console.warn("[Obsidian Hotfixes] Could not find Bases view menu item.",e);return}this.activateElement(u),window.setTimeout(()=>this.scheduleBaseViewSwitcherRefresh(),80)}findMenuItemForView(i,e){let t=this.normalizeText(e),n=i.filter(o=>o.closest('[data-group="views"]')!==null),s=n.length>0?n:i,r=s.find(o=>this.normalizeMenuItemText(o)===t);return r||(s.find(o=>{let d=this.normalizeMenuItemText(o).split(/\r?\n/u)[0]??"";return this.normalizeText(d)===t})??null)}normalizeText(i){return i.replace(/\s+/g," ").trim()}isBaseViewSwitcherMutation(i){if(i.target instanceof HTMLElement&&i.target.closest(T))return!0;let e=[...Array.from(i.addedNodes),...Array.from(i.removedNodes)];return e.length>0&&e.every(t=>this.isBaseViewSwitcherNode(t))}isBaseViewSwitcherNode(i){return i instanceof HTMLElement?i.matches(T)||i.closest(T)!==null:!1}normalizeMenuItemText(i){let e=i.querySelector(".bases-toolbar-menu-item-name");return this.normalizeText(e?.innerText||e?.textContent||i.innerText||i.textContent||"")}getBaseControllerForHeader(i){let n=this.getOwningFileView(i)?.view?.controller;return n&&typeof n.selectView=="function"&&typeof n.getQueryViewNames=="function"?n:null}isVisibleElement(i){let e=i.getBoundingClientRect(),t=window.getComputedStyle(i);return e.width>0&&e.height>0&&t.display!=="none"&&t.visibility!=="hidden"}activateElement(i){i.focus();let e={bubbles:!0,cancelable:!0,view:window,button:0,buttons:1},t={...e,buttons:0},n={...e,pointerId:1,pointerType:"mouse",isPrimary:!0},s={...t,pointerId:1,pointerType:"mouse",isPrimary:!0};try{i.dispatchEvent(new PointerEvent("pointerdown",n)),i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new PointerEvent("pointerup",s)),i.dispatchEvent(new MouseEvent("mouseup",t))}catch{i.dispatchEvent(new MouseEvent("mousedown",e)),i.dispatchEvent(new MouseEvent("mouseup",t))}i.dispatchEvent(new MouseEvent("click",t))}async waitForNewMenuItems(i,e=600){let t=Date.now()+e;for(;Date.now()<t;){await this.nextAnimationFrame();let n=Array.from(document.querySelectorAll(".bases-toolbar-menu-item, .menu-item, [role='menuitem']")).filter(s=>s.isConnected&&!i.has(s)&&this.isVisibleElement(s));if(n.length>0)return n}return[]}nextAnimationFrame(){return new Promise(i=>{window.requestAnimationFrame(()=>i())})}},B=class extends h.BasesView{constructor(e,t,n){super(e);this.plugin=n;this.root=t.createDiv("obsidian-hotfixes-frozen-bases-root")}hoverPopover=null;root;activeView=null;activeEditor=null;currentPropertyOrder=[];columnElements=new Map;headerElements=new Map;activeColumnWidths=new Map;activeResizeColumn=null;activeResizeColumnIndex=null;resizeStartX=0;resizedColumnStartWidth=0;activeResizeWidth=0;activeResizeElement=null;activeResizePointerId=null;draggingColumn=null;activeDragTarget=null;onResizePointerMove=e=>{if(!v(this.config).enableResize||!this.activeResizeColumn||this.activeResizeColumnIndex===null)return;e.preventDefault();let n=e.clientX-this.resizeStartX,s=this.clampColumnWidth(this.resizedColumnStartWidth+n,this.activeResizeColumnIndex===0);this.activeResizeWidth=s,this.activeColumnWidths.set(this.activeResizeColumn,s),this.applyColumnWidth(this.activeResizeColumn,s)};onResizePointerUp=()=>{v(this.config).enableResize&&(!this.activeResizeColumn||this.activeResizeColumnIndex===null||(this.activeResizeWidth=this.clampColumnWidth(this.activeResizeWidth,this.activeResizeColumnIndex===0),this.activeColumnWidths.set(this.activeResizeColumn,this.activeResizeWidth),this.applyColumnWidth(this.activeResizeColumn,this.activeResizeWidth),this.persistColumnWidths(),this.stopColumnResize()))};startColumnResize=(e,t,n)=>{if(v(this.config).enableResize&&e.button===0){if(e.preventDefault(),e.stopPropagation(),this.activeResizeElement=e.currentTarget,this.activeResizePointerId=e.pointerId,this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.setPointerCapture(this.activeResizePointerId),this.activeResizeElement.style.userSelect="none"}catch{}this.activeResizeColumn=t,this.activeResizeColumnIndex=n,this.resizeStartX=e.clientX,this.resizedColumnStartWidth=this.getColumnWidth(t,n),this.activeResizeWidth=this.resizedColumnStartWidth,document.body.style.cursor="col-resize",document.addEventListener("pointermove",this.onResizePointerMove),document.addEventListener("pointerup",this.onResizePointerUp)}};stopColumnResize(){if(this.activeResizeElement&&this.activeResizePointerId!==null)try{this.activeResizeElement.releasePointerCapture(this.activeResizePointerId)}catch{}if(!this.activeResizeColumn){this.activeResizePointerId=null,this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeElement=null;return}document.removeEventListener("pointermove",this.onResizePointerMove),document.removeEventListener("pointerup",this.onResizePointerUp),this.activeResizeElement&&(this.activeResizeElement.style.userSelect=""),this.activeResizeColumn=null,this.activeResizeColumnIndex=null,this.activeResizeWidth=0,this.resizeStartX=0,this.resizedColumnStartWidth=0,this.activeResizePointerId=null,this.activeResizeElement=null,document.body.style.cursor=""}type=N;onDataUpdated(){this.render()}render(){this.root.empty(),this.activeEditor&&(this.activeEditor=null);let e=v(this.config),t=Math.max(1,Math.min(100,Math.round(e.cellHeightPx))),n=this.getCompactCellPadding(t),s=e.enableSorting?this.getSortState():null;if(this.root.className=`obsidian-hotfixes-frozen-bases-root obsidian-hotfixes-wrap-${e.wrapMode}`,this.root.style.setProperty("--obsidian-hotfixes-cell-height",`${t}px`),this.root.style.setProperty("--obsidian-hotfixes-cell-padding-y",`${n}px`),this.root.style.setProperty("--obsidian-hotfixes-cell-padding-x",`${Math.min(10,4+Math.ceil(n*1.25))}px`),this.currentPropertyOrder=[],this.columnElements.clear(),this.headerElements.clear(),this.activeColumnWidths.clear(),this.stopColumnResize(),this.clearDragTargetStyles(),this.syncColumnWidths(),!this.plugin.settings.freezeFirstColumn.enabled){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"Frozen table view is disabled. Turn it on in plugin settings."});return}let r=this.getPropertyOrder();if(!r.length){this.root.createDiv({cls:"obsidian-hotfixes-frozen-bases-empty",text:"No properties available for this Base."});return}r.forEach((E,x)=>{let p=this.getPropertyId(E),w=this.getColumnWidth(p,x);this.currentPropertyOrder[x]=p,this.activeColumnWidths.set(p,w)});let o=this.root.createDiv("obsidian-hotfixes-frozen-bases-view");this.activeView=o;let l=r.length>0?this.getPropertyId(r[0]):null;if(l){let E=this.getColumnWidth(l,0);o.style.setProperty("--obsidian-hotfixes-first-column-width",`${E}px`)}let d=o.createEl("table",{cls:"obsidian-hotfixes-table"}),u=d.createEl("colgroup"),f=d.createTHead().createEl("tr");r.forEach((E,x)=>{let p=this.getPropertyId(E),w=this.getColumnWidth(p,x),y=u.createEl("col");y.style.width=`${w}px`,y.style.minWidth=`${w}px`,y.style.maxWidth=`${w}px`,y.dataset.propertyId=p,this.columnElements.set(p,y);let S=this.config.getDisplayName(E),m=f.createEl("th",{text:S});if(m.dataset.propertyId=p,m.style.width=`${w}px`,m.style.minWidth=`${w}px`,m.style.maxWidth=`${w}px`,e.enableReorder&&(m.addClass("obsidian-hotfixes-frozen-bases-reorder-handle"),m.draggable=!0,m.addEventListener("dragstart",g=>this.onColumnDragStart(g,p)),m.addEventListener("dragover",g=>this.onColumnDragOver(g,p)),m.addEventListener("drop",g=>this.onColumnDrop(g,p)),m.addEventListener("dragleave",()=>this.clearDragTargetStyles()),m.addEventListener("dragend",this.onColumnDragEnd)),this.headerElements.set(p,m),e.enableResize){let g=m.createSpan({cls:"obsidian-hotfixes-frozen-bases-resize-handle"});g.setAttr("draggable","false"),g.addEventListener("pointerdown",V=>this.startColumnResize(V,p,x))}e.enableSorting&&(m.addClass("obsidian-hotfixes-frozen-bases-sortable"),m.setAttribute("role","columnheader"),s?.propertyId===p?(m.setAttribute("data-sort-direction",s.direction==="ASC"?"\u2191":"\u2193"),m.setAttribute("aria-sort",s.direction==="ASC"?"ascending":"descending")):(m.removeAttribute("data-sort-direction"),m.setAttribute("aria-sort","none")),m.addEventListener("click",g=>this.onHeaderSortClick(g,p)))});let b=d.createTBody(),q=this.data.groupedData.length>1;for(let E of this.data.groupedData){let x=E.entries;if(!x.length)continue;if(q){let w=b.createEl("tr",{cls:"obsidian-hotfixes-group-row"}),y=E.key?.toString()??"Ungrouped",S=w.createEl("td",{text:y});S.colSpan=r.length}let p=s?this.getSortedEntries(x,s):x;for(let w of p){let y=b.createEl("tr",{cls:"obsidian-hotfixes-data-row"});for(let S=0;S<r.length;S++){let m=r[S],g=this.getPropertyId(m),V=this.getColumnWidth(g,S),L=y.createEl("td");L.dataset.propertyId=g,L.style.width=`${V}px`,L.style.minWidth=`${V}px`,L.style.maxWidth=`${V}px`,this.renderCellValue(L,w,m,e)}}}}getPropertyId(e){return String(e)}getDefaultFirstColumnWidth(){return Math.max(M,this.plugin.settings.freezeFirstColumn.firstColumnMinWidthPx,P)}renderCellText(e,t){e.empty(),e.createSpan({text:t}),t&&(e.title=t)}renderLinkFriendlyCell(e,t,n,s){return!t||typeof n!="string"?!1:t instanceof h.UrlValue||t instanceof h.LinkValue||this.containsLikelyLinkSyntax(n)?(e.empty(),h.MarkdownRenderer.render(this.plugin.app,n,e,s,this.plugin).catch(()=>{this.renderCellText(e,n)}),!0):!1}containsLikelyLinkSyntax(e){let t=e.trim();return t?/^\[[^\]]+\]\([^\)]*\)$/u.test(t)||this.isLikelyUri(t)||/\[\[[^\]]+\]\]/.test(t)?!0:/(?:https?:\/\/|www\.)[^\s<>"'()]+/i.test(t):!1}isLikelyUri(e){return/^[a-z][a-z0-9+.-]*:[^\s<>'"()]+$/i.test(e)}renderUriLink(e,t,n){e.empty();let s=e.createEl("a",{text:n,href:t});s.addClass("external-link"),s.addEventListener("click",r=>{r.button!==0&&r.button!==1||(r.preventDefault(),window.open(t,"_blank","noopener,noreferrer"))}),s.addEventListener("mouseover",r=>{this.plugin.app.workspace.trigger("hover-link",{event:r,source:"bases",hoverParent:this,targetEl:s,linktext:t})})}renderMarkdownLink(e,t){let n=/^\[(?<label>[^\]]+)\]\((?<href>[^\)]*?)\)$/u.exec(t.trim());if(!n||!n.groups)return!1;let s=(n.groups.href??"").trim().replace(/\s+["'][^"']*["']$/,""),r=n.groups.label?.trim()||s;return!s||!r||!this.isLikelyUri(s)?!1:(this.renderUriLink(e,s,r),!0)}renderCellValue(e,t,n,s){let r=(0,h.parsePropertyId)(n),o=t.getValue(n),l=o?o.toString():"";if(e.classList.remove("obsidian-hotfixes-note-cell"),r.type==="file"&&r.name==="name"){let d=e.createEl("a",{text:t.file.name,href:t.file.path});d.addClass("internal-link"),d.addEventListener("click",u=>{if(u.button!==0&&u.button!==1)return;let a=h.Keymap.isModEvent(u);if(u.preventDefault(),a===!0||a===!1){this.plugin.app.workspace.openLinkText(t.file.path,"",!!a);return}this.plugin.app.workspace.openLinkText(t.file.path,"",a)}),d.addEventListener("mouseover",u=>{this.plugin.app.workspace.trigger("hover-link",{event:u,source:"bases",hoverParent:this,targetEl:d,linktext:t.file.path})}),l&&(e.title=l);return}if(o&&s.preserveLinks){let d=e.createSpan(),u=t?.file?.path??"";if(this.renderMarkdownLink(d,l))return;if(this.isLikelyUri(l)){this.renderUriLink(d,l,l);return}if(!this.renderLinkFriendlyCell(d,o,l,u))try{let f=new h.RenderContext;f.hoverPopover=this.hoverPopover,o.renderTo(d,f)}catch(f){console.warn("[Obsidian Hotfixes] Failed to render value, falling back to plain text.",n,f),this.renderCellText(d,l)}}else{let d=e.createSpan();this.renderCellText(d,l)}r.type==="note"&&s.editableNotes&&(e.classList.add("obsidian-hotfixes-note-cell"),e.addEventListener("dblclick",()=>{this.beginEditNoteCell(e,t,r.name,l)})),l&&(e.title=l)}async beginEditNoteCell(e,t,n,s){if(this.activeEditor)return;let r=e.innerText,o=document.createElement("textarea");o.value=s,o.rows=1;let l=()=>{this.activeEditor=null,this.render()},d=async()=>{let u=o.value;u!==r&&await this.plugin.app.fileManager.processFrontMatter(t.file,a=>{a[n]=u}),l()};this.activeEditor=o,e.empty(),e.appendChild(o),o.focus(),o.className="obsidian-hotfixes-note-editor",o.addEventListener("keydown",u=>{u.key==="Enter"&&!u.shiftKey?(u.preventDefault(),d()):u.key==="Escape"&&(u.preventDefault(),l())}),o.addEventListener("blur",()=>{d()})}getSavedColumnWidths(){let e=this.config.get(D),t=new Map;if(e&&typeof e=="object"&&!Array.isArray(e))for(let[n,s]of Object.entries(e)){let r=Number(s);Number.isFinite(r)&&t.set(n,r)}return t}syncColumnWidths(){let e=this.getSavedColumnWidths();this.activeColumnWidths.clear();for(let[t,n]of e.entries())this.activeColumnWidths.set(t,n)}getColumnWidth(e,t){let n=t===0?this.getDefaultFirstColumnWidth():P,s=this.activeColumnWidths.get(e),r=typeof s=="number"?s:n;return this.clampColumnWidth(r,t===0)}getCompactCellPadding(e){return e<=8?0:e<=12?1:e<=20?2:e<=30?3:4}clampColumnWidth(e,t=!1){let n=Math.max(e,M);if(!t)return n;let s=this.plugin.settings.freezeFirstColumn,r=Math.max(M,s.firstColumnMinWidthPx),o=Math.max(r,s.firstColumnMaxWidthPx);return Math.min(Math.max(n,r),o)}applyColumnWidth(e,t){let n=this.currentPropertyOrder[0]===e,s=this.clampColumnWidth(t,n),r=this.columnElements.get(e);r&&(r.style.width=`${s}px`,r.style.minWidth=`${s}px`,r.style.maxWidth=`${s}px`);let o=this.headerElements.get(e);o&&(o.style.width=`${s}px`,o.style.minWidth=`${s}px`,o.style.maxWidth=`${s}px`),n&&this.activeView&&this.activeView.style.setProperty("--obsidian-hotfixes-first-column-width",`${s}px`)}persistColumnWidths(){let e={};for(let[t,n]of this.activeColumnWidths.entries())e[t]=n;this.config.set(D,e)}persistColumnOrder(e){this.config.set(A,e.map(t=>this.getPropertyId(t)))}safeAttributeValue(e){return e.replace(/"/g,'\\"')}clearDragTargetStyles(){this.root.querySelectorAll(".obsidian-hotfixes-table th[data-drag-target]").forEach(e=>{e.removeAttribute("data-drag-target")}),this.activeDragTarget=null}onColumnDragStart(e,t){e.button===0&&v(this.config).enableReorder&&e.dataTransfer&&(this.draggingColumn=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t))}onColumnDragOver(e,t){if(!v(this.config).enableReorder||!this.draggingColumn||this.draggingColumn===t||(e.preventDefault(),e.dataTransfer&&(e.dataTransfer.dropEffect="move"),this.activeDragTarget===t))return;this.clearDragTargetStyles(),this.activeDragTarget=t;let n=this.root.querySelector(`th[data-property-id="${this.safeAttributeValue(t)}"]`);n&&n.setAttribute("data-drag-target","true")}onColumnDrop(e,t){if(!v(this.config).enableReorder||(e.preventDefault(),!this.draggingColumn||this.draggingColumn===t))return;let n=this.getCurrentColumnOrder(),s=n.findIndex(o=>this.getPropertyId(o)===this.draggingColumn),r=n.findIndex(o=>this.getPropertyId(o)===t);if(s===-1||r===-1){this.draggingColumn=null,this.clearDragTargetStyles();return}n.splice(s,1),n.splice(r,0,this.draggingColumn),this.persistColumnOrder(n),this.draggingColumn=null,this.clearDragTargetStyles(),this.render()}onColumnDragEnd=()=>{v(this.config).enableReorder&&(this.draggingColumn=null,this.clearDragTargetStyles())};getSortState(){let e=this.config.get(H);if(!e||typeof e!="object"||Array.isArray(e)||typeof e.direction!="string"||typeof e.propertyId!="string")return null;let t=e.direction;return t!=="ASC"&&t!=="DESC"?null:{propertyId:e.propertyId,direction:t}}setSortState(e){this.config.set(H,e)}onHeaderSortClick(e,t){if(!v(this.config).enableSorting)return;let s=e.target;if(s&&s.closest(".obsidian-hotfixes-frozen-bases-resize-handle"))return;e.preventDefault();let r=this.getSortState();if(!r||r.propertyId!==t){this.setSortState({propertyId:t,direction:"ASC"}),this.render();return}if(r.direction==="ASC"){this.setSortState({propertyId:t,direction:"DESC"}),this.render();return}this.setSortState(null),this.render()}getSortedEntries(e,t){let n=t.propertyId;return e.map((s,r)=>({entry:s,index:r})).sort((s,r)=>{let o=this.normalizeSortValue(this.readCellValue(s.entry,n)),l=this.normalizeSortValue(this.readCellValue(r.entry,n)),d=t.direction==="ASC"?1:-1,u=this.compareSortableValues(o,l);if(u!==0)return u*d;let a=this.compareSortableValues(this.getSortFallback(s.entry),this.getSortFallback(r.entry));return a!==0?a:s.index-r.index}).map(({entry:s})=>s)}readCellValue(e,t){try{return e.getValue(t)}catch{return null}}getSortFallback(e){let t=e?.file?.path,n=e?.file?.name;return typeof t=="string"&&t.length>0?t:typeof n=="string"&&n.length>0?n:""}normalizeSortValue(e){if(e==null)return null;if(e instanceof h.UrlValue||e instanceof h.LinkValue)return e.toString();if(e instanceof Date)return e.getTime();if(typeof e=="number")return e;if(typeof e=="boolean")return e?1:0;if(typeof e=="string")return e;if(Array.isArray(e))return e.map(t=>typeof t=="string"?t:typeof t=="number"?t.toString():"").filter(t=>t.length>0).join(", ");if(typeof e=="object"){let t=["text","path","name","value","toString"];for(let n of t){let s=e[n];if(typeof s=="string"&&s.length>0)return s}}return String(e)}compareSortableValues(e,t){if(e===null)return t===null?0:1;if(t===null)return-1;if(typeof e=="number"&&typeof t=="number")return e>t?1:e<t?-1:0;let n=String(e).toLowerCase(),s=String(t).toLowerCase();return n===s?0:new Intl.Collator(void 0,{numeric:!0,sensitivity:"base"}).compare(n,s)}getCurrentColumnOrder(){let e=this.config.get(A);if(Array.isArray(e)){let n=new Set(this.data.properties.map(o=>this.getPropertyId(o))),s=new Set,r=e.map(o=>typeof o=="string"?o:null).filter(o=>o!==null&&n.has(this.getPropertyId(o))&&(s.has(this.getPropertyId(o))?!1:(s.add(this.getPropertyId(o)),!0)));if(r.length>0){let o=new Set(r.map(d=>this.getPropertyId(d))),l=this.data.properties.filter(d=>!o.has(this.getPropertyId(d)));return[...r,...l]}}let t=this.config.getOrder();return t.length>0?t:this.data.properties}getPropertyOrder(){return this.getCurrentColumnOrder()}},I=class extends h.PluginSettingTab{plugin;minWidthInput=null;maxWidthInput=null;backgroundInput=null;zIndexInput=null;baseFileToggle=null;embeddedBaseToggle=null;constructor(i,e){super(i,e),this.plugin=e}setSectionEnabled(i){this.minWidthInput&&this.minWidthInput.setDisabled(!i),this.maxWidthInput&&this.maxWidthInput.setDisabled(!i),this.backgroundInput&&this.backgroundInput.setDisabled(!i),this.zIndexInput&&this.zIndexInput.setDisabled(!i)}setBaseViewSwitcherSectionEnabled(i){this.baseFileToggle&&this.baseFileToggle.setDisabled(!i),this.embeddedBaseToggle&&this.embeddedBaseToggle.setDisabled(!i)}display(){let{containerEl:i}=this;i.empty(),i.createEl("h2",{text:"Obsidian Hotfixes"});let e=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});e.createEl("summary",{text:"Bases: Frozen first column"});let t=e.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),n=this.plugin.settings.freezeFirstColumn;new h.Setting(t).setName("Enable custom frozen table view").setDesc("Use a custom Bases view with a sticky first column instead of overlay hacks.").addToggle(a=>{a.setValue(n.enabled),a.onChange(async f=>{await this.plugin.updateFreezeFirstColumn({enabled:f}),this.setSectionEnabled(f)})}),new h.Setting(t).setName("First column minimum width (px)").setDesc("Minimum width of the frozen first column.").addText(a=>{this.minWidthInput=a,a.setValue(String(n.firstColumnMinWidthPx)),a.setDisabled(!n.enabled),a.inputEl.type="number",a.onChange(async f=>{let b=Number.parseInt(f,10);Number.isNaN(b)||b<80||await this.plugin.updateFreezeFirstColumn({firstColumnMinWidthPx:b})})}),new h.Setting(t).setName("First column max width (px)").setDesc("Cap the frozen first column width.").addText(a=>{this.maxWidthInput=a,a.setValue(String(n.firstColumnMaxWidthPx)),a.setDisabled(!n.enabled),a.inputEl.type="number",a.onChange(async f=>{let b=Number.parseInt(f,10);Number.isNaN(b)||b<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:b})})}),new h.Setting(t).setName("Background").setDesc("Background used behind the frozen first column.").addText(a=>{this.backgroundInput=a,a.setValue(n.backgroundColor),a.setDisabled(!n.enabled),a.setPlaceholder("var(--background-primary)"),a.onChange(async f=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:f||C.freezeFirstColumn.backgroundColor})})}),new h.Setting(t).setName("z-index").setDesc("Stacking order for the frozen first column.").addText(a=>{this.zIndexInput=a,a.setValue(String(n.zIndex)),a.setDisabled(!n.enabled),a.inputEl.type="number",a.setPlaceholder("4"),a.onChange(async f=>{let b=Number.parseInt(f,10);Number.isNaN(b)||await this.plugin.updateFreezeFirstColumn({zIndex:b})})}),new h.Setting(t).setName("Show divider").setDesc("Draw a divider to the right of the frozen first column.").addToggle(a=>{a.setValue(n.showDivider),a.setDisabled(!n.enabled),a.onChange(async f=>{await this.plugin.updateFreezeFirstColumn({showDivider:f})})}),this.setSectionEnabled(n.enabled);let s=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});s.createEl("summary",{text:"Bases: Quick view switcher"});let r=s.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),o=this.plugin.settings.baseViewSwitcher;new h.Setting(r).setName("Enable view switcher row").setDesc("Add compact buttons above each Base for jumping between its views.").addToggle(a=>{a.setValue(o.enabled),a.onChange(async f=>{await this.plugin.updateBaseViewSwitcher({enabled:f}),this.setBaseViewSwitcherSectionEnabled(f)})}),new h.Setting(r).setName("Show above opened .base files").setDesc("Add the row when a Base file is opened directly.").addToggle(a=>{this.baseFileToggle=a,a.setValue(o.showInBaseFiles),a.setDisabled(!o.enabled),a.onChange(async f=>{await this.plugin.updateBaseViewSwitcher({showInBaseFiles:f})})}),new h.Setting(r).setName("Show above embedded Bases").setDesc("Add the row for embedded .base files in notes.").addToggle(a=>{this.embeddedBaseToggle=a,a.setValue(o.showInEmbeds),a.setDisabled(!o.enabled),a.onChange(async f=>{await this.plugin.updateBaseViewSwitcher({showInEmbeds:f})})}),this.setBaseViewSwitcherSectionEnabled(o.enabled);let l=i.createEl("details",{cls:"obsidian-hotfixes-setting-section"});l.createEl("summary",{text:"Callouts: Edit guard"});let d=l.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),u=this.plugin.settings.calloutEditGuard;new h.Setting(d).setName("Enable callout edit guard").setDesc("In Live Preview, clicking inside a rendered callout will no longer switch it into edit/source mode. Use the callout edit button to open editing.").addToggle(a=>{a.setValue(u.enabled),a.onChange(async f=>{await this.plugin.updateCalloutEditGuard({enabled:f})})})}};
