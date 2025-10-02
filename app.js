// app.js - Main module for SVG and Raster conversions
// Note: Initial theme is set inline in <head> to avoid FOUC. This module wires the toggle and app logic.

// ----- Theme & language -----
const themeBtn = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');
const langSelect = document.getElementById('langSelect');
const langDropdown = document.getElementById('langDropdown');
const langCurrent = document.getElementById('langCurrent');
const langDeBtn = document.getElementById('langDeBtn');
const langEnBtn = document.getElementById('langEnBtn');
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  try{ localStorage.setItem('theme', t); }catch(_){}
  themeLabel.textContent = t === 'dark' ? 'Hell' : 'Dunkel';
  if (themeBtn.firstChild) themeBtn.firstChild.textContent = t === 'dark' ? '☀️\u00A0' : '🌙\u00A0';
}
(function initTheme(){ const current = document.documentElement.getAttribute('data-theme') || 'light'; setTheme(current); })();
if (themeBtn) themeBtn.addEventListener('click', ()=>{
  const next = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
  setTheme(next);
});

// i18n strings
const I18N_KEY = 'converter.lang';
let currentLang = 'de';
const t = {
  de: {
    title: 'YouTube Thumbnail Konverter',
    subtitle: 'Lade ein SVG und exportiere es als PNG in YouTube‑Größe.',
    previewTitle: 'Vorschau',
    rCardTitle: 'JPG/PNG Konverter',
    settingsTitle: 'Einstellungen',
    checkerLabel: 'Schachbrett (Transparenz)',
    checkerToggleLabel: 'anzeigen',
    presetLabel: 'Preset (Größe)',
    resizeLabel: 'Resize-Modus',
    jpgBgLabel: 'JPG Hintergrund',
    previewBgLabel: 'Vorschau Hintergrund anwenden',
    previewBgToggle: 'verwenden',
    jpgQLabel: 'JPG Qualität',
    workerLabel: 'Batch mit Web Worker',
    workerToggleLabel: 'aktivieren',
    // Buttons
    openPicker: '📁 Dateien auswählen',
    openRPicker: '📁 Bilder auswählen',
    downloadBtn: 'Download PNG',
    download2xBtn: 'Download PNG @2x (2560×1440)',
    downloadAllBtn: 'Alle exportieren (PNG)',
    downloadAll2xBtn: 'Alle exportieren @2x',
    clearListBtn: 'Liste leeren',
    rDownloadPNG: 'Zu PNG (einzeln)',
    rDownloadJPG: 'Zu JPG (einzeln)',
    rDownloadAllPNG: 'Alle → PNG',
    rDownloadAllJPG: 'Alle → JPG',
    loadFromUrlBtn: 'Bild von URL laden',
    rClearListBtn: 'Liste leeren',
    exportsTitle: 'Exporte',
    exportsHint: 'Hier siehst du deine zuletzt exportierten Bilder (lokal gespeichert).',
    ytCardTitle: 'YouTube Thumbnails',
    ytLoadBtn: 'Laden',
    ytAllBtn: 'Alle herunterladen',
    ytPlaceholder: 'https://www.youtube.com/watch?v=... oder youtu.be/...',
    ytEmpty: 'Füge einen YouTube-Link ein, um Vorschaubilder zu laden.',
    // Status/messages
    svgStatusNone: 'Kein SVG geladen.',
    rStatusNone: 'Keine Bilder geladen.',
    selectedCount: '{n} ausgewählt',
    noneSelected: 'Keine ausgewählt',
    svgLoadedNTotal: '{n} SVG(s) geladen. Insgesamt: {total}.',
    rLoadedNTotal: '{n} Bild(er) geladen. Insgesamt: {total}.',
    selectedSVG: 'Ausgewählt: {name} ({index}/{total})',
    selectedRaster: 'Ausgewählt: {name} ({index}/{total})',
    listCleared: 'Liste geleert.',
    renderError: 'Fehler beim Rendern.',
    exportCompleted: 'Export abgeschlossen: {ok}/{total} Dateien.',
    exportOneDone: 'Exportiert: {name}',
    exportFailed: 'Export fehlgeschlagen.',
    invalidSVGs: 'Keine gültigen SVGs gefunden.',
    invalidImages: 'Keine gültigen Bilder gefunden.',
    urlPrompt: 'Bitte eine Bild-URL eingeben.',
    urlLoaded: 'Geladen von URL: {name}',
    urlLoadFailed: 'Konnte Bild nicht laden (CORS?). Versuche eine andere URL oder lade die Datei lokal.',
    errorPrefix: 'Fehler: {message}',
    alertPickSVG: 'Bitte zuerst ein SVG laden und auswählen.',
    alertLoadSVGs: 'Bitte zuerst SVGs laden.',
    alertPickImage: 'Bitte zuerst ein Bild laden und auswählen.',
    alertLoadImages: 'Bitte zuerst Bilder laden.',
    // History
    historyTotalLabel: 'Gesamt',
    historyTypeLabel: { 'svg->png': 'SVG → PNG', 'img->png': 'IMG → PNG', 'img->jpg': 'IMG → JPG' },
    // YouTube statuses
    ytInvalid: 'Ungültiger YouTube-Link oder Video-ID.',
    ytLoaded: 'Thumbnails geladen.',
    ytPreviewLoaded: 'Vorschau geladen.',
    ytPreviewFailed: 'Vorschau fehlgeschlagen.',
    ytDownloading: 'Lade Thumbnails...',
    ytDoneDownloaded: 'Fertig: {ok}/{total} heruntergeladen.',
    ytDoneOpened: 'Fertig: {ok}/{total} geöffnet. Hinweis: Direkt-Download ohne Server ist eingeschränkt.',
    ytDownloadFailed: 'Download fehlgeschlagen.',
  },
  en: {
    title: 'YouTube Thumbnail Converter',
    subtitle: 'Load an SVG and export it as a PNG in YouTube size.',
    previewTitle: 'Preview',
    rCardTitle: 'JPG/PNG Converter',
    settingsTitle: 'Settings',
    checkerLabel: 'Checkerboard (transparency)',
    checkerToggleLabel: 'show',
    presetLabel: 'Preset (size)',
    resizeLabel: 'Resize mode',
    jpgBgLabel: 'JPG background',
    previewBgLabel: 'Apply preview background',
    previewBgToggle: 'use',
    jpgQLabel: 'JPG quality',
    workerLabel: 'Batch with Web Worker',
    workerToggleLabel: 'enable',
    // Buttons
    openPicker: '📁 Select files',
    openRPicker: '📁 Select images',
    downloadBtn: 'Download PNG',
    download2xBtn: 'Download PNG @2x (2560×1440)',
    downloadAllBtn: 'Export all (PNG)',
    downloadAll2xBtn: 'Export all @2x',
    clearListBtn: 'Clear list',
    rDownloadPNG: 'To PNG (single)',
    rDownloadJPG: 'To JPG (single)',
    rDownloadAllPNG: 'All → PNG',
    rDownloadAllJPG: 'All → JPG',
    loadFromUrlBtn: 'Load from URL',
    rClearListBtn: 'Clear list',
    exportsTitle: 'Exports',
    exportsHint: 'Your most recent exported images (stored locally).',
    ytCardTitle: 'YouTube Thumbnails',
    ytLoadBtn: 'Load',
    ytAllBtn: 'Download all',
    ytPlaceholder: 'https://www.youtube.com/watch?v=... or youtu.be/...',
    ytEmpty: 'Paste a YouTube link to load thumbnails.',
    // Status/messages
    svgStatusNone: 'No SVG loaded.',
    rStatusNone: 'No images loaded.',
    selectedCount: '{n} selected',
    noneSelected: 'None selected',
    svgLoadedNTotal: '{n} SVG(s) loaded. Total: {total}.',
    rLoadedNTotal: '{n} image(s) loaded. Total: {total}.',
    selectedSVG: 'Selected: {name} ({index}/{total})',
    selectedRaster: 'Selected: {name} ({index}/{total})',
    listCleared: 'List cleared.',
    renderError: 'Render error.',
    exportCompleted: 'Export finished: {ok}/{total} files.',
    exportOneDone: 'Exported: {name}',
    exportFailed: 'Export failed.',
    invalidSVGs: 'No valid SVGs found.',
    invalidImages: 'No valid images found.',
    urlPrompt: 'Please enter an image URL.',
    urlLoaded: 'Loaded from URL: {name}',
    urlLoadFailed: 'Could not load image (CORS?). Try another URL or upload locally.',
    errorPrefix: 'Error: {message}',
    alertPickSVG: 'Please load and select an SVG first.',
    alertLoadSVGs: 'Please load SVGs first.',
    alertPickImage: 'Please load and select an image first.',
    alertLoadImages: 'Please load images first.',
    // History
    historyTotalLabel: 'Total',
    historyTypeLabel: { 'svg->png': 'SVG → PNG', 'img->png': 'IMG → PNG', 'img->jpg': 'IMG → JPG' },
    // YouTube statuses
    ytInvalid: 'Invalid YouTube link or video ID.',
    ytLoaded: 'Thumbnails loaded.',
    ytPreviewLoaded: 'Preview loaded.',
    ytPreviewFailed: 'Preview failed.',
    ytDownloading: 'Downloading thumbnails...',
    ytDoneDownloaded: 'Done: {ok}/{total} downloaded.',
    ytDoneOpened: 'Done: {ok}/{total} opened. Note: Direct download without server is limited.',
    ytDownloadFailed: 'Download failed.',
  }
};
function L(key, vars){
  const dict = t[currentLang] || t.de;
  let s = dict[key];
  if (s == null) return key;
  if (typeof s === 'object') return '[object]';
  if (vars){ for (const k of Object.keys(vars)){ s = s.replace(new RegExp('\\{'+k+'\\}','g'), String(vars[k])); } }
  return s;
}
function applyLang(lang){
  const dict = t[lang] || t.de;
  currentLang = (lang === 'en' ? 'en' : 'de');
  const setText = (id, value)=>{ const el = document.getElementById(id); if (el) el.textContent = value; };
  setText('title', dict.title);
  setText('subtitle', dict.subtitle);
  setText('previewTitle', dict.previewTitle);
  setText('rCardTitle', dict.rCardTitle);
  setText('settingsTitle', dict.settingsTitle);
  setText('checkerLabel', dict.checkerLabel);
  setText('checkerToggleLabel', dict.checkerToggleLabel);
  setText('presetLabel', dict.presetLabel);
  setText('resizeLabel', dict.resizeLabel);
  setText('jpgBgLabel', dict.jpgBgLabel);
  setText('previewBgLabel', dict.previewBgLabel);
  setText('previewBgToggle', dict.previewBgToggle);
  setText('jpgQLabel', dict.jpgQLabel);
  setText('workerLabel', dict.workerLabel);
  setText('workerToggleLabel', dict.workerToggleLabel);
  // Buttons
  setText('openPicker', dict.openPicker);
  setText('openRPicker', dict.openRPicker);
  setText('download', dict.downloadBtn);
  setText('download2x', dict.download2xBtn);
  setText('downloadAll', dict.downloadAllBtn);
  setText('downloadAll2x', dict.downloadAll2xBtn);
  setText('clearList', dict.clearListBtn);
  setText('rDownloadPNG', dict.rDownloadPNG);
  setText('rDownloadJPG', dict.rDownloadJPG);
  setText('rDownloadAllPNG', dict.rDownloadAllPNG);
  setText('rDownloadAllJPG', dict.rDownloadAllJPG);
  setText('loadFromUrl', dict.loadFromUrlBtn);
  setText('rClearList', dict.rClearListBtn);
  setText('exportsTitle', dict.exportsTitle);
  setText('exportsHint', dict.exportsHint);
  // YouTube card
  setText('ytCardTitle', dict.ytCardTitle);
  setText('ytFetch', dict.ytLoadBtn);
  setText('ytMenuLoadBtn', dict.ytLoadBtn);
  setText('ytMenuAllBtn', dict.ytAllBtn);
  // Browser tab title
  try { document.title = dict.title || 'YouTube Thumbnail Converter'; } catch (_) {}
  const ytUrl = document.getElementById('ytUrl'); if (ytUrl) ytUrl.placeholder = dict.ytPlaceholder;
  const ytStatus = document.getElementById('ytStatus'); if (ytStatus && (!ytStatus.textContent || /YouTube|Füge|Paste/i.test(ytStatus.textContent))) ytStatus.textContent = dict.ytEmpty;
  // Initialize default statuses for sections if still untouched
  const sEl = document.getElementById('status'); if (sEl && (/Kein SVG geladen\.|No SVG loaded\./i.test(sEl.textContent) || !sEl.textContent)) sEl.textContent = dict.svgStatusNone;
  const rsEl = document.getElementById('rStatus'); if (rsEl && (/Keine Bilder geladen\.|No images loaded\./i.test(rsEl.textContent) || !rsEl.textContent)) rsEl.textContent = dict.rStatusNone;
  if (langCurrent) langCurrent.textContent = (lang === 'en' ? 'English' : 'Deutsch');
  try{ localStorage.setItem(I18N_KEY, lang); }catch(_){ }
}

// Animated, event-based title status
const TitleStatus = (function(){
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let base = document.title;
  let timer = null; let i = 0; let active = false;
  function setBase(){ base = (t[currentLang] && t[currentLang].title) || 'YouTube Thumbnail Converter'; if (!active) document.title = base; }
  function start(label){
    if (reduce){ document.title = `${base} • ${label}`; return; }
    stop(); active = true; i = 0;
    timer = setInterval(()=>{
      const dots = '.'.repeat((i % 3) + 1);
      document.title = `${base} • ${label} ${dots}`; i++;
    }, 800);
  }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } active = false; document.title = base; }
  // Keep base in sync with language
  const _applyLang = applyLang;
  applyLang = function(lang){ _applyLang(lang); setBase(); };
  window.addEventListener('blur', ()=> active && stop());
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden) stop(); });
  return { start, stop, setBase };
})();
function initLang(){
  let lang = 'de';
  try{ lang = localStorage.getItem(I18N_KEY) || 'de'; }catch(_){ }
  if (langSelect) langSelect.value = lang;
  applyLang(lang);
}
function setLanguage(lang){
  if (langSelect) langSelect.value = lang;
  applyLang(lang);
  if (langDropdown && langDropdown.open) langDropdown.open = false;
}
if (langSelect) langSelect.addEventListener('change', ()=> setLanguage(langSelect.value));
if (langDeBtn) langDeBtn.addEventListener('click', ()=> setLanguage('de'));
if (langEnBtn) langEnBtn.addEventListener('click', ()=> setLanguage('en'));

// ----- Shared canvas -----
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const dimBadge = document.getElementById('dimBadge');

// ===== Settings =====
const LS_KEY = 'converter.settings.v1';
const LS_HISTORY = 'converter.history.v1';
const optChecker = document.getElementById('optChecker');
const optPreset = document.getElementById('optPreset');
const optMode = document.getElementById('optMode');
const optJpgBg = document.getElementById('optJpgBg');
const optJpgQ = document.getElementById('optJpgQ');
const optPreviewBg = document.getElementById('optPreviewBg');
const optWorker = document.getElementById('optWorker');
const saveHint = document.getElementById('saveHint');

const settings = {
  checker: true,
  preset: 'original', // 'original' | '1280x720' | '1920x1080' | '1080x1080' | '1080x1920'
  mode: 'contain',     // 'contain' | 'cover' | 'stretch'
  jpgBg: '#ffffff',
  jpgQ: 92,
  worker: false,
  previewBg: true,
};

function loadSettings(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (raw){ Object.assign(settings, JSON.parse(raw)); }
  }catch(_){}
  if (optChecker) optChecker.checked = !!settings.checker;
  if (optPreset) optPreset.value = settings.preset;
  if (optMode) optMode.value = settings.mode;
  if (optJpgBg) optJpgBg.value = settings.jpgBg;
  if (optJpgQ) optJpgQ.value = String(settings.jpgQ);
  if (optWorker) optWorker.checked = !!settings.worker;
  if (optPreviewBg) optPreviewBg.checked = !!settings.previewBg;
  applyChecker();
  updateDimBadge();
}
function saveSettings(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(settings)); }catch(_){}
  if (saveHint){ saveHint.textContent = 'Gespeichert.'; setTimeout(()=> saveHint.textContent='Änderungen werden gespeichert.', 1200); }
}
function applyChecker(){
  if (settings.checker) document.body.classList.remove('no-checker');
  else document.body.classList.add('no-checker');
}
function parsePreset(p){
  if (!p || p==='original') return null;
  const m = String(p).trim().match(/^(\d+)\s*[x×]\s*(\d+)$/i);
  if (!m) return null;
  const w = parseInt(m[1],10), h = parseInt(m[2],10);
  if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
  return {w,h};
}
function drawFitted(img, targetW, targetH, mode){
  // Compute draw rect per mode
  if (mode==='stretch'){
    ctx.drawImage(img, 0, 0, targetW, targetH);
    return;
  }
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const ir = iw/ih, tr = targetW/targetH;
  let dw, dh; // drawn size
  if (mode==='cover'){
    if (ir > tr){ dh = targetH; dw = dh*ir; } else { dw = targetW; dh = dw/ir; }
  } else { // contain
    if (ir > tr){ dw = targetW; dh = dw/ir; } else { dh = targetH; dw = dh*ir; }
  }
  const dx = (targetW - dw)/2, dy = (targetH - dh)/2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function updateDimBadge(){ if (!dimBadge) return; dimBadge.textContent = `${canvas.width}×${canvas.height}`; }

// ===== History helpers =====
const exportListView = document.getElementById('exportList');
const statsSummary = document.getElementById('statsSummary');
const historyFilter = document.getElementById('historyFilter');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

let historyPaging = { page: 1, pageSize: 10, filter: '' };
function getHistory(){
  try{
    const raw = localStorage.getItem(LS_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object'){
      // Legacy shape: per-user object; flatten all entries
      return Object.values(parsed).flat();
    }
    return [];
  }catch(_){ return []; }
}
function saveHistory(arr){ try{ localStorage.setItem(LS_HISTORY, JSON.stringify(arr)); }catch(_){} }
async function recordExport(entry){
  const h = getHistory();
  h.unshift({ ...entry, ts: new Date().toISOString() });
  // Cap history to a reasonable size
  saveHistory(h.slice(0, 1000));
  renderHistory();
}
function renderHistory(){
  if (!exportListView || !statsSummary) return;
  const all = getHistory();
  const filtered = historyPaging.filter ? all.filter(e=>e.type===historyPaging.filter) : all;
  const totalPages = Math.max(1, Math.ceil(filtered.length / historyPaging.pageSize));
  historyPaging.page = Math.min(Math.max(1, historyPaging.page), totalPages);
  const start = (historyPaging.page-1)*historyPaging.pageSize;
  const pageItems = filtered.slice(start, start+historyPaging.pageSize);
  exportListView.innerHTML='';
  pageItems.forEach(e=>{
    const li=document.createElement('li'); li.className='file-item';
    const row = document.createElement('div'); row.className='export-row';
    const img=document.createElement('img'); img.className='thumb'; img.alt='thumb'; img.src=e.thumb||''; row.appendChild(img);
    const meta=document.createElement('div');
    const when=new Date(e.ts).toLocaleString();
    meta.textContent=`${e.name} — ${e.type} — ${e.size?.w||'-'}×${e.size?.h||'-'} — ${when}`;
    row.appendChild(meta);
    li.appendChild(row);
    // attach data for preview
    li.dataset.name = e.name || '';
    li.dataset.type = e.type || '';
    li.dataset.thumb = e.thumb || '';
    if (e.size && (e.size.w||e.size.h)){
      li.dataset.w = String(e.size.w||'');
      li.dataset.h = String(e.size.h||'');
    }
    li.addEventListener('click', ()=> {
      // Fill YouTube or URL input if applicable
      if (/^https?:\/\/img\.youtube\.com\//i.test(e.thumb || '')){
        if (ytUrlInput){
          const idMatch = (e.name || '').match(/^([A-Za-z0-9_-]{6,20})_/);
          if (idMatch){ ytUrlInput.value = `https://www.youtube.com/watch?v=${idMatch[1]}`; }
        }
      } else if (/^https?:\/\//i.test(e.thumb || '')){
        if (urlInput){ urlInput.value = e.thumb; }
      }
      loadHistoryPreview(e);
    });
    exportListView.appendChild(li);
  });
  const byType=filtered.reduce((m,x)=>{m[x.type]=(m[x.type]||0)+1;return m;},{});
  const typeLabelMap = (t[currentLang] && t[currentLang].historyTypeLabel) || t.de.historyTypeLabel;
  const tparts=Object.entries(byType).map(([k,v])=>`${typeLabelMap[k]||k}: ${v}`).join(', ');
  const label = (t[currentLang] && t[currentLang].historyTotalLabel) || t.de.historyTotalLabel;
  statsSummary.textContent=`${label}: ${filtered.length}${tparts?' • '+tparts:''}`;
  if (pageInfo) pageInfo.textContent = `${historyPaging.page} / ${totalPages}`;
  if (prevPageBtn) prevPageBtn.disabled = historyPaging.page<=1;
  if (nextPageBtn) nextPageBtn.disabled = historyPaging.page>=totalPages;
}
if (historyFilter) historyFilter.addEventListener('change', ()=>{ historyPaging.filter = historyFilter.value || ''; historyPaging.page = 1; renderHistory(); });
if (prevPageBtn) prevPageBtn.addEventListener('click', ()=>{ historyPaging.page--; renderHistory(); });
if (nextPageBtn) nextPageBtn.addEventListener('click', ()=>{ historyPaging.page++; renderHistory(); });

// ===== History preview and downloads =====
let selectedHistoryEntry = null; // last clicked history entry
let selectedHistoryTainted = false; // true if preview is drawn from cross-origin image
async function loadHistoryPreview(entry){
  try{
    selectedHistoryEntry = entry || null;
    selectedHistoryTainted = false;
    const src = (entry && entry.thumb) || '';
    if (!src) return;
    const w = entry && entry.size && entry.size.w || 0;
    const h = entry && entry.size && entry.size.h || 0;
    const isExternal = /^https?:\/\//i.test(src);
    // Draw; use contain to preserve full image by default
    await rRenderToCanvasFromURL(src, (w&&h)?{w,h}:undefined, 'contain');
    if (isExternal) selectedHistoryTainted = true;
  }catch(err){ console.warn('History preview failed:', err); }
}
function downloadPreviewAs(kind){
  try{
    const mime = kind==='jpg' ? 'image/jpeg' : 'image/png';
    const quality = kind==='jpg' ? (settings.jpgQ||92)/100 : undefined;
    const href = canvas.toDataURL(mime, quality);
    const a = document.createElement('a');
    const base = (selectedHistoryEntry && selectedHistoryEntry.name) ? selectedHistoryEntry.name.replace(/\.[^.]+$/, '') : 'preview';
    a.download = `${base}.${kind==='jpg'?'jpg':'png'}`;
    a.href = href; a.click();
  }catch(err){
    // Likely tainted canvas: fall back to downloading original source if available
    if (selectedHistoryEntry && /^https?:\/\//i.test(selectedHistoryEntry.thumb)){
      const a = document.createElement('a');
      a.download = selectedHistoryEntry.name || '';
      a.href = selectedHistoryEntry.thumb;
      try{ a.click(); }catch(_){ window.open(selectedHistoryEntry.thumb, '_blank'); }
    } else {
      console.warn('Preview download failed and no fallback source.', err);
    }
  }
}

// Capture thumbnail for history
function captureThumb(){ try{ return canvas.toDataURL('image/png'); }catch(_){ return ''; } }

// Export current canvas as PNG or JPG with settings
async function exportCanvasAs(kind, filename){
  try{
    const preset = parsePreset(settings.preset);
    // Ensure canvas size matches selected preset if any (for preview-based export)
    if (preset && (canvas.width !== preset.w || canvas.height !== preset.h)){
      const tmp = document.createElement('canvas');
      tmp.width = preset.w; tmp.height = preset.h;
      const tctx = tmp.getContext('2d');
      if (kind === 'jpg'){
        tctx.fillStyle = settings.jpgBg || '#ffffff';
        tctx.fillRect(0,0,tmp.width,tmp.height);
      } else {
        tctx.clearRect(0,0,tmp.width,tmp.height);
      }
      tctx.drawImage(canvas, 0, 0, tmp.width, tmp.height);
      const mime = kind === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = kind === 'jpg' ? (settings.jpgQ||92)/100 : undefined;
      const href = tmp.toDataURL(mime, quality);
      const a = document.createElement('a'); a.download = filename; a.href = href; a.click();
      // record in history
      recordExport({ name: filename, type: kind==='jpg'?'img->jpg':'img->png', size: { w: tmp.width, h: tmp.height }, thumb: (function(){ try{ return tmp.toDataURL('image/png'); }catch(_){ return ''; } })() });
      return;
    }
    // No resizing needed; export directly from existing canvas
    if (kind === 'jpg'){
      // Draw background if needed to avoid black transparency in JPEG
      const tmp = document.createElement('canvas');
      tmp.width = canvas.width; tmp.height = canvas.height;
      const tctx = tmp.getContext('2d');
      tctx.fillStyle = settings.jpgBg || '#ffffff';
      tctx.fillRect(0,0,tmp.width,tmp.height);
      tctx.drawImage(canvas, 0, 0);
      const href = tmp.toDataURL('image/jpeg', (settings.jpgQ||92)/100);
      const a = document.createElement('a'); a.download = filename; a.href = href; a.click();
      recordExport({ name: filename, type: 'img->jpg', size: { w: tmp.width, h: tmp.height }, thumb: (function(){ try{ return tmp.toDataURL('image/png'); }catch(_){ return ''; } })() });
    } else {
      const href = canvas.toDataURL('image/png');
      const a = document.createElement('a'); a.download = filename; a.href = href; a.click();
      recordExport({ name: filename, type: 'img->png', size: { w: canvas.width, h: canvas.height }, thumb: captureThumb() });
    }
  }catch(err){ console.warn('exportCanvasAs failed', err); }
}

async function applyPreviewQualityIfNeeded(){
  // Only simulate JPG compression in preview if a background color is applied
  if (!settings.previewBg) return;
  const q = (settings.jpgQ || 92) / 100;
  return new Promise((resolve)=>{
    try{
      const data = canvas.toDataURL('image/jpeg', q);
      const img = new Image();
      img.onload = ()=>{ ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(); };
      img.onerror = ()=> resolve();
      img.src = data;
    }catch(_){ resolve(); }
  });
}

// ===== SVG converter =====
const fileInput = document.getElementById('file');
const dropzone = document.getElementById('dropzone');
const statusEl = document.getElementById('status');
const fileListEl = document.getElementById('fileList');
const openPickerBtn = document.getElementById('openPicker');
const selectedInfo = document.getElementById('selectedInfo');
const clearBtn = document.getElementById('clearList');
const btnSingle = document.getElementById('download');
const btnSingle2x = document.getElementById('download2x');
const btnAll = document.getElementById('downloadAll');
const btnAll2x = document.getElementById('downloadAll2x');
let items = []; // {name: string, svg: string}
let currentIndex = -1;

function withStatus(msg){ if(statusEl) statusEl.textContent = msg; }
function ensureNamespace(svg){ return svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'); }
function sanitizeSVG(svgText){
  // Keep author-provided size; only ensure xmlns and strip risky externals
  let svg = ensureNamespace(svgText);
  svg = svg.replace(/xlink:href\s*=\s*"http(s)?:[^\"]*"/gi, '');
  return svg;
}
// Extract intrinsic SVG width/height if available; fall back to viewBox or 1280×720
function extractSvgSize(svgText){
  const s = String(svgText);
  const wM = s.match(/\bwidth\s*=\s*"(\d+(?:\.\d+)?)(?:px)?"/i);
  const hM = s.match(/\bheight\s*=\s*"(\d+(?:\.\d+)?)(?:px)?"/i);
  let w = wM ? parseFloat(wM[1]) : null;
  let h = hM ? parseFloat(hM[1]) : null;
  if ((w && h)) return { w: Math.round(w), h: Math.round(h) };
  const vb = s.match(/\bviewBox\s*=\s*"\s*[-+\d.]+\s+[-+\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/i);
  if (vb){
    const vw = parseFloat(vb[1]), vh = parseFloat(vb[2]);
    if (Number.isFinite(vw) && Number.isFinite(vh)) return { w: Math.round(vw), h: Math.round(vh) };
  }
  return { w: 1280, h: 720 };
}
async function renderToCanvas(svgText, scale=1){
  const svg = sanitizeSVG(svgText);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  await new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>{
      try{
        const preset = parsePreset(settings.preset);
        const base = extractSvgSize(svgText);
        const tW = (preset ? preset.w : base.w) * (scale || 1);
        const tH = (preset ? preset.h : base.h) * (scale || 1);
        canvas.width = Math.round(tW);
        canvas.height = Math.round(tH);
        if (settings.previewBg){ ctx.fillStyle = settings.jpgBg || '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        else { ctx.clearRect(0,0,canvas.width,canvas.height); }
        if (preset) drawFitted(img, canvas.width, canvas.height, settings.mode || 'contain');
        else ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Simulate JPG quality in preview if requested
        Promise.resolve(applyPreviewQualityIfNeeded()).then(()=>{ updateDimBadge(); resolve(); });
      } finally { URL.revokeObjectURL(url); }
    };
    img.onerror = (e)=>{ URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
function setButtonsEnabled(enabled){ [btnSingle, btnSingle2x, btnAll, btnAll2x, clearBtn].forEach(b=>{ if(b) b.disabled = !enabled; }); }
function refreshList(){
  if (!fileListEl) return;
  fileListEl.innerHTML = '';
  items.forEach((it, idx)=>{
    const li = document.createElement('li');
    li.className = 'file-item' + (idx===currentIndex ? ' active' : '');
    li.textContent = it.name;
    li.tabIndex = 0;
    li.addEventListener('click', ()=> selectIndex(idx));
    li.addEventListener('keydown', (e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); selectIndex(idx);} });
    fileListEl.appendChild(li);
  });
  if (selectedInfo) selectedInfo.textContent = items.length ? L('selectedCount', { n: items.length }) : L('noneSelected');
  setButtonsEnabled(items.length>0);
}
async function selectIndex(idx){
  if (idx<0 || idx>=items.length) return;
  currentIndex = idx;
  refreshList();
  try { await renderToCanvas(items[currentIndex].svg, 1); withStatus(L('selectedSVG', { name: items[currentIndex].name, index: currentIndex+1, total: items.length }));} catch(err){ console.error(err); withStatus(L('renderError')); }
}
function baseName(f){ return (f.name || 'thumbnail').replace(/\.[^.]+$/, ''); }
function ensureUniqueName(base, taken){ let name = base, i=2; while(taken.has(name)) name = `${base} (${i++})`; taken.add(name); return name; }
async function handleFiles(fileList){
  if (!fileList || !fileList.length) return;
  const files = Array.from(fileList).filter(f => /\.svg$/i.test(f.name) || f.type === 'image/svg+xml');
  if (!files.length){ withStatus(L('invalidSVGs')); return; }
  const texts = await Promise.all(files.map(f => f.text().catch(e => { console.warn('Fehler beim Lesen:', f.name, e); return null; })));
  const taken = new Set(items.map(i => i.name));
  const toAdd = [];
  for (let i=0;i<files.length;i++){
    const txt = texts[i];
    if (!txt) continue;
    const unique = ensureUniqueName(baseName(files[i]), taken);
    toAdd.push({ name: unique, svg: txt });
  }
  if (!toAdd.length){ withStatus(L('invalidSVGs')); return; }
  const wasEmpty = items.length === 0;
  items = items.concat(toAdd);
  withStatus(L('svgLoadedNTotal', { n: toAdd.length, total: items.length }));
  refreshList();
  if (wasEmpty) selectIndex(0);
}
if (fileInput) fileInput.addEventListener('change', e=>{
  const files = Array.from((e.target && e.target.files) ? e.target.files : []);
  // Clear first to allow re-selecting the same file, then process the snapshot array
  fileInput.value='';
  if (files.length) handleFiles(files);
});
if (openPickerBtn && !openPickerBtn.dataset.bound){ openPickerBtn.dataset.bound='1'; openPickerBtn.addEventListener('click', ()=> fileInput && fileInput.click()); }
if (dropzone){
  dropzone.addEventListener('dragenter', (e)=>{ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragover',  (e)=>{ e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', (e)=>{ e.preventDefault(); dropzone.classList.remove('dragover'); });
  dropzone.addEventListener('drop',      (e)=>{ e.preventDefault(); dropzone.classList.remove('dragover'); const dt = e.dataTransfer; if (dt && dt.files) handleFiles(dt.files); });
}
if (clearBtn) clearBtn.addEventListener('click', ()=>{ items = []; currentIndex = -1; ctx.clearRect(0,0,canvas.width,canvas.height); refreshList(); withStatus(L('listCleared')); });
setButtonsEnabled(false);
async function exportOne(item, scale, suffix=''){
  // SVG path respects preset + mode by first rendering 1280x720 (existing) then scaling if needed
  await renderToCanvas(item.svg, scale);
  const a = document.createElement('a');
  a.download = `${item.name}${suffix}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
  recordExport({ name: a.download, type: 'svg->png', size: { w: canvas.width, h: canvas.height }, thumb: captureThumb() });
  return a.download;
}
async function download(scale, suffix=''){
  if (!(items.length && currentIndex>=0)) { alert(L('alertPickSVG')); return; }
  try{
    TitleStatus.start(currentLang==='en'?'Exporting':'Exportiere');
    const name = await exportOne(items[currentIndex], scale, suffix);
    withStatus(L('exportOneDone', { name }));
  }catch(err){ console.error(err); withStatus(L('exportFailed')); }
  finally{ TitleStatus.stop(); }
}
async function downloadAll(scale, suffix=''){
  if (!items.length){ alert(L('alertLoadSVGs')); return; }
  TitleStatus.start(currentLang==='en'?'Exporting':'Exportiere');
  let success = 0; for (const it of items){ try{ await exportOne(it, scale, suffix); success++; } catch(err){ console.warn('Fehler beim Export:', it.name, err); } }
  withStatus(L('exportCompleted', { ok: success, total: items.length }));
  TitleStatus.stop();
}
const btn1 = document.getElementById('download'); if (btn1 && !btn1.dataset.bound){ btn1.dataset.bound='1'; btn1.addEventListener('click', ()=>download(1,'')); }
const btn2 = document.getElementById('download2x'); if (btn2 && !btn2.dataset.bound){ btn2.dataset.bound='1'; btn2.addEventListener('click', ()=>download(2,'@2x')); }
const btn3 = document.getElementById('downloadAll'); if (btn3 && !btn3.dataset.bound){ btn3.dataset.bound='1'; btn3.addEventListener('click', ()=>downloadAll(1,'')); }
const btn4 = document.getElementById('downloadAll2x'); if (btn4 && !btn4.dataset.bound){ btn4.dataset.bound='1'; btn4.addEventListener('click', ()=>downloadAll(2,'@2x')); }

// Delegated click fallback: ensures buttons work even if direct handlers didn't attach
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if (!btn) return;
  // Skip if the button already has a dedicated handler
  if (btn.dataset && btn.dataset.bound === '1') return;
  if (btn.disabled) return;
  // Handle kebab menu item actions
  if (btn.classList.contains('menu-item')){
    const action = btn.getAttribute('data-action');
    switch(action){
      case 'download': e.preventDefault(); download(1,''); break;
      case 'download2x': e.preventDefault(); download(2,'@2x'); break;
      case 'downloadAll': e.preventDefault(); downloadAll(1,''); break;
      case 'downloadAll2x': e.preventDefault(); downloadAll(2,'@2x'); break;
      case 'clearList': e.preventDefault(); if (clearBtn && !clearBtn.disabled) clearBtn.click(); break;
      case 'rDownloadPNG': e.preventDefault(); rDownloadSingle('png'); break;
      case 'rDownloadJPG': e.preventDefault(); rDownloadSingle('jpg'); break;
      case 'rDownloadAllPNG': e.preventDefault(); rDownloadAll('png'); break;
      case 'rDownloadAllJPG': e.preventDefault(); rDownloadAll('jpg'); break;
      case 'rClearList': e.preventDefault(); if (rClearBtn && !rClearBtn.disabled) rClearBtn.click(); break;
      default: break;
    }
    // Close any open kebab menu after action
    document.querySelectorAll('.kebab-menu.open').forEach(m=> m.classList.remove('open'));
    document.querySelectorAll('.kebab-toggle[aria-expanded="true"]').forEach(t=> t.setAttribute('aria-expanded','false'));
    return;
  }
  switch(btn.id){
    case 'openPicker': e.preventDefault(); if (fileInput) fileInput.click(); break;
    case 'openRPicker': e.preventDefault(); if (rFileInput) rFileInput.click(); break;
    case 'download': e.preventDefault(); download(1,''); break;
    case 'download2x': e.preventDefault(); download(2,'@2x'); break;
    case 'downloadAll': e.preventDefault(); downloadAll(1,''); break;
    case 'downloadAll2x': e.preventDefault(); downloadAll(2,'@2x'); break;
    case 'clearList': e.preventDefault(); if (clearBtn && !clearBtn.disabled) clearBtn.click(); break;
    case 'rDownloadPNG': e.preventDefault(); rDownloadSingle('png'); break;
    case 'rDownloadJPG': e.preventDefault(); rDownloadSingle('jpg'); break;
    case 'rDownloadAllPNG': e.preventDefault(); rDownloadAll('png'); break;
    case 'rDownloadAllJPG': e.preventDefault(); rDownloadAll('jpg'); break;
    case 'loadFromUrl': e.preventDefault(); loadImageFromUrlToList(); break;
    case 'rClearList': e.preventDefault(); if (rClearBtn && !rClearBtn.disabled) rClearBtn.click(); break;
    case 'ytFetch': e.preventDefault(); ytFetch(); break;
    default: break;
  }
});

// Surface unexpected errors in the UI so issues don't silently disable the app
window.addEventListener('error', (ev)=>{
  const msg = L('errorPrefix', { message: ev.message || (ev.error && ev.error.message) || 'Unknown' });
  if (statusEl) statusEl.textContent = msg; if (rStatusEl) rStatusEl.textContent = msg;
});
window.addEventListener('unhandledrejection', (ev)=>{
  const msg = L('errorPrefix', { message: (ev.reason && ev.reason.message) || ev.reason || 'Unhandled rejection' });
  if (statusEl) statusEl.textContent = msg; if (rStatusEl) rStatusEl.textContent = msg;
});

// ===== Raster converter =====
const rFileInput = document.getElementById('rFile');
const rDropzone = document.getElementById('rDropzone');
const openRPickerBtn = document.getElementById('openRPicker');
const rSelectedInfo = document.getElementById('rSelectedInfo');
const rFileListEl = document.getElementById('rFileList');
const rStatusEl = document.getElementById('rStatus');
const rClearBtn = document.getElementById('rClearList');
const rBtnSinglePNG = document.getElementById('rDownloadPNG');
const rBtnSingleJPG = document.getElementById('rDownloadJPG');
const rBtnAllPNG = document.getElementById('rDownloadAllPNG');
const rBtnAllJPG = document.getElementById('rDownloadAllJPG');
const urlInput = document.getElementById('urlInput');
const loadFromUrlBtn = document.getElementById('loadFromUrl');
let rItems = []; // {name: string, url: string, type: string, revoke?: boolean}
let rIndex = -1;
let hasPreview = false;
let lastPreviewName = '';
function setRButtonsEnabled(enabled){ [rBtnSinglePNG, rBtnSingleJPG, rBtnAllPNG, rBtnAllJPG, rClearBtn].forEach(b=>{ if(b) b.disabled = !enabled; }); }
function rWithStatus(msg){ if(rStatusEl) rStatusEl.textContent = msg; }
function rBaseName(name){ return (name || 'image').replace(/\.[^.]+$/, ''); }
function rEnsureUnique(base, taken){ let n = base, i=2; while(taken.has(n)) n = `${base} (${i++})`; taken.add(n); return n; }
function refreshRList(){
  if (!rFileListEl) return;
  rFileListEl.innerHTML = '';
  rItems.forEach((it, idx)=>{
    const li = document.createElement('li');
    li.className = 'file-item' + (idx===rIndex ? ' active' : '');
    li.textContent = it.name;
    li.tabIndex = 0;
    li.addEventListener('click', ()=> rSelect(idx));
    li.addEventListener('keydown', e=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); rSelect(idx);} });
    rFileListEl.appendChild(li);
  });
  if (rSelectedInfo) rSelectedInfo.textContent = rItems.length ? L('selectedCount', { n: rItems.length }) : L('noneSelected');
  setRButtonsEnabled(rItems.length>0);
}
async function rRenderToCanvasFromURL(url, forceSize, forceMode){
  await new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>{
      try{
        const preset = forceSize ? null : parsePreset(settings.preset);
        const tW = forceSize ? forceSize.w : (preset ? preset.w : (img.naturalWidth || img.width));
        const tH = forceSize ? forceSize.h : (preset ? preset.h : (img.naturalHeight || img.height));
        canvas.width = tW; canvas.height = tH;
        if (settings.previewBg){ ctx.fillStyle = settings.jpgBg || '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
        else { ctx.clearRect(0,0,canvas.width,canvas.height); }
        if (preset || forceSize) drawFitted(img, tW, tH, forceMode || settings.mode || 'contain');
        else ctx.drawImage(img, 0, 0);

        Promise.resolve(applyPreviewQualityIfNeeded()).then(()=>{ updateDimBadge(); hasPreview = true; resolve(); });
      } finally { /* Do not revoke here; URLs are reused for export. Revoke on clear instead. */ }
    };
    img.onerror = reject; img.src = url;
  });
}

function rerenderPreview(){
  // Prefer SVG selection; else raster
  if (currentIndex >= 0 && items.length){
    renderToCanvas(items[currentIndex].svg, 1).catch(e=>console.warn('Preview render failed (SVG):', e));
  } else if (rIndex >=0 && rItems.length){
    rRenderToCanvasFromURL(rItems[rIndex].url).catch(e=>console.warn('Preview render failed (Raster):', e));
  } else {
    // Reflect preset immediately even without a loaded image
    const preset = parsePreset(settings.preset);
    if (preset){
      canvas.width = preset.w; canvas.height = preset.h;
      if (settings.previewBg){ ctx.fillStyle = settings.jpgBg || '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height); }
      else { ctx.clearRect(0,0,canvas.width,canvas.height); }
      updateDimBadge();
    }
  }
}
async function rSelect(idx){
  if (idx<0 || idx>=rItems.length) return;
  rIndex = idx; refreshRList();
  try{ const it = rItems[rIndex]; await rRenderToCanvasFromURL(it.url); rWithStatus(L('selectedRaster', { name: it.name, index: rIndex+1, total: rItems.length })); }
  catch(err){ console.error(err); rWithStatus(L('renderError')); }
}
async function rHandleFiles(fileList){
  if (!fileList || !fileList.length) return;
  const files = Array.from(fileList).filter(f => /\.(png|jpg|jpeg)$/i.test(f.name) || /image\/(png|jpeg)/.test(f.type));
  if (!files.length){ rWithStatus(L('invalidImages')); return; }
  const taken = new Set(rItems.map(i=>i.name));
  const toAdd = [];
  for (const f of files){
    try{ const url = URL.createObjectURL(f); const name = rEnsureUnique(rBaseName(f.name), taken); toAdd.push({ name, url, type: f.type || '', revoke: true }); }
    catch(e){ console.warn('Fehler beim Erstellen der URL:', f.name, e); }
  }
  if (!toAdd.length){ rWithStatus(L('invalidImages')); return; }
  const empty = rItems.length===0; rItems = rItems.concat(toAdd);
  rWithStatus(L('rLoadedNTotal', { n: toAdd.length, total: rItems.length }));
  refreshRList(); if (empty) rSelect(0);
}
async function rExportOne(item, target){
  await new Promise((resolve, reject)=>{
    const img = new Image();
    img.onload = ()=>{
      try{
        const preset = parsePreset(settings.preset);
        const tW = preset ? preset.w : (img.naturalWidth || img.width);
        const tH = preset ? preset.h : (img.naturalHeight || img.height);
        canvas.width = tW; canvas.height = tH;
        if (target === 'jpg'){
          ctx.fillStyle = settings.jpgBg || '#ffffff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
        } else {
          ctx.clearRect(0,0,canvas.width,canvas.height);
        }
        if (preset) drawFitted(img, tW, tH, settings.mode || 'contain');
        else ctx.drawImage(img, 0, 0);
        const mime = target === 'jpg' ? 'image/jpeg' : 'image/png';
        const quality = target === 'jpg' ? (settings.jpgQ||92)/100 : undefined;
        const href = canvas.toDataURL(mime, quality);
  const a = document.createElement('a'); a.download = `${item.name}.${target === 'jpg' ? 'jpg' : 'png'}`; a.href = href; a.click();
  recordExport({ name: a.download, type: target==='jpg'?'img->jpg':'img->png', size: { w: canvas.width, h: canvas.height }, thumb: captureThumb() });
        resolve();
      }catch(e){ reject(e); }
    };
    img.onerror = reject; img.src = item.url;
  });
}
async function rDownloadSingle(target){
  if (!(rItems.length && rIndex>=0)) {
    // Fallback: export from current preview if available
    if (!hasPreview){ alert(L('alertPickImage')); return; }
    const name = (lastPreviewName || 'preview') + (target==='jpg'?'.jpg':'.png');
    await exportCanvasAs(target, name);
    rWithStatus(L('exportOneDone', { name }));
    return;
  }
  try{ await rExportOne(rItems[rIndex], target); rWithStatus(L('exportOneDone', { name: `${rItems[rIndex].name}.${target==='jpg'?'jpg':'png'}` })); }
  catch(err){ console.error(err); rWithStatus(L('exportFailed')); }
}
async function rDownloadAll(target){
  if (!rItems.length){
    // If no list, but there is a preview, export just the preview
    if (hasPreview){
      const name = (lastPreviewName || 'preview') + (target==='jpg'?'.jpg':'.png');
      await exportCanvasAs(target, name);
      rWithStatus(L('exportCompleted', { ok: 1, total: 1 }));
    } else {
      alert(L('alertLoadImages')); 
    }
    return;
  }
  let ok = 0; for (const it of rItems){ try{ await rExportOne(it, target); ok++; }catch(e){ console.warn('Fehler beim Export:', it.name, e); } }
  rWithStatus(L('exportCompleted', { ok, total: rItems.length }));
}
async function loadImageFromUrlToList(){
  const url = (urlInput && urlInput.value || '').trim();
  if (!url){ rWithStatus(L('urlPrompt')); return; }
  try{
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const objUrl = URL.createObjectURL(blob);
    const base = rBaseName(url.split('?')[0].split('#')[0].split('/').pop() || 'url-image');
    lastPreviewName = base; hasPreview = false;
    await rRenderToCanvasFromURL(objUrl);
    hasPreview = true;
    rWithStatus(L('urlLoaded', { name: base }));
  }catch(err){ console.error(err); rWithStatus(L('urlLoadFailed')); }
}
if (rFileInput) rFileInput.addEventListener('change', e=>{
  const files = Array.from((e.target && e.target.files) ? e.target.files : []);
  rFileInput.value='';
  if (files.length) rHandleFiles(files);
});
if (openRPickerBtn && !openRPickerBtn.dataset.bound){ openRPickerBtn.dataset.bound='1'; openRPickerBtn.addEventListener('click', ()=> rFileInput && rFileInput.click()); }
if (rDropzone){
  rDropzone.addEventListener('dragenter', (e)=>{ e.preventDefault(); rDropzone.classList.add('dragover'); });
  rDropzone.addEventListener('dragover',  (e)=>{ e.preventDefault(); rDropzone.classList.add('dragover'); });
  rDropzone.addEventListener('dragleave', (e)=>{ e.preventDefault(); rDropzone.classList.remove('dragover'); });
  rDropzone.addEventListener('drop',      async (e)=>{
    e.preventDefault(); rDropzone.classList.remove('dragover'); const dt = e.dataTransfer; 
    if (dt && dt.files && dt.files.length){
      const f = dt.files[0];
      if (/(png|jpg|jpeg)$/i.test(f.name) || /image\/(png|jpeg)/.test(f.type)){
        try{
          const url = URL.createObjectURL(f);
          lastPreviewName = rBaseName(f.name);
          hasPreview = false; await rRenderToCanvasFromURL(url); hasPreview = true;
          rWithStatus(L('rLoadedNTotal', { n: 1, total: rItems.length }));
        }catch(err){ console.error('Preview drop failed:', err); }
        return;
      }
    }
  });
}
if (rClearBtn) rClearBtn.addEventListener('click', ()=>{
  for (const it of rItems){ if (it.revoke) { try{ URL.revokeObjectURL(it.url); }catch(_){} } }
  rItems = []; rIndex = -1; hasPreview = false; lastPreviewName='';
  ctx.clearRect(0,0,canvas.width,canvas.height); refreshRList(); rWithStatus(L('listCleared'));
});
if (loadFromUrlBtn) loadFromUrlBtn.addEventListener('click', loadImageFromUrlToList);
if (rBtnSinglePNG) rBtnSinglePNG.addEventListener('click', ()=> rDownloadSingle('png'));
if (rBtnSingleJPG) rBtnSingleJPG.addEventListener('click', ()=> rDownloadSingle('jpg'));
if (rBtnAllPNG) rBtnAllPNG.addEventListener('click', ()=> rDownloadAll('png'));
if (rBtnAllJPG) rBtnAllJPG.addEventListener('click', ()=> rDownloadAll('jpg'));
setRButtonsEnabled(false);

// ===== YouTube thumbnails =====
const ytUrlInput = document.getElementById('ytUrl');
const ytFetchBtn = document.getElementById('ytFetch');
const ytListEl = document.getElementById('ytList');
const ytStatusEl = document.getElementById('ytStatus');
const YT_RES = ['maxresdefault','sddefault','hqdefault','mqdefault','default'];
const YT_SIZE = { maxresdefault:[1280,720], sddefault:[640,480], hqdefault:[480,360], mqdefault:[320,180], default:[120,90] };
function ytDirectUrl(vid, key){ return `https://img.youtube.com/vi/${encodeURIComponent(vid)}/${key}.jpg`; }
function ytProxyUrl(vid, key){ return `/yt-thumb?vid=${encodeURIComponent(vid)}&res=${key}`; }

function ytWithStatus(msg){ if (ytStatusEl) ytStatusEl.textContent = msg; }
function parseYouTubeId(raw){
  try{
    const url = new URL(raw);
    // youtu.be/VIDEOID
    if (/^youtu\.be$/i.test(url.hostname)){
      const id = url.pathname.slice(1).split('/')[0];
      return /^[A-Za-z0-9_-]{6,20}$/.test(id) ? id : null;
    }
    // youtube.com watch?v=VIDEOID
    if (/youtube\.(com|no|de|co\.uk|fr|nl|be|it|es|pl|pt|com\.br)$/i.test(url.hostname)){
      const id = url.searchParams.get('v');
      if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) return id;
      // shorts or embed
      const path = url.pathname || '';
      const m = path.match(/\/shorts\/([A-Za-z0-9_-]{6,20})|\/embed\/([A-Za-z0-9_-]{6,20})/);
      if (m){ return m[1] || m[2] || null; }
    }
  }catch(_){}
  // raw id fallback
  const s = String(raw||'').trim();
  if (/^[A-Za-z0-9_-]{6,20}$/.test(s)) return s;
  return null;
}

function ytBuildItem(vid){
  const li = document.createElement('li'); li.className='file-item';
  const row = document.createElement('div'); row.className='export-row';
  const thumb = document.createElement('img'); thumb.className='thumb'; thumb.alt='thumb'; thumb.loading='lazy';
  // default preview uses direct hqdefault (works without server)
  thumb.src = ytDirectUrl(vid, 'hqdefault');
  row.appendChild(thumb);
  const meta = document.createElement('div');
  meta.innerHTML = `Video: ${vid} — Thumbnails: ${YT_RES.join(', ')}`;
  row.appendChild(meta);
  const actions = document.createElement('div'); actions.style.marginLeft='auto'; actions.style.display='flex'; actions.style.gap='6px';
  // preview to main canvas action
  const prevBtn = document.createElement('button'); prevBtn.className='btn ghost'; prevBtn.textContent='Vorschau';
  prevBtn.addEventListener('click', async ()=>{
    try{
      // Prefer maxres; fall back to hqdefault. Use cover to fill 1280×720 without Balken.
      try{ await rRenderToCanvasFromURL(ytDirectUrl(vid,'maxresdefault'), { w:1280, h:720 }, 'cover'); }
      catch(_){ await rRenderToCanvasFromURL(ytDirectUrl(vid,'hqdefault'), { w:1280, h:720 }, 'cover'); }
      ytWithStatus(L('ytPreviewLoaded'));
    }catch(e){ ytWithStatus(L('ytPreviewFailed')); }
  });
  actions.appendChild(prevBtn);
  // download all resolutions
  const dlBtn = document.createElement('button'); dlBtn.className='btn'; dlBtn.textContent='Alle herunterladen';
  dlBtn.addEventListener('click', ()=> ytDownloadAllFor(vid));
  actions.appendChild(dlBtn);
  row.appendChild(actions);
  li.appendChild(row);
  return li;
}

async function ytFetch(){
  const raw = (ytUrlInput && ytUrlInput.value || '').trim();
  const vid = parseYouTubeId(raw);
  if (!vid){ ytWithStatus(L('ytInvalid')); return; }
  if (ytListEl){ ytListEl.innerHTML=''; ytListEl.appendChild(ytBuildItem(vid)); }
  ytWithStatus(L('ytLoaded'));
}

function downloadDataUrl(name, href){ const a=document.createElement('a'); a.download=name; a.href=href; a.click(); }
async function ytFetchBlob(url){ const r=await fetch(url); if(!r.ok) throw new Error('HTTP '+r.status); return await r.blob(); }
async function ytDownloadAll(){
  const raw = (ytUrlInput && ytUrlInput.value || '').trim();
  const vid = parseYouTubeId(raw); if (!vid){ ytWithStatus(L('ytInvalid')); return; }
  try{ TitleStatus.start(currentLang==='en'?'Downloading':'Lade herunter'); await ytDownloadAllFor(vid); }
  finally{ TitleStatus.stop(); }
}
async function ytDownloadAllFor(vid){
  try{
    ytWithStatus(L('ytDownloading'));
    let ok=0; let usedProxy=false, opened=0;
    for (const key of YT_RES){
      const prox = ytProxyUrl(vid, key);
      const direct = ytDirectUrl(vid, key);
      let done=false;
      // Try proxy first (if server exists)
      try{
        const blob = await ytFetchBlob(prox);
        usedProxy = true;
        const href = URL.createObjectURL(blob);
        downloadDataUrl(`${vid}_${key}.jpg`, href);
        try{ URL.revokeObjectURL(href); }catch(_){ }
        done = true; ok++;
      }catch(_){ /* proxy not available or image missing */ }
      if (!done){
        // Fallback: open direct URL (user can save manually); multiple opens may be blocked
        try{ window.open(direct, '_blank'); opened++; ok++; }catch(_){ }
      }
      // Record history entry with external thumb and known size (best effort)
      const sz = YT_SIZE[key] || [0,0];
      recordExport({ name: `${vid}_${key}.jpg`, type: 'img->jpg', size: { w: sz[0], h: sz[1] }, thumb: direct });
    }
    ytWithStatus(usedProxy ? L('ytDoneDownloaded', { ok, total: YT_RES.length }) : L('ytDoneOpened', { ok, total: YT_RES.length }));
  }catch(err){ ytWithStatus(L('ytDownloadFailed')); }
}
if (ytFetchBtn) ytFetchBtn.addEventListener('click', ytFetch);

// Settings handlers
function hookSettings(){
  if (optChecker) optChecker.addEventListener('change', ()=>{ settings.checker = !!optChecker.checked; applyChecker(); saveSettings(); });
  if (optPreset) optPreset.addEventListener('change', ()=>{ settings.preset = optPreset.value; saveSettings(); rerenderPreview(); });
  if (optMode) optMode.addEventListener('change', ()=>{ settings.mode = optMode.value; saveSettings(); rerenderPreview(); });
  if (optJpgBg){
    optJpgBg.addEventListener('input', ()=>{ settings.jpgBg = optJpgBg.value; saveSettings(); if (settings.previewBg) rerenderPreview(); });
    optJpgBg.addEventListener('change', ()=>{ settings.jpgBg = optJpgBg.value; saveSettings(); if (settings.previewBg) rerenderPreview(); });
  }
  if (optJpgQ) optJpgQ.addEventListener('input', ()=>{ settings.jpgQ = parseInt(optJpgQ.value,10) || 92; saveSettings(); });
  if (optWorker) optWorker.addEventListener('change', ()=>{ settings.worker = !!optWorker.checked; saveSettings(); });
  if (optPreset) optPreset.addEventListener('change', ()=>{ rerenderPreview(); });
  if (optPreviewBg) optPreviewBg.addEventListener('change', ()=>{ settings.previewBg = !!optPreviewBg.checked; saveSettings(); rerenderPreview(); });
  if (optJpgQ) optJpgQ.addEventListener('input', ()=>{ settings.jpgQ = parseInt(optJpgQ.value,10) || 92; saveSettings(); rerenderPreview(); });
}

// Bootstrap after DOM is fully parsed to guarantee all elements exist
if (document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    initLang();
    hookSettings();
    rerenderPreview();
      renderHistory();
    // Close language dropdown when clicking outside or pressing Escape
    document.addEventListener('pointerdown', (ev)=>{
      if (langDropdown && langDropdown.open && !langDropdown.contains(ev.target)){
        langDropdown.open = false;
      }
    });
    document.addEventListener('keydown', (ev)=>{
      if (ev.key === 'Escape' && langDropdown && langDropdown.open){ langDropdown.open = false; }
    });
  });
} else {
  loadSettings();
  initLang();
  hookSettings();
  rerenderPreview();
    renderHistory();
  document.addEventListener('pointerdown', (ev)=>{
    if (langDropdown && langDropdown.open && !langDropdown.contains(ev.target)){
      langDropdown.open = false;
    }
  });
  document.addEventListener('keydown', (ev)=>{
    if (ev.key === 'Escape' && langDropdown && langDropdown.open){ langDropdown.open = false; }
    if (ev.key === 'Escape'){
      document.querySelectorAll('.kebab-menu.open').forEach(m=> m.classList.remove('open'));
      document.querySelectorAll('.kebab-toggle[aria-expanded="true"]').forEach(t=> t.setAttribute('aria-expanded','false'));
    }
  });

// Kebab menu toggles and outside-click close
document.addEventListener('click', (ev)=>{
  const toggle = ev.target.closest('.kebab-toggle');
  const anyMenu = ev.target.closest('.kebab-menu');
  // Close if clicked outside any toggle/menu
  if (!toggle && !anyMenu){
    document.querySelectorAll('.kebab-menu.open').forEach(m=> m.classList.remove('open'));
    document.querySelectorAll('.kebab-toggle[aria-expanded="true"]').forEach(t=> t.setAttribute('aria-expanded','false'));
    return;
  }
  if (toggle){
    const id = toggle.getAttribute('data-menu');
    const menu = document.getElementById(id);
    const isOpen = menu && menu.classList.contains('open');
    // Close others
    document.querySelectorAll('.kebab-menu.open').forEach(m=> m.classList.remove('open'));
    document.querySelectorAll('.kebab-toggle[aria-expanded="true"]').forEach(t=> t.setAttribute('aria-expanded','false'));
    if (menu){
      menu.classList.toggle('open', !isOpen);
      toggle.setAttribute('aria-expanded', String(!isOpen));
    }
  }
});
}
