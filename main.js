"use strict";var u=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var v=Object.getOwnPropertyNames;var b=Object.prototype.hasOwnProperty;var y=(a,e)=>{for(var t in e)u(a,t,{get:e[t],enumerable:!0})},g=(a,e,t,n)=>{if(e&&typeof e=="object"||typeof e=="function")for(let i of v(e))!b.call(a,i)&&i!==t&&u(a,i,{get:()=>e[i],enumerable:!(n=p(e,i))||n.enumerable});return a};var C=a=>g(u({},"__esModule",{value:!0}),a);var x={};y(x,{default:()=>d});module.exports=C(x);var o=require("obsidian"),c=".bases-view[data-view-type='table']",w="obsidian-hotfixes-runtime-styles",f={freezeFirstColumn:{enabled:!1,selector:c,leftOffsetPx:0,backgroundColor:"var(--background-primary)",zIndex:3,showDivider:!0,firstColumnMaxWidthPx:280}},d=class extends o.Plugin{settings={freezeFirstColumn:{...f.freezeFirstColumn}};styleElement=null;pendingPatchFrame=0;mutationObserver=null;frozenCellElements=new Set;activeOverlays=new Map;overlayScrollHandlers=new Map;async onload(){await this.loadSettings(),this.applyStyles(),this.scheduleBasePatchRefresh(),this.addSettingTab(new m(this.app,this)),this.registerEvent(this.app.workspace.on("layout-change",()=>this.applyStyles())),this.registerEvent(this.app.workspace.on("active-leaf-change",()=>{this.applyStyles(),this.scheduleBasePatchRefresh()})),this.registerEvent(this.app.workspace.on("layout-change",()=>this.scheduleBasePatchRefresh())),this.registerDomEvent(window,"resize",()=>this.scheduleBasePatchRefresh()),this.mutationObserver=new MutationObserver(()=>this.scheduleBasePatchRefresh()),this.mutationObserver.observe(document.body,{childList:!0,subtree:!0}),this.register(()=>this.mutationObserver?.disconnect())}onunload(){this.styleElement&&(this.styleElement.remove(),this.styleElement=null),this.clearFrozenColumnOverlays(),this.pendingPatchFrame&&(window.cancelAnimationFrame(this.pendingPatchFrame),this.pendingPatchFrame=0)}async loadSettings(){let e=await this.loadData();this.settings.freezeFirstColumn={...f.freezeFirstColumn,...e?.freezeFirstColumn??{}}}async saveSettings(){await this.saveData(this.settings),this.applyStyles(),this.scheduleBasePatchRefresh()}applyStyles(){if(this.styleElement||(this.styleElement=document.createElement("style"),this.styleElement.id=w,document.head.appendChild(this.styleElement)),!this.settings.freezeFirstColumn.enabled){this.styleElement.textContent="",this.clearFrozenColumnOverlays();return}let e=this.settings.freezeFirstColumn,t=(e.selector||c).trim(),n=e.showDivider?"box-shadow: 1px 0 0 var(--background-modifier-border);":"";this.styleElement.textContent=`
${t} {
  position: relative;
}

${t} .bases-table,
${t} .bases-table-container {
  position: relative;
  overflow-x: auto;
  max-width: 100%;
}

${t} .obsidian-hotfixes-first-column-overlay {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
  z-index: ${e.zIndex};
  background: ${e.backgroundColor};
  ${n}
  transform: translateX(0px);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  will-change: transform, width, height;
}

${t} .obsidian-hotfixes-first-column-overlay .obsidian-hotfixes-overlay-row {
  display: flex;
  flex: 0 0 auto;
  align-items: stretch;
  overflow: hidden;
  width: 100%;
}

${t} .obsidian-hotfixes-overlay-row > .bases-td,
${t} .obsidian-hotfixes-overlay-row > .bases-th,
${t} .obsidian-hotfixes-overlay-row > td,
${t} .obsidian-hotfixes-overlay-row > th,
${t} .obsidian-hotfixes-overlay-row > div {
  width: 100%;
  min-width: 100%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

${t} .obsidian-hotfixes-hide-original-first-column {
  visibility: hidden;
  pointer-events: none;
}
`.trim(),this.scheduleBasePatchRefresh()}scheduleBasePatchRefresh(){if(!this.settings.freezeFirstColumn.enabled){this.clearFrozenColumnOverlays();return}this.pendingPatchFrame||(this.pendingPatchFrame=window.requestAnimationFrame(()=>{this.pendingPatchFrame=0,this.refreshBasePatches()}))}refreshBasePatches(){if(this.clearFrozenColumnOverlays(),!this.settings.freezeFirstColumn.enabled)return;let t=(this.settings.freezeFirstColumn.selector||c).trim(),n;try{n=document.querySelectorAll(t)}catch{return}n.forEach(i=>this.patchBaseView(i))}patchBaseView(e){let t=this.settings.freezeFirstColumn,n=this.findHorizontalScrollContainer(e),i=this.getTableFirstColumnRows(e);if(!i.length)return;let s=this.measureFrozenColumnWidth(i,t.firstColumnMaxWidthPx);for(let r of i){let h=r.firstCell;h.classList.add("obsidian-hotfixes-hide-original-first-column"),h.style.width=`${s}px`,h.style.minWidth=`${Math.max(80,s)}px`,h.style.maxWidth=`${s}px`,this.frozenCellElements.add(h)}let l=this.ensureOverlay(n);this.renderOverlayRows(l,i),this.syncOverlayStyles(l,n,s),this.bindOverlayScrollSync(n,l)}getTableFirstColumnRows(e){let t=e.querySelectorAll("tr, .bases-tr, [role='row']"),n=[];return t.forEach(i=>{let s=i.querySelector(":scope > .bases-td:first-child, :scope > .bases-th:first-child, :scope > td:first-child, :scope > th:first-child")??i.querySelector(":scope > *:first-child");if(!s)return;let r=i.closest(".bases-thead")||i.closest("thead")?"thead":i.closest(".bases-tbody")||i.closest("tbody")?"tbody":i.closest(".bases-tfoot")||i.closest("tfoot")?"tfoot":"other";n.push({sourceRow:i,firstCell:s,section:r})}),n}findHorizontalScrollContainer(e){let t=[e.querySelector(".bases-table"),e.querySelector(".bases-table-container"),e.querySelector(".bases-viewport")];for(let n of t)if(n&&this.isHorizontallyScrollable(n))return n;return e}isHorizontallyScrollable(e){let t=window.getComputedStyle(e),n=t.overflowX,i=t.overflow;return n==="auto"||n==="scroll"||i==="auto"||i==="scroll"||e.scrollWidth>e.clientWidth+1}ensureOverlay(e){let t=this.activeOverlays.get(e);return t||(t=document.createElement("div"),t.className="obsidian-hotfixes-first-column-overlay",e.appendChild(t),this.activeOverlays.set(e,t)),t}renderOverlayRows(e,t){let n=[];t.forEach(i=>{let s=i.firstCell.cloneNode(!0);s.classList.add("obsidian-hotfixes-overlay-cell");let l=document.createElement("div");l.className=`obsidian-hotfixes-overlay-row obsidian-hotfixes-overlay-${i.section}`,l.style.height=`${Math.max(1,i.sourceRow.getBoundingClientRect().height)}px`,l.appendChild(s),n.push(l)}),e.replaceChildren(),e.append(...n)}syncOverlayStyles(e,t,n){let i=this.settings.freezeFirstColumn;e.style.width=`${n}px`,e.style.left=`${i.leftOffsetPx}px`,e.style.height=`${Math.max(1,Math.ceil(t.scrollHeight))}px`,this.syncOverlayScroll(t,e)}measureFrozenColumnWidth(e,t){let n=e.reduce((s,l)=>{let r=l.firstCell.getBoundingClientRect();return Math.max(s,Math.ceil(r.width),l.firstCell.offsetWidth)},0),i=Math.max(80,n||t);return Math.min(t,i)}bindOverlayScrollSync(e,t){if(this.overlayScrollHandlers.has(e))return;let n=()=>this.syncOverlayScroll(e,t);e.addEventListener("scroll",n,{passive:!0}),this.overlayScrollHandlers.set(e,n)}syncOverlayScroll(e,t){t.style.transform=`translateX(${e.scrollLeft}px)`}clearFrozenColumnOverlays(){for(let e of this.frozenCellElements)e.classList.remove("obsidian-hotfixes-hide-original-first-column"),e.style.width="",e.style.minWidth="",e.style.maxWidth="";this.frozenCellElements.clear();for(let[e,t]of this.activeOverlays){t.remove();let n=this.overlayScrollHandlers.get(e);n&&e.removeEventListener("scroll",n)}this.activeOverlays.clear(),this.overlayScrollHandlers.clear()}async updateFreezeFirstColumn(e){this.settings.freezeFirstColumn={...this.settings.freezeFirstColumn,...e},await this.saveSettings()}},m=class extends o.PluginSettingTab{plugin;selectorInput=null;leftOffsetInput=null;backgroundInput=null;zIndexInput=null;dividerToggleInput=null;maxWidthInput=null;constructor(e,t){super(e,t),this.plugin=t}setHotfixEnabled(e){this.selectorInput&&this.selectorInput.setDisabled(!e),this.leftOffsetInput&&this.leftOffsetInput.setDisabled(!e),this.backgroundInput&&this.backgroundInput.setDisabled(!e),this.zIndexInput&&this.zIndexInput.setDisabled(!e),this.dividerToggleInput&&this.dividerToggleInput.setDisabled(!e),this.maxWidthInput&&this.maxWidthInput.setDisabled(!e)}display(){let{containerEl:e}=this;e.empty(),e.createEl("h2",{text:"Obsidian Hotfixes"});let t=e.createEl("details",{cls:"obsidian-hotfixes-setting-section"});t.createEl("summary",{text:"Bases: Freeze first column"});let n=t.createEl("div",{cls:"obsidian-hotfixes-setting-section-content"}),i=this.plugin.settings.freezeFirstColumn;new o.Setting(n).setName("Enable first-column freeze").setDesc("Keep the first column in Bases table view visible while scrolling horizontally.").addToggle(s=>{s.setValue(i.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({enabled:l}),this.setHotfixEnabled(l)})}),new o.Setting(n).setName("Target selector").setDesc("CSS selector for the Bases container. Default targets table view-only Bases.").addText(s=>{this.selectorInput=s,s.setValue(i.selector),s.setDisabled(!i.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({selector:l||c})})}),new o.Setting(n).setName("Left offset (px)").setDesc("Optional offset for the frozen column from the left edge.").addText(s=>{this.leftOffsetInput=s,s.setValue(String(i.leftOffsetPx)),s.setDisabled(!i.enabled),s.inputEl.type="number",s.setPlaceholder("0"),s.onChange(async l=>{let r=Number.parseInt(l,10);Number.isNaN(r)||await this.plugin.updateFreezeFirstColumn({leftOffsetPx:r})})}),new o.Setting(n).setName("Background").setDesc("Background for the fixed first column while scrolling (CSS color or variable).").addText(s=>{this.backgroundInput=s,s.setValue(i.backgroundColor),s.setDisabled(!i.enabled),s.setPlaceholder("var(--background-primary)"),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({backgroundColor:l||f.freezeFirstColumn.backgroundColor})})}),new o.Setting(n).setName("First-column max width (px)").setDesc("Cap the frozen first-column width to avoid taking too much space.").addText(s=>{this.maxWidthInput=s,s.setValue(String(i.firstColumnMaxWidthPx)),s.setDisabled(!i.enabled),s.inputEl.type="number",s.setPlaceholder("280"),s.onChange(async l=>{let r=Number.parseInt(l,10);Number.isNaN(r)||r<80||await this.plugin.updateFreezeFirstColumn({firstColumnMaxWidthPx:r})})}),new o.Setting(n).setName("z-index").setDesc("z-index value used for frozen first-column overlay.").addText(s=>{this.zIndexInput=s,s.setValue(String(i.zIndex)),s.setDisabled(!i.enabled),s.inputEl.type="number",s.setPlaceholder("3"),s.onChange(async l=>{let r=Number.parseInt(l,10);Number.isNaN(r)||await this.plugin.updateFreezeFirstColumn({zIndex:r})})}),new o.Setting(n).setName("Show divider").setDesc("Draw a thin divider line to the right of the frozen first column.").addToggle(s=>{this.dividerToggleInput=s,s.setValue(i.showDivider),s.setDisabled(!i.enabled),s.onChange(async l=>{await this.plugin.updateFreezeFirstColumn({showDivider:l})})}),this.setHotfixEnabled(i.enabled)}};
