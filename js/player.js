// 벨키퍼 재생기 — PC·태블릿에서 정해진 시간에 종을 울립니다.
import * as F from './fb.js';
import {
  APP_VERSION, todayKey, koreanDate, upcomingBells, bellsForDay, schedCtx, fmtRemain, fmtClock, escapeHtml as h, cleanBells, PLAYER_STYLES, styleName, DOW_LABELS, bellColor, DIALS, FONTS, loadFont, fontCss, ABGS, INK_ARTS, DIGIS, HGS } from './core.js';
import { clockSvg, inkArt, inkClock, INK_SCENES, DIGI_STYLES, digitalSvg, HG_GRID, HG_STYLES, hangulLit, hourWord, sinoNum, monthWord, dayWord, hanjaNum } from './faces.js';
import { watchUpdates, reloadToLatest } from './version.js';
import {
  playBell, stopAll, unlockAudio, audioReady, preloadUrl, forgetUnused, builtinName, isBuiltin, preloadBuiltins, isStream, builtinUrl,
  deviceVoices, getDeviceVoicePref, setDeviceVoicePref, speak, probeCors
} from './sounds.js';
import { createRTA } from './rta.js';

const el = document.getElementById('pl');
const gate = document.getElementById('gate');
const overlay = document.getElementById('ringing');
const LS_KEY = 'bk.player';
const LS_MODE = 'bk.player.mode';
const MODES = ['light', 'dark', 'board', 'big', 'period', 'analog', 'analog2', 'analog3', 'date', 'flip', 'minimal', 'ink', 'digital', 'hangul'];
const PREVIEW = new URLSearchParams(location.search).has('preview');
const DARK_MODES = ['dark', 'big', 'analog2', 'flip', 'minimal', 'digital'];
const LS_OPT = 'bk.player.opt';
function validMode(v) { return MODES.includes(v) ? v : 'light'; }
const LS_FIRED = 'bk.player.fired';
const FIRE_WINDOW = 20000;     // 정각을 놓쳐도 20초 안이면 울림
const HEARTBEAT_MS = 60000;
const OFFSET_EVERY = 15 * 60000;

const P = {
  uid: null, saved: null, space: null, timetables: [], rules: [], sounds: [], groups: [], group: '', logSince: '', devLoaded: false,
  offset: 0, offsetOk: false, running: false, unsub: [], seenCmd: null,
  mode: validMode(localStorage.getItem(LS_MODE)),
  upcoming: [], upcomingAt: 0, fromCache: false, wake: null, ringing: null, started: false, update: null,
  // 화면 보호·음량·잠금 (관리자가 원격으로 바꾸면 그대로 따름)
  opt: Object.assign({ saver: 'night', cycle: 0, vol: 100, font: 'noto', dial: 'classic', abg: 'plain', art: 'auto', digi: 'led', hg: 'gold' }, (() => { try { return JSON.parse(localStorage.getItem(LS_OPT) || '{}'); } catch (e) { return {}; } })()),
  locked: false, pinHash: '', unlockedUntil: 0, seen: {}
};
function saveOpt() { if (PREVIEW) return; try { localStorage.setItem(LS_OPT, JSON.stringify(P.opt)); } catch (e) { /* 무시 */ } }
const now = () => Date.now() + P.offset;
const tz = () => (P.space && P.space.timezone) || 'Asia/Seoul';
// 이 재생기가 속한 재생 그룹 기준으로 일정 계산
const ctx = () => schedCtx(P.group, P.groups);
const soundsById = () => Object.fromEntries(P.sounds.map(s => [s.id, s]));
const myDoc = () => F.doc(F.db, 'spaces', P.saved.spaceId, 'devices', P.uid);
const sub = n => F.collection(F.db, 'spaces', P.saved.spaceId, n);

const LOGO = '<svg viewBox="0 0 120 120" width="36" height="36" aria-hidden="true"><rect x="4" y="4" width="112" height="112" rx="28" fill="#E0B25A"/><path d="M60 26 C46 26 38 37 38 52 L38 66 L31 75 L89 75 L82 66 L82 52 C82 37 74 26 60 26 Z" fill="#17231F"/><circle cx="60" cy="84" r="6" fill="#17231F"/><path d="M24 46 C20 52 20 60 24 66" fill="none" stroke="#17231F" stroke-width="5" stroke-linecap="round"/><path d="M96 46 C100 52 100 60 96 66" fill="none" stroke="#17231F" stroke-width="5" stroke-linecap="round"/></svg>';

function loadSaved() { try { return JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { return null; } }
function firedSet() {
  try { const o = JSON.parse(localStorage.getItem(LS_FIRED) || '{}'); return o; } catch (e) { return {}; }
}
function markFired(key) {
  const o = firedSet();
  o[key] = Date.now();
  // 이틀 지난 기록은 정리
  for (const k of Object.keys(o)) if (Date.now() - o[k] > 2 * 86400000) delete o[k];
  localStorage.setItem(LS_FIRED, JSON.stringify(o));
}

// ── 연결 화면 ─────────────────────────────────────
function showConnect(msg) {
  stopRunning();
  const code = new URLSearchParams(location.search).get('code') || '';
  gate.classList.remove('hidden');
  gate.innerHTML = `<div class="card stack loose">
    <div class="row" style="color:var(--ink)">${LOGO}<div><div class="bold" style="font-size:20px">벨키퍼 재생기</div><div class="small muted">이 기기에서 종을 울려요</div></div></div>
    ${msg ? `<div class="banner warn">${h(msg)}</div>` : ''}
    <label class="field"><span>연결 번호 6자리</span>
      <input class="input num" id="cn-code" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="관리자 화면 › 기기 › 연결 번호" value="${h(code)}" style="font-size:24px;letter-spacing:0.15em"></label>
    <label class="field"><span>이 기기 이름</span>
      <input class="input" id="cn-name" maxlength="30" placeholder="예: 방송실 PC, 2층 복도 태블릿" value="${h((P.saved && P.saved.name) || '')}"></label>
    <div id="cn-err" class="small" style="color:var(--danger)"></div>
    <button class="btn primary lg block" id="cn-go">연결하기</button>
    <div class="tiny muted">연결 번호는 관리자 화면의 "기기" 탭에서 만들 수 있어요. 10분 동안 쓸 수 있어요.</div>
  </div>`;
  const go = document.getElementById('cn-go');
  go.onclick = () => connect();
  document.getElementById('cn-code').onkeydown = e => { if (e.key === 'Enter') connect(); };
}

async function connect() {
  const code = document.getElementById('cn-code').value.replace(/\D/g, '');
  const name = document.getElementById('cn-name').value.trim() || '재생기';
  const err = document.getElementById('cn-err');
  const go = document.getElementById('cn-go');
  err.textContent = '';
  if (code.length !== 6) { err.textContent = '6자리 숫자를 넣어주세요.'; return; }
  go.disabled = true; go.textContent = '연결하는 중…';
  try {
    const snap = await F.getDoc(F.doc(F.db, 'pairCodes', code));
    if (!snap.exists()) throw new Error('nocode');
    const pc = snap.data();
    if (pc.expiresAt && pc.expiresAt.toMillis() < Date.now() - 60000) throw new Error('expired');
    await F.setDoc(F.doc(F.db, 'spaces', pc.spaceId, 'devices', P.uid), {
      name: name.slice(0, 30), code, pairedAt: F.serverTimestamp(), lastSeen: F.serverTimestamp(),
      status: 'waiting', ua: navigator.userAgent.slice(0, 160), version: APP_VERSION
    });
    P.saved = { spaceId: pc.spaceId, name };
    localStorage.setItem(LS_KEY, JSON.stringify(P.saved));
    history.replaceState(null, '', location.pathname);
    startRunning();
  } catch (e) {
    console.error(e);
    err.textContent = e.message === 'nocode' ? '그런 번호가 없어요. 번호를 다시 확인해주세요.'
      : e.message === 'expired' ? '번호가 만료됐어요. 관리자 화면에서 새 번호를 만들어주세요.'
      : '연결하지 못했어요. 번호가 만료됐거나 인터넷 연결을 확인해주세요.';
    go.disabled = false; go.textContent = '연결하기';
  }
}

// ── 재생 시작 화면 (소리를 내려면 한 번 눌러야 해요) ─────────────
function showGate() {
  gate.classList.remove('hidden');
  gate.innerHTML = `<div class="card stack loose center">
    <div style="color:var(--ink);display:flex;justify-content:center">${LOGO}</div>
    <div class="bold" style="font-size:22px">${h((P.space && P.space.name) || '벨키퍼')} · ${h(P.saved.name || '재생기')}</div>
    <div class="muted">브라우저가 소리를 낼 수 있도록 아래 버튼을 한 번 눌러주세요.</div>
    <button class="btn gold lg block" id="gate-go" style="min-height:64px;font-size:20px">재생 시작</button>
    <div class="tiny muted">화면을 켜 둔 채로 두세요. 이 기기를 껐다 켜면 다시 한 번 눌러야 해요.</div>
  </div>`;
  const go = async () => {
    await unlockAudio();
    await keepAwake();
    try { if (document.documentElement.requestFullscreen && matchMedia('(pointer:coarse)').matches) await document.documentElement.requestFullscreen(); } catch (e) { /* 무시 */ }
    gate.classList.add('hidden');
    P.started = true;
    heartbeat();
    draw();
  };
  document.getElementById('gate-go').onclick = go;
  // 원격 새로 고침 뒤 등: 누르지 않아도 소리를 낼 수 있는 브라우저면 바로 시작
  setTimeout(async () => {
    if (P.started || gate.classList.contains('hidden')) return;
    try { if (await unlockAudio() && !P.started && document.getElementById('gate-go')) go(); } catch (e) { /* 무시 */ }
  }, 1500);
}

// ── 화면 켜짐 유지 ─────────────────────────────────────
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      P.wake = await navigator.wakeLock.request('screen');
      P.wake.addEventListener('release', () => { P.wake = null; draw(); });
    }
  } catch (e) { P.wake = null; }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && P.running) { keepAwake(); refreshOffset(); recompute(); }
});

// ── 실행 ─────────────────────────────────────
function stopRunning() {
  P.running = false;
  P.started = false;
  P.unsub.forEach(u => { try { u(); } catch (e) { /* 무시 */ } });
  P.unsub = [];
}

function disconnected(msg) {
  localStorage.removeItem(LS_KEY);
  P.saved = null;
  showConnect(msg || '관리자가 이 기기의 연결을 해제했어요. 다시 연결하려면 새 번호를 넣어주세요.');
}

function startRunning() {
  stopRunning();
  P.running = true;
  P.seenCmd = null;
  P.listenSince = Date.now() - 5000;
  P.seen = {};
  gate.classList.add('hidden');
  el.classList.remove('hidden');
  const onErr = e => {
    if (e && e.code === 'permission-denied') { console.warn('연결이 해제되었어요'); disconnected(); return; }
    console.error(e);
  };
  P.unsub.push(F.onSnapshot(myDoc(), d => {
    if (!d.exists()) { if (!d.metadata.fromCache) disconnected(); return; }
    const x = d.data();
    // 관리자가 [기기] 화면에서 바꾼 값은 "바뀐 때만" 따름 (재생기에서 직접 바꾼 값도 존중)
    const changed = k => { const v = x[k]; const was = P.seen[k]; P.seen[k] = v; return v !== undefined && v !== was; };
    let redraw = false;
    if (changed('display') && MODES.includes(x.display) && x.display !== P.mode) { P.mode = x.display; try { localStorage.setItem(LS_MODE, P.mode); } catch (e) { /* 무시 */ } redraw = true; }
    if (changed('saver') && ['night', 'off'].includes(x.saver)) { P.opt.saver = x.saver; redraw = true; }
    if (changed('cycle') && [0, 15, 30, 60].includes(x.cycle)) { P.opt.cycle = x.cycle; redraw = true; }
    if (changed('font') && FONTS.some(f => f.id === x.font)) { P.opt.font = x.font; redraw = true; }
    if (changed('dial') && DIALS.some(f => f.id === x.dial)) { P.opt.dial = x.dial; redraw = true; }
    if (changed('abg') && ABGS.some(f => f.id === x.abg)) { P.opt.abg = x.abg; redraw = true; }
    if (changed('art') && INK_ARTS.some(f => f.id === x.art)) { P.opt.art = x.art; redraw = true; }
    if (changed('digi') && DIGIS.includes(x.digi)) { P.opt.digi = x.digi; redraw = true; }
    if (changed('hg') && HGS.includes(x.hg)) { P.opt.hg = x.hg; redraw = true; }
    if (changed('vol') && Number.isFinite(x.vol)) { P.opt.vol = Math.max(10, Math.min(100, x.vol)); }
    saveOpt();
    P.logSince = x.logSince || ''; P.devLoaded = true;
    if ((x.group || '') !== (P.group || '')) { P.group = x.group || ''; recompute(); }
    const lockNow = !!x.locked && !!x.pinHash;
    if (lockNow !== P.locked || (x.pinHash || '') !== P.pinHash) { P.locked = lockNow; P.pinHash = x.pinHash || ''; P.unlockedUntil = 0; redraw = true; if (!P.locked && gate.dataset.kind === 'pin') gate.classList.add('hidden'); }
    if (redraw) draw();
  }, onErr));
  P.unsub.push(F.onSnapshot(F.doc(F.db, 'spaces', P.saved.spaceId), d => {
    if (d.exists()) { P.space = { id: d.id, ...d.data() }; P.fromCache = d.metadata.fromCache; recompute(); }
  }, onErr));
  P.unsub.push(F.onSnapshot(sub('timetables'), q => { P.timetables = q.docs.map(d => ({ id: d.id, ...d.data(), bells: cleanBells(d.data().bells) })); recompute(); }, onErr));
  P.unsub.push(F.onSnapshot(sub('rules'), q => { P.rules = q.docs.map(d => ({ id: d.id, ...d.data() })); recompute(); }, onErr));
  P.unsub.push(F.onSnapshot(sub('groups'), q => { P.groups = q.docs.map(d => ({ id: d.id, ...d.data() })); recompute(); }, e => console.warn(e)));
  P.unsub.push(F.onSnapshot(sub('sounds'), q => {
    P.sounds = q.docs.map(d => ({ id: d.id, ...d.data() })); recompute();
    if (!P.corsProbed) { const f = P.sounds.find(s => s.url); if (f) { P.corsProbed = true; probeCors(f.url); } }
  }, onErr));
  P.unsub.push(F.onSnapshot(F.query(sub('commands'), F.orderBy('createdAt', 'desc'), F.limit(10)), q => {
    if (P.seenCmd === null) P.seenCmd = new Set();
    // 오래된 것부터 순서대로 (최신 명령이 마지막에 남도록)
    const tsOf = d => { const c = d.data().createdAt; return c && c.toMillis ? c.toMillis() : now(); };
    const changes = q.docChanges().filter(ch => ch.type === 'added').sort((a, b) => tsOf(a.doc) - tsOf(b.doc));
    for (const ch of changes) {
      if (P.seenCmd.has(ch.doc.id)) continue;
      P.seenCmd.add(ch.doc.id);
      const c = ch.doc.data();
      const at = c.createdAt && c.createdAt.toMillis ? c.createdAt.toMillis() : now();
      // 이 화면을 켜기 전에 보낸 명령과 2분 넘게 지난 명령은 무시
      if (at < P.listenSince || now() - at > 120000) continue;
      if (c.target && c.target !== P.uid) continue;
      if (c.type === 'stop') { stopAll(); hideRinging(); }
      if (c.type === 'reload') { P.allowLeave = true; setTimeout(() => reloadToLatest(), 800); continue; }
      if (c.type === 'ring') {
        const extra = c.sayUrl ? { __cmd: { url: c.sayUrl } } : null;
        ring({ soundId: c.soundId, say: c.say || '', sayId: c.sayUrl ? '__cmd' : '', bgmId: c.bgmId || '', bgmVol: c.bgmVol || 30, label: c.label || '지금 울리기', volume: 100 }, extra);
      }
    }
  }, onErr));
  refreshOffset();
  showGate();
}

async function refreshOffset() {
  if (PREVIEW || !P.saved) return;
  try {
    const r = await Promise.race([F.measureServerOffset(myDoc()), new Promise(res => setTimeout(() => res(null), 8000))]);
    if (r && r.rtt < 4000) { P.offset = r.offset; P.offsetOk = true; }
  } catch (e) { console.warn(e); }
}

function recompute() {
  if (!P.space) return;
  const n = now();
  P.upcoming = upcomingBells(n - FIRE_WINDOW, P.rules, P.timetables, tz(), 7, ctx());
  P.upcomingAt = n;
  // 앞으로 이틀 동안 쓸 파일은 미리 불러 두기
  const keep = new Set();
  const byId = soundsById();
  for (const b of P.upcoming) {
    if (b.at - n > 2 * 86400000) break;
    if (!isBuiltin(b.soundId) && byId[b.soundId] && byId[b.soundId].url) { keep.add(byId[b.soundId].url); preloadUrl(byId[b.soundId].url); }
    if (b.sayId && byId[b.sayId] && byId[b.sayId].url) { keep.add(byId[b.sayId].url); preloadUrl(byId[b.sayId].url); }
    if (b.bgmId && byId[b.bgmId] && byId[b.bgmId].url) { keep.add(byId[b.bgmId].url); preloadUrl(byId[b.bgmId].url); }
    for (const sid of [b.soundId, b.bgmId]) if (sid && isBuiltin(sid) && isStream(sid)) keep.add(builtinUrl(sid));
  }
  forgetUnused(keep);
  preloadBuiltins([...new Set(P.upcoming.filter(b => b.at - n < 2 * 86400000).slice(0, 60).flatMap(b => [b.soundId, b.bgmId]).filter(Boolean))]);
  draw();
}

async function heartbeat() {
  if (PREVIEW || !P.saved || !P.running) return;
  const next = P.upcoming.find(b => b.at > now());
  try {
    await F.updateDoc(myDoc(), {
      lastSeen: F.serverTimestamp(),
      status: audioReady() ? 'ready' : 'waiting',
      nextLabel: next ? `${next.time} ${next.label || '종'}`.slice(0, 60) : '',
      offsetMs: Math.round(P.offset),
      ua: navigator.userAgent.slice(0, 160),
      version: APP_VERSION,
      mode: P.mode,
      ...(P.logSince || !P.devLoaded ? {} : { logSince: todayKey(now(), tz()) })
    });
    if (!P.logSince && P.devLoaded) P.logSince = todayKey(now(), tz());
  } catch (e) { console.warn(e); }
}

// ── 종 울리기 ─────────────────────────────────────
function ring(b, extra) {
  showRinging(b);
  const vol = Math.round((b.volume == null ? 100 : b.volume) * (P.opt.vol || 100) / 100);
  const ctl = playBell({ ...b, volume: vol }, Object.assign(soundsById(), extra || {}));
  P.ringing = ctl;
  ctl.finished.then(() => { if (P.ringing === ctl) { P.ringing = null; hideRinging(); } });
}
function showRinging(b) {
  overlay.classList.remove('hidden');
  overlay.innerHTML = `<svg class="ring-pulse" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#E0B25A" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>
    <div class="lab">${h(b.label || '종')}</div>
    <canvas class="pl-rta" aria-hidden="true"></canvas>
    <div style="font-size:20px;color:#C9D1CC">${h(b.time || '')} ${h(isBuiltin(b.soundId) ? builtinName(b.soundId) : ((soundsById()[b.soundId] || {}).name || ''))}</div>
    ${b.say ? `<div style="font-size:20px">"${h(b.say)}"</div>` : ''}
    <button class="btn lg" id="ring-stop" style="background:transparent;color:#F4F5F2;border-color:#3A4842">소리 멈추기</button>`;
  document.getElementById('ring-stop').onclick = () => { stopAll(); hideRinging(); };
  if (P.rta) P.rta.kill();
  P.rta = createRTA(overlay.querySelector('.pl-rta'));
  P.rta.start();
}
function hideRinging() { if (P.rta) { P.rta.kill(); P.rta = null; } overlay.classList.add('hidden'); overlay.innerHTML = ''; }

function tick() {
  if (PREVIEW || !P.running || !P.space) return;
  const n = now();
  if (n - P.upcomingAt > 60000) recompute();
  const fired = firedSet();
  for (const b of P.upcoming) {
    if (b.at > n) break;
    if (n - b.at > FIRE_WINDOW || fired[b.key]) continue;
    markFired(b.key);
    if (P.started) { ring(b); logRing(b); }
  }
}

// 울린 종 기록 (관리자 [종합 관제]에서 놓친 종을 찾을 때 씀) — 하루에 문서 하나
function logRing(b) {
  if (PREVIEW || !P.saved || !b.dateKey) return;
  F.setDoc(F.doc(F.db, 'spaces', P.saved.spaceId, 'devices', P.uid, 'logs', b.dateKey),
    { date: b.dateKey, r: { [`${b.time}#${b.idx}`]: Date.now() } }, { merge: true }).catch(e => console.warn(e));
}

// ── 화면 그리기 ─────────────────────────────────────
// "17:08 남음"은 시각처럼 보여서 글자로: 17분 8초 / 2시간 5분 / 1일 3시간
function fmtLeft(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(t / 86400), hh = Math.floor((t % 86400) / 3600), mm = Math.floor((t % 3600) / 60), ss = t % 60;
  if (d > 0) return `${d}일 ${hh}시간`;
  if (hh > 0) return `${hh}시간 ${mm}분`;
  if (mm > 0) return `${mm}분 ${ss}초`;
  return `${ss}초`;
}
const LOCK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function isLocked() { return P.locked && Date.now() > P.unlockedUntil; }
function bigDate(z) { return { y: z.y, md: `${z.m}월 ${z.d}일`, dow: `${DOW_LABELS[z.dow]}요일` }; }
function analogSvg(z, dark, dial) { return clockSvg(z, dial || P.opt.dial || 'classic'); }
// 쉬는 시간·밤에는 화면 보호, 정해 둔 시간마다 화면 바꾸기
function effectiveMode(n, day) {
  if (PREVIEW) return P.mode;
  if (P.opt.saver === 'night') {
    const L = day.bells;
    const off = !L.length || n < L[0].at - 30 * 60000 || n > L[L.length - 1].at + 15 * 60000;
    if (off && !P.ringing) return 'minimal';
  }
  if (P.opt.cycle > 0 && P.mode !== 'minimal') {
    const list = MODES.filter(m => m !== 'minimal');
    const k = Math.floor(n / (P.opt.cycle * 60000));
    return list[(list.indexOf(P.mode) + k) % list.length];
  }
  return P.mode;
}
// 화면 타는 것 방지: 1분마다 화면 전체를 몇 픽셀씩 옮김 (눈에는 거의 안 보임)
function applyShift() {
  const k = Math.floor(Date.now() / 60000) % 8;
  const a = k * Math.PI / 4;
  el.style.transform = `translate(${(Math.cos(a) * 4).toFixed(1)}px, ${(Math.sin(a) * 4).toFixed(1)}px)`;
}
function draw() {
  if (!P.running || !P.space) return;
  const n = now();
  const key = todayKey(n, tz());
  const clock = fmtClock(n, tz());
  const next = P.upcoming.filter(b => b.at > n);
  const nx = next[0];
  const day = bellsForDay(key, P.rules, P.timetables, tz(), ctx());
  const mode = effectiveMode(n, day);
  P.shown = mode;
  loadFont(P.opt.font);
  el.style.fontFamily = fontCss(P.opt.font);
  if (mode !== 'ink') el.dataset.ink = '';
  const online = navigator.onLine && !P.fromCache;
  const checks = [
    [P.offsetOk, P.offsetOk ? '서버 시간 기준' : '기기 시계 기준'],
    [true, '7일 일정 저장됨'],
    [!!P.wake || !('wakeLock' in navigator), P.wake ? '화면 켜짐 유지' : (('wakeLock' in navigator) ? '화면 켜짐 유지 안 됨' : '화면 꺼짐을 "안 함"으로')],
    [audioReady(), audioReady() ? '소리 준비됨' : '소리 대기']
  ];
  const ck = ok => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${ok ? (DARK_MODES.includes(mode) ? '#4CC28A' : '#2F6B4F') : '#A23B2A'}" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">${ok ? '<path d="M5 12l5 5 9-10"/>' : '<path d="M12 7v6M12 17v.5"/>'}</svg>`;
  const foot = `<div class="pl-foot">
      ${online ? '' : '<span class="pl-offline">인터넷 끊김 · 저장된 일정으로 울려요</span>'}
      ${mode === 'minimal' && P.mode !== 'minimal' ? '<span class="small" style="opacity:.8">화면 보호 중 · 수업 시간이 되면 원래 화면으로</span>' : ''}
      ${checks.map(([ok, t]) => `<span class="row" style="gap:6px">${ck(ok)}${h(t)}</span>`).join('')}
      <span class="grow"></span>
      <span class="small num" style="opacity:.7">v${h(APP_VERSION)}</span>
      ${P.update && P.update.isNew ? `<button class="btn" data-pl="update" style="border-color:var(--brass);color:inherit">새 버전 ${h(P.update.latest)} 업데이트</button>` : ''}
      ${isLocked() ? `<button class="btn" data-pl="unlock" aria-label="잠금 풀기">${LOCK} 잠김</button>` : `${P.locked ? `<button class="btn" data-pl="relock">${LOCK} 다시 잠그기</button>` : ''}
      <button class="btn" data-pl="test">소리 시험</button>
      <button class="btn" data-pl="menu">설정</button>`}
    </div>`;
  const head = `<div class="pl-top"><div class="row pl-name">${LOGO}<span class="ellipsis">${h(P.space.name)} · ${h(P.saved.name || '재생기')}</span></div>
      ${['dark', 'period', 'analog2'].includes(mode) ? `<div class="bold num" style="font-size:22px">${clock.hm}</div>` : `<div class="row status-ok" style="gap:8px"><span class="dot ok"></span>재생 중</div>`}</div>`;

  const big = bigDate(clock.z);
  const upc = (k, from = 0) => next.slice(from, from + k).map(b => `<div class="pl-up"><span class="cdot" style="background:${bellColor(b).c}"></span><b class="num">${h(b.time)}</b><span class="ellipsis">${h(b.label || '종')}${nxDay(b)}</span></div>`).join('');
  const sname = id => isBuiltin(id) ? builtinName(id) : ((soundsById()[id] || {}).name || '');
  const nxDay = b => b.dateKey !== key ? ` · ${h(koreanDate(b.dateKey))}` : '';

  if (mode === 'analog') {
    el.className = `pl analog abg-${P.opt.abg || 'plain'}`;
    el.innerHTML = `${head}
      <div class="pl-an">
        <div class="pl-bigdate"><span>${big.md}</span><b>${big.dow}</b></div>
        <div class="pl-face">${analogSvg(clock.z)}</div>
        <div class="pl-digi num">${clock.hm}<small>:${clock.s}</small></div>
        <div class="pl-nextline">${nx ? `<span class="tag">다음 종</span><b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'ink') {
    const art = (!P.opt.art || P.opt.art === 'auto') ? INK_SCENES[Math.floor(n / 1800000) % INK_SCENES.length].id : P.opt.art;
    const sc = INK_SCENES.find(x => x.id === art) || INK_SCENES[0];
    if (el.dataset.ink !== art || !el.querySelector('.ink-dyn')) {
      el.className = 'pl ink';
      el.innerHTML = `${inkArt(art)}<div class="ink-dyn"></div>`;
      el.dataset.ink = art;
    }
    const z = clock.z;
    const hj = `${hanjaNum(z.h % 12 === 0 ? 12 : z.h % 12)}時`;
    el.querySelector('.ink-dyn').innerHTML = `${head}
      <div class="ink-clock" style="--x:${sc.pos.x}%;--y:${sc.pos.y}%;--r:${sc.pos.r}">${inkClock(z, art)}</div>
      <div class="ink-date" style="--x:${sc.pos.x}%;--y:${sc.pos.y}%;--r:${sc.pos.r}">${big.md} ${big.dow}</div>
      ${sc.vt ? `<div class="ink-vt">${monthWord(z.m)} ${dayWord(z.d)} ${big.dow}</div><div class="ink-seal" style="background:${sc.seal || '#C8352A'}"><span>${hj}</span><span>${hanjaNum(z.mi) || '零'}分</span></div>` : ''}
      <div class="ink-next">${nx ? `다음 종 <b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      ${foot}`;
    return applyShift();
  }
  if (mode === 'digital') {
    const id = DIGIS.includes(P.opt.digi) ? P.opt.digi : 'led';
    el.className = `pl digital dg-${id}`;
    el.innerHTML = `${head}
      <div class="pl-dg">
        <div class="dg-face">${digitalSvg(id, clock.hm, Number(clock.s))}</div>
        <div class="dg-date">${big.md} ${big.dow}</div>
        <div class="dg-next">${nx ? `다음 종 <b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'hangul') {
    const id = HGS.includes(P.opt.hg) ? P.opt.hg : 'gold';
    const z = clock.z;
    const next = nx ? `다음 종 ${h(nx.time)} ${h(nx.label || '종')}` : '';
    el.className = `pl hangul hg-${id}`;
    if (id === 'sentence') {
      const special = z.mi === 0 && (z.h === 12 || z.h === 0);
      el.innerHTML = `${head}
        <div class="pl-hs">
          <div class="hs-pre">지금은</div>
          ${special ? `<div class="hs-big"><em>${z.h === 12 ? '정오' : '자정'}</em>예요</div>` :
          `<div class="hs-big">${z.h < 12 ? '오전' : '오후'} <em>${hourWord(z.h)} 시</em></div>
          <div class="hs-big">${z.mi ? `<em class="b">${sinoNum(z.mi)} 분</em>이에요` : '<em class="b">정각</em>이에요'}</div>`}
          <div class="hs-sub">${monthWord(z.m)} ${dayWord(z.d)} ${big.dow}${next ? ` · ${next}` : ''}</div>
        </div>${foot}`;
      return applyShift();
    }
    const lit = hangulLit(z.h, z.mi);
    el.innerHTML = `${head}
      <div class="pl-hg">
        <div class="hg-grid">${HG_GRID.map((row, r) => [...row].map((ch, c) => `<span class="${lit.has(`${r},${c}`) ? 'on' : ''}">${ch}</span>`).join('')).join('')}</div>
        <div class="hg-sub">${z.h < 12 ? '오전' : '오후'} · ${big.md} ${big.dow}${next ? ` · ${next}` : ''}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'analog3') {
    el.className = `pl analog3 abg-${P.opt.abg || 'plain'}`;
    el.innerHTML = `${head}
      <div class="pl-an3">
        <div class="an3-s an3-l"><div class="md">${big.md}</div><div class="dow">${big.dow}</div><div class="yr">${big.y}년${day.tt ? ` · ${h(day.tt.name)}` : ''}</div></div>
        <div class="pl-face">${analogSvg(clock.z)}</div>
        <div class="an3-s an3-r"><div class="pl-digi num">${clock.hm}<small>:${clock.s}</small></div>
          <div class="nx">${nx ? `<div class="small" style="opacity:.7">다음 종${nxDay(nx)}</div><div class="t num">${h(nx.time)}</div><div class="l">${h(nx.label || '종')}</div><div class="small">${fmtLeft(nx.at - n)} 남음</div>` : '<div class="l">앞으로 7일 동안 울릴 종이 없어요</div>'}</div></div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'analog2') {
    el.className = 'pl analog2';
    el.innerHTML = `${head}
      <div class="pl-body">
        <div class="pl-an2-left"><div class="pl-face">${analogSvg(clock.z, true)}</div><div class="pl-digi num">${clock.hm}<small>:${clock.s}</small></div></div>
        <div class="pl-an2-right">
          <div class="md">${big.md}</div><div class="dow">${big.dow}</div>
          <div class="yr">${big.y}년 ${day.tt ? `· ${h(day.tt.name)}` : '· 오늘은 종 없음'}</div>
          <div class="nxcard">${nx ? `<div class="small" style="opacity:.75">다음 종${nxDay(nx)}</div><div class="t num">${h(nx.time)}</div><div class="l">${h(nx.label || '종')}</div><div style="opacity:.85">${fmtLeft(nx.at - n)} 남음</div>` : '<div class="l">앞으로 7일 동안 울릴 종이 없어요</div>'}</div>
          <div class="ups">${upc(3, 1)}</div>
        </div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'date') {
    el.className = 'pl date';
    el.innerHTML = `${head}
      <div class="pl-dt">
        <div class="dow">${big.dow}</div>
        <div class="md">${big.y}년 ${big.md}</div>
        <div class="tm num">${clock.hm}<small>:${clock.s}</small></div>
        <div class="pl-nextline">${nx ? `<span class="tag">다음 종</span><b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'flip') {
    const card = d => `<span class="fc"><span>${d}</span></span>`;
    el.className = 'pl flip';
    el.innerHTML = `${head}
      <div class="pl-flip">
        <div class="pl-bigdate"><span>${big.md}</span><b>${big.dow}</b></div>
        <div class="fl num">${card(clock.hm[0])}${card(clock.hm[1])}<span class="colon">:</span>${card(clock.hm[3])}${card(clock.hm[4])}<span class="sec">${clock.s}</span></div>
        <div class="pl-nextline">${nx ? `<span class="tag">다음 종</span><b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'minimal') {
    // 화면 보호: 어두운 바탕에 작은 시계가 천천히 떠다녀서 화면이 타지 않게
    const t = n / 1000;
    const x = 50 + 30 * Math.sin(t / 97), y = 45 + 25 * Math.sin(t / 131 + 1);
    el.className = 'pl minimal';
    el.innerHTML = `<div class="pl-min" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%">
        <div class="tm num">${clock.hm}</div>
        <div class="dt">${big.md} ${big.dow}</div>
        ${nx ? `<div class="nx">다음 종 <b class="num">${h(nx.time)}</b> ${h(nx.label || '종')}${nxDay(nx)}</div>` : ''}
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'board') {
    const list = day.bells;
    const ni = list.findIndex(b => b.at > n);
    const from = Math.max(0, Math.min((ni < 0 ? list.length : ni) - 2, list.length - 12));
    const rows = list.slice(from, from + 12);
    el.className = 'pl board';
    el.innerHTML = `${head}
      <div class="pl-body" style="align-items:stretch">
        <div class="pl-board-left">
          <div class="pl-date">${h(koreanDate(key))}</div>
          <div class="clk num">${clock.hm}</div>
          <div class="nx">${nx ? `<div style="font-size:15px;opacity:.8">다음 종${nxDay(nx)}</div>
              <div class="num" style="font-size:clamp(28px,4vw,46px);font-weight:900"><b>${h(nx.time)}</b></div>
              <div style="font-size:clamp(18px,2.4vw,26px);font-weight:700">${h(nx.label || '종')}</div>
              <div style="font-size:16px;opacity:.85">${fmtLeft(nx.at - n)} 남음</div>`
            : '<div style="font-size:20px;font-weight:700">앞으로 7일 동안 울릴 종이 없어요</div>'}</div>
        </div>
        <div class="pl-board-list">
          <div class="row between" style="padding:6px 14px 8px"><b style="font-size:clamp(15px,1.8vw,20px)">${day.tt ? h(day.tt.name) : '오늘은 종 없음'}</b><span class="small muted">오늘 종 ${list.length}개</span></div>
          ${rows.length ? rows.map(b => `<div class="r ${b.at <= n ? 'past' : ''} ${nx && b === list[ni] ? 'next' : ''}"><span class="cdot" style="background:${bellColor(b).c}"></span><b class="num">${h(b.time)}</b><span class="grow" style="min-width:0">${h(b.label || '종')}${b.say ? ` <span class="s">"${h(b.say)}"</span>` : ''}</span></div>`).join('')
            : '<div class="muted" style="padding:20px 14px;font-size:18px">오늘은 울릴 종이 없어요. 다음 종은 왼쪽에 보여요.</div>'}
          ${list.length > from + 12 ? `<div class="small muted" style="padding:6px 14px">그 뒤로 ${list.length - from - 12}개 더</div>` : ''}
        </div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'big') {
    const sec = Number(clock.s) || 0;
    el.className = 'pl big';
    el.innerHTML = `${head}
      <div class="pl-big-wrap">
        <div style="font-size:clamp(16px,2.4vw,26px);color:var(--on-ink-2)">${h(koreanDate(key))}</div>
        <div class="clk num">${clock.hm}</div>
        <div class="sec" aria-hidden="true"><div style="width:${((sec + 1) / 60 * 100).toFixed(1)}%"></div></div>
        <div class="nx">${nx ? `다음 종 <b class="num">${h(nx.time)}</b> ${h(nx.label || '종')} · ${fmtLeft(nx.at - n)} 남음${nxDay(nx)}` : '앞으로 7일 동안 울릴 종이 없어요'}</div>
      </div>${foot}`;
    return applyShift();
  }
  if (mode === 'period') {
    const list = day.bells;
    const prev = list.filter(b => b.at <= n).pop();
    const todayNext = list.find(b => b.at > n);
    let name, sub;
    if (!list.length) { name = '오늘은 종 없음'; sub = nx ? `다음 종 · ${koreanDate(nx.dateKey)} ${nx.time}` : ''; }
    else if (!prev) { name = '시작 전'; sub = `${todayNext.time}에 ${todayNext.label || '첫 종'}`; }
    else if (!todayNext) { name = '오늘 일과 끝'; sub = `마지막 종 ${prev.time} ${prev.label || ''}`; }
    else {
      const L = prev.label || '';
      if (/시작\s*$/.test(L)) name = L.replace(/\s*시작\s*$/, '');
      else if (L.includes('·')) name = L.split('·').pop().trim();
      else if (/끝\s*$/.test(L)) name = '쉬는 시간';
      else name = L || '진행 중';
      sub = `${prev.time} ~ ${todayNext.time}`;
    }
    const pct = prev && todayNext ? Math.max(0, Math.min(1, (n - prev.at) / (todayNext.at - prev.at))) : (prev ? 1 : 0);
    const ups = list.filter(b => b.at > n).slice(1, 5);
    el.className = 'pl period';
    el.innerHTML = `${head}
      <div class="pl-period">
        <div class="now">${h(koreanDate(key))}${day.tt ? ` · ${h(day.tt.name)}` : ''} · 지금은</div>
        <div class="name">${h(name)}</div>
        ${prev && todayNext ? `<div class="track" role="progressbar" aria-valuenow="${Math.round(pct * 100)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${(pct * 100).toFixed(1)}%"></div></div>
          <div class="ends num"><span>${h(prev.time)}</span><span>${h(todayNext.time)}</span></div>` : (sub ? `<div class="ends"><span>${h(sub)}</span></div>` : '')}
        ${todayNext ? `<div class="left"><b class="num">${fmtLeft(todayNext.at - n)}</b> 남음 · 다음 ${h(todayNext.label || '종')}</div>` : (nx ? `<div class="left">다음 종 <b class="num">${h(nx.time)}</b>${nxDay(nx)}</div>` : '')}
        ${ups.length ? `<div class="chips2">${ups.map(b => `<span><b class="num">${h(b.time)}</b> ${h(b.label || '종')}</span>`).join('')}</div>` : ''}
      </div>${foot}`;
    return applyShift();
  }

  if (mode === 'dark') {
    const prev = day.bells.filter(b => b.at <= n).pop();
    let pct = 0;
    if (nx) {
      const start = prev ? prev.at : Math.max(nx.at - 3600000, n - 1);
      pct = Math.max(0, Math.min(1, (n - start) / (nx.at - start)));
    }
    const C = 2 * Math.PI * 150;
    el.className = 'pl dark';
    el.innerHTML = `${head}
      <div class="pl-body" style="justify-content:center">
        <div class="pl-ring"><svg viewBox="0 0 340 340" aria-hidden="true"><circle cx="170" cy="170" r="150" fill="none" stroke="#24302B" stroke-width="14"/>
          <circle cx="170" cy="170" r="150" fill="none" stroke="#E0B25A" stroke-width="14" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - pct)).toFixed(1)}"/></svg>
          <div class="mid"><div style="font-size:16px;color:#C9D1CC">다음 종까지</div><div class="remain num">${nx ? fmtRemain(nx.at - n) : '—'}</div></div></div>
        <div class="stack" style="max-width:420px">
          ${nx ? `<div class="bold num" style="color:#E0B25A;font-size:18px">${h(nx.time)}${nx.dateKey !== key ? ` · ${h(koreanDate(nx.dateKey))}` : ''}</div>
            <div style="font-size:clamp(28px,4.5vw,44px);font-weight:900;letter-spacing:-0.02em">${h(nx.label || '종')}</div>
            <div style="font-size:18px;color:#C9D1CC">${h(isBuiltin(nx.soundId) ? builtinName(nx.soundId) : ((soundsById()[nx.soundId] || {}).name || ''))}</div>
            ${next[1] ? `<div style="height:1px;background:#24302B;margin:10px 0"></div><div style="font-size:16px;color:#C9D1CC">그다음 · ${h(next[1].time)} ${h(next[1].label || '')}</div>` : ''}`
          : '<div style="font-size:24px;font-weight:700">앞으로 7일 동안 울릴 종이 없어요</div>'}
        </div>
      </div>${foot}`;
  } else {
    el.className = 'pl light';
    el.innerHTML = `${head}
      <div class="pl-body">
        <div class="stack" style="flex:1.25;gap:8px">
          <div class="pl-date">${h(koreanDate(key))}${day.tt ? ` · ${h(day.tt.name)}` : ' · 오늘은 종 없음'}</div>
          <div class="pl-clock num">${clock.hm}<small>:${clock.s}</small></div>
        </div>
        <div class="pl-next">
          <div class="bold brass">다음 종</div>
          ${nx ? `<div class="row" style="align-items:baseline;gap:12px;flex-wrap:wrap"><div class="big num">${h(nx.time)}</div><div class="lab">${h(nx.label || '종')}</div></div>
            <div style="font-size:18px;color:var(--ink-2);margin-bottom:8px">${fmtLeft(nx.at - n)} 남음${nx.dateKey !== key ? ` · ${h(koreanDate(nx.dateKey))}` : ''}</div>
            ${next.slice(1, 4).map(b => `<div class="pl-up"><b class="num">${h(b.time)}</b><span class="ellipsis">${h(b.label || '종')}${b.dateKey !== key ? ` <span class="muted small">(${h(koreanDate(b.dateKey))})</span>` : ''}</span></div>`).join('')}`
          : '<div class="lab">앞으로 7일 동안 울릴 종이 없어요</div>'}
        </div>
      </div>${foot}`;
  }
  applyShift();
}

// ── 설정 메뉴 ─────────────────────────────────────
function openMenu() {
  if (isLocked()) return openPin('menu');
  gate.classList.remove('hidden');
  gate.classList.add('full');
  gate.dataset.kind = 'menu';
  drawMenu();
  mountPreview();
}
function closeMenu() {
  gate.classList.add('hidden'); gate.classList.remove('full'); gate.dataset.kind = '';
  P.pv = null; draw();
}
const SAMPLE_Z = { h: 10, mi: 9, s: 32, y: 2026, m: 10, d: 23, dow: 5 };
function drawMenu() {
  const o = P.opt;
  const pvSize = P.pvSize || 'tv';
  const mainHtml = `<section class="set-card wide"><h4>화면 모양</h4>
          <div class="style-grid">${PLAYER_STYLES.map(s => `<button class="${P.mode === s.id ? 'on' : ''}" data-pl="mode" data-v="${s.id}" data-pv="mode" aria-pressed="${P.mode === s.id}"><span class="mini pv-${s.id}"></span><b>${h(s.name)}</b><span class="muted">${h(s.desc)}</span></button>`).join('')}</div>
        </section>
        <section class="set-card"><h4>시계판 디자인 <span class="tiny muted">F·G·K 아날로그 화면</span></h4>
          <div class="dial-grid">${DIALS.map(d => `<button class="${o.dial === d.id ? 'on' : ''}" data-pl="dial" data-v="${d.id}" data-pv="dial"><span class="dial-mini">${analogSvg(SAMPLE_Z, false, d.id)}</span><b>${h(d.name)}</b><span class="muted tiny">${h(d.desc)}</span></button>`).join('')}</div>
        </section>
        <section class="set-card"><h4>아날로그 배경 <span class="tiny muted">F·K 화면</span></h4>
          <div class="sw-grid">${ABGS.map(b => `<button class="${(o.abg || 'plain') === b.id ? 'on' : ''}" data-pl="opt" data-k="abg" data-v="${b.id}" data-pv="abg"><span class="sw abg-${b.id}"></span><span class="tiny">${h(b.name)}</span></button>`).join('')}</div>
        </section>
        <section class="set-card wide"><h4>수묵화 그림 <span class="tiny muted">L 화면</span></h4>
          <div class="art-grid">${INK_ARTS.map(a => `<button class="${(o.art || 'auto') === a.id ? 'on' : ''}" data-pl="opt" data-k="art" data-v="${a.id}" data-pv="art">${a.id === 'auto' ? '<span class="art-mini auto">↻</span>' : `<span class="art-mini">${inkArt(a.id)}</span>`}<span class="tiny">${h(a.name)}</span></button>`).join('')}</div>
        </section>
        <section class="set-card"><h4>디지털 모양 <span class="tiny muted">M 화면</span></h4>
          <div class="dg-grid">${DIGI_STYLES.map(d => `<button class="${(o.digi || 'led') === d.id ? 'on' : ''}" data-pl="opt" data-k="digi" data-v="${d.id}" data-pv="digi"><span class="dg-mini dg-${d.id}">${digitalSvg(d.id, '10:09', 32)}</span><span class="tiny">${h(d.name)}</span></button>`).join('')}</div>
        </section>
        <section class="set-card"><h4>한글 시계 모양 <span class="tiny muted">N 화면 · 글씨체도 함께 골라 보세요</span></h4>
          <div class="chips wrap">${HG_STYLES.map(x => `<button class="chip ${(o.hg || 'gold') === x.id ? 'on' : ''}" data-pl="opt" data-k="hg" data-v="${x.id}" data-pv="hg">${h(x.name)}</button>`).join('')}</div>
        </section>
        <section class="set-card wide"><h4>글씨체</h4>
          <div class="font-grid">${FONTS.map(f => { loadFont(f.id); return `<button class="${o.font === f.id ? 'on' : ''}" data-pl="font" data-v="${f.id}" data-pv="font"><span class="fs" style="font-family:${f.css.replace(/"/g, "'")}">열 시 구 분</span><span class="muted tiny">${h(f.name)}</span></button>`; }).join('')}</div>
        </section>
        <section class="set-card"><h4>화면 보호 (모니터가 타지 않게)</h4>
          <div class="chips wrap"><button class="chip ${o.saver === 'night' ? 'on' : ''}" data-pl="saver" data-v="night">수업 없을 때 화면 보호</button>
            <button class="chip ${o.saver === 'off' ? 'on' : ''}" data-pl="saver" data-v="off">항상 고른 화면</button></div>
          <div class="chips wrap">${[[0, '화면 그대로'], [15, '15분마다 바꾸기'], [30, '30분마다'], [60, '1시간마다']].map(([v, t]) => `<button class="chip ${o.cycle === v ? 'on' : ''}" data-pl="cycle" data-v="${v}">${t}</button>`).join('')}</div>
          <div class="tiny muted">수업 없을 때 화면 보호: 첫 종 30분 전 ~ 마지막 종 15분 뒤가 아니면 J 화면 보호로 바뀌어요. 1분마다 화면이 몇 픽셀씩 움직이는 기능은 항상 켜져 있어요.</div>
        </section>
        <section class="set-card"><h4>소리</h4>
          <label class="field"><span class="small bold">재생기 음량 <span id="pl-vol-lab">${o.vol}%</span></span><input type="range" id="pl-vol" min="10" max="100" step="5" value="${o.vol}"></label>
          <label class="field"><span class="small bold">기기 음성 (Google 음성을 안 쓸 때 안내 문구를 읽는 목소리)</span>
            <select class="input" id="pl-voice">${(() => { const pref = getDeviceVoicePref(); const vs = deviceVoices();
              return vs.length ? vs.map(v => `<option value="${h(v.voiceURI)}" ${pref.uri === v.voiceURI ? 'selected' : ''}>${h(v.name)}</option>`).join('') : '<option value="">기본 목소리</option>'; })()}</select></label>
          <div class="row"><span class="small">속도</span><input type="range" id="pl-rate" min="0.7" max="1.3" step="0.1" value="${getDeviceVoicePref().rate}" class="grow"><button class="btn" data-pl="voice-test">들어보기</button></div>
          <button class="btn block" data-pl="test">소리 시험</button>
        </section>
        <section class="set-card"><h4>이 기기</h4>
          <button class="btn block" data-pl="fullscreen">전체 화면으로 보기</button>
          <div class="tiny muted">벨키퍼 ${APP_VERSION}${P.update && P.update.isNew ? ` (새 버전 ${P.update.latest} 있음)` : ' (최신)'} · 기기 시계 오차 ${(Math.abs(P.offset) / 1000).toFixed(1)}초 보정 중 · ${P.locked ? '잠금 켜짐' : '잠금 꺼짐 (관리자 화면에서 켤 수 있어요)'}</div>
          <button class="btn block danger" data-pl="unlink">이 기기 연결 해제</button>
        </section>`;
  const page = gate.querySelector('.set-page');
  if (page) {
    // 미리 보기 창은 그대로 두고 설정 칸만 다시 그림 (깜빡임 없이)
    const m = page.querySelector('.set-main'), st = m.scrollTop;
    m.innerHTML = mainHtml; m.scrollTop = st;
    page.querySelectorAll('[data-pl="pvsize"]').forEach(b => b.classList.toggle('on', b.dataset.v === pvSize));
    const box = page.querySelector('.pv-box'); if (box) box.className = `pv-box ${pvSize}`;
    pokePreview();
    return;
  }
  gate.innerHTML = `<div class="set-page">
    <header class="set-head">
      <button class="btn" data-pl="close">← 재생 화면으로</button>
      <div class="grow"><div class="bold" style="font-size:18px">재생기 설정</div><div class="tiny muted">고르면 바로 저장돼요</div></div>
      <button class="btn gold" data-pl="close">저장하고 돌아가기</button>
    </header>
    <div class="set-body">
      <aside class="set-pv">
        <div class="row between"><div class="bold">미리 보기</div>
          <div class="seg">${[['tv', 'TV·PC'], ['tab', '태블릿'], ['phone', '세로 폰']].map(([k, t]) => `<button class="${pvSize === k ? 'on' : ''}" data-pl="pvsize" data-v="${k}">${t}</button>`).join('')}</div></div>
        <div class="pv-box ${pvSize}"><iframe id="pv-frame" title="재생기 미리 보기" src="play.html?preview=1" tabindex="-1"></iframe></div>
        <div class="tiny muted">버튼에 마우스를 올리면 그 모양으로 미리 보여요. 실제 화면과 똑같이 그려요.</div>
      </aside>
      <div class="set-main">${mainHtml}</div>
    </div>
    <footer class="set-foot"><button class="btn gold block" data-pl="close">저장하고 재생 화면으로 돌아가기</button></footer>
  </div>`;
}
// 미리 보기: 같은 재생기 화면을 작은 창(iframe)에 실제 크기로 그리고 줄여서 보여 줌
const PV_SIZES = { tv: [1280, 720], tab: [1024, 768], phone: [390, 844] };
function mountPreview() {
  const box = gate.querySelector('.pv-box'), fr = document.getElementById('pv-frame');
  if (!box || !fr) return;
  const [w, hh] = PV_SIZES[P.pvSize || 'tv'];
  fr.style.width = w + 'px'; fr.style.height = hh + 'px';
  const fit = () => { const s = box.clientWidth / w; fr.style.transform = `scale(${s})`; box.style.height = (hh * s) + 'px'; };
  fit();
  if (P.pvRO) P.pvRO.disconnect();
  if (window.ResizeObserver) { P.pvRO = new ResizeObserver(fit); P.pvRO.observe(box); }
}
function pokePreview() { const fr = document.getElementById('pv-frame'); try { fr && fr.contentWindow.postMessage('bk-pv', location.origin); } catch (e) { /* 무시 */ } }
window.__bkPreviewState = () => {
  const pv = P.pv || {};
  return {
    space: P.space, saved: P.saved, timetables: P.timetables, rules: P.rules, groups: P.groups, group: P.group, sounds: P.sounds, offset: P.offset,
    mode: pv.mode || P.mode, opt: { ...P.opt, saver: 'off', cycle: 0, ...Object.fromEntries(Object.entries(pv).filter(([k]) => k !== 'mode')) }
  };
};
document.addEventListener('mouseover', e => {
  const b = e.target.closest && e.target.closest('[data-pv]');
  if (!b || gate.dataset.kind !== 'menu') return;
  P.pv = { [b.dataset.pv]: b.dataset.v }; pokePreview();
});
document.addEventListener('mouseout', e => {
  const b = e.target.closest && e.target.closest('[data-pv]');
  if (!b || (e.relatedTarget && b.contains(e.relatedTarget))) return;
  P.pv = null; pokePreview();
});

// ── 잠금 (비밀번호) ─────────────────────────────────────
let pinBuf = '', pinFails = 0, pinWaitUntil = 0, pinNext = '';
async function pinHashOf(pin) {
  const data = new TextEncoder().encode(`bellkeeper|${P.uid}|${pin}`);
  const d = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function openPin(nextAct, msg) {
  pinBuf = ''; pinNext = nextAct || '';
  gate.classList.remove('hidden');
  gate.classList.remove('full');
  gate.dataset.kind = 'pin';
  drawPin(msg);
}
function drawPin(msg) {
  const wait = Math.max(0, Math.ceil((pinWaitUntil - Date.now()) / 1000));
  gate.innerHTML = `<div class="card stack pinpad">
    <div class="center">${LOCK.replace('width="16" height="16"', 'width="34" height="34"')}</div>
    <div class="bold center" style="font-size:20px">잠긴 재생기</div>
    <div class="small muted center">${wait ? `${wait}초 뒤에 다시 넣어 주세요` : h(msg || '관리자가 정한 비밀번호를 넣어 주세요')}</div>
    <div class="pin-dots" aria-label="${pinBuf.length}자리 입력됨">${Array.from({ length: Math.max(4, pinBuf.length) }, (_, i) => `<span class="${i < pinBuf.length ? 'on' : ''}"></span>`).join('')}</div>
    <div class="pin-keys">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(k => `<button data-pl="pin" data-v="${k}" ${wait ? 'disabled' : ''} aria-label="${k === 'del' ? '지우기' : k === 'ok' ? '확인' : k}">${k === 'del' ? '지움' : k === 'ok' ? '확인' : k}</button>`).join('')}</div>
    <button class="btn block" data-pl="close">취소</button>
  </div>`;
}
async function pinKey(k) {
  if (Date.now() < pinWaitUntil) return drawPin();
  if (k === 'del') pinBuf = pinBuf.slice(0, -1);
  else if (k === 'ok') {
    if (pinBuf.length < 4) return drawPin('4자리 이상 넣어 주세요');
    const ok = (await pinHashOf(pinBuf)) === P.pinHash;
    pinBuf = '';
    if (!ok) {
      pinFails++;
      if (pinFails >= 5) { pinWaitUntil = Date.now() + 30000; pinFails = 0; setTimeout(() => { if (gate.dataset.kind === 'pin') drawPin(); }, 30500); }
      return drawPin('비밀번호가 달라요');
    }
    pinFails = 0;
    P.unlockedUntil = Date.now() + 3 * 60000;   // 3분 동안 풀림 → 저절로 다시 잠김
    gate.classList.add('hidden'); gate.dataset.kind = '';
    draw();
    if (pinNext === 'menu') openMenu();
    return;
  } else if (/^\d$/.test(k) && pinBuf.length < 8) pinBuf += k;
  drawPin();
}
window.addEventListener('beforeunload', e => {
  // 잠긴 재생기는 실수로 닫히지 않게 한 번 더 물어봄
  if (P.locked && !P.allowLeave && P.running) { e.preventDefault(); e.returnValue = ''; }
});
setInterval(() => { if (P.locked && P.unlockedUntil && Date.now() > P.unlockedUntil) { P.unlockedUntil = 0; if (gate.dataset.kind === 'menu') { gate.classList.add('hidden'); gate.dataset.kind = ''; } draw(); } }, 5000);

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-pl]');
  if (!b) return;
  const a = b.dataset.pl;
  if (a === 'unlock') return openPin('');
  if (a === 'relock') { P.unlockedUntil = 0; return draw(); }
  if (a === 'pin') return pinKey(b.dataset.v);
  if (a === 'saver') { P.opt.saver = b.dataset.v; saveOpt(); drawMenu(); mountPreview(); return; }
  if (a === 'cycle') { P.opt.cycle = Number(b.dataset.v); saveOpt(); drawMenu(); mountPreview(); return; }
  if (a === 'dial' || a === 'font') { P.opt[a] = b.dataset.v; saveOpt(); P.pv = null; drawMenu(); mountPreview(); return; }
  if (a === 'opt') { P.opt[b.dataset.k] = b.dataset.v; saveOpt(); P.pv = null; drawMenu(); mountPreview(); return; }
  if (a === 'pvsize') { P.pvSize = b.dataset.v; drawMenu(); mountPreview(); return; }
  if (isLocked() && ['test', 'menu', 'update', 'unlink', 'mode', 'fullscreen'].includes(a)) return openPin(a === 'menu' ? 'menu' : '');
  if (a === 'test') { await unlockAudio(); ring({ soundId: 'b:dingdong', label: '소리 시험', volume: 100 }); }
  if (a === 'voice-test') {
    const uri = document.getElementById('pl-voice').value, rate = Number(document.getElementById('pl-rate').value) || 1;
    setDeviceVoicePref(uri, rate);
    await unlockAudio();
    speak('안녕하세요. 벨키퍼 안내 방송입니다.', 100, { uri, rate });
  }
  if (a === 'menu') openMenu();
  if (a === 'update') {
    if (!confirm('새 버전으로 업데이트할까요? 업데이트 뒤 [재생 시작]을 한 번 눌러 주세요.')) return;
    P.allowLeave = true;
    return reloadToLatest();
  }
  if (a === 'close') {
    const v = document.getElementById('pl-voice'), r = document.getElementById('pl-rate');
    if (v) setDeviceVoicePref(v.value, Number(r.value) || 1);
    closeMenu();
  }
  if (a === 'mode') { P.mode = validMode(b.dataset.v); localStorage.setItem(LS_MODE, P.mode); P.pv = null; drawMenu(); mountPreview(); heartbeat(); }
  if (a === 'fullscreen') { closeMenu(); try { await document.documentElement.requestFullscreen(); } catch (err) { /* 무시 */ } }
  if (a === 'unlink') {
    if (!confirm('이 기기 연결을 해제할까요? 이 기기에서 더 이상 종이 울리지 않아요.')) return;
    try { await F.deleteDoc(myDoc()); } catch (err) { console.warn(err); }
    disconnected('연결을 해제했어요.');
  }
});

window.addEventListener('online', () => { refreshOffset(); draw(); });
window.addEventListener('offline', draw);

// ── 시작 ─────────────────────────────────────
if (!PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

watchUpdates(u => { P.update = u; draw(); }, 30 * 60 * 1000);
setInterval(tick, 250);
setInterval(() => { if (gate.classList.contains('hidden')) draw(); }, 1000);
setInterval(heartbeat, HEARTBEAT_MS);
setInterval(refreshOffset, OFFSET_EVERY);

if (PREVIEW) {
  // 설정 화면 안의 미리 보기 창: 부모 화면의 일정을 받아 그리기만 함 (소리·기록 없음)
  document.body.classList.add('preview');
  gate.classList.add('hidden'); el.classList.remove('hidden');
  const pull = () => {
    try {
      const s = window.parent && window.parent !== window && window.parent.__bkPreviewState && window.parent.__bkPreviewState();
      if (s && s.space) {
        Object.assign(P, { space: s.space, saved: s.saved || { name: '재생기' }, rules: s.rules || [], groups: s.groups || [], group: s.group || '', sounds: s.sounds || [], offset: s.offset || 0, offsetOk: true, mode: validMode(s.mode), opt: Object.assign({}, P.opt, s.opt) });
        P.timetables = (s.timetables || []).map(t => ({ ...t, bells: cleanBells(t.bells) }));
        P.upcoming = upcomingBells(now() - FIRE_WINDOW, P.rules, P.timetables, tz(), 7, ctx());
        P.running = true; P.started = true; P.wake = true;
      }
    } catch (e) { /* 무시 */ }
    draw();
  };
  window.addEventListener('message', e => { if (e.data === 'bk-pv') pull(); });
  setInterval(pull, 1000); pull();
} else if (!F.configured) {
  gate.classList.remove('hidden');
  gate.innerHTML = '<div class="card">Firebase 설정이 아직 없어요. js/firebase-config.js 를 먼저 채워주세요.</div>';
} else {
  F.onAuthStateChanged(F.auth, async user => {
    if (!user) {
      try { await F.signInAnonymously(F.auth); } catch (e) {
        console.error(e);
        gate.classList.remove('hidden');
        gate.innerHTML = '<div class="card stack"><b>시작하지 못했어요</b><div class="small muted">인터넷 연결을 확인하고 새로 고침해주세요. (Firebase에서 익명 로그인을 켰는지도 확인해주세요)</div></div>';
      }
      return;
    }
    P.uid = user.uid;
    P.saved = loadSaved();
    if (P.saved && P.saved.spaceId) startRunning();
    else showConnect();
  });
}

document.addEventListener('input', e => {
  if (e.target.id === 'pl-vol') { P.opt.vol = Number(e.target.value); saveOpt(); const l = document.getElementById('pl-vol-lab'); if (l) l.textContent = P.opt.vol + '%'; }
});
document.addEventListener('keydown', e => {
  if (gate.dataset.kind === 'pin' && !gate.classList.contains('hidden')) {
    if (/^\d$/.test(e.key)) pinKey(e.key); else if (e.key === 'Backspace') pinKey('del'); else if (e.key === 'Enter') pinKey('ok');
  }
});
