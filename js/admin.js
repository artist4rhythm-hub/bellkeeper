// 벨키퍼 관리자 화면
import * as F from './fb.js';
import {
  APP_VERSION, SPACE_TYPES, DOW_LABELS, RULE_KINDS, todayKey, koreanDate, shortDate, addDays, dowOfKey,
  parseKey, dateKey, resolveDay, bellsForDay, upcomingBells, sortRules, fmtRemain, fmtRemainWords,
  escapeHtml as h, randomCode, cleanBells, timeToSec, pad
} from './core.js';
import { TEMPLATES, TEMPLATE_GROUPS, starterFor, templateById } from './templates.js';
import { KR_HOLIDAYS } from './holidays.js';
import { BUILTIN_SOUNDS, isBuiltin, builtinName, playBell, stopAll, unlockAudio, fileDuration } from './sounds.js';

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
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  logo: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="14" r="5" fill="#17231F"/><path d="M60 20 C40 20 28 36 28 58 L28 78 L18 90 L102 90 L92 78 L92 58 C92 36 80 20 60 20 Z" fill="#17231F"/><circle cx="60" cy="102" r="8" fill="#B07D1E"/><line x1="60" y1="58" x2="60" y2="38" stroke="#F4F5F2" stroke-width="5" stroke-linecap="round"/><line x1="60" y1="58" x2="74" y2="66" stroke="#B07D1E" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="58" r="4" fill="#F4F5F2"/></svg>'
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
  const b = BUILTIN_SOUNDS.map(s => `<option value="${s.id}" ${s.id === selected ? 'selected' : ''}>${h(s.name)}</option>`).join('');
  const u = S.sounds.map(s => `<option value="${h(s.id)}" ${s.id === selected ? 'selected' : ''}>${h(s.name)}</option>`).join('');
  const missing = selected && !isBuiltin(selected) && !S.sounds.find(s => s.id === selected)
    ? `<option value="${h(selected)}" selected>(지워진 소리)</option>` : '';
  return `<optgroup label="기본 종소리">${b}</optgroup>${u ? `<optgroup label="올린 소리">${u}</optgroup>` : ''}${missing}`;
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
  root.innerHTML = `<div class="hero">
    <div class="logo">${I.logo}</div><h1>벨키퍼</h1>
    <div class="card stack"><b>Firebase 설정이 아직 없어요</b>
    <div class="small muted">js/firebase-config.js 파일에 Firebase 콘솔에서 복사한 값을 붙여넣은 뒤 다시 올려주세요. "업로드 순서 안내.txt" 6단계를 참고하세요.</div></div></div>`;
}

function renderLogin(errMsg) {
  root.innerHTML = `<div class="hero">
    <div class="logo">${I.logo}</div>
    <div class="stack tight"><h1>벨키퍼</h1><p class="sub">학교·학원·회사를 위한 자동 종소리</p></div>
    <div class="card stack">
      ${inAppBrowser() ? `<div class="banner warn">카카오톡 같은 앱 안의 브라우저에서는 구글 로그인이 막혀요. 오른쪽 위 메뉴에서 <b>다른 브라우저로 열기</b>를 눌러주세요.</div>` : ''}
      <button class="btn primary lg block" data-act="login">Google 계정으로 시작하기</button>
      ${errMsg ? `<div class="small" style="color:var(--danger)">${h(errMsg)}</div>` : ''}
      <div class="small muted">관리자만 로그인해요. 종을 울릴 기기는 로그인 없이 연결 번호로 연결해요.</div>
    </div>
    <a class="small" href="play.html">이 기기를 재생기로 쓰기 →</a>
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
  const html = `<div class="${firstTime ? 'hero' : 'stack loose'}" style="${firstTime ? '' : 'text-align:left'}">
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

function render() {
  if (!S.user || !S.spaceId) return;
  const sp = S.space || {};
  const views = { today: viewToday, calendar: viewCalendar, timetables: viewTimetables, sounds: viewSounds, devices: viewDevices };
  const titles = { today: sp.name || '', calendar: '달력', timetables: '일과표', sounds: '종소리', devices: '기기' };
  const scrollY = window.scrollY;
  root.innerHTML = `<div class="app">
    <nav class="tabbar" aria-label="메뉴"><div class="tabbar-inner">
      ${TABS.map(([id, l, ic]) => `<button class="tab ${S.tab === id ? 'on' : ''}" data-act="tab" data-id="${id}" ${S.tab === id ? 'aria-current="page"' : ''}>${ic}${l}</button>`).join('')}
    </div></nav>
    <header class="topbar">
      <div class="stack tight" style="gap:0;min-width:0">
        <div class="small muted ellipsis">${S.tab === 'today' ? h(koreanDate(todayKey(Date.now(), tz()))) : h(sp.name || '')}</div>
        <h1 class="ellipsis">${h(titles[S.tab])}</h1>
      </div>
      <button class="icon-btn" data-act="space-menu" aria-label="공간·계정 메뉴">${I.down}</button>
    </header>
    <main class="main">${S.ready ? views[S.tab]() : '<div class="muted center" style="padding:40px">불러오는 중…</div>'}</main>
  </div>`;
  window.scrollTo(0, scrollY);
  if (S.tab === 'devices' && S.pair) drawQr();
}

// ── 오늘 ─────────────────────────────────────
function viewToday() {
  const now = Date.now();
  const key = todayKey(now, tz());
  const day = bellsForDay(key, S.rules, S.timetables, tz());
  const next = upcomingBells(now, S.rules, S.timetables, tz(), 14)[0];
  const online = S.devices.filter(deviceOnline);
  const offline = S.devices.filter(d => !deviceOnline(d));
  const todayRule = S.rules.find(r => r.kind === 'day' && r.date === key);
  const nextIdx = next && next.dateKey === key ? day.bells.findIndex(b => b.key === next.key) : -1;

  let banner = '';
  if (!S.devices.length) banner = `<button class="banner" style="border:0;text-align:left" data-act="tab" data-id="devices"><b>재생기를 연결해야 종이 울려요.</b> 기기 탭에서 연결 번호를 만들어 주세요 →</button>`;
  else if (offline.length) banner = `<div class="banner warn"><b>재생기 ${offline.length}대가 응답이 없어요.</b> ${h(offline.map(d => d.name).join(', '))} — 기기가 켜져 있고 화면이 열려 있는지 확인해주세요.</div>`;

  return `${banner}
  <section class="card stack" aria-label="다음 종">
    <div class="row between">
      <div class="small bold brass">다음 종</div>
      <div class="small ${online.length ? 'status-ok' : 'muted'} row" style="gap:6px"><span class="dot ${online.length ? 'ok' : 'off'}"></span>재생기 ${online.length}대 정상</div>
    </div>
    ${next ? `
      <div class="row" style="align-items:baseline;gap:10px;flex-wrap:wrap">
        <div class="next-time num">${h(next.time)}</div>
        <div class="bold" style="font-size:17px">${h(next.label || '종')}</div>
      </div>
      <div class="small" style="color:var(--ink-2)"><span id="next-remain" data-at="${next.at}">${fmtRemainWords(next.at - now)}</span> · ${h(soundName(next.soundId))}${next.dateKey !== key ? ` · ${h(koreanDate(next.dateKey))}` : ''}</div>
    ` : `<div class="bold" style="font-size:18px">앞으로 2주 동안 울릴 종이 없어요</div><div class="small muted">달력에서 규칙을 확인해주세요.</div>`}
    <div class="row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
      <button class="btn soft" data-act="ring-now">지금 울리기</button>
      ${todayRule && !todayRule.ttId
        ? `<button class="btn soft" data-act="today-undo" data-id="${h(todayRule.id)}">오늘 끄기 취소</button>`
        : `<button class="btn soft" data-act="today-off">오늘만 끄기</button>`}
    </div>
  </section>

  <div class="section-title"><h2>오늘 울릴 종</h2>
    <span class="small muted">${day.tt ? `${h(day.tt.name)} · ${day.bells.length}개` : ''}</span></div>
  <div class="small muted" style="margin-top:-8px">${day.rule ? `${RULE_KINDS[day.rule.kind].label} 규칙: ${h(ruleLabel(day.rule))}` : '적용된 규칙이 없어요'}</div>
  ${day.bells.length ? `<div class="stack tight" style="gap:2px">
    ${day.bells.map((b, i) => {
      const cls = i === nextIdx ? 'next' : (b.at <= now ? 'past' : '');
      return `<div class="bell-row ${cls}"><div class="t num">${h(b.time)}</div>
        <div class="grow"><div style="font-weight:500">${h(b.label || '종')}</div><div class="small muted ellipsis">${h(soundName(b.soundId))}${b.say ? ` · "${h(b.say)}"` : ''}</div></div>
        <button class="icon-btn ${cls === 'next' ? '' : 'soft'}" data-act="preview" data-tt="${h(day.tt.id)}" data-i="${b.idx}" aria-label="${h(b.label)} 미리 듣기">${I.play}</button></div>`;
    }).join('')}</div>`
    : `<div class="card muted center">오늘은 종이 없어요</div>`}`;
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
  return `<div class="card stack">
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
  <div class="section-title"><h2>적용 규칙</h2><span class="tiny muted">위에 있을수록 먼저 적용</span></div>
  <div class="list">
    ${rules.map((r, i) => `<button class="item" data-act="rule-edit" data-id="${h(r.id)}">
      <div class="rank">${i + 1}</div>
      <div class="grow"><div class="tiny bold brass">${RULE_KINDS[r.kind].label}</div>
        <div style="font-weight:500">${h(ruleLabel(r))}</div>
        <div class="small muted ellipsis">${h(ruleSummary(r))}</div></div></button>`).join('') || '<div class="card muted center">규칙이 없어요. 규칙이 있어야 종이 울려요.</div>'}
    <div class="row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
      <button class="btn dashed" data-act="rule-new">+ 규칙 추가</button>
      <button class="btn dashed" data-act="holidays">공휴일 넣기</button></div>
  </div>`;
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
  return `<div class="small muted">종 목록을 일과표로 저장해 두고, 달력 규칙에서 요일·기간별로 골라 써요.</div>
  <div class="list">
    ${S.timetables.map(t => {
      const b = (t.bells || []);
      return `<button class="item" data-act="tt-edit" data-id="${h(t.id)}">
        <div class="grow"><div class="bold">${h(t.name)}</div>
        <div class="small muted">${b.length ? `${b.length}개 · ${h(b[0].time)} ~ ${h(b[b.length - 1].time)}` : '종 없음'}</div></div>
        ${used(t.id) ? '<span class="badge gold">사용 중</span>' : '<span class="badge">안 씀</span>'}</button>`;
    }).join('') || '<div class="card muted center">일과표가 없어요</div>'}
    <button class="btn dashed" data-act="tt-new">+ 새 일과표</button>
  </div>
  <div class="row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
    <button class="btn" data-act="library" data-kind="timetable">공유 라이브러리</button>
    <button class="btn" data-act="import-code">공유 코드로 가져오기</button>
  </div>`;
}

// ── 종소리 ─────────────────────────────────────
function viewSounds() {
  return `<div class="section-title"><h2>기본 종소리</h2><span class="tiny muted">무료 · 인터넷 없이도 울림</span></div>
  <div class="list">${BUILTIN_SOUNDS.map(s => `<div class="item">
    <div class="grow"><div style="font-weight:500">${h(s.name)}</div><div class="small muted">${h(s.desc)}</div></div>
    <button class="icon-btn soft" data-act="play-sound" data-id="${s.id}" aria-label="${h(s.name)} 듣기">${I.play}</button></div>`).join('')}</div>

  <div class="section-title"><h2>올린 소리·음악</h2><span class="tiny muted">${S.sounds.length}개</span></div>
  <div class="list">
    ${S.sounds.map(s => `<div class="item">
      <div class="grow"><div class="ellipsis" style="font-weight:500">${h(s.name)}</div>
      <div class="small muted">${s.linked ? '공유받은 소리' : `${fmtDur(s.duration)} · ${fmtSize(s.size || 0)}`}</div></div>
      <button class="icon-btn soft" data-act="play-sound" data-id="${h(s.id)}" aria-label="${h(s.name)} 듣기">${I.play}</button>
      <button class="icon-btn soft" data-act="sound-menu" data-id="${h(s.id)}" aria-label="${h(s.name)} 메뉴">${I.down}</button></div>`).join('')}
    <button class="btn dashed" data-act="upload">+ 소리·음악 파일 올리기</button>
  </div>
  <div class="tiny muted">MP3·M4A·WAV·OGG, 파일 하나 20MB까지. 음악은 일과표에서 "최대 재생 시간"을 정하면 그 시간에 맞춰 자연스럽게 줄어들며 끝나요.</div>
  <button class="btn ghost" data-act="stop-all">재생 멈추기</button>
  <div class="row" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px">
    <button class="btn" data-act="library" data-kind="sound">공유 라이브러리</button>
    <button class="btn" data-act="import-code">공유 코드로 가져오기</button>
  </div>`;
}

// ── 기기 ─────────────────────────────────────
function playUrlBase() { return new URL('play.html', location.href).href.replace(/\?.*$/, ''); }
function viewDevices() {
  const p = S.pair && S.pair.expiresAt > Date.now() ? S.pair : null;
  return `<section class="card dark stack">
    <div class="bold" style="font-size:16px">재생기 추가</div>
    ${p ? `
      <div class="code-boxes num" aria-label="연결 번호 ${p.code}">${p.code.slice(0, 3).split('').map(c => `<span>${c}</span>`).join('')}<span class="gap"></span>${p.code.slice(3).split('').map(c => `<span>${c}</span>`).join('')}</div>
      <div class="qr" id="qr"></div>
      <div class="small muted" style="line-height:1.7">종을 울릴 PC·태블릿에서 QR을 찍거나 <b style="color:var(--gold)">${h(playUrlBase())}</b> 를 열고 번호를 넣으세요. 로그인은 필요 없어요.</div>
      <div class="tiny muted"><span id="pair-remain" data-at="${p.expiresAt}">${fmtRemain(p.expiresAt - Date.now())}</span> 뒤 번호가 사라져요</div>
      <div class="row"><button class="btn" style="background:transparent;color:#F4F5F2;border-color:#3A4842" data-act="copy" data-text="${h(playUrlBase() + '?code=' + p.code)}">주소 복사</button>
      <button class="btn" style="background:transparent;color:#F4F5F2;border-color:#3A4842" data-act="pair-new">새 번호</button></div>`
    : `<div class="small muted">연결 번호를 만들면 10분 동안 쓸 수 있어요.</div>
      <button class="btn gold lg" data-act="pair-new">연결 번호 만들기</button>`}
  </section>
  <div class="section-title"><h2>재생기 ${S.devices.length}대</h2><span class="tiny muted">관리자 ${(S.space && S.space.adminUids || []).length}명</span></div>
  <div class="list">
    ${S.devices.map(d => {
      const on = deviceOnline(d);
      const detail = on ? `${d.status === 'ready' ? '재생 중' : '재생 시작 버튼 대기'} · ${ago(millis(d.lastSeen))} 응답` : `${ago(millis(d.lastSeen))} 마지막 응답`;
      return `<button class="item" data-act="device" data-id="${h(d.id)}"><span class="dot ${on ? 'ok' : 'off'}"></span>
        <div class="grow"><div style="font-weight:500">${h(d.name || '재생기')}</div><div class="small muted">${h(detail)}</div></div>
        <span class="small bold" style="color:${on ? 'var(--ok)' : 'var(--muted)'}">${on ? '정상' : '꺼짐'}</span></button>`;
    }).join('') || '<div class="card muted center">아직 연결된 재생기가 없어요</div>'}
  </div>
  <div class="card stack small">
    <b>재생기 세팅 요령</b>
    <div class="muted" style="line-height:1.7">· 충전기를 꽂아 두고, 화면 꺼짐 시간을 "안 함"으로<br>· 절전 모드를 끄고, 크롬을 배터리 최적화에서 빼기<br>· 홈 화면에 추가하면 앱처럼 전체 화면으로 열려요<br>· 아이들이 못 건드리게: 안드로이드 "앱 고정", 아이패드 "사용법 유도된 접근"<br>· 앞으로 7일 일정을 기기에 저장해 두어서, 인터넷이 잠깐 끊겨도 기본 종소리는 제시간에 울려요</div>
  </div>`;
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
  return `<div class="sheet-back" data-act="sheet-back"><div class="sheet" role="dialog" aria-modal="true" aria-label="${h(title)}">
    <div class="sheet-head">${opts.back ? `<button class="icon-btn" data-act="${opts.back}" aria-label="뒤로">${I.left}</button>` : ''}<h3 class="grow">${h(title)}</h3>
    <button class="icon-btn" data-act="sheet-close" aria-label="닫기">${I.close}</button></div>${body}</div></div>`;
}
function renderSheet() {
  const sh = S.sheet;
  if (!sh) { sheetRoot.innerHTML = ''; document.body.style.overflow = ''; return; }
  document.body.style.overflow = 'hidden';
  const fn = {
    'space-menu': sheetSpaceMenu, 'space-new': () => sheetFrame('새 공간', renderOnboarding(false)), 'space-edit': sheetSpaceEdit, 'admins': sheetAdmins, 'holidays': sheetHolidays,
    'ring': sheetRing, 'date': sheetDate, 'rule': sheetRule,
    'tt-new': sheetTtNew, 'tt-templates': sheetTemplates, 'tt-edit': sheetTtEdit,
    'share': sheetShare, 'import': sheetImport, 'library': sheetLibrary,
    'upload': sheetUpload, 'sound-menu': sheetSoundMenu, 'device': sheetDevice
  }[sh.type];
  sheetRoot.innerHTML = fn ? fn(sh) : '';
  const first = sheetRoot.querySelector('[autofocus]');
  if (first) first.focus();
}

function sheetSpaceMenu() {
  return sheetFrame('공간·계정', `
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
  const opts = [...BUILTIN_SOUNDS.map(s => ({ id: s.id, name: s.name })), ...S.sounds.map(s => ({ id: s.id, name: s.name }))];
  return sheetFrame('지금 울리기', `
    <div class="small muted">연결된 모든 재생기에서 바로 울려요.</div>
    <div class="list">${opts.map(o => `<div class="item"><div class="grow" style="font-weight:500">${h(o.name)}</div>
      <button class="icon-btn soft" data-act="play-sound" data-id="${h(o.id)}" aria-label="이 기기에서 듣기">${I.play}</button>
      <button class="btn primary" data-act="ring-send" data-id="${h(o.id)}">울리기</button></div>`).join('')}</div>
    <label class="field"><span>안내 문구 (선택)</span><input class="input" id="ring-say" maxlength="120" placeholder="예: 전체 학생은 강당으로 모여주세요"></label>
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

function sheetTtEdit(sh) {
  const d = sh.draft;
  const bells = d.bells;
  return sheetFrame(d.id ? '일과표 고치기' : '새 일과표', `
    <label class="field"><span>일과표 이름</span><input class="input" data-b="name" maxlength="40" value="${h(d.name)}"></label>
    <div class="row wrap">
      <span class="small bold">전체 시간 밀기</span>
      <button class="btn soft" data-act="tt-shift" data-m="-5">−5분</button>
      <button class="btn soft" data-act="tt-shift" data-m="5">+5분</button>
      <button class="btn soft" data-act="tt-shift" data-m="10">+10분</button>
    </div>
    <div class="stack tight">
      ${bells.map((b, i) => `<div class="bell-edit">
        <div class="top">
          <input class="input num" type="time" data-b="${i}.time" value="${h(b.time)}" aria-label="시각">
          <input class="input grow" data-b="${i}.label" maxlength="40" placeholder="이름 (예: 1교시 시작)" value="${h(b.label)}" aria-label="종 이름">
          <button class="icon-btn soft" data-act="tt-del-bell" data-i="${i}" aria-label="이 종 지우기">${I.trash}</button>
        </div>
        <div class="top">
          <select class="input grow" data-b="${i}.soundId" aria-label="소리">${soundOptions(b.soundId)}</select>
          <button class="icon-btn soft" data-act="tt-preview" data-i="${i}" aria-label="미리 듣기">${I.play}</button>
          <button class="btn soft" data-act="tt-more" data-i="${i}" aria-expanded="${b._open ? 'true' : 'false'}">${b._open ? '접기' : '더보기'}</button>
        </div>
        ${b._open ? `<div class="more">
          <label class="field"><span>음량 ${b.volume}%</span><input type="range" min="10" max="100" step="5" data-b="${i}.volume" value="${b.volume}"></label>
          <label class="field"><span>최대 재생(초, 0=끝까지)</span><input class="input num" type="number" min="0" max="3600" data-b="${i}.maxSec" value="${b.maxSec || 0}"></label>
          <label class="field" style="grid-column:1 / -1"><span>안내 문구 (소리 뒤에 읽어줌)</span><input class="input" maxlength="120" data-b="${i}.say" placeholder="예: 점심시간입니다." value="${h(b.say || '')}"></label>
        </div>` : ''}
      </div>`).join('')}
      <button class="btn dashed" data-act="tt-add-bell">+ 종 추가</button>
    </div>
    <button class="btn primary lg block" data-act="tt-save">저장</button>
    ${d.id ? `<div class="row" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">
      <button class="btn" data-act="tt-copy">복제</button>
      <button class="btn" data-act="share-tt">공유</button>
      <button class="btn danger" data-act="tt-delete">삭제</button></div>` : ''}`);
}

function sheetShare(sh) {
  if (sh.result) {
    const link = new URL('index.html', location.href).href.replace(/\?.*$/, '') + '?share=' + sh.result;
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
      ${d.ua ? `<div class="muted ellipsis">${h(d.ua)}</div>` : ''}
    </div>
    <label class="field"><span>이름</span><input class="input" id="dv-name" maxlength="30" value="${h(d.name || '')}"></label>
    <button class="btn primary block" data-act="device-rename" data-id="${h(d.id)}">이름 저장</button>
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
  const bad = d.bells.find(b => !/^\d{2}:\d{2}/.test(b.time || ''));
  if (bad) { toast('시각이 비어 있는 종이 있어요'); return; }
  const bells = cleanBells(d.bells);
  try {
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

function soundInUse(id) { return S.timetables.filter(t => (t.bells || []).some(b => b.soundId === id)); }
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
        const say = (document.getElementById('ring-say') || {}).value || '';
        await sendCommand({ type: 'ring', soundId: id, say: say.slice(0, 120), label: '지금 울리기' });
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
        const bs = sh.draft.bells; const last = bs[bs.length - 1];
        const t = last ? timeToSec(last.time) / 60 + 10 : 9 * 60;
        bs.push({ time: `${pad(Math.floor(t / 60) % 24)}:${pad(Math.floor(t % 60))}`, label: '', soundId: last ? last.soundId : 'b:westminster', volume: 100, maxSec: 0, say: '', _open: false });
        renderSheet();
        const inputs = sheetRoot.querySelectorAll('input[type=time]'); if (inputs.length) inputs[inputs.length - 1].scrollIntoView({ block: 'center' });
        return;
      }
      case 'tt-del-bell': sh.draft.bells.splice(Number(el.dataset.i), 1); return renderSheet();
      case 'tt-more': { const b = sh.draft.bells[Number(el.dataset.i)]; b._open = !b._open; return renderSheet(); }
      case 'tt-preview': return playBell(sh.draft.bells[Number(el.dataset.i)], soundsById());
      case 'tt-shift': {
        const mins = Number(el.dataset.m);
        sh.draft.bells.forEach(b => { let t = timeToSec(b.time) / 60 + mins; t = (t + 1440) % 1440; b.time = `${pad(Math.floor(t / 60))}:${pad(Math.floor(t % 60))}`; });
        toast(`모든 종을 ${mins > 0 ? '+' : ''}${mins}분 옮겼어요 (저장해야 반영돼요)`);
        return renderSheet();
      }
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
    b[f] = (f === 'volume' || f === 'maxSec') ? Number(t.value) : t.value;
    if (f === 'volume') { const lab = t.closest('label').querySelector('span'); if (lab) lab.textContent = `음량 ${t.value}%`; }
  }
  if (sh.type === 'rule') {
    if (t.dataset.r) sh.draft[t.dataset.r] = t.value;
    if (t.dataset.rd != null) { sh.draft.days = sh.draft.days || {}; sh.draft.days[t.dataset.rd] = t.value; }
  }
});
document.addEventListener('change', e => {
  // select 상자는 input 이벤트가 없는 브라우저도 있어 한 번 더
  if (e.target.tagName === 'SELECT') e.target.dispatchEvent(new Event('input', { bubbles: true }));
});
document.addEventListener('keydown', e => {
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

if (!F.configured) {
  renderNotConfigured();
} else {
  F.getRedirectResult(F.auth).catch(e => console.warn(e));
  F.onAuthStateChanged(F.auth, async user => {
    stopSubs();
    if (!user || user.isAnonymous) { S.user = null; renderLogin(); return; }
    S.user = user;
    root.innerHTML = '<div class="hero"><div class="logo">' + I.logo + '</div><div class="muted">불러오는 중…</div></div>';
    try {
      await loadSpaces();
    } catch (e) { console.error(e); renderLogin('공간 목록을 불러오지 못했어요. 보안 규칙이 게시되었는지 확인해주세요.'); return; }
    if (!S.spaces.length) { renderOnboarding(true); return; }
    const saved = localStorage.getItem(LS.space);
    openSpace(S.spaces.find(s => s.id === saved) ? saved : S.spaces[0].id);
  });
}
