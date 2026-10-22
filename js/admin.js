// 벨키퍼 관리자 화면
import * as F from './fb.js';
import {
  APP_VERSION, SPACE_TYPES, DOW_LABELS, RULE_KINDS, todayKey, koreanDate, shortDate, addDays, dowOfKey,
  parseKey, dateKey, resolveDay, bellsForDay, upcomingBells, sortRules, fmtRemain, fmtRemainWords,
  escapeHtml as h, randomCode, cleanBells, timeToSec, pad, PLAYER_STYLES, styleName
} from './core.js';
import { TEMPLATES, TEMPLATE_GROUPS, starterFor, templateById, makeLessons } from './templates.js';
import { KR_HOLIDAYS } from './holidays.js';
import { watchUpdates, checkUpdate, reloadToLatest, cmpVer } from './version.js';
import {
  BUILTIN_SOUNDS, SOUND_CATS, BGM_MOODS, isBuiltin, builtinName, resolveBuiltin, playBell, stopAll, unlockAudio, fileDuration,
  deviceVoices, getDeviceVoicePref, setDeviceVoicePref, speak
} from './sounds.js';
import { ttsAvailable, GOOGLE_VOICES, DEFAULT_VOICE, voiceLabel, synthesize, ttsKey } from './tts.js';

const root = document.getElementById('root');
const sheetRoot = document.getElementById('sheet');
const LS = { space: 'bk.space' };
const ONLINE_MS = 3 * 60 * 1000;
const MAX_UPLOAD = 20 * 1024 * 1024;

const S = {
  user: null, ready: false,
  spaces: [], spaceId: null, space: null,
  timetables: [], rules: [], sounds: [], devices: [],
  tab: 'today', cal: null, unsub: [],
  invites: [],        // 나를 관리자로 초대한 공간
  update: null,       // 새 버전 정보
  sheet: null,        // { type, ...데이터 }
  pair: null,         // { code, expiresAt }
  shareParam: new URLSearchParams(location.search).get('share')
};

// ── 아이콘 ─────────────────────────────────────
const I = {
  today: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>',
  device: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="4" y="3" width="16" height="13" rx="2"/><path d="M9 21h6M12 16v5"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  left: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>',
  dots: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  logo: '<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="4" y="4" width="112" height="112" rx="28" fill="#E0B25A"/><path d="M60 26 C46 26 38 37 38 52 L38 66 L31 75 L89 75 L82 66 L82 52 C82 37 74 26 60 26 Z" fill="#17231F"/><circle cx="60" cy="84" r="6" fill="#17231F"/><path d="M24 46 C20 52 20 60 24 66" fill="none" stroke="#17231F" stroke-width="5" stroke-linecap="round"/><path d="M96 46 C100 52 100 60 96 66" fill="none" stroke="#17231F" stroke-width="5" stroke-linecap="round"/></svg>'
};

// ── 도움 함수 ─────────────────────────────────────
const tz = () => (S.space && S.space.timezone) || 'Asia/Seoul';
const ttById = id => S.timetables.find(t => t.id === id);
const soundsById = () => Object.fromEntries(S.sounds.map(s => [s.id, s]));
const spaceRef = () => F.doc(F.db, 'spaces', S.spaceId);
const sub = name => F.collection(F.db, 'spaces', S.spaceId, name);
const millis = ts => (ts && typeof ts.toMillis === 'function') ? ts.toMillis() : (ts && ts.seconds ? ts.seconds * 1000 : 0);

function soundName(id) {
  if (!id) return '기본 종';
  if (id === 'none') return '소리 없음 (안내만)';
  if (isBuiltin(id)) return builtinName(id);
  const s = S.sounds.find(x => x.id === id);
  return s ? s.name : '(지워진 소리)';
}
function ruleLabel(r) {
  if (!r) return '';
  if (r.kind === 'day') return `${shortDate(r.date)} ${r.name || ''}`.trim();
  return `${shortDate(r.start)} ~ ${shortDate(r.end)} ${r.name || ''}`.trim();
}
function deviceOnline(d) { return Date.now() - millis(d.lastSeen) < ONLINE_MS; }
function ago(ms) {
  if (!ms) return '기록 없음';
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return `${s}초 전`;
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}
function fmtSize(b) { return b > 1048576 ? `${(b / 1048576).toFixed(1)}MB` : `${Math.max(1, Math.round(b / 1024))}KB`; }
function fmtDur(sec) { sec = Math.round(sec || 0); return sec >= 60 ? `${Math.floor(sec / 60)}분 ${sec % 60}초` : `${sec}초`; }

let toastTimer = null;
function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}
function fail(e, msg) {
  console.error(e);
  const code = e && e.code ? ` (${e.code})` : '';
  toast((msg || '저장하지 못했어요') + code);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); toast('복사했어요'); }
  catch (e) { prompt('아래 내용을 복사하세요', t); }
}

function soundOptions(selected) {
  const sel = isBuiltin(selected) ? resolveBuiltin(selected) : selected;
  const b = SOUND_CATS.map(c => `<optgroup label="${h(c.label)}">${BUILTIN_SOUNDS.filter(s => s.cat === c.id)
    .map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${h(s.name)}</option>`).join('')}</optgroup>`).join('');
  const ups = S.sounds.filter(s => s.kind !== 'tts');
  const u = ups.map(s => `<option value="${h(s.id)}" ${s.id === sel ? 'selected' : ''}>${h(s.name)}</option>`).join('');
  const missing = sel && sel !== 'none' && !isBuiltin(sel) && !ups.find(s => s.id === sel)
    ? `<option value="${h(sel)}" selected>(지워진 소리)</option>` : '';
  return `<option value="none" ${sel === 'none' ? 'selected' : ''}>소리 없음 (안내만)</option>${b}${u ? `<optgroup label="올린 소리">${u}</optgroup>` : ''}${missing}`;
}
function bgmOptions(selected) {
  const sel = selected || '';
  const g = BGM_MOODS.map(m => `<optgroup label="${h(m.label)}">${BUILTIN_SOUNDS.filter(s => s.cat === 'bgm' && s.mood === m.id)
    .map(s => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${h(s.name)}</option>`).join('')}</optgroup>`).join('');
  const ups = S.sounds.filter(s => s.kind !== 'tts');
  const u = ups.map(s => `<option value="${h(s.id)}" ${s.id === sel ? 'selected' : ''}>${h(s.name)}</option>`).join('');
  return `<option value="" ${!sel ? 'selected' : ''}>배경음악 없음</option>${g}${u ? `<optgroup label="올린 소리·음악">${u}</optgroup>` : ''}`;
}
const ttsCfg = () => Object.assign({ mode: 'device', voice: DEFAULT_VOICE, rate: 1 }, (S.space && S.space.tts) || {});
const googleOn = () => ttsCfg().mode === 'google' && ttsAvailable();
function ttsSummary() {
  const c = ttsCfg();
  if (c.mode === 'google' && ttsAvailable()) return `Google 고음질 · ${voiceLabel(c.voice)} · 속도 ${Number(c.rate).toFixed(1)}`;
  if (c.mode === 'google') return 'Google 고음질 (API 키 설정 필요) — 지금은 기기 음성으로 읽어요';
  return '기기 음성 · 재생기마다 그 기기의 목소리로 읽어요';
}

// 안내 문구 → Google 음성 파일 (같은 문구는 한 번만 만들어 계속 다시 씀)
async function ensureTts(text) {
  text = String(text || '').trim().slice(0, 120);
  if (!text || !googleOn()) return '';
  const c = ttsCfg();
  const id = 'tts_' + await ttsKey(text, c.voice, c.rate);
  if (S.sounds.find(s => s.id === id && s.url)) return id;
  const snap = await F.getDoc(F.doc(sub('sounds'), id));
  if (snap.exists() && snap.get('url')) return id;
  const mp3 = await synthesize(text, c.voice, c.rate);
  const path = `spaces/${S.spaceId}/sounds/${id}.mp3`;
  const task = F.uploadBytesResumable(F.sRef(F.storage, path), new Blob([mp3], { type: 'audio/mpeg' }), { contentType: 'audio/mpeg' });
  await new Promise((res, rej) => task.on('state_changed', null, rej, res));
  const url = await F.getDownloadURL(task.snapshot.ref);
  await F.setDoc(F.doc(sub('sounds'), id), {
    name: ('안내 · ' + text).slice(0, 40), url, storagePath: path, contentType: 'audio/mpeg', size: mp3.length, duration: 0,
    kind: 'tts', ttsText: text, ttsVoice: c.voice, createdAt: F.serverTimestamp(), by: S.user.uid
  });
  return id;
}
async function bellsWithTts(bells, onStep) {
  const out = [];
  let i = 0;
  const need = bells.filter(b => b.say).length;
  for (const b of bells) {
    const nb = { ...b };
    if (nb.say && googleOn()) { nb.sayId = await ensureTts(nb.say); if (onStep) onStep(++i, need); }
    else delete nb.sayId;
    out.push(nb);
  }
  return out;
}
function ttsError(e) {
  console.error(e);
  if (e && (e.status === 403 || e.status === 400)) toast('안내 음성을 만들지 못했어요. API 키 설정을 확인해주세요');
  else toast('안내 음성을 만들지 못했어요. 잠시 뒤 다시 저장해주세요');
}
function ttOptions(selected, { none = true, inherit = false } = {}) {
  let o = '';
  if (inherit) o += `<option value="_inherit" ${selected === '_inherit' ? 'selected' : ''}>기간 규칙대로</option>`;
  if (none) o += `<option value="" ${selected === '' ? 'selected' : ''}>종 없음</option>`;
  o += S.timetables.map(t => `<option value="${h(t.id)}" ${t.id === selected ? 'selected' : ''}>${h(t.name)}</option>`).join('');
  return o;
}

// ── 시작 ─────────────────────────────────────
function inAppBrowser() { return /KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent); }

function renderNotConfigured() {
  root.innerHTML = `<div class="hero-page">
    <div class="logo">${I.logo}</div><h1>벨키퍼</h1>
    <div class="card stack"><b>Firebase 설정이 아직 없어요</b>
    <div class="small muted">js/firebase-config.js 파일에 Firebase 콘솔에서 복사한 값을 붙여넣은 뒤 다시 올려주세요. "업로드 순서 안내.txt" 6단계를 참고하세요.</div></div></div>`;
}

function renderLogin(errMsg) {
  root.innerHTML = `<div class="hero-page">
    <div class="logo">${I.logo}</div>
    <div class="stack tight"><h1>벨키퍼</h1><p class="sub">학교·학원·회사를 위한 자동 종소리</p></div>
    <div class="card stack">
      ${inAppBrowser() ? `<div class="banner warn">카카오톡 같은 앱 안의 브라우저에서는 구글 로그인이 막혀요. 오른쪽 위 메뉴에서 <b>다른 브라우저로 열기</b>를 눌러주세요.</div>` : ''}
      <button class="btn primary lg block" data-act="login">Google 계정으로 시작하기</button>
      ${errMsg ? `<div class="small" style="color:var(--danger)">${h(errMsg)}</div>` : ''}
      <div class="small muted">관리자만 로그인해요. 종을 울릴 기기는 로그인 없이 연결 번호로 연결해요.</div>
    </div>
    <div class="row" style="gap:18px;justify-content:center"><a class="small" href="index.html">← 벨키퍼 홈</a><a class="small" href="play.html">이 기기를 재생기로 쓰기 →</a></div>
  </div>`;
}

async function doLogin() {
  const provider = new F.GoogleAuthProvider();
  try {
    await F.signInWithPopup(F.auth, provider);
  } catch (e) {
    if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
      await F.signInWithRedirect(F.auth, provider);
    } else if (e && e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
      renderLogin('로그인하지 못했어요. 잠시 뒤 다시 시도해주세요.');
      console.error(e);
    }
  }
}

async function loadSpaces() {
  const q = F.query(F.collection(F.db, 'spaces'), F.where('adminUids', 'array-contains', S.user.uid));
  const snap = await F.getDocs(q);
  S.spaces = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  S.spaces.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ko'));
  await loadInvites();
}
const myEmail = () => String((S.user && S.user.email) || '').toLowerCase();
const myName = () => String((S.user && (S.user.displayName || S.user.email)) || '').slice(0, 40);
async function loadInvites() {
  S.invites = [];
  if (!myEmail()) return;
  try {
    const snap = await F.getDocs(F.query(F.collection(F.db, 'spaces'), F.where('inviteEmails', 'array-contains', myEmail())));
    S.invites = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(s => !(s.adminUids || []).includes(S.user.uid));
  } catch (e) { console.warn(e); }
}
function invitesHtml() {
  if (!S.invites.length) return '';
  return `<div class="card stack" style="text-align:left">
    <div class="small bold brass">관리자 초대가 왔어요</div>
    ${S.invites.map(s => `<div class="row"><div class="grow"><div class="bold">${h(s.name)}</div>
      <div class="small muted">${h((SPACE_TYPES.find(t => t.id === s.type) || {}).label || '')}</div></div>
      <button class="btn" data-act="invite-decline" data-id="${h(s.id)}">거절</button>
      <button class="btn primary" data-act="invite-accept" data-id="${h(s.id)}">수락</button></div>`).join('')}
  </div>`;
}
async function acceptInvite(id) {
  await F.updateDoc(F.doc(F.db, 'spaces', id), {
    adminUids: F.arrayUnion(S.user.uid),
    inviteEmails: F.arrayRemove(myEmail()),
    [`admins.${S.user.uid}`]: { email: myEmail(), name: myName() }
  });
  await loadSpaces();
  closeSheet();
  S.tab = 'today';
  openSpace(id);
  toast('관리자로 함께하게 됐어요');
}
async function declineInvite(id) {
  await F.updateDoc(F.doc(F.db, 'spaces', id), { inviteEmails: F.arrayRemove(myEmail()) });
  await loadInvites();
  if (S.spaceId) { renderSheet(); render(); } else if (!S.spaces.length) renderOnboarding(true);
}
// 예전에 만든 공간이라 관리자 정보(이름·이메일)가 없으면 내 정보를 채워 둠
function ensureMyAdminInfo() {
  const sp = S.space;
  if (!sp || !(sp.adminUids || []).includes(S.user.uid)) return;
  const me = (sp.admins || {})[S.user.uid];
  if (me && me.email === myEmail()) return;
  if (S._healed === sp.id) return;
  S._healed = sp.id;
  F.updateDoc(spaceRef(), { [`admins.${S.user.uid}`]: { email: myEmail(), name: myName() } }).catch(e => console.warn(e));
}

function stopSubs() { S.unsub.forEach(u => { try { u(); } catch (e) { /* 무시 */ } }); S.unsub = []; }

function openSpace(id) {
  stopSubs();
  S.spaceId = id;
  localStorage.setItem(LS.space, id);
  S.space = S.spaces.find(s => s.id === id) || null;
  S.timetables = []; S.rules = []; S.sounds = []; S.devices = [];
  S.ready = false;
  const onErr = e => { console.error(e); toast('데이터를 불러오지 못했어요'); };
  S.unsub.push(F.onSnapshot(spaceRef(), d => { if (d.exists()) { S.space = { id: d.id, ...d.data() }; ensureMyAdminInfo(); render(); if (S.sheet && S.sheet.type === 'admins') renderSheet(); } }, onErr));
  S.unsub.push(F.onSnapshot(sub('timetables'), q => { S.timetables = q.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => millis(a.createdAt) - millis(b.createdAt)); S.ready = true; render(); }, onErr));
  S.unsub.push(F.onSnapshot(sub('rules'), q => { S.rules = q.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, onErr));
  S.unsub.push(F.onSnapshot(sub('sounds'), q => { S.sounds = q.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => millis(a.createdAt) - millis(b.createdAt)); render(); }, onErr));
  S.unsub.push(F.onSnapshot(sub('devices'), q => { S.devices = q.docs.map(d => ({ id: d.id, ...d.data() })); render(); }, onErr));
  render();
  if (S.shareParam) { const code = S.shareParam; S.shareParam = null; history.replaceState(null, '', location.pathname); openImport(code); }
}

// ── 공간 만들기 ─────────────────────────────────────
let onboard = { name: '', type: 'school', level: 'elem' };
function renderOnboarding(firstTime = true) {
  const html = `<div class="${firstTime ? 'hero-page' : 'stack loose'}" style="${firstTime ? '' : 'text-align:left'}">
    ${firstTime ? `<div class="logo">${I.logo}</div><div class="stack tight"><h1 style="font-size:28px">공간 만들기</h1><p class="sub">종을 울릴 학교·학원·회사를 만들어요</p></div>${invitesHtml()}` : ''}
    <div class="card stack loose" style="${firstTime ? '' : 'border:0;padding:0;background:none'}">
      <label class="field"><span>이름</span><input class="input" id="ob-name" maxlength="40" placeholder="예: 다니엘 아마츠" value="${h(onboard.name)}"></label>
      <div class="field"><span>종류</span><div class="type-grid">
        ${SPACE_TYPES.map(t => `<button class="chip ${onboard.type === t.id ? 'on' : ''}" data-act="ob-type" data-id="${t.id}">${t.label}</button>`).join('')}
      </div></div>
      ${onboard.type === 'school' ? `<div class="field"><span>학교급 (샘플 일과표)</span><div class="chips">
        ${[['elem', '초등'], ['middle', '중학교'], ['high', '고등학교']].map(([id, l]) => `<button class="chip ${onboard.level === id ? 'on' : ''}" data-act="ob-level" data-id="${id}">${l}</button>`).join('')}
      </div></div>` : ''}
      <div class="small muted">종류에 맞는 샘플 일과표와 요일 패턴을 넣어 드려요. 나중에 얼마든지 바꿀 수 있어요.</div>
      <button class="btn primary lg block" data-act="ob-create">만들기</button>
      ${firstTime ? '' : '<button class="btn block" data-act="sheet-close">취소</button>'}
    </div>
    ${firstTime ? `<button class="btn ghost" data-act="logout">다른 계정으로 로그인</button>` : ''}
  </div>`;
  if (firstTime) root.innerHTML = html;
  return html;
}

async function createSpace() {
  const name = (document.getElementById('ob-name').value || '').trim();
  if (!name) { toast('이름을 넣어주세요'); return; }
  onboard.name = name;
  const btn = document.querySelector('[data-act="ob-create"]');
  if (btn) { btn.disabled = true; btn.textContent = '만드는 중…'; }
  try {
    const ref = F.doc(F.collection(F.db, 'spaces'));
    await F.setDoc(ref, {
      name, type: onboard.type, timezone: 'Asia/Seoul', ownerUid: S.user.uid, adminUids: [S.user.uid],
      plan: 'free', createdAt: F.serverTimestamp(),
      admins: { [S.user.uid]: { email: myEmail(), name: myName() } }, inviteEmails: []
    });
    const st = starterFor(onboard.type, onboard.level);
    const batch = F.writeBatch(F.db);
    const idMap = {};
    st.ids.forEach((tid, i) => {
      const tpl = templateById(tid);
      const tRef = F.doc(F.collection(F.db, 'spaces', ref.id, 'timetables'));
      idMap[tid] = tRef.id;
      batch.set(tRef, { name: tpl.name, bells: cleanBells(tpl.bells), createdAt: F.Timestamp.fromMillis(Date.now() + i), updatedAt: F.serverTimestamp() });
    });
    const today = todayKey(Date.now(), 'Asia/Seoul');
    const wd = st.weekday ? idMap[st.weekday] : '';
    const days = { 0: '', 1: wd, 2: wd, 3: wd, 4: wd, 5: st.friday ? idMap[st.friday] : '', 6: st.saturday ? idMap[st.saturday] : '' };
    batch.set(F.doc(F.collection(F.db, 'spaces', ref.id, 'rules')), {
      kind: 'period', name: '기본', start: today, end: addDays(today, 364), days, createdAt: F.serverTimestamp(), by: S.user.uid
    });
    await batch.commit();
    S.sheet = null; renderSheet();
    await loadSpaces();
    S.tab = 'today';
    openSpace(ref.id);
    toast('공간을 만들었어요');
  } catch (e) {
    fail(e, '공간을 만들지 못했어요');
    if (btn) { btn.disabled = false; btn.textContent = '만들기'; }
  }
}

// ── 화면 뼈대 ─────────────────────────────────────
const TABS = [['today', '오늘', I.today], ['calendar', '달력', I.calendar], ['timetables', '일과표', I.list], ['sounds', '종소리', I.bell], ['devices', '기기', I.device]];

function sideHtml(sp) {
  const on = S.devices.filter(deviceOnline).length;
  return `<aside class="side" aria-label="메뉴">
    <div class="side-brand">${I.logo}<span>벨키퍼</span></div>
    <button class="side-space" data-act="space-menu" aria-label="공간 바꾸기">
      <span><small>${h((SPACE_TYPES.find(t => t.id === sp.type) || {}).label || '공간')}</small><b>${h(sp.name || '')}</b></span>${I.down}</button>
    <nav class="side-nav">
      ${TABS.map(([id, l, ic]) => `<button class="nav ${S.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${ic}<span>${l}</span>${id === 'devices' && S.devices.length ? `<span class="cnt">● ${on}</span>` : ''}</button>`).join('')}
    </nav>
    <button class="side-foot" data-act="account" aria-label="내 계정·로그아웃">
      <span class="avatar">${h((myName() || '?').slice(0, 1))}</span>
      <span class="grow"><b class="ellipsis" style="display:block">${h(myName())}</b><small>v${h(APP_VERSION)}${S.update && S.update.isNew ? ' · 새 버전 있음' : ''}</small></span>
    </button>
  </aside>`;
}

function render() {
  if (!S.user || !S.spaceId) return;
  const sp = S.space || {};
  const views = { today: viewToday, calendar: viewCalendar, timetables: viewTimetables, sounds: viewSounds, devices: viewDevices };
  const titles = { today: sp.name || '', calendar: '달력', timetables: '일과표', sounds: '종소리', devices: '기기' };
  const scrollY = window.scrollY;
  root.innerHTML = `<div class="shell">
    ${sideHtml(sp)}
    <div class="main-wrap">
      <nav class="tabbar" aria-label="메뉴"><div class="tabbar-inner">
        ${TABS.map(([id, l, ic]) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}">${ic}${l}</button>`).join('')}
      </div></nav>
      <header class="topbar">
        <div class="stack tight" style="gap:0;min-width:0">
          <div class="small muted">${S.tab === 'today' ? `${h(koreanDate(todayKey(Date.now(), tz())))}` : h(sp.name || '')}</div>
          <h1>${h(titles[S.tab])}</h1>
        </div>
        <div class="top-actions">
          ${S.tab === 'today' ? `<button class="btn soft hide-phone" data-act="ring-now">지금 울리기</button>` : ''}
          <button class="icon-btn top-space" data-act="space-menu" aria-label="공간 바꾸기·설정">${I.down}</button>
          <button class="avatar-btn top-account" data-act="account" aria-label="내 계정·로그아웃" title="${h(myEmail())}">${h((myName() || '?').slice(0, 1))}</button>
        </div>
      </header>
      <main class="main">${S.update && S.update.isNew ? `<div class="banner row between wrap"><span><b>새 버전 ${h(S.update.latest)}</b>이 나왔어요. (지금 ${h(S.update.current)})</span><button class="btn primary sm" data-act="reload">새로 고침</button></div>` : ''}${S.ready ? views[S.tab]() : '<div class="muted center" style="padding:40px">불러오는 중…</div>'}</main>
    </div>
  </div>`;
  window.scrollTo(0, scrollY);
  if (S.tab === 'devices' && S.pair) drawQr();
}

// ── 오늘 ─────────────────────────────────────
function weekStrip(key) {
  const dow = dowOfKey(key);
  const mon = addDays(key, -((dow + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const k = addDays(mon, i);
    const d = dowOfKey(k);
    const r = resolveDay(k, S.rules);
    if ((d === 0 || d === 6) && !r.ttId) continue;
    const name = r.ttId ? ((ttById(r.ttId) || {}).name || '') : '종 없음';
    days.push(`<div class="d ${k === key ? 'today' : ''}">${DOW_LABELS[d]}<b class="num">${parseKey(k).d}</b><span class="wraptext" style="font-size:11px;line-height:1.25">${h(name.replace(/\s*\(.+\)$/, ''))}</span></div>`);
  }
  return `<div class="week">${days.join('')}</div>`;
}
function upcomingExceptions(key) {
  return sortRules(S.rules).filter(r => r.kind !== 'period' && (r.kind === 'day' ? r.date >= key : r.end >= key))
    .sort((a, b) => (a.date || a.start).localeCompare(b.date || b.start)).slice(0, 4);
}
function viewToday() {
  const now = Date.now();
  const key = todayKey(now, tz());
  const day = bellsForDay(key, S.rules, S.timetables, tz());
  const next = upcomingBells(now, S.rules, S.timetables, tz(), 14)[0];
  const online = S.devices.filter(deviceOnline);
  const offline = S.devices.filter(d => !deviceOnline(d));
  const todayRule = S.rules.find(r => r.kind === 'day' && r.date === key);
  const nextIdx = next && next.dateKey === key ? day.bells.findIndex(b => b.key === next.key) : -1;
  const prev = day.bells.filter(b => b.at <= now).pop();
  let pct = 0;
  if (next) { const st = prev ? prev.at : Math.max(next.at - 3600000, now - 1); pct = Math.max(0, Math.min(100, (now - st) / (next.at - st) * 100)); }
  const passed = day.bells.filter(b => b.at <= now).length;

  let banner = '';
  if (!S.devices.length) banner = `<button class="banner" style="border:0;text-align:left" data-act="tab" data-id="devices"><b>재생기를 연결해야 종이 울려요.</b> 기기 탭에서 연결 번호를 만들어 주세요 →</button>`;
  else if (offline.length) banner = `<div class="banner warn"><b>재생기 ${offline.length}대가 응답이 없어요.</b> ${h(offline.map(d => d.name).join(', '))} — 기기가 켜져 있고 화면이 열려 있는지 확인해주세요.</div>`;

  const ex = upcomingExceptions(key);
  return `${banner}
  <div class="cols">
    <div class="c-main">
      <section class="hero" aria-label="다음 종">
        <div class="row between"><span class="lab">다음 종</span><span class="small muted">${next ? `<span id="next-remain" data-at="${next.at}">${fmtRemainWords(next.at - now)}</span>` : ''}</span></div>
        ${next ? `
          <div class="row wrap" style="align-items:baseline;gap:4px 14px"><span class="big num">${h(next.time)}</span><span class="what">${h(next.label || '종')}</span></div>
          <div class="muted">${h(soundName(next.soundId))}${next.say ? ` · "${h(next.say)}"` : ''}${next.dateKey !== key ? ` · ${h(koreanDate(next.dateKey))}` : ''}</div>
          ${next.dateKey === key ? `<div class="bar"><div style="width:${pct.toFixed(0)}%"></div></div>` : ''}
        ` : `<div class="what">앞으로 2주 동안 울릴 종이 없어요</div><div class="muted">달력에서 규칙을 확인해주세요.</div>`}
        <div class="btns">
          <button class="btn gold" data-act="ring-now">지금 울리기</button>
          ${todayRule && !todayRule.ttId
            ? `<button class="btn" data-act="today-undo" data-id="${h(todayRule.id)}">오늘 끄기 취소</button>`
            : `<button class="btn" data-act="today-off">오늘만 끄기</button>`}
        </div>
      </section>
      <div class="cols">
        <section class="card stack" style="flex:1 1 220px;min-width:0">
          <div class="row between"><span class="card-title">재생기</span><span class="small ${online.length ? 'status-ok' : 'muted'}">${online.length}대 정상</span></div>
          ${S.devices.length ? S.devices.map(d => `<button class="row" style="background:none;border:0;padding:0;text-align:left;width:100%" data-act="device" data-id="${h(d.id)}"><span class="dot ${deviceOnline(d) ? 'ok' : 'off'}"></span><span class="grow wraptext">${h(d.name || '재생기')}</span><span class="small muted">${deviceOnline(d) ? ago(millis(d.lastSeen)) : '꺼짐'}</span></button>`).join('')
            : '<div class="small muted">아직 연결된 재생기가 없어요</div>'}
        </section>
        <section class="card stack" style="flex:1 1 280px;min-width:0">
          <span class="card-title">이번 주</span>
          ${weekStrip(key)}
        </section>
      </div>
      ${ex.length ? `<section class="card stack">
        <span class="card-title">다가오는 예외</span>
        ${ex.map(r => `<button class="row wrap" style="background:none;border:0;padding:0;text-align:left" data-act="rule-edit" data-id="${h(r.id)}"><span class="badge gold">${RULE_KINDS[r.kind].label}</span><span style="font-weight:500">${h(ruleLabel(r))}</span><span class="small muted">${h(ruleSummary(r))}</span></button>`).join('')}
      </section>` : ''}
    </div>
    <section class="card c-side" style="padding:14px 8px;gap:2px">
      <div class="row between" style="padding:0 10px 6px;align-items:baseline"><span class="card-title">오늘 울릴 종</span><span class="small muted">${day.bells.length ? `${day.bells.length}개 중 ${passed}개 지남` : ''}</span></div>
      <div class="small muted" style="padding:0 10px 6px">${day.tt ? `${h(day.tt.name)} · ` : ''}${day.rule ? `${RULE_KINDS[day.rule.kind].label} 규칙: ${h(ruleLabel(day.rule))}` : '적용된 규칙이 없어요'}</div>
      ${day.bells.length ? day.bells.map((b, i) => {
        const cls = i === nextIdx ? 'next' : (b.at <= now ? 'past' : '');
        return `<div class="bell-row ${cls}"><div class="t num">${h(b.time)}</div>
          <div class="grow"><div style="font-weight:500">${h(b.label || '종')}</div><div class="small muted">${h(soundName(b.soundId))}${b.say ? ` · "${h(b.say)}"` : ''}${b.bgmId ? ` · 배경음악 ${h(soundName(b.bgmId))}` : ''}</div></div>
          <button class="icon-btn sm soft" data-act="preview" data-tt="${h(day.tt.id)}" data-i="${b.idx}" aria-label="${h(b.label)} 미리 듣기">${I.play}</button></div>`;
      }).join('') : `<div class="muted center" style="padding:24px">오늘은 종이 없어요</div>`}
    </section>
  </div>`;
}

// ── 달력 ─────────────────────────────────────
function viewCalendar() {
  const now = Date.now();
  const tk = todayKey(now, tz());
  if (!S.cal) { const p = parseKey(tk); S.cal = { y: p.y, m: p.m }; }
  const { y, m } = S.cal;
  const first = dateKey(y, m, 1);
  const startDow = dowOfKey(first);
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  let cells = '';
  for (let i = 0; i < startDow; i++) cells += '<div class="cell blank"></div>';
  for (let d = 1; d <= daysIn; d++) {
    const key = dateKey(y, m, d);
    const r = resolveDay(key, S.rules);
    let cls = '', lbl = '';
    if (r.rule) {
      if (!r.ttId) cls = r.rule.kind === 'day' ? 'none-day' : '';
      else cls = r.rule.kind === 'day' ? 'day' : (r.rule.kind === 'week' ? 'week' : 'tt');
      if (r.rule.kind === 'day') lbl = r.rule.name || (r.ttId ? (ttById(r.ttId) || {}).name || '' : '종 없음');
    }
    cells += `<button class="cell ${cls} ${key === tk ? 'today' : ''}" data-act="date" data-key="${key}" aria-label="${h(koreanDate(key))}"><span class="num">${d}</span>${lbl ? `<span class="lbl">${h(lbl)}</span>` : ''}</button>`;
  }
  const rules = sortRules(S.rules);
  return `<div class="cols">
  <div class="card stack c-main">
    <div class="cal-head">
      <button class="icon-btn" data-act="cal-move" data-d="-1" aria-label="이전 달">${I.left}</button>
      <div class="bold" style="font-size:18px">${y}년 ${m}월</div>
      <button class="icon-btn" data-act="cal-move" data-d="1" aria-label="다음 달">${I.right}</button>
    </div>
    <div class="cal">${DOW_LABELS.map(d => `<div class="dow">${d}</div>`).join('')}${cells}</div>
    <div class="legend">
      <span><span class="sw" style="background:#fff;border:1px solid var(--line-2)"></span>기간 규칙</span>
      <span><span class="sw" style="background:var(--brass-tint)"></span>특정 주간</span>
      <span><span class="sw" style="background:var(--ink)"></span>특정일</span>
      <span><span class="sw" style="background:var(--line)"></span>종 없음</span>
    </div>
  </div>
  <div class="c-side">
    <div class="section-title" style="margin-top:0"><h2>적용 규칙</h2><span class="tiny muted">위에 있을수록 먼저 적용</span></div>
    <div class="list">
      ${rules.map((r, i) => `<button class="item" data-act="rule-edit" data-id="${h(r.id)}">
        <div class="rank">${i + 1}</div>
        <div class="grow"><div class="tiny bold brass">${RULE_KINDS[r.kind].label}</div>
          <div style="font-weight:500">${h(ruleLabel(r))}</div>
          <div class="small muted">${h(ruleSummary(r))}</div></div></button>`).join('') || '<div class="card muted center">규칙이 없어요. 규칙이 있어야 종이 울려요.</div>'}
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
        <button class="btn dashed" data-act="rule-new">+ 규칙 추가</button>
        <button class="btn dashed" data-act="holidays">공휴일 넣기</button></div>
    </div>
  </div></div>`;
}
function ruleSummary(r) {
  if (r.kind === 'day') return r.ttId ? (ttById(r.ttId) || {}).name || '(지워진 일과표)' : '종 없음';
  const days = r.days || {};
  const parts = [];
  for (const d of [1, 2, 3, 4, 5, 6, 0]) {
    const v = days[d];
    if (v === undefined || v === '_inherit') continue;
    parts.push(`${DOW_LABELS[d]} ${v ? (ttById(v) || {}).name || '?' : '없음'}`);
  }
  return parts.join(' · ') || '모든 요일 기간 규칙대로';
}

// ── 일과표 목록 ─────────────────────────────────────
function viewTimetables() {
  const used = id => S.rules.some(r => r.ttId === id || Object.values(r.days || {}).includes(id));
  const clip = readClip();
  return `<div class="small muted">종 목록을 일과표로 저장해 두고, 달력 규칙에서 요일·기간별로 골라 써요.</div>
  ${clip ? `<div class="clipbar"><b>복사한 종 ${clip.bells.length}개</b><span class="muted grow">일과표를 열어 [붙여넣기]로 넣을 수 있어요</span><button class="btn sm" data-act="clip-clear">비우기</button></div>` : ''}
  <div class="grid-auto">
    ${S.timetables.map(t => {
      const b = (t.bells || []);
      return `<button class="item" data-act="tt-edit" data-id="${h(t.id)}" style="align-items:flex-start">
        <div class="grow"><div class="bold">${h(t.name)}</div>
        <div class="small muted">${b.length ? `${b.length}개 · ${h(b[0].time)} ~ ${h(b[b.length - 1].time)}` : '종 없음'}</div></div>
        ${used(t.id) ? '<span class="badge gold">사용 중</span>' : '<span class="badge">안 씀</span>'}</button>`;
    }).join('') || '<div class="card muted center">일과표가 없어요</div>'}
    <button class="btn dashed" style="min-height:68px" data-act="tt-new">+ 새 일과표</button>
  </div>
  <div class="row wrap">
    <button class="btn" data-act="library" data-kind="timetable">공유 라이브러리</button>
    <button class="btn" data-act="import-code">공유 코드로 가져오기</button>
  </div>`;
}

// ── 종소리 ─────────────────────────────────────
const CAT_GROUPS = [{ id: 'school', label: '학교·수업' }, { id: 'music', label: '멜로디·알림' }, { id: 'jingle', label: '징글·효과음' }, { id: 'bgm', label: '배경음악' }];
function viewSounds() {
  const cat = S.soundCat || 'start';
  const ups = S.sounds.filter(s => s.kind !== 'tts');
  const tts = S.sounds.filter(s => s.kind === 'tts');
  const secTxt = s => s.sec >= 60 ? `${Math.floor(s.sec / 60)}분 ${Math.round(s.sec % 60)}초` : `${Math.max(1, Math.round(s.sec))}초`;
  return `<div class="cols">
  <div class="c-main">
    <div class="section-title" style="margin-top:0"><h2>기본 종소리 ${BUILTIN_SOUNDS.length}종</h2><span class="tiny muted">무료 · 인터넷 없이도 울림</span></div>
    <div class="cat-board" role="tablist" aria-label="종소리 종류">${CAT_GROUPS.map(g => `<div class="cat-group"><div class="cat-g-label">${h(g.label)}</div>
      <div class="cat-grid">${SOUND_CATS.filter(c => c.group === g.id).map(c => `<button class="cat-tile ${cat === c.id ? 'on' : ''}" role="tab" aria-selected="${cat === c.id}" data-act="sound-cat" data-id="${c.id}"><span>${h(c.label)}</span><b class="num">${BUILTIN_SOUNDS.filter(s => s.cat === c.id).length}</b></button>`).join('')}</div></div>`).join('')}</div>
    <div class="small bold brass" style="margin-top:4px">${h((SOUND_CATS.find(c => c.id === cat) || {}).label || '')}</div>
    ${cat === 'bgm' ? '<div class="small muted">종소리 대신 틀거나(최대 재생 시간으로 길이 조절), 안내 방송 뒤에 작게 깔 수 있어요.</div>' : ''}
    ${(cat === 'bgm' ? BGM_MOODS.map(m => ({ label: m.label, items: BUILTIN_SOUNDS.filter(s => s.cat === 'bgm' && s.mood === m.id) }))
      : [{ label: '', items: BUILTIN_SOUNDS.filter(s => s.cat === cat) }]).map(g => `${g.label ? `<div class="small bold brass">${h(g.label)}</div>` : ''}
    <div class="grid-auto">${g.items.map(s => `<div class="item">
      <div class="grow"><div style="font-weight:500">${h(s.name)}</div><div class="small muted">${h(s.desc)} · ${secTxt(s)}</div></div>
      <button class="icon-btn sm soft" data-act="play-sound" data-id="${s.id}" aria-label="${h(s.name)} 듣기">${I.play}</button></div>`).join('')}</div>`).join('')}
    <div class="row wrap"><button class="btn ghost" data-act="stop-all">재생 멈추기</button></div>
    <details class="small muted"><summary>음원 출처</summary>
      <p style="line-height:1.7">· 학교종·차임·종·멜로디·알림·경보·명상: 벨키퍼가 직접 합성한 소리<br>
      · 징글·전자음: Kenney (kenney.nl) — CC0<br>
      · 배경음악: OpenGameArt.org 작가 Joth, Tozan, cynicmusic, wipics, Centurion_of_war, haruta, Cakeflaps, Komiku, Pro Sensory, TAD, Yoiyami, Samza, Wolfgang_, nene, TinyWorlds, congusbongus, Zane Little Music, celestialghost8 — CC0<br>
      모두 저작권 걱정 없이 무료로 쓸 수 있어요.</p></details>
  </div>
  <div class="c-side">
    <section class="card stack">
      <div class="row between"><div class="small bold brass">안내 음성</div><button class="btn soft sm" data-act="tts-settings">목소리 설정</button></div>
      <div style="font-weight:500">${h(ttsSummary())}</div>
      <div class="small muted">일과표의 "안내 문구"를 이 목소리로 읽어요.</div>
    </section>
    <div class="section-title" style="margin-top:0"><h2>올린 소리·음악</h2><span class="tiny muted">${ups.length}개</span></div>
    <div class="list">
      ${ups.map(s => `<div class="item">
        <div class="grow"><div class="wraptext" style="font-weight:500">${h(s.name)}</div>
        <div class="small muted">${s.linked ? '공유받은 소리' : `${fmtDur(s.duration)} · ${fmtSize(s.size || 0)}`}</div></div>
        <button class="icon-btn sm soft" data-act="play-sound" data-id="${h(s.id)}" aria-label="${h(s.name)} 듣기">${I.play}</button>
        <button class="icon-btn sm soft" data-act="sound-menu" data-id="${h(s.id)}" aria-label="${h(s.name)} 메뉴">${I.down}</button></div>`).join('')}
      <button class="btn dashed" data-act="upload">+ 소리·음악 파일 올리기</button>
    </div>
    <div class="tiny muted">MP3·M4A·WAV·OGG, 파일 하나 20MB까지.</div>
    <div class="row wrap">
      <button class="btn" data-act="library" data-kind="sound">공유 라이브러리</button>
      <button class="btn" data-act="import-code">공유 코드로 가져오기</button>
    </div>
    ${tts.length ? `<div class="section-title"><h2>만들어 둔 안내 음성</h2><span class="tiny muted">${tts.length}개</span></div>
    <div class="list">${tts.map(s => `<div class="item"><div class="grow"><div class="wraptext">${h(s.ttsText || s.name)}</div><div class="small muted">${h(voiceLabel(s.ttsVoice || ''))}</div></div>
      <button class="icon-btn sm soft" data-act="play-sound" data-id="${h(s.id)}" aria-label="듣기">${I.play}</button></div>`).join('')}
      <button class="btn" data-act="tts-cleanup">안 쓰는 안내 음성 지우기</button></div>` : ''}
  </div></div>`;
}

// ── 기기 ─────────────────────────────────────
function playUrlBase() { return new URL('play.html', location.href).href.replace(/\?.*$/, ''); }
function viewDevices() {
  const p = S.pair && S.pair.expiresAt > Date.now() ? S.pair : null;
  return `<div class="cols"><div class="c-main">
  <div class="section-title" style="margin-top:0"><h2>재생기 ${S.devices.length}대</h2><span class="tiny muted">관리자 ${(S.space && S.space.adminUids || []).length}명</span></div>
  <div class="list">
    ${S.devices.map(d => {
      const on = deviceOnline(d);
      const old = d.version && S.update && cmpVer(S.update.latest, d.version) > 0;
      const detail = (on ? `${d.status === 'ready' ? '재생 중' : '재생 시작 버튼 대기'} · ${ago(millis(d.lastSeen))} 응답` : `${ago(millis(d.lastSeen))} 마지막 응답`)
        + ` · 화면 ${h(styleName(d.display || d.mode))}`
        + (d.version ? ` · v${d.version}${old ? ' (업데이트 필요)' : ''}` : '');
      return `<button class="item" data-act="device" data-id="${h(d.id)}"><span class="dot ${on ? 'ok' : 'off'}"></span>
        <div class="grow"><div style="font-weight:500">${h(d.name || '재생기')}</div><div class="small muted">${detail}</div></div>
        <span class="small bold" style="color:${on ? 'var(--ok)' : 'var(--muted)'}">${on ? '정상' : '꺼짐'}</span></button>`;
    }).join('') || '<div class="card muted center">아직 연결된 재생기가 없어요</div>'}
  </div>
  <div class="card stack small">
    <b>재생기 세팅 요령</b>
    <div class="muted" style="line-height:1.7">· 충전기를 꽂아 두고, 화면 꺼짐 시간을 "안 함"으로<br>· 절전 모드를 끄고, 크롬을 배터리 최적화에서 빼기<br>· 홈 화면에 추가하면 앱처럼 전체 화면으로 열려요<br>· 아이들이 못 건드리게: 안드로이드 "앱 고정", 아이패드 "사용법 유도된 접근"<br>· 앞으로 7일 일정을 기기에 저장해 두어서, 인터넷이 잠깐 끊겨도 기본 종소리는 제시간에 울려요</div>
  </div></div>
  <section class="card dark stack c-side">
    <div class="bold" style="font-size:16px">재생기 추가</div>
    ${p ? `
      <div class="code-boxes num" aria-label="연결 번호 ${p.code}">${p.code.slice(0, 3).split('').map(c => `<span>${c}</span>`).join('')}<span class="gap"></span>${p.code.slice(3).split('').map(c => `<span>${c}</span>`).join('')}</div>
      <div class="qr" id="qr"></div>
      <div class="small muted" style="line-height:1.7">종을 울릴 PC·태블릿에서 QR을 찍거나 <b style="color:var(--gold)">${h(playUrlBase())}</b> 를 열고 번호를 넣으세요. 로그인은 필요 없어요.</div>
      <div class="tiny muted"><span id="pair-remain" data-at="${p.expiresAt}">${fmtRemain(p.expiresAt - Date.now())}</span> 뒤 번호가 사라져요</div>
      <div class="row wrap"><button class="btn" style="background:transparent;color:#F4F5F2;border-color:#3A4842" data-act="copy" data-text="${h(playUrlBase() + '?code=' + p.code)}">주소 복사</button>
      <button class="btn" style="background:transparent;color:#F4F5F2;border-color:#3A4842" data-act="pair-new">새 번호</button></div>`
    : `<div class="small muted">연결 번호를 만들면 10분 동안 쓸 수 있어요.</div>
      <button class="btn gold lg" data-act="pair-new">연결 번호 만들기</button>`}
  </section></div>`;
}
async function drawQr() {
  const el = document.getElementById('qr');
  if (!el || !S.pair) return;
  if (!window.QRCode) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      s.onload = res; s.onerror = rej; document.head.appendChild(s);
    }).catch(() => null);
  }
  if (!window.QRCode || !document.getElementById('qr')) return;
  el.innerHTML = '';
  new window.QRCode(el, { text: playUrlBase() + '?code=' + S.pair.code, width: 140, height: 140, correctLevel: window.QRCode.CorrectLevel.M });
}
async function newPairCode() {
  for (let i = 0; i < 4; i++) {
    const code = randomCode(6, '0123456789');
    const expiresAt = Date.now() + 10 * 60 * 1000;
    try {
      await F.setDoc(F.doc(F.db, 'pairCodes', code), {
        spaceId: S.spaceId, createdBy: S.user.uid, createdAt: F.serverTimestamp(), expiresAt: F.Timestamp.fromMillis(expiresAt)
      });
      S.pair = { code, expiresAt };
      render();
      return;
    } catch (e) { if (i === 3) fail(e, '연결 번호를 만들지 못했어요'); }
  }
}

// ── 시트 ─────────────────────────────────────
function openSheet(sheet) { S.sheet = sheet; renderSheet(); }
// 저장이 끝났을 때, 그사이 사용자가 다른 창을 열었다면 그 창은 그대로 둠
function closeIf(sh) { if (S.sheet === sh) closeSheet(); }
function closeSheet() { S.sheet = null; renderSheet(); stopAll(); }
function sheetFrame(title, body, opts = {}) {
  return `<div class="sheet-back" data-act="sheet-back"><div class="sheet ${opts.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${h(title)}">
    <div class="sheet-head">${opts.back ? `<button class="icon-btn" data-act="${opts.back}" aria-label="뒤로">${I.left}</button>` : ''}<h3 class="grow">${h(title)}</h3>
    <button class="icon-btn" data-act="sheet-close" aria-label="닫기">${I.close}</button></div>${body}</div></div>`;
}
function renderSheet() {
  const sh = S.sheet;
  if (!sh) { sheetRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
  document.body.style.overflow = 'hidden';
  const fn = {
    'space-menu': sheetSpaceMenu, 'space-new': () => sheetFrame('새 공간', renderOnboarding(false)), 'space-edit': sheetSpaceEdit, 'admins': sheetAdmins, 'holidays': sheetHolidays, 'tts': sheetTts, 'account': sheetAccount,
    'ring': sheetRing, 'date': sheetDate, 'rule': sheetRule,
    'tt-new': sheetTtNew, 'tt-templates': sheetTemplates, 'tt-edit': sheetTtEdit,
    'share': sheetShare, 'import': sheetImport, 'library': sheetLibrary,
    'upload': sheetUpload, 'sound-menu': sheetSoundMenu, 'device': sheetDevice
  }[sh.type];
  const old = sheetRoot.querySelector('.sheet');
  const keep = old && renderSheet._type === sh.type ? old.scrollTop : 0;
  sheetRoot.innerHTML = fn ? fn(sh) : '';
  renderSheet._type = sh.type;
  if (keep) { const nw = sheetRoot.querySelector('.sheet'); if (nw) nw.scrollTop = keep; }
  const first = sheetRoot.querySelector('[autofocus]');
  if (first) first.focus();
}

function sheetSpaceMenu() {
  return sheetFrame('공간', `
    <div class="list">${S.spaces.map(s => `<button class="item" data-act="space-open" data-id="${h(s.id)}">
      <div class="grow"><div class="bold">${h(s.name)}</div><div class="small muted">${h((SPACE_TYPES.find(t => t.id === s.type) || {}).label || '')}</div></div>
      ${s.id === S.spaceId ? '<span class="badge dark">지금</span>' : ''}</button>`).join('')}
      <button class="btn dashed" data-act="space-new">+ 새 공간 만들기</button></div>
    ${invitesHtml()}
    <button class="btn block" data-act="admins">관리자 초대·관리</button>
    <button class="btn block" data-act="space-edit">이 공간 이름·종류 바꾸기</button>
    <div class="card small"><div class="muted">로그인: ${h(S.user.email || '')}</div><div class="muted">벨키퍼 ${APP_VERSION} · 무료 요금제</div></div>
    <button class="btn block danger" data-act="logout">로그아웃</button>`);
}
function sheetAdmins() {
  const sp = S.space || {};
  const info = sp.admins || {};
  const owner = sp.ownerUid;
  const iAmOwner = owner === S.user.uid;
  const invites = sp.inviteEmails || [];
  const link = new URL('index.html', location.href).href.replace(/\?.*$/, '');
  return sheetFrame('관리자', `
    <div class="list">${(sp.adminUids || []).map(uid => {
      const a = info[uid] || {};
      const me = uid === S.user.uid;
      return `<div class="item"><div class="grow"><div class="bold ellipsis">${h(a.name || (me ? myName() : '관리자'))}${me ? ' (나)' : ''}</div>
        <div class="small muted ellipsis">${h(a.email || (me ? myEmail() : ''))}</div></div>
        ${uid === owner ? '<span class="badge dark">소유자</span>' : ''}
        ${uid !== owner && (iAmOwner || me) ? `<button class="btn danger" data-act="admin-remove" data-id="${h(uid)}">${me ? '나가기' : '내보내기'}</button>` : ''}</div>`;
    }).join('')}</div>
    ${invites.length ? `<div class="stack tight"><div class="small bold">수락을 기다리는 초대</div>
      <div class="list">${invites.map(em => `<div class="item"><div class="grow ellipsis">${h(em)}</div>
        <button class="btn" data-act="invite-cancel" data-id="${h(em)}">취소</button></div>`).join('')}</div></div>` : ''}
    <label class="field"><span>초대할 구글 계정 이메일</span><input class="input" type="email" id="inv-email" autocomplete="off" placeholder="예: teacher@gmail.com"></label>
    <button class="btn primary lg block" data-act="invite-send">초대하기</button>
    <div class="small muted">초대받은 분이 <b>${h(link)}</b> 에 그 구글 계정으로 로그인하면 초대 수락 버튼이 보여요. 관리자는 일과표·달력·소리·기기를 모두 바꿀 수 있어요.</div>
    <button class="btn block" data-act="copy" data-text="${h(`[벨키퍼] '${sp.name || ''}' 관리자로 초대했어요. ${link} 에서 초대받은 구글 계정으로 로그인하면 수락할 수 있어요.`)}">초대 안내 문구 복사</button>`, { back: 'space-menu' });
}
function sheetTts(sh) {
  const d = sh.draft;
  const dv = deviceVoices();
  const pref = getDeviceVoicePref();
  const group = g => GOOGLE_VOICES.filter(v => v.gender === g && v.tier === 'HD').map(v => `<option value="${v.id}" ${d.voice === v.id ? 'selected' : ''}>${h(v.label)}</option>`).join('');
  return sheetFrame('안내 음성', `
    <div class="chips">
      <button class="chip ${d.mode === 'google' ? 'on' : ''}" data-act="tts-mode" data-id="google">Google 고음질</button>
      <button class="chip ${d.mode === 'device' ? 'on' : ''}" data-act="tts-mode" data-id="device">기기 음성</button>
    </div>
    ${d.mode === 'google' ? `
      ${ttsAvailable() ? '' : `<div class="banner warn">아직 Google 음성 API 키가 없어요. 안내서의 [안내 음성] 순서대로 키를 만들어 보내 주시면 다음 업데이트에 넣어 드릴게요. 그전까지는 기기 음성으로 읽어요.</div>`}
      <div class="small muted">한 번 만든 안내 음성은 파일로 저장돼서 모든 재생기에서 똑같은 목소리로 나와요. 매달 100만 자까지 무료라 보통은 비용이 들지 않아요.</div>
      <label class="field"><span>목소리 (Chirp 3 HD · 30종)</span><select class="input" data-t="voice">
        <optgroup label="여성">${group('여성')}</optgroup><optgroup label="남성">${group('남성')}</optgroup>
        <optgroup label="안내 방송 느낌 (WaveNet)">${GOOGLE_VOICES.filter(v => v.tier === 'WaveNet').map(v => `<option value="${v.id}" ${d.voice === v.id ? 'selected' : ''}>${h(v.label)}</option>`).join('')}</optgroup>
      </select></label>
      <label class="field"><span>말하기 속도 <b class="num" id="tts-rate-lab">${Number(d.rate).toFixed(1)}</b></span><input type="range" min="0.7" max="1.3" step="0.1" data-t="rate" value="${d.rate}"></label>
      <label class="field"><span>미리 들어볼 문구</span><input class="input" id="tts-sample" maxlength="80" value="점심시간입니다. 맛있게 드세요."></label>
      <button class="btn block" data-act="tts-preview" ${ttsAvailable() ? '' : 'disabled'}>${I.play} 미리 듣기</button>
    ` : `
      <div class="small muted">설정 없이 무료로 쓸 수 있어요. 대신 재생기마다 그 기기에 들어 있는 목소리로 읽어서, 기기에 따라 목소리가 달라요. 재생기 화면의 [설정]에서 목소리를 고를 수 있어요.</div>
      <label class="field"><span>이 기기의 한국어 목소리 (미리 듣기용)</span><select class="input" id="dv-voice">
        ${dv.length ? dv.map(v => `<option value="${h(v.voiceURI)}" ${pref.uri === v.voiceURI ? 'selected' : ''}>${h(v.name)}</option>`).join('') : '<option value="">기본 목소리</option>'}
      </select></label>
      <label class="field"><span>미리 들어볼 문구</span><input class="input" id="tts-sample" maxlength="80" value="점심시간입니다. 맛있게 드세요."></label>
      <button class="btn block" data-act="tts-preview-device">${I.play} 이 기기에서 미리 듣기</button>
    `}
    <button class="btn primary lg block" data-act="tts-save">저장</button>
    ${d.mode === 'google' && ttsAvailable() ? '<div class="tiny muted">목소리를 바꾸고 저장하면 모든 일과표의 안내 음성을 새 목소리로 다시 만들어요.</div>' : ''}`);
}
function sheetAccount() {
  return sheetFrame('내 계정', `
    <div class="card row"><div class="avatar">${h((myName() || '?').slice(0, 1))}</div>
      <div class="grow"><div class="bold ellipsis">${h(myName())}</div><div class="small muted ellipsis">${h(myEmail())}</div></div></div>
    <a class="btn block" href="index.html">벨키퍼 홈으로</a>
    <a class="btn block" href="play.html">이 기기를 재생기로 쓰기</a>
    <button class="btn block danger" data-act="logout">로그아웃</button>
    ${versionHtml()}`);
}
function versionHtml() {
  const u = S.update;
  const hist = (u && u.info && u.info.history) || [];
  return `<div class="card stack tight">
    <div class="row between"><div><span class="small muted">지금 버전</span> <b class="num">${h(APP_VERSION)}</b></div>
      ${!u ? '<span class="small muted">확인 중…</span>' : u.isNew ? `<button class="btn primary" data-act="reload">${h(u.latest)}로 업데이트</button>` : '<span class="badge gold">최신 버전</span>'}</div>
    ${hist.length ? `<details><summary class="small bold">업데이트 내역</summary>${hist.slice(0, 8).map(v => `<div class="small" style="margin-top:8px"><b class="num">${h(v.version)}</b> <span class="muted">${h(v.date || '')}</span>
      <div class="muted" style="line-height:1.6">${(v.notes || []).map(n => '· ' + h(n)).join('<br>')}</div></div>`).join('')}</details>` : ''}
  </div>`;
}
function sheetHolidays(sh) {
  const tk = todayKey(Date.now(), tz());
  const days = new Set(S.rules.filter(r => r.kind === 'day').map(r => r.date));
  const list = KR_HOLIDAYS.filter(x => x.date >= tk);
  const last = KR_HOLIDAYS[KR_HOLIDAYS.length - 1].date.slice(0, 4);
  return sheetFrame('공휴일 넣기', `
    <div class="small muted">고른 날에 "종 없음" 예외를 한 번에 만들어요. 이미 예외가 있는 날은 건너뛰어요. (${last}년까지)</div>
    <div class="row"><button class="btn soft" data-act="hol-all" data-v="1">모두 고르기</button><button class="btn soft" data-act="hol-all" data-v="0">모두 풀기</button></div>
    <div class="list">${list.map(x => {
      const has = days.has(x.date);
      return `<label class="item check" style="align-items:center"><input type="checkbox" data-hol="${x.date}" data-name="${h(x.name)}" ${has ? 'disabled' : (sh.pick && sh.pick[x.date] === false ? '' : 'checked')}>
        <span class="grow"><span class="bold num">${h(koreanDate(x.date))}</span> <span class="muted">${x.date.slice(0, 4)}</span><br><span class="small">${h(x.name)}</span></span>
        ${has ? '<span class="badge">이미 있음</span>' : ''}</label>`;
    }).join('') || '<div class="card muted center">넣을 공휴일이 없어요</div>'}</div>
    <button class="btn primary lg block" data-act="hol-save">고른 날 종 없음으로 저장</button>`);
}
function sheetSpaceEdit() {
  const sp = S.space || {};
  return sheetFrame('공간 정보', `
    <label class="field"><span>이름</span><input class="input" id="se-name" maxlength="40" value="${h(sp.name || '')}"></label>
    <label class="field"><span>종류</span><select class="input" id="se-type">${SPACE_TYPES.map(t => `<option value="${t.id}" ${sp.type === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}</select></label>
    <label class="field"><span>시간대</span><select class="input" id="se-tz">
      ${['Asia/Seoul', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Manila', 'Asia/Bangkok', 'Asia/Jakarta', 'Asia/Kolkata', 'Europe/London', 'Europe/Berlin', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney']
        .map(z => `<option ${sp.timezone === z ? 'selected' : ''}>${z}</option>`).join('')}</select></label>
    <button class="btn primary lg block" data-act="space-save">저장</button>`, { back: 'space-menu' });
}

function sheetRing() {
  const opts = [...BUILTIN_SOUNDS.map(s => ({ id: s.id, name: s.name })), ...S.sounds.filter(s => s.kind !== 'tts').map(s => ({ id: s.id, name: s.name }))];
  return sheetFrame('지금 울리기', `
    <div class="small muted">연결된 모든 재생기에서 바로 울려요.</div>
    <div class="list">${opts.map(o => `<div class="item"><div class="grow" style="font-weight:500">${h(o.name)}</div>
      <button class="icon-btn soft" data-act="play-sound" data-id="${h(o.id)}" aria-label="이 기기에서 듣기">${I.play}</button>
      <button class="btn primary" data-act="ring-send" data-id="${h(o.id)}">울리기</button></div>`).join('')}</div>
    <label class="field"><span>안내 문구 (선택)</span><input class="input" id="ring-say" maxlength="120" placeholder="예: 전체 학생은 강당으로 모여주세요"></label>
    <label class="field"><span>안내할 때 깔 배경음악 (선택)</span><select class="input" id="ring-bgm">${bgmOptions('')}</select></label>
    <button class="btn block" data-act="ring-stop">모든 재생기 소리 멈추기</button>`);
}

function sheetDate(sh) {
  const key = sh.key;
  const day = bellsForDay(key, S.rules, S.timetables, tz());
  const dr = S.rules.find(r => r.kind === 'day' && r.date === key);
  return sheetFrame(koreanDate(key), `
    <div class="card stack tight">
      <div class="small muted">${day.rule ? `${RULE_KINDS[day.rule.kind].label} 규칙 · ${h(ruleLabel(day.rule))}` : '적용된 규칙 없음'}</div>
      <div class="bold">${day.tt ? h(day.tt.name) : '종 없음'}</div>
      ${day.bells.length ? `<div class="small muted">${day.bells.map(b => `${h(b.time)} ${h(b.label)}`).join(' · ')}</div>` : ''}
    </div>
    <label class="field"><span>이날만 다른 일과표로</span><select class="input" id="dt-tt">${ttOptions(dr ? (dr.ttId || '') : (day.ttId || ''))}</select></label>
    <label class="field"><span>메모 (달력에 표시)</span><input class="input" id="dt-name" maxlength="20" placeholder="예: 체육대회" value="${h(dr ? dr.name || '' : '')}"></label>
    <button class="btn primary lg block" data-act="date-save" data-key="${key}">이날 예외로 저장</button>
    ${dr ? `<button class="btn block danger" data-act="rule-del" data-id="${h(dr.id)}">이날 예외 지우기</button>` : ''}`);
}

function sheetRule(sh) {
  const r = sh.draft;
  const kinds = [['period', '기간'], ['week', '특정 주간'], ['day', '특정일']];
  const days = r.days || {};
  const dayInputs = r.kind === 'day' ? `
    <label class="field"><span>날짜</span><input class="input" type="date" data-r="date" value="${h(r.date || '')}"></label>
    <label class="field"><span>일과표</span><select class="input" data-r="ttId">${ttOptions(r.ttId || '')}</select></label>`
    : `<div class="row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
      <label class="field"><span>시작</span><input class="input" type="date" data-r="start" value="${h(r.start || '')}"></label>
      <label class="field"><span>끝</span><input class="input" type="date" data-r="end" value="${h(r.end || '')}"></label></div>
    <div class="field"><span>요일별 일과표</span><div class="days7">
      ${[1, 2, 3, 4, 5, 6, 0].map(d => `<label>${DOW_LABELS[d]}<select data-rd="${d}">${ttOptions(days[d] === undefined ? (r.kind === 'week' ? '_inherit' : '') : days[d], { inherit: r.kind === 'week' })}</select></label>`).join('')}
    </div></div>
    ${r.kind === 'week' ? '<div class="tiny muted">"기간 규칙대로"로 둔 요일은 아래에 있는 기간 규칙을 따라요.</div>' : ''}`;
  return sheetFrame(r.id ? '규칙 고치기' : '규칙 추가', `
    <div class="chips">${kinds.map(([k, l]) => `<button class="chip ${r.kind === k ? 'on' : ''}" data-act="rule-kind" data-id="${k}">${l}</button>`).join('')}</div>
    <div class="small muted">${{ period: '학기처럼 긴 기간의 기본 패턴이에요.', week: '시험 주간처럼 짧은 기간을 덮어써요.', day: '하루만 다르게 하거나 종을 끄는 날이에요.' }[r.kind]}</div>
    <label class="field"><span>이름</span><input class="input" data-r="name" maxlength="30" placeholder="${{ period: '예: 2학기', week: '예: 기말고사', day: '예: 체육대회' }[r.kind]}" value="${h(r.name || '')}"></label>
    ${dayInputs}
    <button class="btn primary lg block" data-act="rule-save">저장</button>
    ${r.id ? `<button class="btn block danger" data-act="rule-del" data-id="${h(r.id)}">이 규칙 지우기</button>` : ''}`);
}

function sheetTtNew() {
  return sheetFrame('새 일과표', `<div class="list">
    <button class="item" data-act="tt-blank"><div class="grow"><div class="bold">빈 일과표</div><div class="small muted">처음부터 직접 만들기</div></div></button>
    <button class="item" data-act="tt-templates"><div class="grow"><div class="bold">샘플에서 가져오기</div><div class="small muted">학교·학원·회사·수련회 샘플</div></div></button>
    <button class="item" data-act="library" data-kind="timetable"><div class="grow"><div class="bold">공유 라이브러리</div><div class="small muted">다른 곳이 공개한 일과표</div></div></button>
    <button class="item" data-act="import-code"><div class="grow"><div class="bold">공유 코드로 가져오기</div><div class="small muted">받은 6자리 코드 넣기</div></div></button>
  </div>`);
}
function sheetTemplates() {
  return sheetFrame('샘플 일과표', TEMPLATE_GROUPS.map(g => `
    <div class="stack tight"><div class="small bold brass">${g.label}</div>
    <div class="list">${TEMPLATES.filter(t => t.category === g.category).map(t => `<button class="item" data-act="tt-from-template" data-id="${t.id}">
      <div class="grow"><div style="font-weight:500">${h(t.name)}</div><div class="small muted">${t.bells.length}개 · ${h(t.bells[0].time)} ~ ${h(t.bells[t.bells.length - 1].time)}</div></div>
      <span class="badge">가져오기</span></button>`).join('')}</div></div>`).join(''), { back: 'tt-new' });
}

// ── 일과표 편집 (선택·복사·붙여넣기·한 번에 바꾸기·반복으로 만들기) ──────────
const CLIP_KEY = 'bk.clip', CLIPSET_KEY = 'bk.clipSet';
function readClip() { try { const c = JSON.parse(localStorage.getItem(CLIP_KEY) || 'null'); return c && Array.isArray(c.bells) && c.bells.length ? c : null; } catch (e) { return null; } }
function writeClip(bells, from) { try { localStorage.setItem(CLIP_KEY, JSON.stringify({ bells, from, at: Date.now() })); } catch (e) { /* 무시 */ } }
function readClipSet() { try { return JSON.parse(localStorage.getItem(CLIPSET_KEY) || 'null'); } catch (e) { return null; } }
function writeClipSet(s) { try { localStorage.setItem(CLIPSET_KEY, JSON.stringify(s)); } catch (e) { /* 무시 */ } }

// "9" "930" "0930" "9:3" → "09:00" "09:30" "09:30" "09:03"
function normTime(v) {
  v = String(v || '').trim().replace(/[^\d:]/g, '');
  let hh, mm;
  if (v.includes(':')) { const [a, b] = v.split(':'); hh = a; mm = b || '0'; }
  else if (v.length <= 2) { hh = v; mm = '0'; }
  else if (v.length === 3) { hh = v.slice(0, 1); mm = v.slice(1); }
  else { hh = v.slice(0, 2); mm = v.slice(2, 4); }
  const H = Number(hh), M = Number(mm);
  if (hh === '' || !Number.isInteger(H) || !Number.isInteger(M) || H > 23 || M > 59) return '';
  return `${pad(H)}:${pad(M)}`;
}
function addMin(t, mins) { let x = timeToSec(t) / 60 + mins; x = ((x % 1440) + 1440) % 1440; return `${pad(Math.floor(x / 60))}:${pad(Math.floor(x % 60))}`; }
const bellCopy = b => { const o = { time: b.time, label: b.label || '', soundId: b.soundId || 'b:westminster', volume: b.volume == null ? 100 : b.volume, maxSec: b.maxSec || 0, say: b.say || '', repeat: b.repeat || 1, sayRepeat: b.sayRepeat || 1 }; if (b.bgmId) { o.bgmId = b.bgmId; o.bgmVol = b.bgmVol == null ? 30 : b.bgmVol; } return o; };
const knownSound = id => !id || id === 'none' || isBuiltin(id) || S.sounds.some(s => s.id === id);
function fitToSpace(b) {
  const o = { ...bellCopy(b), _open: false };
  if (!knownSound(o.soundId)) o.soundId = 'b:westminster';
  if (o.bgmId && !knownSound(o.bgmId)) { delete o.bgmId; delete o.bgmVol; }
  return o;
}
const selList = sh => [...(sh.sel || new Set())].filter(i => i < sh.draft.bells.length).sort((a, b) => a - b);

function repOptions(v, max) {
  v = Number(v) || 1;
  return Array.from({ length: max }, (_, k) => k + 1).map(n => `<option value="${n}" ${v === n ? 'selected' : ''}>${n === 1 ? '1번' : n + '번'}</option>`).join('');
}
// 순서 바꾸기: 종은 시각 순서로 울리므로 시각 칸은 제자리에 두고 내용(이름·소리·안내…)만 옮김
function edReorder(sh, newOrder) {
  const bs = sh.draft.bells;
  const times = bs.map(b => b.time);
  const selObjs = new Set(selList(sh).map(i => bs[i]));
  sh.draft.bells = newOrder.map((b, i) => { b.time = times[i]; return b; });
  sh.sel = new Set(sh.draft.bells.map((b, i) => selObjs.has(b) ? i : -1).filter(i => i >= 0));
}
function edMove(sh, idxs, d) {
  const bs = sh.draft.bells.slice();
  if (!idxs.length) return false;
  if ((d < 0 && idxs[0] === 0) || (d > 0 && idxs[idxs.length - 1] === bs.length - 1)) return false;
  const set = new Set(idxs);
  const order = d < 0 ? idxs : idxs.slice().reverse();
  for (const i of order) {
    const j = i + d;
    if (set.has(j)) continue;
    [bs[i], bs[j]] = [bs[j], bs[i]];
    set.delete(i); set.add(j);
  }
  edReorder(sh, bs);
  return true;
}
function edDragTo(sh, from, to) {
  if (from === to) return;
  const bs = sh.draft.bells.slice();
  const [it] = bs.splice(from, 1);
  bs.splice(to, 0, it);
  edReorder(sh, bs);
}
function edSortByTime(sh) {
  const bs = sh.draft.bells;
  const sorted = bs.every((b, i) => i === 0 || !/^\d{2}:\d{2}$/.test(b.time) || !/^\d{2}:\d{2}$/.test(bs[i - 1].time) || bs[i - 1].time <= b.time);
  if (sorted) return false;
  const selObjs = new Set(selList(sh).map(i => bs[i]));
  const key = b => /^\d{2}:\d{2}$/.test(b.time) ? b.time : '99:99';
  sh.draft.bells = bs.map((b, i) => [b, i]).sort((x, y) => key(x[0]) < key(y[0]) ? -1 : key(x[0]) > key(y[0]) ? 1 : x[1] - y[1]).map(x => x[0]);
  sh.sel = new Set(sh.draft.bells.map((b, i) => selObjs.has(b) ? i : -1).filter(i => i >= 0));
  return true;
}
function edToolbar(sh) {
  const bells = sh.draft.bells, sel = selList(sh), clip = readClip(), cs = readClipSet();
  const all = bells.length && sel.length === bells.length;
  const allBox = `<label class="row" style="gap:6px;padding:0 6px;font-size:14px"><input type="checkbox" class="ed-all" ${all ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--gold)" aria-label="전체 선택">전체</label>`;
  if (sel.length) {
    return `<div class="ed-tools">${allBox}<span class="cnt">${sel.length}개 선택</span>
      <button class="tb" data-act="ed-copy">복사</button>
      ${clip ? `<button class="tb" data-act="ed-paste">붙여넣기 ${clip.bells.length}</button>` : ''}
      <button class="tb" data-act="ed-dup">아래에 복제</button>
      <button class="tb hi" data-act="ed-panel" data-id="bulk">한 번에 바꾸기</button>
      ${cs ? `<button class="tb" data-act="ed-setpaste-sel">설정 붙여넣기</button>` : ''}
      <button class="tb" data-act="ed-move" data-d="-1" title="시각은 그대로, 내용만 한 칸 위로">▲ 위로</button>
      <button class="tb" data-act="ed-move" data-d="1" title="시각은 그대로, 내용만 한 칸 아래로">▼ 아래로</button>
      <button class="tb" data-act="tt-shift" data-m="-5">−5분</button>
      <button class="tb" data-act="tt-shift" data-m="5">+5분</button>
      <button class="tb" data-act="ed-del">삭제</button>
      <span class="grow"></span><button class="tb" data-act="ed-none" style="color:var(--on-ink-2)">선택 해제</button></div>`;
  }
  return `<div class="ed-tools">${allBox}<span class="cnt" style="color:var(--on-ink-2)">종 ${bells.length}개</span>
    ${clip ? `<button class="tb hi" data-act="ed-paste">붙여넣기 ${clip.bells.length}</button>` : ''}
    <button class="tb" data-act="tt-shift" data-m="-5">전체 −5분</button>
    <button class="tb" data-act="tt-shift" data-m="5">전체 +5분</button>
    <span class="grow"></span>
    <button class="tb" data-act="ed-panel" data-id="repeat">반복으로 만들기</button></div>`;
}

function bulkPanel(sh) {
  const n = selList(sh).length;
  const vols = [100, 90, 80, 70, 60, 50];
  return `<div class="panel">
    <div class="row between"><h4>한 번에 바꾸기 · ${n}개</h4><button class="btn sm" data-act="ed-panel" data-id="">닫기</button></div>
    <div class="small muted">바꾼 칸만 ${n}개 종에 모두 적용돼요. "그대로"는 건드리지 않아요.</div>
    <div class="fields">
      <label class="field"><span>소리</span><select class="input" id="bk-sound"><option value="">그대로</option>${soundOptions('__none__').replace('selected', '')}</select></label>
      <label class="field"><span>음량</span><select class="input" id="bk-vol"><option value="">그대로</option>${vols.map(v => `<option value="${v}">${v}%</option>`).join('')}</select></label>
      <label class="field"><span>안내 문구</span><input class="input" id="bk-say" maxlength="120" placeholder="그대로"></label>
      <label class="field"><span>배경음악</span><select class="input" id="bk-bgm"><option value="__keep">그대로</option>${bgmOptions('__none__').replace('selected', '')}</select></label>
      <label class="field"><span>종소리 반복</span><select class="input" id="bk-rep"><option value="">그대로</option>${[1, 2, 3, 4, 5].map(n => `<option value="${n}">${n === 1 ? '1번 (반복 없음)' : n + '번'}</option>`).join('')}</select></label>
      <label class="field"><span>최대 재생</span><select class="input" id="bk-max"><option value="">그대로</option><option value="0">끝까지</option>${[5, 10, 20, 30, 60, 120, 180].map(v => `<option value="${v}">${v}초</option>`).join('')}</select></label>
      <label class="field"><span>시각 옮기기 (분)</span><input class="input num" id="bk-shift" type="number" min="-180" max="180" step="1" value="0"></label>
    </div>
    <label class="check"><input type="checkbox" id="bk-clearsay"><span>안내 문구 모두 지우기</span></label>
    <div class="row wrap"><button class="btn primary" data-act="ed-bulk-apply">${n}개에 적용</button></div>
  </div>`;
}

function repeatPanel(sh) {
  const r = sh.rep;
  const sounds = (id, sel) => `<select class="input" id="${id}">${soundOptions(sel)}</select>`;
  return `<div class="panel">
    <div class="row between"><h4>반복으로 만들기</h4><button class="btn sm" data-act="ed-panel" data-id="">닫기</button></div>
    <div class="small muted">교시를 정하면 시작·끝 종을 한 번에 만들어요.</div>
    <div class="fields">
      <label class="field"><span>첫 수업 시작</span><input class="input num" id="rp-first" inputmode="numeric" maxlength="5" value="${h(r.first)}"></label>
      <label class="field"><span>수업 시간 (분)</span><input class="input num" id="rp-len" type="number" min="5" max="180" value="${r.len}"></label>
      <label class="field"><span>쉬는 시간 (분)</span><input class="input num" id="rp-brk" type="number" min="0" max="120" value="${r.brk}"></label>
      <label class="field"><span>교시 수</span><input class="input num" id="rp-count" type="number" min="1" max="15" value="${r.count}"></label>
      <label class="field"><span>점심시간</span><select class="input" id="rp-lunch"><option value="0">없음</option>${Array.from({ length: 14 }, (_, i) => i + 1).map(n => `<option value="${n}" ${Number(r.lunch) === n ? 'selected' : ''}>${n}교시 뒤</option>`).join('')}</select></label>
      <label class="field"><span>점심 길이 (분)</span><input class="input num" id="rp-lunchlen" type="number" min="10" max="180" value="${r.lunchLen}"></label>
      <label class="field"><span>시작 소리</span>${sounds('rp-start', r.start)}</label>
      <label class="field"><span>끝 소리</span>${sounds('rp-end', r.end)}</label>
      <label class="field"><span>이름 앞에 붙일 말 (선택)</span><input class="input" id="rp-prefix" maxlength="10" placeholder="예: 오후 " value="${h(r.prefix)}"></label>
    </div>
    <div class="preview" id="rp-preview">${h(repeatPreview(r))}</div>
    <div class="row wrap">
      <button class="btn" data-act="ed-repeat" data-id="replace">지금 목록 바꾸기</button>
      <button class="btn primary" data-act="ed-repeat" data-id="append">뒤에 추가</button>
    </div>
  </div>`;
}
function readRepeat() {
  const v = id => (document.getElementById(id) || {}).value;
  return {
    first: normTime(v('rp-first')) || '09:00', len: Math.max(5, Number(v('rp-len')) || 40), brk: Math.max(0, Number(v('rp-brk')) || 0),
    count: Math.min(15, Math.max(1, Number(v('rp-count')) || 1)), lunch: Number(v('rp-lunch')) || 0, lunchLen: Math.max(10, Number(v('rp-lunchlen')) || 60),
    start: v('rp-start') || 'b:westminster', end: v('rp-end') || 'b:dingdong', prefix: v('rp-prefix') || ''
  };
}
function repeatBells(r) {
  return makeLessons({ first: r.first, count: r.count, len: r.len, brk: r.brk, lunchAfter: r.lunch, lunchLen: r.lunchLen, prefix: r.prefix, startSound: r.start, endSound: r.end })
    .map(b => fitToSpace({ ...b, volume: 100, maxSec: 0 }));
}
function repeatPreview(r) {
  const bs = repeatBells(r);
  if (!bs.length) return '';
  const mid = bs.slice(0, 3).map(b => `${b.time} ${b.label}`).join(' · ');
  return `종 ${bs.length}개 · ${bs[0].time} ~ ${bs[bs.length - 1].time}  —  ${mid} …`;
}

function sheetTtEdit(sh) {
  const d = sh.draft;
  const bells = d.bells;
  sh.sel = sh.sel || new Set();
  const rows = bells.map((b, i) => {
    const sel = sh.sel.has(i);
    const bad = b.time && !/^\d{2}:\d{2}$/.test(b.time);
    const sum = [b.repeat > 1 ? `종 ${b.repeat}번` : '', b.say ? `"${b.say}"${b.sayRepeat > 1 ? ` ${b.sayRepeat}번` : ''}` : '', b.bgmId ? `배경음악 ${soundName(b.bgmId)}` : '', (b.volume != null && b.volume !== 100) ? `음량 ${b.volume}%` : ''].filter(Boolean).join(' · ');
    return `<div class="be-row ${sel ? 'sel' : ''} ${bad ? 'bad' : ''}" data-row="${i}">
      <div class="be-lead"><span class="be-grip" draggable="true" data-grip="${i}" title="끌어서 순서 바꾸기 (시각은 제자리)" aria-hidden="true">${I.grip}</span>
      <input type="checkbox" class="be-cb" data-sel="${i}" ${sel ? 'checked' : ''} aria-label="${h(b.time)} ${h(b.label)} 선택"></div>
      <input class="input be-time num" data-b="${i}.time" value="${h(b.time)}" inputmode="numeric" maxlength="5" placeholder="09:00" aria-label="시각 (예: 0940)">
      <input class="input be-label" data-b="${i}.label" maxlength="40" placeholder="이름 (예: 1교시 시작)" value="${h(b.label)}" aria-label="종 이름">
      <select class="input be-sound" data-b="${i}.soundId" aria-label="소리">${soundOptions(b.soundId)}</select>
      <input class="input be-say" data-b="${i}.say" maxlength="120" placeholder="안내 문구 (선택)" value="${h(b.say || '')}" aria-label="안내 문구">
      <select class="input be-bgm" data-b="${i}.bgmId" aria-label="안내 배경음악">${bgmOptions(b.bgmId)}</select>
      <select class="input be-rep" data-b="${i}.repeat" aria-label="종소리 반복">${repOptions(b.repeat, 5)}</select>
      <input class="input be-vol num" type="number" min="10" max="100" step="5" data-b="${i}.volume" value="${b.volume == null ? 100 : b.volume}" aria-label="음량 %">
      <div class="be-acts">
        <button class="icon-btn sm soft" data-act="tt-preview" data-i="${i}" aria-label="미리 듣기">${I.play}</button>
        <button class="icon-btn sm ${b._open ? '' : 'soft'}" data-act="tt-more" data-i="${i}" aria-expanded="${b._open ? 'true' : 'false'}" aria-label="더보기">${I.dots}</button>
      </div>
      ${sum ? `<div class="be-sum">${h(sum)}</div>` : ''}
      ${b._open ? `<div class="be-more">
        <div class="acts">
          <button class="btn sm" data-act="ed-move-one" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="위로 옮기기">▲ 위로</button>
          <button class="btn sm" data-act="ed-move-one" data-i="${i}" data-d="1" ${i === bells.length - 1 ? 'disabled' : ''} aria-label="아래로 옮기기">▼ 아래로</button>
          <button class="btn sm" data-act="ed-ins" data-i="${i}" data-pos="above">위에 종 넣기</button>
          <button class="btn sm" data-act="ed-ins" data-i="${i}" data-pos="below">아래에 종 넣기</button>
          <button class="btn sm" data-act="ed-dup-one" data-i="${i}">이 종 복제</button>
          <button class="btn sm" data-act="ed-setcopy" data-i="${i}">설정 복사</button>
          ${readClipSet() ? `<button class="btn sm gold" data-act="ed-setpaste" data-i="${i}">설정 붙여넣기</button>` : ''}
          <button class="btn sm danger" data-act="tt-del-bell" data-i="${i}">삭제</button>
        </div>
        <div class="fields">
          <label class="field full phone-only"><span>안내 문구 (소리 뒤에 읽어줌)</span><input class="input" maxlength="120" data-b="${i}.say" placeholder="예: 점심시간입니다." value="${h(b.say || '')}"></label>
          <label class="field full phone-only bgm-field"><span>안내할 때 깔 배경음악</span><select class="input" data-b="${i}.bgmId">${bgmOptions(b.bgmId)}</select></label>
          <label class="field phone-only"><span>음량 ${b.volume == null ? 100 : b.volume}%</span><input type="range" min="10" max="100" step="5" data-b="${i}.volume" value="${b.volume == null ? 100 : b.volume}"></label>
          <label class="field phone-only"><span>종소리 반복</span><select class="input" data-b="${i}.repeat">${repOptions(b.repeat, 5)}</select></label>
          <label class="field"><span>안내 문구 반복</span><select class="input" data-b="${i}.sayRepeat">${repOptions(b.sayRepeat, 3)}</select></label>
          <label class="field"><span>최대 재생 (초, 0=끝까지)</span><input class="input num" type="number" min="0" max="3600" data-b="${i}.maxSec" value="${b.maxSec || 0}"></label>
          <label class="field"><span>배경음악 크기 ${b.bgmVol == null ? 30 : b.bgmVol}%</span><input type="range" min="10" max="70" step="5" data-b="${i}.bgmVol" value="${b.bgmVol == null ? 30 : b.bgmVol}"></label>
        </div>
      </div>` : ''}
    </div>`;
  }).join('');
  return sheetFrame(d.id ? '일과표 고치기' : '새 일과표', `
    <div class="row wrap" style="align-items:flex-end">
      <label class="field grow" style="flex:1 1 260px"><span>일과표 이름</span><input class="input" data-b="name" maxlength="40" value="${h(d.name)}" style="font-size:17px;font-weight:700"></label>
      <div class="row wrap">
        ${d.id ? `<button class="btn" data-act="share-tt">공유</button><button class="btn" data-act="tt-copy">일과표 복제</button>` : ''}
        <button class="btn primary" data-act="tt-save">저장</button>
      </div>
    </div>
    ${edToolbar(sh)}
    ${sh.panel === 'bulk' && selList(sh).length ? bulkPanel(sh) : ''}
    ${sh.panel === 'repeat' ? repeatPanel(sh) : ''}
    <div class="stack tight">
      <div class="ed-head"><span></span><span style="text-align:center">시각</span><span>이름</span><span>소리</span><span>안내 문구</span><span class="h-bgm">안내 배경음악</span><span>반복</span><span style="text-align:center">음량</span><span></span></div>
      ${rows || '<div class="card muted center">종이 없어요. 아래에서 종을 추가하거나 [반복으로 만들기]를 눌러 보세요.</div>'}
    </div>
    <div class="row wrap">
      <button class="btn dashed" style="flex:1 1 160px;width:auto" data-act="tt-add-bell">+ 종 추가</button>
      <button class="btn gold" data-act="ed-panel" data-id="repeat">반복으로 만들기</button>
    </div>
    <div class="tiny muted">시각은 0940처럼 숫자만 넣어도 돼요. 여러 개를 고르면 복사·붙여넣기·한 번에 바꾸기를 쓸 수 있어요. 왼쪽 ⠿ 를 끌거나 ▲▼로 순서를 바꾸면 시각은 제자리에 있고 내용만 옮겨져요. 컴퓨터에서는 Ctrl+C / Ctrl+V / Ctrl+D(복제), Alt+↑↓(옮기기)도 돼요.</div>
    ${d.id ? `<button class="btn danger" data-act="tt-delete" style="align-self:flex-start">이 일과표 삭제</button>` : ''}`, { wide: true });
}

// 편집 동작
function edCopy(sh) {
  const sel = selList(sh);
  if (!sel.length) return toast('복사할 종을 먼저 골라 주세요');
  writeClip(sel.map(i => bellCopy(sh.draft.bells[i])), sh.draft.name);
  toast(`종 ${sel.length}개를 복사했어요 · 다른 일과표에서도 붙여넣을 수 있어요`);
  renderSheet();
}
function edPaste(sh) {
  const clip = readClip();
  if (!clip) return toast('복사한 종이 없어요');
  const sel = selList(sh);
  const at = sel.length ? sel[sel.length - 1] + 1 : sh.draft.bells.length;
  const add = clip.bells.map(fitToSpace);
  sh.draft.bells.splice(at, 0, ...add);
  sh.sel = new Set(add.map((_, k) => at + k));
  toast(`종 ${add.length}개를 붙여넣었어요 (골라진 상태라 바로 시간을 옮길 수 있어요)`);
  renderSheet();
}
function edDup(sh, idxs) {
  if (!idxs.length) return;
  const at = idxs[idxs.length - 1] + 1;
  const add = idxs.map(i => ({ ...bellCopy(sh.draft.bells[i]), _open: false }));
  sh.draft.bells.splice(at, 0, ...add);
  sh.sel = new Set(add.map((_, k) => at + k));
  renderSheet();
}
function edSetFrom(b) { return { soundId: b.soundId, volume: b.volume == null ? 100 : b.volume, maxSec: b.maxSec || 0, say: b.say || '', bgmId: b.bgmId || '', bgmVol: b.bgmVol == null ? 30 : b.bgmVol, repeat: b.repeat || 1, sayRepeat: b.sayRepeat || 1 }; }
function edApplySet(b, s) {
  Object.assign(b, { soundId: s.soundId, volume: s.volume, maxSec: s.maxSec, say: s.say, repeat: s.repeat || 1, sayRepeat: s.sayRepeat || 1 });
  if (s.bgmId) { b.bgmId = s.bgmId; b.bgmVol = s.bgmVol; } else { delete b.bgmId; delete b.bgmVol; }
  if (!knownSound(b.soundId)) b.soundId = 'b:westminster';
  delete b.sayId;
}
function edBulkApply(sh) {
  const v = id => (document.getElementById(id) || {}).value;
  const sel = selList(sh);
  const rp = v('bk-rep');
  const sound = v('bk-sound'), vol = v('bk-vol'), say = (v('bk-say') || '').trim(), bgm = v('bk-bgm'), max = v('bk-max');
  const shift = Number(v('bk-shift')) || 0, clearSay = (document.getElementById('bk-clearsay') || {}).checked;
  sel.forEach(i => {
    const b = sh.draft.bells[i];
    if (sound) b.soundId = sound;
    if (vol) b.volume = Number(vol);
    if (rp) b.repeat = Number(rp);
    if (clearSay) { b.say = ''; delete b.sayId; } else if (say) { b.say = say; delete b.sayId; }
    if (bgm !== '__keep' && bgm != null) { if (bgm) { b.bgmId = bgm; if (b.bgmVol == null) b.bgmVol = 30; } else { delete b.bgmId; delete b.bgmVol; } }
    if (max !== '' && max != null) b.maxSec = Number(max);
    if (shift && /^\d{2}:\d{2}$/.test(b.time)) b.time = addMin(b.time, shift);
  });
  sh.panel = null;
  toast(`${sel.length}개에 적용했어요 (저장해야 반영돼요)`);
  renderSheet();
}

function sheetShare(sh) {
  if (sh.result) {
    const link = new URL('app.html', location.href).href.replace(/\?.*$/, '') + '?share=' + sh.result;
    return sheetFrame('공유 코드', `
      <div class="card stack center"><div class="small muted">${h(sh.name)}</div>
      <div class="next-time num" style="letter-spacing:0.08em">${h(sh.result)}</div>
      <div class="small muted">이 코드를 받은 사람은 일과표·종소리 탭의 "공유 코드로 가져오기"에 넣으면 돼요.</div></div>
      <button class="btn primary block" data-act="copy" data-text="${h(link)}">공유 링크 복사</button>
      <button class="btn block" data-act="copy" data-text="${h(sh.result)}">코드만 복사</button>
      ${sh.public ? '<div class="small muted center">공유 라이브러리에도 올라갔어요.</div>' : ''}`);
  }
  return sheetFrame(sh.kind === 'sound' ? '소리 공유' : '일과표 공유', `
    <div class="card"><div class="bold">${h(sh.name)}</div><div class="small muted">공유하면 6자리 코드가 만들어지고, 코드를 받은 사람이 복사본을 가져갈 수 있어요.</div></div>
    <label class="check"><input type="checkbox" id="sh-public"> <span>공유 라이브러리에 공개 (벨키퍼를 쓰는 모든 사람이 볼 수 있어요)</span></label>
    ${sh.kind === 'sound' ? `<label class="check"><input type="checkbox" id="sh-rights"> <span>직접 만들었거나 공유할 권리가 있는 소리예요. (유료 음원·가요는 공유할 수 없어요)</span></label>` : ''}
    <button class="btn primary lg block" data-act="share-create">공유 코드 만들기</button>`);
}

function sheetImport(sh) {
  if (sh.loading) return sheetFrame('가져오기', '<div class="muted center" style="padding:24px">불러오는 중…</div>');
  if (!sh.share) {
    return sheetFrame('공유 코드로 가져오기', `
      <label class="field"><span>공유 코드 6자리</span><input class="input num" id="im-code" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="예: K7Q2MD" style="font-size:22px;letter-spacing:0.1em;text-transform:uppercase" value="${h(sh.code || '')}" autofocus></label>
      ${sh.error ? `<div class="small" style="color:var(--danger)">${h(sh.error)}</div>` : ''}
      <button class="btn primary lg block" data-act="import-find">찾기</button>`);
  }
  const s = sh.share;
  const isTT = s.kind === 'timetable';
  const bells = isTT ? (s.data.bells || []) : [];
  return sheetFrame(isTT ? '일과표 가져오기' : '소리 가져오기', `
    <div class="card stack tight"><div class="tiny bold brass">${isTT ? '일과표' : '소리'} · ${h(s.spaceName || '')}</div>
      <div class="bold" style="font-size:17px">${h(s.name)}</div>
      ${isTT ? `<div class="small muted">${bells.map(b => `${h(b.time)} ${h(b.label)}`).join(' · ')}</div>` : `<button class="btn soft" data-act="play-url" data-url="${h(s.data.url)}">${I.play} 들어보기</button>`}
    </div>
    <button class="btn primary lg block" data-act="import-do">내 공간으로 가져오기</button>`);
}

function sheetLibrary(sh) {
  const items = (sh.items || []).filter(x => x.kind === sh.kind);
  const isTT = sh.kind === 'timetable';
  return sheetFrame(isTT ? '공유 라이브러리 · 일과표' : '공유 라이브러리 · 소리', `
    <div class="chips"><button class="chip ${isTT ? 'on' : ''}" data-act="library" data-kind="timetable">일과표</button>
      <button class="chip ${!isTT ? 'on' : ''}" data-act="library" data-kind="sound">소리</button></div>
    ${sh.loading ? '<div class="muted center" style="padding:24px">불러오는 중…</div>' : `<div class="list">
      ${items.map(x => `<div class="item">
        <div class="grow"><div class="ellipsis" style="font-weight:500">${h(x.name)}</div>
        <div class="small muted ellipsis">${h(x.spaceName || '')}${isTT ? ` · ${(x.data.bells || []).length}개` : ''}</div></div>
        ${isTT ? '' : `<button class="icon-btn soft" data-act="play-url" data-url="${h(x.data.url)}" aria-label="들어보기">${I.play}</button>`}
        <button class="btn soft" data-act="library-pick" data-id="${h(x.id)}">${x.ownerUid === S.user.uid ? '내 것' : '보기'}</button></div>`).join('') || '<div class="card muted center">아직 공개된 항목이 없어요. 첫 번째로 공유해 보세요!</div>'}
    </div>`}`);
}

function sheetUpload(sh) {
  return sheetFrame('소리·음악 올리기', `
    <label class="field"><span>파일</span><input class="input" type="file" id="up-file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.aac" style="padding:10px"></label>
    <label class="field"><span>이름</span><input class="input" id="up-name" maxlength="40" placeholder="예: 점심시간 음악"></label>
    ${sh.progress != null ? `<div class="progress"><div style="width:${sh.progress}%"></div></div><div class="small muted center">${sh.progress}% 올리는 중…</div>` : ''}
    <button class="btn primary lg block" data-act="upload-do" ${sh.progress != null ? 'disabled' : ''}>올리기</button>
    <div class="tiny muted">20MB까지. 저작권이 있는 음악은 우리 공간에서만 쓰고 공유하지 마세요.</div>`);
}
function sheetSoundMenu(sh) {
  const s = S.sounds.find(x => x.id === sh.id);
  if (!s) return '';
  return sheetFrame(s.name, `
    <label class="field"><span>이름</span><input class="input" id="sm-name" maxlength="40" value="${h(s.name)}"></label>
    <button class="btn primary block" data-act="sound-rename" data-id="${h(s.id)}">이름 저장</button>
    ${s.linked ? '' : `<button class="btn block" data-act="share-sound" data-id="${h(s.id)}">공유</button>`}
    <button class="btn block danger" data-act="sound-delete" data-id="${h(s.id)}">삭제</button>`);
}
function sheetDevice(sh) {
  const d = S.devices.find(x => x.id === sh.id);
  if (!d) return '';
  const on = deviceOnline(d);
  return sheetFrame(d.name || '재생기', `
    <div class="card stack tight small">
      <div><span class="dot ${on ? 'ok' : 'off'}"></span> <b>${on ? '정상' : '응답 없음'}</b> · ${ago(millis(d.lastSeen))} 마지막 응답</div>
      ${d.nextLabel ? `<div class="muted">다음 종: ${h(d.nextLabel)}</div>` : ''}
      ${d.offsetMs != null ? `<div class="muted">기기 시계 오차: ${(Math.abs(d.offsetMs) / 1000).toFixed(1)}초 (서버 시간으로 맞춰서 울려요)</div>` : ''}
      ${d.version ? `<div class="muted">버전 ${h(d.version)}${S.update && cmpVer(S.update.latest, d.version) > 0 ? ` · <b style="color:var(--danger)">새 버전 ${h(S.update.latest)} 있음</b> — 재생기 화면의 [업데이트]를 눌러 주세요` : ''}</div>` : ''}
      ${d.ua ? `<div class="muted ellipsis">${h(d.ua)}</div>` : ''}
    </div>
    <label class="field"><span>이름</span><input class="input" id="dv-name" maxlength="30" value="${h(d.name || '')}"></label>
    <button class="btn primary block" data-act="device-rename" data-id="${h(d.id)}">이름 저장</button>
    <div class="field"><span>화면 모양 <span class="muted" style="font-weight:400">· 지금 ${h(styleName(d.mode))}</span></span>
      <div class="style-grid">${PLAYER_STYLES.map(s => `<button class="${(d.display || d.mode) === s.id ? 'on' : ''}" data-act="device-display" data-id="${h(d.id)}" data-v="${s.id}" aria-pressed="${(d.display || d.mode) === s.id}"><span class="mini pv-${s.id}"></span><b>${h(s.name)}</b><span class="muted">${h(s.desc)}</span></button>`).join('')}</div>
      <div class="tiny muted">누르면 재생기 화면이 몇 초 안에 바로 바뀌어요.</div></div>
    <button class="btn block" data-act="device-test" data-id="${h(d.id)}">이 기기만 소리 시험</button>
    <button class="btn block danger" data-act="device-remove" data-id="${h(d.id)}">연결 해제</button>`);
}

// ── 동작 ─────────────────────────────────────
function openImport(code) {
  openSheet({ type: 'import', code: code || '' });
  if (code) findShare(code);
}
async function findShare(code) {
  code = String(code || '').trim().toUpperCase();
  if (code.length !== 6) { openSheet({ type: 'import', code, error: '6자리 코드를 넣어주세요' }); return; }
  openSheet({ type: 'import', code, loading: true });
  try {
    const snap = await F.getDoc(F.doc(F.db, 'shares', code));
    if (!snap.exists()) { openSheet({ type: 'import', code, error: '그런 코드가 없어요. 다시 확인해주세요.' }); return; }
    openSheet({ type: 'import', code, share: { id: snap.id, ...snap.data() } });
  } catch (e) { console.error(e); openSheet({ type: 'import', code, error: '불러오지 못했어요' }); }
}

async function importShare(s) {
  const sh = S.sheet;
  try {
    if (s.kind === 'timetable') {
      // 일과표가 쓰는 올린 소리도 함께 연결
      const map = {};
      const extra = s.data.sounds || {};
      for (const [oldId, info] of Object.entries(extra)) {
        const exist = S.sounds.find(x => x.url === info.url);
        if (exist) { map[oldId] = exist.id; continue; }
        const r = await F.addDoc(sub('sounds'), { name: String(info.name || '공유받은 소리').slice(0, 40), url: info.url, linked: true, createdAt: F.serverTimestamp(), by: S.user.uid });
        map[oldId] = r.id;
      }
      const bells = cleanBells((s.data.bells || []).map(b => ({ ...b, soundId: map[b.soundId] || (isBuiltin(b.soundId) ? b.soundId : 'b:westminster') })));
      await F.addDoc(sub('timetables'), { name: String(s.name).slice(0, 40), bells, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp(), fromShare: s.id });
      S.tab = 'timetables';
    } else {
      if (S.sounds.find(x => x.url === s.data.url)) { toast('이미 가져온 소리예요'); closeIf(sh); return; }
      await F.addDoc(sub('sounds'), { name: String(s.name).slice(0, 40), url: s.data.url, linked: true, duration: s.data.duration || 0, createdAt: F.serverTimestamp(), by: S.user.uid });
      S.tab = 'sounds';
    }
    closeIf(sh); render(); toast('가져왔어요');
  } catch (e) { fail(e, '가져오지 못했어요'); }
}

async function createShare(sh) {
  const pub = document.getElementById('sh-public').checked;
  if (sh.kind === 'sound' && pub && !document.getElementById('sh-rights').checked) { toast('공개하려면 권리 확인에 체크해주세요'); return; }
  let data;
  if (sh.kind === 'timetable') {
    const t = ttById(sh.id);
    if (!t) { toast('일과표를 찾을 수 없어요'); return; }
    const bells = cleanBells(t.bells);
    const sounds = {};
    for (const b of bells) {
      if (isBuiltin(b.soundId)) continue;
      const s = S.sounds.find(x => x.id === b.soundId);
      if (s && s.url) sounds[s.id] = { name: s.name, url: s.url };
    }
    data = { bells, sounds };
  } else {
    const s = S.sounds.find(x => x.id === sh.id);
    if (!s || !s.url) { toast('소리를 찾을 수 없어요'); return; }
    data = { url: s.url, duration: s.duration || 0, contentType: s.contentType || '' };
  }
  for (let i = 0; i < 4; i++) {
    const code = randomCode(6);
    try {
      await F.setDoc(F.doc(F.db, 'shares', code), {
        kind: sh.kind, name: sh.name, data, public: pub, spaceName: (S.space && S.space.name) || '',
        ownerUid: S.user.uid, createdAt: F.serverTimestamp()
      });
      openSheet({ ...sh, result: code, public: pub });
      return;
    } catch (e) { if (i === 3) fail(e, '공유하지 못했어요'); }
  }
}

async function openLibrary(kind) {
  const cur = S.sheet && S.sheet.type === 'library' ? S.sheet : null;
  if (cur && cur.items) { openSheet({ ...cur, kind }); return; }
  openSheet({ type: 'library', kind, loading: true });
  try {
    const snap = await F.getDocs(F.query(F.collection(F.db, 'shares'), F.where('public', '==', true), F.limit(200)));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => millis(b.createdAt) - millis(a.createdAt));
    if (S.sheet && S.sheet.type === 'library') openSheet({ type: 'library', kind: S.sheet.kind, items });
  } catch (e) { console.error(e); openSheet({ type: 'library', kind, items: [] }); toast('라이브러리를 불러오지 못했어요'); }
}

// 일과표 편집용 초안
function draftFrom(t) {
  return {
    id: t ? t.id : null, name: t ? t.name : '새 일과표',
    bells: (t ? cleanBells(t.bells) : []).map(b => ({ ...b, _open: false }))
  };
}
async function saveTimetable() {
  const sh = S.sheet;
  const d = sh.draft;
  const name = (d.name || '').trim() || '이름 없는 일과표';
  d.bells.forEach(b => { const n = normTime(b.time); if (n) b.time = n; });
  const bad = d.bells.find(b => !/^\d{2}:\d{2}$/.test(b.time || ''));
  if (bad) { renderSheet(); toast('시각이 잘못된 종이 있어요 (빨간 칸). 0940처럼 넣어 주세요'); return; }
  let bells = cleanBells(d.bells);
  const btn = sheetRoot.querySelector('[data-act="tt-save"]');
  try {
    if (googleOn() && bells.some(b => b.say)) {
      if (btn) { btn.disabled = true; btn.textContent = '안내 음성 만드는 중…'; }
      try { bells = await bellsWithTts(bells, (i, n) => { if (btn) btn.textContent = `안내 음성 만드는 중… ${i}/${n}`; }); }
      catch (e) { ttsError(e); bells = bells.map(b => { const x = { ...b }; delete x.sayId; return x; }); }
    }
    if (d.id) await F.updateDoc(F.doc(sub('timetables'), d.id), { name, bells, updatedAt: F.serverTimestamp() });
    else await F.addDoc(sub('timetables'), { name, bells, createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() });
    closeIf(sh); toast('저장했어요');
  } catch (e) { fail(e); }
}

async function saveRule() {
  const sh = S.sheet;
  const r = sh.draft;
  const data = { kind: r.kind, name: String(r.name || '').trim().slice(0, 30), by: S.user.uid };
  if (r.kind === 'day') {
    if (!r.date) { toast('날짜를 골라주세요'); return; }
    data.date = r.date; data.ttId = r.ttId || '';
  } else {
    if (!r.start || !r.end) { toast('시작일과 끝날을 골라주세요'); return; }
    if (r.start > r.end) { toast('끝날이 시작일보다 빨라요'); return; }
    data.start = r.start; data.end = r.end;
    const days = {};
    for (const d of [0, 1, 2, 3, 4, 5, 6]) {
      const v = (r.days || {})[d];
      if (r.kind === 'week' && (v === undefined || v === '_inherit')) continue;
      days[d] = (v && v !== '_inherit') ? v : '';
    }
    data.days = days;
  }
  try {
    if (r.id) await F.setDoc(F.doc(sub('rules'), r.id), { ...data, createdAt: r.createdAt || F.serverTimestamp() });
    else await F.addDoc(sub('rules'), { ...data, createdAt: F.serverTimestamp() });
    closeIf(sh); toast('저장했어요');
  } catch (e) { fail(e); }
}

async function saveDayException(key, ttId, name) {
  const ex = S.rules.find(r => r.kind === 'day' && r.date === key);
  const data = { kind: 'day', date: key, ttId: ttId || '', name: String(name || '').trim().slice(0, 30), by: S.user.uid };
  if (ex) await F.setDoc(F.doc(sub('rules'), ex.id), { ...data, createdAt: ex.createdAt || F.serverTimestamp() });
  else await F.addDoc(sub('rules'), { ...data, createdAt: F.serverTimestamp() });
}

async function sendCommand(payload) {
  await F.addDoc(sub('commands'), { ...payload, createdAt: F.serverTimestamp(), by: S.user.uid });
  cleanupCommands();
}
// 하루 지난 원격 명령은 정리 (쌓이지 않게)
async function cleanupCommands() {
  try {
    const old = await F.getDocs(F.query(sub('commands'), F.where('createdAt', '<', F.Timestamp.fromMillis(Date.now() - 86400000)), F.limit(30)));
    await Promise.all(old.docs.map(d => F.deleteDoc(d.ref)));
  } catch (e) { console.warn(e); }
}

async function uploadSound() {
  const file = document.getElementById('up-file').files[0];
  const name = (document.getElementById('up-name').value || '').trim() || (file ? file.name.replace(/\.[^.]+$/, '') : '');
  if (!file) { toast('파일을 골라주세요'); return; }
  if (file.size > MAX_UPLOAD) { toast('20MB보다 작은 파일만 올릴 수 있어요'); return; }
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const types = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', webm: 'audio/webm' };
  const contentType = (file.type && file.type.startsWith('audio/')) ? file.type : (types[ext] || '');
  if (!contentType) { toast('소리 파일(mp3, m4a, wav, ogg)만 올릴 수 있어요'); return; }
  const duration = await fileDuration(file);
  const docRef = F.doc(sub('sounds'));
  const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-60);
  const path = `spaces/${S.spaceId}/sounds/${docRef.id}_${safe}`;
  const task = F.uploadBytesResumable(F.sRef(F.storage, path), file, { contentType });
  openSheet({ type: 'upload', progress: 0 });
  task.on('state_changed',
    s => { if (S.sheet && S.sheet.type === 'upload') { S.sheet.progress = Math.round(s.bytesTransferred / s.totalBytes * 100); renderSheet(); } },
    e => { openSheet({ type: 'upload' }); fail(e, '올리지 못했어요. 파일 크기와 형식을 확인해주세요'); },
    async () => {
      try {
        const url = await F.getDownloadURL(task.snapshot.ref);
        await F.setDoc(docRef, { name: name.slice(0, 40), url, storagePath: path, contentType, size: file.size, duration, createdAt: F.serverTimestamp(), by: S.user.uid });
        if (S.sheet && S.sheet.type === 'upload') closeSheet(); toast('올렸어요');
      } catch (e) { fail(e); }
    });
}

function soundInUse(id) { return S.timetables.filter(t => (t.bells || []).some(b => b.soundId === id || b.sayId === id || b.bgmId === id)); }
function ttInUse(id) { return S.rules.filter(r => r.ttId === id || Object.values(r.days || {}).includes(id)); }

// 한곳에서 모든 클릭 처리
let audioUnlocked = false;
document.addEventListener('click', async e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  if (act === 'sheet-back' && e.target !== el) return; // 시트 안쪽 클릭은 무시
  if (!audioUnlocked) { audioUnlocked = true; unlockAudio(); }
  const id = el.dataset.id;
  const sh = S.sheet;
  try {
    switch (act) {
      case 'login': return doLogin();
      case 'logout': stopSubs(); closeSheet(); localStorage.removeItem(LS.space); return F.signOut(F.auth);
      case 'ob-type': onboard.type = id; onboard.name = (document.getElementById('ob-name') || {}).value || onboard.name; return sh ? renderSheet() : renderOnboarding(true);
      case 'ob-level': onboard.level = id; onboard.name = (document.getElementById('ob-name') || {}).value || onboard.name; return sh ? renderSheet() : renderOnboarding(true);
      case 'ob-create': return createSpace();
      case 'tab': S.tab = id; closeSheet(); render(); window.scrollTo(0, 0); return;
      case 'sheet-close': case 'sheet-back': return closeSheet();
      case 'space-menu': return openSheet({ type: 'space-menu' });
      case 'space-open': closeSheet(); S.tab = 'today'; return openSpace(id);
      case 'space-new': onboard = { name: '', type: 'school', level: 'elem' }; return openSheet({ type: 'space-new' });
      case 'space-edit': return openSheet({ type: 'space-edit' });
      case 'admins': return openSheet({ type: 'admins' });
      case 'invite-send': {
        const em = String(document.getElementById('inv-email').value || '').trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return toast('이메일을 확인해주세요');
        const info = Object.values((S.space && S.space.admins) || {});
        if (info.some(a => a.email === em)) return toast('이미 관리자예요');
        if (((S.space && S.space.inviteEmails) || []).length >= 20) return toast('초대는 20명까지 걸어 둘 수 있어요');
        await F.updateDoc(spaceRef(), { inviteEmails: F.arrayUnion(em) });
        return toast('초대했어요. 안내 문구를 복사해서 보내 주세요');
      }
      case 'invite-cancel': await F.updateDoc(spaceRef(), { inviteEmails: F.arrayRemove(id) }); return toast('초대를 취소했어요');
      case 'invite-accept': return acceptInvite(id);
      case 'invite-decline': return declineInvite(id);
      case 'admin-remove': {
        const me = id === S.user.uid;
        if (!confirm(me ? '이 공간의 관리자에서 나갈까요?' : '이 관리자를 내보낼까요?')) return;
        await F.updateDoc(spaceRef(), { adminUids: F.arrayRemove(id), [`admins.${id}`]: F.deleteField() });
        if (me) { closeSheet(); await loadSpaces(); if (S.spaces.length) openSpace(S.spaces[0].id); else { stopSubs(); S.spaceId = null; renderOnboarding(true); } return toast('나왔어요'); }
        return toast('내보냈어요');
      }
      case 'holidays': return openSheet({ type: 'holidays', pick: {} });
      case 'account': openSheet({ type: 'account' }); S.update = await checkUpdate(); if (S.sheet && S.sheet.type === 'account') renderSheet(); return;
      case 'reload': return reloadToLatest();
      case 'sound-cat': S.soundCat = id; return render();
      case 'tts-settings': return openSheet({ type: 'tts', draft: { ...ttsCfg() } });
      case 'tts-mode': sh.draft.mode = id; return renderSheet();
      case 'tts-preview': {
        const text = document.getElementById('tts-sample').value.trim();
        if (!text) return;
        el.disabled = true;
        try {
          const mp3 = await synthesize(text, sh.draft.voice, sh.draft.rate);
          const url = URL.createObjectURL(new Blob([mp3], { type: 'audio/mpeg' }));
          playBell({ soundId: 'none', say: 'x', sayId: '__p' }, { __p: { url } });
        } catch (e) { ttsError(e); } finally { el.disabled = false; }
        return;
      }
      case 'tts-preview-device': {
        const uri = document.getElementById('dv-voice').value;
        setDeviceVoicePref(uri, getDeviceVoicePref().rate);
        return speak(document.getElementById('tts-sample').value.trim() || '안녕하세요', 100, { uri });
      }
      case 'tts-save': {
        const d = sh.draft, before = ttsCfg();
        await F.updateDoc(spaceRef(), { tts: { mode: d.mode, voice: d.voice || DEFAULT_VOICE, rate: Math.round(Number(d.rate || 1) * 10) / 10 } });
        closeIf(sh);
        const changed = d.mode === 'google' && ttsAvailable() && (before.mode !== 'google' || before.voice !== d.voice || Number(before.rate) !== Number(d.rate));
        if (changed && S.timetables.some(t => (t.bells || []).some(b => b.say))) {
          S.space.tts = { mode: d.mode, voice: d.voice, rate: Math.round(Number(d.rate || 1) * 10) / 10 };
          toast('모든 일과표의 안내 음성을 새 목소리로 만드는 중…');
          try {
            for (const t of S.timetables) {
              if (!(t.bells || []).some(b => b.say)) continue;
              const bells = await bellsWithTts(cleanBells(t.bells));
              await F.updateDoc(F.doc(sub('timetables'), t.id), { bells, updatedAt: F.serverTimestamp() });
            }
            toast('안내 음성을 모두 새 목소리로 바꿨어요');
          } catch (e) { ttsError(e); }
        } else toast('저장했어요');
        return;
      }
      case 'tts-cleanup': {
        const used = new Set();
        S.timetables.forEach(t => (t.bells || []).forEach(b => { if (b.sayId) used.add(b.sayId); }));
        const old = S.sounds.filter(s => s.kind === 'tts' && !used.has(s.id));
        if (!old.length) return toast('지울 안내 음성이 없어요');
        if (!confirm(`일과표에서 쓰지 않는 안내 음성 ${old.length}개를 지울까요?`)) return;
        for (const s of old) {
          if (s.storagePath) { try { await F.deleteObject(F.sRef(F.storage, s.storagePath)); } catch (err) { console.warn(err); } }
          await F.deleteDoc(F.doc(sub('sounds'), s.id));
        }
        return toast('지웠어요');
      }
      case 'hol-all': {
        sheetRoot.querySelectorAll('[data-hol]').forEach(c => { if (!c.disabled) c.checked = el.dataset.v === '1'; });
        return;
      }
      case 'hol-save': {
        const picked = [...sheetRoot.querySelectorAll('[data-hol]')].filter(c => c.checked && !c.disabled);
        if (!picked.length) return toast('고른 날이 없어요');
        el.disabled = true; el.textContent = '저장하는 중…';
        await Promise.all(picked.map(c => F.addDoc(sub('rules'), { kind: 'day', date: c.dataset.hol, ttId: '', name: c.dataset.name.slice(0, 30), by: S.user.uid, createdAt: F.serverTimestamp() })));
        closeIf(sh); return toast(`공휴일 ${picked.length}일을 넣었어요`);
      }
      case 'space-save': {
        const name = document.getElementById('se-name').value.trim();
        if (!name) return toast('이름을 넣어주세요');
        await F.updateDoc(spaceRef(), { name: name.slice(0, 40), type: document.getElementById('se-type').value, timezone: document.getElementById('se-tz').value, updatedAt: F.serverTimestamp() });
        await loadSpaces(); closeIf(sh); return toast('저장했어요');
      }
      case 'copy': return copyText(el.dataset.text);

      // 오늘
      case 'ring-now': return openSheet({ type: 'ring' });
      case 'ring-send': {
        const say = ((document.getElementById('ring-say') || {}).value || '').trim().slice(0, 120);
        const cmd = { type: 'ring', soundId: id, say, label: '지금 울리기' };
        const bgmId = (document.getElementById('ring-bgm') || {}).value || '';
        if (say && bgmId) { cmd.bgmId = bgmId; cmd.bgmVol = 30; }
        if (say && googleOn()) {
          el.disabled = true; el.textContent = '음성 만드는 중…';
          try { const sid = await ensureTts(say); const snd = await F.getDoc(F.doc(sub('sounds'), sid)); if (snd.exists()) cmd.sayUrl = snd.get('url'); }
          catch (e) { ttsError(e); }
        }
        await sendCommand(cmd);
        closeIf(sh); return toast(S.devices.length ? '재생기로 보냈어요' : '연결된 재생기가 없어요');
      }
      case 'ring-stop': await sendCommand({ type: 'stop' }); closeIf(sh); return toast('멈춤 신호를 보냈어요');
      case 'today-off': {
        if (!confirm('오늘 남은 종을 모두 끌까요? 달력에 "오늘 끔" 예외가 생겨요.')) return;
        await saveDayException(todayKey(Date.now(), tz()), '', '오늘 끔');
        return toast('오늘은 종이 울리지 않아요');
      }
      case 'today-undo': await F.deleteDoc(F.doc(sub('rules'), id)); return toast('다시 원래대로 울려요');
      case 'preview': {
        const t = ttById(el.dataset.tt);
        const b = t && cleanBells(t.bells)[Number(el.dataset.i)];
        if (b) playBell(b, soundsById());
        return;
      }

      // 달력
      case 'cal-move': {
        let { y, m } = S.cal; m += Number(el.dataset.d);
        if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
        S.cal = { y, m }; return render();
      }
      case 'date': return openSheet({ type: 'date', key: el.dataset.key });
      case 'date-save': {
        await saveDayException(el.dataset.key, document.getElementById('dt-tt').value, document.getElementById('dt-name').value);
        closeIf(sh); return toast('저장했어요');
      }
      case 'rule-new': {
        const t = todayKey(Date.now(), tz());
        return openSheet({ type: 'rule', draft: { kind: 'week', name: '', start: t, end: addDays(t, 4), date: t, days: {}, ttId: '' } });
      }
      case 'rule-edit': {
        const r = S.rules.find(x => x.id === id);
        return openSheet({ type: 'rule', draft: { ...r, days: { ...(r.days || {}) } } });
      }
      case 'rule-kind': {
        const d = sh.draft; d.kind = id;
        if (id !== 'day' && !d.start) { const t = todayKey(Date.now(), tz()); d.start = t; d.end = addDays(t, id === 'week' ? 4 : 120); }
        if (id === 'day' && !d.date) d.date = todayKey(Date.now(), tz());
        return renderSheet();
      }
      case 'rule-save': return saveRule();
      case 'rule-del': {
        if (!confirm('이 규칙을 지울까요?')) return;
        await F.deleteDoc(F.doc(sub('rules'), id)); closeIf(sh); return toast('지웠어요');
      }

      // 일과표
      case 'tt-new': return openSheet({ type: 'tt-new' });
      case 'tt-blank': return openSheet({ type: 'tt-edit', draft: { id: null, name: '새 일과표', bells: [{ time: '09:00', label: '', soundId: 'b:westminster', volume: 100, maxSec: 0, say: '', _open: false }] } });
      case 'tt-templates': return openSheet({ type: 'tt-templates' });
      case 'tt-from-template': {
        const tpl = templateById(id);
        return openSheet({ type: 'tt-edit', draft: { id: null, name: tpl.name, bells: cleanBells(tpl.bells).map(b => ({ ...b, _open: false })) } });
      }
      case 'tt-edit': return openSheet({ type: 'tt-edit', draft: draftFrom(ttById(id)) });
      case 'tt-add-bell': {
        const bs = sh.draft.bells; const sel = selList(sh);
        const ref = sel.length ? bs[sel[sel.length - 1]] : bs[bs.length - 1];
        const at = sel.length ? sel[sel.length - 1] + 1 : bs.length;
        const t = ref && /^\d{2}:\d{2}$/.test(ref.time) ? addMin(ref.time, 10) : '09:00';
        bs.splice(at, 0, { time: t, label: '', soundId: ref ? ref.soundId : 'b:westminster', volume: 100, maxSec: 0, say: '', _open: false });
        sh.sel = new Set();
        renderSheet();
        const inputs = sheetRoot.querySelectorAll('.be-time'); if (inputs[at]) { inputs[at].scrollIntoView({ block: 'center' }); inputs[at].focus(); inputs[at].select && inputs[at].select(); }
        return;
      }
      case 'tt-del-bell': sh.draft.bells.splice(Number(el.dataset.i), 1); sh.sel = new Set(); return renderSheet();
      case 'tt-more': { const b = sh.draft.bells[Number(el.dataset.i)]; b._open = !b._open; return renderSheet(); }
      case 'tt-preview': return playBell(sh.draft.bells[Number(el.dataset.i)], soundsById());
      case 'tt-shift': {
        const mins = Number(el.dataset.m);
        const sel = selList(sh);
        const idxs = sel.length ? sel : sh.draft.bells.map((_, i) => i);
        idxs.forEach(i => { const b = sh.draft.bells[i]; if (/^\d{2}:\d{2}$/.test(b.time)) b.time = addMin(b.time, mins); });
        toast(`${sel.length ? `고른 종 ${sel.length}개를` : '모든 종을'} ${mins > 0 ? '+' : ''}${mins}분 옮겼어요 (저장해야 반영돼요)`);
        return renderSheet();
      }
      case 'ed-move': { if (!edMove(sh, selList(sh), Number(el.dataset.d))) return; return renderSheet(); }
      case 'ed-move-one': {
        const i = Number(el.dataset.i), d = Number(el.dataset.d);
        const b = sh.draft.bells[i];
        if (!edMove(sh, [i], d)) return;
        sh.sel = new Set(); b._open = true;
        return renderSheet();
      }
      case 'ed-copy': return edCopy(sh);
      case 'ed-paste': return edPaste(sh);
      case 'ed-dup': return edDup(sh, selList(sh));
      case 'ed-dup-one': return edDup(sh, [Number(el.dataset.i)]);
      case 'ed-none': sh.sel = new Set(); sh.panel = null; return renderSheet();
      case 'ed-del': {
        const sel = selList(sh);
        if (!confirm(`고른 종 ${sel.length}개를 지울까요?`)) return;
        sh.draft.bells = sh.draft.bells.filter((_, i) => !sh.sel.has(i));
        sh.sel = new Set(); sh.panel = null;
        return renderSheet();
      }
      case 'ed-panel': {
        sh.panel = el.dataset.id || null;
        if (sh.panel === 'repeat' && !sh.rep) sh.rep = { first: '09:00', len: 40, brk: 10, count: 6, lunch: 4, lunchLen: 60, start: 'b:westminster', end: 'b:dingdong', prefix: '' };
        renderSheet();
        const p = sheetRoot.querySelector('.panel'); if (p) p.scrollIntoView({ block: 'nearest' });
        return;
      }
      case 'ed-bulk-apply': return edBulkApply(sh);
      case 'ed-repeat': {
        const r = readRepeat(); sh.rep = r;
        const add = repeatBells(r);
        if (el.dataset.id === 'replace') {
          if (sh.draft.bells.length && !confirm(`지금 있는 종 ${sh.draft.bells.length}개를 지우고 새로 만든 ${add.length}개로 바꿀까요?`)) return;
          sh.draft.bells = add; sh.sel = new Set();
        } else {
          const at = sh.draft.bells.length;
          sh.draft.bells.push(...add); sh.sel = new Set(add.map((_, k) => at + k));
        }
        sh.panel = null;
        toast(`종 ${add.length}개를 만들었어요 (저장해야 반영돼요)`);
        return renderSheet();
      }
      case 'ed-ins': {
        const i = Number(el.dataset.i), b = sh.draft.bells[i];
        const above = el.dataset.pos === 'above';
        const t = /^\d{2}:\d{2}$/.test(b.time) ? addMin(b.time, above ? -5 : 10) : '09:00';
        b._open = false;
        sh.draft.bells.splice(above ? i : i + 1, 0, { time: t, label: '', soundId: b.soundId, volume: 100, maxSec: 0, say: '', _open: false });
        sh.sel = new Set();
        return renderSheet();
      }
      case 'ed-setcopy': { writeClipSet(edSetFrom(sh.draft.bells[Number(el.dataset.i)])); toast('설정(소리·음량·안내·배경음악)을 복사했어요'); return renderSheet(); }
      case 'ed-setpaste': { const s = readClipSet(); if (s) { edApplySet(sh.draft.bells[Number(el.dataset.i)], s); toast('설정을 붙여넣었어요'); } return renderSheet(); }
      case 'ed-setpaste-sel': { const s = readClipSet(); if (s) { selList(sh).forEach(i => edApplySet(sh.draft.bells[i], s)); toast(`고른 종 ${selList(sh).length}개에 설정을 붙여넣었어요`); } return renderSheet(); }
      case 'clip-clear': try { localStorage.removeItem(CLIP_KEY); } catch (err) { /* 무시 */ } return render();
      case 'tt-save': return saveTimetable();
      case 'tt-copy': {
        const d = sh.draft;
        await F.addDoc(sub('timetables'), { name: `${d.name} 복사본`.slice(0, 40), bells: cleanBells(d.bells), createdAt: F.serverTimestamp(), updatedAt: F.serverTimestamp() });
        closeIf(sh); return toast('복제했어요');
      }
      case 'tt-delete': {
        const used = ttInUse(sh.draft.id);
        if (used.length) return alert(`이 일과표를 쓰는 규칙이 있어서 지울 수 없어요.\n\n${used.map(r => '· ' + ruleLabel(r)).join('\n')}\n\n달력에서 규칙을 먼저 바꿔주세요.`);
        if (!confirm('이 일과표를 지울까요?')) return;
        await F.deleteDoc(F.doc(sub('timetables'), sh.draft.id)); closeIf(sh); return toast('지웠어요');
      }
      case 'share-tt': {
        const t = ttById(sh.draft.id);
        return openSheet({ type: 'share', kind: 'timetable', id: t.id, name: t.name });
      }
      case 'share-sound': {
        const s = S.sounds.find(x => x.id === id);
        return openSheet({ type: 'share', kind: 'sound', id: s.id, name: s.name });
      }
      case 'share-create': return createShare(sh);
      case 'import-code': return openImport('');
      case 'import-find': return findShare(document.getElementById('im-code').value);
      case 'import-do': return importShare(sh.share);
      case 'library': return openLibrary(el.dataset.kind);
      case 'library-pick': {
        const x = (sh.items || []).find(i => i.id === id);
        return openSheet({ type: 'import', code: x.id, share: x });
      }

      // 종소리
      case 'play-sound': return playBell({ soundId: id, volume: 100 }, soundsById());
      case 'play-url': return playBell({ soundId: '__url', volume: 100 }, { __url: { url: el.dataset.url } });
      case 'stop-all': return stopAll();
      case 'upload': return openSheet({ type: 'upload' });
      case 'upload-do': return uploadSound();
      case 'sound-menu': return openSheet({ type: 'sound-menu', id });
      case 'sound-rename': {
        const name = document.getElementById('sm-name').value.trim();
        if (!name) return toast('이름을 넣어주세요');
        await F.updateDoc(F.doc(sub('sounds'), id), { name: name.slice(0, 40) }); closeIf(sh); return toast('저장했어요');
      }
      case 'sound-delete': {
        const used = soundInUse(id);
        if (used.length) return alert(`이 소리를 쓰는 일과표가 있어서 지울 수 없어요.\n\n${used.map(t => '· ' + t.name).join('\n')}`);
        if (!confirm('이 소리를 지울까요? 공유한 코드로도 더는 들을 수 없게 돼요.')) return;
        const s = S.sounds.find(x => x.id === id);
        if (s && s.storagePath && !s.linked) { try { await F.deleteObject(F.sRef(F.storage, s.storagePath)); } catch (err) { console.warn(err); } }
        await F.deleteDoc(F.doc(sub('sounds'), id)); closeIf(sh); return toast('지웠어요');
      }

      // 기기
      case 'pair-new': return newPairCode();
      case 'device': return openSheet({ type: 'device', id });
      case 'device-rename': {
        const name = document.getElementById('dv-name').value.trim();
        if (!name) return toast('이름을 넣어주세요');
        await F.updateDoc(F.doc(sub('devices'), id), { name: name.slice(0, 30) }); closeIf(sh); return toast('저장했어요');
      }
      case 'device-display': {
        const v = el.dataset.v;
        if (!PLAYER_STYLES.some(s => s.id === v)) return;
        await F.updateDoc(F.doc(sub('devices'), id), { display: v });
        const d = S.devices.find(x => x.id === id); if (d) d.display = v;
        renderSheet(); return toast(`화면을 "${styleName(v)}"(으)로 바꿨어요`);
      }
      case 'device-test': await sendCommand({ type: 'ring', soundId: 'b:dingdong', target: id, label: '소리 시험' }); return toast('소리 시험 신호를 보냈어요');
      case 'device-remove': {
        if (!confirm('이 재생기 연결을 끊을까요? 그 기기에서는 더 이상 종이 울리지 않아요.')) return;
        await F.deleteDoc(F.doc(sub('devices'), id)); closeIf(sh); return toast('연결을 끊었어요');
      }
    }
  } catch (err) { fail(err); }
});

// 시트 안 입력값을 초안에 바로 반영
document.addEventListener('input', e => {
  const sh = S.sheet;
  if (!sh) return;
  const t = e.target;
  if (sh.type === 'tt-edit' && t.dataset.b) {
    const key = t.dataset.b;
    if (key === 'name') { sh.draft.name = t.value; return; }
    const [i, f] = key.split('.');
    const b = sh.draft.bells[Number(i)];
    if (!b) return;
    b[f] = (f === 'volume' || f === 'maxSec' || f === 'bgmVol' || f === 'repeat' || f === 'sayRepeat') ? Number(t.value) : t.value;
    if (f === 'volume') { const L = t.closest('label'); const lab = L && L.querySelector('span'); if (lab) lab.textContent = `음량 ${t.value}%`; }
    if (f === 'bgmVol') { const L = t.closest('label'); const lab = L && L.querySelector('span'); if (lab) lab.textContent = `배경음악 크기 ${t.value}%`; }
    // 같은 값을 보여주는 다른 칸(휴대폰용 더보기 칸 등)도 맞춰 줌
    sheetRoot.querySelectorAll(`[data-b="${key}"]`).forEach(o => { if (o !== t && o.value !== t.value) o.value = t.value; });
  }
  if (sh.type === 'tt-edit' && t.id && t.id.startsWith('rp-')) {
    sh.rep = readRepeat();
    const p = document.getElementById('rp-preview'); if (p) p.textContent = repeatPreview(sh.rep);
  }
  if (sh.type === 'tts' && t.dataset.t) {
    sh.draft[t.dataset.t] = t.dataset.t === 'rate' ? Number(t.value) : t.value;
    if (t.dataset.t === 'rate') { const l = document.getElementById('tts-rate-lab'); if (l) l.textContent = Number(t.value).toFixed(1); }
  }
  if (sh.type === 'rule') {
    if (t.dataset.r) sh.draft[t.dataset.r] = t.value;
    if (t.dataset.rd != null) { sh.draft.days = sh.draft.days || {}; sh.draft.days[t.dataset.rd] = t.value; }
  }
});
let lastSel = -1;
document.addEventListener('change', e => {
  const t = e.target, sh = S.sheet;
  // select 상자는 input 이벤트가 없는 브라우저도 있어 한 번 더
  if (t.tagName === 'SELECT') t.dispatchEvent(new Event('input', { bubbles: true }));
  if (!sh || sh.type !== 'tt-edit') return;
  if (t.classList.contains('be-time')) {
    const i = Number(t.dataset.b.split('.')[0]), b = sh.draft.bells[i];
    const n = normTime(t.value);
    if (n) { t.value = n; if (b) b.time = n; t.closest('.be-row').classList.remove('bad'); }
    else if (t.value.trim()) t.closest('.be-row').classList.add('bad');
    if (n && edSortByTime(sh)) { renderSheet(); toast(`${n} 종을 시각 순서에 맞는 자리로 옮겼어요`); }
    return;
  }
  if (t.classList.contains('be-cb')) {
    const i = Number(t.dataset.sel);
    sh.sel = sh.sel || new Set();
    if (e.shiftKey || t._shift) {
      if (lastSel >= 0) { const [x, y] = [Math.min(lastSel, i), Math.max(lastSel, i)]; for (let k = x; k <= y; k++) t.checked ? sh.sel.add(k) : sh.sel.delete(k); }
    }
    t.checked ? sh.sel.add(i) : sh.sel.delete(i);
    lastSel = i;
    if (!sh.sel.size && sh.panel === 'bulk') sh.panel = null;
    return renderSheet();
  }
  if (t.classList.contains('ed-all')) {
    sh.sel = t.checked ? new Set(sh.draft.bells.map((_, k) => k)) : new Set();
    if (!sh.sel.size && sh.panel === 'bulk') sh.panel = null;
    return renderSheet();
  }
});
// 끌어서 순서 바꾸기 (컴퓨터·태블릿)
let dragFrom = -1;
document.addEventListener('dragstart', e => {
  const g = e.target.closest && e.target.closest('[data-grip]');
  if (!g || !S.sheet || S.sheet.type !== 'tt-edit') return;
  dragFrom = Number(g.dataset.grip);
  try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(dragFrom)); e.dataTransfer.setDragImage(g.closest('.be-row'), 20, 20); } catch (err) { /* 무시 */ }
  g.closest('.be-row').classList.add('dragging');
});
document.addEventListener('dragover', e => {
  if (dragFrom < 0) return;
  const row = e.target.closest && e.target.closest('.be-row[data-row]');
  sheetRoot.querySelectorAll('.drop-above,.drop-below').forEach(x => x.classList.remove('drop-above', 'drop-below'));
  if (!row) return;
  e.preventDefault();
  const r = row.getBoundingClientRect();
  row.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-above' : 'drop-below');
});
document.addEventListener('drop', e => {
  if (dragFrom < 0) return;
  const row = e.target.closest && e.target.closest('.be-row[data-row]');
  const sh = S.sheet;
  if (row && sh && sh.type === 'tt-edit') {
    e.preventDefault();
    let to = Number(row.dataset.row);
    if (row.classList.contains('drop-below')) to += 1;
    if (to > dragFrom) to -= 1;
    const from = dragFrom; dragFrom = -1;
    if (from !== to) { edDragTo(sh, from, to); renderSheet(); toast('순서를 바꿨어요 · 시각은 제자리예요'); return; }
  }
  dragFrom = -1;
});
document.addEventListener('dragend', () => {
  dragFrom = -1;
  sheetRoot.querySelectorAll('.dragging,.drop-above,.drop-below').forEach(x => x.classList.remove('dragging', 'drop-above', 'drop-below'));
});
// Shift+클릭 범위 선택 (change 이벤트엔 shiftKey가 없어서 click에서 기억)
document.addEventListener('click', e => { if (e.target.classList && e.target.classList.contains('be-cb')) e.target._shift = e.shiftKey; }, true);
document.addEventListener('keydown', e => {
  const sh = S.sheet;
  if (sh && sh.type === 'tt-edit' && e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && selList(sh).length) {
    e.preventDefault();
    if (edMove(sh, selList(sh), e.key === 'ArrowUp' ? -1 : 1)) renderSheet();
    return;
  }
  if (sh && sh.type === 'tt-edit' && (e.ctrlKey || e.metaKey) && !e.altKey) {
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = (tag === 'input' && !['checkbox', 'range'].includes(e.target.type)) || tag === 'textarea' || tag === 'select';
    const k = e.key.toLowerCase();
    if (!typing && ['c', 'v', 'd', 'a'].includes(k)) {
      e.preventDefault();
      if (k === 'c') return edCopy(sh);
      if (k === 'v') return edPaste(sh);
      if (k === 'd') return edDup(sh, selList(sh));
      if (k === 'a') { sh.sel = new Set(sh.draft.bells.map((_, i) => i)); return renderSheet(); }
    }
  }
  if (e.key === 'Escape' && S.sheet) closeSheet();
  if (e.key === 'Enter' && e.target.id === 'im-code') findShare(e.target.value);
});

// 남은 시간 표시를 1초마다
setInterval(() => {
  const nr = document.getElementById('next-remain');
  if (nr) {
    const at = Number(nr.dataset.at);
    if (at <= Date.now()) render(); else nr.textContent = fmtRemainWords(at - Date.now());
  }
  const pr = document.getElementById('pair-remain');
  if (pr) { const at = Number(pr.dataset.at); if (at <= Date.now()) { S.pair = null; render(); } else pr.textContent = fmtRemain(at - Date.now()); }
}, 1000);
// 기기 상태·지난 종 표시를 30초마다 새로
setInterval(() => { if (!S.sheet && (S.tab === 'today' || S.tab === 'devices')) render(); }, 30000);

// 공간이 아직 없을 때, 창으로 돌아오면 새 초대가 왔는지 다시 확인
window.addEventListener('focus', async () => {
  if (S.user && !S.spaceId && document.getElementById('ob-name')) {
    const before = S.invites.length;
    await loadInvites();
    if (S.invites.length !== before) { onboard.name = document.getElementById('ob-name').value; renderOnboarding(true); }
  }
});

// ── 시작 ─────────────────────────────────────
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

watchUpdates(u => { S.update = u; if (S.spaceId) render(); });
checkUpdate().then(u => { S.update = u; });

if (!F.configured) {
  renderNotConfigured();
} else {
  F.getRedirectResult(F.auth).catch(e => console.warn(e));
  F.onAuthStateChanged(F.auth, async user => {
    stopSubs();
    if (!user || user.isAnonymous) {
      S.user = null;
      if (new URLSearchParams(location.search).get('login') === '1') {
        history.replaceState(null, '', location.pathname);
        F.signInWithRedirect(F.auth, new F.GoogleAuthProvider()).catch(() => renderLogin());
        return;
      }
      renderLogin(); return;
    }
    S.user = user;
    root.innerHTML = '<div class="hero-page"><div class="logo">' + I.logo + '</div><div class="muted">불러오는 중…</div></div>';
    try {
      await loadSpaces();
    } catch (e) { console.error(e); renderLogin('공간 목록을 불러오지 못했어요. 보안 규칙이 게시되었는지 확인해주세요.'); return; }
    if (!S.spaces.length) { renderOnboarding(true); return; }
    const saved = localStorage.getItem(LS.space);
    openSpace(S.spaces.find(s => s.id === saved) ? saved : S.spaces[0].id);
  });
}
