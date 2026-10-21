// 벨키퍼 재생기 — PC·태블릿에서 정해진 시간에 종을 울립니다.
import * as F from './fb.js';
import {
  APP_VERSION, todayKey, koreanDate, upcomingBells, bellsForDay, fmtRemain, fmtClock, escapeHtml as h, cleanBells
} from './core.js';
import { playBell, stopAll, unlockAudio, audioReady, preloadUrl, forgetUnused, builtinName, isBuiltin } from './sounds.js';

const el = document.getElementById('pl');
const gate = document.getElementById('gate');
const overlay = document.getElementById('ringing');
const LS_KEY = 'bk.player';
const LS_MODE = 'bk.player.mode';
const LS_FIRED = 'bk.player.fired';
const FIRE_WINDOW = 20000;     // 정각을 놓쳐도 20초 안이면 울림
const HEARTBEAT_MS = 60000;
const OFFSET_EVERY = 15 * 60000;

const P = {
  uid: null, saved: null, space: null, timetables: [], rules: [], sounds: [],
  offset: 0, offsetOk: false, running: false, unsub: [], seenCmd: null,
  mode: localStorage.getItem(LS_MODE) || 'light',
  upcoming: [], upcomingAt: 0, fromCache: false, wake: null, ringing: null, started: false
};
const now = () => Date.now() + P.offset;
const tz = () => (P.space && P.space.timezone) || 'Asia/Seoul';
const soundsById = () => Object.fromEntries(P.sounds.map(s => [s.id, s]));
const myDoc = () => F.doc(F.db, 'spaces', P.saved.spaceId, 'devices', P.uid);
const sub = n => F.collection(F.db, 'spaces', P.saved.spaceId, n);

const LOGO = '<svg viewBox="0 0 120 120" width="36" height="36" aria-hidden="true"><circle cx="60" cy="14" r="5" fill="currentColor"/><path d="M60 20 C40 20 28 36 28 58 L28 78 L18 90 L102 90 L92 78 L92 58 C92 36 80 20 60 20 Z" fill="currentColor"/><circle cx="60" cy="102" r="8" fill="#B07D1E"/></svg>';

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
  document.getElementById('gate-go').onclick = async () => {
    await unlockAudio();
    await keepAwake();
    try { if (document.documentElement.requestFullscreen && matchMedia('(pointer:coarse)').matches) await document.documentElement.requestFullscreen(); } catch (e) { /* 무시 */ }
    gate.classList.add('hidden');
    P.started = true;
    heartbeat();
    draw();
  };
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
  gate.classList.add('hidden');
  el.classList.remove('hidden');
  const onErr = e => {
    if (e && e.code === 'permission-denied') { console.warn('연결이 해제되었어요'); disconnected(); return; }
    console.error(e);
  };
  P.unsub.push(F.onSnapshot(myDoc(), d => { if (!d.exists() && !d.metadata.fromCache) disconnected(); }, onErr));
  P.unsub.push(F.onSnapshot(F.doc(F.db, 'spaces', P.saved.spaceId), d => {
    if (d.exists()) { P.space = { id: d.id, ...d.data() }; P.fromCache = d.metadata.fromCache; recompute(); }
  }, onErr));
  P.unsub.push(F.onSnapshot(sub('timetables'), q => { P.timetables = q.docs.map(d => ({ id: d.id, ...d.data(), bells: cleanBells(d.data().bells) })); recompute(); }, onErr));
  P.unsub.push(F.onSnapshot(sub('rules'), q => { P.rules = q.docs.map(d => ({ id: d.id, ...d.data() })); recompute(); }, onErr));
  P.unsub.push(F.onSnapshot(sub('sounds'), q => { P.sounds = q.docs.map(d => ({ id: d.id, ...d.data() })); recompute(); }, onErr));
  P.unsub.push(F.onSnapshot(F.query(sub('commands'), F.orderBy('createdAt', 'desc'), F.limit(10)), q => {
    if (P.seenCmd === null) P.seenCmd = new Set();
    for (const ch of q.docChanges()) {
      if (ch.type !== 'added' || P.seenCmd.has(ch.doc.id)) continue;
      P.seenCmd.add(ch.doc.id);
      const c = ch.doc.data();
      const at = c.createdAt && c.createdAt.toMillis ? c.createdAt.toMillis() : now();
      // 이 화면을 켜기 전에 보낸 명령과 2분 넘게 지난 명령은 무시
      if (at < P.listenSince || now() - at > 120000) continue;
      if (c.target && c.target !== P.uid) continue;
      if (c.type === 'stop') { stopAll(); hideRinging(); }
      if (c.type === 'ring') ring({ soundId: c.soundId, say: c.say || '', label: c.label || '지금 울리기', volume: 100 });
    }
  }, onErr));
  refreshOffset();
  showGate();
}

async function refreshOffset() {
  if (!P.saved) return;
  try {
    const r = await Promise.race([F.measureServerOffset(myDoc()), new Promise(res => setTimeout(() => res(null), 8000))]);
    if (r && r.rtt < 4000) { P.offset = r.offset; P.offsetOk = true; }
  } catch (e) { console.warn(e); }
}

function recompute() {
  if (!P.space) return;
  const n = now();
  P.upcoming = upcomingBells(n - FIRE_WINDOW, P.rules, P.timetables, tz(), 7);
  P.upcomingAt = n;
  // 앞으로 이틀 동안 쓸 파일은 미리 불러 두기
  const keep = new Set();
  const byId = soundsById();
  for (const b of P.upcoming) {
    if (b.at - n > 2 * 86400000) break;
    if (!isBuiltin(b.soundId) && byId[b.soundId] && byId[b.soundId].url) { keep.add(byId[b.soundId].url); preloadUrl(byId[b.soundId].url); }
  }
  forgetUnused(keep);
  draw();
}

async function heartbeat() {
  if (!P.saved || !P.running) return;
  const next = P.upcoming.find(b => b.at > now());
  try {
    await F.updateDoc(myDoc(), {
      lastSeen: F.serverTimestamp(),
      status: audioReady() ? 'ready' : 'waiting',
      nextLabel: next ? `${next.time} ${next.label || '종'}`.slice(0, 60) : '',
      offsetMs: Math.round(P.offset),
      ua: navigator.userAgent.slice(0, 160),
      version: APP_VERSION,
      mode: P.mode
    });
  } catch (e) { console.warn(e); }
}

// ── 종 울리기 ─────────────────────────────────────
function ring(b) {
  showRinging(b);
  const ctl = playBell(b, soundsById());
  P.ringing = ctl;
  ctl.finished.then(() => { if (P.ringing === ctl) { P.ringing = null; hideRinging(); } });
}
function showRinging(b) {
  overlay.classList.remove('hidden');
  overlay.innerHTML = `<svg class="ring-pulse" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#E0B25A" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/></svg>
    <div class="lab">${h(b.label || '종')}</div>
    <div style="font-size:20px;color:#C9D1CC">${h(b.time || '')} ${h(isBuiltin(b.soundId) ? builtinName(b.soundId) : ((soundsById()[b.soundId] || {}).name || ''))}</div>
    ${b.say ? `<div style="font-size:20px">"${h(b.say)}"</div>` : ''}
    <button class="btn lg" id="ring-stop" style="background:transparent;color:#F4F5F2;border-color:#3A4842">소리 멈추기</button>`;
  document.getElementById('ring-stop').onclick = () => { stopAll(); hideRinging(); };
}
function hideRinging() { overlay.classList.add('hidden'); overlay.innerHTML = ''; }

function tick() {
  if (!P.running || !P.space) return;
  const n = now();
  if (n - P.upcomingAt > 60000) recompute();
  const fired = firedSet();
  for (const b of P.upcoming) {
    if (b.at > n) break;
    if (n - b.at > FIRE_WINDOW || fired[b.key]) continue;
    markFired(b.key);
    if (P.started) ring(b);
  }
}

// ── 화면 그리기 ─────────────────────────────────────
function draw() {
  if (!P.running || !P.space) return;
  const n = now();
  const key = todayKey(n, tz());
  const clock = fmtClock(n, tz());
  const next = P.upcoming.filter(b => b.at > n);
  const nx = next[0];
  const day = bellsForDay(key, P.rules, P.timetables, tz());
  const online = navigator.onLine && !P.fromCache;
  const checks = [
    [P.offsetOk, P.offsetOk ? '서버 시간 기준' : '기기 시계 기준'],
    [true, '7일 일정 저장됨'],
    [!!P.wake || !('wakeLock' in navigator), P.wake ? '화면 켜짐 유지' : (('wakeLock' in navigator) ? '화면 켜짐 유지 안 됨' : '화면 꺼짐을 "안 함"으로')],
    [audioReady(), audioReady() ? '소리 준비됨' : '소리 대기']
  ];
  const ck = ok => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${ok ? (P.mode === 'dark' ? '#4CC28A' : '#2F6B4F') : '#A23B2A'}" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">${ok ? '<path d="M5 12l5 5 9-10"/>' : '<path d="M12 7v6M12 17v.5"/>'}</svg>`;
  const foot = `<div class="pl-foot">
      ${online ? '' : '<span class="pl-offline">인터넷 끊김 · 저장된 일정으로 울려요</span>'}
      ${checks.map(([ok, t]) => `<span class="row" style="gap:6px">${ck(ok)}${h(t)}</span>`).join('')}
      <span class="grow"></span>
      <button class="btn" data-pl="test">소리 시험</button>
      <button class="btn" data-pl="menu">설정</button>
    </div>`;
  const head = `<div class="pl-top"><div class="row pl-name">${LOGO}<span class="ellipsis">${h(P.space.name)} · ${h(P.saved.name || '재생기')}</span></div>
      ${P.mode === 'dark' ? `<div class="bold num" style="font-size:22px">${clock.hm}</div>` : `<div class="row status-ok" style="gap:8px"><span class="dot ok"></span>재생 중</div>`}</div>`;

  if (P.mode === 'dark') {
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
            <div style="font-size:18px;color:var(--ink-2);margin-bottom:8px">${fmtRemain(nx.at - n)} 남음${nx.dateKey !== key ? ` · ${h(koreanDate(nx.dateKey))}` : ''}</div>
            ${next.slice(1, 4).map(b => `<div class="pl-up"><b class="num">${h(b.time)}</b><span class="ellipsis">${h(b.label || '종')}${b.dateKey !== key ? ` <span class="muted small">(${h(koreanDate(b.dateKey))})</span>` : ''}</span></div>`).join('')}`
          : '<div class="lab">앞으로 7일 동안 울릴 종이 없어요</div>'}
        </div>
      </div>${foot}`;
  }
}

// ── 설정 메뉴 ─────────────────────────────────────
function openMenu() {
  gate.classList.remove('hidden');
  gate.innerHTML = `<div class="card stack">
    <div class="bold" style="font-size:18px">재생기 설정</div>
    <div class="chips"><button class="chip ${P.mode === 'light' ? 'on' : ''}" data-pl="mode" data-v="light">시계형 (밝게)</button>
      <button class="chip ${P.mode === 'dark' ? 'on' : ''}" data-pl="mode" data-v="dark">카운트다운형 (어둡게)</button></div>
    <button class="btn block" data-pl="fullscreen">전체 화면</button>
    <button class="btn block" data-pl="test">소리 시험</button>
    <div class="tiny muted">벨키퍼 ${APP_VERSION} · 기기 시계 오차 ${(Math.abs(P.offset) / 1000).toFixed(1)}초 보정 중</div>
    <button class="btn block danger" data-pl="unlink">이 기기 연결 해제</button>
    <button class="btn primary block" data-pl="close">닫기</button>
  </div>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-pl]');
  if (!b) return;
  const a = b.dataset.pl;
  if (a === 'test') { await unlockAudio(); ring({ soundId: 'b:dingdong', label: '소리 시험', volume: 100 }); }
  if (a === 'menu') openMenu();
  if (a === 'close') { gate.classList.add('hidden'); draw(); }
  if (a === 'mode') { P.mode = b.dataset.v; localStorage.setItem(LS_MODE, P.mode); openMenu(); draw(); heartbeat(); }
  if (a === 'fullscreen') { try { await document.documentElement.requestFullscreen(); } catch (err) { /* 무시 */ } gate.classList.add('hidden'); }
  if (a === 'unlink') {
    if (!confirm('이 기기 연결을 해제할까요? 이 기기에서 더 이상 종이 울리지 않아요.')) return;
    try { await F.deleteDoc(myDoc()); } catch (err) { console.warn(err); }
    disconnected('연결을 해제했어요.');
  }
});

window.addEventListener('online', () => { refreshOffset(); draw(); });
window.addEventListener('offline', draw);

// ── 시작 ─────────────────────────────────────
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

setInterval(tick, 250);
setInterval(() => { if (gate.classList.contains('hidden')) draw(); }, 1000);
setInterval(heartbeat, HEARTBEAT_MS);
setInterval(refreshOffset, OFFSET_EVERY);

if (!F.configured) {
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
