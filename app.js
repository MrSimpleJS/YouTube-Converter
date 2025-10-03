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
const signInBtn = document.getElementById('signInBtn');
const helpBtn = document.getElementById('helpBtn');

// ----- Users (client-only) -----
const userDropdown = document.getElementById('userDropdown');
const userCurrent = document.getElementById('userCurrent');
const userMenu = document.getElementById('userMenu');
const ADMIN_LS_USERS = 'converter.users.v1';
const ADMIN_LS_AUDIT = 'converter.audit.v1';
const AUTH_LS_CREDS = 'converter.auth.v1';
const AUTH_LS_SESSION = 'converter.session.v1';
let users = [];
let currentUser = { id: '', name: 'Guest', role: 'user' };
const adminPanel = document.getElementById('adminPanel');

function updateAdminVisibility(){
  if (!adminPanel) return;
  adminPanel.style.display = (currentUser && currentUser.role === 'admin') ? '' : 'none';
}
const DEFAULT_USERS = [];
function loadUsers(){
  try{
    const raw = localStorage.getItem(ADMIN_LS_USERS);
    const parsed = raw ? JSON.parse(raw) : [];
    // Ensure every user has a role; default to 'user' for legacy entries
    let arr = Array.isArray(parsed) ? parsed.map(u => ({ ...u, role: u.role || 'user' })) : [];
    // Remove old default/demo users: Guest, Alice, Bob (case-insensitive)
    const beforeLen = arr.length;
    arr = arr.filter(u => {
      const name = String(u.name || u.id || '').toLowerCase();
      return name !== 'guest' && name !== 'alice' && name !== 'bob';
    });
    users = arr;
    if (beforeLen !== users.length){ saveUsers(); }
  }catch(_){ users = []; }
  try{
    const last = localStorage.getItem(ADMIN_LS_USERS+':current');
    if (last){ const parsed = JSON.parse(last); const match = users.find(u=>u.id===parsed.id); if (match) currentUser = match; }
  }catch(_){ }
}
function saveUsers(){ try{ localStorage.setItem(ADMIN_LS_USERS, JSON.stringify(users)); }catch(_){ } }
function setCurrentUser(u){
  currentUser = u || { id:'', name:'Guest', role:'user' };
  if (userCurrent) userCurrent.textContent = currentUser.name;
  try{ localStorage.setItem(ADMIN_LS_USERS+':current', JSON.stringify(currentUser)); }catch(_){ }
  updateAdminVisibility();
}
function populateUserMenu(){
  if (!userMenu) return;
  userMenu.innerHTML='';
  users.forEach(u=>{
    // Hide any Guest entry from menu, keep it only as a temporary state after logout
    const uname = String(u.name || u.id || '');
    if (!uname || uname.toLowerCase() === 'guest') return;
    const li=document.createElement('li');
    // Switch user button
    const b=document.createElement('button');
    b.type='button';
    b.textContent = u.name + (u.role === 'admin' ? ' ⭐' : '');
    b.addEventListener('click', ()=>{ setCurrentUser(u); if (userDropdown) userDropdown.open=false; logEvent('user.switch', { to: u.id }); renderAudit(); });
    li.appendChild(b);
    // Admin role toggle (only visible to admins)
    if (currentUser && currentUser.role === 'admin'){
      const toggle=document.createElement('button');
      toggle.type='button'; toggle.className='btn ghost'; toggle.style.marginLeft='6px';
      const isAdmin = u.role === 'admin';
      toggle.textContent = isAdmin ? 'Admin entfernen' : 'Als Admin markieren';
      toggle.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        if (isAdmin){
          if (countAdmins() <= 1){ alert('Mindestens ein Admin muss bleiben.'); return; }
          u.role = 'user'; logEvent('admin.demote', { user: u.id, by: currentUser.id });
        } else {
          u.role = 'admin'; logEvent('admin.promote', { user: u.id, by: currentUser.id });
        }
        saveUsers();
        updateAdminVisibility();
        populateUserMenu();
        renderAudit();
      });
      li.appendChild(toggle);
    }
    userMenu.appendChild(li);
  });
  // Logout option
  const li=document.createElement('li');
  const out=document.createElement('button'); out.type='button'; out.textContent = (t[currentLang]?.logout || 'Logout');
  out.addEventListener('click', ()=>{ if (userDropdown) userDropdown.open=false; logout(); });
  li.appendChild(out); userMenu.appendChild(li);
}
function ensureUsers(){ if (!Array.isArray(users)){ users = []; } }
function countAdmins(){ return users.filter(u=>u.role === 'admin').length; }

// No auto-promotion; admins can promote others via user menu

// ----- Auth (client-only, hashed with PBKDF2) -----
const authOverlay = document.getElementById('authOverlay');
const authTitle = document.getElementById('authTitle');
const authName = document.getElementById('authName');
const authPassword = document.getElementById('authPassword');
const authConfirmWrap = document.getElementById('authConfirmWrap');
const authConfirm = document.getElementById('authConfirm');
const authStatus = document.getElementById('authStatus');
const authSubmit = document.getElementById('authSubmit');
const authToggleMode = document.getElementById('authToggleMode');
let authMode = 'login'; // 'login' | 'register'
const AUTH_LAST_USER = 'converter.auth.lastUser';
let passVisible = false;
const authRemember = document.getElementById('authRemember');
const authRememberLabel = document.getElementById('authRememberLabel');
const authForgotBtn = document.getElementById('authForgot');
const authSecWrap = document.getElementById('authSecWrap');
const authSecQ = document.getElementById('authSecQ');
const authSecQLabel = document.getElementById('authSecQLabel');
const authSecAnsWrap = document.getElementById('authSecAnsWrap');
const authSecA = document.getElementById('authSecA');
const authSecALabel = document.getElementById('authSecALabel');

// Remember-me & session lifetime
const AUTH_LS_ATTEMPTS = 'converter.auth.attempts.v1';
const SESSION_TTL_SHORT = 1000*60*60*4; // 4 hours
const SESSION_TTL_LONG = 1000*60*60*24*14; // 14 days

// ---- Auth gating helpers ----
// No global gating: app is usable without login. Admin-only areas are still role-gated separately.

function getCreds(){ try{ const raw=localStorage.getItem(AUTH_LS_CREDS); return raw?JSON.parse(raw):{}; }catch(_){ return {}; } }
function saveCreds(obj){ try{ localStorage.setItem(AUTH_LS_CREDS, JSON.stringify(obj)); }catch(_){ } }
function getSession(){
  try{
    const raw=localStorage.getItem(AUTH_LS_SESSION); if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || !session.user) return null;
    if (session.exp && Date.now() > session.exp){ clearSession(); return null; }
    return session;
  }catch(_){ return null; }
}
function saveSession(s){ try{ localStorage.setItem(AUTH_LS_SESSION, JSON.stringify(s)); }catch(_){ } }
function clearSession(){ try{ localStorage.removeItem(AUTH_LS_SESSION); }catch(_){ } }

async function pbkdf2(password, salt){
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits','deriveKey']);
  // 150k iterations, SHA-256, 32-byte key
  const key = await crypto.subtle.deriveKey({ name:'PBKDF2', salt: enc.encode(salt), iterations:150000, hash:'SHA-256' }, keyMaterial, { name:'AES-GCM', length:256 }, true, ['encrypt','decrypt']);
  const raw = await crypto.subtle.exportKey('raw', key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}
function randomSalt(len=16){ const a=new Uint8Array(len); crypto.getRandomValues(a); return btoa(String.fromCharCode(...a)); }

function showAuth(mode){
  authMode = mode || 'login';
  if (!authOverlay) return;
  authTitle.textContent = authMode==='login' ? (t[currentLang]?.authTitleLogin || 'Anmelden') : (t[currentLang]?.authTitleReg || 'Registrieren');
  authSubmit.textContent = authMode==='login' ? (t[currentLang]?.authBtnLogin || 'Anmelden') : (t[currentLang]?.authBtnCreate || 'Konto erstellen');
  authToggleMode.textContent = authMode==='login' ? (t[currentLang]?.authToggleToReg || 'Neu registrieren') : (t[currentLang]?.authToggleToLogin || 'Schon Konto? Anmelden');
  authConfirmWrap.style.display = authMode==='register' ? '' : 'none';
  authStatus.textContent = '';
  authName.value = '';
  authPassword.value = '';
  if (authConfirm) authConfirm.value='';
  authOverlay.hidden = false;
  // Prefill last user
  try{ const last = localStorage.getItem(AUTH_LAST_USER); if (last) authName.value = last; }catch(_){ }
  // Focus the first empty field
  setTimeout(()=>{ (authName.value ? authPassword : authName)?.focus(); }, 0);
}
function hideAuth(){ if (authOverlay) authOverlay.hidden = true; }

async function doRegister(name, pass){
  const creds = getCreds();
  const uname = String(name||'').trim(); if (!uname) throw new Error('Name erforderlich');
  if (creds[uname]) throw new Error('Benutzer existiert bereits');
  const salt = randomSalt(); const hash = await pbkdf2(pass, salt);
  const secQ = String(authSecQ?.value||'').trim();
  const secA = String(authSecA?.value||'').trim();
  creds[uname] = { salt, hash, secQ, secA }; // store plaintext Q/A client-side (no server); A is not hashed to allow simple recovery
  saveCreds(creds);
}
async function doLogin(name, pass){
  // Throttle: deny if cooldown active
  if (!canAttempt(name)) throw new Error(cooldownMessage(name));
  const creds = getCreds(); const uname = String(name||'').trim();
  if (!creds[uname]) throw new Error('Unbekannter Benutzer');
  const { salt, hash } = creds[uname];
  const calc = await pbkdf2(pass, salt);
  if (calc !== hash) throw new Error('Falsches Passwort');
  resetAttempts(uname);
  const ttl = (authRemember && authRemember.checked) ? SESSION_TTL_LONG : SESSION_TTL_SHORT;
  saveSession({ user: uname, ts: Date.now(), exp: Date.now() + ttl, remember: !!(authRemember && authRemember.checked) });
}
function requireSession(){ const s=getSession(); return !!(s && s.user); }
function logout(){
  clearSession();
  logEvent('auth.logout', { user: currentUser?.id });
  setCurrentUser({ id:'', name:'Guest', role:'user' });
  // Do not auto-open the login modal after logout; close if open
  if (authOverlay && !authOverlay.hidden) hideAuth();
}

if (authToggleMode){ authToggleMode.addEventListener('click', ()=>{ showAuth(authMode==='login'?'register':'login'); }); }
if (authSubmit){ authSubmit.addEventListener('click', async ()=>{
  try{
    authSubmit.disabled = true; authSubmit.dataset.loading = '1';
    const uname = authName.value; const pass = authPassword.value; if (!uname || !pass){ authStatus.textContent = t[currentLang]?.authMissing || 'Bitte Name und Passwort eingeben.'; return; }
    if (authMode==='register'){
      if (!authConfirm.value || authConfirm.value !== pass){ authStatus.textContent = t[currentLang]?.authConfirmMismatch || 'Passwörter stimmen nicht überein.'; return; }
      if (authSecWrap && authSecAnsWrap){
        if (!authSecQ.value || !authSecA.value){ authStatus.textContent = t[currentLang]?.authSecMissing || 'Bitte Sicherheitsfrage und Antwort angeben.'; return; }
      }
      await doRegister(uname, pass); await doLogin(uname, pass);
    } else {
      await doLogin(uname, pass);
    }
    try{ localStorage.setItem(AUTH_LAST_USER, String(uname)); }catch(_){ }
    // Link session user to an app user with same name, else create
    const found = users.find(u=>u.id===uname) || users.find(u=>u.name.toLowerCase()===String(uname).toLowerCase());
    if (found){ setCurrentUser(found); }
    else {
      const nu = { id: uname, name: uname, role: 'user' };
      users.push(nu); saveUsers(); setCurrentUser(nu);
      if (userMenu) { const li=document.createElement('li'); const b=document.createElement('button'); b.type='button'; b.textContent=nu.name; b.addEventListener('click', ()=>{ setCurrentUser(nu); if (userDropdown) userDropdown.open=false; logEvent('user.switch', { to: nu.id }); renderAudit(); }); li.appendChild(b); userMenu.appendChild(li); }
    }
  hideAuth(); logEvent('auth.login', { user: uname }); renderAudit();
  }catch(err){ authStatus.textContent = (t[currentLang]?.errorPrefix?.replace('{message}', err.message)) || ('Fehler: '+(err.message||String(err))); }
  finally { authSubmit.disabled = false; delete authSubmit.dataset.loading; }
}); }

// Submit on Enter
document.addEventListener('keydown', (e)=>{
  if (authOverlay && !authOverlay.hidden && e.key === 'Enter'){
    e.preventDefault();
    authSubmit?.click();
  }
});

// Password visibility toggle and Caps Lock hint
const passToggleId = 'authPassToggle';
function ensurePassToggle(){
  if (!authPassword || document.getElementById(passToggleId)) return;
  const btn = document.createElement('button');
  btn.id = passToggleId; btn.type = 'button'; btn.className = 'btn ghost'; btn.style.position='absolute'; btn.style.right='10px'; btn.style.top='50%'; btn.style.transform='translateY(-50%)';
  btn.textContent = passVisible ? (t[currentLang]?.hide || 'Verbergen') : (t[currentLang]?.show || 'Anzeigen');
  const wrap = authPassword.parentElement;
  if (wrap && getComputedStyle(wrap).position === 'static'){ wrap.style.position='relative'; }
  wrap?.appendChild(btn);
  btn.addEventListener('click', ()=>{
    passVisible = !passVisible;
    authPassword.type = passVisible ? 'text' : 'password';
    btn.textContent = passVisible ? (t[currentLang]?.hide || 'Verbergen') : (t[currentLang]?.show || 'Anzeigen');
  });
}
function ensureCapsHint(){
  if (!authPassword) return;
  let hint = document.getElementById('capsHint');
  if (!hint){ hint = document.createElement('div'); hint.id='capsHint'; hint.className='muted'; hint.style.marginTop='4px'; hint.style.fontSize='12px'; authPassword.parentElement?.appendChild(hint); }
  authPassword.addEventListener('keyup', (e)=>{
    const on = e.getModifierState && e.getModifierState('CapsLock');
    hint.textContent = on ? (t[currentLang]?.capsOn || 'Feststelltaste ist an') : '';
  });
}

// Toggle register vs login: show/hide security fields
function updateAuthFields(){
  const isReg = authMode==='register';
  if (authConfirmWrap) authConfirmWrap.style.display = isReg ? '' : 'none';
  if (authSecWrap) authSecWrap.style.display = isReg ? '' : 'none';
  if (authSecAnsWrap) authSecAnsWrap.style.display = isReg ? '' : 'none';
}
const _showAuth = showAuth;
showAuth = function(mode){ _showAuth(mode); ensurePassToggle(); ensureCapsHint(); updateAuthFields(); };

// Forgot password flow (client-only)
if (authForgotBtn){ authForgotBtn.addEventListener('click', ()=>{
  const uname = String(authName?.value||'').trim();
  if (!uname){ authStatus.textContent = t[currentLang]?.authEnterNameFirst || 'Bitte zuerst deinen Namen eingeben.'; return; }
  const creds = getCreds();
  const entry = creds[uname];
  if (!entry || !entry.secQ){ authStatus.textContent = t[currentLang]?.authNoRecovery || 'Für dieses Konto ist keine Wiederherstellung hinterlegt.'; return; }
  const q = entry.secQ; const ans = prompt((t[currentLang]?.authAnswerPrompt || 'Antwort auf Sicherheitsfrage:') + '\n' + q);
  if (ans == null) return;
  if (String(ans).trim() !== String(entry.secA||'')) { authStatus.textContent = t[currentLang]?.authWrongAnswer || 'Falsche Antwort.'; return; }
  const newPass = prompt(t[currentLang]?.authNewPassPrompt || 'Neues Passwort eingeben:');
  if (!newPass) return;
  // Reset password
  (async ()=>{
    const salt = randomSalt(); const hash = await pbkdf2(newPass, salt);
    creds[uname].salt = salt; creds[uname].hash = hash;
    saveCreds(creds);
    authStatus.textContent = t[currentLang]?.authResetOk || 'Passwort aktualisiert. Bitte anmelden.';
  })();
}); }

// Attempts & cooldown
function getAttempts(){ try{ return JSON.parse(localStorage.getItem(AUTH_LS_ATTEMPTS)||'{}'); }catch(_){ return {}; } }
function saveAttempts(m){ try{ localStorage.setItem(AUTH_LS_ATTEMPTS, JSON.stringify(m)); }catch(_){ } }
function canAttempt(name){ const m=getAttempts(); const rec=m[name]; if (!rec) return true; if (rec.until && Date.now()<rec.until) return false; return true; }
function cooldownMessage(name){ const m=getAttempts(); const rec=m[name]; if (!rec||!rec.until) return ''; const secs=Math.ceil((rec.until-Date.now())/1000); return `Gesperrt für ${secs}s`; }
function registerFailure(name){ const m=getAttempts(); const rec=m[name]||{count:0}; rec.count=(rec.count||0)+1; if (rec.count>=5){ rec.count=0; rec.until=Date.now()+30000; } m[name]=rec; saveAttempts(m); }
function resetAttempts(name){ const m=getAttempts(); delete m[name]; saveAttempts(m); }

// Hook into login failures to count attempts
const _doLogin = doLogin;
doLogin = async function(name, pass){
  try{ return await _doLogin(name, pass); }
  catch(err){ registerFailure(String(name||'')); throw err; }
};

// Close overlay with Escape
document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && authOverlay && !authOverlay.hidden){ hideAuth(); } });
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  try{ localStorage.setItem('theme', t); }catch(_){}
  // Localize label without touching i18n objects (avoid TDZ):
  // read saved language directly and pick strings.
  let lang = 'de';
  try{ lang = localStorage.getItem('converter.lang') || 'de'; }catch(_){ }
  const textLight = (lang === 'en') ? 'Light' : 'Hell';
  const textDark = (lang === 'en') ? 'Dark' : 'Dunkel';
  if (themeLabel) themeLabel.textContent = (t === 'dark') ? textLight : textDark;
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
  // Save hint
  saveHintSaving: 'Änderungen werden gespeichert.',
  saveHintSaved: 'Gespeichert.',
  // Tour & charts
  help: 'Hilfe',
  tourStart: 'Tour starten',
  tourSkip: 'Überspringen',
  tourBack: 'Zurück',
  tourNext: 'Weiter',
  tourDone: 'Fertig',
  tourWelcomeTitle: 'Willkommen!',
  tourWelcomeBody: 'Kurze Tour durch die wichtigsten Funktionen.',
  tourSvgTitle: 'SVG importieren',
  tourSvgBody: 'Lade SVGs über den Button oder per Drag & Drop hierher.',
  tourPreviewTitle: 'Vorschau & Größe',
  tourPreviewBody: 'Die Vorschau zeigt die Ausgabegröße. Presets und Modus steuern die Anpassung.',
  tourRasterTitle: 'Bilder konvertieren',
  tourRasterBody: 'JPG/PNG laden und als PNG/JPG ausgeben – einzeln oder alle.',
  tourYTTitle: 'YouTube Thumbnails',
  tourYTBody: 'Link einfügen, Thumbnails laden und ggf. exportieren.',
  tourSettingsTitle: 'Einstellungen',
  tourSettingsBody: 'Checkerboard, Presets, Qualität und mehr – wird lokal gespeichert.',
  // Tour reset
  tourReset: 'Tour zurücksetzen',
  chartTopEventsTitle: 'Top-Aktionen',
  chartActivityTitle: 'Aktivität (7 Tage)',
  chartUsersTitle: 'Benutzer-Verteilung',
  // Global stats labels
  statsImages: 'Bilder',
  statsDownloads: 'Downloads',
  show: 'Anzeigen',
  hide: 'Verbergen',
  capsOn: 'Feststelltaste ist an',
  working: 'Bitte warten…',
  authRemember: 'Angemeldet bleiben',
  authForgot: 'Passwort vergessen?',
  authSecQ: 'Sicherheitsfrage',
  authSecA: 'Antwort',
  authSecMissing: 'Bitte Sicherheitsfrage und Antwort angeben.',
  authEnterNameFirst: 'Bitte zuerst deinen Namen eingeben.',
  authNoRecovery: 'Für dieses Konto ist keine Wiederherstellung hinterlegt.',
  authAnswerPrompt: 'Antwort auf Sicherheitsfrage:',
  authWrongAnswer: 'Falsche Antwort.',
  authNewPassPrompt: 'Neues Passwort eingeben:',
  authResetOk: 'Passwort aktualisiert. Bitte anmelden.',
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
  ytPreviewBtn: 'Vorschau',
  ytMetaVideo: 'Video',
  ytMetaThumbs: 'Thumbnails',
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
    // Admin
    adminTitle: 'Admin Bereich',
    auditUserLabel: 'Benutzer',
    auditActionLabel: 'Aktion',
    auditFromLabel: 'Von',
    auditToLabel: 'Bis',
    auditExportBtn: 'Export JSON',
    auditClearBtn: 'Log leeren',
  logout: 'Abmelden',
    // Auth
    authTitleLogin: 'Anmelden',
    authTitleReg: 'Registrieren',
    authNameLabel: 'Name',
    authPasswordLabel: 'Passwort',
    authConfirmLabel: 'Passwort bestätigen',
    authBtnLogin: 'Anmelden',
    authBtnCreate: 'Konto erstellen',
    authToggleToReg: 'Neu registrieren',
    authToggleToLogin: 'Schon Konto? Anmelden',
    authMissing: 'Bitte Name und Passwort eingeben.',
  authConfirmMismatch: 'Passwörter stimmen nicht überein.',
  // Privacy consent
  privacyTitle: 'Datenschutz',
  privacyBody: 'Dürfen wir Ihre Exporte lokal (auf diesem Gerät) speichern, um die Verlaufsliste anzuzeigen?',
  privacyYes: 'Ja, lokal speichern',
  privacyNo: 'Nein, nicht speichern',
  privacyStateUnknown: 'Verlaufsspeicherung: unbekannt',
  privacyStateOn: 'Verlaufsspeicherung: an',
  privacyStateOff: 'Verlaufsspeicherung: aus',
  privacyChange: 'Einstellung ändern',
    // Theme labels
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    themeToggleAria: 'Darstellung umschalten',
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
  // Save hint
  saveHintSaving: 'Changes are saved.',
  saveHintSaved: 'Saved.',
  // Tour & charts
  help: 'Help',
  tourStart: 'Start tour',
  tourSkip: 'Skip',
  tourBack: 'Back',
  tourNext: 'Next',
  tourDone: 'Done',
  tourWelcomeTitle: 'Welcome!',
  tourWelcomeBody: 'A short tour of the main features.',
  tourSvgTitle: 'Import SVG',
  tourSvgBody: 'Load SVGs via the button or by drag & drop here.',
  tourPreviewTitle: 'Preview & Size',
  tourPreviewBody: 'The preview reflects output size. Presets and mode control fitting.',
  tourRasterTitle: 'Convert images',
  tourRasterBody: 'Load JPG/PNG and export as PNG/JPG – single or all.',
  tourYTTitle: 'YouTube Thumbnails',
  tourYTBody: 'Paste a link to load thumbnails and export if needed.',
  tourSettingsTitle: 'Settings',
  tourSettingsBody: 'Checkerboard, presets, quality and more – stored locally.',
  // Tour reset
  tourReset: 'Reset tour',
  chartTopEventsTitle: 'Top events',
  chartActivityTitle: 'Activity (7 days)',
  chartUsersTitle: 'User distribution',
  // Global stats labels
  statsImages: 'Images',
  statsDownloads: 'Downloads',
  show: 'Show',
  hide: 'Hide',
  capsOn: 'Caps Lock is ON',
  working: 'Please wait…',
  authRemember: 'Remember me',
  authForgot: 'Forgot password?',
  authSecQ: 'Security question',
  authSecA: 'Answer',
  authSecMissing: 'Please enter a security question and answer.',
  authEnterNameFirst: 'Please enter your name first.',
  authNoRecovery: 'No recovery is set up for this account.',
  authAnswerPrompt: 'Answer the security question:',
  authWrongAnswer: 'Wrong answer.',
  authNewPassPrompt: 'Enter a new password:',
  authResetOk: 'Password updated. Please sign in.',
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
  ytPreviewBtn: 'Preview',
  ytMetaVideo: 'Video',
  ytMetaThumbs: 'Thumbnails',
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
    // Admin
    adminTitle: 'Admin Panel',
    auditUserLabel: 'User',
    auditActionLabel: 'Action',
    auditFromLabel: 'From',
    auditToLabel: 'To',
    auditExportBtn: 'Export JSON',
    auditClearBtn: 'Clear log',
  logout: 'Logout',
    // Auth
    authTitleLogin: 'Sign in',
    authTitleReg: 'Create account',
    authNameLabel: 'Name',
    authPasswordLabel: 'Password',
    authConfirmLabel: 'Confirm password',
    authBtnLogin: 'Sign in',
    authBtnCreate: 'Create account',
    authToggleToReg: 'New here? Register',
    authToggleToLogin: 'Already have an account? Sign in',
    authMissing: 'Please enter name and password.',
  authConfirmMismatch: 'Passwords do not match.',
  // Privacy consent
  privacyTitle: 'Privacy',
  privacyBody: 'May we store your exports locally (on this device) to show the export history?',
  privacyYes: 'Yes, store locally',
  privacyNo: 'No, do not store',
  privacyStateUnknown: 'History storage: unknown',
  privacyStateOn: 'History storage: on',
  privacyStateOff: 'History storage: off',
  privacyChange: 'Change preference',
    // Theme labels
    themeLight: 'Light',
    themeDark: 'Dark',
    themeToggleAria: 'Toggle appearance',
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
  const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
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
  // Save hint baseline
  const sh = document.getElementById('saveHint'); if (sh) sh.textContent = dict.saveHintSaving || 'Changes are saved.';
  // Privacy consent texts
  const pTitle = document.getElementById('privacyTitle'); if (pTitle) pTitle.textContent = dict.privacyTitle || 'Privacy';
  const pBody = document.getElementById('privacyBody'); if (pBody) pBody.textContent = dict.privacyBody || 'May we store your exports locally (on this device) to show the export history?';
  const pYes = document.getElementById('privacyYes'); if (pYes) pYes.textContent = dict.privacyYes || 'Yes, store locally';
  const pNo = document.getElementById('privacyNo'); if (pNo) pNo.textContent = dict.privacyNo || 'No, do not store';
  // Update theme toggle label and aria (based on current theme)
  try{
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const tl = document.getElementById('themeLabel');
    if (tl) tl.textContent = theme === 'dark' ? (dict.themeLight || 'Light') : (dict.themeDark || 'Dark');
    const togl = document.getElementById('themeToggle');
    if (togl) togl.setAttribute('aria-label', dict.themeToggleAria || 'Toggle appearance');
  }catch(_){ }
  const signBtn = document.getElementById('signInBtn'); if (signBtn) signBtn.textContent = dict.authBtnLogin || 'Anmelden';
  const helpBtnEl = document.getElementById('helpBtn'); if (helpBtnEl) helpBtnEl.innerHTML = `❓ ${dict.help || 'Hilfe'}`;
  const tourResetBtn = document.getElementById('tourResetBtn'); if (tourResetBtn) tourResetBtn.textContent = dict.tourReset || 'Tour zurücksetzen';
  // Tour control labels (baseline; Next may switch to Done per step)
  const skipEl = document.getElementById('tourSkip'); if (skipEl) skipEl.textContent = dict.tourSkip || 'Skip';
  const backEl = document.getElementById('tourBack'); if (backEl) backEl.textContent = dict.tourBack || 'Back';
  const nextEl = document.getElementById('tourNext'); if (nextEl) nextEl.textContent = dict.tourNext || 'Next';
  // Admin panel labels
  const setIf = (id, val)=>{ const el=document.getElementById(id); if (el) el.textContent = val; };
  setIf('adminTitle', dict.adminTitle || 'Admin Bereich');
  setIf('auditUserLabel', dict.auditUserLabel || 'Benutzer');
  setIf('auditActionLabel', dict.auditActionLabel || 'Aktion');
  setIf('auditFromLabel', dict.auditFromLabel || 'Von');
  setIf('auditToLabel', dict.auditToLabel || 'Bis');
  const exportBtn = document.getElementById('auditExportBtn'); if (exportBtn) exportBtn.textContent = dict.auditExportBtn || 'Export JSON';
  const clearBtnA = document.getElementById('auditClearBtn'); if (clearBtnA) clearBtnA.textContent = dict.auditClearBtn || 'Log leeren';
  if (userCurrent) userCurrent.textContent = (currentUser && currentUser.name) || 'Guest';
  // Auth labels
  setIf('authTitle', dict.authTitleLogin || 'Anmelden');
  setIf('authNameLabel', dict.authNameLabel || 'Name');
  setIf('authPasswordLabel', dict.authPasswordLabel || 'Passwort');
  setIf('authConfirmLabel', dict.authConfirmLabel || 'Passwort bestätigen');
  const authBtn = document.getElementById('authSubmit'); if (authBtn) authBtn.textContent = dict.authBtnLogin || 'Anmelden';
  const authToggle = document.getElementById('authToggleMode'); if (authToggle) authToggle.textContent = dict.authToggleToReg || 'Neu registrieren';
  const remL = document.getElementById('authRememberLabel'); if (remL) remL.textContent = dict.authRemember || 'Angemeldet bleiben';
  const forgot = document.getElementById('authForgot'); if (forgot) forgot.textContent = dict.authForgot || 'Passwort vergessen?';
  const secQL = document.getElementById('authSecQLabel'); if (secQL) secQL.textContent = dict.authSecQ || 'Sicherheitsfrage';
  const secAL = document.getElementById('authSecALabel'); if (secAL) secAL.textContent = dict.authSecA || 'Antwort';
  // YouTube card
  setText('ytCardTitle', dict.ytCardTitle);
  setText('ytFetch', dict.ytLoadBtn);
  setText('ytMenuLoadBtn', dict.ytLoadBtn);
  setText('ytMenuAllBtn', dict.ytAllBtn);
  // Update dynamic YT list controls if present
  document.querySelectorAll('.yt-prev-btn').forEach(b=>{ b.textContent = dict.ytPreviewBtn || 'Preview'; });
  document.querySelectorAll('.yt-dl-btn').forEach(b=>{ b.textContent = dict.ytAllBtn || 'Download all'; });
  document.querySelectorAll('.yt-meta').forEach(el=>{
    const vid = el.getAttribute('data-vid') || '';
    el.textContent = `${dict.ytMetaVideo||'Video'}: ${vid} — ${dict.ytMetaThumbs||'Thumbnails'}: ${YT_RES.join(', ')}`;
  });
  // Browser tab title
  try { document.title = dict.title || 'YouTube Thumbnail Converter'; } catch (_) {}
  const ytUrl = document.getElementById('ytUrl'); if (ytUrl) ytUrl.placeholder = dict.ytPlaceholder;
  const ytStatus = document.getElementById('ytStatus'); if (ytStatus && (!ytStatus.textContent || /YouTube|Füge|Paste/i.test(ytStatus.textContent))) ytStatus.textContent = dict.ytEmpty;
  // Initialize default statuses for sections if still untouched
  const sEl = document.getElementById('status'); if (sEl && (/Kein SVG geladen\.|No SVG loaded\./i.test(sEl.textContent) || !sEl.textContent)) sEl.textContent = dict.svgStatusNone;
  const rsEl = document.getElementById('rStatus'); if (rsEl && (/Keine Bilder geladen\.|No images loaded\./i.test(rsEl.textContent) || !rsEl.textContent)) rsEl.textContent = dict.rStatusNone;
  if (langCurrent) langCurrent.textContent = (lang === 'en' ? 'English' : 'Deutsch');
  try{ localStorage.setItem(I18N_KEY, lang); }catch(_){ }
  try{ updateGlobalStats(); }catch(_){ }
  try{ updatePrivacyState(); }catch(_){ }
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
if (signInBtn) signInBtn.addEventListener('click', ()=>{
  if (!requireSession()) { showAuth('login'); return; }
  // Toggle user dropdown if already logged in
  if (userDropdown) userDropdown.open = !userDropdown.open;
});

// ===== Guided Tour (client-only) =====
const TOUR_LS_KEY = 'converter.tour.dismissed.v1';
const tourOverlay = document.getElementById('tourOverlay');
const tourHighlight = document.getElementById('tourHighlight');
const tourTooltip = document.getElementById('tourTooltip');
const tourStepTitle = document.getElementById('tourStepTitle');
const tourStepBody = document.getElementById('tourStepBody');
const tourStepCount = document.getElementById('tourStepCount');
const tourBack = document.getElementById('tourBack');
const tourNext = document.getElementById('tourNext');
const tourSkip = document.getElementById('tourSkip');
let tourIndex = 0;
const tourSteps = [
  { el: '#title', title: 'tourWelcomeTitle', body: 'tourWelcomeBody', place: 'bottom' },
  { el: '#dropzone', title: 'tourSvgTitle', body: 'tourSvgBody', place: 'bottom' },
  { el: '#canvas', title: 'tourPreviewTitle', body: 'tourPreviewBody', place: 'right' },
  { el: '#rDropzone', title: 'tourRasterTitle', body: 'tourRasterBody', place: 'bottom' },
  { el: '#ytUrl', title: 'tourYTTitle', body: 'tourYTBody', place: 'bottom' },
  { el: '#settingsTitle', title: 'tourSettingsTitle', body: 'tourSettingsBody', place: 'top' },
];
function tourPositionTooltip(target, place){
  if (!tourTooltip) return;
  const rect = target.getBoundingClientRect();
  const tipRect = tourTooltip.getBoundingClientRect();
  let top = rect.bottom + 10, left = rect.left;
  switch(place){
    case 'top': top = rect.top - tipRect.height - 10; left = rect.left; break;
    case 'bottom': top = rect.bottom + 10; left = rect.left; break;
    case 'left': top = rect.top; left = rect.left - tipRect.width - 10; break;
    case 'right': top = rect.top; left = rect.right + 10; break;
  }
  top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));
  left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
  tourTooltip.style.top = `${top + window.scrollY}px`;
  tourTooltip.style.left = `${left + window.scrollX}px`;
}
function tourHighlightTarget(target){
  if (!tourHighlight) return;
  const r = target.getBoundingClientRect();
  tourHighlight.style.top = `${r.top + window.scrollY - 6}px`;
  tourHighlight.style.left = `${r.left + window.scrollX - 6}px`;
  tourHighlight.style.width = `${r.width + 12}px`;
  tourHighlight.style.height = `${r.height + 12}px`;
  tourHighlight.hidden = false;
}
function showTourStep(i){
  const step = tourSteps[i];
  if (!step){ endTour(true); return; }
  const target = document.querySelector(step.el);
  if (!target){ if (i+1 < tourSteps.length) return showTourStep(i+1); else return endTour(true); }
  const dict = t[currentLang] || t.de;
  if (tourOverlay) tourOverlay.hidden = false;
  if (tourStepTitle) tourStepTitle.textContent = dict[step.title] || '';
  if (tourStepBody) tourStepBody.textContent = dict[step.body] || '';
  if (tourSkip) tourSkip.textContent = dict.tourSkip || 'Skip';
  if (tourBack) tourBack.textContent = dict.tourBack || 'Back';
  if (tourTooltip) tourTooltip.style.visibility = 'hidden';
  requestAnimationFrame(()=>{
    if (tourTooltip) tourTooltip.style.visibility = 'visible';
    tourPositionTooltip(target, step.place);
  });
  tourHighlightTarget(target);
  if (tourBack) tourBack.disabled = i === 0;
  if (tourNext) tourNext.textContent = (i === tourSteps.length-1) ? ((t[currentLang]||t.de).tourDone || 'Fertig') : ((t[currentLang]||t.de).tourNext || 'Weiter');
  if (tourStepCount) tourStepCount.textContent = `${i+1} / ${tourSteps.length}`;
  setupTourFocusTrap();
}
function startTour(force){
  try{ const dismissed = localStorage.getItem(TOUR_LS_KEY); if (dismissed && !force) return; }catch(_){ }
  tourIndex = 0; showTourStep(tourIndex);
}
function endTour(dismiss){
  if (dismiss){ try{ localStorage.setItem(TOUR_LS_KEY,'1'); }catch(_){ } }
  if (tourOverlay) tourOverlay.hidden = true;
  if (tourHighlight) tourHighlight.hidden = true;
}
function resetTour(){ try{ localStorage.removeItem(TOUR_LS_KEY); }catch(_){} startTour(true); }
const tourResetBtnEl = document.getElementById('tourResetBtn'); if (tourResetBtnEl){ tourResetBtnEl.addEventListener('click', resetTour); }
if (helpBtn){ helpBtn.addEventListener('click', ()=> startTour(true)); }
if (tourNext){ tourNext.addEventListener('click', ()=>{ if (tourIndex < tourSteps.length-1){ tourIndex++; showTourStep(tourIndex);} else { endTour(true); } }); }
if (tourBack){ tourBack.addEventListener('click', ()=>{ if (tourIndex>0){ tourIndex--; showTourStep(tourIndex); } }); }
if (tourSkip){ tourSkip.addEventListener('click', ()=> endTour(true)); }
window.addEventListener('resize', ()=>{ const step=tourSteps[tourIndex]; const target = step && document.querySelector(step.el); if (target && tourOverlay && !tourOverlay.hidden){ tourPositionTooltip(target, step.place); tourHighlightTarget(target); } });
// Allow closing the tour with Escape
document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && tourOverlay && !tourOverlay.hidden){ endTour(true); } });

// Focus trap within the tour tooltip
let tourTrapHandler = null;
function getTourFocusable(){
  if (!tourTooltip) return [];
  const nodes = tourTooltip.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  return Array.from(nodes).filter(el=>!el.hasAttribute('disabled'));
}
function setupTourFocusTrap(){
  const els = getTourFocusable(); if (!els.length) return;
  const first = els[0], last = els[els.length-1];
  if (first) first.focus();
  // Remove previous handler if any
  if (tourTrapHandler){ document.removeEventListener('keydown', tourTrapHandler); }
  tourTrapHandler = (e)=>{
    if (e.key !== 'Tab') return;
    if (e.shiftKey){ if (document.activeElement === first){ e.preventDefault(); last.focus(); } }
    else { if (document.activeElement === last){ e.preventDefault(); first.focus(); } }
  };
  document.addEventListener('keydown', tourTrapHandler);
}

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
  const dictSH = t[currentLang] || t.de;
  if (saveHint){
    saveHint.textContent = (dictSH.saveHintSaved || 'Saved.');
    setTimeout(()=>{ saveHint.textContent = (dictSH.saveHintSaving || 'Changes are saved.'); }, 1200);
  }
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

// ===== Admin: Audit Log (client-only) =====
function getAudit(){ try{ const raw=localStorage.getItem(ADMIN_LS_AUDIT); return raw?JSON.parse(raw):[]; }catch(_){ return []; } }
function saveAudit(arr){ try{ localStorage.setItem(ADMIN_LS_AUDIT, JSON.stringify(arr)); }catch(_){ } }
function logEvent(type, data){
  try{
    const entry = { ts: new Date().toISOString(), user: (currentUser&&currentUser.id)||'guest', type, data: data||{} };
    const arr = getAudit(); arr.unshift(entry); saveAudit(arr.slice(0, 2000));
    try{ updateGlobalStats(); }catch(_){ }
  }catch(_){ }
}
const auditList = document.getElementById('auditList');
const auditUserFilter = document.getElementById('auditUserFilter');
const auditActionFilter = document.getElementById('auditActionFilter');
const auditFrom = document.getElementById('auditFrom');
const auditTo = document.getElementById('auditTo');
const auditPrev = document.getElementById('auditPrev');
const auditNext = document.getElementById('auditNext');
const auditPageInfo = document.getElementById('auditPageInfo');
const auditExportBtn = document.getElementById('auditExportBtn');
const auditClearBtn = document.getElementById('auditClearBtn');
const auditStats = document.getElementById('auditStats');
let auditPaging = { page: 1, pageSize: 10 };
function renderAudit(){
  if (!auditList) return;
  // Only admins can see data; if not admin, clear and exit
  if (!currentUser || currentUser.role !== 'admin'){
    auditList.innerHTML = '';
    if (auditPageInfo) auditPageInfo.textContent = '–';
    if (auditStats) auditStats.textContent = '–';
    const charts = document.getElementById('auditCharts');
    if (charts) charts.style.display = 'none';
    return;
  }
  if (auditUserFilter && auditUserFilter.options.length<=1){ users.forEach(u=>{ const opt=document.createElement('option'); opt.value=u.id; opt.textContent=u.name; auditUserFilter.appendChild(opt); }); }
  if (auditActionFilter && auditActionFilter.options.length<=1){ const all=getAudit(); const acts=Array.from(new Set(all.map(e=>e.type))); acts.forEach(a=>{ const opt=document.createElement('option'); opt.value=a; opt.textContent=a; auditActionFilter.appendChild(opt); }); }
  const all = getAudit();
  const fromTs = auditFrom && auditFrom.value ? new Date(auditFrom.value+'T00:00:00').getTime() : -Infinity;
  const toTs = auditTo && auditTo.value ? new Date(auditTo.value+'T23:59:59').getTime() : Infinity;
  const filtered = all.filter(e=> (!auditUserFilter || !auditUserFilter.value || e.user===auditUserFilter.value) && (!auditActionFilter || !auditActionFilter.value || e.type===auditActionFilter.value) && (new Date(e.ts).getTime()>=fromTs) && (new Date(e.ts).getTime()<=toTs) );
  const totalPages = Math.max(1, Math.ceil(filtered.length / auditPaging.pageSize));
  auditPaging.page = Math.min(Math.max(1, auditPaging.page), totalPages);
  const start = (auditPaging.page-1)*auditPaging.pageSize; const pageItems = filtered.slice(start, start+auditPaging.pageSize);
  auditList.innerHTML='';
  pageItems.forEach(e=>{ const li=document.createElement('li'); li.className='file-item'; const row=document.createElement('div'); row.className='export-row'; const meta=document.createElement('div'); const when=new Date(e.ts).toLocaleString(); const uname=(users.find(u=>u.id===e.user)||{}).name||e.user; meta.textContent=`${when} — ${uname} — ${e.type}`; row.appendChild(meta); const act=document.createElement('div'); act.style.marginLeft='auto'; const btn=document.createElement('button'); btn.className='btn ghost'; btn.textContent='Details'; btn.addEventListener('click', ()=>{ alert((()=>{ try{return JSON.stringify(e.data,null,2);}catch(_){return 'No details';}})()); }); act.appendChild(btn); row.appendChild(act); li.appendChild(row); auditList.appendChild(li); });
  if (auditPageInfo) auditPageInfo.textContent = `${auditPaging.page} / ${totalPages}`;
  if (auditPrev) auditPrev.disabled = auditPaging.page<=1;
  if (auditNext) auditNext.disabled = auditPaging.page>=totalPages;
  if (auditStats) auditStats.textContent = `Total: ${filtered.length}`;
  // Also render mini charts
  try { renderAuditCharts(filtered); } catch (e) { /* ignore chart errors */ }
}
if (auditUserFilter) auditUserFilter.addEventListener('change', ()=>{ auditPaging.page=1; renderAudit(); });
if (auditActionFilter) auditActionFilter.addEventListener('change', ()=>{ auditPaging.page=1; renderAudit(); });
if (auditFrom) auditFrom.addEventListener('change', ()=>{ auditPaging.page=1; renderAudit(); });
if (auditTo) auditTo.addEventListener('change', ()=>{ auditPaging.page=1; renderAudit(); });
if (auditPrev) auditPrev.addEventListener('click', ()=>{ auditPaging.page--; renderAudit(); });
if (auditNext) auditNext.addEventListener('click', ()=>{ auditPaging.page++; renderAudit(); });
if (auditExportBtn) auditExportBtn.addEventListener('click', ()=>{ const data=getAudit(); const a=document.createElement('a'); const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const href=URL.createObjectURL(blob); a.href=href; a.download='audit.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(href), 1000); });
if (auditClearBtn) auditClearBtn.addEventListener('click', ()=>{ if (confirm('Log wirklich löschen?')){ saveAudit([]); renderAudit(); } });

// Mini charts for audit
function renderAuditCharts(filtered){
  const charts = document.getElementById('auditCharts');
  if (!charts) return;
  if (!currentUser || currentUser.role !== 'admin'){ charts.style.display='none'; return; }
  charts.style.display='';
  const dict = t[currentLang] || t.de;
  const setText=(id,v)=>{ const el=document.getElementById(id); if (el) el.textContent=v; };
  setText('chartTopEventsTitle', dict.chartTopEventsTitle || 'Top events');
  setText('chartActivityTitle', dict.chartActivityTitle || 'Activity (7 days)');
  setText('chartUsersTitle', dict.chartUsersTitle || 'Users');
  // Top events
  const topWrap = document.getElementById('chartTopEvents');
  if (topWrap){
    topWrap.innerHTML='';
    const counts = filtered.reduce((m,e)=>{ m[e.type]=(m[e.type]||0)+1; return m; },{});
    const top = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const max = Math.max(1, ...top.map(x=>x[1]));
    top.forEach(([label,val])=>{
      const row=document.createElement('div'); row.className='bar-row';
      const l=document.createElement('div'); l.className='bar-label'; l.textContent=label; row.appendChild(l);
      const bar=document.createElement('div'); bar.className='bar'; bar.style.width=`${Math.max(6,(val/max)*100)}%`; row.appendChild(bar);
      const v=document.createElement('div'); v.className='bar-val'; v.textContent=String(val); row.appendChild(v);
      topWrap.appendChild(row);
    });
  }
  // Activity last 7 days
  const days = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(6-i)); return d; });
  const perDay = days.map(()=>0);
  filtered.forEach(e=>{ const dt=new Date(e.ts); dt.setHours(0,0,0,0); const idx=days.findIndex(d=>d.getTime()===dt.getTime()); if (idx>=0) perDay[idx]++; });
  const actWrap=document.getElementById('chartActivity7');
  if (actWrap){
    actWrap.innerHTML='';
    const max = Math.max(1, ...perDay);
    perDay.forEach((v)=>{ const col=document.createElement('div'); col.className='col'; col.style.height=`${(v/max)*100}%`; col.title=String(v); actWrap.appendChild(col); });
  }
  // Users distribution
  const userWrap=document.getElementById('chartUsersDist');
  if (userWrap){
    userWrap.innerHTML='';
    const counts = filtered.reduce((m,e)=>{ const id=e.user||'guest'; m[id]=(m[id]||0)+1; return m; },{});
    const arr = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max = Math.max(1, ...arr.map(x=>x[1]));
    arr.forEach(([uid,val])=>{
      const u = users.find(x=>x.id===uid); const label=(u&&u.name)||uid;
      const row=document.createElement('div'); row.className='bar-row';
      const l=document.createElement('div'); l.className='bar-label'; l.textContent=label; row.appendChild(l);
      const bar=document.createElement('div'); bar.className='bar'; bar.style.width=`${Math.max(6,(val/max)*100)}%`; row.appendChild(bar);
      const v=document.createElement('div'); v.className='bar-val'; v.textContent=String(val); row.appendChild(v);
      userWrap.appendChild(row);
    });
  }
}

// ===== Global toolbar stats =====
function updateGlobalStats(){
  const el = document.getElementById('globalStats');
  if (!el) return;
  const dict = t[currentLang] || t.de;
  // Images generated: count of history entries (svg->png, img->png, img->jpg)
  let images = 0;
  try {
    const hist = getHistory();
    images = hist.filter(e => e && (e.type==='svg->png' || e.type==='img->png' || e.type==='img->jpg')).length;
  } catch(_) {}
  // Downloads: sum audit export/download events; batch uses 'ok' or 'total'
  let downloads = 0;
  try{
    const audit = getAudit();
    for (const e of audit){
      if (!e || !e.type) continue;
      if (e.type === 'yt.download' || e.type === 'export.svg' || e.type === 'export.raster') downloads += 1;
      else if (e.type === 'export.svg.all' || e.type === 'export.raster.all') downloads += (Number(e.data?.ok)||Number(e.data?.total)||0);
    }
  }catch(_){ }
  const li = (dict.statsImages || 'Images');
  const ld = (dict.statsDownloads || 'Downloads');
  el.textContent = `${li}: ${images} • ${ld}: ${downloads}`;
}

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
  if (!getHistoryConsent()) { return; }
  const h = getHistory();
  h.unshift({ ...entry, ts: new Date().toISOString() });
  // Cap history to a reasonable size
  saveHistory(h.slice(0, 1000));
  renderHistory();
  try { updateGlobalStats(); } catch (_) { }
}
function renderHistory(){
  if (!exportListView || !statsSummary) return;
  if (!getHistoryConsent()){
    exportListView.innerHTML = '';
    statsSummary.textContent = '—';
    if (pageInfo) pageInfo.textContent = '–';
    if (prevPageBtn) prevPageBtn.disabled = true;
    if (nextPageBtn) nextPageBtn.disabled = true;
    try { updateGlobalStats(); } catch(_) {}
    return;
  }
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
  try { updateGlobalStats(); } catch (_) { }
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

// ===== Privacy consent (local export history) =====
const CONSENT_KEY = 'converter.historyConsent.v1';
const consentOverlay = document.getElementById('consentOverlay');
const privacyYesBtn = document.getElementById('privacyYes');
const privacyNoBtn = document.getElementById('privacyNo');
const privacyStateEl = document.getElementById('privacyState');
const privacyChangeBtn = document.getElementById('privacyChange');
function getHistoryConsent(){ try{ const v = localStorage.getItem(CONSENT_KEY); return v === 'yes'; }catch(_){ return false; } }
function hasAnsweredConsent(){ try{ return localStorage.getItem(CONSENT_KEY) != null; }catch(_){ return true; } }
function showConsent(){ if (consentOverlay) consentOverlay.hidden = false; }
function hideConsent(){ if (consentOverlay) consentOverlay.hidden = true; }
function updatePrivacyState(){
  const dict = t[currentLang] || t.de;
  const answered = hasAnsweredConsent();
  const on = getHistoryConsent();
  if (privacyStateEl){
    if (!answered) privacyStateEl.textContent = dict.privacyStateUnknown || 'History storage: unknown';
    else privacyStateEl.textContent = on ? (dict.privacyStateOn || 'History storage: on') : (dict.privacyStateOff || 'History storage: off');
  }
  if (privacyChangeBtn){ privacyChangeBtn.textContent = dict.privacyChange || 'Change preference'; }
}
if (privacyYesBtn) privacyYesBtn.addEventListener('click', ()=>{ try{ localStorage.setItem(CONSENT_KEY,'yes'); }catch(_){ } hideConsent(); updatePrivacyState(); renderHistory(); });
if (privacyNoBtn) privacyNoBtn.addEventListener('click', ()=>{ try{ localStorage.setItem(CONSENT_KEY,'no'); }catch(_){ } hideConsent(); updatePrivacyState(); renderHistory(); });
if (privacyChangeBtn) privacyChangeBtn.addEventListener('click', ()=>{ showConsent(); });

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
  logEvent('export.svg', { name: a.download, w: canvas.width, h: canvas.height });
  return a.download;
}
async function download(scale, suffix=''){
  if (!(items.length && currentIndex>=0)) { alert(L('alertPickSVG')); return; }
  try{
    TitleStatus.start(currentLang==='en'?'Exporting':'Exportiere');
    const name = await exportOne(items[currentIndex], scale, suffix);
    withStatus(L('exportOneDone', { name }));
    logEvent('export.svg.single', { name, scale });
  }catch(err){ console.error(err); withStatus(L('exportFailed')); }
  finally{ TitleStatus.stop(); }
}
async function downloadAll(scale, suffix=''){
  if (!items.length){ alert(L('alertLoadSVGs')); return; }
  TitleStatus.start(currentLang==='en'?'Exporting':'Exportiere');
  let success = 0; for (const it of items){ try{ await exportOne(it, scale, suffix); success++; } catch(err){ console.warn('Fehler beim Export:', it.name, err); } }
  withStatus(L('exportCompleted', { ok: success, total: items.length }));
  logEvent('export.svg.all', { ok: success, total: items.length, scale });
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
    logEvent('export.raster', { name: a.download, target, w: canvas.width, h: canvas.height });
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
  logEvent('export.preview', { name, target });
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
  logEvent('export.raster.all', { ok, total: rItems.length, target });
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
    logEvent('preview.url', { url, name: base });
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
  meta.className = 'yt-meta';
  meta.setAttribute('data-vid', vid);
  meta.textContent = `${L('ytMetaVideo')}: ${vid} — ${L('ytMetaThumbs')}: ${YT_RES.join(', ')}`;
  row.appendChild(meta);
  const actions = document.createElement('div'); actions.style.marginLeft='auto'; actions.style.display='flex'; actions.style.gap='6px';
  // preview to main canvas action
  const prevBtn = document.createElement('button'); prevBtn.className='btn ghost yt-prev-btn'; prevBtn.textContent=L('ytPreviewBtn');
  prevBtn.addEventListener('click', async ()=>{
    try{
      // Prefer maxres; fall back to hqdefault. Use cover to fill 1280×720 without Balken.
      try{ await rRenderToCanvasFromURL(ytDirectUrl(vid,'maxresdefault'), { w:1280, h:720 }, 'cover'); }
      catch(_){ await rRenderToCanvasFromURL(ytDirectUrl(vid,'hqdefault'), { w:1280, h:720 }, 'cover'); }
      ytWithStatus(L('ytPreviewLoaded'));
      logEvent('yt.preview', { vid });
    }catch(e){ ytWithStatus(L('ytPreviewFailed')); }
  });
  actions.appendChild(prevBtn);
  // download all resolutions
  const dlBtn = document.createElement('button'); dlBtn.className='btn yt-dl-btn'; dlBtn.textContent=L('ytAllBtn');
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
  logEvent('yt.load', { vid });
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
      logEvent('yt.download', { vid, key });
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
    // Users and admin
    loadUsers(); ensureUsers(); setCurrentUser(currentUser); populateUserMenu();
  updateAdminVisibility();
    // Do not auto-open auth overlay on startup; user can click "Sign in" when ready
    loadSettings();
    initLang();
    hookSettings();
    rerenderPreview();
      renderHistory();
    renderAudit();
    try{ updateGlobalStats(); }catch(_){ }
  // Ask for privacy consent on first visit
  try{ if (!hasAnsweredConsent()) showConsent(); }catch(_){ }
  try{ updatePrivacyState(); }catch(_){ }
    // Set dynamic year in footer
    try{ const yEl=document.getElementById('year'); if (yEl) yEl.textContent=String(new Date().getFullYear()); }catch(_){ }
  // Auto-start guided tour (once)
  startTour(false);
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
  // Users and admin (eager path)
  loadUsers(); ensureUsers(); setCurrentUser(currentUser); populateUserMenu();
  updateAdminVisibility();
  // Do not auto-open auth overlay on startup; user can click "Sign in" when ready
  loadSettings();
  initLang();
  hookSettings();
  rerenderPreview();
    renderHistory();
  renderAudit();
  try{ updateGlobalStats(); }catch(_){ }
  // Ask for privacy consent on first visit (eager path)
  try{ if (!hasAnsweredConsent()) showConsent(); }catch(_){ }
  try{ updatePrivacyState(); }catch(_){ }
  // Set dynamic year in footer (eager path)
  try{ const yEl=document.getElementById('year'); if (yEl) yEl.textContent=String(new Date().getFullYear()); }catch(_){ }
  // Auto-start guided tour (once) in eager path
  startTour(false);
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
